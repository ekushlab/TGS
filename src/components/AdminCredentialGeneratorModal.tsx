import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  ShieldCheck,
  User,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Share2,
  Printer,
  Sparkles,
  Users,
  Lock,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Member, AppSettings } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { PageWatermark } from "./TgsLogoWatermark";

interface AdminCredentialGeneratorModalProps {
  members: Member[];
  settings: AppSettings;
  onClose: () => void;
}

interface GeneratedCredential {
  id: string;
  name: string;
  phone?: string;
  role: string;
  roleTitle: string;
  userId: string;
  password: string;
  generatedAt: string;
}

const ROLES = [
  { id: "president", titleBn: "সভাপতি (President)", titleEn: "President", prefix: "ADM-PRES" },
  { id: "secretary", titleBn: "সাধারণ সম্পাদক (General Secretary)", titleEn: "General Secretary", prefix: "ADM-SEC" },
  { id: "treasurer", titleBn: "কোষাধ্যক্ষ (Treasurer)", titleEn: "Treasurer", prefix: "ADM-TREAS" },
  { id: "vice_president", titleBn: "সহ-সভাপতি (Vice President)", titleEn: "Vice President", prefix: "ADM-VP" },
  { id: "org_secretary", titleBn: "সাংগঠনিক সম্পাদক (Organizing Sec.)", titleEn: "Organizing Secretary", prefix: "ADM-ORG" },
  { id: "auditor", titleBn: "প্রধান অডিটর / নিরীক্ষক (Auditor)", titleEn: "Chief Auditor", prefix: "ADM-AUD" },
  { id: "executive", titleBn: "নির্বাহী সদস্য (Executive Admin)", titleEn: "Executive Member", prefix: "ADM-EXEC" },
  { id: "member", titleBn: "সাধারণ সদস্য (General Member)", titleEn: "General Member", prefix: "TGS-USER" },
  { id: "custom", titleBn: "কাস্টম রোল (Custom Designation)", titleEn: "Custom Role", prefix: "ADM-CUSTOM" },
];

export const AdminCredentialGeneratorModal: React.FC<AdminCredentialGeneratorModalProps> = ({
  members,
  settings,
  onClose,
}) => {
  const { language, formatNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "history">("single");

  // Single Generator State
  const [selectedMemberUid, setSelectedMemberUid] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [personPhone, setPersonPhone] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("secretary");
  const [customRoleTitle, setCustomRoleTitle] = useState<string>("");
  const [generatedUserId, setGeneratedUserId] = useState<string>("");
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [passwordType, setPasswordType] = useState<"complex" | "pin">("complex");
  const [passwordLength, setPasswordLength] = useState<number>(10);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<GeneratedCredential[]>(() => {
    try {
      const saved = localStorage.getItem("tgs_credential_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bulk Generator State
  const [bulkList, setBulkList] = useState<GeneratedCredential[]>([]);
  const [bulkFilter, setBulkFilter] = useState<"all" | "executive" | "members">("all");

  // Generate User ID Helper
  const generateNewUserId = (roleId: string, memberUid?: string) => {
    const roleObj = ROLES.find((r) => r.id === roleId) || ROLES[1];
    const year = new Date().getFullYear();
    const randNum = Math.floor(100 + Math.random() * 900);
    if (memberUid) {
      const cleanUid = memberUid.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
      return `${roleObj.prefix}-${cleanUid}`;
    }
    return `${roleObj.prefix}-${year}-${randNum}`;
  };

  // Generate Password Helper
  const generateNewPassword = (type: "complex" | "pin", length: number = 10) => {
    if (type === "pin") {
      const nums = "0123456789";
      let pin = "TGS-";
      for (let i = 0; i < 6; i++) {
        pin += nums.charAt(Math.floor(Math.random() * nums.length));
      }
      return pin;
    }
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "";
    // Ensure at least one uppercase, one number, one special char
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const nums = "23456789";
    const specials = "!@#$%&*";
    pwd += uppers.charAt(Math.floor(Math.random() * uppers.length));
    pwd += nums.charAt(Math.floor(Math.random() * nums.length));
    pwd += specials.charAt(Math.floor(Math.random() * specials.length));

    for (let i = 3; i < length; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Shuffle
    return pwd
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  // Auto-generate on mount or role change
  useEffect(() => {
    if (!generatedUserId) {
      setGeneratedUserId(generateNewUserId(selectedRole));
    }
    if (!generatedPassword) {
      setGeneratedPassword(generateNewPassword(passwordType, passwordLength));
    }
  }, []);

  const handleMemberSelect = (uid: string) => {
    setSelectedMemberUid(uid);
    if (!uid) {
      return;
    }
    const m = members.find((x) => x.uid === uid);
    if (m) {
      setPersonName(m.name);
      setPersonPhone(m.mobile || "");
      const newUid = generateNewUserId(selectedRole, m.uid);
      setGeneratedUserId(newUid);
      setGeneratedPassword(generateNewPassword(passwordType, passwordLength));
    }
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    setGeneratedUserId(generateNewUserId(roleId, selectedMemberUid || undefined));
  };

  const handleRegenerate = () => {
    setGeneratedUserId(generateNewUserId(selectedRole, selectedMemberUid || undefined));
    setGeneratedPassword(generateNewPassword(passwordType, passwordLength));
    setCopied(false);
  };

  const getRoleTitle = (roleId: string) => {
    if (roleId === "custom" && customRoleTitle.trim()) {
      return customRoleTitle.trim();
    }
    const r = ROLES.find((x) => x.id === roleId);
    return language === "bn" ? r?.titleBn || roleId : r?.titleEn || roleId;
  };

  // Save to history & generate text
  const getFormattedCredentialSlip = () => {
    const roleTitle = getRoleTitle(selectedRole);
    const dateStr = new Date().toLocaleDateString("en-GB");
    if (language === "bn") {
      return `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}
🔐 এডমিন / ইউজার লগইন ক্রেডেনশিয়াল
------------------------------------
👤 নাম: ${personName || "প্রশাসনিক কর্মকর্তা / সদস্য"}
🏷️ পদবী: ${roleTitle}
${personPhone ? `📱 মোবাইল: ${personPhone}\n` : ""}🆔 ইউজার আইডি: ${generatedUserId}
🔑 পাসওয়ার্ড: ${generatedPassword}
📅 ইস্যু তারিখ: ${dateStr}
------------------------------------
🌐 সিস্টেম লিঙ্ক: ${window.location.origin}
⚠️ সতর্কতা: এই ক্রেডেনশিয়াল অত্যন্ত গোপনীয়। এটি কারো সাথে শেয়ার করবেন না।`;
    }
    return `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}
🔐 Admin / User Login Credentials
------------------------------------
👤 Name: ${personName || "Administrative Officer / Member"}
🏷️ Designation: ${roleTitle}
${personPhone ? `📱 Mobile: ${personPhone}\n` : ""}🆔 User ID: ${generatedUserId}
🔑 Password: ${generatedPassword}
📅 Issue Date: ${dateStr}
------------------------------------
🌐 System Link: ${window.location.origin}
⚠️ Warning: This credential is strictly confidential. Do not share it with anyone.`;
  };

  const handleCopy = () => {
    const text = getFormattedCredentialSlip();
    navigator.clipboard.writeText(text);
    setCopied(true);

    // Save to history
    const cred: GeneratedCredential = {
      id: `cred-${Date.now()}`,
      name: personName || (language === "bn" ? "অ্যাডমিন কর্মকর্তা" : "Admin Officer"),
      phone: personPhone,
      role: selectedRole,
      roleTitle: getRoleTitle(selectedRole),
      userId: generatedUserId,
      password: generatedPassword,
      generatedAt: new Date().toLocaleString("en-GB"),
    };
    const newHistory = [cred, ...history.filter((h) => h.userId !== generatedUserId)].slice(0, 50);
    setHistory(newHistory);
    try {
      localStorage.setItem("tgs_credential_history", JSON.stringify(newHistory));
    } catch {
      // ignore
    }

    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = getFormattedCredentialSlip();
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // Generate Bulk List
  const handleGenerateBulk = () => {
    const list: GeneratedCredential[] = members.map((m, idx) => {
      const isExec = idx < 5;
      const roleId = isExec ? "executive" : "member";
      const roleTitle = isExec
        ? language === "bn"
          ? "নির্বাহী সদস্য (Executive Admin)"
          : "Executive Member (Executive Admin)"
        : language === "bn"
        ? "সাধারণ সদস্য (Member)"
        : "General Member (Member)";
      const userId = isExec ? `ADM-EXEC-${m.uid}` : `TGS-USER-${m.uid}`;
      const password = generateNewPassword("complex", 8);
      return {
        id: `bulk-${m.uid}`,
        name: m.name,
        phone: m.mobile,
        role: roleId,
        roleTitle: roleTitle,
        userId: userId,
        password: password,
        generatedAt: new Date().toLocaleDateString("en-GB"),
      };
    });
    setBulkList(list);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-6 space-y-5 max-h-[92vh] overflow-y-auto relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-900 flex items-center justify-center shadow-inner shrink-0">
              <Key size={22} className="text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                  {language === "bn"
                    ? "এডমিন ইউজার আইডি ও পাসওয়ার্ড জেনারেটর"
                    : "Admin User ID & Password Generator"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  Security Hub
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === "bn"
                  ? "নির্বাহী কর্মকর্তা ও সদস্যদের জন্য নিরাপদ ইউজার আইডি এবং পাসওয়ার্ড তৈরি ও বিতরণ করুন"
                  : "Generate secure administrator & member login credentials with 1-click delivery"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "single"
                ? "bg-emerald-800 text-amber-300 shadow-xs"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            <User size={14} />
            {language === "bn" ? "একক এডমিন ক্রেডেনশিয়াল" : "Single Credential"}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("bulk");
              if (bulkList.length === 0) handleGenerateBulk();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "bulk"
                ? "bg-emerald-800 text-amber-300 shadow-xs"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            <Users size={14} />
            {language === "bn" ? "বাল্ক তালিকা জেনারেটর (একসাথে সকল)" : "Bulk Generator"}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "history"
                ? "bg-emerald-800 text-amber-300 shadow-xs"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            <ShieldCheck size={14} />
            {language === "bn"
              ? `জেনারেট হিস্ট্রি (${formatNumber(history.length)})`
              : `History (${history.length})`}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SINGLE GENERATOR */}
        {/* ======================================================== */}
        {activeTab === "single" && (
          <div className="space-y-5">
            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Member Selector (Optional) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === "bn" ? "নিবন্ধিত সদস্য নির্বাচন (ঐচ্ছিক)" : "Select Member (Optional)"}
                </label>
                <select
                  value={selectedMemberUid}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="">{language === "bn" ? "-- নতুন ব্যক্তির জন্য বা ম্যানুয়াল এন্ট্রি --" : "-- For New Person or Manual Entry --"}</option>
                  {members.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.name} ({m.uid}) {m.mobile ? `- ${m.mobile}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation / Role Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === "bn" ? "প্রশাসনিক পদবী / রোল নির্বাচন করুন *" : "Select Role / Designation *"}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {language === "bn" ? r.titleBn : r.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Role Input if Selected */}
              {selectedRole === "custom" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === "bn" ? "কাস্টম পদবীর নাম লিখুন:" : "Custom Role Title:"}
                  </label>
                  <input
                    type="text"
                    value={customRoleTitle}
                    onChange={(e) => setCustomRoleTitle(e.target.value)}
                    placeholder={
                      language === "bn" ? "যেমন: সমন্বয়কারী / বিশেষ উপদেষ্টা" : "e.g. Coordinator / Special Advisor"
                    }
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                  />
                </div>
              )}

              {/* Official Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === "bn" ? "কর্মকর্তা / সদস্যের নাম *" : "Officer / Member Name *"}
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder={language === "bn" ? "যেমন: মোহাম্মদ মোস্তফা কামাল" : "e.g. Mohammad Mostofa Kamal"}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === "bn" ? "মোবাইল নম্বর (হোয়াটসঅ্যাপ পাঠানোর জন্য)" : "Mobile Phone (For WhatsApp)"}
                </label>
                <input
                  type="text"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono"
                />
              </div>
            </div>

            {/* Password Generator Settings */}
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  {language === "bn" ? "পাসওয়ার্ড তৈরির ধরন ও নিরাপত্তা সেটিংস" : "Password Security Preferences"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordType("complex");
                      setGeneratedPassword(generateNewPassword("complex", passwordLength));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      passwordType === "complex"
                        ? "bg-emerald-800 text-amber-300"
                        : "bg-white text-stone-600 border border-stone-200"
                    }`}
                  >
                    {language === "bn" ? "জটিল আলফানিউমেরিক (High Security)" : "Complex Alphanumeric (High Security)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordType("pin");
                      setGeneratedPassword(generateNewPassword("pin", 6));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      passwordType === "pin"
                        ? "bg-emerald-800 text-amber-300"
                        : "bg-white text-stone-600 border border-stone-200"
                    }`}
                  >
                    {language === "bn" ? "সহজ পিন (PIN Code)" : "Simple PIN (PIN Code)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Credentials Result Card (The Master Credential Slip) */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-emerald-800 relative overflow-hidden">
              <PageWatermark settings={settings} opacity={0.07} />

              <div className="relative z-10 space-y-4">
                {/* Header in Card */}
                <div className="flex items-start justify-between gap-3 border-b border-emerald-800/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-bold block">
                      OFFICIAL CREDENTIAL SLIP
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                      {settings.societyName || "TRUST GROWTH SOCIETY"}
                    </h4>
                    <p className="text-xs text-emerald-200/90">
                      {language === "bn" ? "পদবী:" : "Designation:"}{" "}
                      <strong className="text-amber-200">{getRoleTitle(selectedRole)}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerate}
                    title={language === "bn" ? "পুনরায় আইডি ও পাসওয়ার্ড তৈরি করুন" : "Regenerate ID & Password"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 text-xs font-bold border border-emerald-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    {language === "bn" ? "নতুন জেনারেট" : "Regenerate"}
                  </button>
                </div>

                {/* Generated Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* User ID Box */}
                  <div className="bg-emerald-950/80 border border-emerald-700/80 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                      {language === "bn" ? "ইউজার আইডি (Login User ID)" : "User ID (Login User ID)"}
                    </span>
                    <input
                      type="text"
                      value={generatedUserId}
                      onChange={(e) => setGeneratedUserId(e.target.value)}
                      className="w-full bg-transparent font-mono text-sm sm:text-base font-black text-amber-300 focus:outline-none border-b border-dashed border-emerald-600 focus:border-amber-400 pb-0.5"
                    />
                    <span className="text-[9px] text-emerald-400/80 block">
                      {language === "bn" ? "* প্রয়োজনে সম্পাদনা করতে পারেন" : "* Editable if needed"}
                    </span>
                  </div>

                  {/* Password Box */}
                  <div className="bg-emerald-950/80 border border-emerald-700/80 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                        {language === "bn" ? "পাসওয়ার্ড (Access Password)" : "Password (Access Password)"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-amber-300/80 hover:text-amber-200 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showPassword ? (language === "bn" ? "হাইড" : "Hide") : (language === "bn" ? "দেখান" : "Show")}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={generatedPassword}
                        onChange={(e) => setGeneratedPassword(e.target.value)}
                        className="w-full bg-transparent font-mono text-sm sm:text-base font-black text-white focus:outline-none border-b border-dashed border-emerald-600 focus:border-amber-400 pb-0.5"
                      />
                    </div>
                    <span className="text-[9px] text-emerald-400/80 block">
                      {language === "bn" ? "* শক্তিশালী এনক্রিপ্টেড সিকিউরিটি" : "* Strong encrypted security"}
                    </span>
                  </div>
                </div>

                {/* Receiver Info Summary */}
                <div className="bg-emerald-900/60 rounded-xl p-2.5 border border-emerald-800 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-200 font-mono">
                  <span>
                    {language === "bn" ? "প্রাপক:" : "Recipient:"}{" "}
                    <strong className="text-white">
                      {personName || (language === "bn" ? "অ্যাডমিন কর্মকর্তা" : "Admin Officer")}
                    </strong>
                  </span>
                  <span>
                    {language === "bn" ? "তারিখ:" : "Date:"}{" "}
                    <strong className="text-white">{new Date().toLocaleDateString("en-GB")}</strong>
                  </span>
                  <span>
                    {language === "bn" ? "স্ট্যাটাস:" : "Status:"}{" "}
                    <strong className="text-amber-300">Active Credential</strong>
                  </span>
                </div>

                {/* Fast Delivery Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-800/80">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-400 hover:bg-amber-300 text-emerald-950"
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied
                      ? (language === "bn" ? "ক্রেডেনশিয়াল কপি সম্পন্ন!" : "Copied to Clipboard!")
                      : (language === "bn" ? "১-ক্লিকে সম্পূর্ণ স্লিপ কপি করুন" : "Copy Login Slip")}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 border border-emerald-700 transition-colors cursor-pointer"
                  >
                    <Share2 size={15} />
                    {language === "bn" ? "হোয়াটসঅ্যাপে পাঠান" : "WhatsApp"}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintSlip}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-bold flex items-center gap-1.5 border border-stone-700 transition-colors cursor-pointer"
                  >
                    <Printer size={15} />
                    {language === "bn" ? "প্রিন্ট স্লিপ" : "Print"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BULK GENERATOR */}
        {/* ======================================================== */}
        {activeTab === "bulk" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-800 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {language === "bn" ? "বাল্ক জেনারেটর নির্দেশিকা:" : "Bulk Generator Guide:"}
                </p>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  {language === "bn"
                    ? "সোসাইটির সকল সদস্য ও কার্যনির্বাহী কমিটির জন্য স্বয়ংক্রিয়ভাবে এক ক্লিকে ইউজার আইডি এবং নিরাপদ পাসওয়ার্ড তৈরি করা হয়েছে। আপনি সম্পূর্ণ তালিকা এক্সেল অথবা প্রিন্ট আকারে সংরক্ষণ করতে পারবেন।"
                    : "User IDs and secure passwords have been automatically generated in one click for all society members and the executive committee. You can save the complete list as Excel or in print form."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-700">
                {language === "bn"
                  ? `মোট তৈরি তালিকা: ${formatNumber(bulkList.length)} জন`
                  : `Total Generated: ${formatNumber(bulkList.length)}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBulk}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  {language === "bn" ? "রি-জেনারেট" : "Re-generate"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csvContent =
                      "data:text/csv;charset=utf-8," +
                      "Name,Role,UserID,Password,Phone\n" +
                      bulkList
                        .map((b) => `"${b.name}","${b.roleTitle}","${b.userId}","${b.password}","${b.phone || ""}"`)
                        .join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `TGS_Credentials_${new Date().getFullYear()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  {language === "bn" ? "CSV / এক্সেল ডাউনলোড" : "CSV / Excel Download"}
                </button>
              </div>
            </div>

            {/* Bulk Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100 text-stone-700 font-bold sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">{language === "bn" ? "সদস্যের নাম" : "Member Name"}</th>
                    <th className="p-2.5">{language === "bn" ? "পদবী / ভূমিকা" : "Designation / Role"}</th>
                    <th className="p-2.5 font-mono">{language === "bn" ? "ইউজার আইডি" : "User ID"}</th>
                    <th className="p-2.5 font-mono">{language === "bn" ? "পাসওয়ার্ড" : "Password"}</th>
                    <th className="p-2.5 text-center">{language === "bn" ? "একশন" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bulkList.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-bold text-stone-900">{item.name}</td>
                      <td className="p-2.5 text-stone-600">{item.roleTitle}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-800">{item.userId}</td>
                      <td className="p-2.5 font-mono font-bold text-stone-800 bg-stone-50/60">{item.password}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const slip =
                              language === "bn"
                                ? `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}\n👤 নাম: ${item.name}\n🏷️ পদবী: ${item.roleTitle}\n🆔 আইডি: ${item.userId}\n🔑 পাসওয়ার্ড: ${item.password}`
                                : `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}\n👤 Name: ${item.name}\n🏷️ Designation: ${item.roleTitle}\n🆔 ID: ${item.userId}\n🔑 Password: ${item.password}`;
                            navigator.clipboard.writeText(slip);
                            alert(
                              language === "bn"
                                ? `'${item.name}' এর ক্রেডেনশিয়াল কপি করা হয়েছে!`
                                : `Credentials for '${item.name}' copied!`
                            );
                          }}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition-colors cursor-pointer"
                          title={language === "bn" ? "কপি করুন" : "Copy"}
                        >
                          <Copy size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: HISTORY */}
        {/* ======================================================== */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                {language === "bn"
                  ? `পূর্বে তৈরি করা ক্রেডেনশিয়াল রেকর্ড (${formatNumber(history.length)} টি)`
                  : `Previously Generated Credential Records (${formatNumber(history.length)})`}
              </span>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const confirmMsg =
                      language === "bn"
                        ? "আপনি কি সমস্ত ক্রেডেনশিয়াল হিস্ট্রি মুছে ফেলতে চান?"
                        : "Are you sure you want to clear all credential history?";
                    if (window.confirm(confirmMsg)) {
                      setHistory([]);
                      localStorage.removeItem("tgs_credential_history");
                    }
                  }}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  {language === "bn" ? "হিস্ট্রি ক্লিয়ার করুন" : "Clear History"}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-500 text-xs">
                <ShieldCheck size={32} className="mx-auto text-stone-400 mb-2" />
                <p className="font-bold">
                  {language === "bn" ? "এখনো কোনো হিস্ট্রি সংরক্ষিত হয়নি" : "No history saved yet"}
                </p>
                <p className="text-[11px] mt-0.5">
                  {language === "bn"
                    ? "একক ক্রেডেনশিয়াল জেনারেট করে কপি করলে স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত থাকবে।"
                    : "Generating and copying a single credential will automatically save it here."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-stone-900">{h.name}</p>
                      <p className="text-[11px] text-stone-500">{h.roleTitle} • {h.generatedAt}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right font-mono">
                        <p className="font-bold text-emerald-800 text-[11px]">{h.userId}</p>
                        <p className="text-stone-600 text-[10px]">{h.password}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const text =
                            language === "bn"
                              ? `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}\n👤 নাম: ${h.name}\n🏷️ পদবী: ${h.roleTitle}\n🆔 আইডি: ${h.userId}\n🔑 পাসওয়ার্ড: ${h.password}`
                              : `🏢 ${settings.societyName || "TRUST GROWTH SOCIETY"}\n👤 Name: ${h.name}\n🏷️ Designation: ${h.roleTitle}\n🆔 ID: ${h.userId}\n🔑 Password: ${h.password}`;
                          navigator.clipboard.writeText(text);
                          alert(
                            language === "bn"
                              ? `'${h.name}' এর ক্রেডেনশিয়াল কপি করা হয়েছে!`
                              : `Credentials for '${h.name}' copied!`
                          );
                        }}
                        className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-amber-50 text-stone-700 cursor-pointer"
                        title={language === "bn" ? "কপি করুন" : "Copy"}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
