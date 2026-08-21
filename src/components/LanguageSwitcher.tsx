import React from 'react';
import { Globe, Languages, Check } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'button' | 'dropdown' | 'sidebar';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  if (variant === 'sidebar') {
    return (
      <div className={`p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shrink-0">
              <Languages size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">
                {language === 'bn' ? 'ভাষা নির্বাচন' : 'Language'}
              </p>
              <p className="text-[10px] text-emerald-300 truncate">
                {language === 'bn' ? 'বাংলা / English' : 'Bengali / English'}
              </p>
            </div>
          </div>

          <div className="flex bg-emerald-900/90 p-0.5 rounded-lg border border-emerald-700/60 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                language === 'bn'
                  ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              ENG
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="language-switcher-control"
      className={`relative inline-flex items-center ${className}`}
    >
      <button
        type="button"
        onClick={toggleLanguage}
        title={
          language === 'bn'
            ? 'Switch to English version (সম্পূর্ণ অ্যাপস ইংরেজিতে দেখুন)'
            : 'বাংলা ভাষায় পরিবর্তন করুন (Switch to Bengali)'
        }
        aria-label="Toggle language (বাংলা / English)"
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 border-2 border-amber-300 shadow-sm transition-all cursor-pointer font-bold text-xs sm:text-sm active:scale-95 group"
      >
        <Globe size={16} className="text-emerald-900 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
        <div className="flex items-center font-black tracking-wide">
          <span className={`px-1.5 py-0.5 rounded ${language === 'bn' ? 'bg-emerald-950 text-amber-300' : 'text-emerald-900 opacity-60'}`}>
            বাং
          </span>
          <span className="text-emerald-800 text-[10px] mx-0.5">/</span>
          <span className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-emerald-950 text-amber-300' : 'text-emerald-900 opacity-60'}`}>
            EN
          </span>
        </div>
      </button>
    </div>
  );
};
