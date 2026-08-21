import React from "react";
import { AlertTriangle, Trash2, X, ShieldAlert } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemDescription?: string;
  warningMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemDescription,
  warningMessage,
  onConfirm,
  onClose,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      id="confirm-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="confirm-delete-modal-card"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-red-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with High-Visibility Security Alert */}
        <div className="bg-gradient-to-r from-red-650 via-red-600 to-rose-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              <ShieldAlert size={22} className="text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                {title || (language === 'bn' ? 'সতর্কবার্তা: তথ্য মুছে ফেলা' : 'Warning: Delete Record')}
              </h3>
              <p className="text-[11px] text-red-100 font-medium">
                {language === 'bn' ? 'এই পদক্ষেপটি অত্যন্ত সংবেদনশীল' : 'This action is irreversible'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-red-50/80 p-3.5 rounded-xl border border-red-100 text-red-900">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {language === 'bn' 
                  ? 'আপনি কি নিশ্চিতভাবে এই তথ্যটি মুছে ফেলতে চান?' 
                  : 'Are you sure you want to permanently delete this record?'}
              </p>
              <p className="text-red-700 leading-relaxed">
                {warningMessage || (language === 'bn'
                  ? 'মুছে ফেলার পর এটি স্থায়ীভাবে ডিলিট হয়ে যাবে এবং কোনোভাবেই পুনরুদ্ধার করা সম্ভব হবে না।'
                  : 'Once deleted, this item will be permanently removed and cannot be recovered.')}
              </p>
            </div>
          </div>

          {itemDescription && (
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'নির্দিষ্ট তথ্য বিবরণী:' : 'Record Details:'}
              </p>
              <p className="text-sm font-bold text-stone-800 break-words font-mono">
                {itemDescription}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-bold hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
          >
            {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Trash2 size={16} />
            <span>{language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
