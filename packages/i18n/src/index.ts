import { en } from "./en";
import { de } from "./de";

const dictionaries = { en, de };
let currentLang: keyof typeof dictionaries = "en";

export const t = (key: keyof typeof en): string => dictionaries[currentLang][key] || key;
export const setLang = (lang: keyof typeof dictionaries) => (currentLang = lang);
