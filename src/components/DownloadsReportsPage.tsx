import React, { useState, useMemo, useRef } from "react";
import {
  Download,
  Printer,
  Calendar,
  User,
  Users,
  Building,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Eye,
  ImageDown,
  RefreshCw,
  Share2,
  Check,
  Phone,
  FileCheck,
  Info,
  Award,
  Clock,
  BadgePercent,
  CheckCheck,
  DollarSign,
  Landmark,
  Smartphone,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { toPng, toJpeg } from "html-to-image";
import { Member, Deposit, AccountEntry, FundIncome, Expense, AppSettings } from "../types";
import { TgsLogoSvg, PageWatermark } from "./TgsLogoWatermark";
import {
  currency,
  toBnDigits,
  MONTHS,
  getRecentMonths,
  getDepositTimelineMonths,
  calculateTwoFundsSummary,
  parseTargetMonth,
  parseDateString,
  bnToEnDigits,
  numberToBnWords,
} from "../utils/helpers";
import { useLanguage } from "../utils/LanguageContext";

interface DownloadsReportsPageProps {
  members: Member[];
  deposits: Deposit[];
  bankEntries: AccountEntry[];
  investEntries: AccountEntry[];
  fundIncome: FundIncome[];
  expenses: Expense[];
  settings: AppSettings;
  onOpenWatermarkSettings?: () => void;
}

type ReportType =
  | "monthly_range"
  | "yearly_summary"
  | "member_profile"
  | "all_members"
  | "tgs_fund"
  | "due_defaulters"
  | "investments"
  | "bank_cash";

export function DownloadsReportsPage({
  members,
  deposits,
  bankEntries,
  investEntries,
  fundIncome,
  expenses,
  settings,
  onOpenWatermarkSettings,
}: DownloadsReportsPageProps) {
  const { language, formatNumber } = useLanguage();
  const [selectedReport, setSelectedReport] = useState<ReportType>("monthly_range");

  // Filter states
  const recentMonthList = useMemo(() => {
    const timeline = getDepositTimelineMonths(2025, 9, 36);
    const recents = getRecentMonths(24);
    return Array.from(new Set([...timeline, ...recents]));
  }, []);
  const [rangeMode, setRangeMode] = useState<"single" | "range">("single");
  const [fromMonth, setFromMonth] = useState<string>("অক্টোবর ২০২৫");
  const [toMonth, setToMonth] = useState<string>("অক্টোবর ২০২৫");

  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMemberUid, setSelectedMemberUid] = useState<string>(members[0]?.uid || "");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Download & Generation states
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState("");

  // Two Funds and Complete Financial Summary
  const fundsSummary = useMemo(() => {
    return calculateTwoFundsSummary(deposits, investEntries, fundIncome, expenses, bankEntries);
  }, [deposits, investEntries, fundIncome, expenses, bankEntries]);

  // Available Years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add("2025");
    yearsSet.add("2026");
    yearsSet.add("2027");
    deposits.forEach((d) => {
      const { year } = parseTargetMonth(d.month);
      yearsSet.add(String(year));
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [deposits]);

  // Selected Member Details
  const selectedMember = useMemo(() => {
    return members.find((m) => m.uid === selectedMemberUid) || members[0];
  }, [members, selectedMemberUid]);

  const memberDeposits = useMemo(() => {
    if (!selectedMember) return [];
    return deposits
      .filter((d) => d.memberUid === selectedMember.uid)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [deposits, selectedMember]);

  const memberTotalSavings = useMemo(() => {
    return memberDeposits.reduce((s, d) => s + Number(d.amount || 0), 0);
  }, [memberDeposits]);

  const memberTotalFine = useMemo(() => {
    return memberDeposits.reduce((s, d) => s + Number(d.fine || 0), 0);
  }, [memberDeposits]);

  // Month Range Helper
  const isMonthInRange = (targetMonthStr: string): boolean => {
    if (!targetMonthStr) return false;
    if (rangeMode === "single") {
      return targetMonthStr.trim().toLowerCase() === fromMonth.trim().toLowerCase();
    }
    const target = parseTargetMonth(targetMonthStr);
    const from = parseTargetMonth(fromMonth);
    const to = parseTargetMonth(toMonth);

    const targetVal = target.year * 12 + target.month;
    const fromVal = Math.min(from.year * 12 + from.month, to.year * 12 + to.month);
    const toVal = Math.max(from.year * 12 + from.month, to.year * 12 + to.month);

    return targetVal >= fromVal && targetVal <= toVal;
  };

  // Filtered deposits for Monthly/Range Report
  const rangeDeposits = useMemo(() => {
    return deposits
      .filter((d) => isMonthInRange(d.month))
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [deposits, rangeMode, fromMonth, toMonth]);

  const rangeTotalSavings = useMemo(() => {
    return rangeDeposits.reduce((s, d) => s + Number(d.amount || 0), 0);
  }, [rangeDeposits]);

  const rangeTotalFines = useMemo(() => {
    return rangeDeposits.reduce((s, d) => s + Number(d.fine || 0), 0);
  }, [rangeDeposits]);

  const rangeGrandTotal = rangeTotalSavings + rangeTotalFines;

  // Yearly Summary Data
  const yearlyData = useMemo(() => {
    const yNum = parseInt(selectedYear, 10);
    return MONTHS.map((mName, mIdx) => {
      const monthLabel = `${mName} ${toBnDigits(selectedYear)}`;
      const monthDeps = deposits.filter((d) => {
        const parsed = parseTargetMonth(d.month);
        return parsed.year === yNum && parsed.month === mIdx;
      });
      const depAmt = monthDeps.reduce((s, d) => s + Number(d.amount || 0), 0);
      const fineAmt = monthDeps.reduce((s, d) => s + Number(d.fine || 0), 0);

      // Monthly expenses
      const mExpenses = expenses.filter((e) => {
        const d = parseDateString(e.date);
        return d.getFullYear() === yNum && d.getMonth() === mIdx;
      });
      const expAmt = mExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      return {
        month: monthLabel,
        depositsCount: monthDeps.length,
        depositAmount: depAmt,
        fineAmount: fineAmt,
        totalCollection: depAmt + fineAmt,
        expenseAmount: expAmt,
        netSurplus: depAmt + fineAmt - expAmt,
      };
    });
  }, [deposits, expenses, selectedYear]);

  const yearlyTotals = useMemo(() => {
    return yearlyData.reduce(
      (acc, row) => ({
        depositAmount: acc.depositAmount + row.depositAmount,
        fineAmount: acc.fineAmount + row.fineAmount,
        totalCollection: acc.totalCollection + row.totalCollection,
        expenseAmount: acc.expenseAmount + row.expenseAmount,
        netSurplus: acc.netSurplus + row.netSurplus,
        depositsCount: acc.depositsCount + row.depositsCount,
      }),
      {
        depositAmount: 0,
        fineAmount: 0,
        totalCollection: 0,
        expenseAmount: 0,
        netSurplus: 0,
        depositsCount: 0,
      }
    );
  }, [yearlyData]);

  // Defaulters (সঞ্চয় জমা দেননি এমন সদস্য)
  const defaultersList = useMemo(() => {
    const paidMemberUids = new Set(rangeDeposits.map((d) => d.memberUid));
    return members
      .filter((m) => !paidMemberUids.has(m.uid))
      .map((m) => ({
        ...m,
        expectedMonth: rangeMode === "single" ? fromMonth : `${fromMonth} হতে ${toMonth}`,
        expectedSavings: 1000,
        dueFine: settings.defaultFine || 50,
      }));
  }, [members, rangeDeposits, rangeMode, fromMonth, toMonth, settings]);

  // TGS Inflow and Outflows combined
  const investDividendEntries = useMemo(() => {
    return investEntries.filter((e) => Number(e.dividend || 0) > 0);
  }, [investEntries]);

  const tgsInflows = useMemo(() => {
    return [
      ...investDividendEntries.map((iv) => ({
        date: iv.date,
        source: "বিনিয়োগ ৫% লভ্যাংশ",
        desc: iv.desc + (iv.place ? ` [${iv.place}]` : ""),
        inflow: Math.round(Number(iv.dividend || 0) * 0.05),
        outflow: 0,
        voucher: `DIV-${iv.id}`,
      })),
      ...fundIncome.map((f) => ({
        date: f.date,
        source: f.source,
        desc: f.desc || f.source,
        inflow: Number(f.amount || 0),
        outflow: 0,
        voucher: `INC-${f.id}`,
      })),
    ];
  }, [investDividendEntries, fundIncome]);

  const tgsOutflows = useMemo(() => {
    return expenses.map((e) => ({
      date: e.date,
      source: "পরিচালন ব্যয়",
      desc: e.desc,
      inflow: 0,
      outflow: Number(e.amount || 0),
      voucher: e.invoice ? `ভাউচার #${e.invoice}` : `EXP-${e.id}`,
    }));
  }, [expenses]);

  const allTgsCombined = useMemo(() => {
    return [...tgsInflows, ...tgsOutflows].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [tgsInflows, tgsOutflows]);

  // Bank Running Balance
  const bankRunningData = useMemo(() => {
    let run = 0;
    const sorted = [...bankEntries].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return sorted.map((b) => {
      const isIn = b.type === "in";
      const amt = Number(b.amount || 0);
      if (isIn) run += amt;
      else run -= amt;
      return {
        ...b,
        credit: isIn ? amt : 0,
        debit: !isIn ? amt : 0,
        balance: run,
      };
    });
  }, [bankEntries]);

  const totalBankCredit = bankRunningData.reduce((s, b) => s + b.credit, 0);
  const totalBankDebit = bankRunningData.reduce((s, b) => s + b.debit, 0);
  const currentBankBalance = totalBankCredit - totalBankDebit;

  // Dynamic Filename Generator
  const getReportFilename = (): string => {
    const sanitize = (s: string) => s.replace(/[\s/\\:]+/g, "_");
    switch (selectedReport) {
      case "monthly_range":
        return rangeMode === "single"
          ? `TGS_Monthly_Collection_Statement_${sanitize(fromMonth)}`
          : `TGS_Range_Collection_Statement_${sanitize(fromMonth)}_to_${sanitize(toMonth)}`;
      case "yearly_summary":
        return `TGS_Annual_Audit_Summary_${selectedYear}`;
      case "member_profile":
        return `TGS_Member_Statement_${selectedMember?.uid || "All"}_${sanitize(selectedMember?.name || "")}`;
      case "all_members":
        return `TGS_All_Members_Registry_Directory`;
      case "tgs_fund":
        return `TGS_Fund_Official_Audit_Ledger`;
      case "due_defaulters":
        return `TGS_Due_Defaulters_Notice_${sanitize(fromMonth)}`;
      case "investments":
        return `TGS_Investment_Portfolio_Dividend_Audit`;
      case "bank_cash":
        return `TGS_Bank_Cash_Ledger_Statement`;
      default:
        return `TGS_Official_Report_${Date.now()}`;
    }
  };

  /**
   * Generates and downloads true .PDF file directly using jsPDF + html-to-image with multi-page handling
   */
  const handleDownloadPdf = async () => {
    const element = document.getElementById("printable-report-area");
    if (!element) {
      window.print();
      return;
    }

    setIsDownloadingPdf(true);
    setDownloadSuccessNotice("");
    try {
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.98,
        cacheBust: true,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgWidth = pageWidth;
      const imgHeight = (img.height * pageWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Subsequent pages if long document
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const fileName = `${getReportFilename()}.pdf`;
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 2500);

      setDownloadSuccessNotice(`✅ PDF ফাইল সফলভাবে ডাউনলোড হয়েছে: ${fileName}`);
      setTimeout(() => setDownloadSuccessNotice(""), 6000);
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /**
   * Generates and downloads true .JPG high-res image directly
   */
  const handleDownloadImage = async () => {
    const element = document.getElementById("printable-report-area");
    if (!element) return;

    setIsDownloadingImage(true);
    setDownloadSuccessNotice("");
    try {
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toJpeg(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.95,
        cacheBust: true,
      });

      const fileName = `${getReportFilename()}.jpg`;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 2500);

      setDownloadSuccessNotice(`✅ হাই-রেজ্যুলেশন ছবি (JPG) সফলভাবে ডাউনলোড হয়েছে: ${fileName}`);
      setTimeout(() => setDownloadSuccessNotice(""), 6000);
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  /**
   * Trigger Browser Print window
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Export to Excel (.XLSX) formatted for corporate category standards
   */
  const handleExportExcel = () => {
    setIsDownloadingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const fileName = `${getReportFilename()}.xlsx`;

      if (selectedReport === "monthly_range") {
        const rows = rangeDeposits.map((d, i) => {
          const m = members.find((mem) => mem.uid === d.memberUid);
          return {
            "ক্রমিক": i + 1,
            "রসিদ নম্বর": d.id,
            "সদস্য আইডি": d.memberUid,
            "সদস্যের নাম": m?.name || "",
            "মোবাইল": m?.mobile || "",
            "জমার মাস": d.month,
            "জমার তারিখ": d.date,
            "সঞ্চয় পরিমাণ (৳)": d.amount,
            "বিলম্ব জরিমানা (৳)": d.fine || 0,
            "সর্বমোট টাকা (৳)": d.amount + (d.fine || 0),
            "পেমেন্ট মাধ্যম": d.method,
            "ভেরিফিকেশন": "অনুমোদিত",
          };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "মাসিক কালেকশন শিট");
      } else if (selectedReport === "yearly_summary") {
        const rows = yearlyData.map((r) => ({
          "মাস": r.month,
          "জমার সংখ্যা": r.depositsCount,
          "সঞ্চয় জমা (৳)": r.depositAmount,
          "বিলম্ব জরিমানা (৳)": r.fineAmount,
          "মোট আদায় (৳)": r.totalCollection,
          "সমিতি ব্যয় (৳)": r.expenseAmount,
          "নেট উদ্বৃত্ত (৳)": r.netSurplus,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, `বাৎসরিক_${selectedYear}`);
      } else if (selectedReport === "member_profile") {
        const rows = memberDeposits.map((d, i) => ({
          "ক্রমিক": i + 1,
          "রসিদ নং": d.id,
          "মাস": d.month,
          "তারিখ": d.date,
          "সঞ্চয় (৳)": d.amount,
          "জরিমানা (৳)": d.fine || 0,
          "মোট (৳)": d.amount + (d.fine || 0),
          "মাধ্যম": d.method,
          "স্ট্যাটাস": "অনুমোদিত",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "সদস্য খতিয়ান");
      } else if (selectedReport === "all_members") {
        const rows = members.map((m, i) => {
          const totalSavings = deposits
            .filter((d) => d.memberUid === m.uid)
            .reduce((s, d) => s + Number(d.amount || 0), 0);
          return {
            "ক্রমিক": i + 1,
            "আইডি": m.uid,
            "নাম (বাংলা)": m.name,
            "Name (English)": m.nameEn || "",
            "মোবাইল": m.mobile || "",
            "পিতার নাম": m.fatherName || "",
            "রক্তের গ্রুপ": m.blood || "",
            "যোগদান তারিখ": m.joined || "",
            "মোট সঞ্চয় (৳)": totalSavings,
            "স্ট্যাটাস": "সক্রিয় সদস্য",
          };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "সদস্য মাস্টার রেজিস্টার");
      } else if (selectedReport === "tgs_fund") {
        let run = 0;
        const rows = allTgsCombined.map((r, i) => {
          run += r.inflow - r.outflow;
          return {
            "ক্রমিক": i + 1,
            "তারিখ": r.date,
            "খাত / ক্যাটাগরি": r.source,
            "বিবরণ": r.desc,
            "ভাউচার নং": r.voucher,
            "জমা / আয় (+ ৳)": r.inflow,
            "খরচ / ব্যয় (- ৳)": r.outflow,
            "ফান্ড ব্যালেন্স (৳)": run,
          };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "টিজিএস ফান্ড লেজার");
      } else if (selectedReport === "due_defaulters") {
        const rows = defaultersList.map((m, i) => ({
          "ক্রমিক": i + 1,
          "সদস্য আইডি": m.uid,
          "নাম": m.name,
          "মোবাইল": m.mobile || "",
          "বকেয়া মাস": m.expectedMonth,
          "নিয়মিত সঞ্চয় (৳)": m.expectedSavings,
          "বিলম্ব জরিমানা (৳)": m.dueFine,
          "সর্বমোট বকেয়া (৳)": m.expectedSavings + m.dueFine,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "বকেয়া সঞ্চয় তালিকা");
      } else if (selectedReport === "investments") {
        const rows = investEntries.map((iv, i) => {
          const div = Number(iv.dividend || 0);
          return {
            "ক্রমিক": i + 1,
            "তারিখ": iv.date,
            "প্রকল্প / স্থান": iv.place || "",
            "বিবরণ": iv.desc,
            "বিনিয়োগ মূলধন (৳)": iv.amount,
            "অর্জিত মোট লভ্যাংশ (৳)": div,
            "৫% টিজিএস ফান্ড অংশ (৳)": Math.round(div * 0.05),
            "৯৫% সাধারণ বণ্টন অংশ (৳)": div - Math.round(div * 0.05),
          };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "বিনিয়োগ ও লভ্যাংশ শিট");
      } else if (selectedReport === "bank_cash") {
        const rows = bankRunningData.map((b, i) => ({
          "ক্রমিক": i + 1,
          "তারিখ": b.date,
          "বিবরণ": b.desc,
          "জমা / ক্রেডিট (+ ৳)": b.credit,
          "উত্তোলন / ডেবিট (- ৳)": b.debit,
          "ব্যালেন্স (৳)": b.balance,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "ব্যাংক ও ক্যাশ বুক");
      }

      XLSX.writeFile(wb, fileName);
      setDownloadSuccessNotice(`✅ এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে: ${fileName}`);
      setTimeout(() => setDownloadSuccessNotice(""), 6000);
    } catch (err) {
      console.error("Excel download failed:", err);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  /**
   * Share report summary on WhatsApp
   */
  const handleShareWhatsApp = () => {
    let text = `*📋 ${settings.societyName.toUpperCase()} - অফিসিয়াল রিপোর্ট সারাংশ*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (selectedReport === "monthly_range") {
      text += `📅 *মাস:* ${rangeMode === "single" ? fromMonth : `${fromMonth} হতে ${toMonth}`}\n`;
      text += `👥 *মোট জমা:* ${rangeDeposits.length} টি\n`;
      text += `💰 *সঞ্চয় সংগ্রহ:* ${currency(rangeTotalSavings)}\n`;
      text += `⚠️ *জরিমানা:* ${currency(rangeTotalFines)}\n`;
      text += `💵 *সর্বমোট ক্যাশ কালেকশন:* ${currency(rangeGrandTotal)}\n`;
      text += `📝 *কথায়:* ${numberToBnWords(rangeGrandTotal)}\n`;
    } else if (selectedReport === "yearly_summary") {
      text += `📆 *বাৎসরিক অডিট:* ${selectedYear}\n`;
      text += `💰 *মোট সঞ্চয়:* ${currency(yearlyTotals.depositAmount)}\n`;
      text += `💵 *মোট আদায়:* ${currency(yearlyTotals.totalCollection)}\n`;
      text += `📉 *মোট ব্যয়:* ${currency(yearlyTotals.expenseAmount)}\n`;
      text += `📈 *নেট উদ্বৃত্ত:* ${currency(yearlyTotals.netSurplus)}\n`;
    } else if (selectedReport === "member_profile" && selectedMember) {
      text += `👤 *সদস্য:* ${selectedMember.name} (${selectedMember.uid})\n`;
      text += `📱 *মোবাইল:* ${selectedMember.mobile || "N/A"}\n`;
      text += `💰 *সর্বমোট সঞ্চয় স্থিতি:* ${currency(memberTotalSavings)}\n`;
      text += `📦 *মোট কিস্তি জমা:* ${memberDeposits.length} টি\n`;
    } else if (selectedReport === "tgs_fund") {
      text += `🛡️ *টিজিএস ফান্ড স্থিতি*\n`;
      text += `➕ *মোট আয়/লভ্যাংশ:* ${currency(fundsSummary.tgsFundTotalInflow)}\n`;
      text += `➖ *মোট খরচ:* ${currency(fundsSummary.tgsExpensesTotal)}\n`;
      text += `💼 *বর্তমান ব্যালেন্স:* ${currency(fundsSummary.tgsFundBalance)}\n`;
    } else if (selectedReport === "due_defaulters") {
      text += `⚠️ *বকেয়া সঞ্চয় তালিকা:* (${rangeMode === "single" ? fromMonth : fromMonth + " - " + toMonth})\n`;
      text += `❌ *বকেয়া সদস্য:* ${defaultersList.length} জন\n`;
      text += `💵 *মোট বকেয়া দাবি:* ${currency(defaultersList.length * (1000 + (settings.defaultFine || 50)))}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌐 সিস্টেম জেনারেটেড ডিজিটাল রিপোর্ট\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const reportTabs = [
    {
      id: "monthly_range" as const,
      label: "মাসিক ও মাস-রেঞ্জ কালেকশন শিট",
      icon: Calendar,
      desc: "একক মাস বা নির্বাচিত সময়ের সঞ্চয় ও জরিমানার প্রাতিষ্ঠানিক অডিট শিট",
    },
    {
      id: "yearly_summary" as const,
      label: "বাৎসরিক আর্থিক বিবরণী ও অডিট",
      icon: TrendingUp,
      desc: "১২ মাসের আয়, ব্যয়, সঞ্চয় প্রবৃদ্ধি ও নেট স্থিতির এক্সিকিউটিভ সামারি",
    },
    {
      id: "member_profile" as const,
      label: "সদস্য প্রোফাইল ও পূর্ণাঙ্গ লেজার",
      icon: User,
      desc: "একক সদস্যের প্রাতিষ্ঠানিক পরিচিতি, ছবি ও সকল কিস্তির রসিদ খতিয়ান",
    },
    {
      id: "all_members" as const,
      label: "সকল সদস্যের মাস্টার ডিরেক্টরি",
      icon: Users,
      desc: "সকল অংশীদারের অফিসিয়াল সদস্য রেজিস্টার ও মোট সঞ্চয় স্থিতি",
    },
    {
      id: "tgs_fund" as const,
      label: "টিজিএস ফান্ড আয়-ব্যয় খতিয়ান",
      icon: ShieldCheck,
      desc: "বিনিয়োগের ৫% লভ্যাংশ, আলাদা আয় ও সকল ভাউচার ব্যয়ের অডিট",
    },
    {
      id: "due_defaulters" as const,
      label: "বকেয়া সঞ্চয় ও বিলম্বিত তালিকা",
      icon: AlertCircle,
      desc: "নির্ধারিত মাসের বকেয়া সদস্য তালিকা ও জরিমানা রিকভারি স্টেটমেন্ট",
    },
    {
      id: "investments" as const,
      label: "বিনিয়োগ প্রকল্প ও লভ্যাংশ বিবরণী",
      icon: Building,
      desc: "প্রকল্পের মূলধন, মোট লভ্যাংশ এবং ৫% টিজিএস প্রাতিষ্ঠানিক অংশ বণ্টন",
    },
    {
      id: "bank_cash" as const,
      label: "ব্যাংক হিসাব ও ক্যাশ বুক",
      icon: Landmark,
      desc: "ব্যাংক অ্যাকাউন্টের ক্রেডিট-ডেবিট ও প্রাতিষ্ঠানিক ক্যাশ ব্যালেন্স",
    },
  ];

  return (
    <div id="downloads-reports-hub" className="space-y-6">
      {/* Download Success Toast Notice */}
      {downloadSuccessNotice && (
        <div className="bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-700 flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-amber-300">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{downloadSuccessNotice}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessNotice("")}
            className="text-xs text-emerald-200 hover:text-white underline font-semibold ml-3 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Download size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  অফিসিয়াল রিপোর্ট ও স্টেটমেন্ট হাব
                </span>
                <span className="text-xs text-stone-500 font-medium">কর্পোরেট ফরম্যাটে PDF, JPG ও এক্সেল ফাইল ডাউনলোড</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                অফিসিয়াল রিপোর্ট ও ডকুমেন্ট ডাউনলোড
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                ক্যাটাগরি অনুযায়ী প্রস্তুতকৃত পরিচ্ছন্ন ও পেশাদার প্রাতিষ্ঠানিক অডিট ফরম্যাট
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct PDF Download */}
            <button
              id="download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-60 cursor-pointer"
              title="সরাসরি PDF ফাইল ডাউনলোড করুন"
            >
              {isDownloadingPdf ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-amber-300" />
                  <span>PDF প্রস্তুত হচ্ছে...</span>
                </>
              ) : (
                <>
                  <FileText size={16} className="text-amber-300" />
                  <span>PDF ডাউনলোড (.PDF)</span>
                </>
              )}
            </button>

            {/* Direct Image JPG Download */}
            <button
              id="download-image-btn"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-emerald-950 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md disabled:opacity-60 cursor-pointer"
              title="এইচডি কোয়ালিটি ছবি হিসেবে ডাউনলোড করুন"
            >
              {isDownloadingImage ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>ছবি তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <ImageDown size={16} />
                  <span>ছবি ডাউনলোড (.JPG)</span>
                </>
              )}
            </button>

            {/* Excel Download */}
            <button
              id="export-report-excel-btn"
              onClick={handleExportExcel}
              disabled={isDownloadingExcel}
              className="flex items-center gap-2 bg-emerald-950 hover:bg-stone-900 active:scale-[0.98] text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-emerald-800 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              title="সম্পূর্ণ ডেটা এক্সেল শিটে ডাউনলোড করুন"
            >
              <FileSpreadsheet size={16} />
              <span>এক্সেল (.XLSX)</span>
            </button>

            {/* Print */}
            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-stone-300 transition-all cursor-pointer"
              title="ব্রাউজারে প্রিন্ট বা প্রিভিউ করুন"
            >
              <Printer size={15} className="text-stone-600" />
              <span>প্রিন্ট</span>
            </button>

            {/* WhatsApp Share */}
            <button
              id="share-whatsapp-btn"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              title="WhatsApp এ সারাংশ পাঠান"
            >
              <Share2 size={15} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Report Categories / Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                isActive
                  ? "bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-700/50"
                  : "bg-white text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isActive ? "bg-emerald-800 text-amber-300" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  <Icon size={16} />
                </div>
                {isActive && <CheckCircle2 size={16} className="text-amber-300" />}
              </div>
              <div className="mt-3">
                <p className={`text-xs font-bold ${isActive ? "text-white" : "text-stone-900"}`}>
                  {tab.label}
                </p>
                <p className={`text-[10px] mt-0.5 line-clamp-2 ${isActive ? "text-emerald-200" : "text-stone-500"}`}>
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* DYNAMIC FILTER CONTROLS FOR SELECTED REPORT */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4">
        {/* If Monthly / Range Report */}
        {selectedReport === "monthly_range" && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Filter size={14} className="text-emerald-700" /> ফিল্টার মোড:
              </span>
              <div className="flex items-center p-0.5 bg-stone-100 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setRangeMode("single")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    rangeMode === "single"
                      ? "bg-white text-emerald-950 font-bold shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  একক মাস
                </button>
                <button
                  onClick={() => setRangeMode("range")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    rangeMode === "range"
                      ? "bg-white text-emerald-950 font-bold shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  মাস রেঞ্জ (কয়েক মাস)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">
                  {rangeMode === "single" ? "মাস নির্বাচন:" : "শুরুর মাস:"}
                </span>
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-bold text-stone-800 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {recentMonthList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {rangeMode === "range" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500 font-medium">শেষের মাস:</span>
                  <select
                    value={toMonth}
                    onChange={(e) => setToMonth(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-bold text-stone-800 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    {recentMonthList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* If Yearly Report */}
        {selectedReport === "yearly_summary" && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">অর্থবছর নির্বাচন করুন:</span>
              <div className="flex items-center gap-1.5">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      selectedYear === yr
                        ? "bg-emerald-900 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {yr} ({toBnDigits(yr)})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* If Member Profile Report */}
        {selectedReport === "member_profile" && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <span className="text-xs font-bold text-stone-700 shrink-0">সদস্য নির্বাচন:</span>
              <select
                value={selectedMemberUid}
                onChange={(e) => setSelectedMemberUid(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-semibold text-stone-800 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.name} ({m.uid}) - {m.mobile || "মোবাইল নেই"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* If Defaulters Report */}
        {selectedReport === "due_defaulters" && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">বকেয়া নিরীক্ষার মাস:</span>
              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-bold text-stone-800 text-xs focus:ring-2 focus:ring-emerald-700"
              >
                {recentMonthList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE REPORT PREVIEW CANVAS */}
      <div className="bg-stone-50 rounded-2xl border border-stone-300 p-4 sm:p-6 shadow-inner">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4 pb-3 border-b border-stone-200 text-xs">
          <span className="font-bold flex items-center gap-1.5 text-stone-800">
            <Eye size={15} className="text-emerald-700" /> অফিসিয়াল প্রিন্ট ও ডকুমেন্ট প্রিভিউ (A4 Format)
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <RefreshCw size={13} className="animate-spin text-amber-300" />
              ) : (
                <FileText size={13} className="text-amber-300" />
              )}
              <span>{isDownloadingPdf ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-emerald-950 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isDownloadingImage ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <ImageDown size={13} />
              )}
              <span>ছবি (JPG)</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isDownloadingExcel}
              className="text-xs font-bold bg-emerald-950 hover:bg-stone-900 text-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-emerald-800 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>এক্সেল</span>
            </button>

            <button
              onClick={handlePrint}
              className="text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer size={13} />
              <span>প্রিন্ট</span>
            </button>

            {onOpenWatermarkSettings && (
              <button
                type="button"
                onClick={onOpenWatermarkSettings}
                className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="রিপোর্ট ব্যাকগ্রাউন্ড জলছাপ (Watermark) সেটিংস"
              >
                <Sparkles size={13} className="text-amber-700" />
                <span>জলছাপ</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable Area - Formatted as official document */}
        <div
          id="printable-report-area"
          className="bg-white rounded-xl border border-stone-300 p-6 sm:p-8 text-stone-900 shadow-sm max-w-4xl mx-auto space-y-6 relative overflow-hidden"
        >
          {/* Dynamic Background Watermark for Reports */}
          <PageWatermark settings={settings} documentType="report" size={480} />

          {/* Header of the Official Report */}
          <div className="text-center pb-4 border-b-2 border-emerald-950/20 space-y-1 relative z-10">
            {/* Circular Logo if available */}
            <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-1.5 border-2 border-emerald-900 shadow-xs flex items-center justify-center bg-white">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <TgsLogoSvg size={46} />
              )}
            </div>

            <div className="inline-block px-3 py-0.5 bg-emerald-900 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-sm">
              {language === 'bn' ? "অফিসিয়াল আর্থিক বিবরণী ও নিরীক্ষা প্রতিবেদন" : "Official Financial Statement & Audit Report"}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
              {language === 'en' && settings.societyNameEn ? settings.societyNameEn : (settings.societyName || "Trust Growth Society")}
            </h1>
            <p className="text-xs font-semibold text-stone-600">
              {language === 'en' && (settings.societySubtitleEn || settings.societyAddressEn)
                ? (settings.societySubtitleEn || settings.societyAddressEn)
                : (settings.societySubtitle || settings.societyAddress || "উলানিয়া বাজার, উলানিয়া, গলাচিপা, পটুয়াখালী")}
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] text-stone-500 flex-wrap">
              <span>{language === 'en' ? (settings.establishedDateEn ? `Est: ${settings.establishedDateEn}` : 'Est: 25-09-2025') : (settings.establishedDate ? `স্থাপিত: ${settings.establishedDate}` : 'স্থাপিত: ২৫-০৯-২০২৫')}</span>
              <span>•</span>
              <span>{language === 'bn' ? "যোগাযোগ:" : "Contact:"} {formatNumber(settings.contactPhone)}</span>
              <span>•</span>
              <span>{language === 'bn' ? "স্মারক নং:" : "Ref No:"} TGS/REP/{new Date().getFullYear()}/{Math.floor(1000 + Math.random() * 9000)}</span>
            </div>

            {/* Document Title Bar */}
            <div className="mt-3 pt-2.5 border-t border-dashed border-stone-300">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 uppercase tracking-wide">
                {selectedReport === "monthly_range" &&
                  `মাসিক সঞ্চয় কালেকশন ও সামারি স্টেটমেন্ট (${rangeMode === "single" ? fromMonth : `${fromMonth} হতে ${toMonth}`})`}
                {selectedReport === "yearly_summary" &&
                  `বাৎসরিক সার্বিক আর্থিক অডিট ও কর্মক্ষমতা বিবরণী (${selectedYear} অর্থবছর)`}
                {selectedReport === "member_profile" &&
                  `সদস্য প্রোফাইল ও পূর্ণাঙ্গ সঞ্চয় খতিয়ান - ${selectedMember?.name || ""} (${selectedMember?.uid || ""})`}
                {selectedReport === "all_members" &&
                  `সমিতির সকল নিবন্ধিত সদস্যের মাস্টার রেজিস্টার ও সঞ্চয় পোর্টফোলিও`}
                {selectedReport === "tgs_fund" &&
                  `টিজিএস ফান্ড (TGS Fund) জমা-খরচ ও রিজার্ভ অডিট স্টেটমেন্ট`}
                {selectedReport === "due_defaulters" &&
                  `বকেয়া ও বিলম্বিত সঞ্চয় তাগিদ নোটিশ তালিকা (${fromMonth})`}
                {selectedReport === "investments" &&
                  `বিনিয়োগ প্রকল্প ও লভ্যাংশ বণ্টন বিবরণী (৫% টিজিএস প্রাতিষ্ঠানিক অংশ সহ)`}
                {selectedReport === "bank_cash" &&
                  `ব্যাংক হিসাব ও নগদ ক্যাশ বুক স্টেটমেন্ট`}
              </h2>
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 flex-wrap">
                <span>রিপোর্ট প্রস্তুতের তারিখ: {new Date().toLocaleDateString("bn-BD")}</span>
                <span>স্ট্যাটাস: মূল কপি (Verified & Official)</span>
                <span>সময়: {new Date().toLocaleTimeString("bn-BD")}</span>
              </div>
            </div>
          </div>

          {/* REPORT 1: MONTHLY / RANGE REPORT */}
          {selectedReport === "monthly_range" && (
            <div className="space-y-5">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500 font-medium">মোট নিয়মিত সঞ্চয়:</span>
                  <p className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {currency(rangeTotalSavings)}
                  </p>
                  <span className="text-[10px] text-stone-400">মোট {rangeDeposits.length} টি জমা</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">বিলম্ব জরিমানা আদায়:</span>
                  <p className="text-base font-bold font-mono text-amber-900 mt-0.5">
                    {currency(rangeTotalFines)}
                  </p>
                  <span className="text-[10px] text-stone-400">১০ তারিখের পরের জরিমানা</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">সর্বমোট ক্যাশ কালেকশন:</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                    {currency(rangeGrandTotal)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold">সঞ্চয় + জরিমানা</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">কালেকশন হার:</span>
                  <p className="text-base font-bold font-mono text-stone-800 mt-0.5">
                    {members.length > 0 ? Math.round((rangeDeposits.length / members.length) * 100) : 0}%
                  </p>
                  <span className="text-[10px] text-stone-400">{rangeDeposits.length}/{members.length} জন সদস্য</span>
                </div>
              </div>

              {/* In-Words Bengali Amount Box */}
              <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                <FileCheck size={15} className="text-emerald-800 shrink-0" />
                <span>
                  <strong className="text-emerald-900">কথায় (সর্বমোট আদায়):</strong> {numberToBnWords(rangeGrandTotal)}
                </span>
              </div>

              {/* Table of deposits */}
              <div>
                <div className="flex items-center justify-between mb-2 text-xs font-bold text-stone-800">
                  <span>সদস্যদের জমা বিবরণী তালিকা ({rangeDeposits.length} জন)</span>
                  <span className="text-[11px] text-stone-500 font-normal">আদায়কৃত রসিদ তালিকা</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs border border-stone-200">
                    <thead>
                      <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                        <th className="py-2 px-2.5 border-r border-stone-200">ক্র.</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">রসিদ নং</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">সদস্যের নাম ও আইডি</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">মোবাইল</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">জমার মাস</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">তারিখ</th>
                        <th className="py-2 px-2.5 text-right border-r border-stone-200">সঞ্চয় (৳)</th>
                        <th className="py-2 px-2.5 text-right border-r border-stone-200">জরিমানা (৳)</th>
                        <th className="py-2 px-2.5 text-right border-r border-stone-200">মোট (৳)</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">মাধ্যম</th>
                        <th className="py-2 px-2.5 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {rangeDeposits.map((d, idx) => {
                        const m = members.find((mem) => mem.uid === d.memberUid);
                        return (
                          <tr key={d.id} className="hover:bg-stone-50">
                            <td className="py-1.5 px-2.5 font-mono text-stone-500 border-r border-stone-200">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-stone-700 border-r border-stone-200">
                              {d.id}
                            </td>
                            <td className="py-1.5 px-2.5 border-r border-stone-200">
                              <span className="font-bold text-stone-900">{m?.name || d.memberUid}</span>
                              <span className="text-[10px] text-stone-500 ml-1 font-mono">({d.memberUid})</span>
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                              {m?.mobile || "-"}
                            </td>
                            <td className="py-1.5 px-2.5 border-r border-stone-200 font-medium">
                              {d.month}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                              {d.date}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold border-r border-stone-200">
                              {currency(d.amount)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-amber-800 border-r border-stone-200">
                              {d.fine ? currency(d.fine) : "-"}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-950 border-r border-stone-200">
                              {currency(d.amount + (d.fine || 0))}
                            </td>
                            <td className="py-1.5 px-2.5 text-[11px] text-stone-600 border-r border-stone-200">
                              {d.method}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                অনুমোদিত
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {rangeDeposits.length === 0 && (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-stone-400">
                            নির্বাচিত মাস বা রেঞ্জে কোনো জমার রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-stone-100 font-black border-t-2 border-stone-300">
                        <td colSpan={6} className="py-2.5 px-2.5 text-right border-r border-stone-200">
                          সর্বমোট কালেকশন হিসাব:
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono border-r border-stone-200">
                          {currency(rangeTotalSavings)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-amber-900 border-r border-stone-200">
                          {currency(rangeTotalFines)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-emerald-950 border-r border-stone-200">
                          {currency(rangeGrandTotal)}
                        </td>
                        <td colSpan={2} className="text-center text-[10px] text-stone-500 font-medium">
                          {rangeDeposits.length} টি রসিদ সমাপ্ত
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT 2: YEARLY FINANCIAL SUMMARY */}
          {selectedReport === "yearly_summary" && (
            <div className="space-y-5">
              {/* Executive KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500">বাৎসরিক মোট সঞ্চয়:</span>
                  <p className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {currency(yearlyTotals.depositAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">বাৎসরিক মোট জরিমানা:</span>
                  <p className="text-base font-bold font-mono text-amber-900 mt-0.5">
                    {currency(yearlyTotals.fineAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">বাৎসরিক মোট খরচ:</span>
                  <p className="text-base font-bold font-mono text-rose-900 mt-0.5">
                    {currency(yearlyTotals.expenseAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">বাৎসরিক নেট উদ্বৃত্ত:</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                    {currency(yearlyTotals.netSurplus)}
                  </p>
                </div>
              </div>

              {/* In-Words Box */}
              <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                <FileCheck size={15} className="text-emerald-800 shrink-0" />
                <span>
                  <strong className="text-emerald-900">কথায় (বাৎসরিক নেট উদ্বৃত্ত):</strong> {numberToBnWords(yearlyTotals.netSurplus)}
                </span>
              </div>

              {/* 12-Month Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                      <th className="py-2.5 px-3 border-r border-stone-200">মাস</th>
                      <th className="py-2.5 px-3 text-center border-r border-stone-200">জমার সংখ্যা</th>
                      <th className="py-2.5 px-3 text-right border-r border-stone-200">সঞ্চয় জমা (৳)</th>
                      <th className="py-2.5 px-3 text-right border-r border-stone-200">বিলম্ব জরিমানা (৳)</th>
                      <th className="py-2.5 px-3 text-right border-r border-stone-200">মোট আদায় (৳)</th>
                      <th className="py-2.5 px-3 text-right border-r border-stone-200">সমিতি ব্যয় (৳)</th>
                      <th className="py-2.5 px-3 text-right border-r border-stone-200">নেট উদ্বৃত্ত (৳)</th>
                      <th className="py-2.5 px-3 text-center">আদায় হার</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {yearlyData.map((row) => (
                      <tr key={row.month} className="hover:bg-stone-50">
                        <td className="py-2 px-3 font-semibold text-stone-900 border-r border-stone-200">
                          {row.month}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-stone-600 border-r border-stone-200">
                          {row.depositsCount}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-800 border-r border-stone-200">
                          {currency(row.depositAmount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-800 border-r border-stone-200">
                          {row.fineAmount ? currency(row.fineAmount) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-950 border-r border-stone-200">
                          {currency(row.totalCollection)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-800 border-r border-stone-200">
                          {row.expenseAmount ? currency(row.expenseAmount) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-900 border-r border-stone-200">
                          {currency(row.netSurplus)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-stone-600">
                          {members.length > 0 ? Math.round((row.depositsCount / members.length) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-100 font-black border-t-2 border-stone-300">
                      <td className="py-2.5 px-3 border-r border-stone-200">সর্বমোট বাৎসরিক হিসাব:</td>
                      <td className="py-2.5 px-3 text-center font-mono border-r border-stone-200">
                        {yearlyTotals.depositsCount} টি
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-stone-200">
                        {currency(yearlyTotals.depositAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-900 border-r border-stone-200">
                        {currency(yearlyTotals.fineAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-950 border-r border-stone-200">
                        {currency(yearlyTotals.totalCollection)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-900 border-r border-stone-200">
                        {currency(yearlyTotals.expenseAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-950 border-r border-stone-200">
                        {currency(yearlyTotals.netSurplus)}
                      </td>
                      <td className="text-center font-bold text-[11px] text-emerald-800">
                        অডিট সমাপ্ত
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Auditor's Note Box */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1 text-stone-700">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700" /> অডিট পর্যবেক্ষণ ও সারসংক্ষেপ:
                </p>
                <p className="text-[11px] leading-relaxed">
                  {selectedYear} অর্থবছরে ট্রাস্ট গ্রোথ সোসাইটি মোট {yearlyTotals.depositsCount} টি মাসিক সঞ্চয় কিস্তি সফলভাবে সংগ্রহ করেছে।
                  সমিতির সকল পরিচালন ব্যয় নির্বাহের পর নেট উদ্বৃত্ত সন্তোষজনক পর্যায়ে রয়েছে।
                </p>
              </div>
            </div>
          )}

          {/* REPORT 3: MEMBER PROFILE & FULL STATEMENT */}
          {selectedReport === "member_profile" && selectedMember && (
            <div className="space-y-5">
              {/* Member Profile Bio Box with Photo */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-4 flex-wrap sm:flex-nowrap">
                {selectedMember.photo ? (
                  <img
                    src={selectedMember.photo}
                    alt={selectedMember.name}
                    className="w-24 h-28 object-cover rounded-xl border border-stone-300 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-24 h-28 rounded-xl bg-stone-200 text-stone-600 flex flex-col items-center justify-center font-bold text-xs border border-stone-300 shrink-0">
                    <User size={30} className="mb-1" />
                    <span>ছবি নেই</span>
                  </div>
                )}

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-stone-400">সদস্যের নাম:</span>
                    <p className="font-bold text-stone-900 text-sm">{selectedMember.name}</p>
                    {selectedMember.nameEn && (
                      <p className="text-[11px] text-stone-500 font-mono">{selectedMember.nameEn}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-stone-400">সদস্য আইডি (UID):</span>
                    <p className="font-black font-mono text-emerald-950 text-sm">{selectedMember.uid}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">মোবাইল নম্বর:</span>
                    <p className="font-bold font-mono text-stone-800">{selectedMember.mobile || "প্রযোজ্য নয়"}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">পেশা / পিতার নাম:</span>
                    <p className="font-semibold text-stone-800">{selectedMember.fatherName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">রক্তের গ্রুপ:</span>
                    <p className="font-bold text-rose-700 font-mono">{selectedMember.blood || "অজানা"}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">যোগদানের তারিখ:</span>
                    <p className="font-semibold text-stone-800 font-mono">{selectedMember.joined || "২৫-০৯-২০২৫"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-stone-400">স্থায়ী ঠিকানা:</span>
                    <p className="font-semibold text-stone-800">{selectedMember.address || "উলানিয়া বাজার, গলাচিপা, পটুয়াখালী"}</p>
                  </div>
                </div>
              </div>

              {/* Member Accumulation Metrics */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs">
                <div>
                  <span className="text-emerald-800 font-medium">মোট সঞ্চয় মূলধন স্থিতি:</span>
                  <p className="text-lg font-black font-mono text-emerald-950 mt-0.5">
                    {currency(memberTotalSavings)}
                  </p>
                </div>
                <div>
                  <span className="text-emerald-800 font-medium">মোট পরিশোধিত কিস্তি:</span>
                  <p className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                    {memberDeposits.length} মাস
                  </p>
                </div>
                <div>
                  <span className="text-emerald-800 font-medium">পরিশোধিত বিলম্ব জরিমানা:</span>
                  <p className="text-lg font-bold font-mono text-amber-900 mt-0.5">
                    {currency(memberTotalFine)}
                  </p>
                </div>
              </div>

              {/* In-Words Bengali Amount Box */}
              <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-300 text-xs text-stone-900 flex items-center gap-2">
                <Award size={15} className="text-emerald-800 shrink-0" />
                <span>
                  <strong>কথায় (মোট সঞ্চয় স্থিতি):</strong> {numberToBnWords(memberTotalSavings)}
                </span>
              </div>

              {/* Table of all member deposits */}
              <div>
                <h4 className="text-xs font-bold text-stone-800 mb-2">
                  সম্পূর্ণ সঞ্চয় খতিয়ান ইতিহাস (All Payment Receipts)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs border border-stone-200">
                    <thead>
                      <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                        <th className="py-2 px-2.5 border-r border-stone-200">ক্র.</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">রসিদ নং</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">কিস্তির মাস</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">জমার তারিখ</th>
                        <th className="py-2 px-2.5 text-right border-r border-stone-200">সঞ্চয় (৳)</th>
                        <th className="py-2 px-2.5 text-right border-r border-stone-200">জরিমানা (৳)</th>
                        <th className="py-2 px-2.5 text-right border-r border-stone-200">মোট গৃহীত (৳)</th>
                        <th className="py-2 px-2.5 border-r border-stone-200">পেমেন্ট মাধ্যম</th>
                        <th className="py-2 px-2.5 text-center">সত্যায়ন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {memberDeposits.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-stone-50">
                          <td className="py-1.5 px-2.5 font-mono text-stone-500 border-r border-stone-200">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono font-bold text-stone-700 border-r border-stone-200">
                            {d.id}
                          </td>
                          <td className="py-1.5 px-2.5 font-semibold text-stone-900 border-r border-stone-200">
                            {d.month}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                            {d.date}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold border-r border-stone-200">
                            {currency(d.amount)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono text-amber-800 border-r border-stone-200">
                            {d.fine ? currency(d.fine) : "-"}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-950 border-r border-stone-200">
                            {currency(d.amount + (d.fine || 0))}
                          </td>
                          <td className="py-1.5 px-2.5 text-[11px] text-stone-600 border-r border-stone-200">
                            {d.method}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              সত্যায়িত
                            </span>
                          </td>
                        </tr>
                      ))}
                      {memberDeposits.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-stone-400">
                            এই সদস্যের কোনো জমার তথ্য এখনও সংরক্ষিত নেই।
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-stone-100 font-black border-t-2 border-stone-300">
                        <td colSpan={4} className="py-2.5 px-2.5 text-right border-r border-stone-200">
                          সদস্যের সর্বমোট খতিয়ান স্থিতি:
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono border-r border-stone-200">
                          {currency(memberTotalSavings)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-amber-900 border-r border-stone-200">
                          {currency(memberTotalFine)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-emerald-950 border-r border-stone-200">
                          {currency(memberTotalSavings + memberTotalFine)}
                        </td>
                        <td colSpan={2} className="text-center text-[10px] text-emerald-800">
                          {memberDeposits.length} টি কিস্তি পরিশোধিত
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Institutional Certification declaration */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                <p className="font-semibold leading-relaxed">
                  📜 <strong>প্রত্যয়ন:</strong> এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, জনাব {selectedMember.name} (আইডি: {selectedMember.uid})
                  ট্রাস্ট গ্রোথ সোসাইটির একজন নিয়মিত নিবন্ধিত সদস্য এবং আজ পর্যন্ত তাঁর সর্বমোট পুঞ্জীভূত সঞ্চয় স্থিতি <strong>{currency(memberTotalSavings)}</strong> ({numberToBnWords(memberTotalSavings)})।
                </p>
              </div>
            </div>
          )}

          {/* REPORT 4: ALL MEMBERS MASTER DIRECTORY */}
          {selectedReport === "all_members" && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500 font-medium">নিবন্ধিত মোট সদস্য:</span>
                  <p className="text-base font-bold font-mono text-stone-900 mt-0.5">{members.length} জন</p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">সক্রিয় সঞ্চয়ী সদস্য:</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-0.5">{members.length} জন (১০০%)</p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">সকল সদস্যের মোট সঞ্চয়:</span>
                  <p className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {currency(deposits.reduce((s, d) => s + Number(d.amount || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                      <th className="py-2.5 px-2.5 border-r border-stone-200">ক্র.</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">আইডি</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">সদস্যের নাম (বাংলা ও ইংরেজি)</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">মোবাইল</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">পিতার নাম</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">রক্তের গ্রুপ</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">যোগদান</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">মোট সঞ্চয় (৳)</th>
                      <th className="py-2.5 px-2.5 text-center">স্বাক্ষর / সিল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {members.map((m, idx) => {
                      const total = deposits
                        .filter((d) => d.memberUid === m.uid)
                        .reduce((s, d) => s + Number(d.amount || 0), 0);
                      return (
                        <tr key={m.uid} className="hover:bg-stone-50">
                          <td className="py-2 px-2.5 font-mono text-stone-500 border-r border-stone-200">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-900 border-r border-stone-200">
                            {m.uid}
                          </td>
                          <td className="py-2 px-2.5 border-r border-stone-200">
                            <span className="font-bold text-stone-900">{m.name}</span>
                            {m.nameEn && <p className="text-[10px] text-stone-400 font-mono">{m.nameEn}</p>}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-stone-700 border-r border-stone-200">
                            {m.mobile || "-"}
                          </td>
                          <td className="py-2 px-2.5 text-stone-600 border-r border-stone-200">
                            {m.fatherName || "-"}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-rose-700 font-bold border-r border-stone-200">
                            {m.blood || "-"}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                            {m.joined || "২৫-০৯-২০২৫"}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-950 border-r border-stone-200">
                            {currency(total)}
                          </td>
                          <td className="py-2 px-2.5 text-center text-[10px] text-stone-400 italic">
                            সক্রিয় সদস্য
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-100 font-black border-t-2 border-stone-300">
                      <td colSpan={7} className="py-2.5 px-2.5 text-right border-r border-stone-200">
                        সকল সদস্যের মোট সঞ্চয় পুঞ্জীভূত:
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-emerald-950 border-r border-stone-200">
                        {currency(deposits.reduce((s, d) => s + Number(d.amount || 0), 0))}
                      </td>
                      <td className="text-center text-[10px] text-stone-600">
                        {members.length} জন রেজিস্টার্ড
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 5: TGS FUND COMPLETE AUDIT */}
          {selectedReport === "tgs_fund" && (
            <div className="space-y-4">
              {/* Constitution Note */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950">
                <p className="leading-relaxed">
                  🛡️ <strong>টিজিএস ফান্ড নীতি:</strong> বিনিয়োগ হতে অর্জিত মোট লভ্যাংশের ৫% স্বয়ংক্রিয়ভাবে এবং সমিতির নিজস্ব বিবিধ আয় নিয়ে এই ফান্ড পরিচালিত হয়। সমিতির সকল প্রাতিষ্ঠানিক পরিচালন ব্যয় এই ফান্ড থেকে নির্বাহ করা হয়। (সদস্যদের নিয়মিত সঞ্চয় এই ফান্ডের বাইরে সম্পূর্ণ আলাদা সংরক্ষিত)।
                </p>
              </div>

              {/* Fund Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500">বিনিয়োগ লভ্যাংশ ৫% শেয়ার:</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                    {currency(fundsSummary.tgsFromInvestProfit)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">সরাসরি ফান্ড আয়:</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                    {currency(fundsSummary.tgsDirectIncomes)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">মোট পরিচালন ব্যয়:</span>
                  <p className="text-base font-bold font-mono text-rose-900 mt-0.5">
                    {currency(fundsSummary.tgsExpensesTotal)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">বর্তমান নেট ফান্ড ব্যালেন্স:</span>
                  <p className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {currency(fundsSummary.tgsFundBalance)}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                      <th className="py-2.5 px-2.5 border-r border-stone-200">তারিখ</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">উৎস / খাত</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">বিবরণ</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">ভাউচার / আইডি</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">জমা (+ ৳)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">খরচ (- ৳)</th>
                      <th className="py-2.5 px-2.5 text-right">ফান্ড স্থিতি (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(() => {
                      let run = 0;
                      return allTgsCombined.map((r, idx) => {
                        run += r.inflow - r.outflow;
                        return (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td className="py-2 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                              {r.date}
                            </td>
                            <td className="py-2 px-2.5 border-r border-stone-200">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  r.inflow > 0
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-rose-100 text-rose-900"
                                }`}
                              >
                                {r.source}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 font-medium text-stone-900 border-r border-stone-200">
                              {r.desc}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-stone-500 border-r border-stone-200">
                              {r.voucher}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800 border-r border-stone-200">
                              {r.inflow > 0 ? `+${currency(r.inflow)}` : "-"}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-800 border-r border-stone-200">
                              {r.outflow > 0 ? `-${currency(r.outflow)}` : "-"}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-black text-stone-900">
                              {currency(run)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 6: DUE / DEFAULTERS LIST */}
          {selectedReport === "due_defaulters" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-amber-700" />
                  <span>
                    <strong>{fromMonth}</strong> মাসে এখনো সঞ্চয় জমা দেননি: <span className="font-bold text-amber-950">{defaultersList.length} জন</span>
                  </span>
                </span>
                <span className="font-mono font-bold text-amber-900">
                  মোট প্রত্যাশিত বকেয়া দাবি: {currency(defaultersList.length * (1000 + (settings.defaultFine || 50)))}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                      <th className="py-2.5 px-2.5 border-r border-stone-200">ক্র.</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">সদস্যের নাম ও আইডি</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">মোবাইল নম্বর</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">বকেয়া মাস</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">নিয়মিত সঞ্চয় (৳)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">বিলম্ব জরিমানা (৳)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">সর্বমোট প্রদেয় (৳)</th>
                      <th className="py-2.5 px-2.5 text-center">তাগিদ নোটিশ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {defaultersList.map((m, idx) => (
                      <tr key={m.uid} className="hover:bg-stone-50">
                        <td className="py-2 px-2.5 font-mono text-stone-500 border-r border-stone-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border-r border-stone-200">
                          <span className="font-bold text-stone-900">{m.name}</span>
                          <span className="text-[10px] font-mono text-stone-500 ml-1">({m.uid})</span>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-stone-700 border-r border-stone-200">
                          {m.mobile || "-"}
                        </td>
                        <td className="py-2 px-2.5 font-semibold text-rose-800 border-r border-stone-200">
                          {m.expectedMonth}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold border-r border-stone-200">
                          {currency(m.expectedSavings)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-amber-800 border-r border-stone-200">
                          {currency(m.dueFine)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-rose-950 border-r border-stone-200">
                          {currency(m.expectedSavings + m.dueFine)}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            তাগিদ প্রেরিত
                          </span>
                        </td>
                      </tr>
                    ))}
                    {defaultersList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-emerald-800 font-bold">
                          🎉 অভিনন্দন! এই মাসের জন্য সকল সদস্যের সঞ্চয় সম্পূর্ণ আদায় হয়েছে। কোনো বকেয়া নেই।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recovery Legal Note */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                <p>
                  ⚠️ সমিতির সংবিধান অনুযায়ী প্রতি মাসের <strong>{settings.deadlineDay || 10} তারিখের</strong> মধ্যে সঞ্চয় জমা দেওয়া বাধ্যতামূলক। নির্ধারিত তারিখ উত্তীর্ণ হলে প্রতি কিস্তির জন্য <strong>৳{settings.defaultFine || 50}</strong> জরিমানা প্রযোজ্য হবে।
                </p>
              </div>
            </div>
          )}

          {/* REPORT 7: INVESTMENTS AUDIT */}
          {selectedReport === "investments" && (
            <div className="space-y-4">
              {/* Investment Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500">মোট বিনিয়োগ মূলধন:</span>
                  <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                    {currency(investEntries.reduce((s, e) => s + Number(e.amount || 0), 0))}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">অর্জিত মোট লভ্যাংশ:</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                    {currency(fundsSummary.totalInvestDividends)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">৫% টিজিএস ফান্ড অংশ:</span>
                  <p className="text-base font-bold font-mono text-amber-900 mt-0.5">
                    {currency(fundsSummary.tgsFromInvestProfit)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">৯৫% সাধারণ বণ্টন অংশ:</span>
                  <p className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {currency(fundsSummary.generalInvestProfit)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                      <th className="py-2.5 px-2.5 border-r border-stone-200">তারিখ</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">প্রকল্প / স্থান</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">বিবরণ</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">বিনিয়োগ মূলধন (৳)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">অর্জিত লভ্যাংশ (৳)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">৫% টিজিএস ফান্ড অংশ</th>
                      <th className="py-2.5 px-2.5 text-right">৯৫% বণ্টন অংশ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {investEntries.map((iv) => {
                      const div = Number(iv.dividend || 0);
                      const tgsPart = Math.round(div * 0.05);
                      const memberPart = div - tgsPart;
                      return (
                        <tr key={iv.id} className="hover:bg-stone-50">
                          <td className="py-2 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                            {iv.date}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-stone-900 border-r border-stone-200">
                            {iv.place || "স্থান নির্ধারিত নয়"}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-stone-800 border-r border-stone-200">
                            {iv.desc}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-stone-900 border-r border-stone-200">
                            {currency(iv.amount)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800 border-r border-stone-200">
                            {div > 0 ? currency(div) : "-"}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-900 border-r border-stone-200">
                            {div > 0 ? currency(tgsPart) : "-"}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-950">
                            {div > 0 ? currency(memberPart) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 8: BANK & CASH STATEMENT */}
          {selectedReport === "bank_cash" && (
            <div className="space-y-4">
              {/* Summary KPIs & Cash Reconciliation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500 font-medium">ব্যাংকে মোট জমা:</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-emerald-900 mt-0.5">
                    +{currency(totalBankCredit)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">ব্যাংক থেকে উত্তোলন:</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-rose-900 mt-0.5">
                    -{currency(totalBankDebit)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">বর্তমান ব্যাংক স্থিতি:</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-blue-950 mt-0.5">
                    {currency(currentBankBalance)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">হাতে নগদ ক্যাশ:</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-amber-950 mt-0.5">
                    {currency(fundsSummary.cashInHand)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                      <th className="py-2.5 px-2.5 border-r border-stone-200">তারিখ</th>
                      <th className="py-2.5 px-2.5 border-r border-stone-200">লেনদেনের বিবরণ</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">জমা / ক্রেডিট (+ ৳)</th>
                      <th className="py-2.5 px-2.5 text-right border-r border-stone-200">উত্তোলন / ডেবিট (- ৳)</th>
                      <th className="py-2.5 px-2.5 text-right">হিসাব ব্যালেন্স (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bankRunningData.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="py-2 px-2.5 font-mono text-stone-600 border-r border-stone-200">
                          {b.date}
                        </td>
                        <td className="py-2 px-2.5 font-semibold text-stone-900 border-r border-stone-200">
                          {b.desc}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800 border-r border-stone-200">
                          {b.credit > 0 ? `+${currency(b.credit)}` : "-"}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-800 border-r border-stone-200">
                          {b.debit > 0 ? `-${currency(b.debit)}` : "-"}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-stone-900">
                          {currency(b.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OFFICIAL DUAL SIGNATURE BLOCK FOR ALL REPORTS */}
          <div className="pt-10 mt-8 border-t-2 border-stone-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-14 flex items-end justify-center pb-1">
                {settings.treasurerSignature ? (
                  <img
                    src={settings.treasurerSignature}
                    alt="কোষাধ্যক্ষ স্বাক্ষর"
                    className="max-h-12 max-w-[140px] object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-stone-400 italic">----------------------------</span>
                )}
              </div>
              <div className="border-t border-stone-800 pt-1.5 inline-block min-w-[180px]">
                <p className="font-bold text-stone-900">{settings.treasurerName || "কোষাধ্যক্ষ"}</p>
                <p className="text-[10px] text-stone-500">কোষাধ্যক্ষ, ট্রাস্ট গ্রোথ সোসাইটি</p>
              </div>
            </div>

            <div>
              <div className="h-14 flex items-end justify-center pb-1">
                {settings.presidentSignature ? (
                  <img
                    src={settings.presidentSignature}
                    alt="সভাপতি / সাধারণ সম্পাদক স্বাক্ষর"
                    className="max-h-12 max-w-[140px] object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-stone-400 italic">----------------------------</span>
                )}
              </div>
              <div className="border-t border-stone-800 pt-1.5 inline-block min-w-[180px]">
                <p className="font-bold text-stone-900">{settings.presidentName || "সভাপতি / সাধারণ সম্পাদক"}</p>
                <p className="text-[10px] text-stone-500">
                  {settings.presidentRole === "secretary" ? "সাধারণ সম্পাদক" : "সভাপতি"}, ট্রাস্ট গ্রোথ সোসাইটি
                </p>
              </div>
            </div>
          </div>

          {/* Institutional Document Security Stamp */}
          <div className="text-center pt-2 border-t border-dashed border-stone-200">
            <span className="text-[10px] text-stone-400 font-mono tracking-wider">
              TRUST GROWTH SOCIETY • OFFICIAL SECURE AUDIT STATEMENT • ALL RIGHTS RESERVED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
