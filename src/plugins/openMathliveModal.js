/**
 * openMathliveModal.js
 *
 * Handles the MathLive modal UI and insertion logic for CKEditor 5.
 * Mirrors the CKEditor 4 plugin behaviour:
 *   - New equation  → insert as <img> (image mode)
 *   - Edit existing → update <span class="math-inline" data-latex="..."> (inline mode)
 */

import { MathfieldElement } from 'mathlive';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';

// Ensure MathLive can find its fonts locally rather than failing to load from CDN
MathfieldElement.fontsDirectory = '/mathlive/fonts';
MathfieldElement.soundsDirectory = null;

/**
 * @param {import('@ckeditor/ckeditor5-core').Editor} editor
 * @param {{ domElement: HTMLElement, latex: string } | null} existingData
 *   Pass null to insert a new equation.
 *   Pass { domElement, latex } to edit an existing inline-math span.
 */
export function openMathliveModal(editor, existingData) {
  // Prevent duplicate modals
  if (document.getElementById('cke5-mathlive-overlay')) return;

  const isEditMode = !!existingData;
  const initialLatex = existingData?.latex ?? '';

  const themeMode = localStorage.getItem("themeMode") || "light";
  const isDark = themeMode === "dark";

  // ── Build overlay & modal ──────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'cke5-mathlive-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999;
    animation: cke5MlFadeIn 0.3s ease-out forwards;
  `;

  overlay.innerHTML = `
    <style>
      :root {
        --keyboard-zindex: 100000;
      }
      math-virtual-keyboard {
        z-index: 100000 !important;
      }
      @keyframes cke5MlFadeIn {
        from { opacity: 0; backdrop-filter: blur(0px); }
        to   { opacity: 1; backdrop-filter: blur(4px); }
      }
      @keyframes modalScaleIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      #cke5-mathlive-modal {
        --modal-bg: #ffffff;
        --modal-text: #1e293b;
        --modal-border: #f1f5f9;
        --modal-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05);
        --input-bg: #f8fafc;
        --input-border: #e2e8f0;
        --input-text: #0f172a;
        --latex-bg: #1e293b;
        --latex-text: #f8fafc;
        --btn-cancel-bg: #ffffff;
        --btn-cancel-text: #64748b;
        --btn-cancel-border: #e2e8f0;
        --btn-cancel-hover-bg: #f8fafc;
        --btn-cancel-hover-text: #0f172a;
        --label-text: #64748b;

        background: var(--modal-bg);
        padding: 28px 32px;
        border-radius: 16px;
        box-shadow: var(--modal-shadow);
        min-width: min(720px, 90vw);
        max-width: 95vw;
        display: flex;
        flex-direction: column;
        gap: 20px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        animation: modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        overflow: visible;
      }
      
      #cke5-mathlive-modal.cke5-mathlive-dark {
        --modal-bg: #1e293b;
        --modal-text: #f8fafc;
        --modal-border: #334155;
        --modal-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05);
        --input-bg: #0f172a;
        --input-border: #334155;
        --input-text: #f8fafc;
        --latex-bg: #0f172a;
        --latex-text: #f8fafc;
        --btn-cancel-bg: #1e293b;
        --btn-cancel-text: #cbd5e1;
        --btn-cancel-border: #475569;
        --btn-cancel-hover-bg: #334155;
        --btn-cancel-hover-text: #f8fafc;
        --label-text: #94a3b8;
      }

      #cke5-mathlive-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--modal-border);
        padding-bottom: 16px;
        margin-bottom: 4px;
      }
      #cke5-mathlive-modal h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--modal-text);
      }
      .cke5-input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }
      .cke5-input-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--label-text);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      #cke5-mf {
        font-family: 'KaTeX_Main', serif;
        font-size: 1.5em;
        border: 2px solid var(--input-border);
        border-radius: 10px;
        padding: 14px 16px;
        background: var(--input-bg);
        min-height: 64px;
        width: 100%;
        box-sizing: border-box;
        transition: all 0.2s ease;
        color: var(--input-text);
      }
      #cke5-mf:focus-within {
        outline: none;
        border-color: #3b82f6;
        background: var(--modal-bg);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }
      #cke5-latex-area {
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        font-size: 0.95em;
        border: 2px solid var(--input-border);
        border-radius: 10px;
        padding: 14px 16px;
        background: var(--latex-bg);
        color: var(--latex-text);
        resize: vertical;
        min-height: 80px;
        width: 100%;
        box-sizing: border-box;
        transition: all 0.2s ease;
        line-height: 1.5;
      }
      #cke5-latex-area:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }
      #cke5-ml-buttonbar {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        align-items: center;
        margin-top: 8px;
        padding-top: 16px;
        border-top: 1px solid var(--modal-border);
      }
      #cke5-ml-buttonbar button {
        padding: 10px 24px;
        font-size: 0.95em;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #cke5-ml-close {
        background: var(--btn-cancel-bg);
        color: var(--btn-cancel-text);
        border: 1px solid var(--btn-cancel-border);
      }
      #cke5-ml-close:hover  { 
        background: var(--btn-cancel-hover-bg); 
        color: var(--btn-cancel-hover-text);
        border-color: var(--btn-cancel-border);
      }
      #cke5-ml-insert {
        background: linear-gradient(135deg, #9a3e76 0%, #b16c96 55%, #cca4cc 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(154, 62, 118, 0.35);
        border: none;
      }
      #cke5-ml-insert:hover {
        background: linear-gradient(135deg, #7e3262 0%, #9a3e76 55%, #b16c96 100%);
        box-shadow: 0 4px 14px rgba(154, 62, 118, 0.5);
        transform: translateY(-1px);
      }
      #cke5-ml-insert:active {
        background: linear-gradient(135deg, #6b2952 0%, #7e3262 100%);
        transform: translateY(0);
      }
      #cke5-ml-insert:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      #cke5-ml-status {
        font-size: 0.85em;
        color: #ef4444;
        flex-grow: 1;
        font-weight: 500;
        text-align: left;
      }
      /* ── Insert-mode toggle ── */
      #cke5-ml-mode-toggle {
        display: flex;
        gap: 0;
        background: linear-gradient(135deg, #d4a0bc22 0%, #9a3e7622 100%);
        border: 1.5px solid #b16c9688;
        border-radius: 10px;
        padding: 4px;
        width: fit-content;
        box-shadow: inset 0 1px 3px rgba(154, 62, 118, 0.08);
      }
      .ml-mode-btn {
        padding: 6px 16px;
        font-size: 0.85em;
        font-weight: 700;
        border: none;
        border-radius: 7px;
        cursor: pointer;
        background: transparent;
        color: #b16c96;
        transition: all 0.22s cubic-bezier(.4,0,.2,1);
        white-space: nowrap;
        letter-spacing: 0.3px;
      }
      .ml-mode-btn:hover:not(.active) {
        background: rgba(177, 108, 150, 0.12);
        color: #9a3e76;
      }
      .ml-mode-btn.active {
        background: linear-gradient(135deg, #9a3e76 0%, #cca4cc 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(154, 62, 118, 0.45);
        text-shadow: 0 1px 2px rgba(0,0,0,0.18);
      }
      /* ── Dark mode overrides for brand-color buttons ── */
      .cke5-mathlive-dark #cke5-ml-mode-toggle {
        background: linear-gradient(135deg, #7c6aff18 0%, #9e8fff18 100%);
        border-color: #7c6aff66;
        box-shadow: inset 0 1px 3px rgba(124, 106, 255, 0.08);
      }
      .cke5-mathlive-dark .ml-mode-btn {
        color: #a89fff;
      }
      .cke5-mathlive-dark .ml-mode-btn:hover:not(.active) {
        background: rgba(124, 106, 255, 0.14);
        color: #c4baff;
      }
      .cke5-mathlive-dark .ml-mode-btn.active {
        background: linear-gradient(135deg, #7c6aff 0%, #9e8fff 100%);
        color: #fff;
        box-shadow: 0 2px 10px rgba(124, 106, 255, 0.5);
        text-shadow: 0 1px 2px rgba(0,0,0,0.25);
      }
      .cke5-mathlive-dark #cke5-ml-insert {
        background: linear-gradient(135deg, #7c6aff 0%, #9e8fff 100%);
        box-shadow: 0 2px 10px rgba(124, 106, 255, 0.4);
      }
      .cke5-mathlive-dark #cke5-ml-insert:hover {
        background: linear-gradient(135deg, #6455e0 0%, #7c6aff 100%);
        box-shadow: 0 4px 16px rgba(124, 106, 255, 0.55);
      }
      .cke5-mathlive-dark #cke5-ml-insert:active {
        background: linear-gradient(135deg, #5547c4 0%, #6455e0 100%);
      }
    </style>

    <div id="cke5-mathlive-modal" class="${isDark ? 'cke5-mathlive-dark' : ''}">
      <div id="cke5-mathlive-modal-header">
        <h3>${isEditMode ? 'Edit Equation' : 'Insert Equation'}</h3>
        <div id="cke5-ml-mode-toggle">
          <button class="ml-mode-btn" data-mode="image">🖼 Image</button>
          <button class="ml-mode-btn active" data-mode="latex">𝑓 LaTeX</button>
        </div>
      </div>

      <div class="cke5-input-group">
        <label>Visual Editor</label>
        <math-field id="cke5-mf" contenteditable="true" tabindex="0">
          ${initialLatex ? `\\(${initialLatex}\\)` : ''}
        </math-field>
      </div>

      <div class="cke5-input-group">
        <label>LaTeX Source</label>
        <textarea
          id="cke5-latex-area"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Type LaTeX here..."
        >${initialLatex}</textarea>
      </div>

      <div id="cke5-ml-buttonbar">
        <div id="cke5-ml-status"></div>
        <button id="cke5-ml-close">Cancel</button>
        <button id="cke5-ml-insert">${isEditMode ? 'Save Changes' : 'Insert as Image'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Inject a temporary global style so MathLive's typeahead popover
  // (#mathlive-suggestion-popover is appended to document.body with z-index:100,
  //  while our overlay is 99999 — this forces it on top)
  const popoverStyle = document.createElement('style');
  popoverStyle.id = 'cke5-ml-popover-fix';
  popoverStyle.textContent = `
    #mathlive-suggestion-popover {
      z-index: 9999999 !important;
      position: fixed !important;
    }
  `;
  document.head.appendChild(popoverStyle);

  // Apply dark mode to mathlive keyboard
  if (window.mathVirtualKeyboard) {
    window.mathVirtualKeyboard.theme = isDark ? 'dark' : 'light';
  }

  // ── Wire up the math-field ─────────────────────────────────────────────────
  const mf = document.getElementById('cke5-mf');
  const latexArea = document.getElementById('cke5-latex-area');
  const statusEl = document.getElementById('cke5-ml-status');

  // Extra keybindings (same as CKEditor 4 plugin)
  mf.keybindings = [
    ...(mf.keybindings ?? []),
    { key: 'enter', ifMode: 'text', command: ['insert', '\\\\'] },
    { key: 'shift+enter', ifMode: 'math', command: ['insert', '\\\\'] },
  ];

  // math-field → textarea
  mf.addEventListener('input', () => {
    latexArea.value = mf.getValue();
  });

  // textarea → math-field
  latexArea.addEventListener('input', (e) => {
    mf.setValue(e.target.value);
  });

  // ── Close ──────────────────────────────────────────────────────────────────
  const closeModal = () => {
    overlay.remove();
    document.getElementById('cke5-ml-popover-fix')?.remove();
  };

  document.getElementById('cke5-ml-close').addEventListener('click', closeModal);

  // ── Insert-mode toggle (shown for both insert and edit) ────────
  let insertMode = 'latex'; // Default to latex

  if (isEditMode && existingData?.domElement) {
    // Determine the current mode of the being-edited equation
    insertMode = existingData.domElement.tagName === 'IMG' ? 'image' : 'latex';
  } else {
    // Retrieve saved user preference
    const savedMode = localStorage.getItem('mathlive-insert-mode');
    if (savedMode === 'image' || savedMode === 'latex') {
      insertMode = savedMode;
    }
  }

  const insertBtn = document.getElementById('cke5-ml-insert');

  // Update UI to match initial state
  document.querySelectorAll('.ml-mode-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === insertMode);
  });
  if (!isEditMode) {
    insertBtn.textContent = insertMode === 'image' ? 'Insert Image' : 'Insert LaTeX';
  }

  document.querySelectorAll('.ml-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      insertMode = btn.dataset.mode;
      localStorage.setItem('mathlive-insert-mode', insertMode);
      document.querySelectorAll('.ml-mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (!isEditMode) {
        insertBtn.textContent = insertMode === 'image' ? 'Insert Image' : 'Insert LaTeX';
      }
    });
  });

  // ── Insert / Update ────────────────────────────────────────────────────────
  document.getElementById('cke5-ml-insert').addEventListener('click', async () => {
    const latex = mf.getValue().trim();

    if (!latex) {
      setStatus(statusEl, '⚠ Please enter a formula.', 'warn');
      return;
    }

    if (isEditMode) {
      // ── INLINE EDIT MODE ──
      setStatus(statusEl, '⏳ Updating…', 'info');
      insertBtn.disabled = true;

      try {
        const wasImage = existingData.domElement.tagName === 'IMG';
        const isImageNow = insertMode === 'image';

        if (wasImage && isImageNow) {
          // Keep as image, update it
          const dataUrl = await renderLatexToDataUrl(latex);
          if (existingData.modelElement) {
            editor.model.change((writer) => {
              writer.setAttribute('src', dataUrl, existingData.modelElement);
              writer.setAttribute('alt', latex, existingData.modelElement);
            });
          } else {
            existingData.domElement.setAttribute('src', dataUrl);
            existingData.domElement.setAttribute('alt', latex);
            editor.model.change(() => editor.fire('change:data'));
          }
        } else if (!wasImage && !isImageNow) {
          // Keep as latex span, update it
          updateInlineSpan(existingData, latex, editor);
        } else {
          // Format switched! Remove old element entirely and insert new one
          editor.model.change((writer) => {
            if (existingData.modelElement) writer.remove(existingData.modelElement); // Image
            if (existingData.modelRange) writer.remove(existingData.modelRange);     // Span
          });

          if (isImageNow) {
            const dataUrl = await renderLatexToDataUrl(latex);
            insertImageIntoEditor(editor, dataUrl, latex);
          } else {
            insertLatexIntoEditor(editor, latex);
          }
        }

        closeModal();
      } catch (err) {
        console.error('Update error:', err);
        setStatus(statusEl, '❌ Update failed.', 'error');
        insertBtn.disabled = false;
      }
    } else {
      // Added Functionality to insert LaTeX as text as well as to insert image
      if (insertMode === 'latex') {
        // ── LATEX TEXT INSERT MODE ─────────────────────────────────────────
        insertLatexIntoEditor(editor, latex);
        closeModal();
      } else {
        // ── IMAGE INSERT MODE ──────────────────────────────────────────────
        setStatus(statusEl, '⏳ Rendering…', 'info');
        insertBtn.disabled = true;

        try {
          const dataUrl = await renderLatexToDataUrl(latex);
          insertImageIntoEditor(editor, dataUrl, latex);
          closeModal();
        } catch (err) {
          console.error('[MathlivePlugin] render error:', err);
          setStatus(statusEl, '❌ Render failed. Check your LaTeX.', 'error');
          insertBtn.disabled = false;
        }
      }
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Insert LaTeX text enclosed in math delimiters, wrapped in a math-inline span.
 */
function insertLatexIntoEditor(editor, latex) {
  editor.model.change((writer) => {
    const textToInsert = `\\(${latex}\\)`;
    const insertPosition = editor.model.document.selection.getFirstPosition();

    // Applying the mathInline attribute triggers MathlivePlugin's downcast converter
    // which wraps this text in <span class="math-inline" data-latex="x^2">
    writer.insertText(textToInsert, { mathInline: latex }, insertPosition);
  });
}

/**
 * Update an existing math-inline span in the editor model.
 */
function updateInlineSpan(existingData, latex, editor) {
  editor.model.change((writer) => {
    const textToInsert = `\\(${latex}\\)`;

    if (existingData.modelRange) {
      // We have the exact model range from the double-click event
      const insertPosition = existingData.modelRange.start;
      writer.remove(existingData.modelRange);
      writer.insertText(textToInsert, { mathInline: latex }, insertPosition);
    } else {
      // Fallback: just insert at current selection if we lost the range
      const insertPosition = editor.model.document.selection.getFirstPosition();
      writer.insertText(textToInsert, { mathInline: latex }, insertPosition);
    }
  });
}

/**
 * Crops a canvas by removing all transparent edges.
 */
function trimCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const l = pixels.data.length;
  let bound = { top: null, left: null, right: null, bottom: null };

  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) { // If pixel is not fully transparent
      const x = (i / 4) % canvas.width;
      const y = ~~((i / 4) / canvas.width);

      if (bound.top === null) bound.top = y;
      if (bound.left === null || x < bound.left) bound.left = x;
      if (bound.right === null || bound.right < x) bound.right = x;
      if (bound.bottom === null || bound.bottom < y) bound.bottom = y;
    }
  }

  // If entirely blank, return original
  if (bound.top === null) return canvas;

  // Add 2px padding to the exact crop
  const pad = 2;
  const trimWidth = bound.right - bound.left + 1 + (pad * 2);
  const trimHeight = bound.bottom - bound.top + 1 + (pad * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = trimWidth;
  trimmed.height = trimHeight;
  const tCtx = trimmed.getContext('2d');

  tCtx.putImageData(
    ctx.getImageData(bound.left, bound.top, bound.right - bound.left + 1, bound.bottom - bound.top + 1),
    pad,
    pad
  );

  return trimmed;
}

/**
 * Render LaTeX → high-fidelity PNG data URL containing embedded fonts.
 * Uses KaTeX to render standard HTML so html2canvas can correctly resolve
 * and draw the font faces using the standard Canvas 2D API.
 */
async function renderLatexToDataUrl(latex) {
  // Create a temporary off-screen container in the normal DOM
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    z-index: -100;
    opacity: 1; /* must be 1 for html2canvas to capture it cleanly */
    pointer-events: none;
    display: inline-block;
    padding: 2px;
    background: transparent;
    color: #0f172a;
    font-size: 22px;
  `;

  // Append deeply inside the modal so it's hidden behind the background
  const overlay = document.getElementById('cke5-mathlive-overlay');
  if (overlay) overlay.appendChild(container);
  else document.body.appendChild(container);

  // Render inline but forcibly apply display-style sizing without the full-width block container
  katex.render(`\\displaystyle ${latex}`, container, {
    throwOnError: false,
    displayMode: false,
  });

  // Give the browser a moment to layout the fonts
  await new Promise((r) => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: window.devicePixelRatio || 2,
      backgroundColor: null, // transparent PNG
      logging: false
    });

    // Pixel-perfect crop to remove invisible KaTeX baseline struts
    const croppedCanvas = trimCanvas(canvas);

    return croppedCanvas.toDataURL('image/png');
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Insert a <img src="dataUrl" alt="latex"> into the CKEditor 5 model.
 */
function insertImageIntoEditor(editor, dataUrl, latex) {
  const imageUtils = editor.plugins.has('ImageUtils')
    ? editor.plugins.get('ImageUtils')
    : null;

  editor.model.change((writer) => {
    // Try inline image first (CKEditor 5 Image plugin), fall back to raw HTML
    if (imageUtils) {
      const imageElement = writer.createElement('imageInline', {
        src: dataUrl,
        alt: latex,
      });
      editor.model.insertContent(imageElement);
    } else {
      // Fallback: insert via insertContent with a htmlInline element
      // (works when @ckeditor/ckeditor5-html-support is installed)
      const fragment = editor.data.processor.toView(
        `<img src="${dataUrl}" alt="${escapeAttr(latex)}" />`
      );
      const modelFragment = editor.data.toModel(fragment);
      editor.model.insertContent(modelFragment);
    }
  });

  editor.fire('change:data');
}

// ── Tiny utilities ─────────────────────────────────────────────────────────────

function setStatus(el, msg, type) {
  el.textContent = msg;
  el.style.color = type === 'error' ? '#c00' : type === 'warn' ? '#b8860b' : '#555';
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
