import React, { useState, useMemo, useRef } from "react";
import {
  TrendingUp,
  Percent,
  Coins,
  Calculator,
  Download,
  FileText,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  DollarSign,
  Wallet,
  X,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { toPng, toJpeg } from "html-to-image";
import {
  Member,
  Deposit,
  AccountEntry,
  ProfitDistribution,
  ProfitShareItem,
  AppSettings,
} from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { TgsLogoSvg, PageWatermark } from "./TgsLogoWatermark";

interface ProfitCenterProps {
  members: Member[];
  deposits: Deposit[];
  investEntries: AccountEntry[];
  profitDistributions: ProfitDistribution[];
  settings: AppSettings;
  /** Omit to hide the "Save Distribution Run" button — Super Admin only. */
  onSaveDistribution?: (dist: ProfitDistribution) => void;
  onDeleteDistribution?: (distId: string) => void;
}

// Helper to parse DD/MM/YYYY or YYYY-MM-DD to timestamp
function parseDateStrToTimestamp(str: string): number {
  if (!str) return Date.now();
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      // DD/MM/YYYY
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d, 23, 59, 59).getTime();
    }
  } else if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) {
      // YYYY-MM-DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d, 23, 59, 59).getTime();
    }
  }
  const t = Date.parse(str);
  return isNaN(t) ? Date.now() : t;
}

export function ProfitCenter({
  members,
  deposits,
  investEntries,
  profitDistributions,
  settings,
  onSaveDistribution,
}: ProfitCenterProps) {
  const { language, t, formatNumber, formatMoney, formatUid } = useLanguage();

  // Investment Selection / Input State
  const [selectedInvestId, setSelectedInvestId] = useState<string>("custom");
  const [customTitle, setCustomTitle] = useState<string>(
    language === "bn" ? "সাভার বাণিজ্যিক প্রকল্পে লাভজনক বিনিয়োগ" : "Profitable Investment in Savar Commercial Project"
  );
  const [investmentAmount, setInvestmentAmount] = useState<number>(100000);
  const [profitAmount, setProfitAmount] = useState<number>(20000);
  const [investmentDate, setInvestmentDate] = useState<string>(
    new Date().toLocaleDateString("en-GB")
  );

  // Search & Filter in Table
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string>("");

  // Modal Statement Preview State
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "jpg" | null>(null);

  const statementRef = useRef<HTMLDivElement>(null);

  // If user selects an existing investment entry from ledger
  const handleSelectExistingInvest = (id: string) => {
    setSelectedInvestId(id);
    if (id === "custom") return;

    const entry = investEntries.find((e) => e.id === id);
    if (entry) {
      setCustomTitle(entry.desc || (language === "bn" ? "বিনিয়োগ প্রকল্প" : "Investment Project"));
      setInvestmentAmount(entry.amount || 0);
      setProfitAmount(entry.dividend || 0);
      setInvestmentDate(entry.date || new Date().toLocaleDateString("en-GB"));
    }
  };

  // MATHEMATICAL CORE:
  // 1. Calculate each member's cumulative deposits up to the investment date
  // 2. Compute pro-rata ratio: (Member Deposit at Date) / (Total Society Deposits at Date)
  // 3. Compute 5% TGS Welfare Fund & 95% Distributable Members Pool
  // 4. Compute each member's capital share and 95% profit payout!
  const calculation = useMemo(() => {
    const investTimestamp = parseDateStrToTimestamp(investmentDate);

    // Filter deposits up to investment date
    const memberDepositsMap: Record<string, number> = {};
    members.forEach((m) => {
      memberDepositsMap[m.uid] = 0;
    });

    deposits.forEach((d) => {
      const depositTimestamp = parseDateStrToTimestamp(d.date);
      if (depositTimestamp <= investTimestamp) {
        memberDepositsMap[d.memberUid] = (memberDepositsMap[d.memberUid] || 0) + (d.amount || 0);
      }
    });

    const totalDepositsAtDate = Object.values(memberDepositsMap).reduce((a, b) => a + b, 0);

    // 5% TGS Welfare Cut & 95% Members Pool
    const tgsFundPercent = 5;
    const membersPercent = 95;
    const tgsFundAmount = Math.round((profitAmount * tgsFundPercent) / 100);
    const membersPoolAmount = profitAmount - tgsFundAmount; // Exact 95%

    const shares: ProfitShareItem[] = members.map((m) => {
      const depositAtDate = memberDepositsMap[m.uid] || 0;
      const ratio = totalDepositsAtDate > 0 ? depositAtDate / totalDepositsAtDate : 0;
      const capitalShare = Math.round(investmentAmount * ratio);
      const memberProfit = Math.round(membersPoolAmount * ratio);

      return {
        memberUid: m.uid,
        memberName: m.name,
        memberMobile: m.mobile,
        depositAtInvestDate: depositAtDate,
        ratio: ratio,
        capitalShare: capitalShare,
        profitShare: memberProfit,
        status: "calculated",
      };
    });

    return {
      totalDepositsAtDate,
      tgsFundAmount,
      membersPoolAmount,
      shares,
    };
  }, [members, deposits, investmentDate, investmentAmount, profitAmount]);

  const filteredShares = calculation.shares.filter((s) => {
    const q = memberSearch.toLowerCase();
    return (
      s.memberName.toLowerCase().includes(q) ||
      s.memberUid.toLowerCase().includes(q) ||
      (s.memberMobile && s.memberMobile.includes(q))
    );
  });

  // Save distribution run to history
  const handleSaveRun = () => {
    if (!onSaveDistribution) return;
    const run: ProfitDistribution = {
      id: `pdist-${Date.now()}`,
      title: customTitle.trim() || (language === "bn" ? "বিনিয়োগ প্রফিট শেয়ারিং হিসাব" : "Investment Profit Sharing Statement"),
      investEntryId: selectedInvestId !== "custom" ? selectedInvestId : undefined,
      investmentTitle: customTitle.trim(),
      investmentAmount: investmentAmount,
      investmentDate: investmentDate,
      profitAmount: profitAmount,
      tgsFundPercent: 5,
      membersPercent: 95,
      tgsFundAmount: calculation.tgsFundAmount,
      membersPoolAmount: calculation.membersPoolAmount,
      totalSocietyDepositsAtDate: calculation.totalDepositsAtDate,
      eligibleMembersCount: calculation.shares.filter((s) => s.depositAtInvestDate > 0).length,
      calculatedAt: `${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      shares: calculation.shares,
      status: "finalized",
    };

    onSaveDistribution(run);
    setSavedSuccessMsg(
      language === "bn"
        ? "প্রফিট বণ্টন বিবরণী সফলভাবে সংরক্ষিত হয়েছে!"
        : "Profit distribution sheet saved successfully!"
    );
    setTimeout(() => setSavedSuccessMsg(""), 4000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = language === "bn" ? [
      "ক্রমিক",
      "সদস্য আইডি",
      "সদস্যের নাম",
      "মোবাইল নম্বর",
      "বিনিয়োগ তারিখে মোট জমা (৳)",
      "অংশীদারিত্ব অনুপাত (%)",
      "বিনিয়োগে মূলধন অংশ (৳)",
      "৯৫% মুনাফা লভ্যাংশ (৳)",
    ] : [
      "SL",
      "Member ID",
      "Member Name",
      "Mobile Number",
      "Total Deposit at Investment Date (৳)",
      "Share Ratio (%)",
      "Capital Share in Investment (৳)",
      "95% Profit Share (৳)",
    ];

    const rows = calculation.shares.map((s, idx) => [
      idx + 1,
      s.memberUid,
      s.memberName,
      s.memberMobile || "-",
      s.depositAtInvestDate,
      `${(s.ratio * 100).toFixed(2)}%`,
      s.capitalShare,
      s.profitShare,
    ]);

    // Add summary row at bottom
    rows.push([
      language === "bn" ? "মোট" : "Total",
      "-",
      language === "bn" ? `${calculation.shares.length} জন সদস্য` : `${calculation.shares.length} Members`,
      "-",
      calculation.totalDepositsAtDate,
      "100.00%",
      investmentAmount,
      calculation.membersPoolAmount,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([
      [language === "bn"
        ? `ট্রাস্ট গ্রোথ সোসাইটি - বিনিয়োগ প্রফিট বণ্টন বিবরণী`
        : `Trust Growth Society - Investment Profit Distribution Statement`],
      [language === "bn"
        ? `প্রকল্প: ${customTitle} | বিনিয়োগ মূলধন: ৳${investmentAmount} | মোট মুনাফা: ৳${profitAmount}`
        : `Project: ${customTitle} | Investment Capital: ৳${investmentAmount} | Total Profit: ৳${profitAmount}`],
      [language === "bn"
        ? `টিজিএস ৫% কল্যাণ ফান্ড: ৳${calculation.tgsFundAmount} | সদস্যদের ৯৫% মোট পুল: ৳${calculation.membersPoolAmount}`
        : `TGS 5% Welfare Fund: ৳${calculation.tgsFundAmount} | Members' 95% Total Pool: ৳${calculation.membersPoolAmount}`],
      [language === "bn" ? `তারিখ: ${investmentDate}` : `Date: ${investmentDate}`],
      [],
      headers,
      ...rows,
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit_Distribution");
    XLSX.writeFile(wb, `TGS-Profit-Distribution-${investmentDate.replace(/\//g, "-")}.xlsx`);
  };

  // Export Statement to PDF / JPG
  const handleExportStatement = async (format: "pdf" | "jpg") => {
    if (!statementRef.current) return;
    setIsExporting(true);
    setExportFormat(format);

    try {
      await new Promise((r) => setTimeout(r, 200));
      const element = statementRef.current;
      const fileName = `TGS-Profit-Share-Statement-${investmentDate.replace(/\//g, "-")}`;

      if (format === "jpg") {
        const dataUrl = await toJpeg(element, {
          quality: 0.98,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });
        const link = document.createElement("a");
        link.download = `${fileName}.jpg`;
        link.href = dataUrl;
        link.click();
      } else {
        const dataUrl = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          quality: 0.98,
        });
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error("Export error", err);
      alert(language === "bn" ? "ডকুমেন্ট ডাউনলোড করতে সমস্যা হয়েছে।" : "Failed to export statement.");
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div id="profit-center" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <TrendingUp size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {language === "bn" ? "বিনিয়োগ প্রফিট সেন্টার" : "Investment Profit Center"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[11px] font-bold shadow-xs">
                  {language === "bn" ? "টিজিএস ৫% + মেম্বার ৯৫%" : "TGS 5% + Member 95%"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                {language === "bn"
                  ? "বিনিয়োগের তারিখ অনুযায়ী সদস্যদের জমার অনুপাতে স্বয়ংক্রিয় মূলধন ও ৯৫% মুনাফা বণ্টনের নির্ভুল হিসাব"
                  : "Automated pro-rata 95% member profit distribution based on deposit shares at investment date"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStatementModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText size={15} />
              {language === "bn" ? "অফিসিয়াল স্টেটমেন্ট (PDF/JPG)" : "Official Statement"}
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-700 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              Excel
            </button>
          </div>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 animate-fade-in font-medium">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Control Panel: Select or Input Investment Parameters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <Calculator size={18} className="text-emerald-800" />
            {language === "bn" ? "বিনিয়োগ ও মুনাফা ক্যালকুলেটর" : "Investment & Profit Parameters"}
          </h3>
          <span className="text-[11px] text-stone-500 font-medium">
            {language === "bn" ? "তারিখ অনুযায়ী জমাকৃত ফান্ড থেকে স্বয়ংক্রিয় রেশিও হিসাব" : "Auto pro-rata ratio"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Select Existing Investment from Ledger or Custom */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {language === "bn" ? "১. বিনিয়োগ নির্বাচন / সোর্স" : "1. Select Investment / Source"}
            </label>
            <select
              value={selectedInvestId}
              onChange={(e) => handleSelectExistingInvest(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="custom">
                {language === "bn" ? "✏️ নতুন বা কাস্টম বিনিয়োগ হিসাব" : "✏️ New or Custom Investment"}
              </option>
              {investEntries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.desc} (৳{e.amount} - {e.date})
                </option>
              ))}
            </select>
          </div>

          {/* Investment Project Title */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {language === "bn" ? "২. প্রকল্পের নাম / বিবরণ" : "2. Project Name / Description"}
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={language === "bn" ? "প্রকল্পের বিবরণ..." : "Project description..."}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Capital Amount */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {language === "bn" ? "৩. বিনিয়োগ মূলধন (৳) *" : "3. Investment Capital (৳) *"}
            </label>
            <input
              type="number"
              min="0"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value) || 0)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Profit Dividend Amount */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {language === "bn" ? "৪. অর্জিত মোট মুনাফা (৳) *" : "4. Total Profit Earned (৳) *"}
            </label>
            <input
              type="number"
              min="0"
              value={profitAmount}
              onChange={(e) => setProfitAmount(Number(e.target.value) || 0)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-stone-700">
              {language === "bn" ? "বিনিয়োগ তারিখ (Cut-off Date):" : "Investment Date (Cut-off Date):"}
            </span>
            <input
              type="text"
              value={investmentDate}
              onChange={(e) => setInvestmentDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-stone-800 font-mono text-xs w-32 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <span className="text-[11px] text-stone-400 italic">
              {language === "bn"
                ? "(এই তারিখ পর্যন্ত সদস্যদের সঞ্চয় জমার ভিত্তিতে রেশিও নির্ণয় হবে)"
                : "(Ratio is calculated based on members' deposits up to this date)"}
            </span>
          </div>

          {onSaveDistribution && (
            <button
              type="button"
              onClick={handleSaveRun}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Save size={14} />
              {language === "bn" ? "হিসাবটি ডাটাবেজে সংরক্ষণ করুন" : "Save Distribution Run"}
            </button>
          )}
        </div>
      </div>

      {/* Primary Mathematical Profit Breakdown Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Invested */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <p className="text-[11px] text-stone-500 font-semibold">
            {language === "bn" ? "মোট বিনিয়োগ মূলধন" : "Total Investment Capital"}
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-stone-900 mt-1">
            {formatMoney(investmentAmount)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {language === "bn" ? "প্রকল্পে নিয়োজিত মোট টাকা" : "Total funds committed to the project"}
          </p>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <p className="text-[11px] text-stone-500 font-semibold">
            {language === "bn" ? "মোট অর্জিত মুনাফা" : "Total Profit Earned"}
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-800 mt-1">
            {formatMoney(profitAmount)}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {language === "bn"
              ? `মুনাফার হার: ${investmentAmount > 0 ? ((profitAmount / investmentAmount) * 100).toFixed(1) : 0}%`
              : `Profit Rate: ${investmentAmount > 0 ? ((profitAmount / investmentAmount) * 100).toFixed(1) : 0}%`}
          </p>
        </div>

        {/* 5% TGS Welfare Fund */}
        <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-amber-900 font-bold">
              {language === "bn" ? "টিজিএস ৫% কল্যাণ ফান্ড" : "TGS 5% Welfare Fund"}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 font-mono">5%</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-amber-950 mt-1">
            {formatMoney(calculation.tgsFundAmount)}
          </p>
          <p className="text-[10px] text-amber-800 mt-0.5">
            {language === "bn" ? "সংগঠন কল্যাণ তহবিলে জমা" : "Deposited to organization welfare fund"}
          </p>
        </div>

        {/* 95% Members Pool */}
        <div className="bg-emerald-50/80 rounded-xl border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-950 font-bold">
              {language === "bn" ? "মেম্বারদের ৯৫% প্রফিট পুল" : "Members' 95% Profit Pool"}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-950 font-mono">95%</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-950 mt-1">
            {formatMoney(calculation.membersPoolAmount)}
          </p>
          <p className="text-[10px] text-emerald-800 mt-0.5">
            {language === "bn" ? "সকল সদস্যের মাঝে বণ্টনযোগ্য" : "Distributable among all members"}
          </p>
        </div>

        {/* Total Fund at Date */}
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 shadow-xs col-span-2 lg:col-span-1">
          <p className="text-[11px] text-stone-500 font-semibold">
            {language === "bn" ? "তারিখে মোট জমা ফান্ড" : "Total Deposited Fund at Date"}
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-stone-800 mt-1">
            {formatMoney(calculation.totalDepositsAtDate)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {language === "bn"
              ? `যোগ্য সদস্য: ${calculation.shares.filter((s) => s.depositAtInvestDate > 0).length} জন`
              : `Eligible Members: ${calculation.shares.filter((s) => s.depositAtInvestDate > 0).length}`}
          </p>
        </div>
      </div>

      {/* Member-by-Member Distribution Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              {language === "bn" ? "সদস্যভিত্তিক স্বয়ংক্রিয় প্রফিট বণ্টন তালিকা" : "Member Pro-Rata Distribution Table"}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === "bn"
                ? "জমার আনুপাতিক হার অনুযায়ী প্রত্যেকের মূলধন অংশ ও ৯৫% মুনাফার সুনির্দিষ্ট বিভাজন"
                : "Individual capital contribution and 95% profit entitlement breakdown"}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder={language === "bn" ? "সদস্যের নাম বা আইডি খুঁজুন..." : "Search member name or ID..."}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                <th className="p-3 text-center w-12">{language === "bn" ? "ক্র:" : "SL:"}</th>
                <th className="p-3 text-center">{language === "bn" ? "সদস্য আইডি" : "Member ID"}</th>
                <th className="p-3">{language === "bn" ? "সদস্যের নাম" : "Member Name"}</th>
                <th className="p-3 text-right">{language === "bn" ? "বিনিয়োগ তারিখে জমা" : "Deposit at Investment Date"}</th>
                <th className="p-3 text-center">{language === "bn" ? "অংশীদারিত্ব অনুপাত (%)" : "Share Ratio (%)"}</th>
                <th className="p-3 text-right">{language === "bn" ? "বিনিয়োগকৃত মূলধন অংশ" : "Invested Capital Share"}</th>
                <th className="p-3 text-right font-bold text-emerald-950">{language === "bn" ? "৯৫% মুনাফা লভ্যাংশ" : "95% Profit Share"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredShares.map((s, idx) => (
                <tr key={s.memberUid} className="hover:bg-stone-50/80 transition-colors">
                  <td className="p-3 text-center font-mono text-stone-400">{formatNumber(idx + 1)}</td>
                  <td className="p-3 text-center font-mono text-stone-600 font-semibold">{formatUid(s.memberUid)}</td>
                  <td className="p-3">
                    <span className="font-bold text-stone-900 block">{s.memberName}</span>
                    {s.memberMobile && <span className="text-[10px] text-stone-400 font-mono">{s.memberMobile}</span>}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-stone-800">
                    {formatMoney(s.depositAtInvestDate)}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-amber-900">
                    {(s.ratio * 100).toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-stone-700">
                    {formatMoney(s.capitalShare)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-800 text-sm">
                    {formatMoney(s.profitShare)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Footer Row */}
            <tfoot>
              <tr className="bg-stone-100/90 font-bold border-t-2 border-stone-300 text-stone-900">
                <td className="p-3 text-center" colSpan={3}>
                  {language === "bn"
                    ? `মোট সর্বমোট (${calculation.shares.length} জন সদস্য)`
                    : `Grand Total (${calculation.shares.length} Members)`}
                </td>
                <td className="p-3 text-right font-mono">{formatMoney(calculation.totalDepositsAtDate)}</td>
                <td className="p-3 text-center font-mono text-emerald-900">100.00%</td>
                <td className="p-3 text-right font-mono">{formatMoney(investmentAmount)}</td>
                <td className="p-3 text-right font-mono text-emerald-900 text-sm">
                  {formatMoney(calculation.membersPoolAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL: OFFICIAL PROFIT DISTRIBUTION STATEMENT (PDF & JPG) */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[92vh]">
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {language === "bn" ? "অফিসিয়াল বিনিয়োগ মুনাফা বণ্টনপত্র" : "Investment Profit Share Statement"}
                  </h3>
                  <p className="text-[11px] text-emerald-300">{language === "bn" ? "পিডিএফ এবং জেপিজি উভয় ফরম্যাটে ডাউনলোড করুন" : "Download in both PDF and JPG formats"}</p>
                </div>
              </div>

              <button
                onClick={() => setShowStatementModal(false)}
                className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Printable Statement */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100 flex justify-center">
              <div
                ref={statementRef}
                className="bg-white text-stone-900 p-6 sm:p-8 rounded-xl shadow-sm border border-stone-200 w-full max-w-[800px] relative font-sans text-xs"
                style={{ minHeight: "800px" }}
              >
                {/* Official Watermark */}
                <PageWatermark settings={settings} />

                {/* Society Official Letterhead */}
                <div className="text-center pb-4 border-b-2 border-emerald-900">
                  <div className="flex justify-center mb-2">
                    <TgsLogoSvg size={50} logoUrl={settings.logoUrl} />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-emerald-950 uppercase tracking-tight">
                    {settings.societyName || (language === "bn" ? "ট্রাস্ট গ্রোথ সোসাইটি" : "Trust Growth Society")}
                  </h1>
                  <p className="text-[11px] text-stone-600">
                    {settings.societyAddress || (language === "bn" ? "উলানিয়া বাজার, গলাচিপা, পটুয়াখালী" : "Ulania Bazar, Galachipa, Patuakhali")}
                  </p>
                  <div className="mt-2 inline-block px-4 py-1 rounded-full bg-emerald-900 text-amber-300 font-bold text-xs">
                    {language === "bn" ? "বিনিয়োগ মুনাফা বণ্টন ও লভ্যাংশ বিবরণী (৫% টিজিএস + ৯৫% মেম্বার)" : "Investment Profit Distribution & Dividend Statement (5% TGS + 95% Member)"}
                  </div>
                </div>

                {/* Investment Meta Summary Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 bg-stone-50 p-3.5 rounded-lg border border-stone-200 text-[11px]">
                  <div>
                    <span className="text-stone-500">{language === "bn" ? "প্রকল্পের নাম: " : "Project Name: "}</span>
                    <strong className="text-stone-900 block truncate">{customTitle}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">{language === "bn" ? "বিনিয়োগ মূলধন: " : "Investment Capital: "}</span>
                    <strong className="text-stone-900 block font-mono">{formatMoney(investmentAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">{language === "bn" ? "মোট মুনাফা: " : "Total Profit: "}</span>
                    <strong className="text-emerald-800 block font-mono">{formatMoney(profitAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">{language === "bn" ? "তারিখ: " : "Date: "}</span>
                    <strong className="text-stone-900 block font-mono">{investmentDate}</strong>
                  </div>
                </div>

                {/* Pool Allocation Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                    <span className="text-amber-900 font-bold">{language === "bn" ? "টিজিএস ৫% কল্যাণ ফান্ড: " : "TGS 5% Welfare Fund: "}</span>
                    <span className="font-mono font-bold text-amber-950">{formatMoney(calculation.tgsFundAmount)}</span>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-900 font-bold">{language === "bn" ? "সদস্যদের ৯৫% বণ্টনযোগ্য মুনাফা: " : "Members' 95% Distributable Profit: "}</span>
                    <span className="font-mono font-bold text-emerald-950">{formatMoney(calculation.membersPoolAmount)}</span>
                  </div>
                </div>

                {/* Member Breakdown Table */}
                <table className="w-full text-left border-collapse border border-stone-300 text-[10.5px]">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold">
                      <th className="border border-stone-300 p-1.5 text-center w-8">{language === "bn" ? "ক্র:" : "SL:"}</th>
                      <th className="border border-stone-300 p-1.5 text-center">{language === "bn" ? "আইডি" : "ID"}</th>
                      <th className="border border-stone-300 p-1.5">{language === "bn" ? "সদস্যের নাম" : "Member Name"}</th>
                      <th className="border border-stone-300 p-1.5 text-right">{language === "bn" ? "জমা ফান্ড" : "Deposit Fund"}</th>
                      <th className="border border-stone-300 p-1.5 text-center">{language === "bn" ? "অনুপাত %" : "Ratio %"}</th>
                      <th className="border border-stone-300 p-1.5 text-right">{language === "bn" ? "মূলধন অংশ" : "Capital Share"}</th>
                      <th className="border border-stone-300 p-1.5 text-right">{language === "bn" ? "৯৫% মুনাফা (৳)" : "95% Profit (৳)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.shares.map((s, idx) => (
                      <tr key={s.memberUid} className={idx % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                        <td className="border border-stone-300 p-1.5 text-center font-mono">{formatNumber(idx + 1)}</td>
                        <td className="border border-stone-300 p-1.5 text-center font-mono">{formatUid(s.memberUid)}</td>
                        <td className="border border-stone-300 p-1.5 font-semibold text-stone-900">{s.memberName}</td>
                        <td className="border border-stone-300 p-1.5 text-right font-mono">{formatMoney(s.depositAtInvestDate)}</td>
                        <td className="border border-stone-300 p-1.5 text-center font-mono font-bold text-amber-900">
                          {(s.ratio * 100).toFixed(2)}%
                        </td>
                        <td className="border border-stone-300 p-1.5 text-right font-mono">{formatMoney(s.capitalShare)}</td>
                        <td className="border border-stone-300 p-1.5 text-right font-mono font-bold text-emerald-900">
                          {formatMoney(s.profitShare)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-100 font-bold border-t border-stone-400 text-stone-900">
                      <td className="border border-stone-300 p-1.5 text-center" colSpan={3}>
                        {language === "bn" ? "মোট সর্বমোট" : "Grand Total"}
                      </td>
                      <td className="border border-stone-300 p-1.5 text-right font-mono">
                        {formatMoney(calculation.totalDepositsAtDate)}
                      </td>
                      <td className="border border-stone-300 p-1.5 text-center font-mono">100.00%</td>
                      <td className="border border-stone-300 p-1.5 text-right font-mono">{formatMoney(investmentAmount)}</td>
                      <td className="border border-stone-300 p-1.5 text-right font-mono text-emerald-950">
                        {formatMoney(calculation.membersPoolAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-12 mt-8 text-center text-[10px] text-stone-600 border-t border-stone-200">
                  <div>
                    <div className="h-8 flex items-end justify-center">
                      <span className="text-stone-300 text-[10px]">{language === "bn" ? "স্বাক্ষর" : "Signature"}</span>
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {language === "bn" ? "কোষাধ্যক্ষ / অডিটর" : "Treasurer / Auditor"}
                    </div>
                  </div>

                  <div>
                    <div className="h-8 flex items-end justify-center">
                      <span className="text-stone-300 text-[10px]">{language === "bn" ? "স্বাক্ষর" : "Signature"}</span>
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {language === "bn" ? "সাধারণ সম্পাদক" : "General Secretary"}
                    </div>
                  </div>

                  <div>
                    <div className="h-8 flex items-end justify-center">
                      <span className="text-stone-300 text-[10px]">{language === "bn" ? "স্বাক্ষর" : "Signature"}</span>
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {language === "bn" ? "সভাপতি" : "President"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-stone-500 font-medium">
                {language === "bn" ? "ডকুমেন্ট ফরম্যাট নির্বাচন করুন:" : "Select download format:"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportStatement("pdf")}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} />
                  {isExporting && exportFormat === "pdf" ? (language === "bn" ? "তৈরি হচ্ছে..." : "Generating...") : (language === "bn" ? "PDF ডাউনলোড" : "Download PDF")}
                </button>

                <button
                  onClick={() => handleExportStatement("jpg")}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon size={14} />
                  {isExporting && exportFormat === "jpg" ? (language === "bn" ? "তৈরি হচ্ছে..." : "Generating...") : (language === "bn" ? "JPG ছবি ডাউনলোড" : "Download JPG Image")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
