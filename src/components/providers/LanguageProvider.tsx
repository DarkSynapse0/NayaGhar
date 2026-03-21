"use client";

import { LanguageContext, useLanguageState } from "@/hooks/useLanguage";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const state = useLanguageState();
  return (
    <LanguageContext.Provider value={state}>
      {children}
    </LanguageContext.Provider>
  );
}
