"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../../locales/en.json';
import ja from '../../locales/ja.json';

type Locale = 'en' | 'ja';
type Translations = typeof en;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Locale, Translations> = {
  en,
  ja,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ja'); // Default to Japanese per pivot

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[locale];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Missing translation for key: ${path} in locale: ${locale}`);
        return path;
      }
      current = current[key];
    }
    
    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
