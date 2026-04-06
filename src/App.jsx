import { useState, useCallback } from "react";
import "./styles/app-layout.css";

import { THEME_VARS } from "./features/questionBank/utils/constants";
import { EditorContext } from "./features/questionBank/contexts/editorContext";
import { translate } from "./features/questionBank/config/i18n";
import { LocalizationContext } from "./features/questionBank/contexts/localizationContext";

import { usePreferences } from "./hooks/usePreferences";
import { QuestionBankPage } from "./pages/QuestionBankPage";

export default function App() {
  const { themeMode, setThemeMode, fontScale, setFontScale, language, setLanguage } = usePreferences();
  const [activeFieldId, setActiveFieldId] = useState(null);
  const t = useCallback((key) => translate(language, key), [language]);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      <EditorContext.Provider value={{ activeFieldId, setActiveFieldId }}>
        <div
          style={{
            ...THEME_VARS[themeMode],
            minHeight: `${100 / fontScale}vh`,
            background: "var(--app-bg)",
            fontFamily: "'Segoe UI', sans-serif",
            color: "var(--text-primary)",
            zoom: fontScale,
          }}
        >
          <QuestionBankPage
            language={language}
            setLanguage={setLanguage}
            t={t}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            fontScale={fontScale}
            setFontScale={setFontScale}
            setActiveFieldId={setActiveFieldId}
          />
        </div>
      </EditorContext.Provider>
    </LocalizationContext.Provider>
  );
}
