import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import de from "./locales/de/common.json";

type SupportedLanguage = "en" | "de";

const resources = {
  en: { translation: en },
  de: { translation: de },
} as const;

const FALLBACK_LANGUAGE: SupportedLanguage = "en";

const detectLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") {
    return FALLBACK_LANGUAGE;
  }

  const stored = window.localStorage.getItem("fitvibe:language") as SupportedLanguage | null;
  if (stored && stored in resources) {
    return stored;
  }

  const browser = window.navigator?.language?.slice(0, 2) as SupportedLanguage | undefined;
  if (browser && browser in resources) {
    return browser;
  }

  return FALLBACK_LANGUAGE;
};

const initialLanguage = detectLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

if (typeof window !== "undefined") {
  i18n.on("languageChanged", (lng) => {
    window.localStorage.setItem("fitvibe:language", lng);
  });
}

export default i18n;
