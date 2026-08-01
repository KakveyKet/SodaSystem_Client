import { createI18n } from "vue-i18n";

import en from "./locales/en";
import km from "./locales/km";

const supportedLanguages = [
  "km",
  "en",
];

const savedLanguage =
  localStorage.getItem(
    "app_language"
  );

const defaultLanguage =
  supportedLanguages.includes(
    savedLanguage
  )
    ? savedLanguage
    : "km";

const i18n = createI18n({
  legacy: false,
  globalInjection: true,

  // Khmer is the default language
  locale: defaultLanguage,

  // Use English when a Khmer translation is missing
  fallbackLocale: "en",

  messages: {
    km,
    en,
  },
});

document.documentElement.lang =
  defaultLanguage;

export default i18n;