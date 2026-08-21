import React, { useState } from "react";
import {
  UserPlus,
  PlusCircle,
  Vote,
  Percent,
  Database,
  Settings,
  Download,
  ShieldCheck,
  Building,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Users,
  Bell,
  Sparkles,
  Camera,
  PenTool,
  Lock,
  ArrowRight,
  Layers,
  CheckCircle2,
  Key,
  ToggleLeft,
  ToggleRight,
  Power,
  AlertCircle,
} from "lucide-react";
import { AppSettings, Member, Deposit, Poll, AppNotification } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { AdminCredentialGeneratorModal } from "./AdminCredentialGeneratorModal";
import { MemberLoginManager } from "./MemberLoginManager";
import { SendNotificationManager } from "./SendNotificationManager";
import { isSupabaseConfigured } from "../utils/supabaseClient";
import { UserCog, BellRing } from "lucide-react";

interface AdminPanelProps {
  members: Member[];
  deposits: Deposit[];
  polls: Poll[];
  notifications: AppNotification[];
  settings: AppSettings;
  totalDeposit: number;
  bankBalance: number;
  investBalance: number;
  fundNow: number;
  onOpenAddMember: () => void;
  onOpenAddDeposit: () => void;
  onOpenCloudBackup: () => void;
  onOpenSettings: (initialTab?: "profile" | "logo" | "watermark" | "language" | "signatures" | "fines") => void;
  onUpdateSettings?: (patch: Partial<AppSettings>) => void;
  onSavePoll?: (poll: Poll) => void;
  onNavigateToTab: (tab: any) => void;
  onExportExcel: () => void;
  onOpenAddBank: () => void;
  onOpenAddInvest: () => void;
  onOpenAddExpense: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  members,
  deposits,
  polls,
  notifications,
  settings,
  totalDeposit,
  bankBalance,
  investBalance,
  fundNow,
  onOpenAddMember,
  onOpenAddDeposit,
  onOpenCloudBackup,
  onOpenSettings,
  onUpdateSettings,
  onSavePoll,
  onNavigateToTab,
  onExportExcel,
  onOpenAddBank,
  onOpenAddInvest,
  onOpenAddExpense,
}) => {
  const { language, formatNumber, formatMoney } = useLanguage();
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showLoginManager, setShowLoginManager] = useState(false);
  const [showNotificationManager, setShowNotificationManager] = useState(false);
  const activePolls = polls.filter((p) => p.status === "active");
  const activePollsCount = activePolls.length;
  const isLiveVotingEnabled = settings.isLiveVotingEnabled !== false;

  const handleToggleLiveVoting = () => {
    if (onUpdateSettings) {
      onUpdateSettings({ isLiveVotingEnabled: !isLiveVotingEnabled });
    }
  };

  const handleCloseAllActivePolls = () => {
    if (activePolls.length === 0) {
      alert(language === "bn" ? "বর্তমানে কোনো চলমান লাইভ ভোটিং চালু নেই।" : "No active live polls to close.");
      return;
    }

    if (onSavePoll) {
      activePolls.forEach((p) => {
        const totalVotes = p.votes?.length || 0;
        let leadOptText = "প্রস্তাবনা";
        let maxVotes = 0;
        p.options.forEach((opt) => {
          const optVotes = p.votes?.filter((v) => v.optionId === opt.id).length || 0;
          if (optVotes > maxVotes) {
            maxVotes = optVotes;
            leadOptText = opt.text;
          }
        });

        const pct = totalVotes > 0 ? ((maxVotes / totalVotes) * 100).toFixed(1) : "0";
        const passed23 = totalVotes > 0 && maxVotes / totalVotes >= 2 / 3;

        const resolutionSummary =
          passed23
            ? `সর্বমোট ${totalVotes} জন সদস্যের প্রদত্ত ভোটের ${pct}% (প্রয়োজনীয় ২/৩ সংখ্যাগরিষ্ঠতা অর্জন) সমর্থনে '${leadOptText}' চূড়ান্তভাবে অনুমোদিত ও রেজোলিউশন আকারে গৃহীত হলো।`
            : `সর্বমোট ${totalVotes} জন সদস্যের প্রদত্ত ভোটের মধ্যে সর্বোচ্চ '${leadOptText}' (${pct}%) ভোট পেলেও প্রয়োজনীয় ২/৩ (দুই-তৃতীয়াংশ = ৬৬.৭%) সংখ্যাগরিষ্ঠতা না পাওয়ায় প্রস্তাবটি পাস হয়নি / স্থগিত রাখা হলো।`;

        onSavePoll({
          ...p,
          status: "closed",
          requiresTwoThirds: true,
          twoThirdsPassed: passed23,
          resolutionSummary,
        });
      });
    }

    if (onUpdateSettings) {
      onUpdateSettings({ isLiveVotingEnabled: false });
    }

    alert(
      language === "bn"
        ? `সকল চলমান লাইভ ভোটিং (${activePolls.length} টি) সফলভাবে ক্লোজ / সমাপ্ত করা হয়েছে এবং হোমপেজের লাইভ প্রদর্শন বন্ধ করা হয়েছে।`
        : `All ${activePolls.length} active live polls have been closed and homepage banner turned off.`
    );
  };

  return (
    <div id="admin-panel-tab" className="space-y-6">
      {/* Credential Generator Modal */}
      {showCredentialModal && (
        <AdminCredentialGeneratorModal
          members={members}
          settings={settings}
          onClose={() => setShowCredentialModal(false)}
        />
      )}

      {showLoginManager && (
        <MemberLoginManager
          members={members}
          settings={settings}
          onClose={() => setShowLoginManager(false)}
        />
      )}

      {showNotificationManager && (
        <SendNotificationManager onClose={() => setShowNotificationManager(false)} />
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {language === "bn" ? "অ্যাডমিন ও পরিচালনা প্যানেল" : "Admin & Management Control"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5">
                {language === "bn"
                  ? "সোসাইটির সকল প্রশাসনিক কার্যক্রম, সদস্য এন্ট্রি, ভোটিং, সেটিংস ও ব্যাকআপ কন্ট্রোল"
                  : "Complete management control, member records, deposits, voting polls, settings & backups"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onOpenSettings("profile")}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-700/80 cursor-pointer shadow-xs active:scale-95"
            >
              <Settings size={14} className="text-amber-400" />
              {language === "bn" ? "সোসাইটি সেটিংস" : "Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* 🔴 LIVE VOTING HOMEPAGE ON/OFF MASTER SWITCH */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isLiveVotingEnabled
                ? "bg-red-100 text-red-700 border border-red-200 shadow-inner"
                : "bg-stone-100 text-stone-400 border border-stone-200"
            }`}
          >
            <Power size={22} className={isLiveVotingEnabled ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                {language === "bn"
                  ? "লাইভ ভোটিং হোমপেজ প্রদর্শন কন্ট্রোল"
                  : "Live Voting Homepage Display Toggle"}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  isLiveVotingEnabled
                    ? "bg-red-600 text-white"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {isLiveVotingEnabled
                  ? (language === "bn" ? "🟢 চালু (ON)" : "🟢 ACTIVE")
                  : (language === "bn" ? "⚪ বন্ধ (OFF)" : "⚪ DISABLED")}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {isLiveVotingEnabled
                ? (language === "bn"
                    ? "লাইভ ভোটিং অন থাকায় হোমপেজে লাইভ নোটিফিকেশন ব্যানার এবং সরাসরি ভোট ফলাফল প্রদর্শিত হচ্ছে।"
                    : "Live voting is active. The poll notification and live results are displayed on the home page.")
                : (language === "bn"
                    ? "লাইভ ভোটিং বন্ধ রয়েছে। হোমপেজে কোনো লাইভ নোটিফিকেশন ব্যানার বা ভোটিং ফলাফল দেখানো হবে না।"
                    : "Live voting is disabled. No voting banners or results will be displayed on the homepage.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-wrap">
          {activePollsCount > 0 && (
            <button
              type="button"
              onClick={handleCloseAllActivePolls}
              title="চলমান সকল লাইভ ভোট অবিলম্বে ক্লোজ ও সমাপ্ত করুন"
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-stone-700"
            >
              <AlertCircle size={15} className="text-amber-400" />
              <span>{language === "bn" ? "ভোট ক্লোজ / বন্ধ করুন" : "Close All Polls"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleLiveVoting}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isLiveVotingEnabled
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-800 hover:bg-emerald-700 text-amber-300"
            }`}
          >
            {isLiveVotingEnabled ? (
              <>
                <ToggleRight size={18} />
                {language === "bn" ? "হোমপেজ লাইভ অফ (Hide Banner)" : "Hide Live Banner"}
              </>
            ) : (
              <>
                <ToggleLeft size={18} />
                {language === "bn" ? "হোমপেজ লাইভ অন (Show Banner)" : "Show Live Banner"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab("voting")}
            className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200 cursor-pointer"
          >
            <Vote size={14} className="text-emerald-800" />
            {language === "bn" ? "ভোটিং সেন্টার" : "Voting Center"}
          </button>
        </div>
      </div>

      {/* Main Admin Action Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-600" />
          {language === "bn" ? "প্রধান প্রশাসনিক অপশনসমূহ" : "Core Administrative Operations"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 🔐 Admin & Member Credential Generator */}
          <button
            type="button"
            onClick={() => setShowCredentialModal(true)}
            className="text-left bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-white hover:border-amber-500 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Key size={22} className="text-emerald-950" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-emerald-950 font-bold uppercase tracking-wider">
                🔐 Security Generator
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-amber-950 flex items-center gap-1">
                {language === "bn" ? "আইডি ও পাসওয়ার্ড জেনারেটর" : "ID & Password Generator"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-800" />
              </h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {language === "bn"
                  ? "এডমিন ও সদস্যদের জন্য সুরক্ষিত ইউজার আইডি এবং পাসওয়ার্ড তৈরি, কপি ও বিতরণ স্লিপ"
                  : "Generate secure IDs and strong passwords for admins & members"}
              </p>
            </div>
          </button>

          {/* 🔑 Real Supabase-backed Member/Admin Login Manager */}
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => setShowLoginManager(true)}
              className="text-left bg-gradient-to-br from-emerald-500/10 via-emerald-50/60 to-white hover:border-emerald-500 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <UserCog size={22} />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-bold uppercase tracking-wider">
                  🔗 Supabase
                </span>
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-stone-900 text-base group-hover:text-emerald-950 flex items-center gap-1">
                  {language === "bn" ? "সদস্য লগইন তৈরি ও ব্যবস্থাপনা" : "Member Login Management"}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-800" />
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {language === "bn"
                    ? "মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে বাস্তব লগইন অ্যাকাউন্ট তৈরি করুন (অ্যাপে সত্যিই লগইন করা যাবে)"
                    : "Create real mobile+password logins members can actually sign in with"}
                </p>
              </div>
            </button>
          )}

          {/* 🔔 Push Notification Broadcast (Android bubble notification) */}
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => setShowNotificationManager(true)}
              className="text-left bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-white hover:border-amber-500 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <BellRing size={22} />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-emerald-950 font-bold uppercase tracking-wider">
                  📱 Push
                </span>
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-stone-900 text-base group-hover:text-amber-950 flex items-center gap-1">
                  {language === "bn" ? "পুশ নোটিফিকেশন পাঠান" : "Send Push Notification"}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-800" />
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {language === "bn"
                    ? "যাদের মোবাইলে অ্যাপ ইন্সটল আছে তাদের সবার কাছে বাবল নোটিফিকেশন পাঠান"
                    : "Broadcast a Messenger-style bubble notification to every installed device"}
                </p>
              </div>
            </button>
          )}

          {/* 1. Add New Member */}
          <button
            type="button"
            onClick={onOpenAddMember}
            className="text-left bg-white hover:bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-amber-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserPlus size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono">
                {formatNumber(members.length)} সদস্য
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-amber-950 flex items-center gap-1">
                {language === "bn" ? "নতুন সদস্য যোগ করুন" : "Add New Member"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "নতুন সদস্যের নাম, মোবাইল, নমিনী, ছবি ও শেয়ার তথ্য এন্ট্রি"
                  : "Register new member profile, nominee, share & photo"}
              </p>
            </div>
          </button>

          {/* 2. Add Deposit */}
          <button
            type="button"
            onClick={onOpenAddDeposit}
            className="text-left bg-white hover:bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-emerald-500 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PlusCircle size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold">
                {formatNumber(deposits.length)} ভাউচার
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-emerald-950 flex items-center gap-1">
                {language === "bn" ? "সঞ্চয় জমা এন্ট্রি করুন" : "Add Deposit Entry"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "মাসিক সঞ্চয় জমা, ব্যাংক/ক্যাশ রসিদ ও তাৎক্ষণিক ভাউচার প্রিন্ট"
                  : "Record monthly savings deposit & generate instant receipt"}
              </p>
            </div>
          </button>

          {/* 3. Voting & Notify Center */}
          <button
            type="button"
            onClick={() => onNavigateToTab("voting")}
            className="text-left bg-white hover:bg-red-50/40 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-red-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Vote size={22} />
              </div>
              {activePollsCount > 0 ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
                  🔴 LIVE {activePollsCount}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono">
                  {formatNumber(notifications.length)} নোটিশ
                </span>
              )}
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-red-950 flex items-center gap-1">
                {language === "bn" ? "ভোটিং ও নোটিফাই সেন্টার" : "Voting & Notify Center"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "লাইভ ভোটিং পরিচালনা, নোটিশ প্রকাশ ও সকল মেম্বার আইডিতে ব্রডকাস্ট"
                  : "Launch live voting polls, notices & broadcast to members"}
              </p>
            </div>
          </button>

          {/* 4. Investment Profit Center */}
          <button
            type="button"
            onClick={() => onNavigateToTab("profit_center")}
            className="text-left bg-white hover:bg-blue-50/40 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-blue-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Percent size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold">
                ৫% + ৯৫%
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-blue-950 flex items-center gap-1">
                {language === "bn" ? "ইনভেস্টমেন্ট প্রফিট সেন্টার" : "Investment Profit Center"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "লাভ বন্টন ক্যালকুলেটর, ৫% রিজার্ভ ক্যাপিটাল ও ৯৫% সদস্য মুনাফা"
                  : "5% reserve fund, 95% member profit distribution ledger"}
              </p>
            </div>
          </button>

          {/* 5. Cloud Backup & Restore */}
          <button
            type="button"
            onClick={onOpenCloudBackup}
            className="text-left bg-white hover:bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-stone-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Database size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                JSON / Cloud
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-stone-950 flex items-center gap-1">
                {language === "bn" ? "ব্যাকআপ ও রিস্টোর" : "Backup & Restore"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "সম্পূর্ণ সোসাইটির ডাটা ফাইল ডাউনলোড ও এক ক্লিকে রিস্টোর"
                  : "Download JSON backup and restore society database"}
              </p>
            </div>
          </button>

          {/* 6. Settings & Customizations */}
          <button
            type="button"
            onClick={() => onOpenSettings("profile")}
            className="text-left bg-white hover:bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-stone-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Settings size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">
                Config
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-stone-950 flex items-center gap-1">
                {language === "bn" ? "সোসাইটি সেটিংস" : "Society Settings"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "নাম, লোগো, ওয়াটারমার্ক, স্বাক্ষর ও লেট ফি কনফিগারেশন"
                  : "Name, round logo, watermark, signatures, fines & dates"}
              </p>
            </div>
          </button>

          {/* 7. Export Excel Sheet */}
          <button
            type="button"
            onClick={onExportExcel}
            className="text-left bg-white hover:bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-emerald-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Download size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                .XLSX
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-emerald-950 flex items-center gap-1">
                {language === "bn" ? "এক্সেল শিট এক্সপোর্ট" : "Export Excel Ledger"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "সকল সদস্য ও জমার বিস্তারিত হিসাব এক্সেল শিট ফরম্যাটে ডাউনলোড"
                  : "Download complete members and deposits ledger in Excel sheet"}
              </p>
            </div>
          </button>

          {/* 8. Bank Entry */}
          <button
            type="button"
            onClick={onOpenAddBank}
            className="text-left bg-white hover:bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-stone-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono">
                {formatMoney(bankBalance)}
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-stone-950 flex items-center gap-1">
                {language === "bn" ? "ব্যাংক জমা / উত্তোলন" : "Bank Entry"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-700" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "ব্যাংক একাউন্টে টাকা জমা দেওয়া বা উত্তোলনের ভাউচার এন্ট্রি"
                  : "Record bank deposit or withdrawal transaction"}
              </p>
            </div>
          </button>

          {/* 9. Signatures & Watermark Shortcut */}
          <button
            type="button"
            onClick={() => onOpenSettings("signatures")}
            className="text-left bg-white hover:bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-stone-400 transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PenTool size={22} />
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">
                Signatures
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-stone-900 text-base group-hover:text-stone-950 flex items-center gap-1">
                {language === "bn" ? "স্বাক্ষর ও ডকুমেন্টস সেটিংস" : "Official Signatures"}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-800" />
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {language === "bn"
                  ? "সভাপতি, সাধারণ সম্পাদক ও কোষাধ্যক্ষের ডিজিটাল স্বাক্ষর ও ওয়াটারমার্ক"
                  : "Set authorized digital signatures for receipts & circulars"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
