import React, { useState } from "react";
import { PlusCircle, Search, Receipt, Filter, Download, Trash2 } from "lucide-react";
import { Deposit, Member } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { AttachmentBadge } from "./AttachmentUpload";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface DepositsLedgerProps {
  deposits: Deposit[];
  members: Member[];
  /** Omit to hide the "Add Deposit" button — Super Admin and Treasurer/Secretary only. */
  onAddDeposit?: () => void;
  onViewReceipt: (deposit: Deposit) => void;
  onDeleteDeposit?: (depositId: string) => void;
}

export function DepositsLedger({
  deposits,
  members,
  onAddDeposit,
  onViewReceipt,
  onDeleteDeposit,
}: DepositsLedgerProps) {
  const { language, t, tMonth, tMethod, formatNumber, formatUid, formatMoney } = useLanguage();
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingDeposit, setDeletingDeposit] = useState<Deposit | null>(null);

  const getMember = (uid: string) => members.find((m) => m.uid === uid);
  const nameFor = (uid: string) => {
    const m = getMember(uid);
    if (!m) return uid;
    return (language === 'en' && m.nameEn) ? m.nameEn : m.name;
  };

  const rawUniqueMonths = Array.from(new Set(deposits.map((d) => d.month)));

  const filtered = deposits.filter((d) => {
    const matchesMonth = monthFilter === "all" || d.month === monthFilter;
    const memberName = nameFor(d.memberUid).toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      memberName.includes(q) ||
      d.memberUid.toLowerCase().includes(q) ||
      (d.note || "").toLowerCase().includes(q) ||
      d.method.toLowerCase().includes(q);

    return matchesMonth && matchesQuery;
  });

  const filteredTotal = filtered.reduce((s, d) => s + Number(d.amount || 0), 0);
  const filteredFines = filtered.reduce((s, d) => s + Number(d.fine || 0), 0);

  return (
    <div id="deposits-ledger-tab" className="space-y-4">
      {/* Top filters and actions */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="search-deposits-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.deposits_search || "Search by member name or receipt #..."}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 bg-stone-50/50 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-all"
            />
          </div>

          {onAddDeposit && (
            <button
              id="ledger-add-deposit-btn"
              onClick={onAddDeposit}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle size={16} /> {t.btn_add_deposit}
            </button>
          )}
        </div>

        {/* Month Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1">
          <span className="text-stone-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <Filter size={13} /> {t.filter_month}:
          </span>
          <button
            onClick={() => setMonthFilter("all")}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              monthFilter === "all"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {t.filter_all_months}
          </button>
          {rawUniqueMonths.map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(m)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                monthFilter === m
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {tMonth(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger list container */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-stone-800 text-sm sm:text-base">
              {t.deposits_title} ({formatNumber(filtered.length)} {language === 'bn' ? 'টি' : 'Entries'})
            </h3>
            {filteredFines > 0 && (
              <p className="text-xs text-red-600 font-medium">
                {language === 'bn' ? 'মোট জরিমানা:' : 'Total Fines:'} {formatMoney(filteredFines)}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-500">
              {language === 'bn' ? 'নির্বাচিত মোট জমা:' : 'Total Collection:'}
            </span>
            <p className="font-mono font-bold text-emerald-900 text-lg">{formatMoney(filteredTotal)}</p>
          </div>
        </div>

        <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="px-5 py-3.5 flex items-center justify-between text-sm hover:bg-stone-50/80 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-stone-900 truncate">{nameFor(d.memberUid)}</p>
                  <span className="font-mono text-[11px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                    {formatUid(d.memberUid)}
                  </span>
                  {d.attachment && (
                    <AttachmentBadge
                      attachment={d.attachment}
                      attachmentName={d.attachmentName}
                      compact
                    />
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-stone-700">{tMonth(d.month)}</span>
                  <span>·</span>
                  <span>{language === 'bn' ? 'তারিখ:' : 'Date:'} {formatNumber(d.date)}</span>
                  <span>·</span>
                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-medium text-[11px]">
                    {tMethod(d.method)}
                  </span>
                  {d.note && <span className="italic text-stone-400">({d.note})</span>}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-900 text-base">{formatMoney(d.amount)}</span>
                  {Number(d.fine) > 0 && (
                    <p className="text-[11px] text-red-600 font-mono">
                      +{formatMoney(d.fine)} {language === 'bn' ? 'জরিমানা' : 'Fine'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onViewReceipt(d)}
                  title={t.btn_view_receipt || (language === 'bn' ? "রসিদ দেখুন" : "View Receipt")}
                  className="p-1.5 text-stone-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Receipt size={16} />
                </button>
                {onDeleteDeposit && (
                  <button
                    onClick={() => setDeletingDeposit(d)}
                    title={language === 'bn' ? "জমা কিস্তি মুছে ফেলুন" : "Delete Deposit"}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-10 text-center text-stone-400">
              <p className="text-sm">{t.no_data_found}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sensitive Record Delete Confirmation Modal */}
      {deletingDeposit && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingDeposit)}
          title={language === 'bn' ? "জমা কিস্তি মুছে ফেলুন" : "Delete Deposit Record"}
          itemDescription={`${nameFor(deletingDeposit.memberUid)} (${formatUid(deletingDeposit.memberUid)}) · ${tMonth(deletingDeposit.month)} · ${formatMoney(deletingDeposit.amount)} (${language === 'bn' ? 'রসিদ' : 'Receipt'} #${deletingDeposit.id})`}
          warningMessage={language === 'bn' 
            ? "এই জমা কিস্তির রসিদ ও হিসাব স্থায়ীভাবে লেজার থেকে মুছে ফেলা হবে। সংশ্লিষ্ট সদস্যের মোট জমার পরিমাণ কমে যাবে।"
            : "This deposit receipt and entry will be permanently removed. The member's total savings balance will decrease accordingly."}
          onConfirm={() => {
            if (deletingDeposit && onDeleteDeposit) {
              onDeleteDeposit(deletingDeposit.id);
            }
            setDeletingDeposit(null);
          }}
          onClose={() => setDeletingDeposit(null)}
        />
      )}
    </div>
  );
}
