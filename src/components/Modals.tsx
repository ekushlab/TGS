import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toJpeg, toPng, toBlob } from 'html-to-image';
import {
  X,
  Check,
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Cloud,
  FileSpreadsheet,
  Database,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ImageDown,
  Sparkles,
  Eye,
  Camera,
  User,
  Trash2,
  Crop,
  Edit,
  PenTool,
  RotateCcw,
  MessageCircle,
  Send,
  Users,
  CreditCard,
  Heart,
  ShieldAlert,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Member, AccountEntry, FundIncome, Expense, Deposit, AppSettings, AppData } from '../types';
import { TgsLogoSvg, PageWatermark } from './TgsLogoWatermark';
import { AttachmentUpload } from './AttachmentUpload';
import { NidDocumentUpload, NomineePhotoUpload } from './DocumentUploads';
import {
  getRecentMonths,
  getDepositTimelineMonths,
  getCurrentRunningMonth,
  toBnDigits,
  METHODS,
  currency,
  calculateAutoFine,
  calculateDetailedAutoFine,
  processMemberPhoto,
  generateWhatsAppReceiptText,
  openWhatsApp,
  DEFAULT_SETTINGS,
  exportFullBackupJson,
  downloadExcel,
  buildBackupCsv,
  getConsecutiveMonths,
  getMemberPaidMonthKeys,
  isMemberMonthPaid,
  getMonthIndexKey,
  validatePhotoFileSize,
} from '../utils/helpers';

interface ModalProps {
  id?: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ id = "app-modal", title, onClose, children, maxWidth = "max-w-lg" }: ModalProps) {
  return (
    <div
      id={id}
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-150 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.stopPropagation();
      }}
    >
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <h3 className="font-bold text-stone-900 text-base sm:text-lg">{title}</h3>
          <button
            id="modal-close-btn"
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-stone-600">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {hint && <span className="text-[11px] text-stone-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-stone-50/50 hover:bg-white text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all";

/* =========================================================================
   ADD DEPOSIT MODAL (With Multiplicative Auto Fine & Duplicate Month Prevention)
   ========================================================================= */
export function AddDepositModal({
  members,
  deposits = [],
  defaultUid,
  settings = DEFAULT_SETTINGS,
  onClose,
  onSubmit,
}: {
  members: Member[];
  deposits?: Deposit[];
  defaultUid?: string | null;
  settings?: AppSettings;
  onClose: () => void;
  onSubmit: (entry: Omit<Deposit, 'id'>) => void;
}) {
  const runningMonth = useMemo(() => getCurrentRunningMonth(), []);
  const timelineMonths = useMemo(() => {
    const list = getDepositTimelineMonths(2025, 9, 60);
    if (!list.includes(runningMonth)) {
      list.push(runningMonth);
    }
    return list;
  }, [runningMonth]);

  const [memberUid, setMemberUid] = useState(defaultUid || members[0]?.uid || "");

  // Calculate all months already paid by the selected member
  const paidMonthKeys = useMemo(() => {
    return getMemberPaidMonthKeys(memberUid, deposits);
  }, [memberUid, deposits]);

  // Default to Running Month (রানিং মাস)
  const [month, setMonth] = useState<string>(runningMonth);
  const [monthsCount, setMonthsCount] = useState<number>(1);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState(METHODS[0]);
  const [fine, setFine] = useState<number>(() => {
    return calculateAutoFine(
      new Date().toLocaleDateString('en-GB'),
      runningMonth,
      settings.deadlineDay ?? 10,
      settings.defaultFine ?? 50,
      1
    );
  });
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [autoFineNotice, setAutoFineNotice] = useState("");

  const handlePrevMonth = () => {
    const currentIndex = timelineMonths.indexOf(month);
    if (currentIndex > 0) {
      setMonth(timelineMonths[currentIndex - 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = timelineMonths.indexOf(month);
    if (currentIndex >= 0 && currentIndex < timelineMonths.length - 1) {
      setMonth(timelineMonths[currentIndex + 1]);
    }
  };

  // Determine all months covered by this proposed deposit
  const targetMonths = useMemo(() => {
    return getConsecutiveMonths(month, monthsCount);
  }, [month, monthsCount]);

  // Check for any duplicate / already paid months
  const overlappingPaidMonths = useMemo(() => {
    return targetMonths.filter((m) => paidMonthKeys.has(getMonthIndexKey(m)));
  }, [targetMonths, paidMonthKeys]);

  const isDuplicatePayment = overlappingPaidMonths.length > 0;

  // Handler when number of months changes
  const handleMonthsCountChange = (newCount: number) => {
    const count = Math.max(1, newCount);
    setMonthsCount(count);
    setAmount(count * 1000);
    const detailed = calculateDetailedAutoFine(
      date,
      month,
      settings.deadlineDay ?? 10,
      settings.defaultFine ?? 50,
      count
    );
    setFine(detailed.fine);
    setAutoFineNotice(detailed.notice);
  };

  // Re-calculate fine whenever date, month, or monthsCount changes
  useEffect(() => {
    const detailed = calculateDetailedAutoFine(
      date,
      month,
      settings.deadlineDay ?? 10,
      settings.defaultFine ?? 50,
      monthsCount
    );
    setFine(detailed.fine);
    setAutoFineNotice(detailed.notice);
  }, [date, month, monthsCount, settings.deadlineDay, settings.defaultFine]);

  const adjustFine = (delta: number) => {
    setFine((prev) => Math.max(0, prev + delta));
  };

  const setFineMultiplier = (months: number) => {
    const perMonth = settings.defaultFine ?? 50;
    setFine(months * perMonth);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberUid || !amount) return;
    if (isDuplicatePayment) {
      alert(`এই সদস্যের ${overlappingPaidMonths.join(', ')} মাসের জমা ইতোমধ্যে পরিশোধ করা হয়েছে। ডুপ্লিকেট জমা গ্রহণ করা সম্ভব নয়।`);
      return;
    }

    onSubmit({
      memberUid,
      month,
      monthsCount: Number(monthsCount) || 1,
      date: date || new Date().toLocaleDateString('en-GB'),
      amount: Number(amount),
      method,
      fine: Number(fine) || 0,
      note,
      attachment,
      attachmentName,
      createdAt: Date.now(),
    });
  };

  const selectedMember = members.find((m) => m.uid === memberUid);
  const memberDepositsCount = deposits.filter((d) => d.memberUid === memberUid).length;
  const finePerMonth = settings.defaultFine ?? 50;

  return (
    <Modal id="add-deposit-modal" title="নতুন মাসিক সঞ্চয় জমা" onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="সদস্য নির্বাচন করুন" required>
          <select
            value={memberUid}
            onChange={(e) => setMemberUid(e.target.value)}
            className={inputCls}
          >
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.name} ({m.uid}) {m.mobile ? `· ${m.mobile}` : ''}
              </option>
            ))}
          </select>
        </Field>

        {selectedMember && (
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900 flex items-center justify-between flex-wrap gap-2">
            <span>সদস্য: <strong>{selectedMember.name}</strong> ({selectedMember.uid})</span>
            <div className="flex items-center gap-2 font-mono text-emerald-800">
              <span>পরিশোধিত কিস্তি: <strong>{memberDepositsCount} টি</strong></span>
              <span>মোবাইল: {selectedMember.mobile || "নম্বর নেই"}</span>
            </div>
          </div>
        )}

        {/* Duplicate Payment Block Alert */}
        {isDuplicatePayment && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-xl text-xs text-rose-950 flex items-start gap-2.5 animate-in fade-in shadow-xs">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 text-sm">
                🚫 বকেয়া ছাড়া জমা গ্রহণ নিষিদ্ধ / ইতোমধ্যে পরিশোধিত মাস!
              </p>
              <p className="text-rose-800 leading-relaxed">
                এই সদস্যের (<strong>{selectedMember?.name}</strong>) এর নির্বাচিত{' '}
                <strong className="underline decoration-rose-500 font-bold">
                  {overlappingPaidMonths.join(', ')}
                </strong>{' '}
                মাসের সঞ্চয় জমা ইতোমধ্যে সম্পন্ন হয়েছে (বকেয়া নেই)। যে মাসের জমা একবার সম্পন্ন হয়ে গেছে, সেই মাসের পুনরায় ইনপুট বা জমা নেওয়া যাবে না।
              </p>
              <p className="text-rose-900 font-semibold pt-0.5">
                💡 অনুগ্রহ করে নিচের তালিকা থেকে অপরিশোধিত বা বকেয়া মাস নির্বাচন করুন।
              </p>
            </div>
          </div>
        )}

        {/* Month & Period / Months Count Selection */}
        <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">কয় মাসের সঞ্চয় জমা দিচ্ছেন?</span>
            <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
              {monthsCount} মাসের সঞ্চয়
            </span>
          </div>

          {/* Quick Month Count Selectors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 12].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => handleMonthsCountChange(cnt)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  monthsCount === cnt
                    ? "bg-emerald-800 text-white border-emerald-800 shadow-xs scale-105"
                    : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                }`}
              >
                {cnt === 1 ? "১ মাস" : cnt === 2 ? "২ মাস" : cnt === 3 ? "৩ মাস" : cnt === 4 ? "৪ মাস" : cnt === 5 ? "৫ মাস" : cnt === 6 ? "৬ মাস" : "১ বছর"}
              </button>
            ))}
            
            <div className="flex items-center ml-auto gap-1">
              <button
                type="button"
                onClick={() => handleMonthsCountChange(Math.max(1, monthsCount - 1))}
                className="p-1 rounded bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs cursor-pointer"
                title="১ মাস কমান"
              >
                <Minus size={13} />
              </button>
              <span className="font-mono font-bold text-xs px-1 text-stone-800">{monthsCount}</span>
              <button
                type="button"
                onClick={() => handleMonthsCountChange(monthsCount + 1)}
                className="p-1 rounded bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs cursor-pointer"
                title="১ মাস বাড়ান"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="কোন মাস থেকে শুরু" required hint="ডিফল্ট রানিং মাস · পূর্ববর্তী ও পরবর্তী মাসগুলোতে যাওয়ার সুবিধা">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={timelineMonths.indexOf(month) <= 0}
                  className="px-2.5 py-2 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-stone-700 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  title="পূর্ববর্তী মাস"
                >
                  <ChevronLeft size={16} />
                </button>

                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={`flex-1 ${inputCls} ${
                    paidMonthKeys.has(getMonthIndexKey(month)) ? "border-rose-400 bg-rose-50/50" : ""
                  }`}
                >
                  {Array.from(new Set(timelineMonths.map((m) => m.split(' ')[1]))).map((yearBn) => {
                    const monthsInYear = timelineMonths.filter((m) => m.endsWith(yearBn));
                    return (
                      <optgroup key={yearBn} label={`${yearBn} সাল ${yearBn === '২০২৫' ? '(প্রতিষ্ঠার ১ম অর্থবছর)' : ''}`}>
                        {monthsInYear.map((m) => {
                          const isPaid = paidMonthKeys.has(getMonthIndexKey(m));
                          const isRunning = m === runningMonth;
                          const timelineIdx = timelineMonths.indexOf(m) + 1;
                          const serialLabel =
                            timelineIdx === 1 ? '১ম কিস্তি · ' :
                            timelineIdx === 2 ? '২য় কিস্তি · ' :
                            timelineIdx === 3 ? '৩য় কিস্তি · ' :
                            `${toBnDigits(timelineIdx)}ম কিস্তি · `;
                          return (
                            <option key={m} value={m}>
                              {serialLabel}{m} {isRunning ? ' ⭐ (রানিং মাস)' : ''} {isPaid ? ' (পরিশোধিত ✓)' : ' (বকেয়া)'}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={timelineMonths.indexOf(month) >= timelineMonths.length - 1}
                  className="px-2.5 py-2 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-stone-700 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  title="পরবর্তী মাস"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <button
                  type="button"
                  onClick={() => setMonth(runningMonth)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    month === runningMonth
                      ? "bg-amber-400 text-emerald-950 border-amber-500 font-bold shadow-xs"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                  title="বর্তমান রানিং মাস নির্বাচন করুন"
                >
                  🗓️ রানিং মাস ({runningMonth})
                </button>

                <button
                  type="button"
                  onClick={() => setMonth("অক্টোবর ২০২৫")}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    month === "অক্টোবর ২০২৫"
                      ? "bg-emerald-800 text-white border-emerald-900 font-bold"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  title="প্রতিষ্ঠার ১ম কিস্তি (অক্টোবর ২০২৫) নির্বাচন করুন"
                >
                  📌 ১ম কিস্তি (অক্টোবর ২০২৫)
                </button>
                {(() => {
                  const firstUnpaid = timelineMonths.find((m) => !paidMonthKeys.has(getMonthIndexKey(m)));
                  if (firstUnpaid && firstUnpaid !== "অক্টোবর ২০২৫" && firstUnpaid !== runningMonth) {
                    return (
                      <button
                        type="button"
                        onClick={() => setMonth(firstUnpaid)}
                        className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          month === firstUnpaid
                            ? "bg-stone-800 text-white border-stone-900 font-bold"
                            : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                        }`}
                        title="পরবর্তী প্রথম বকেয়া মাস নির্বাচন করুন"
                      >
                        ⚡ ১ম বকেয়া ({firstUnpaid})
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </Field>

          <Field label="জমার তারিখ" required hint={`সময়সীমা: প্রতি মাসের ${settings.deadlineDay ?? 10} তারিখ`}>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              placeholder="dd/mm/yyyy"
              required
            />
          </Field>
        </div>

        {/* Display covered months breakdown if monthsCount > 1 */}
        {monthsCount > 1 && (
          <div className="p-2.5 bg-stone-100 rounded-lg text-xs text-stone-700 space-y-1">
            <span className="font-bold text-stone-800">অন্তর্ভুক্ত মাসসমূহ ({monthsCount} টি):</span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {targetMonths.map((m) => {
                const isPaid = paidMonthKeys.has(getMonthIndexKey(m));
                return (
                  <span
                    key={m}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      isPaid
                        ? "bg-rose-200 text-rose-900 border border-rose-300"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}
                  >
                    {m} {isPaid ? '(পরিশোধিত)' : '(বকেয়া)'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={`সঞ্চয় জমার পরিমাণ (${monthsCount} মাসের)`} required>
            <input
              type="number"
              min="0"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={inputCls}
              required
            />
          </Field>

          <div>
            <Field label="বিলম্ব জরিমানা (৳)" hint={`১ মাস = ৳${finePerMonth}, ২ মাস = ৳${finePerMonth * 2}`}>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={fine}
                  onChange={(e) => setFine(Math.max(0, Number(e.target.value)))}
                  className={`${inputCls} font-mono font-bold text-amber-900`}
                  placeholder="০"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Multiplicative Fine Controls & Multiplier Buttons */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1">
              <span>⚠️ গুণিতক হারে জরিমানা নির্ধারণ:</span>
            </span>
            <span className="font-mono font-bold text-emerald-950 bg-white/90 px-2 py-0.5 rounded border border-amber-300">
              সর্বমোট: {currency(Number(amount) + Number(fine))}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-stone-600">মাসের গুণিতক নির্বাচন করুন:</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFine(0)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  fine === 0
                    ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                    : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                }`}
              >
                মওকুফ (৳০)
              </button>

              {[1, 2, 3, 4, 5, 6].map((m) => {
                const fineVal = m * finePerMonth;
                const isSelected = fine === fineVal;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFineMultiplier(m)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs scale-105"
                        : "bg-white text-amber-950 border-amber-300 hover:bg-amber-100/60"
                    }`}
                  >
                    {m} মাস (৳{fineVal})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs">
            <span className="text-[11px] text-stone-500">সূক্ষ্ম পরিবর্তন:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => adjustFine(-50)}
                className="px-2 py-0.5 text-xs font-semibold rounded bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 flex items-center gap-0.5 cursor-pointer"
              >
                <Minus size={11} /> ৳৫০
              </button>
              <button
                type="button"
                onClick={() => adjustFine(-10)}
                className="px-2 py-0.5 text-xs font-semibold rounded bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 flex items-center gap-0.5 cursor-pointer"
              >
                <Minus size={11} /> ৳১০
              </button>
              <button
                type="button"
                onClick={() => adjustFine(10)}
                className="px-2 py-0.5 text-xs font-semibold rounded bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 flex items-center gap-0.5 cursor-pointer"
              >
                <Plus size={11} /> ৳১০
              </button>
              <button
                type="button"
                onClick={() => adjustFine(50)}
                className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 flex items-center gap-0.5 cursor-pointer"
              >
                <Plus size={11} /> ৳৫০
              </button>
            </div>
          </div>

          <p className="text-[11px] text-stone-600 bg-white/70 p-2 rounded-lg border border-amber-200/80">
            {autoFineNotice}
          </p>
        </div>

        <Field label="টাকা জমা দেওয়ার মাধ্যম" required>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="মন্তব্য / ট্রানজেকশন আইডি (ঐচ্ছিক)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
            placeholder="রিসিপ্ট নং বা TrxID..."
          />
        </Field>

        <AttachmentUpload
          label="ব্যাংক/বিকাশ জমার স্লিপ বা রশিদ (ঐচ্ছিক)"
          hint="অনলাইন পেমেন্ট স্ক্রিনশট বা জমা স্লিপের ছবি যুক্ত করুন"
          value={attachment}
          fileName={attachmentName}
          onChange={(val, name) => {
            setAttachment(val);
            setAttachmentName(name);
          }}
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors cursor-pointer"
          >
            বাতিল
          </button>
          <button
            id="submit-deposit-btn"
            type="submit"
            disabled={isDuplicatePayment}
            className={`px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 ${
              isDuplicatePayment
                ? 'bg-stone-400 cursor-not-allowed opacity-75'
                : 'bg-emerald-800 hover:bg-emerald-900 cursor-pointer'
            }`}
            title={isDuplicatePayment ? 'নির্বাচিত মাসটি ইতোমধ্যে পরিশোধিত' : 'জমা সম্পন্ন করুন'}
          >
            <Check size={16} />{' '}
            {isDuplicatePayment ? 'পরিশোধিত মাস (জমা নেওয়া যাবে না)' : 'জমা করুন ও রসিদ তৈরি করুন'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================================
   ADD NEW MEMBER MODAL (With Photo, NID Card & Nominee Details)
   ========================================================================= */
export function AddMemberModal({
  nextSerial,
  onClose,
  onSubmit,
}: {
  nextSerial: number;
  onClose: () => void;
  onSubmit: (member: Member) => void;
}) {
  const [tab, setTab] = useState<'basic' | 'photo_nid' | 'nominee'>('basic');

  // Basic Information
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [nid, setNid] = useState("");
  const [mobile, setMobile] = useState("");
  const [blood, setBlood] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [joined, setJoined] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  // Member Photo (30 KB - 300 KB)
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoFormat, setPhotoFormat] = useState<'passport' | '300x300'>('passport');
  const [photoSize, setPhotoSize] = useState<number | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Member NID Document (100 KB - 1 MB, PDF/JPG)
  const [nidDoc, setNidDoc] = useState<string | undefined>(undefined);
  const [nidDocName, setNidDocName] = useState<string | undefined>(undefined);
  const [nidDocType, setNidDocType] = useState<'pdf' | 'image' | undefined>(undefined);
  const [nidDocSize, setNidDocSize] = useState<number | undefined>(undefined);

  // Nominee Details
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineeMobile, setNomineeMobile] = useState("");
  const [nomineeNid, setNomineeNid] = useState("");
  const [nomineeAddress, setNomineeAddress] = useState("");
  const [nomineePhoto, setNomineePhoto] = useState<string | undefined>(undefined);
  const [nomineePhotoFormat, setNomineePhotoFormat] = useState<'passport' | '300x300'>('passport');
  const [nomineePhotoSize, setNomineePhotoSize] = useState<number | undefined>(undefined);
  const [nomineeNidDoc, setNomineeNidDoc] = useState<string | undefined>(undefined);
  const [nomineeNidDocName, setNomineeNidDocName] = useState<string | undefined>(undefined);
  const [nomineeNidDocType, setNomineeNidDocType] = useState<'pdf' | 'image' | undefined>(undefined);
  const [nomineeNidDocSize, setNomineeNidDocSize] = useState<number | undefined>(undefined);

  const assignedUid = `TGS-2025-${String(nextSerial).padStart(3, "0")}`;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');

    const validation = validatePhotoFileSize(file, 30, 300);
    if (!validation.valid) {
      setPhotoError(validation.error || 'ছবির আকার ৩০ KB থেকে ৩০০ KB এর মধ্যে হতে হবে।');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingPhoto(true);
      const processedBase64 = await processMemberPhoto(file, photoFormat);
      setPhoto(processedBase64);
      setPhotoSize(file.size);
    } catch (err) {
      console.error("Failed to process member photo", err);
      setPhotoError("ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে।");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFormatChange = async (newFormat: 'passport' | '300x300') => {
    setPhotoFormat(newFormat);
    if (photoInputRef.current?.files?.[0]) {
      try {
        setIsProcessingPhoto(true);
        const processed = await processMemberPhoto(photoInputRef.current.files[0], newFormat);
        setPhoto(processed);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  const clearPhoto = () => {
    setPhoto(undefined);
    setPhotoSize(undefined);
    setPhotoError('');
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setTab('basic');
      return;
    }
    onSubmit({
      uid: assignedUid,
      name: name.trim(),
      nameEn: nameEn.trim(),
      fatherName: fatherName.trim(),
      nid: nid.trim(),
      mobile: mobile.trim(),
      blood: blood.trim(),
      email: email.trim(),
      address: address.trim(),
      joined: joined.trim(),
      photo,
      photoFormat,
      photoSize,
      nidDoc,
      nidDocName,
      nidDocType,
      nidDocSize,
      nomineeName: nomineeName.trim() || undefined,
      nomineeRelation: nomineeRelation.trim() || undefined,
      nomineeMobile: nomineeMobile.trim() || undefined,
      nomineeNid: nomineeNid.trim() || undefined,
      nomineeAddress: nomineeAddress.trim() || undefined,
      nomineePhoto,
      nomineePhotoFormat,
      nomineePhotoSize,
      nomineeNidDoc,
      nomineeNidDocName,
      nomineeNidDocType,
      nomineeNidDocSize,
    });
  };

  return (
    <Modal id="add-member-modal" title="নতুন সদস্য নিবন্ধন (Member Registration)" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        {/* UID Badge */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-amber-700" />
            <span>স্বয়ংক্রিয় ইউনিক মেম্বার আইডি:</span>
          </div>
          <span className="font-mono font-bold text-sm bg-amber-200/80 px-2.5 py-0.5 rounded text-amber-950">
            {assignedUid}
          </span>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex items-center border-b border-stone-200 gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setTab('basic')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'basic'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <User size={14} /> ১. সাধারণ তথ্য
          </button>

          <button
            type="button"
            onClick={() => setTab('photo_nid')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'photo_nid'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Camera size={14} /> ২. ছবি ও এনআইডি
            {(photo || nidDoc) && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />}
          </button>

          <button
            type="button"
            onClick={() => setTab('nominee')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'nominee'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users size={14} /> ৩. নমিনীর তথ্য ও এনআইডি
            {(nomineeName || nomineePhoto || nomineeNidDoc) && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />}
          </button>
        </div>

        {/* TAB 1: BASIC INFORMATION */}
        {tab === 'basic' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="সদস্যের পুরো নাম (বাংলায়)" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="যেমন: মোঃ রাশেদুল ইসলাম"
                  required
                />
              </Field>

              <Field label="Name (In English)">
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Md. Rashedul Islam"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="পিতার নাম (Father's Name)">
                <input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className={inputCls}
                  placeholder="পিতার নাম লিখুন"
                />
              </Field>

              <Field label="জাতীয় পরিচয়পত্র নম্বর (NID Number)">
                <input
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className={inputCls}
                  placeholder="১০/১৩/১৭ সংখ্যার NID নম্বর"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="মোবাইল নম্বর (WhatsApp)" required hint="রসিদ পাঠাতে ব্যবহৃত হবে">
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={inputCls}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </Field>

              <Field label="রক্তের গ্রুপ">
                <select value={blood} onChange={(e) => setBlood(e.target.value)} className={inputCls}>
                  <option value="">নির্বাচন করুন</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="যোগদানের তারিখ">
                <input
                  value={joined}
                  onChange={(e) => setJoined(e.target.value)}
                  className={inputCls}
                  placeholder="dd/mm/yyyy"
                />
              </Field>
              <Field label="ইমেইল ঠিকানা">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="example@mail.com"
                />
              </Field>
            </div>

            <Field label="ঠিকানা / গ্রাম / এলাকা">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
                placeholder="যেমন: উলানিয়া বাজার, গলাচিপা"
              />
            </Field>
          </div>
        )}

        {/* TAB 2: MEMBER PHOTO & NID DOCUMENT */}
        {tab === 'photo_nid' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Member Photo Section */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Camera size={15} className="text-emerald-800" /> সদস্যের প্রোফাইল ছবি (৩০ KB – ৩০০ KB)
                </span>
                {photo && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {photoFormat === 'passport' ? 'পাসপোর্ট সাইজ' : '৩০০ × ৩০০ সাইজ'}
                    {photoSize ? ` (${Math.round(photoSize / 1024)} KB)` : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-stone-600">ছবির ফরম্যাট:</span>
                <button
                  type="button"
                  onClick={() => handleFormatChange('passport')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    photoFormat === 'passport'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  পাসপোর্ট সাইজ (Passport: 3.5×4.5)
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange('300x300')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    photoFormat === '300x300'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  ৩০০ × ৩০০ সাইজ (Square)
                </button>
              </div>

              <div className="flex items-center gap-4 pt-1">
                {photo ? (
                  <div className="relative group">
                    <div
                      className={`overflow-hidden rounded-xl border-2 border-emerald-800 shadow-xs bg-white ${
                        photoFormat === 'passport' ? 'w-24 h-30' : 'w-24 h-24'
                      }`}
                    >
                      <img
                        src={photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                      title="ছবি মুছুন"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 bg-white hover:border-emerald-700 hover:bg-emerald-50/40 cursor-pointer flex flex-col items-center justify-center text-stone-400 hover:text-emerald-800 transition-all p-2 text-center"
                  >
                    <Camera size={24} />
                    <span className="text-[10px] font-semibold mt-1">ছবি নির্বাচন</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Upload size={13} className="text-emerald-800" />
                    <span>{photo ? "ছবি পরিবর্তন করুন" : "সদস্যের ছবি আপলোড করুন"}</span>
                  </button>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    ছবির আকার ৩০ KB থেকে ৩০০ KB এর মধ্যে হতে হবে। স্বয়ংক্রিয়ভাবে ক্রপ এবং অপটিমাইজ করা হবে।
                  </p>
                </div>
              </div>

              {photoError && (
                <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* Member NID Document Upload */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
              <NidDocumentUpload
                label="সদস্যের জাতীয় পরিচয়পত্র (NID) কার্ড ডকুমেন্ট"
                hint="PDF অথবা JPG/PNG ফরম্যাটে NID আপলোড করুন (১০০ KB থেকে ১ MB)"
                value={nidDoc}
                fileName={nidDocName}
                fileType={nidDocType}
                fileSize={nidDocSize}
                onChange={(val, name, type, size) => {
                  setNidDoc(val);
                  setNidDocName(name);
                  setNidDocType(type);
                  setNidDocSize(size);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: NOMINEE DETAILS & NID */}
        {tab === 'nominee' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-1.5">
              <Info size={15} className="text-amber-700 shrink-0" />
              <span>সদস্যের অবর্তমানে সঞ্চয়ের হকদার নমিনীর বিস্তারিত তথ্য, ছবি ও NID ডকুমেন্ট নিচে যুক্ত করুন:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="নমিনীর পুরো নাম">
                <input
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className={inputCls}
                  placeholder="নমিনীর নাম লিখুন"
                />
              </Field>

              <Field label="সদস্যের সাথে সম্পর্ক">
                <select
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className={inputCls}
                >
                  <option value="">সম্পর্ক নির্বাচন করুন</option>
                  {["স্ত্রী", "স্বামী", "পুত্র", "কন্যা", "পিতা", "মাতা", "ভাই", "বোন", "দাদা/দাদী", "অন্যান্য"].map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="নমিনীর মোবাইল নম্বর">
                <input
                  value={nomineeMobile}
                  onChange={(e) => setNomineeMobile(e.target.value)}
                  className={inputCls}
                  placeholder="01XXXXXXXXX"
                />
              </Field>

              <Field label="নমিনীর জাতীয় পরিচয়পত্র (NID) নম্বর">
                <input
                  value={nomineeNid}
                  onChange={(e) => setNomineeNid(e.target.value)}
                  className={inputCls}
                  placeholder="নমিনীর NID নম্বর"
                />
              </Field>
            </div>

            <Field label="নমিনীর ঠিকানা">
              <input
                value={nomineeAddress}
                onChange={(e) => setNomineeAddress(e.target.value)}
                className={inputCls}
                placeholder="নমিনীর স্থায়ী বা বর্তমান ঠিকানা"
              />
            </Field>

            {/* Nominee Photo Upload */}
            <NomineePhotoUpload
              photo={nomineePhoto}
              photoFormat={nomineePhotoFormat}
              photoSize={nomineePhotoSize}
              onChange={(photoVal, formatVal, sizeVal) => {
                setNomineePhoto(photoVal);
                if (formatVal) setNomineePhotoFormat(formatVal);
                setNomineePhotoSize(sizeVal);
              }}
            />

            {/* Nominee NID Document Upload */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <NidDocumentUpload
                label="নমিনীর জাতীয় পরিচয়পত্র (NID) ডকুমেন্ট"
                hint="নমিনীর NID এর PDF বা JPG/PNG ফাইল (১০০ KB থেকে ১ MB)"
                value={nomineeNidDoc}
                fileName={nomineeNidDocName}
                fileType={nomineeNidDocType}
                fileSize={nomineeNidDocSize}
                onChange={(val, name, type, size) => {
                  setNomineeNidDoc(val);
                  setNomineeNidDocName(name);
                  setNomineeNidDocType(type);
                  setNomineeNidDocSize(size);
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-stone-200">
          <div className="flex items-center gap-1.5">
            {tab !== 'basic' && (
              <button
                type="button"
                onClick={() => setTab(tab === 'nominee' ? 'photo_nid' : 'basic')}
                className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                ← পূর্ববর্তী ধাপ
              </button>
            )}
            {tab !== 'nominee' && (
              <button
                type="button"
                onClick={() => setTab(tab === 'basic' ? 'photo_nid' : 'nominee')}
                className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                পরবর্তী ধাপ →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              id="submit-member-btn"
              type="submit"
              disabled={isProcessingPhoto}
              className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check size={16} /> সদস্য নিবন্ধন সম্পন্ন করুন
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================================
   EDIT MEMBER MODAL (Edit details, Photo, NID & Nominee)
   ========================================================================= */
export function EditMemberModal({
  member,
  onClose,
  onUpdate,
}: {
  member: Member;
  onClose: () => void;
  onUpdate: (member: Member) => void;
}) {
  const [tab, setTab] = useState<'basic' | 'photo_nid' | 'nominee'>('basic');

  // Basic Information
  const [name, setName] = useState(member.name || "");
  const [nameEn, setNameEn] = useState(member.nameEn || "");
  const [fatherName, setFatherName] = useState(member.fatherName || "");
  const [nid, setNid] = useState(member.nid || "");
  const [mobile, setMobile] = useState(member.mobile || "");
  const [blood, setBlood] = useState(member.blood || "");
  const [email, setEmail] = useState(member.email || "");
  const [address, setAddress] = useState(member.address || "");
  const [joined, setJoined] = useState(member.joined || "");

  // Member Photo (30 KB - 300 KB)
  const [photo, setPhoto] = useState<string | undefined>(member.photo);
  const [photoFormat, setPhotoFormat] = useState<'passport' | '300x300'>(member.photoFormat || 'passport');
  const [photoSize, setPhotoSize] = useState<number | undefined>(member.photoSize);
  const [photoError, setPhotoError] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Member NID Document (100 KB - 1 MB, PDF/JPG)
  const [nidDoc, setNidDoc] = useState<string | undefined>(member.nidDoc);
  const [nidDocName, setNidDocName] = useState<string | undefined>(member.nidDocName);
  const [nidDocType, setNidDocType] = useState<'pdf' | 'image' | undefined>(member.nidDocType);
  const [nidDocSize, setNidDocSize] = useState<number | undefined>(member.nidDocSize);

  // Nominee Details
  const [nomineeName, setNomineeName] = useState(member.nomineeName || "");
  const [nomineeRelation, setNomineeRelation] = useState(member.nomineeRelation || "");
  const [nomineeMobile, setNomineeMobile] = useState(member.nomineeMobile || "");
  const [nomineeNid, setNomineeNid] = useState(member.nomineeNid || "");
  const [nomineeAddress, setNomineeAddress] = useState(member.nomineeAddress || "");
  const [nomineePhoto, setNomineePhoto] = useState<string | undefined>(member.nomineePhoto);
  const [nomineePhotoFormat, setNomineePhotoFormat] = useState<'passport' | '300x300'>(member.nomineePhotoFormat || 'passport');
  const [nomineePhotoSize, setNomineePhotoSize] = useState<number | undefined>(member.nomineePhotoSize);
  const [nomineeNidDoc, setNomineeNidDoc] = useState<string | undefined>(member.nomineeNidDoc);
  const [nomineeNidDocName, setNomineeNidDocName] = useState<string | undefined>(member.nomineeNidDocName);
  const [nomineeNidDocType, setNomineeNidDocType] = useState<'pdf' | 'image' | undefined>(member.nomineeNidDocType);
  const [nomineeNidDocSize, setNomineeNidDocSize] = useState<number | undefined>(member.nomineeNidDocSize);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');

    const validation = validatePhotoFileSize(file, 30, 300);
    if (!validation.valid) {
      setPhotoError(validation.error || 'ছবির আকার ৩০ KB থেকে ৩০০ KB এর মধ্যে হতে হবে।');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingPhoto(true);
      const processedBase64 = await processMemberPhoto(file, photoFormat);
      setPhoto(processedBase64);
      setPhotoSize(file.size);
    } catch (err) {
      console.error("Failed to process member photo", err);
      setPhotoError("ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে।");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFormatChange = async (newFormat: 'passport' | '300x300') => {
    setPhotoFormat(newFormat);
    if (photoInputRef.current?.files?.[0]) {
      try {
        setIsProcessingPhoto(true);
        const processed = await processMemberPhoto(photoInputRef.current.files[0], newFormat);
        setPhoto(processed);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  const clearPhoto = () => {
    setPhoto(undefined);
    setPhotoSize(undefined);
    setPhotoError('');
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setTab('basic');
      return;
    }
    onUpdate({
      ...member,
      name: name.trim(),
      nameEn: nameEn.trim(),
      fatherName: fatherName.trim(),
      nid: nid.trim(),
      mobile: mobile.trim(),
      blood: blood.trim(),
      email: email.trim(),
      address: address.trim(),
      joined: joined.trim(),
      photo,
      photoFormat,
      photoSize,
      nidDoc,
      nidDocName,
      nidDocType,
      nidDocSize,
      nomineeName: nomineeName.trim() || undefined,
      nomineeRelation: nomineeRelation.trim() || undefined,
      nomineeMobile: nomineeMobile.trim() || undefined,
      nomineeNid: nomineeNid.trim() || undefined,
      nomineeAddress: nomineeAddress.trim() || undefined,
      nomineePhoto,
      nomineePhotoFormat,
      nomineePhotoSize,
      nomineeNidDoc,
      nomineeNidDocName,
      nomineeNidDocType,
      nomineeNidDocSize,
    });
  };

  return (
    <Modal
      id="edit-member-modal"
      title={`সদস্য তথ্য, এনআইডি ও নমিনী সংশোধন (${member.uid})`}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Tab Navigation Header */}
        <div className="flex items-center border-b border-stone-200 gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setTab('basic')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'basic'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <User size={14} /> ১. সাধারণ তথ্য
          </button>

          <button
            type="button"
            onClick={() => setTab('photo_nid')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'photo_nid'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Camera size={14} /> ২. ছবি ও এনআইডি
            {(photo || nidDoc) && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />}
          </button>

          <button
            type="button"
            onClick={() => setTab('nominee')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'nominee'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users size={14} /> ৩. নমিনীর তথ্য ও এনআইডি
            {(nomineeName || nomineePhoto || nomineeNidDoc) && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />}
          </button>
        </div>

        {/* TAB 1: BASIC INFORMATION */}
        {tab === 'basic' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="সদস্যের পুরো নাম (বাংলায়)" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="Name (In English)">
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="পিতার নাম (Father's Name)">
                <input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="জাতীয় পরিচয়পত্র নম্বর (NID Number)">
                <input
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="মোবাইল নম্বর (WhatsApp)" required>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="রক্তের গ্রুপ">
                <select value={blood} onChange={(e) => setBlood(e.target.value)} className={inputCls}>
                  <option value="">নির্বাচন করুন</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="যোগদানের তারিখ">
                <input
                  value={joined}
                  onChange={(e) => setJoined(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="ইমেইল ঠিকানা">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="ঠিকানা / গ্রাম / এলাকা">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {/* TAB 2: MEMBER PHOTO & NID DOCUMENT */}
        {tab === 'photo_nid' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Member Photo Section */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Camera size={15} className="text-emerald-800" /> সদস্যের প্রোফাইল ছবি (৩০ KB – ৩০০ KB)
                </span>
                {photo && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {photoFormat === 'passport' ? 'পাসপোর্ট সাইজ' : '৩০০ × ৩০০ সাইজ'}
                    {photoSize ? ` (${Math.round(photoSize / 1024)} KB)` : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-stone-600">ছবির সাইজ:</span>
                <button
                  type="button"
                  onClick={() => handleFormatChange('passport')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    photoFormat === 'passport'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  পাসপোর্ট সাইজ (Passport)
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange('300x300')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    photoFormat === '300x300'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  ৩০০ × ৩০০ সাইজ (Square)
                </button>
              </div>

              <div className="flex items-center gap-4 pt-1">
                {photo ? (
                  <div className="relative group">
                    <div
                      className={`overflow-hidden rounded-xl border-2 border-emerald-800 shadow-xs bg-white ${
                        photoFormat === 'passport' ? 'w-24 h-30' : 'w-24 h-24'
                      }`}
                    >
                      <img
                        src={photo}
                        alt="Member"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                      title="ছবি মুছুন"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 bg-white hover:border-emerald-700 hover:bg-emerald-50/40 cursor-pointer flex flex-col items-center justify-center text-stone-400 hover:text-emerald-800 transition-all p-2 text-center"
                  >
                    <Camera size={24} />
                    <span className="text-[10px] font-semibold mt-1">ছবি যোগ করুন</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Upload size={13} className="text-emerald-800" />
                    <span>{photo ? "নতুন ছবি পরিবর্তন করুন" : "ছবি আপলোড করুন"}</span>
                  </button>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    ছবির আকার ৩০ KB থেকে ৩০০ KB এর মধ্যে হতে হবে।
                  </p>
                </div>
              </div>

              {photoError && (
                <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* Member NID Document Upload */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
              <NidDocumentUpload
                label="সদস্যের জাতীয় পরিচয়পত্র (NID) কার্ড ডকুমেন্ট"
                hint="PDF অথবা JPG/PNG ফরম্যাটে NID আপলোড করুন (১০০ KB থেকে ১ MB)"
                value={nidDoc}
                fileName={nidDocName}
                fileType={nidDocType}
                fileSize={nidDocSize}
                onChange={(val, name, type, size) => {
                  setNidDoc(val);
                  setNidDocName(name);
                  setNidDocType(type);
                  setNidDocSize(size);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: NOMINEE DETAILS & NID */}
        {tab === 'nominee' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-1.5">
              <Info size={15} className="text-amber-700 shrink-0" />
              <span>সদস্যের অবর্তমানে সঞ্চয়ের হকদার নমিনীর বিস্তারিত তথ্য, ছবি ও NID ডকুমেন্ট নিচে যুক্ত করুন:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="নমিনীর পুরো নাম">
                <input
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className={inputCls}
                  placeholder="নমিনীর নাম লিখুন"
                />
              </Field>

              <Field label="সদস্যের সাথে সম্পর্ক">
                <select
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className={inputCls}
                >
                  <option value="">সম্পর্ক নির্বাচন করুন</option>
                  {["স্ত্রী", "স্বামী", "পুত্র", "কন্যা", "পিতা", "মাতা", "ভাই", "বোন", "দাদা/দাদী", "অন্যান্য"].map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="নমিনীর মোবাইল নম্বর">
                <input
                  value={nomineeMobile}
                  onChange={(e) => setNomineeMobile(e.target.value)}
                  className={inputCls}
                  placeholder="01XXXXXXXXX"
                />
              </Field>

              <Field label="নমিনীর জাতীয় পরিচয়পত্র (NID) নম্বর">
                <input
                  value={nomineeNid}
                  onChange={(e) => setNomineeNid(e.target.value)}
                  className={inputCls}
                  placeholder="নমিনীর NID নম্বর"
                />
              </Field>
            </div>

            <Field label="নমিনীর ঠিকানা">
              <input
                value={nomineeAddress}
                onChange={(e) => setNomineeAddress(e.target.value)}
                className={inputCls}
                placeholder="নমিনীর স্থায়ী বা বর্তমান ঠিকানা"
              />
            </Field>

            {/* Nominee Photo Upload */}
            <NomineePhotoUpload
              photo={nomineePhoto}
              photoFormat={nomineePhotoFormat}
              photoSize={nomineePhotoSize}
              onChange={(photoVal, formatVal, sizeVal) => {
                setNomineePhoto(photoVal);
                if (formatVal) setNomineePhotoFormat(formatVal);
                setNomineePhotoSize(sizeVal);
              }}
            />

            {/* Nominee NID Document Upload */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <NidDocumentUpload
                label="নমিনীর জাতীয় পরিচয়পত্র (NID) ডকুমেন্ট"
                hint="নমিনীর NID এর PDF বা JPG/PNG ফাইল (১০০ KB থেকে ১ MB)"
                value={nomineeNidDoc}
                fileName={nomineeNidDocName}
                fileType={nomineeNidDocType}
                fileSize={nomineeNidDocSize}
                onChange={(val, name, type, size) => {
                  setNomineeNidDoc(val);
                  setNomineeNidDocName(name);
                  setNomineeNidDocType(type);
                  setNomineeNidDocSize(size);
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-stone-200">
          <div className="flex items-center gap-1.5">
            {tab !== 'basic' && (
              <button
                type="button"
                onClick={() => setTab(tab === 'nominee' ? 'photo_nid' : 'basic')}
                className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                ← পূর্ববর্তী ধাপ
              </button>
            )}
            {tab !== 'nominee' && (
              <button
                type="button"
                onClick={() => setTab(tab === 'basic' ? 'photo_nid' : 'nominee')}
                className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                পরবর্তী ধাপ →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              id="update-member-btn"
              type="submit"
              disabled={isProcessingPhoto}
              className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check size={16} /> সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================================
   SIGNATURE DRAW CANVAS & SIGNATURE PAD COMPONENT
   ========================================================================= */
export function SignatureDrawCanvas({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#064e3b';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasStroke(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onChange(result);
        setHasStroke(true);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <div className="border border-stone-300 rounded-xl bg-stone-50 overflow-hidden relative touch-none">
        <canvas
          ref={canvasRef}
          width={280}
          height={80}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="w-full h-[80px] cursor-crosshair bg-white"
        />
        {!hasStroke && !value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-stone-300 text-[11px] italic">
            মাউস বা আঙুল দিয়ে এখানে স্বাক্ষর করুন
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={clear}
          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium flex items-center gap-1 transition-colors text-[11px]"
        >
          <RotateCcw size={11} /> পরিষ্কার করুন
        </button>

        <label className="cursor-pointer px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-semibold flex items-center gap-1 transition-colors text-[11px]">
          <Upload size={11} />
          <span>স্বাক্ষর ছবি আপলোড</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

/* =========================================================================
   MONEY RECEIPT MODAL (With JPG Image Generation, Signatures & Sharing)
   ========================================================================= */
export function ReceiptModal({
  deposit,
  member,
  settings = DEFAULT_SETTINGS,
  onClose,
  onUpdateSettings,
}: {
  deposit: Deposit;
  member?: Member;
  settings?: AppSettings;
  onClose: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}) {
  const [customPhone, setCustomPhone] = useState(member?.mobile || "");
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showSignatureDrawer, setShowSignatureDrawer] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);

  // Local signature editable states
  const [treasurerName, setTreasurerName] = useState(settings.treasurerName || "মোঃ মহিম খান");
  const [treasurerSignature, setTreasurerSignature] = useState(settings.treasurerSignature || "");
  const [presidentRole, setPresidentRole] = useState<"president" | "secretary">(settings.presidentRole || "president");
  const [presidentName, setPresidentName] = useState(settings.presidentName || "মোঃ রাশেদুল ইসলাম");
  const [presidentSignature, setPresidentSignature] = useState(settings.presidentSignature || "");

  const receiptRef = useRef<HTMLDivElement>(null);

  const fineAmount = Number(deposit.fine || 0);
  const depositAmount = Number(deposit.amount || 0);
  const totalAmount = depositAmount + fineAmount;

  /**
   * Generates high-quality JPG image from receipt element
   */
  const generateJpg = async () => {
    if (!receiptRef.current) return null;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toJpeg(receiptRef.current, {
        quality: 0.96,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      setPreviewImageUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error("Failed to generate JPG receipt:", err);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Automatically render JPG on modal mount and when details change
  useEffect(() => {
    const timer = setTimeout(() => {
      generateJpg();
    }, 180);
    return () => clearTimeout(timer);
  }, [deposit, member, settings, treasurerName, treasurerSignature, presidentRole, presidentName, presidentSignature]);

  const handlePrint = () => {
    window.print();
  };

  /**
   * Directly sends JPG receipt image file to WhatsApp or opens WhatsApp with auto-download & clipboard copy
   */
  const handleSendWhatsAppJpg = async () => {
    if (!receiptRef.current) return;
    setIsSharingWhatsApp(true);
    try {
      const blob = await toBlob(receiptRef.current, {
        quality: 0.96,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const fileName = `TGS-Receipt-${deposit.id}-${deposit.memberUid}.jpg`;
      
      // Clean phone number: remove any non-digits, leading plus
      let cleanPhone = (customPhone || member?.mobile || "").replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("880")) {
        // already has 880
      } else if (cleanPhone.startsWith("0")) {
        cleanPhone = "88" + cleanPhone;
      } else if (cleanPhone.length === 10 && cleanPhone.startsWith("1")) {
        cleanPhone = "880" + cleanPhone;
      }

      // Step 1: If Web Share API is available with file support (Mobile browsers: Android Chrome, iOS Safari)
      // This directly opens WhatsApp with the actual JPG IMAGE attached to the message!
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: "image/jpeg" })] })) {
        try {
          const file = new File([blob], fileName, { type: "image/jpeg" });
          await navigator.share({
            files: [file],
            title: `টাকা প্রাপ্তি রসিদ - ${member?.name || deposit.memberUid}`,
            text: `সম্মানিত সদস্য ${member?.name || ''}, আপনার ${deposit.month} মাসের সঞ্চয় জমা ৳${totalAmount} এর রসিদ। রসিদ নং: ${deposit.id}। ট্রাস্ট গ্রোথ সোসাইটি।`,
          });
          return;
        } catch (shareError) {
          console.warn("Native share canceled or failed, falling back to direct chat:", shareError);
        }
      }

      // Step 2: For Desktop / PC where browsers cannot automatically attach image files into WhatsApp URL
      // Automatically download the JPG receipt image and copy to clipboard for 1-click Ctrl+V
      let dataUrl = previewImageUrl;
      if (!dataUrl && blob) {
        dataUrl = URL.createObjectURL(blob);
      } else if (!dataUrl) {
        dataUrl = await generateJpg();
      }

      if (dataUrl) {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      if (blob && navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 4000);
        } catch (clipboardErr) {
          console.warn("Clipboard auto-copy:", clipboardErr);
        }
      }

      // Open WhatsApp chat directly for the member number
      const msg = encodeURIComponent(
        `সম্মানিত সদস্য ${member?.name || ''}, আপনার ${deposit.month} মাসের সঞ্চয় জমা ৳${totalAmount} এর রসিদ প্রস্তুত হয়েছে। রসিদ নং: ${deposit.id}। ট্রাস্ট গ্রোথ সোসাইটি।`
      );
      
      const waUrl = cleanPhone.length >= 10 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}` 
        : `https://api.whatsapp.com/send?text=${msg}`;
        
      window.open(waUrl, "_blank");
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      // Direct WhatsApp link fallback
      let cleanPhone = (customPhone || member?.mobile || "").replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("0")) cleanPhone = "88" + cleanPhone;
      const msg = encodeURIComponent(
        `সম্মানিত সদস্য ${member?.name || ''}, আপনার ${deposit.month} মাসের সঞ্চয় জমা ৳${totalAmount} গ্রহণ করা হয়েছে। রসিদ নং: ${deposit.id}।`
      );
      const waUrl = cleanPhone.length >= 10 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}` 
        : `https://api.whatsapp.com/send?text=${msg}`;
      window.open(waUrl, "_blank");
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  /**
   * Downloads receipt as a crisp JPG image file
   */
  const handleDownloadJpg = async () => {
    let dataUrl = previewImageUrl;
    if (!dataUrl) {
      dataUrl = await generateJpg();
    }
    if (!dataUrl) {
      alert("রশিদ জেপিজি ফাইল তৈরিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
      return;
    }

    const link = document.createElement("a");
    link.download = `TGS-Receipt-${deposit.id}-${deposit.memberUid}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Copies receipt JPEG blob to clipboard
   */
  const handleCopyImage = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingImage(true);
    try {
      const blob = await toBlob(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        quality: 0.96,
      });

      if (blob) {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 3000);
        } else {
          // Fallback
          await handleDownloadJpg();
        }
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
      handleDownloadJpg();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveSignatures = () => {
    const updatedSettings: AppSettings = {
      ...settings,
      treasurerName,
      treasurerSignature,
      presidentRole,
      presidentName,
      presidentSignature,
    };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    }
    setShowSignatureDrawer(false);
    setTimeout(() => generateJpg(), 150);
  };

  return (
    <Modal id="receipt-modal" title="টাকা প্রাপ্তি রসিদ (JPG Image Receipt)" onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Status banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span className="font-medium">জমা সম্পন্ন ও জেপিজি (.JPG) রসিদ ইমেজ প্রস্তুত</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
              {deposit.date}
            </span>
          </div>
        </div>

        {/* TOP PRIMARY ACTION: WhatsApp JPG Send Banner */}
        <div className="bg-emerald-900 text-white p-3.5 rounded-2xl shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <MessageCircle size={15} /> WhatsApp এ সরাসরি JPG রসিদ পাঠান:
            </span>
            <span className="text-[11px] text-emerald-200 font-medium">সদস্য মোবাইল নম্বর</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="মোবাইল নম্বর (যেমন: 01911797438)"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-700 bg-emerald-950 text-white placeholder:text-emerald-400 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              id="send-whatsapp-jpg-btn"
              type="button"
              onClick={handleSendWhatsAppJpg}
              disabled={isSharingWhatsApp || isGeneratingImage}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-emerald-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-md shrink-0 disabled:opacity-50"
            >
              {isSharingWhatsApp ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>WhatsApp এ পাঠান</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-emerald-300">
            💡 মোবাইলে চাপ দিলে সরাসরি WhatsApp অ্যাপে JPG ছবিসহ ওপেন হবে। কম্পিউটারে স্বয়ংক্রিয়ভাবে ডাউনলোড ও কপি হয়ে WhatsApp Web ওপেন হবে (শুধু চ্যাটে পেস্ট/সংযুক্ত করুন)।
          </p>
        </div>

        {/* SECONDARY ACTION BUTTONS: JPG Download & Copy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            id="download-receipt-jpg-btn"
            type="button"
            onClick={handleDownloadJpg}
            disabled={isGeneratingImage}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {isGeneratingImage ? (
              <>
                <RefreshCw size={16} className="animate-spin text-amber-300" />
                <span>জেপিজি ইমেজ তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <ImageDown size={16} className="text-amber-300" />
                <span>জেপিজি রসিদ ডাউনলোড (.JPG)</span>
              </>
            )}
          </button>

          <button
            id="copy-receipt-image-btn"
            type="button"
            onClick={handleCopyImage}
            disabled={isGeneratingImage}
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-emerald-950 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {copiedImage ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-900" />
                <span>জেপিজি কপি হয়েছে! (Ctrl+V)</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>জেপিজি ছবি কপি করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Toolbar: Signatures Toggle & Fullscreen Preview */}
        <div className="flex items-center justify-between gap-2 bg-stone-100 p-2 rounded-xl border border-stone-200 flex-wrap text-xs">
          <button
            id="toggle-signature-drawer-btn"
            type="button"
            onClick={() => setShowSignatureDrawer(!showSignatureDrawer)}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <PenTool size={13} className="text-emerald-700" />
            <span>স্বাক্ষর যোগ / পরিবর্তন (Signatures)</span>
          </button>

          <div className="flex items-center gap-2">
            {previewImageUrl && (
              <button
                type="button"
                onClick={() => setShowFullImageModal(!showFullImageModal)}
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-amber-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Eye size={13} />
                <span>{showFullImageModal ? "কার্ড ভিউ দেখুন" : "📸 JPG ইমেজ প্রিভিউ"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="py-1.5 px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Printer size={13} /> প্রিন্ট / PDF
            </button>
          </div>
        </div>

        {/* SIGNATURE CONFIGURATION DRAWER */}
        {showSignatureDrawer && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <PenTool size={14} className="text-emerald-800" />
                <span>কোষাধক্ষ্য ও সভাপতি / সেক্রেটারির স্বাক্ষর এডিটর</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSignatureDrawer(false)}
                className="text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Treasurer (কোষাধক্ষ্য) */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">১. কোষাধ্যক্ষ (Treasurer)</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    ক্যাশিয়ার
                  </span>
                </div>
                <div>
                  <label className="text-[11px] text-stone-500 font-medium">কোষাধ্যক্ষের নাম:</label>
                  <input
                    value={treasurerName}
                    onChange={(e) => setTreasurerName(e.target.value)}
                    placeholder="যেমন: মোঃ মহিম খান"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-stone-50 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-500 font-medium">স্বাক্ষর আঁকুন বা ছবি দিন:</label>
                  <SignatureDrawCanvas
                    value={treasurerSignature}
                    onChange={(sig) => setTreasurerSignature(sig)}
                  />
                </div>
              </div>

              {/* 2. President or Secretary (সভাপতি অথবা সাধারণ সম্পাদক) */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">২. দ্বিতীয় স্বাক্ষরকারী</span>
                  <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-md text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPresidentRole("president")}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                        presidentRole === "president"
                          ? "bg-emerald-800 text-white"
                          : "text-stone-600"
                      }`}
                    >
                      সভাপতি
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresidentRole("secretary")}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                        presidentRole === "secretary"
                          ? "bg-emerald-800 text-white"
                          : "text-stone-600"
                      }`}
                    >
                      সেক্রেটারি
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-stone-500 font-medium">
                    {presidentRole === "secretary" ? "সেক্রেটারি / সাধারণ সম্পাদকের নাম:" : "সভাপতির নাম:"}
                  </label>
                  <input
                    value={presidentName}
                    onChange={(e) => setPresidentName(e.target.value)}
                    placeholder="যেমন: মোঃ রাশেদুল ইসলাম"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-stone-50 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-500 font-medium">স্বাক্ষর আঁকুন বা ছবি দিন:</label>
                  <SignatureDrawCanvas
                    value={presidentSignature}
                    onChange={(sig) => setPresidentSignature(sig)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveSignatures}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
              >
                <Check size={14} /> স্বাক্ষর সংরক্ষণ ও রসিদে প্রয়োগ করুন
              </button>
            </div>
          </div>
        )}

        {/* FULLSCREEN JPG IMAGE PREVIEW DISPLAY */}
        {showFullImageModal && previewImageUrl ? (
          <div className="p-3 bg-stone-900 text-white rounded-2xl space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} /> তৈরি করা চূড়ান্ত জেপিজি রসিদ ছবি (JPG Preview):
              </span>
              <button
                type="button"
                onClick={() => setShowFullImageModal(false)}
                className="text-stone-400 hover:text-white text-xs bg-stone-800 px-2 py-0.5 rounded"
              >
                কার্ড ভিউতে ফিরে যান ✕
              </button>
            </div>
            <div className="bg-white rounded-xl p-2 max-h-[380px] overflow-y-auto flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt="TGS Money Receipt JPG"
                className="w-full h-auto rounded-lg shadow-sm border border-stone-200"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
              <span>ফাইল ফরম্যাট: JPEG (.jpg)</span>
              <button
                type="button"
                onClick={handleDownloadJpg}
                className="text-amber-300 hover:underline font-bold flex items-center gap-1"
              >
                <Download size={12} /> ডাউনলোড করুন
              </button>
            </div>
          </div>
        ) : (
          /* PRINTABLE & RENDERABLE MONEY RECEIPT CARD */
          <div
            ref={receiptRef}
            id="receipt-card-container"
            className="border-2 border-emerald-900/40 rounded-2xl p-5 sm:p-6 bg-white text-stone-900 space-y-4 print:border-none print:p-0 print:bg-white shadow-xs relative overflow-hidden"
          >
            {/* Embedded Dynamic Background Watermark */}
            <PageWatermark settings={settings} documentType="receipt" size={320} />

            {/* Header with Optional Member Photo & Official TGS Logo */}
            <div className="border-b-2 border-dashed border-stone-300 pb-3.5 relative flex items-start justify-between gap-3 z-10">
              {/* Left Official Logo Emblem */}
              <div className="shrink-0 hidden sm:block">
                {settings.logoUrl ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-900 bg-white shadow-xs">
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <TgsLogoSvg size={60} />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="sm:hidden shrink-0">
                    {settings.logoUrl ? (
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-900 bg-white inline-block align-middle">
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <TgsLogoSvg size={28} />
                    )}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                    {settings.societyName}
                  </h2>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  {settings.societySubtitle} · স্থাপিত ২৫-০৯-২০২৫
                </p>
                <div className="inline-block mt-2 px-3.5 py-1 text-xs font-bold bg-emerald-900 text-amber-300 rounded-full shadow-xs">
                  টাকা প্রাপ্তি রসিদ (MONEY RECEIPT)
                </div>
              </div>

              {/* Member Profile Photo on Receipt */}
              {member?.photo && (
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className={`overflow-hidden rounded-xl border-2 border-emerald-900/60 shadow-xs bg-white ${
                      member.photoFormat === 'passport' ? 'w-16 h-20' : 'w-16 h-16'
                    }`}
                  >
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-stone-500 mt-0.5">
                    {member.photoFormat === 'passport' ? 'পাসপোর্ট সাইজ' : '৩০০×৩০০'}
                  </span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 text-xs gap-y-2.5 pt-1 relative">
              <div>
                <span className="text-stone-500 font-medium">রসিদ আইডি:</span>
                <p className="font-mono font-bold text-stone-900 text-sm">{deposit.id}</p>
              </div>
              <div className="text-right">
                <span className="text-stone-500 font-medium">জমার তারিখ:</span>
                <p className="font-bold text-stone-900 text-sm">{deposit.date || '—'}</p>
              </div>

              <div>
                <span className="text-stone-500 font-medium">সদস্যের নাম:</span>
                <p className="font-bold text-stone-950 text-sm sm:text-base">{member?.name || '—'}</p>
              </div>
              <div className="text-right">
                <span className="text-stone-500 font-medium">মেম্বার আইডি:</span>
                <p className="font-mono font-bold text-emerald-900 text-sm">{deposit.memberUid}</p>
              </div>

              <div>
                <span className="text-stone-500 font-medium">জমার মাস ও মেয়াদ:</span>
                <p className="font-bold text-emerald-950 text-sm">
                  {deposit.month}
                  {deposit.monthsCount && deposit.monthsCount > 1 ? ` (${deposit.monthsCount} মাসের সঞ্চয়)` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-stone-500 font-medium">পরিশোধ মাধ্যম:</span>
                <p className="font-semibold text-stone-900">{deposit.method}</p>
              </div>

              {member?.mobile && (
                <div>
                  <span className="text-stone-500 font-medium">মোবাইল নম্বর:</span>
                  <p className="font-mono font-bold text-stone-800">{member.mobile}</p>
                </div>
              )}
              {deposit.note && (
                <div className={member?.mobile ? "text-right" : ""}>
                  <span className="text-stone-500 font-medium">মন্তব্য / TrxID:</span>
                  <p className="font-medium text-stone-800 truncate">{deposit.note}</p>
                </div>
              )}
            </div>

            {/* Financial Breakdown Table */}
            <div className="border-t-2 border-b-2 border-dashed border-stone-300 py-3 my-2 space-y-1.5 bg-stone-50/50 p-2.5 rounded-lg">
              <div className="flex justify-between text-xs text-stone-700">
                <span className="font-medium">
                  মাসিক সঞ্চয় জমা {deposit.monthsCount && deposit.monthsCount > 1 ? `(${deposit.monthsCount} মাস)` : ''}:
                </span>
                <span className="font-mono font-bold text-stone-900 text-sm">{currency(depositAmount)}</span>
              </div>

              {fineAmount > 0 && (
                <div className="flex justify-between text-xs text-red-700">
                  <span className="font-medium">
                    বিলম্ব জরিমানা{" "}
                    {deposit.monthsCount && deposit.monthsCount > 1
                      ? `(${deposit.monthsCount} মাস × ৳${settings.defaultFine})`
                      : settings.defaultFine && Math.round(fineAmount / settings.defaultFine) > 1
                      ? `(${Math.round(fineAmount / settings.defaultFine)} মাস × ৳${settings.defaultFine})`
                      : `(১০ তারিখের পর)`}
                    :
                  </span>
                  <span className="font-mono font-bold text-sm">+{currency(fineAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-sm">
                <span className="font-bold text-stone-950 text-sm sm:text-base">সর্বমোট আদায়কৃত টাকা:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-950">
                  {currency(totalAmount)}
                </span>
              </div>
            </div>

            {/* THREE SIGNATURE BLOCKS: Depositor, Treasurer, President/Secretary */}
            <div className="pt-6 pb-1 grid grid-cols-3 gap-2 text-center text-xs text-stone-700 mt-2">
              {/* 1. Depositor */}
              <div className="flex flex-col items-center justify-end">
                <div className="h-10 flex items-end justify-center"></div>
                <div className="w-full max-w-[125px] border-t border-dashed border-stone-400 pt-1">
                  <span className="font-bold text-[11px] text-stone-800">জমাকারীর স্বাক্ষর</span>
                </div>
              </div>

              {/* 2. Treasurer (কোষাধ্যক্ষ) */}
              <div className="flex flex-col items-center justify-end">
                <div className="h-10 flex items-end justify-center mb-0.5">
                  {treasurerSignature ? (
                    <img
                      src={treasurerSignature}
                      alt="Treasurer Signature"
                      className="max-h-9 max-w-[110px] object-contain"
                    />
                  ) : (
                    <span className="text-[11px] font-serif italic text-emerald-950 font-bold">
                      {treasurerName || 'কোষাধ্যক্ষ'}
                    </span>
                  )}
                </div>
                <div className="w-full max-w-[125px] border-t border-dashed border-stone-400 pt-1">
                  <p className="font-bold text-[11px] text-stone-900 leading-tight">
                    {treasurerName || 'মোঃ মহিম খান'}
                  </p>
                  <span className="text-[10px] text-stone-500 font-medium">কোষাধক্ষ্য</span>
                </div>
              </div>

              {/* 3. President or Secretary (সভাপতি / সাধারণ সম্পাদক) */}
              <div className="flex flex-col items-center justify-end">
                <div className="h-10 flex items-end justify-center mb-0.5">
                  {presidentSignature ? (
                    <img
                      src={presidentSignature}
                      alt="President Signature"
                      className="max-h-9 max-w-[110px] object-contain"
                    />
                  ) : (
                    <span className="text-[11px] font-serif italic text-emerald-950 font-bold">
                      {presidentName || (presidentRole === 'secretary' ? 'সাধারণ সম্পাদক' : 'সভাপতি')}
                    </span>
                  )}
                </div>
                <div className="w-full max-w-[125px] border-t border-dashed border-stone-400 pt-1">
                  <p className="font-bold text-[11px] text-stone-900 leading-tight">
                    {presidentName || 'মোঃ রাশেদুল ইসলাম'}
                  </p>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {presidentRole === 'secretary' ? 'সাধারণ সম্পাদক' : 'সভাপতি'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* =========================================================================
   FINE & APP SETTINGS MODAL (With Signatures and Society Configuration)
   ========================================================================= */
export function FineSettingsModal({
  settings = DEFAULT_SETTINGS,
  onClose,
  onSave,
  onOpenLogoUpload,
  onOpenWatermarkSettings,
}: {
  settings?: AppSettings;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
  onOpenLogoUpload?: () => void;
  onOpenWatermarkSettings?: () => void;
}) {
  const [defaultFine, setDefaultFine] = useState(settings.defaultFine ?? 50);
  const [deadlineDay, setDeadlineDay] = useState(settings.deadlineDay ?? 10);
  const [societyName, setSocietyName] = useState(settings.societyName || "Trust Growth Society");
  const [societySubtitle, setSocietySubtitle] = useState(settings.societySubtitle || "উলানিয়া বাজার, উলানিয়া, গলাচিপা");
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || "01911797438");

  // Signatures configuration
  const [treasurerName, setTreasurerName] = useState(settings.treasurerName || "মোঃ মহিম খান");
  const [treasurerSignature, setTreasurerSignature] = useState(settings.treasurerSignature || "");
  const [presidentRole, setPresidentRole] = useState<"president" | "secretary">(settings.presidentRole || "president");
  const [presidentName, setPresidentName] = useState(settings.presidentName || "মোঃ রাশেদুল ইসলাম");
  const [presidentSignature, setPresidentSignature] = useState(settings.presidentSignature || "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      defaultFine: Number(defaultFine) || 0,
      deadlineDay: Number(deadlineDay) || 10,
      societyName,
      societySubtitle,
      societyAddress: settings.societyAddress || "উলানিয়া বাজার, উলানিয়া, গলাচিপা, পটুয়াখালী",
      contactPhone,
      lastBackupDate: settings.lastBackupDate,
      treasurerName,
      treasurerSignature,
      presidentRole,
      presidentName,
      presidentSignature,
    });
  };

  return (
    <Modal id="settings-fine-modal" title="জরিমানা, রসিদ স্বাক্ষর ও সমিতি সেটিংস" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-950">
          <p className="font-bold">⚠️ জরিমানা নিয়মাবলী ও গুণিতক নীতি:</p>
          <p>
            প্রতি মাসের নির্ধারিত <strong>{deadlineDay} তারিখের</strong> পর সঞ্চয় জমা দিলে প্রতি মাসের জন্য{" "}
            <strong>{currency(defaultFine)}</strong> করে গুণিতক হারে জরিমানা গণনা হবে:
          </p>
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-mono font-semibold text-amber-900">
            <div className="bg-amber-100/70 p-1.5 rounded text-center">১ মাস = {currency(defaultFine)}</div>
            <div className="bg-amber-100/70 p-1.5 rounded text-center">২ মাস = {currency(defaultFine * 2)}</div>
            <div className="bg-amber-100/70 p-1.5 rounded text-center">৩ মাস = {currency(defaultFine * 3)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="মাসিক ডিফল্ট জরিমানা (৳)" required hint="বর্তমানে ৫০ টাকা">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="10"
                value={defaultFine}
                onChange={(e) => setDefaultFine(Number(e.target.value))}
                className={`${inputCls} font-mono font-bold text-amber-900`}
                required
              />
            </div>
          </Field>

          <Field label="জমার শেষ তারিখ (Limit Day)" required hint="মাসের কত তারিখের মধ্যে">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="31"
                value={deadlineDay}
                onChange={(e) => setDeadlineDay(Number(e.target.value))}
                className={`${inputCls} font-mono font-bold text-emerald-900`}
                required
              />
              <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">তারিখ</span>
            </div>
          </Field>
        </div>

        {/* Quick buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-500">জরিমানা পরিমাণ:</span>
          {[0, 30, 50, 100, 150].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setDefaultFine(amt)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                defaultFine === amt
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        {/* SIGNATURE CONFIGURATION IN SETTINGS */}
        <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <PenTool size={14} className="text-emerald-800" />
              <span>রসিদের স্বাক্ষরকারী কনফিগারেশন (Signatures)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Treasurer */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800">কোষাধ্যক্ষের নাম ও স্বাক্ষর:</label>
              <input
                value={treasurerName}
                onChange={(e) => setTreasurerName(e.target.value)}
                placeholder="কোষাধ্যক্ষের নাম"
                className={inputCls}
              />
              <SignatureDrawCanvas
                value={treasurerSignature}
                onChange={(sig) => setTreasurerSignature(sig)}
              />
            </div>

            {/* President / Secretary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">দ্বিতীয় স্বাক্ষরকারী:</label>
                <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPresidentRole("president")}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      presidentRole === "president" ? "bg-emerald-800 text-white" : "text-stone-700"
                    }`}
                  >
                    সভাপতি
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresidentRole("secretary")}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      presidentRole === "secretary" ? "bg-emerald-800 text-white" : "text-stone-700"
                    }`}
                  >
                    সেক্রেটারি
                  </button>
                </div>
              </div>
              <input
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                placeholder={presidentRole === "secretary" ? "সেক্রেটারির নাম" : "সভাপতির নাম"}
                className={inputCls}
              />
              <SignatureDrawCanvas
                value={presidentSignature}
                onChange={(sig) => setPresidentSignature(sig)}
              />
            </div>
          </div>
        </div>

        <Field label="সমিতির নাম" required>
          <input
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            className={inputCls}
            required
          />
        </Field>

        <Field label="উপশিরোনাম / ঠিকানা">
          <input
            value={societySubtitle}
            onChange={(e) => setSocietySubtitle(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="রসিদে যোগাযোগের মোবাইল নম্বর">
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={inputCls}
          />
        </Field>

        {/* 1. Organization Circular Logo Cropper Trigger */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-white flex items-center justify-center shrink-0 shadow-xs">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-emerald-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">অপশন ১</span>
                <p className="font-bold text-stone-900 text-xs sm:text-sm">প্রতিষ্ঠানের প্রধান লোগো ও গোল ছবি</p>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">হেডার, সাইডবার ও রসিদের শীর্ষ গোল লোগো</p>
            </div>
          </div>
          {onOpenLogoUpload && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogoUpload();
              }}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Camera size={13} />
              <span>লোগো ক্রপ / সেট</span>
            </button>
          )}
        </div>

        {/* 2. Watermark Configuration Trigger (আলাদা জলছাপ অপশন) */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={22} className="text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded">অপশন ২</span>
                <p className="font-bold text-stone-900 text-xs sm:text-sm">ডকুমেন্ট ব্যাকগ্রাউন্ড জলছাপ (Watermark)</p>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {settings.watermarkEnabled === false
                  ? 'জলছাপ বন্ধ রয়েছে'
                  : `জলছাপ সক্রিয় (${settings.watermarkType === 'custom_image' ? 'কাস্টম ছবি' : settings.watermarkType === 'logo' ? 'প্রধান লোগো' : settings.watermarkType === 'custom_text' ? 'টেক্সট' : 'অফিসিয়াল সিল'})`}
              </p>
            </div>
          </div>
          {onOpenWatermarkSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWatermarkSettings();
              }}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-amber-300 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Sparkles size={13} />
              <span>জলছাপ সেটিংস</span>
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            বাতিল
          </button>
          <button
            id="save-settings-btn"
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check size={16} /> সেটিংস ও স্বাক্ষর সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================================
   CLOUD LINK-UP & DATA BACKUP MODAL
   ========================================================================= */
export function CloudBackupModal({
  data,
  onClose,
  onRestoreData,
  onNotify,
}: {
  data: AppData;
  onClose: () => void;
  onRestoreData: (restored: AppData) => void;
  onNotify: (msg: string) => void;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadJson = () => {
    exportFullBackupJson(data);
    onNotify("সম্পূর্ণ ক্লাউড ব্যাকআপ JSON ফাইল ডাউনলোড হয়েছে");
  };

  const handleDownloadExcel = () => {
    downloadExcel(data.members, data.deposits);
    onNotify("এক্সেল ব্যাকআপ (.xlsx) ডাউনলোড হয়েছে");
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedLink(true);
    onNotify("সম্পূর্ণ ব্যাকআপ ডেটা ক্লিপবোর্ডে কপি করা হয়েছে");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.members) && Array.isArray(parsed.deposits)) {
          onRestoreData({
            members: parsed.members,
            deposits: parsed.deposits,
            bankEntries: parsed.bankEntries || [],
            investEntries: parsed.investEntries || [],
            fundIncome: parsed.fundIncome || [],
            expenses: parsed.expenses || [],
            settings: parsed.settings || DEFAULT_SETTINGS,
          });
          onNotify("ব্যাকআপ ফাইল সফলভাবে রিস্টোর করা হয়েছে!");
          onClose();
        } else {
          alert("ভুল ব্যাকআপ ফরম্যাট! সঠিক TGS ব্যাকআপ JSON ফাইল আপলোড করুন।");
        }
      } catch (err) {
        alert("ফাইল পড়তে সমস্যা হয়েছে। সঠিক JSON ফাইল নির্বাচন করুন।");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal id="cloud-backup-modal" title="ক্লাউড ব্যাকআপ ও ডেটা স্টোরেজ লিংক" onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Storage stats overview */}
        <div className="p-4 bg-emerald-900 text-amber-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">
              অ্যাপ অভ্যন্তরীণ স্টোরেজ স্থিতি
            </span>
            <span className="text-[11px] bg-emerald-800 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              স্বয়ংক্রিয় সিঙ্ক চালু
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="bg-emerald-950/60 p-2 rounded-lg">
              <span className="text-[11px] text-emerald-300">মোট সদস্য</span>
              <p className="font-bold text-base text-white">{data.members.length} জন</p>
            </div>
            <div className="bg-emerald-950/60 p-2 rounded-lg">
              <span className="text-[11px] text-emerald-300">জমার খতিয়ান</span>
              <p className="font-bold text-base text-white">{data.deposits.length} টি</p>
            </div>
            <div className="bg-emerald-950/60 p-2 rounded-lg">
              <span className="text-[11px] text-emerald-300">হিসাব এন্ট্রি</span>
              <p className="font-bold text-base text-white">
                {data.bankEntries.length + data.investEntries.length + data.expenses.length} টি
              </p>
            </div>
          </div>
        </div>

        {/* Primary Backup Options */}
        <div className="space-y-3">
          <div className="p-4 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-900 text-sm">১. সম্পূর্ণ ক্লাউড ব্যাকআপ ফাইল (.json)</p>
              <p className="text-xs text-stone-500 mt-0.5">
                সকল সদস্য, জমার খতিয়ান, ব্যাংক ও ফান্ডের নিরাপদ ব্যাকআপ ফাইল সংরক্ষণ করুন।
              </p>
            </div>
            <button
              id="backup-json-btn"
              type="button"
              onClick={handleDownloadJson}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <Download size={14} /> ডাউনলোড
            </button>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-900 text-sm">২. ব্যাকআপ ফাইল থেকে রিস্টোর (Restore Data)</p>
              <p className="text-xs text-stone-500 mt-0.5">
                পূর্বে সংরক্ষিত কোনো .json ব্যাকআপ ফাইল থেকে সম্পূর্ণ হিসাব ফিরিয়ে আনুন।
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                id="restore-json-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Upload size={14} /> ফাইল নির্বাচন
              </button>
            </div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-900 text-sm">৩. ব্যাকআপ ডেটা টেক্সট কপি (Cloud Sync Link)</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Google Drive বা ক্লাউড ডকুমেন্টে পেস্ট করে সংরক্ষণ করার জন্য সম্পূর্ণ ডেটা কপি করুন।
              </p>
            </div>
            <button
              id="copy-json-btn"
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 border border-stone-300"
            >
              {copiedLink ? <CheckCircle2 size={14} className="text-emerald-700" /> : <Copy size={14} />}
              <span>{copiedLink ? "কপি হয়েছে" : "কপি করুন"}</span>
            </button>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-900 text-sm">৪. এক্সেল স্প্রেডশীট (.xlsx) ডাউনলোড</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Microsoft Excel বা Google Sheets-এ ওপেন করার জন্য টেবিল রিপোর্ট।
              </p>
            </div>
            <button
              id="download-excel-btn"
              type="button"
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <FileSpreadsheet size={14} /> এক্সেল ফাইল
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   ACCOUNT & EXPENSE MODALS
   ========================================================================= */
export function AddBankModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (entry: Omit<AccountEntry, 'id'>) => void;
}) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState<number | string>(1000);
  const [dividend, setDividend] = useState<number | string>(0);
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onSubmit({
      seq: Date.now(),
      date: date || new Date().toLocaleDateString('en-GB'),
      desc: desc.trim(),
      type,
      amount: Number(amount),
      dividend: Number(dividend) || 0,
      note: note.trim(),
      attachment,
      attachmentName,
    });
  };

  return (
    <Modal id="add-bank-modal" title="ব্যাংক হিসাব এন্ট্রি" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3 mb-1">
          <button
            type="button"
            onClick={() => setType('in')}
            className={`py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
              type === 'in'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            + ব্যাংকে জমা (Deposit)
          </button>
          <button
            type="button"
            onClick={() => setType('out')}
            className={`py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
              type === 'out'
                ? 'bg-red-700 text-white border-red-700 shadow-sm'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            - ব্যাংক থেকে উত্তোলন (Withdraw)
          </button>
        </div>

        {/* Dynamic Cash/Fund impact preview banner */}
        <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
          type === 'in'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <span className="text-base">{type === 'in' ? '🏦' : '💵'}</span>
          <span>
            {type === 'in'
              ? 'ব্যাংকে টাকা জমা করলে তা সমিতির ফান্ড/ক্যাশ থেকে মাইনাস হয়ে ব্যাংকের স্থিতিতে জমা হবে।'
              : 'ব্যাংক থেকে টাকা উঠালে তা ব্যাংক স্থিতি থেকে কমে সরাসরি সমিতির ক্যাশে (হাতে নগদ) যোগ হবে।'}
          </span>
        </div>

        <Field label="বিবরণ / ব্যাংকের নাম ও হিসাব" required>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={inputCls}
            placeholder="যেমন: সোনালী ব্যাংক সঞ্চয়ী হিসাব #১২৩৪৫"
            required
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="তারিখ" required>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              placeholder="dd/mm/yyyy"
            />
          </Field>
          <Field label="পরিমাণ (৳)" required>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ব্যাংক মুনাফা / লভ্যাংশ (৳)">
            <input
              type="number"
              min="0"
              value={dividend}
              onChange={(e) => setDividend(e.target.value)}
              className={inputCls}
              placeholder="০"
            />
          </Field>
          <Field label="মন্তব্য / চেক নং">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
              placeholder="চেক নম্বর বা শাখা..."
            />
          </Field>
        </div>

        <AttachmentUpload
          label="ব্যাংক জমা স্লিপ / চেক / ডকুমেন্টের ছবি (ঐচ্ছিক)"
          hint="ব্যাংক ডিপোজিট স্লিপ, চেকের ছবি বা ট্রানজেকশন স্ক্রিনশট যুক্ত করুন"
          value={attachment}
          fileName={attachmentName}
          onChange={(val, name) => {
            setAttachment(val);
            setAttachmentName(name);
          }}
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            বাতিল
          </button>
          <button
            id="submit-bank-btn"
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check size={16} /> সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddInvestModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (entry: Omit<AccountEntry, 'id'>) => void;
}) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [desc, setDesc] = useState("");
  const [place, setPlace] = useState("");
  const [type, setType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState<number | string>(50000);
  const [dividend, setDividend] = useState<number | string>(0);
  const [expectedProfitPercent, setExpectedProfitPercent] = useState<number | string>(15);
  const [expectedProfitAmount, setExpectedProfitAmount] = useState<number | string>(7500);
  const [maturityDate, setMaturityDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  // Auto calculate profit amount when % or amount changes
  const handlePercentChange = (pctVal: string) => {
    setExpectedProfitPercent(pctVal);
    const numPct = Number(pctVal);
    const numAmt = Number(amount);
    if (!isNaN(numPct) && !isNaN(numAmt) && numAmt > 0) {
      setExpectedProfitAmount(Math.round((numAmt * numPct) / 100));
    }
  };

  const handleProfitAmountChange = (amtVal: string) => {
    setExpectedProfitAmount(amtVal);
    const numProfit = Number(amtVal);
    const numAmt = Number(amount);
    if (!isNaN(numProfit) && !isNaN(numAmt) && numAmt > 0) {
      setExpectedProfitPercent(((numProfit / numAmt) * 100).toFixed(1));
    }
  };

  const handleAmountChange = (newAmtVal: string) => {
    setAmount(newAmtVal);
    const numAmt = Number(newAmtVal);
    const numPct = Number(expectedProfitPercent);
    if (!isNaN(numAmt) && !isNaN(numPct) && numAmt > 0) {
      setExpectedProfitAmount(Math.round((numAmt * numPct) / 100));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onSubmit({
      seq: Date.now(),
      date: date || new Date().toLocaleDateString('en-GB'),
      desc: desc.trim(),
      place: place.trim(),
      type,
      amount: Number(amount),
      dividend: Number(dividend) || 0,
      expectedProfitPercent: Number(expectedProfitPercent) || 0,
      expectedProfitAmount: Number(expectedProfitAmount) || 0,
      maturityDate: maturityDate.trim() || undefined,
      isMatured: false,
      isProfitSettled: false,
      note: note.trim(),
      attachment,
      attachmentName,
    });
  };

  return (
    <Modal id="add-invest-modal" title="নতুন বিনিয়োগ এন্ট্রি ও প্রফিট পরিকল্পনা" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3 mb-1">
          <button
            type="button"
            onClick={() => setType('in')}
            className={`py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
              type === 'in'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            + নতুন বিনিয়োগ (Invest)
          </button>
          <button
            type="button"
            onClick={() => setType('out')}
            className={`py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
              type === 'out'
                ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            - মূলধন ফেরত (Return)
          </button>
        </div>

        {/* Dynamic Cash/Fund impact preview banner */}
        <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
          type === 'in'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-amber-50 text-amber-900 border-amber-200'
        }`}>
          <span className="text-base">{type === 'in' ? '📈' : '💰'}</span>
          <span>
            {type === 'in'
              ? 'নতুন বিনিয়োগে অর্থ ক্যাশ/ফান্ড থেকে বিনিয়োগে চলে যাবে এবং সমন্বয় হবে।'
              : 'বিনিয়োগের মূলধন ফেরত প্রাপ্ত হলে তা সরাসরি সমিতির ক্যাশে (হাতে নগদ) পুনরায় যোগ হবে।'}
          </span>
        </div>

        <Field label="বিনিয়োগের খাত / বিবরণ" required>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={inputCls}
            placeholder="যেমন: মৎস্য খামার প্রকল্প বা ব্যবসা শেয়ার"
            required
          />
        </Field>

        <Field label="বিনিয়োগের স্থান / প্রতিষ্ঠান">
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className={inputCls}
            placeholder="যেমন: উলানিয়া বাজার"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="তারিখ" required>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              placeholder="dd/mm/yyyy"
            />
          </Field>
          <Field label="বিনিয়োগের মূলধন পরিমাণ (৳)" required>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
        </div>

        {/* 🌟 Investment Profit Estimation & Maturity Date Fields */}
        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>📈 প্রত্যাশিত মুনাফা ও মেয়াদপূর্তির সময়কাল</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-emerald-950 font-bold">
              অটো-হিসাব
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                প্রত্যাশিত মুনাফা (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={expectedProfitPercent}
                onChange={(e) => handlePercentChange(e.target.value)}
                className={inputCls}
                placeholder="যেমন: ১৫"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                আনুমানিক মুনাফা (৳)
              </label>
              <input
                type="number"
                min="0"
                value={expectedProfitAmount}
                onChange={(e) => handleProfitAmountChange(e.target.value)}
                className={inputCls}
                placeholder="যেমন: ৭৫০০"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                মেয়াদপূর্তি / ম্যাচুরিটি তারিখ
              </label>
              <input
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className={inputCls}
                placeholder="dd/mm/yyyy"
              />
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            * মেয়াদপূর্তির তারিখ পৌঁছালে অটো নোটিফিকেশন আসবে এবং এডমিন প্যানেল থেকে অর্জিত বাস্তব মুনাফা ৯৫% সাধারণ সদস্য ও ৫% টিজিএস ফান্ডে বণ্টন করা যাবে।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="তাত্ক্ষণিক প্রাপ্ত লভ্যাংশ (যদি থাকে ৳)">
            <input
              type="number"
              min="0"
              value={dividend}
              onChange={(e) => setDividend(e.target.value)}
              className={inputCls}
              placeholder="০"
            />
          </Field>
          <Field label="চুক্তিনামা বা নোট">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
              placeholder="মেয়াদ বা শর্তাবলী..."
            />
          </Field>
        </div>

        <AttachmentUpload
          label="বিনিয়োগ চুক্তিপত্র বা প্রমাণক সংযুক্তি (ঐচ্ছিক)"
          hint="চুক্তিপত্র, স্ট্যাম্প, বা চেক/রশিদের ছবি যুক্ত করুন"
          value={attachment}
          fileName={attachmentName}
          onChange={(val, name) => {
            setAttachment(val);
            setAttachmentName(name);
          }}
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            বাতিল
          </button>
          <button
            id="submit-invest-btn"
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check size={16} /> সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddFundIncomeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (income: Omit<FundIncome, 'id'>) => void;
}) {
  const [source, setSource] = useState("টিজিএস আলাদা আয়");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [amount, setAmount] = useState<number | string>(500);
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  const quickSources = [
    "টিজিএস আলাদা আয়",
    "সদস্য ফরম বিক্রি ফি",
    "বিশেষ অনুদান / স্পনসর",
    "সদস্য কল্যাণ চাঁদা",
    "অন্যান্য বিবিধ আয়",
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !amount) return;
    onSubmit({
      source: source.trim(),
      desc: desc.trim(),
      date: date || new Date().toLocaleDateString('en-GB'),
      amount: Number(amount),
      note: note.trim(),
      attachment,
      attachmentName,
    });
  };

  return (
    <Modal id="add-tgs-fund-modal" title="টিজিএস ফান্ডে আলাদা টাকা এন্ট্রি (TGS Fund Entry)" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* Explanatory Info Card */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
          <Sparkles size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">টিজিএস ফান্ড (TGS Special Reserve Fund)</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              সকল বিনিয়োগের লভ্যাংশ থেকে স্বয়ংক্রিয়ভাবে ৫% টিজিএস ফান্ডে যোগ হয়। এছাড়া যদি আলাদা কোনো টাকা আসে, তবে তা এখানে সরাসরি এন্ট্রি দিন।
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            উৎস নির্বাচন করুন <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {quickSources.map((qs) => (
              <button
                key={qs}
                type="button"
                onClick={() => setSource(qs)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors border ${
                  source === qs
                    ? "bg-emerald-800 text-amber-300 border-emerald-800 font-bold"
                    : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                }`}
              >
                {qs}
              </button>
            ))}
          </div>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={inputCls}
            placeholder="যেমন: সদস্য ফরম বিক্রি, অনুদান, ফি ইত্যাদি"
            required
          />
        </div>

        <Field label="সংক্ষিপ্ত বিবরণ">
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={inputCls}
            placeholder="যেমন: নতুন সদস্য ফরম ফি বা বিশেষ অনুদান"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="তারিখ" required>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              placeholder="dd/mm/yyyy"
            />
          </Field>
          <Field label="পরিমাণ (৳)" required>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
        </div>

        <Field label="মন্তব্য">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
            placeholder="অতিরিক্ত তথ্য বা রশিদ সূত্র..."
          />
        </Field>

        <AttachmentUpload
          label="জমার প্রমাণ বা রশিদের ছবি (ঐচ্ছিক)"
          hint="ফি জমার রশিদ, ক্যাশ স্লিপ বা প্রমাণক ছবি যুক্ত করুন"
          value={attachment}
          fileName={attachmentName}
          onChange={(val, name) => {
            setAttachment(val);
            setAttachmentName(name);
          }}
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            বাতিল
          </button>
          <button
            id="submit-fund-btn"
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check size={16} /> টিজিএস ফান্ডে জমা করুন
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddExpenseModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
}) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState<number | string>(100);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [invoice, setInvoice] = useState("");
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onSubmit({
      desc: desc.trim(),
      amount: Number(amount),
      date: date || new Date().toLocaleDateString('en-GB'),
      invoice: invoice.trim(),
      note: note.trim(),
      attachment,
      attachmentName,
    });
  };

  return (
    <Modal id="add-expense-modal" title="নতুন খরচ এন্ট্রি" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="খরচের বিবরণ / খাত" required>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={inputCls}
            placeholder="যেমন: মিটিং নাস্তা, প্রিন্ট, স্টেশনারি..."
            required
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="তারিখ" required>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              placeholder="dd/mm/yyyy"
            />
          </Field>
          <Field label="পরিমাণ (৳)" required>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ভাউচার / ইনভয়েস নং">
            <input
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              className={inputCls}
              placeholder="যেমন: V-042"
            />
          </Field>
          <Field label="মন্তব্য / পরিমাণ">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
              placeholder="যেমন: ৩ পিস বা বিবরণ..."
            />
          </Field>
        </div>

        <AttachmentUpload
          label="খরচের বিল / ক্যাশ মেমো / ভাউচারের ছবি (ঐচ্ছিক)"
          hint="দোকানের ক্যাশ মেমো, বিলের কপি বা রশিদ যুক্ত করুন"
          value={attachment}
          fileName={attachmentName}
          onChange={(val, name) => {
            setAttachment(val);
            setAttachmentName(name);
          }}
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            বাতিল
          </button>
          <button
            id="submit-expense-btn"
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check size={16} /> খরচ সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </Modal>
  );
}
