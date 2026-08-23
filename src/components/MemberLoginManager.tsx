import React, { useState } from "react";
import {
  X,
  KeyRound,
  Copy,
  Check,
  Share2,
  RefreshCw,
  ShieldCheck,
  Loader2,
  AlertCircle,
  UserCog,
} from "lucide-react";
import { Member, AppSettings } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { supabase } from "../utils/supabaseClient";
import { normalizeMobile, isValidMobile } from "../utils/mobileAuth";

interface MemberLoginManagerProps {
  members: Member[];
  settings: AppSettings;
  onClose: () => void;
}

interface ProfileRow {
  id: string;
  mobile: string;
  name: string;
  role: "admin" | "treasurer" | "member";
  member_uid: string | null;
}

function randomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pwd = "";
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export const MemberLoginManager: React.FC<MemberLoginManagerProps> = ({
  members,
  settings,
  onClose,
}) => {
  const { language } = useLanguage();
  const [selectedMemberUid, setSelectedMemberUid] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [asRole, setAsRole] = useState<"member" | "treasurer" | "admin">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ mobile: string; password: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [existingProfiles, setExistingProfiles] = useState<ProfileRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const loadProfiles = async () => {
    if (!supabase) return;
    setLoadingProfiles(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, mobile, name, role, member_uid");
    setExistingProfiles((data as ProfileRow[]) || []);
    setLoadingProfiles(false);
  };

  React.useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMemberSelect = (uid: string) => {
    setSelectedMemberUid(uid);
    const m = members.find((x) => x.uid === uid);
    if (m) {
      setMobile(m.mobile || "");
    }
  };

  const handleCreate = async () => {
    setError("");
    setResult(null);
    if (!supabase) {
      setError(
        language === "bn"
          ? "Supabase কনফিগার করা হয়নি।"
          : "Supabase is not configured."
      );
      return;
    }
    if (!isValidMobile(mobile)) {
      setError(
        language === "bn"
          ? "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমনঃ ০১৭xxxxxxxx)।"
          : "Enter a valid 11-digit mobile number."
      );
      return;
    }
    if (!password || password.length < 6) {
      setError(
        language === "bn"
          ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters."
      );
      return;
    }

    setBusy(true);
    const member = members.find((m) => m.uid === selectedMemberUid);
    const { data, error: fnError } = await supabase.functions.invoke(
      "admin-manage-login",
      {
        body: {
          action: "create",
          mobile: normalizeMobile(mobile),
          password,
          name: member?.name || "",
          member_uid: selectedMemberUid || null,
          role: asRole,
        },
      }
    );
    setBusy(false);

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || "Failed to create login.");
      return;
    }

    setResult({ mobile: data.mobile, password: data.password });
    setPassword(randomPassword());
    loadProfiles();
  };

  const slipText = result
    ? language === "bn"
      ? `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}
🔐 অ্যাপ লগইন তথ্য
------------------------------------
📱 মোবাইল নম্বর: ${result.mobile}
🔑 পাসওয়ার্ড: ${result.password}
------------------------------------
🌐 লিঙ্ক: ${window.location.origin}
⚠️ এই তথ্য গোপন রাখুন, কারো সাথে শেয়ার করবেন না (অ্যাডমিন ছাড়া)।`
      : `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}
🔐 App Login Information
------------------------------------
📱 Mobile Number: ${result.mobile}
🔑 Password: ${result.password}
------------------------------------
🌐 Link: ${window.location.origin}
⚠️ Keep this information private, do not share it with anyone (except admin).`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(slipText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(slipText)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-6 space-y-5 max-h-[92vh] overflow-y-auto relative">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center shrink-0">
              <UserCog size={22} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {language === "bn" ? "সদস্য/অ্যাডমিন লগইন তৈরি করুন" : "Create Member/Admin Login"}
              </h3>
              <p className="text-xs text-stone-500">
                {language === "bn"
                  ? "মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে বাস্তব লগইন অ্যাকাউন্ট তৈরি হবে"
                  : "Creates a real, working mobile+password login"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">
              {language === "bn" ? "সদস্য নির্বাচন করুন (ঐচ্ছিক)" : "Link to a member (optional)"}
            </label>
            <select
              value={selectedMemberUid}
              onChange={(e) => handleMemberSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40"
            >
              <option value="">
                {language === "bn" ? "-- শুধু মোবাইল নম্বর দিয়ে তৈরি করুন --" : "-- Just mobile number, no linked member --"}
              </option>
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.name} ({m.uid})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                {language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"}
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="01712345678"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                {language === "bn" ? "পাসওয়ার্ড" : "Password"}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPassword(randomPassword())}
                  title={language === "bn" ? "নতুন পাসওয়ার্ড" : "Regenerate"}
                  className="shrink-0 w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">
              {language === "bn" ? "একসেস লেভেল" : "Access Level"}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setAsRole("member")}
                className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  asRole === "member"
                    ? "bg-emerald-800 text-amber-300 border-emerald-800"
                    : "bg-white text-stone-600 border-stone-200"
                }`}
              >
                {language === "bn" ? "সাধারণ সদস্য (ভোট + তথ্য দেখা)" : "Member (vote + view)"}
              </button>
              <button
                type="button"
                onClick={() => setAsRole("treasurer")}
                className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  asRole === "treasurer"
                    ? "bg-sky-700 text-white border-sky-700"
                    : "bg-white text-stone-600 border-stone-200"
                }`}
              >
                {language === "bn"
                  ? "কোষাধ্যক্ষ/সাধারণ সম্পাদক (এন্ট্রি অ্যাক্সেস)"
                  : "Treasurer/General Secretary (entry access)"}
              </button>
              <button
                type="button"
                onClick={() => setAsRole("admin")}
                className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  asRole === "admin"
                    ? "bg-amber-400 text-emerald-950 border-amber-400"
                    : "bg-white text-stone-600 border-stone-200"
                }`}
              >
                {language === "bn" ? "অ্যাডমিন (সম্পূর্ণ নিয়ন্ত্রণ)" : "Admin (full control)"}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-emerald-950 font-black text-sm shadow-md cursor-pointer"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            {language === "bn" ? "লগইন তৈরি করুন" : "Create Login"}
          </button>
        </div>

        {result && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <ShieldCheck size={18} />
              {language === "bn" ? "লগইন সফলভাবে তৈরি হয়েছে!" : "Login created successfully!"}
            </div>
            <pre className="whitespace-pre-wrap text-xs bg-white border border-emerald-200 rounded-xl p-3 font-mono text-stone-800">
              {slipText}
            </pre>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {language === "bn" ? "কপি করুন" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold cursor-pointer"
              >
                <Share2 size={14} />
                WhatsApp
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-stone-100">
          <h4 className="text-xs font-bold text-stone-600 mb-2">
            {language === "bn" ? `বিদ্যমান লগইন (${existingProfiles.length})` : `Existing logins (${existingProfiles.length})`}
          </h4>
          {loadingProfiles ? (
            <p className="text-xs text-stone-400">
              {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
            </p>
          ) : existingProfiles.length === 0 ? (
            <p className="text-xs text-stone-400">
              {language === "bn" ? "এখনো কোনো লগইন তৈরি হয়নি।" : "No logins created yet."}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {existingProfiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2"
                >
                  <span className="font-mono">{p.mobile}</span>
                  <span className="text-stone-500">{p.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      p.role === "admin"
                        ? "bg-amber-100 text-amber-900"
                        : p.role === "treasurer"
                        ? "bg-sky-100 text-sky-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
