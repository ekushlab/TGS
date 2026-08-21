import { useState, type FormEvent } from "react";
import { LogIn, Loader2, Phone, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { AppSettings } from "../types";
import { TgsLogoSvg } from "./TgsLogoWatermark";

interface LoginScreenProps {
  settings: AppSettings;
}

export function LoginScreen({ settings }: LoginScreenProps) {
  const { language } = useLanguage();
  const { signIn } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const societyName =
    language === "en" && settings.societyNameEn
      ? settings.societyNameEn
      : settings.societyName;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const digits = mobile.replace(/\D/g, "");
    if (digits.length < 10) {
      setError(
        language === "bn"
          ? "সঠিক মোবাইল নম্বর দিন (যেমনঃ ০১৭xxxxxxxx)।"
          : "Please enter a valid mobile number."
      );
      return;
    }
    if (!password) {
      setError(
        language === "bn" ? "পাসওয়ার্ড দিন।" : "Please enter your password."
      );
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(mobile, password);
    setSubmitting(false);

    if (signInError) {
      setError(
        language === "bn"
          ? "মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।"
          : "Incorrect mobile number or password. Please try again or contact your admin."
      );
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl shadow-2xl border border-emerald-800/80 overflow-hidden">
          <div className="flex flex-col items-center gap-3 px-6 sm:px-8 pt-8 pb-6 text-center border-b border-emerald-800/60">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={societyName}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-300 shadow-md"
              />
            ) : (
              <TgsLogoSvg size={64} glow />
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-amber-300 leading-tight">
                {societyName}
              </h1>
              <p className="text-emerald-300 text-[11px] sm:text-xs font-semibold mt-0.5">
                {language === "bn"
                  ? "সদস্য ও অ্যাডমিন লগইন"
                  : "Member &amp; Admin Login"}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white text-stone-900 px-6 sm:px-8 py-6 sm:py-7 space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-700" />
                {language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="01712345678"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40 font-mono"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-700" />
                {language === "bn" ? "পাসওয়ার্ড" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40"
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

            {error && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-emerald-950 font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {language === "bn" ? "লগইন করুন" : "Log In"}
            </button>

            <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5">
              <ShieldCheck size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <p>
                {language === "bn"
                  ? "নতুন সদস্য? আপনার মোবাইল নম্বর ও পাসওয়ার্ড অ্যাডমিনের কাছ থেকে সংগ্রহ করুন। নিজে থেকে অ্যাকাউন্ট তৈরি করার সুযোগ নেই।"
                  : "New member? Get your mobile number & password from your admin — self sign-up isn't available."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
