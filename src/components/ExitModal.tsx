import React, { useEffect } from 'react';
import { LogOut, X, ShieldCheck, RotateCcw, Smartphone, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export function performAppExit(): boolean {
  // 1. Android Cordova / PhoneGap / AppsGeyser / Web2App bridges
  try {
    if ((navigator as any)?.app?.exitApp) {
      (navigator as any).app.exitApp();
      return true;
    }
  } catch {}

  try {
    if ((navigator as any)?.device?.exitApp) {
      (navigator as any).device.exitApp();
      return true;
    }
  } catch {}

  try {
    if ((window as any)?.appsgeyserAPI?.exit) {
      (window as any).appsgeyserAPI.exit();
      return true;
    }
    if ((window as any)?.appsgeyser?.exit) {
      (window as any).appsgeyser.exit();
      return true;
    }
    if ((window as any)?.appsgeyser?.close) {
      (window as any).appsgeyser.close();
      return true;
    }
  } catch {}

  try {
    if ((window as any)?.Android?.finish) {
      (window as any).Android.finish();
      return true;
    }
    if ((window as any)?.Android?.exitApp) {
      (window as any).Android.exitApp();
      return true;
    }
    if ((window as any)?.Android?.closeApp) {
      (window as any).Android.closeApp();
      return true;
    }
    if ((window as any)?.Android?.exit) {
      (window as any).Android.exit();
      return true;
    }
  } catch {}

  try {
    if ((window as any)?.JSInterface?.closeApp) {
      (window as any).JSInterface.closeApp();
      return true;
    }
    if ((window as any)?.JSInterface?.finish) {
      (window as any).JSInterface.finish();
      return true;
    }
  } catch {}

  // 2. Standard browser window close (works if opened via script or popup)
  try {
    window.close();
  } catch {}

  return false;
}

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  societyName: string;
}

export const ExitModal: React.FC<ExitModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  societyName,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const handleConfirm = () => {
    const exitedProgrammatically = performAppExit();
    onConfirmExit();
  };

  return (
    <div
      id="exit-confirm-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.stopPropagation();
      }}
    >
      <div
        id="exit-confirm-modal-box"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warm/red accent */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {language === 'bn' ? 'অ্যাপ্লিকেশন থেকে প্রস্থান' : 'Exit Application'}
              </h3>
              <p className="text-[11px] text-red-100">{societyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
            <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-stone-900">
                {language === 'bn' ? 'তথ্য সম্পূর্ণ সুরক্ষিত রয়েছে' : 'All Data is Safely Saved'}
              </p>
              <p className="text-stone-600 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার সমস্ত সঞ্চয়, সদস্য হিসাব, রসিদ এবং ট্রানজেকশন নিরাপদে ডিভাইসে সংরক্ষিত রয়েছে।'
                  : 'All your deposits, member ledgers, receipts, and transactions are securely saved.'}
              </p>
            </div>
          </div>

          <p className="text-sm text-stone-700 text-center font-medium">
            {language === 'bn'
              ? 'আপনি কি নিশ্চিতভাবে অ্যাপ থেকে বের হতে চান?'
              : 'Are you sure you want to exit the application?'}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="exit-cancel-btn"
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold transition-all cursor-pointer text-center"
            >
              {language === 'bn' ? 'না, চালু রাখুন' : 'No, Stay in App'}
            </button>

            <button
              id="exit-confirm-btn"
              type="button"
              onClick={handleConfirm}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={16} />
              <span>{language === 'bn' ? 'হ্যাঁ, প্রস্থান করুন' : 'Yes, Exit App'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExitedScreen: React.FC<{ onReopen: () => void; societyName: string }> = ({
  onReopen,
  societyName,
}) => {
  const { language } = useLanguage();

  useEffect(() => {
    // Attempt native app exit when mounted
    performAppExit();
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-stone-800 rounded-3xl p-6 sm:p-8 text-center border border-stone-700 shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {language === 'bn' ? 'সেশন সফলভাবে সমাপ্ত হয়েছে' : 'Session Closed Successfully'}
          </h2>
          <p className="text-emerald-400 text-xs sm:text-sm font-semibold">{societyName}</p>
          <p className="text-stone-400 text-xs leading-relaxed pt-2">
            {language === 'bn'
              ? 'আপনার সমস্ত হিসাব ও লেজার ডাটা নিরাপদে সংরক্ষিত রয়েছে।'
              : 'All your ledger data is securely saved in your device.'}
          </p>
        </div>

        <div className="p-3 bg-stone-900/80 rounded-2xl border border-stone-700/80 text-stone-300 text-xs flex items-center gap-2.5 text-left">
          <Smartphone size={22} className="text-amber-400 shrink-0" />
          <span>
            {language === 'bn'
              ? 'অ্যাপটি সম্পূর্ণ মিনিমাইজ বা বন্ধ করতে ফোনের হোম (Home) বা ব্যাক বাটন চাপুন।'
              : 'Press your phone\'s Home or Back button to minimize or close the app.'}
          </span>
        </div>

        <div className="pt-2">
          <button
            id="reopen-app-btn"
            type="button"
            onClick={onReopen}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={18} />
            <span>{language === 'bn' ? 'পুনরায় অ্যাপ চালু করুন' : 'Reopen Application'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
