"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "en" | "ne";

export const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "🇬🇧" },
  { code: "ne" as const, label: "नेपाली", flag: "🇳🇵" },
];

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  currentFlag: string;
  currentLabel: string;
};

export const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  currentFlag: "🇬🇧",
  currentLabel: "English",
});

export function useLanguage() {
  return useContext(LanguageContext);
}

let googleTranslateLoaded = false;

function hideGoogleUI() {
  // Hide the skiptranslate bar (top banner)
  document.querySelectorAll("body > .skiptranslate").forEach((el) => {
    (el as HTMLElement).style.cssText = "display:none!important;height:0!important;overflow:hidden!important;";
  });
  // Hide banner iframes
  document.querySelectorAll("iframe.goog-te-banner-frame").forEach((el) => {
    (el as HTMLElement).style.cssText = "display:none!important;";
  });
  // Hide tooltip
  const tt = document.getElementById("goog-gt-tt");
  if (tt) tt.style.display = "none";
  // Fix body position
  document.body.style.top = "0px";
}

function loadGoogleTranslate(): Promise<void> {
  return new Promise((resolve) => {
    if (googleTranslateLoaded) { resolve(); return; }

    // Create a hidden wrapper
    let wrapper = document.getElementById("gt-wrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "gt-wrapper";
      wrapper.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;";
      document.body.appendChild(wrapper);
    }

    // Create translate element inside wrapper
    let el = document.getElementById("google_translate_element");
    if (!el) {
      el = document.createElement("div");
      el.id = "google_translate_element";
      wrapper.appendChild(el);
    }

    (window as unknown as Record<string, unknown>).googleTranslateElementInit = () => {
      const g = (window as unknown as Record<string, unknown>).google as {
        translate: { TranslateElement: new (opts: unknown, id: string) => void }
      };
      new g.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,ne",
        autoDisplay: false,
      }, "google_translate_element");
      googleTranslateLoaded = true;

      // Start hiding UI
      hideGoogleUI();
      setTimeout(hideGoogleUI, 200);
      setTimeout(hideGoogleUI, 500);
      setTimeout(resolve, 600);
    };

    // Observe DOM to hide any Google UI that appears
    const observer = new MutationObserver(hideGoogleUI);
    observer.observe(document.body, { childList: true, subtree: false });

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  });
}

function setTranslateLanguage(lang: Language) {
  if (lang === "en") {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
    window.location.reload();
  } else {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = "ne";
      select.dispatchEvent(new Event("change"));
    }
    hideGoogleUI();
    setTimeout(hideGoogleUI, 100);
    setTimeout(hideGoogleUI, 300);
    setTimeout(hideGoogleUI, 500);
    setTimeout(hideGoogleUI, 1000);
    setTimeout(hideGoogleUI, 2000);
    setTimeout(hideGoogleUI, 3000);
  }
}

export function useLanguageState() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ne") {
      setLangState("ne");
      setTimeout(async () => {
        await loadGoogleTranslate();
        setTimeout(() => setTranslateLanguage("ne"), 1000);
      }, 3000);
    }
  }, []);

  const setLang = useCallback(async (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);

    if (newLang === "ne") {
      await loadGoogleTranslate();
      setTimeout(() => setTranslateLanguage("ne"), 500);
    } else {
      setTranslateLanguage("en");
    }
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return {
    lang,
    setLang,
    currentFlag: current.flag,
    currentLabel: current.label,
  };
}
