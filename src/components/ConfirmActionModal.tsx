import React from "react";
import { AlertTriangle, X, ShieldAlert, RotateCcw } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

// A generic, reusable confirmation modal for actions that are NOT permanent
// deletion (e.g. "Suspend Membership", "Reactivate Membership") — visually
// distinct from ConfirmDeleteModal's red "irreversible" styling, since these
// actions are reversible. `tone` picks the color scheme: "warning" (amber)
// for actions that hide/restrict something, "success" (emerald) for actions
// that restore/re-enable something.
export interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  itemDescription?: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "warning" | "success";
  icon?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  itemDescription,
  message,
  confirmLabel,
  cancelLabel,
  tone = "warning",
  icon,
  onConfirm,
  onClose,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const palette =
    tone === "success"
      ? {
          headerGrad: "from-emerald-650 via-emerald-600 to-emerald-700",
          badgeBg: "bg-emerald-50/80",
          badgeBorder: "border-emerald-100",
          iconText: "text-emerald-600",
          confirmBtn: "bg-emerald-700 hover:bg-emerald-800",
        }
      : {
          headerGrad: "from-amber-600 via-amber-600 to-orange-700",
          badgeBg: "bg-amber-50/80",
          badgeBorder: "border-amber-100",
          iconText: "text-amber-600",
          confirmBtn: "bg-amber-700 hover:bg-amber-800",
        };

  const defaultIcon =
    tone === "success" ? (
      <RotateCcw size={20} className="text-white" />
    ) : (
      <ShieldAlert size={22} className="text-white" />
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${palette.headerGrad} p-4 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              {icon || defaultIcon}
            </div>
            <h3 className="text-base font-black tracking-tight leading-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {message && (
            <div
              className={`flex items-start gap-3 ${palette.badgeBg} p-3.5 rounded-xl border ${palette.badgeBorder} text-stone-800`}
            >
              <AlertTriangle size={20} className={`${palette.iconText} shrink-0 mt-0.5`} />
              <p className="text-xs leading-relaxed">{message}</p>
            </div>
          )}

          {itemDescription && (
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                {language === "bn" ? "নির্দিষ্ট তথ্য বিবরণী:" : "Record Details:"}
              </p>
              <p className="text-sm font-bold text-stone-800 break-words font-mono">{itemDescription}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-bold hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
          >
            {cancelLabel || (language === "bn" ? "বাতিল করুন" : "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-xl ${palette.confirmBtn} active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
