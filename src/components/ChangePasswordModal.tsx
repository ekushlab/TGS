import React, { useState } from "react";
import { X, KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { supabase } from "../utils/supabaseClient";

interface ChangePasswordModalProps {
  onClose: () => void;
}

/**
 * Lets ANY logged-in Supabase user (admin, treasurer, or a regular member)
 * change their own login password. No "current password" field is needed —
 * Supabase authenticates the request using the user's existing active
 * session, so a fresh password can be set directly via auth.updateUser().
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!supabase) {
      setError(
        language === "bn" ? "Supabase কনফিগার করা হয়নি।" : "Supabase is not configured."
      );
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError(
        language === "bn"
          ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(
        language === "bn"
          ? "পাসওয়ার্ড দুটি মিলছে না। আবার চেষ্টা করুন।"
          : "The two passwords don't match. Please try again."
      );
      return;
    }

    setBusy(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {language === "bn" ? "আমার পাসওয়ার্ড পরিবর্তন করুন" : "Change My Password"}
              </h3>
              <p className="text-xs text-stone-500">
                {language === "bn"
                  ? "নতুন পাসওয়ার্ড দিন এবং নিশ্চিত করুন"
                  : "Enter and confirm your new password"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
            <CheckCircle2 size={18} className="shrink-0" />
            {language === "bn"
              ? "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!"
              : "Password changed successfully!"}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                {language === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40"
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                {language === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-emerald-950 font-black text-sm shadow-md cursor-pointer"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              {language === "bn" ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
