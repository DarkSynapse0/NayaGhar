"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "en" | "ne";

export const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "ne" as const, label: "\u0928\u0947\u092A\u093E\u0932\u0940", flag: "\u{1F1F3}\u{1F1F5}" },
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
  currentFlag: "\u{1F1EC}\u{1F1E7}",
  currentLabel: "English",
});

export function useLanguage() {
  return useContext(LanguageContext);
}

let googleTranslateLoaded = false;

/** Hide all Google Translate UI elements (banners, tooltips, iframes). */
function hideGoogleUI() {
  document.querySelectorAll<HTMLElement>("body > .skiptranslate").forEach((el) => {
    el.style.cssText = "display:none!important;height:0!important;overflow:hidden!important;";
  });
  document.querySelectorAll<HTMLElement>("iframe.goog-te-banner-frame").forEach((el) => {
    el.style.cssText = "display:none!important;";
  });
  const tooltip = document.getElementById("goog-gt-tt");
  if (tooltip) tooltip.style.display = "none";
  document.body.style.top = "0px";
}

/**
 * Repeatedly call hideGoogleUI until the Google Translate UI is actually present
 * and hidden, using requestAnimationFrame for efficiency instead of stacked setTimeouts.
 */
function hideGoogleUIUntilDone(maxAttempts = 20) {
  let attempts = 0;
  function tick() {
    hideGoogleUI();
    attempts++;
    if (attempts < maxAttempts) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

function loadGoogleTranslate(): Promise<void> {
  return new Promise((resolve) => {
    if (googleTranslateLoaded) {
      resolve();
      return;
    }

    // Create a hidden wrapper for the Google Translate widget
    let wrapper = document.getElementById("gt-wrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "gt-wrapper";
      wrapper.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;";
      document.body.appendChild(wrapper);
    }

    let el = document.getElementById("google_translate_element");
    if (!el) {
      el = document.createElement("div");
      el.id = "google_translate_element";
      wrapper.appendChild(el);
    }

    (window as unknown as Record<string, unknown>).googleTranslateElementInit = () => {
      const g = (window as unknown as Record<string, unknown>).google as {
        translate: { TranslateElement: new (opts: unknown, id: string) => void };
      };
      new g.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,ne", autoDisplay: false },
        "google_translate_element"
      );
      googleTranslateLoaded = true;
      hideGoogleUIUntilDone();
      // Give the widget time to fully initialize before resolving
      setTimeout(resolve, 600);
    };

    // Use a MutationObserver to hide any Google UI that appears dynamically
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
    // Clear the Google Translate cookie and reload to restore English
    const hostname = window.location.hostname;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;
    window.location.reload();
  } else {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = "ne";
      select.dispatchEvent(new Event("change"));
    }
    hideGoogleUIUntilDone();
  }
}

export function useLanguageState() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ne") {
      setLangState("ne");
      // Delay loading Google Translate to avoid blocking initial render
      const timer = setTimeout(async () => {
        await loadGoogleTranslate();
        setTimeout(() => setTranslateLanguage("ne"), 1000);
      }, 3000);
      return () => clearTimeout(timer);
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

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return {
    lang,
    setLang,
    currentFlag: current.flag,
    currentLabel: current.label,
  };
}
