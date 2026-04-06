import { createContext, useContext } from "react";

export const LocalizationContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function useLocalization() {
  return useContext(LocalizationContext);
}
