import { useCallback, useSyncExternalStore } from "react";
import ar from "../locales/ar.js";
import en from "../locales/en.js";

const LANG_KEY = "chat-zahwa:lang";
const LOCALES = { ar, en };
const listeners = new Set();

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    // ignore
  }
  return "ar";
}

let currentLang = loadLang();

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}
applyLang(currentLang);

function setLang(lang) {
  currentLang = lang;
  applyLang(lang);
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => currentLang;

// Shared store, so every component using the hook switches together (no provider needed).
export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getSnapshot);

  const t = useCallback(
    (key) => {
      const find = (dict) => key.split(".").reduce((o, k) => o?.[k], dict);
      const value = find(LOCALES[lang]) ?? find(LOCALES.ar);
      return typeof value === "string" ? value : key;
    },
    [lang]
  );

  const toggleLang = useCallback(() => setLang(currentLang === "ar" ? "en" : "ar"), []);

  return { t, lang, dir: lang === "ar" ? "rtl" : "ltr", toggleLang };
}
