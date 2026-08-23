import React, { useState } from "react";
import {
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ShieldCheck,
  Table as TableIcon,
  Columns,
  Filter,
  Trash2,
} from "lucide-react";
import { FundIncome, Expense, AccountEntry } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { AttachmentBadge } from "./AttachmentUpload";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface FundExpensesPageProps {
  fundIncome: FundIncome[];
  expenses: Expense[];
  investEntries?: AccountEntry[];
  fundTotal: number;
  expensesTotal: number;
  fundNow: number;
  /** Omit both to hide the "New Fund Inflow" / "New Expense" buttons — Super Admin and Treasurer/Secretary only. */
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  onDeleteIncome?: (id: string) => void;
  onDeleteExpense?: (id: string) => void;
}

export function FundExpensesPage({
  fundIncome,
  expenses,
  investEntries = [],
  fundTotal,
  expensesTotal,
  fundNow,
  onAddIncome,
  onAddExpense,
  onDeleteIncome,
  onDeleteExpense,
}: FundExpensesPageProps) {
  const { language, t, formatNumber, formatMoney } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "columns">("table");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "invest_5">("all");
  const [deletingIncome, setDeletingIncome] = useState<FundIncome | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Investment entries that generated dividend (5% goes to TGS Fund)
  const investDividendEntries = investEntries.filter((e) => Number(e.dividend || 0) > 0);
  const totalInvestDividends = investDividendEntries.reduce((s, e) => s + Number(e.dividend || 0), 0);
  const tgsFromInvestProfit = Math.round(totalInvestDividends * 0.05);
  const tgsDirectIncomes = fundIncome.reduce((s, f) => s + Number(f.amount || 0), 0);

  // Inflow items
  const allTgsJomaItems = [
    ...investDividendEntries.map((iv) => {
      const divAmt = Number(iv.dividend || 0);
      const fivePercent = Math.round(divAmt * 0.05);
      return {
        id: `inv-${iv.id}`,
        type: "invest_5" as const,
        source: language === 'bn' ? "বিনিয়োগ ৫% লভ্যাংশ" : "5% Investment Dividend",
        title: iv.desc,
        date: iv.date,
        inflow: fivePercent,
        outflow: 0,
        totalDiv: divAmt,
        voucher: undefined,
        note: iv.note || (language === 'bn' ? "প্রকল্প মুনাফা থেকে ৫% অংশ" : "5% share from project profit"),
        attachment: iv.attachment,
        attachmentName: iv.attachmentName,
      };
    }),
    ...fundIncome.map((f) => ({
      id: f.id,
      type: "direct" as const,
      source: f.source,
      title: f.desc || f.source,
      date: f.date,
      inflow: Number(f.amount || 0),
      outflow: 0,
      totalDiv: undefined,
      voucher: undefined,
      note: f.note,
      attachment: f.attachment,
      attachmentName: f.attachmentName,
    })),
  ];

  // Outflow items (Expenses)
  const allExpenseItems = expenses.map((e) => ({
    id: e.id,
    type: "expense" as const,
    source: language === 'bn' ? "সমিতি পরিচালনা খরচ" : "Society Operating Expense",
    title: e.desc,
    date: e.date,
    inflow: 0,
    outflow: Number(e.amount || 0),
    totalDiv: undefined,
    voucher: e.invoice,
    note: e.note,
    attachment: e.attachment,
    attachmentName: e.attachmentName,
  }));

  // Combined all records sorted by date descending (or ascending for running balance calculation)
  const combinedChronological = [...allTgsJomaItems, ...allExpenseItems].sort((a, b) => {
    return (a.date || "").localeCompare(b.date || "");
  });

  // Calculate Running Balance
  let running = 0;
  const combinedWithBalance = combinedChronological.map((item) => {
    running += item.inflow - item.outflow;
    return {
      ...item,
      balance: running,
    };
  }).reverse(); // Most recent first for display

  const q = searchQuery.trim().toLowerCase();

  const filteredCombined = combinedWithBalance.filter((item) => {
    if (filterType === "income" && item.inflow === 0) return false;
    if (filterType === "expense" && item.outflow === 0) return false;
    if (filterType === "invest_5" && item.type !== "invest_5") return false;

    if (!q) return true;
    return (
      item.source.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.note || "").toLowerCase().includes(q) ||
      (item.voucher || "").toLowerCase().includes(q) ||
      (item.date || "").includes(q)
    );
  });

  const filteredJoma = allTgsJomaItems.filter((item) => {
    if (!q) return true;
    return (
      item.source.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.note || "").toLowerCase().includes(q) ||
      (item.date || "").includes(q)
    );
  });

  const filteredExpenses = expenses.filter((e) => {
    if (!q) return true;
    return (
      e.desc.toLowerCase().includes(q) ||
      (e.invoice || "").toLowerCase().includes(q) ||
      (e.note || "").toLowerCase().includes(q) ||
      (e.date || "").includes(q)
    );
  });

  return (
    <div id="tgs-fund-view" className="space-y-5">
      {/* Top Banner with Balances & Quick Actions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {language === 'bn' ? "বিশেষ তহবিল" : "Special Reserve Fund"}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {language === 'bn' ? "স্থাপিত ২৫-০৯-২০২৫" : "Est. 25-09-2025"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">{t.nav_tgs_fund}</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === 'bn'
                  ? "বিনিয়োগের ৫% লভ্যাংশ অংশ ও বিশেষ জমার মাধ্যমে সংরক্ষিত পরিচালনা ও জরুরি তহবিল"
                  : "Operating & emergency reserve fund accumulated from 5% investment profits and direct contributions"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onAddIncome && (
              <button
                id="add-tgs-income-btn"
                onClick={onAddIncome}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle size={15} className="text-amber-300" />
                <span>{language === 'bn' ? "+ নতুন জমা এন্ট্রি" : "+ New Fund Inflow"}</span>
              </button>
            )}

            {onAddExpense && (
              <button
                id="add-tgs-expense-btn"
                onClick={onAddExpense}
                className="flex items-center gap-1.5 bg-rose-800 hover:bg-rose-900 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>{language === 'bn' ? "- নতুন খরচ এন্ট্রি" : "- New Expense"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-stone-200 text-sm">
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wide">
              {language === 'bn' ? "টিজিএস বর্তমান নেট স্থিতি" : "TGS Current Net Balance"}
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-950 mt-1">
              {formatMoney(fundNow)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              ({language === 'bn' ? 'মোট জমা' : 'Inflows'} {formatMoney(fundTotal)} − {language === 'bn' ? 'খরচ' : 'Expenses'} {formatMoney(expensesTotal)})
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
            <span className="text-xs text-amber-900 font-semibold">
              {language === 'bn' ? "মোট ফান্ড জমা (Inflows)" : "Total Fund Inflows"}
            </span>
            <p className="text-xl font-bold font-mono text-amber-950 mt-1">
              +{formatMoney(fundTotal)}
            </p>
            <p className="text-[11px] text-stone-600 mt-1">
              {language === 'bn' ? "৫% লভ্যাংশ:" : "5% Dividend:"} <span className="font-bold text-amber-900">{formatMoney(tgsFromInvestProfit)}</span> | {language === 'bn' ? "সরাসরি জমা:" : "Direct:"} <span className="font-bold">{formatMoney(tgsDirectIncomes)}</span>
            </p>
          </div>

          <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200">
            <span className="text-xs text-rose-900 font-semibold">
              {language === 'bn' ? "মোট ব্যয় / খরচ (Expenses)" : "Total Expenses"}
            </span>
            <p className="text-xl font-bold font-mono text-rose-950 mt-1">
              -{formatMoney(expensesTotal)}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              {language === 'bn' ? "মোট অনুমোদিত ভাউচার:" : "Approved Vouchers:"} <span className="font-bold text-rose-900">{formatNumber(expenses.length)} {language === 'bn' ? 'টি' : ''}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher (Table vs Columns), Filter Buttons, and Search */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher: Single Combined Table vs 2-Column Split */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              id="tgs-view-table-btn"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-emerald-950 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <TableIcon size={14} />
              <span>{language === 'bn' ? "একক সমন্বিত টেবিল" : "Unified Table View"}</span>
            </button>
            <button
              id="tgs-view-columns-btn"
              onClick={() => setViewMode("columns")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "columns"
                  ? "bg-white text-emerald-950 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Columns size={14} />
              <span>{language === 'bn' ? "পাশাপাশি ২-কলাম ভিউ" : "2-Column Split View"}</span>
            </button>
          </div>

          {/* Filter Pills for Table Mode */}
          {viewMode === "table" && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-emerald-900 text-white font-bold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {language === 'bn' ? `সব এন্ট্রি (${formatNumber(combinedWithBalance.length)})` : `All Entries (${formatNumber(combinedWithBalance.length)})`}
              </button>
              <button
                onClick={() => setFilterType("income")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === "income"
                    ? "bg-emerald-700 text-white font-bold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {language === 'bn' ? "জমা (+)" : "Inflow (+)"}
              </button>
              <button
                onClick={() => setFilterType("expense")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === "expense"
                    ? "bg-rose-700 text-white font-bold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {language === 'bn' ? "খরচ (-)" : "Expense (-)"}
              </button>
              <button
                onClick={() => setFilterType("invest_5")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === "invest_5"
                    ? "bg-amber-600 text-white font-bold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {language === 'bn' ? "৫% লভ্যাংশ" : "5% Profit"}
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="tgs-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? "বিবরণ, প্রকল্প, ভাউচার নম্বর বা তারিখ দিয়ে খুঁজুন..." : "Search description, project, voucher or date..."}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 shadow-2xs focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* VIEW 1: UNIFIED SINGLE COMBINED TABLE */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                <TableIcon size={16} className="text-emerald-800" /> {language === 'bn' ? "টিজিএস ফান্ড সমন্বিত জমা ও খরচ খতিয়ান টেবিল" : "TGS Fund Unified Statement Ledger"}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === 'bn'
                  ? `সকল ৫% বিনিয়োগ লভ্যাংশ, প্রত্যক্ষ জমা ও ব্যয়ের সমন্বিত ক্রমিক বিবরণী (মোট ${formatNumber(filteredCombined.length)} টি রেকর্ড)`
                  : `Comprehensive chronological statement of 5% investment shares, direct inflows, and expenditures (${formatNumber(filteredCombined.length)} records)`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 font-medium">{language === 'bn' ? "বর্তমান ব্যালেন্স: " : "Current Balance: "}</span>
              <span className="text-sm sm:text-base font-black font-mono text-emerald-950">
                {formatMoney(fundNow)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/80 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{language === 'bn' ? "তারিখ" : "Date"}</th>
                  <th className="py-3 px-4">{language === 'bn' ? "খাত / উৎস" : "Category / Source"}</th>
                  <th className="py-3 px-4">{language === 'bn' ? "বিবরণ ও ভাউচার" : "Description & Voucher"}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? "জমা (+ ৳)" : "Inflow (+)"}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? "খরচ (- ৳)" : "Expense (-)"}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? "ফান্ড স্থিতি (ব্যালেন্স)" : "Fund Balance"}</th>
                  <th className="py-3 px-4">{language === 'bn' ? "মন্তব্য" : "Remarks"}</th>
                  <th className="py-3 px-4 text-center">{language === 'bn' ? "অ্যাকশন" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCombined.map((row, idx) => {
                  return (
                    <tr key={row.id || idx} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap">
                        {formatNumber(row.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            row.type === "invest_5"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : row.type === "direct"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-rose-100 text-rose-900 border border-rose-300"
                          }`}
                        >
                          {row.type === "invest_5"
                            ? (language === 'bn' ? "৫% লভ্যাংশ" : "5% Dividend")
                            : row.type === "direct"
                            ? row.source
                            : (language === 'bn' ? "ব্যয়/খরচ" : "Expense")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-stone-900">
                            {row.title}
                          </span>
                          {row.attachment && (
                            <AttachmentBadge
                              attachment={row.attachment}
                              attachmentName={row.attachmentName}
                              compact
                            />
                          )}
                        </div>
                        {row.voucher && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-bold bg-stone-100 border border-stone-300 text-stone-700 px-1.5 py-0.2 rounded">
                            {language === 'bn' ? `ভাউচার #${formatNumber(row.voucher)}` : `Voucher #${formatNumber(row.voucher)}`}
                          </span>
                        )}
                        {row.totalDiv && (
                          <span className="text-[11px] text-stone-500 ml-1.5">
                            ({language === 'bn' ? 'মোট মুনাফা' : 'Total Profit'}: {formatMoney(row.totalDiv)})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {row.inflow > 0 ? (
                          <span className="text-emerald-700 font-bold">+{formatMoney(row.inflow)}</span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {row.outflow > 0 ? (
                          <span className="text-rose-700 font-bold">-{formatMoney(row.outflow)}</span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-stone-900 whitespace-nowrap bg-stone-50/50">
                        {formatMoney(row.balance)}
                      </td>
                      <td className="py-3 px-4 text-stone-500 max-w-[200px] truncate text-[11px]">
                        {row.note || "-"}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {row.type === "direct" && onDeleteIncome && (
                          <button
                            type="button"
                            onClick={() => {
                              const found = fundIncome.find((fi) => fi.id === row.id);
                              if (found) setDeletingIncome(found);
                            }}
                            title={language === 'bn' ? "ফান্ড আয় মুছুন" : "Delete Fund Income"}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        {row.type === "expense" && onDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => {
                              const found = expenses.find((ex) => ex.id === row.id);
                              if (found) setDeletingExpense(found);
                            }}
                            title={language === 'bn' ? "খরচ রেকর্ড মুছুন" : "Delete Expense Record"}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        {row.type === "invest_5" && (
                          <span className="text-[10px] text-stone-400 italic">{language === 'bn' ? "বিনিয়োগ খতিয়ানে" : "In Investment Ledger"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredCombined.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      {t.no_data_found}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: 2-COLUMN SIDE-BY-SIDE GRID (Left = Inflows, Right = Expenses) */}
      {viewMode === "columns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT COLUMN: টিজিএস ফান্ড জমা খতিয়ান */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 bg-emerald-50/90 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                  <ArrowDownLeft size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                    {language === 'bn' ? "টিজিএস ফান্ড জমা খতিয়ান" : "TGS Fund Inflows Ledger"}
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    {language === 'bn' ? `৫% বিনিয়োগ লভ্যাংশ ও বিশেষ জমা (${formatNumber(filteredJoma.length)} টি)` : `5% investment dividends & contributions (${formatNumber(filteredJoma.length)})`}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-900">
                +{formatMoney(fundTotal)}
              </span>
            </div>

            <div className="divide-y divide-stone-100 overflow-y-auto max-h-[560px]">
              {filteredJoma.map((item) => (
                <div key={item.id} className="p-3.5 hover:bg-stone-50 transition-colors flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.type === "invest_5"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {item.type === "invest_5" ? (language === 'bn' ? "৫% লভ্যাংশ" : "5% Dividend") : item.source}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">{formatNumber(item.date)}</span>
                      {item.attachment && (
                        <AttachmentBadge
                          attachment={item.attachment}
                          attachmentName={item.attachmentName}
                          compact
                        />
                      )}
                    </div>
                    <p className="font-semibold text-stone-900 text-xs sm:text-sm mt-1 truncate">
                      {item.title}
                    </p>
                    {item.totalDiv && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        ({language === 'bn' ? 'প্রকল্প লভ্যাংশ' : 'Project Dividend'}: {formatMoney(item.totalDiv)})
                      </p>
                    )}
                    {item.note && (
                      <p className="text-[11px] text-stone-400 italic mt-0.5 truncate">{item.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm sm:text-base font-black font-mono text-emerald-800">
                      +{formatMoney(item.inflow)}
                    </p>
                    {item.type === "direct" && onDeleteIncome && (
                      <button
                        type="button"
                        onClick={() => {
                          const found = fundIncome.find((fi) => fi.id === item.id);
                          if (found) setDeletingIncome(found);
                        }}
                        title={language === 'bn' ? "ফান্ড আয় মুছুন" : "Delete Fund Income"}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredJoma.length === 0 && (
                <div className="p-8 text-center text-xs text-stone-400">
                  {t.no_data_found}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: টিজিএস খরচ খতিয়ান */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 bg-rose-50/90 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-800 text-white flex items-center justify-center font-bold text-xs">
                  <ArrowUpRight size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-rose-950">
                    {language === 'bn' ? "টিজিএস খরচ খতিয়ান" : "TGS Fund Expenses Ledger"}
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    {language === 'bn' ? `সমিতির সকল অনুমোদিত খরচের তালিকা (${formatNumber(filteredExpenses.length)} টি)` : `All approved society operating expenses (${formatNumber(filteredExpenses.length)})`}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-rose-900">
                -{formatMoney(expensesTotal)}
              </span>
            </div>

            <div className="divide-y divide-stone-100 overflow-y-auto max-h-[560px]">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-3.5 hover:bg-stone-50 transition-colors flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {exp.invoice && (
                        <span className="text-[10px] font-mono font-bold bg-stone-100 border border-stone-300 text-stone-800 px-2 py-0.5 rounded">
                          {language === 'bn' ? `ভাউচার #${formatNumber(exp.invoice)}` : `Voucher #${formatNumber(exp.invoice)}`}
                        </span>
                      )}
                      <span className="text-xs text-stone-500 font-mono">{formatNumber(exp.date)}</span>
                      {exp.attachment && (
                        <AttachmentBadge
                          attachment={exp.attachment}
                          attachmentName={exp.attachmentName}
                          compact
                        />
                      )}
                    </div>
                    <p className="font-semibold text-stone-900 text-xs sm:text-sm mt-1">
                      {exp.desc}
                    </p>
                    {exp.note && (
                      <p className="text-[11px] text-stone-400 italic mt-0.5 truncate">{exp.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm sm:text-base font-black font-mono text-rose-800">
                      -{formatMoney(exp.amount)}
                    </p>
                    {onDeleteExpense && (
                      <button
                        type="button"
                        onClick={() => setDeletingExpense(exp)}
                        title={language === 'bn' ? "খরচ রেকর্ড মুছুন" : "Delete Expense Record"}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="p-8 text-center text-xs text-stone-400">
                  {t.no_data_found}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Delete Modal for Fund Income */}
      {deletingIncome && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingIncome)}
          title={language === 'bn' ? "ফান্ড জমা আয় মুছে ফেলুন" : "Delete Fund Income"}
          itemDescription={language === 'bn'
            ? `${deletingIncome.source} · ${deletingIncome.desc} · ${formatMoney(deletingIncome.amount)} (তারিখ: ${deletingIncome.date})`
            : `${deletingIncome.source} · ${deletingIncome.desc} · ${formatMoney(deletingIncome.amount)} (Date: ${deletingIncome.date})`}
          warningMessage={language === 'bn'
            ? "সতর্কতা: এই সরাসরি ফান্ড জমার রেকর্ড মুছে ফেললে টিজিএস মোট ব্যালেন্স হ্রাস পাবে। আপনি কি নিশ্চিত?"
            : "Warning: Deleting this fund income record will reduce the TGS Fund balance. Proceed?"}
          onConfirm={() => {
            if (deletingIncome && onDeleteIncome) {
              onDeleteIncome(deletingIncome.id);
            }
            setDeletingIncome(null);
          }}
          onClose={() => setDeletingIncome(null)}
        />
      )}

      {/* Sensitive Delete Modal for Expense */}
      {deletingExpense && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingExpense)}
          title={language === 'bn' ? "খরচ রেকর্ড মুছে ফেলুন" : "Delete Expense Record"}
          itemDescription={language === 'bn'
            ? `${deletingExpense.desc} · ${formatMoney(deletingExpense.amount)} (ভাউচার #${deletingExpense.invoice || 'N/A'}, তারিখ: ${deletingExpense.date})`
            : `${deletingExpense.desc} · ${formatMoney(deletingExpense.amount)} (Voucher #${deletingExpense.invoice || 'N/A'}, Date: ${deletingExpense.date})`}
          warningMessage={language === 'bn'
            ? "সতর্কতা: এই ব্যয়ের ভাউচার ও রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?"
            : "Warning: Deleting this expense voucher will permanently remove it from the society expense ledger. Proceed?"}
          onConfirm={() => {
            if (deletingExpense && onDeleteExpense) {
              onDeleteExpense(deletingExpense.id);
            }
            setDeletingExpense(null);
          }}
          onClose={() => setDeletingExpense(null)}
        />
      )}
    </div>
  );
}

