'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { LanguageCode, LANGUAGES } from './types';
import translations from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Storage key for language preference
const LANG_STORAGE_KEY = 'tg-directory-lang';

// Read stored language from localStorage (client only)
function readStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as LanguageCode;
    if (saved && translations[saved]) return saved;
  } catch {
    // Ignore
  }
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'en' to match SSR output and avoid hydration mismatch
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const initialized = useRef(false);

  // After hydration, read the stored language from localStorage
  // Using useRef to avoid the lint error about setState in effects
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = readStoredLanguage();
    if (stored && stored !== 'en') {
      // Use startTransition to avoid cascading render warning
      React.startTransition(() => {
        setLanguageState(stored);
      });
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // Ignore
      }
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = translations[language]?.[key] || translations.en?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
