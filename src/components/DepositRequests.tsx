import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Eye,
  Phone,
} from 'lucide-react';
import { Member, Deposit, DepositRequest, AppSettings } from '../types';
import { Modal, Field, inputCls } from './Modals';
import { AttachmentUpload } from './AttachmentUpload';
import { useLanguage } from '../utils/LanguageContext';
import {
  getCurrentRunningMonth,
  getDepositTimelineMonths,
  getMemberPaidMonthKeys,
  getMonthIndexKey,
  DEFAULT_SETTINGS,
} from '../utils/helpers';

/** The three payment modes a member can self-report — distinct from the
 * fuller METHODS list an Admin/Treasurer picks from when entering a deposit
 * directly, matching exactly what was asked for this member-facing form. */
export const DEPOSIT_REQUEST_MODES: { value: DepositRequest['paymentMode']; labelBn: string; labelEn: string }[] = [
  { value: 'bkash', labelBn: 'বিকাশ', labelEn: 'bKash' },
  { value: 'bangla_qr', labelBn: 'বাংলা কিউআর', labelEn: 'Bangla QR' },
  { value: 'by_hand', labelBn: 'হাতে নগদ', labelEn: 'By Hand (Cash)' },
];

export function paymentModeLabel(mode: DepositRequest['paymentMode'], language: string): string {
  const found = DEPOSIT_REQUEST_MODES.find((m) => m.value === mode);
  if (!found) return mode;
  return language === 'bn' ? found.labelBn : found.labelEn;
}

function StatusBadge({ status }: { status: DepositRequest['status'] }) {
  const { language } = useLanguage();
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={12} /> {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
        <XCircle size={12} /> {language === 'bn' ? 'বাতিল' : 'Rejected'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
      <Clock size={12} /> {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
    </span>
  );
}

/* =========================================================================
   MEMBER-FACING: Submit a monthly deposit request
   ========================================================================= */
export function DepositRequestModal({
  member,
  deposits,
  myRequests,
  settings = DEFAULT_SETTINGS,
  onClose,
  onSubmit,
}: {
  member: Member;
  deposits: Deposit[];
  myRequests: DepositRequest[];
  settings?: AppSettings;
  onClose: () => void;
  onSubmit: (req: {
    month: string;
    amount: number;
    paymentMode: DepositRequest['paymentMode'];
    photo?: string;
    photoName?: string;
    note?: string;
  }) => void;
}) {
  const { language } = useLanguage();
  const runningMonth = useMemo(() => getCurrentRunningMonth(), []);
  const timelineMonths = useMemo(() => {
    const list = getDepositTimelineMonths(2025, 9, 60);
    if (!list.includes(runningMonth)) list.push(runningMonth);
    return list;
  }, [runningMonth]);

  const paidMonthKeys = useMemo(
    () => getMemberPaidMonthKeys(member.uid, deposits),
    [member.uid, deposits]
  );
  const pendingMonthKeys = useMemo(() => {
    const set = new Set<string>();
    myRequests.forEach((r) => {
      if (r.status === 'pending') set.add(getMonthIndexKey(r.month));
    });
    return set;
  }, [myRequests]);

  const [month, setMonth] = useState<string>(runningMonth);
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMode, setPaymentMode] = useState<DepositRequest['paymentMode']>('bkash');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState<string | undefined>(undefined);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const isAlreadyPaid = paidMonthKeys.has(getMonthIndexKey(month));
  const hasPendingForMonth = pendingMonthKeys.has(getMonthIndexKey(month));

  const handlePrevMonth = () => {
    const i = timelineMonths.indexOf(month);
    if (i > 0) setMonth(timelineMonths[i - 1]);
  };
  const handleNextMonth = () => {
    const i = timelineMonths.indexOf(month);
    if (i >= 0 && i < timelineMonths.length - 1) setMonth(timelineMonths[i + 1]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isAlreadyPaid) {
      setError(
        language === 'bn'
          ? 'এই মাসের কিস্তি ইতোমধ্যে পরিশোধিত হয়েছে।'
          : 'This month has already been paid.'
      );
      return;
    }
    if (hasPendingForMonth) {
      setError(
        language === 'bn'
          ? 'এই মাসের জন্য একটি রিকোয়েস্ট ইতোমধ্যে অপেক্ষমাণ আছে। অনুমোদনের অপেক্ষা করুন।'
          : 'A request for this month is already pending review.'
      );
      return;
    }
    if (!amount || amount <= 0) {
      setError(language === 'bn' ? 'সঠিক পরিমাণ লিখুন।' : 'Enter a valid amount.');
      return;
    }
    onSubmit({ month, amount: Number(amount), paymentMode, photo, photoName, note: note.trim() });
  };

  const recent = useMemo(
    () => [...myRequests].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 5),
    [myRequests]
  );

  return (
    <Modal
      id="deposit-request-modal"
      title={language === 'bn' ? 'মাসিক কিস্তি জমার রিকোয়েস্ট' : 'Monthly Deposit Request'}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-3.5">
        <div className="flex items-center gap-1.5 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900">
          <Info size={14} className="shrink-0 text-emerald-700" />
          <span>
            {language === 'bn'
              ? 'টাকা জমা দেওয়ার পর এখানে রিকোয়েস্ট জমা দিন। কোষাধ্যক্ষ অনুমোদন করলে এটি আপনার কিস্তি হিসেবে যুক্ত হবে এবং আপনি নোটিফিকেশন পাবেন।'
              : "After sending your payment, submit a request here. Once the Treasurer approves it, it will be recorded as your monthly installment and you'll get a notification."}
          </span>
        </div>

        <Field label={language === 'bn' ? 'কোন মাসের জন্য জমা দিচ্ছেন' : 'Which month is this for'} required>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-lg border border-stone-300 hover:bg-stone-100 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg py-2">
              {month}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-stone-300 hover:bg-stone-100 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {isAlreadyPaid && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              {language === 'bn' ? '✓ এই মাসের কিস্তি ইতোমধ্যে পরিশোধিত।' : '✓ This month is already paid.'}
            </p>
          )}
          {!isAlreadyPaid && hasPendingForMonth && (
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              {language === 'bn'
                ? 'এই মাসের একটি রিকোয়েস্ট ইতোমধ্যে অপেক্ষমাণ আছে।'
                : 'A request for this month is already pending.'}
            </p>
          )}
        </Field>

        <Field label={language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Mode'} required>
          <div className="grid grid-cols-3 gap-2">
            {DEPOSIT_REQUEST_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPaymentMode(m.value)}
                className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  paymentMode === m.value
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {language === 'bn' ? m.labelBn : m.labelEn}
              </button>
            ))}
          </div>
        </Field>

        <Field label={language === 'bn' ? 'জমার পরিমাণ (টাকা)' : 'Amount (Taka)'} required>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <Field
          label={language === 'bn' ? 'ট্রানজেকশন নোট (ঐচ্ছিক)' : 'Transaction Note (optional)'}
        >
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
            placeholder={language === 'bn' ? 'TrxID বা মন্তব্য...' : 'TrxID or a note...'}
          />
        </Field>

        <AttachmentUpload
          label={language === 'bn' ? 'পেমেন্টের প্রমাণ (স্ক্রিনশট/রশিদ)' : 'Payment Proof (screenshot/receipt)'}
          hint={
            paymentMode === 'by_hand'
              ? (language === 'bn' ? 'হাতে জমা দিলে ছবি ঐচ্ছিক' : 'Optional for cash-by-hand')
              : (language === 'bn' ? 'বিকাশ/QR পেমেন্টের স্ক্রিনশট যুক্ত করা ভালো' : 'Recommended for bKash/QR payments')
          }
          value={photo}
          fileName={photoName}
          onChange={(val, name) => {
            setPhoto(val);
            setPhotoName(name);
          }}
        />

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isAlreadyPaid || hasPendingForMonth}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Wallet size={15} /> {language === 'bn' ? 'রিকোয়েস্ট জমা দিন' : 'Submit Request'}
          </button>
        </div>

        {recent.length > 0 && (
          <div className="pt-3 border-t border-stone-200 space-y-2">
            <p className="text-xs font-bold text-stone-700">
              {language === 'bn' ? 'আমার সাম্প্রতিক রিকোয়েস্ট' : 'My Recent Requests'}
            </p>
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-stone-800">{r.month}</span>
                  <span className="text-stone-500 ml-1.5">
                    {paymentModeLabel(r.paymentMode, language)} · ৳{r.amount}
                  </span>
                  {r.status === 'rejected' && r.rejectionReason && (
                    <p className="text-[11px] text-rose-600 mt-0.5 truncate">{r.rejectionReason}</p>
                  )}
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </form>
    </Modal>
  );
}

/* =========================================================================
   TREASURER / ADMIN: Review & approve/reject pending deposit requests
   ========================================================================= */
export function DepositRequestsPanel({
  members,
  depositRequests,
  currentUserName,
  onClose,
  onApprove,
  onReject,
}: {
  members: Member[];
  depositRequests: DepositRequest[];
  currentUserName: string;
  onClose: () => void;
  onApprove: (request: DepositRequest) => void;
  onReject: (request: DepositRequest, reason: string) => void;
}) {
  const { language } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const memberByUid = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.uid, m));
    return map;
  }, [members]);

  const pending = useMemo(
    () =>
      depositRequests
        .filter((r) => r.status === 'pending')
        .sort((a, b) => a.submittedAt - b.submittedAt),
    [depositRequests]
  );
  const resolved = useMemo(
    () =>
      depositRequests
        .filter((r) => r.status !== 'pending')
        .sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0)),
    [depositRequests]
  );

  const confirmReject = (request: DepositRequest) => {
    onReject(request, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
  };

  const renderRow = (r: DepositRequest) => {
    const m = memberByUid.get(r.memberUid);
    const name = m ? (language === 'en' && m.nameEn ? m.nameEn : m.name) : r.memberUid;
    return (
      <div key={r.id} className="p-3 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-2xs">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="font-bold text-stone-900 text-sm">
              {name} <span className="text-stone-400 font-mono text-xs">({r.memberUid})</span>
            </p>
            {m?.mobile && (
              <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                <Phone size={11} /> {m.mobile}
              </span>
            )}
          </div>
          <StatusBadge status={r.status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-mono bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">{r.month}</span>
          <span className="font-mono bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded">৳{r.amount}</span>
          <span className="bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded">
            {paymentModeLabel(r.paymentMode, language)}
          </span>
          <span className="text-stone-400 text-[11px]">
            {new Date(r.submittedAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-GB')}
          </span>
        </div>

        {r.note && <p className="text-xs text-stone-600 italic">"{r.note}"</p>}

        {r.photo && (
          <div
            onClick={() => setPreviewUrl(r.photo!)}
            className="w-16 h-16 rounded-lg border border-stone-300 overflow-hidden cursor-pointer relative group shrink-0"
          >
            <img src={r.photo} alt="proof" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Eye size={16} />
            </div>
          </div>
        )}

        {r.status !== 'pending' && (
          <p className="text-[11px] text-stone-500">
            {r.status === 'approved'
              ? (language === 'bn' ? 'অনুমোদনকারী: ' : 'Approved by: ')
              : (language === 'bn' ? 'বাতিলকারী: ' : 'Rejected by: ')}
            <span className="font-semibold">{r.resolvedByName || '-'}</span>
            {r.rejectionReason && <span className="block text-rose-600 mt-0.5">{r.rejectionReason}</span>}
          </p>
        )}

        {r.status === 'pending' && (
          <div className="pt-1.5 border-t border-stone-100">
            {rejectingId === r.id ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={language === 'bn' ? 'বাতিলের কারণ (ঐচ্ছিক)' : 'Reason for rejection (optional)'}
                  className={inputCls}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectReason('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmReject(r)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {language === 'bn' ? 'নিশ্চিত বাতিল' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(r.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <XCircle size={13} /> {language === 'bn' ? 'বাতিল' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(r)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 size={13} /> {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      id="deposit-requests-panel"
      title={language === 'bn' ? 'জমা রিকোয়েস্ট অনুমোদন' : 'Deposit Request Approvals'}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3">
        {pending.length === 0 && (
          <div className="p-6 text-center text-stone-400 text-sm">
            {language === 'bn' ? 'কোনো অপেক্ষমাণ রিকোয়েস্ট নেই।' : 'No pending requests.'}
          </div>
        )}
        {pending.map(renderRow)}

        {resolved.length > 0 && (
          <div className="pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {showResolved
                ? (language === 'bn' ? '▲ সমাধানকৃত রিকোয়েস্ট লুকান' : '▲ Hide resolved requests')
                : (language === 'bn' ? `▼ সমাধানকৃত রিকোয়েস্ট দেখুন (${resolved.length})` : `▼ Show resolved requests (${resolved.length})`)}
            </button>
            {showResolved && <div className="space-y-3 mt-3">{resolved.map(renderRow)}</div>}
          </div>
        )}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-xs"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-2xl w-full">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="p-1.5 rounded-lg bg-emerald-900 text-amber-200"
              >
                <X size={16} />
              </button>
            </div>
            <img src={previewUrl} alt="Payment proof" className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </Modal>
  );
}
