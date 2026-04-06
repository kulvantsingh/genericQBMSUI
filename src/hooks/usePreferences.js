import { useState, useEffect } from "react";

const THEME_STORAGE_KEY = "themeMode";
const FONT_SCALE_STORAGE_KEY = "fontScale";
const LANGUAGE_STORAGE_KEY = "language";

function getInitialThemeMode() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  } catch {
    // Ignore localStorage access issues and fall back to default.
  }

  return "light";
}

function getInitialFontScale() {
  try {
    const savedScale = Number(localStorage.getItem(FONT_SCALE_STORAGE_KEY));
    if (Number.isFinite(savedScale)) {
      return Math.min(1.3, Math.max(0.85, savedScale));
    }
  } catch {
    // Ignore localStorage access issues and fall back to default.
  }

  return 1;
}

function getInitialLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === "en" || savedLanguage === "hi" || savedLanguage === "mr") {
      return savedLanguage;
    }
  } catch {
    // Ignore localStorage access issues and fall back to default.
  }

  return "en";
}

export function usePreferences() {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [fontScale, setFontScale] = useState(getInitialFontScale);
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(fontScale));
    } catch {
      // Ignore localStorage access issues.
    }
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore localStorage access issues.
    }
  }, [language]);

  return {
    themeMode,
    setThemeMode,
    fontScale,
    setFontScale,
    language,
    setLanguage,
  };
}
