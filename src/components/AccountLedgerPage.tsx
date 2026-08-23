import React, { useState } from "react";
import { PlusCircle, Landmark, TrendingUp, ArrowDownLeft, ArrowUpRight, Search, FileText, Trash2 } from "lucide-react";
import { AccountEntry } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { AttachmentBadge } from "./AttachmentUpload";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface AccountLedgerPageProps {
  title: string;
  balance: number;
  entries: AccountEntry[];
  /** Omit to hide the "New Bank/Investment Entry" button — Super Admin and Treasurer/Secretary only. */
  onAdd?: () => void;
  showPlace?: boolean;
  onDeleteEntry?: (id: string) => void;
}

export function AccountLedgerPage({
  title,
  balance,
  entries,
  onAdd,
  showPlace = false,
  onDeleteEntry,
}: AccountLedgerPageProps) {
  const { language, t, formatNumber, formatMoney } = useLanguage();
  const [filterQuery, setFilterQuery] = useState("");
  const [deletingEntry, setDeletingEntry] = useState<AccountEntry | null>(null);

  const pageTitle = showPlace ? t.nav_invest_ledger : t.nav_bank_ledger;

  const totalIn = entries
    .filter((e) => e.type === "in")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalOut = entries
    .filter((e) => e.type === "out")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalDividend = entries.reduce((s, e) => s + Number(e.dividend || 0), 0);

  const filteredEntries = entries.filter((e) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      e.desc.toLowerCase().includes(q) ||
      (e.place || "").toLowerCase().includes(q) ||
      (e.note || "").toLowerCase().includes(q) ||
      (e.date || "").includes(q)
    );
  });

  return (
    <div id={`${showPlace ? 'invest' : 'bank'}-ledger-view`} className="space-y-5">
      {/* Top Banner with Balances */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-900 text-amber-400 flex items-center justify-center shrink-0">
              {showPlace ? <TrendingUp size={24} /> : <Landmark size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">{pageTitle}</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {showPlace
                  ? (language === 'bn' ? "সোসাইটির প্রকল্প ও বহিরাগত বিনিয়োগের খতিয়ান" : "Society projects and external investment ledgers")
                  : (language === 'bn' ? "সমিতির ব্যাংক অ্যাকাউন্ট ও সঞ্চয়ী স্থিতিপত্র" : "Society bank accounts and savings balance sheets")}
              </p>
            </div>
          </div>

          {onAdd && (
            <div className="flex items-center gap-3">
              <button
                id={`add-${showPlace ? 'invest' : 'bank'}-btn`}
                onClick={onAdd}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle size={16} /> {showPlace ? (language === 'bn' ? 'নতুন বিনিয়োগ এন্ট্রি' : 'New Investment Entry') : (language === 'bn' ? 'নতুন ব্যাংক এন্ট্রি' : 'New Bank Entry')}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-200 text-sm">
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wide">
              {language === 'bn' ? "বর্তমান স্থিতি (Balance)" : "Current Balance"}
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-950 mt-1">{formatMoney(balance)}</p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">
              {showPlace ? (language === 'bn' ? "মোট বিনিয়োগ (+ জমা)" : "Total Invested") : (language === 'bn' ? "মোট জমা (+ ক্রেডিট)" : "Total Deposited")}
            </span>
            <p className="text-base sm:text-xl font-bold font-mono text-emerald-800 mt-1">+{formatMoney(totalIn)}</p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">
              {showPlace ? (language === 'bn' ? "মূলধন ফেরত (- উত্তোলন)" : "Capital Recovered") : (language === 'bn' ? "মোট উত্তোলন (- ডেবিট)" : "Total Withdrawn")}
            </span>
            <p className="text-base sm:text-xl font-bold font-mono text-rose-800 mt-1">-{formatMoney(totalOut)}</p>
          </div>

          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
            <span className="text-xs text-amber-800 font-semibold">
              {showPlace ? (language === 'bn' ? "অর্জিত লভ্যাংশ" : "Earned Profit") : (language === 'bn' ? "ব্যাংক মুনাফা" : "Bank Profit")}
            </span>
            <p className="text-base sm:text-xl font-bold font-mono text-amber-950 mt-1">+{formatMoney(totalDividend)}</p>
            {showPlace && totalDividend > 0 && (
              <p className="text-[10px] text-amber-900 mt-0.5 font-medium">
                {language === 'bn' ? "টিজিএস ৫%:" : "TGS 5%:"} <span className="font-mono font-bold">{formatMoney(Math.round(totalDividend * 0.05))}</span>
              </p>
            )}
          </div>
        </div>

        {/* Auto reconciliation notice */}
        <div className="mt-3.5 px-3.5 py-2.5 bg-stone-50/90 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
          <span className="text-sm">🔄</span>
          <span className="leading-relaxed">
            {showPlace
              ? (language === 'bn'
                  ? "স্বয়ংক্রিয় সমন্বয়: নতুন বিনিয়োগে অর্থ ক্যাশ/ফান্ড থেকে বিনিয়োগ হিসেবে সমন্বয় হয় এবং মূলধন ফেরত আনলে তা ক্যাশে স্বয়ংক্রিয়ভাবে যোগ হয়।"
                  : "Auto Reconciliation: New investment deducts from cash/treasury, and recovered capital adds back to cash.")
              : (language === 'bn'
                  ? "স্বয়ংক্রিয় সমন্বয়: ব্যাংকে টাকা জমা রাখলে তা ফান্ড/ক্যাশ থেকে স্বয়ংক্রিয়ভাবে মাইনাস হয় এবং ব্যাংক থেকে উত্তোলন করলে সরাসরি ক্যাশে যোগ হয়।"
                  : "Auto Reconciliation: Depositing to bank automatically subtracts from cash/fund, and withdrawals automatically add to cash.")}
          </span>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={language === 'bn' ? "বিবরণ বা নোট অনুসন্ধান..." : "Search description or notes..."}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {language === 'bn' ? `মোট এন্ট্রি: ${formatNumber(filteredEntries.length)} টি` : `Total Entries: ${formatNumber(filteredEntries.length)}`}
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {filteredEntries.map((e) => (
            <div
              key={e.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 pr-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    e.type === "in"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {e.type === "in" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-stone-900 text-sm sm:text-base truncate">{e.desc}</p>
                    {e.attachment && (
                      <AttachmentBadge
                        attachment={e.attachment}
                        attachmentName={e.attachmentName}
                        compact
                      />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{language === 'bn' ? 'তারিখ' : 'Date'}: {formatNumber(e.date)}</span>
                    {e.place && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-stone-700">{language === 'bn' ? 'স্থান' : 'Place'}: {e.place}</span>
                      </>
                    )}
                    {e.note && (
                      <>
                        <span>·</span>
                        <span className="italic text-stone-500">{e.note}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={`font-mono font-bold text-base ${
                        e.type === "in" ? "text-emerald-800" : "text-red-700"
                      }`}
                    >
                      {e.type === "in" ? "+" : "-"}
                      {formatMoney(e.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    {language === 'bn' ? 'স্থিতি' : 'Balance'}: {formatMoney(e.balance)}
                  </p>
                  {Number(e.dividend) > 0 && (
                    <div className="flex flex-col items-end gap-0.5 mt-1">
                      <span className="inline-block text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        {language === 'bn' ? 'মুনাফা' : 'Profit'}: {formatMoney(e.dividend)}
                      </span>
                      {showPlace && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          {language === 'bn' ? 'টিজিএস ফান্ড (৫%)' : 'TGS Fund (5%)'}: {formatMoney(Math.round(Number(e.dividend) * 0.05))}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {onDeleteEntry && (
                  <button
                    type="button"
                    onClick={() => setDeletingEntry(e)}
                    title={language === 'bn' ? "এন্ট্রি মুছে ফেলুন" : "Delete Entry"}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div className="p-12 text-center text-stone-400">
              <FileText size={36} className="mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium">{t.no_data_found}</p>
              <p className="text-xs text-stone-400 mt-1">
                {language === 'bn' ? `উপরের "+ নতুন ${pageTitle} এন্ট্রি" বাটনে ক্লিক করে তথ্য যুক্ত করুন` : `Click "+ New ${pageTitle} Entry" button above to add records`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sensitive Record Delete Confirmation Modal */}
      {deletingEntry && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingEntry)}
          title={language === 'bn' ? `${pageTitle} এন্ট্রি মুছে ফেলুন` : `Delete ${pageTitle} Entry`}
          itemDescription={`${deletingEntry.desc} · ${formatMoney(deletingEntry.amount)} (${deletingEntry.type === 'in' ? (language === 'bn' ? 'জমা/ইনফ্লো' : 'Deposit/In') : (language === 'bn' ? 'উত্তোলন/খরচ' : 'Withdrawal/Out')}) · ${language === 'bn' ? 'তারিখ' : 'Date'}: ${deletingEntry.date}`}
          warningMessage={language === 'bn'
            ? `সতর্কতা: এই ${pageTitle} হিসাবের এন্ট্রি মুছে ফেললে চলমান মোট স্থিতি (Running Balance) পরিবর্তিত হবে। আপনি কি নিশ্চিত?`
            : `Warning: Deleting this entry will recalculate the ledger's running balance. Proceed?`}
          onConfirm={() => {
            if (deletingEntry && onDeleteEntry) {
              onDeleteEntry(deletingEntry.id);
            }
            setDeletingEntry(null);
          }}
          onClose={() => setDeletingEntry(null)}
        />
      )}
    </div>
  );
}

