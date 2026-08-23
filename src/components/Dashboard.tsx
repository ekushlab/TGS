import React, { useState } from "react";
import {
  Wallet,
  Users,
  PlusCircle,
  BookOpen,
  Droplet,
  Landmark,
  TrendingUp,
  Coins,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Vote,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Pin,
  FileText,
  X,
  Calendar,
  Eye,
  Paperclip,
  Download,
} from "lucide-react";
import { Member, Deposit, Poll, AppNotification, AppSettings } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface DashboardProps {
  totalDeposit: number;
  totalFine: number;
  memberCount: number;
  monthlyTotals: { label: string; total: number }[];
  maxMonthly: number;
  recentDeposits: Deposit[];
  members: Member[];
  /** Omit to hide the "Add Deposit" quick button — general members can view but not add entries. */
  onAddDeposit?: () => void;
  bankBalance: number;
  investBalance: number;
  totalProfit: number;
  fundNow: number;
  totalMoney: number;
  cashInHand: number;
  tgsFromInvestProfit?: number;
  tgsDirectIncomes?: number;
  onViewReceipt: (deposit: Deposit) => void;
  activePolls?: Poll[];
  notifications?: AppNotification[];
  onNavigateToVoting?: () => void;
  onNavigateToProfitCenter?: () => void;
  settings?: AppSettings;
}

export function StatCard({
  id,
  label,
  value,
  icon,
  accent,
  subtitle,
}: {
  id?: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-stone-200/90 p-3 sm:p-4 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] sm:text-xs font-semibold text-stone-600 leading-tight">
          {label}
        </p>
        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
      </div>
      <div className="mt-1.5 sm:mt-2">
        <p className="text-base sm:text-xl font-bold font-mono text-stone-900 leading-tight tracking-tight whitespace-nowrap overflow-visible">
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-1 leading-tight truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function Dashboard({
  totalDeposit,
  totalFine,
  memberCount,
  monthlyTotals,
  maxMonthly,
  recentDeposits,
  members,
  onAddDeposit,
  bankBalance,
  investBalance,
  totalProfit,
  fundNow,
  totalMoney,
  cashInHand,
  onViewReceipt,
  activePolls = [],
  notifications = [],
  onNavigateToVoting,
  onNavigateToProfitCenter,
  settings,
}: DashboardProps) {
  const { language, t, tMonth, tMethod, formatNumber, formatUid, formatMoney } = useLanguage();
  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<AppNotification | null>(null);

  const isLiveVotingEnabled = settings?.isLiveVotingEnabled !== false;
  const topActivePoll = activePolls.find((p) => p.status === "active");

  const nameFor = (uid: string) => {
    const m = members.find((mem) => mem.uid === uid);
    if (!m) return uid;
    if (language === 'en' && m.nameEn) return m.nameEn;
    return m.name || uid;
  };

  return (
    <div id="dashboard-tab" className="space-y-5 sm:space-y-6">
      {/* Notice Viewer Modal right on Dashboard (if opened from any source) */}
      {selectedNoticeForModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Bell size={20} />
                </span>
                <div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {language === 'bn' ? "অফিসিয়াল বিজ্ঞপ্তি" : "Official Notice"}
                  </span>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    {language === 'bn' ? `স্মারক নং: ${selectedNoticeForModal.circularNo || "TGS/NOTICE/2026"}` : `Memo No: ${selectedNoticeForModal.circularNo || "TGS/NOTICE/2026"}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoticeForModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono border-b border-stone-100 pb-2">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {language === 'bn' ? `প্রকাশ: ${selectedNoticeForModal.date}` : `Published: ${selectedNoticeForModal.date}`}
                </span>
                <span>{language === 'bn' ? `প্রেরক: ${selectedNoticeForModal.author || "কার্যনির্বাহী কমিটি"}` : `From: ${selectedNoticeForModal.author || "Executive Committee"}`}</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {selectedNoticeForModal.title}
              </h3>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                {selectedNoticeForModal.content}
              </div>

              {/* Notice Attachment if any */}
              {selectedNoticeForModal.attachment && (
                <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <Paperclip size={14} className="text-emerald-700" />
                      {language === 'bn' ? `সংযুক্ত ফাইল: ${selectedNoticeForModal.attachmentName || "Notice Document"}` : `Attached File: ${selectedNoticeForModal.attachmentName || "Notice Document"}`}
                    </span>
                    <a
                      href={selectedNoticeForModal.attachment}
                      download={selectedNoticeForModal.attachmentName || "notice-document"}
                      className="px-2.5 py-1 rounded bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <Download size={12} /> {t.btn_download}
                    </a>
                  </div>
                  {selectedNoticeForModal.attachmentType === "image" ? (
                    <img
                      src={selectedNoticeForModal.attachment}
                      alt="Notice Attachment"
                      className="max-h-72 w-full object-contain rounded-lg border border-stone-200 bg-white"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText size={16} className="text-red-600" />
                        {language === 'bn' ? "PDF ডকুমেন্টস সংযুক্ত" : "PDF Document Attached"}
                      </span>
                      <a
                        href={selectedNoticeForModal.attachment}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline font-bold"
                      >
                        {language === 'bn' ? "ওপেন করুন" : "Open"}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Signatures */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <div className="text-center">
                  {selectedNoticeForModal.signatory2Signature ? (
                    <img
                      src={selectedNoticeForModal.signatory2Signature}
                      alt="Secretary Sign"
                      className="h-9 mx-auto object-contain mb-1"
                    />
                  ) : (
                    <div className="h-6 border-b border-dashed border-stone-400 mb-1 w-24"></div>
                  )}
                  <p className="font-bold text-stone-800 text-[11px]">
                    {selectedNoticeForModal.signatory2Name || (language === 'bn' ? "সাধারণ সম্পাদক" : "General Secretary")}
                  </p>
                  <p className="text-[10px] text-stone-500">{language === 'bn' ? "সাধারণ সম্পাদক" : "General Secretary"}</p>
                </div>

                <div className="text-center">
                  {selectedNoticeForModal.signatory1Signature ? (
                    <img
                      src={selectedNoticeForModal.signatory1Signature}
                      alt="President Sign"
                      className="h-9 mx-auto object-contain mb-1"
                    />
                  ) : (
                    <div className="h-6 border-b border-dashed border-stone-400 mb-1 w-24"></div>
                  )}
                  <p className="font-bold text-stone-800 text-[11px]">
                    {selectedNoticeForModal.signatory1Name || (language === 'bn' ? "সভাপতি" : "President")}
                  </p>
                  <p className="text-[10px] text-stone-500">{language === 'bn' ? "সভাপতি" : "President"}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNoticeForModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {t.modal_close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Conditional Live Voting Notification & Results Banner on Homepage */}
      {isLiveVotingEnabled && topActivePoll && (
        <div className="bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-red-500/40 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-3.5">
            {/* 1. Live Notification Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider animate-pulse shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block"></span>
                  {language === "bn" ? "লাইভ ভোটিং নোটিফিকেশন" : "Live Voting Notification"}
                </span>
                <span className="text-xs text-amber-300 font-mono">
                  {topActivePoll.category === "election"
                    ? language === "bn" ? "নির্বাচনী ভোট" : "Election Vote"
                    : language === "bn" ? "সাংগঠনিক সিদ্ধান্ত" : "Organizational Poll"}
                </span>
              </div>

              {topActivePoll.endDate && (
                <span className="text-[11px] text-emerald-200/90 font-mono flex items-center gap-1">
                  <Calendar size={13} className="text-amber-400" />
                  {language === "bn" ? "ভোটের সময়সীমা:" : "Deadline:"} {topActivePoll.endDate}
                </span>
              )}
            </div>

            {/* Poll Title / Question */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {topActivePoll.title}
              </h3>
              {topActivePoll.description && (
                <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                  {topActivePoll.description}
                </p>
              )}
            </div>

            {/* 2. Live Vote Results Progress Bars (শুধুমাত্র ফলাফল প্রদর্শনী) */}
            <div className="bg-emerald-950/70 rounded-xl p-3.5 border border-emerald-800/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between text-xs text-amber-200 font-bold border-b border-emerald-800/60 pb-1.5 gap-2">
                <span className="flex items-center gap-1.5">
                  {language === "bn" ? "ভোটিং লাইভ ফলাফল" : "Live Poll Results"}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-semibold font-mono">
                    {language === "bn"
                      ? `পাস লক্ষ্য: মোটের ২/৩ বা ${formatNumber(Math.ceil((members.length * 2) / 3))} ভোট`
                      : `Pass Goal: 2/3 or ${Math.ceil((members.length * 2) / 3)} votes`}
                  </span>
                </span>
                <span className="font-mono text-emerald-300">
                  {language === "bn" ? "মোট ভোট:" : "Total Votes:"}{" "}
                  {formatNumber(topActivePoll.votes?.length || 0)} / {formatNumber(members.length)}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {topActivePoll.options.map((opt, idx) => {
                  const total = topActivePoll.votes?.length || 0;
                  const totalMembersCount = members.length || 1;
                  const required23 = Math.ceil((totalMembersCount * 2) / 3);
                  const optionVotes = topActivePoll.votes?.filter((v) => v.optionId === opt.id).length || 0;
                  const pct = total > 0 ? Math.round((optionVotes / total) * 100) : 0;
                  const pctOfTotal = Math.round((optionVotes / totalMembersCount) * 100);
                  const hasReached23 = optionVotes >= required23;

                  const barColors = [
                    "bg-emerald-500",
                    "bg-amber-400",
                    "bg-blue-400",
                    "bg-purple-400",
                    "bg-rose-400",
                  ];
                  const colorClass = hasReached23 ? "bg-emerald-400" : barColors[idx % barColors.length];

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-200 truncate pr-2 flex items-center gap-1">
                          {opt.text}
                          {hasReached23 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white font-bold">
                              {language === 'bn' ? "✅ ২/৩ পাস" : "✅ 2/3 Passed"}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-emerald-200/80 font-mono">
                            {language === 'bn' ? `(মোটের ${formatNumber(pctOfTotal)}%)` : `(of total ${formatNumber(pctOfTotal)}%)`}
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            {formatNumber(pct)}% ({formatNumber(optionVotes)} {language === "bn" ? "ভোট" : "votes"})
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-stone-800/90 h-2.5 rounded-full overflow-hidden border border-emerald-900/80">
                        <div
                          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Link to Notification & Voting Center */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-400">
                {language === "bn"
                  ? "* অন্যান্য বিস্তারিত দেখতে ও ভোট প্রদান করতে নোটিফিকেশন সেন্টারে যান"
                  : "* Go to Notification Center to view details & cast your vote"}
              </span>
              <button
                type="button"
                onClick={onNavigateToVoting}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
              >
                <span>{language === "bn" ? "নোটিফিকেশন সেন্টার" : "Notify Center"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Financial Overview Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          id="stat-total-deposits"
          label={t.stat_total_collection}
          value={formatMoney(totalDeposit)}
          icon={<Wallet size={18} className="text-emerald-800" />}
          accent="bg-emerald-100"
          subtitle={language === 'bn' ? `${formatNumber(memberCount)} জন সদস্যের জমা` : `Deposited by ${formatNumber(memberCount)} members`}
        />
        <StatCard
          id="stat-cash-in-hand"
          label={language === 'bn' ? "হাতে নগদ ক্যাশ" : "Cash in Hand"}
          value={formatMoney(cashInHand)}
          icon={<Coins size={18} className="text-amber-800" />}
          accent="bg-amber-100"
          subtitle={language === 'bn' ? "বর্তমান ট্রেজারি ব্যালেন্স" : "Current treasury balance"}
        />
        <StatCard
          id="stat-bank-balance"
          label={t.stat_bank_reserve}
          value={formatMoney(bankBalance)}
          icon={<Landmark size={18} className="text-blue-800" />}
          accent="bg-blue-100"
          subtitle={language === 'bn' ? "সঞ্চয়ী ও চলতি হিসাব" : "Current & savings account"}
        />
        <StatCard
          id="stat-invest-balance"
          label={t.stat_invested_capital}
          value={formatMoney(investBalance)}
          icon={<TrendingUp size={18} className="text-purple-800" />}
          accent="bg-purple-100"
          subtitle={`${language === 'bn' ? 'মোট মুনাফা' : 'Total Profit'}: ${formatMoney(totalProfit)}`}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-stone-50 p-3 sm:p-3.5 rounded-xl border border-stone-200 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-200/60 flex items-center justify-center text-emerald-900 shrink-0">
            <Users size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-stone-500 block truncate">{t.stat_total_members}</span>
            <p className="font-bold text-xs sm:text-sm text-stone-800 whitespace-nowrap">
              {formatNumber(memberCount)} {language === 'bn' ? 'জন' : 'Members'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-200/60 flex items-center justify-center text-emerald-900 shrink-0">
            <BookOpen size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-stone-500 block truncate">{language === 'bn' ? "গড় জমা / সদস্য" : "Avg Deposit / Member"}</span>
            <p className="font-bold text-xs sm:text-sm text-stone-800 font-mono whitespace-nowrap">
              {formatMoney(memberCount ? Math.round(totalDeposit / memberCount) : 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-200/60 flex items-center justify-center text-amber-900 shrink-0">
            <PiggyBank size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-stone-500 block truncate">{t.stat_fund_balance}</span>
            <p className="font-bold text-xs sm:text-sm text-stone-800 font-mono whitespace-nowrap">{formatMoney(fundNow)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <Droplet size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-stone-500 block truncate">{language === 'bn' ? "মোট জরিমানা" : "Total Late Fees"}</span>
            <p className="font-bold text-xs sm:text-sm text-stone-800 font-mono whitespace-nowrap">{formatMoney(totalFine)}</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart and Net Capital Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-800 text-sm sm:text-base">
              {t.sec_capital_growth} ({language === 'bn' ? '২০২৫-২৬' : '2025-26'})
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {language === 'bn' ? "সর্বশেষ ৬ মাস" : "Last 6 Months"}
            </span>
          </div>
          <div className="flex items-end gap-2.5 sm:gap-4 h-40 pt-4 px-2">
            {monthlyTotals.map((m) => {
              const heightPercent = maxMonthly > 0 ? Math.max(8, (m.total / maxMonthly) * 100) : 8;
              const formattedLabel = tMonth(m.label);
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] text-stone-600 font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.total > 0 ? (language === 'bn' ? formatNumber((m.total / 1000).toFixed(1)) + "k" : (m.total / 1000).toFixed(1) + "k") : (language === 'bn' ? "০" : "0")}
                  </span>
                  <div
                    className="w-full bg-emerald-700/90 group-hover:bg-amber-500 rounded-t-md transition-all duration-300 relative"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-t-md"></div>
                  </div>
                  <span className="text-[11px] font-medium text-stone-600 truncate max-w-full">{formattedLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Distribution and Integrated Reconciliation summary box */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-800 text-sm sm:text-base">
                {language === 'bn' ? "সমিতির সর্বমোট স্থিতি" : "Total Net Society Balance"}
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {language === 'bn' ? "সমন্বিত অডিট" : "Audited Net"}
              </span>
            </div>
            
            <div className="p-4 bg-emerald-900 text-amber-50 rounded-xl mb-4 shadow-xs">
              <span className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
                {language === 'bn' ? "নেট ক্যাপিটাল ও ফান্ড" : "Net Capital & Funds"}
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-amber-300 font-mono mt-1">{formatMoney(totalMoney)}</p>
              <div className="mt-2 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-emerald-200">
                <span>{language === 'bn' ? "হাতে নগদ + ব্যাংক + বিনিয়োগ" : "Cash + Bank + Invest"}</span>
                <span className="font-mono text-amber-300 font-bold">= {formatMoney(cashInHand + bankBalance + investBalance)}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>📍</span> {language === 'bn' ? "সম্পদ অবস্থান (Asset Distribution)" : "Asset Distribution"}
              </p>
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <Coins size={13} className="text-amber-700" /> {language === 'bn' ? 'হাতে নগদ ক্যাশ' : 'Cash in Hand'}
                </span>
                <span className="font-mono font-bold text-amber-900">{formatMoney(cashInHand)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <Landmark size={13} className="text-blue-700" /> {language === 'bn' ? 'ব্যাংক আমানত' : 'Bank Reserve'}
                </span>
                <span className="font-mono font-bold text-blue-900">{formatMoney(bankBalance)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <TrendingUp size={13} className="text-purple-700" /> {language === 'bn' ? 'চলমান বিনিয়োগ' : 'Invested Assets'}
                </span>
                <span className="font-mono font-bold text-purple-900">{formatMoney(investBalance)}</span>
              </div>
              
              <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider pt-2 mb-1 flex items-center gap-1">
                <span>📑</span> {language === 'bn' ? "উৎস ও ফান্ড (Capital Sources)" : "Capital Sources"}
              </p>
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-700" /> {language === 'bn' ? 'সদস্য সঞ্চয়' : 'Member Savings'}</span>
                <span className="font-mono font-semibold text-stone-800">{formatMoney(totalDeposit)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-700" /> {language === 'bn' ? 'মোট অর্জিত মুনাফা' : 'Total Profit'}</span>
                <span className="font-mono font-semibold text-emerald-800">{formatMoney(totalProfit)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-700" /> {language === 'bn' ? 'কল্যাণ ফান্ড অবশিষ্ট' : 'Welfare Fund'}</span>
                <span className="font-mono font-semibold text-stone-800">{formatMoney(fundNow)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deposits List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50/60">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-emerald-800" />
            <h3 className="font-bold text-stone-800 text-sm sm:text-base">{t.sec_recent_activities}</h3>
          </div>
          {onAddDeposit && (
          <button
            id="dashboard-add-deposit-btn"
            onClick={onAddDeposit}
            className="text-xs sm:text-sm bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} /> {t.btn_add_deposit}
          </button>
          )}
        </div>

        <div className="divide-y divide-stone-100">
          {recentDeposits.map((d) => (
            <div
              key={d.id}
              className="px-5 py-3.5 flex items-center justify-between text-sm hover:bg-stone-50/80 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 truncate">{nameFor(d.memberUid)}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  <span className="font-mono text-stone-600 font-medium">{formatUid(d.memberUid)}</span> · {tMonth(d.month)} · {formatNumber(d.date)} · {tMethod(d.method)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-900 text-base">{formatMoney(d.amount)}</span>
                  {Number(d.fine) > 0 && (
                    <p className="text-[11px] text-red-600 font-mono">{language === 'bn' ? 'জরিমানা' : 'Fine'} {formatMoney(d.fine)}</p>
                  )}
                </div>
                <button
                  onClick={() => onViewReceipt(d)}
                  title={t.btn_view_receipt}
                  className="p-1.5 text-stone-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                >
                  <Receipt size={16} />
                </button>
              </div>
            </div>
          ))}
          {recentDeposits.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-stone-400">{t.no_data_found}</p>
          )}
        </div>
      </div>
    </div>
  );
}

