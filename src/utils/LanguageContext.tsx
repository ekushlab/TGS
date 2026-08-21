import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  TranslationDictionary,
  translations,
  formatMonthName,
  formatPaymentMethod,
  formatNum,
  formatUid,
  formatCurrencyValue,
  getLocalizedMonths,
  BN_MONTHS,
  EN_MONTHS,
} from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationDictionary;
  tMonth: (m: string) => string;
  tMethod: (m: string) => string;
  formatNumber: (n: number | string | undefined) => string;
  formatUid: (uid: string | number | undefined) => string;
  formatMoney: (n: number | string | undefined) => string;
  getRecentMonthsList: (count?: number) => string[];
  monthsList: string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'tgs_selected_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {
      // ignore
    }
    return 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const currentTranslations = translations[language];

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: currentTranslations,
    tMonth: (m: string) => formatMonthName(m, language),
    tMethod: (m: string) => formatPaymentMethod(m, language),
    formatNumber: (n: number | string | undefined) => formatNum(n, language),
    formatUid: (uid: string | number | undefined) => formatUid(uid),
    formatMoney: (n: number | string | undefined) => formatCurrencyValue(n, language),
    getRecentMonthsList: (count = 12) => getLocalizedMonths(count, new Date(), language),
    monthsList: language === 'en' ? EN_MONTHS : BN_MONTHS,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
