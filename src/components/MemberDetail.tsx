import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  PlusCircle,
  Phone,
  Droplet,
  Calendar,
  Mail,
  User,
  Receipt,
  CheckCircle2,
  Edit3,
  Camera,
  MapPin,
  CreditCard,
  ShieldCheck,
  FileText,
  Eye,
  Download,
  Users,
  Heart,
  ExternalLink,
  X,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { Member, Deposit } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { AttachmentBadge } from './AttachmentUpload';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MemberDetailProps {
  member: Member;
  deposits: Deposit[];
  total: number;
  onBack: () => void;
  /** Omit to hide the "Add Deposit" button — Super Admin and Treasurer/Secretary only. */
  onAddDeposit?: () => void;
  onViewReceipt: (deposit: Deposit) => void;
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (memberUid: string) => void;
  onDeleteDeposit?: (depositId: string) => void;
}

export function MemberDetail({
  member,
  deposits,
  total,
  onBack,
  onAddDeposit,
  onViewReceipt,
  onEditMember,
  onDeleteMember,
  onDeleteDeposit,
}: MemberDetailProps) {
  const { language, t, tMonth, tMethod, formatNumber, formatUid, formatMoney } = useLanguage();
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    type: 'pdf' | 'image';
    fileName?: string;
  } | null>(null);

  const [showDeleteMemberConfirm, setShowDeleteMemberConfirm] = useState(false);
  const [deletingDeposit, setDeletingDeposit] = useState<Deposit | null>(null);

  useEffect(() => {
    if (!previewDoc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setPreviewDoc(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewDoc]);

  const totalFines = deposits.reduce((s, d) => s + Number(d.fine || 0), 0);
  const displayName = language === 'en' && member.nameEn ? member.nameEn : member.name;
  const secondaryName =
    language === 'en'
      ? member.name !== member.nameEn
        ? member.name
        : undefined
      : member.nameEn;

  const hasNominee = Boolean(
    member.nomineeName ||
      member.nomineeRelation ||
      member.nomineeMobile ||
      member.nomineeNid ||
      member.nomineePhoto ||
      member.nomineeNidDoc
  );

  return (
    <div id="member-detail-view" className="space-y-5">
      {/* Top navigation & Edit action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          id="back-to-members-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> {language === 'bn' ? 'সদস্য তালিকায় ফিরুন' : 'Back to Member Directory'}
        </button>

        <div className="flex items-center gap-2">
          {onEditMember && (
            <button
              id="edit-member-profile-btn"
              onClick={() => onEditMember(member)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 size={15} className="text-emerald-800" />{' '}
              {language === 'bn' ? 'তথ্য, এনআইডি ও নমিনী সংশোধন' : 'Edit Info, NID & Nominee'}
            </button>
          )}
          {onDeleteMember && (
            <button
              id="delete-member-btn"
              type="button"
              onClick={() => setShowDeleteMemberConfirm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title={language === 'bn' ? 'সদস্য প্রোফাইল মুছে ফেলুন' : 'Delete Member Profile'}
            >
              <Trash2 size={15} />{' '}
              {language === 'bn' ? 'সদস্য মুছুন' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-5 pb-5 border-b border-stone-200">
          <div className="flex items-start gap-4">
            {/* Member Profile Photo */}
            <div className="relative shrink-0">
              {member.photo ? (
                <div
                  className={`overflow-hidden rounded-2xl border-2 border-emerald-800 shadow-xs bg-white ${
                    member.photoFormat === 'passport' ? 'w-20 h-25 sm:w-24 sm:h-30' : 'w-20 h-20 sm:w-24 sm:h-24'
                  }`}
                >
                  <img
                    src={member.photo}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0 shadow-xs">
                  {displayName.charAt(0)}
                </div>
              )}

              {member.photo && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full whitespace-nowrap">
                  {member.photoFormat === 'passport' ? (language === 'bn' ? 'পাসপোর্ট' : 'Passport') : '300×300'}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{displayName}</h2>
                <span className="font-mono text-xs font-semibold bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-200">
                  {formatUid(member.uid)}
                </span>
              </div>
              {secondaryName && (
                <p className="text-sm text-stone-500 font-medium mt-0.5">{secondaryName}</p>
              )}
              {member.fatherName && (
                <p className="text-xs text-stone-600 font-medium mt-1">
                  {t.member_father_name}: <span className="text-stone-800 font-semibold">{member.fatherName}</span>
                </p>
              )}
              {member.nid && (
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  {t.member_nid}: <span className="font-mono text-stone-800 font-semibold">{formatNumber(member.nid)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-right min-w-[150px]">
            <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">{t.member_lifetime_deposit}</p>
            <p className="text-2xl font-bold font-mono text-emerald-950 mt-0.5">{formatMoney(total)}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {formatNumber(deposits.length)} {language === 'bn' ? 'টি কিস্তি জমা' : 'Deposits made'}
            </p>
            {totalFines > 0 && (
              <p className="text-[10px] text-rose-700 font-semibold mt-1">
                {language === 'bn' ? 'জরিমানা পরিশোধ' : 'Fines paid'}: {formatMoney(totalFines)}
              </p>
            )}
          </div>
        </div>

        {/* Member Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 text-sm">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <Phone size={13} className="text-emerald-700" /> {t.col_mobile}
            </span>
            <p className="font-semibold text-stone-900 mt-1 font-mono">{formatNumber(member.mobile) || '—'}</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <Droplet size={13} className="text-red-600" /> {t.col_blood_group}
            </span>
            <p className="font-bold text-stone-900 mt-1">{member.blood || '—'}</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <Calendar size={13} className="text-blue-600" /> {t.col_joined_date}
            </span>
            <p className="font-semibold text-stone-900 mt-1">{formatNumber(member.joined) || '—'}</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <Mail size={13} className="text-purple-600" /> {t.member_email}
            </span>
            <p className="font-medium text-stone-900 mt-1 truncate" title={member.email}>
              {member.email || '—'}
            </p>
          </div>
        </div>

        {member.address && (
          <div className="mt-3.5 p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-600 flex items-center gap-2">
            <MapPin size={14} className="text-emerald-700 shrink-0" />
            <span>{t.member_address}: <strong className="text-stone-800">{member.address}</strong></span>
          </div>
        )}

        {member.bio && (
          <div className="mt-3.5 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
            <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <MessageCircle size={13} className="text-amber-700" />
              {language === 'bn' ? 'আমার বার্তা' : 'My Message'}
            </p>
            <p className="text-sm text-stone-700 italic leading-relaxed whitespace-pre-line">{member.bio}</p>
          </div>
        )}

        {/* Member NID Attachment Section */}
        <div className="mt-4 p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>{language === 'bn' ? 'সদস্যের জাতীয় পরিচয়পত্র (NID) কার্ড' : "Member's National ID (NID) Card"}</span>
                {member.nidDoc ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full border border-emerald-300">
                    {language === 'bn'
                      ? `সংযুক্ত আছে ✓ (${member.nidDocType === 'pdf' ? 'PDF' : 'JPG'})`
                      : `Attached ✓ (${member.nidDocType === 'pdf' ? 'PDF' : 'JPG'})`}
                  </span>
                ) : (
                  <span className="text-[10px] bg-stone-100 text-stone-600 font-medium px-2 py-0.2 rounded-full">
                    {language === 'bn' ? 'সংযুক্ত নেই' : 'Not attached'}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {member.nid
                  ? language === 'bn'
                    ? `NID নং: ${formatNumber(member.nid)}`
                    : `NID No: ${formatNumber(member.nid)}`
                  : language === 'bn'
                    ? 'জাতীয় পরিচয়পত্র নম্বর দেওয়া হয়নি'
                    : 'National ID number not provided'}
                {member.nidDocName
                  ? language === 'bn'
                    ? ` · ফাইল: ${member.nidDocName}`
                    : ` · File: ${member.nidDocName}`
                  : ''}
              </p>
            </div>
          </div>

          {member.nidDoc && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPreviewDoc({
                    url: member.nidDoc!,
                    title: language === 'bn' ? `সদস্যের NID (${member.name})` : `Member's NID (${member.name})`,
                    type: member.nidDocType || (member.nidDoc?.startsWith('data:application/pdf') ? 'pdf' : 'image'),
                    fileName: member.nidDocName || 'member-nid-card',
                  })
                }
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Eye size={13} /> {language === 'bn' ? 'NID দেখুন' : 'View NID'}
              </button>
              <a
                href={member.nidDoc}
                download={member.nidDocName || `${member.uid}-nid-card`}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title={language === 'bn' ? 'ডাউনলোড' : 'Download'}
              >
                <Download size={13} /> {language === 'bn' ? 'ডাউনলোড' : 'Download'}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Nominee Details Section */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {language === 'bn' ? 'নমিনীর বিবরণ ও এনআইডি' : 'Nominee Information & Documents'}
              </h3>
              <p className="text-xs text-stone-500">
                {language === 'bn' ? 'সদস্যের মনোনীত উত্তরাধিকারীর তথ্য' : 'Nominee details & verified identity documents'}
              </p>
            </div>
          </div>

          {hasNominee ? (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              {language === 'bn' ? '✓ নমিনী নিবন্ধিত' : '\u2713 Nominee Registered'}
            </span>
          ) : (
            <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
              {language === 'bn' ? 'নমিনী যুক্ত নেই' : 'No Nominee Added'}
            </span>
          )}
        </div>

        {hasNominee ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
              {/* Nominee Photo */}
              <div className="relative shrink-0">
                {member.nomineePhoto ? (
                  <div
                    className={`overflow-hidden rounded-2xl border-2 border-amber-600 shadow-xs bg-white ${
                      member.nomineePhotoFormat === 'passport' ? 'w-20 h-25 sm:w-24 sm:h-30' : 'w-20 h-20 sm:w-24 sm:h-24'
                    }`}
                  >
                    <img
                      src={member.nomineePhoto}
                      alt={member.nomineeName || 'Nominee'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-100 text-amber-900 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-amber-300">
                    <User size={28} className="text-amber-800 mb-1" />
                    <span>{language === 'bn' ? 'ছবি নেই' : 'No Photo'}</span>
                  </div>
                )}

                {member.nomineePhoto && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full whitespace-nowrap">
                    {member.nomineePhotoFormat === 'passport' ? (language === 'bn' ? 'পাসপোর্ট সাইজ' : 'Passport Size') : (language === 'bn' ? '৩০০×৩০০' : '300\u00d7300')}
                  </span>
                )}
              </div>

              {/* Nominee Data Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <User size={12} className="text-amber-700" /> {language === 'bn' ? 'নমিনীর নাম' : "Nominee's Name"}
                  </span>
                  <p className="font-bold text-stone-900 mt-0.5">{member.nomineeName || '—'}</p>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <Heart size={12} className="text-rose-600" /> {language === 'bn' ? 'সদস্যের সাথে সম্পর্ক' : 'Relationship with Member'}
                  </span>
                  <p className="font-bold text-stone-900 mt-0.5">{member.nomineeRelation || '—'}</p>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <Phone size={12} className="text-emerald-700" /> {language === 'bn' ? 'নমিনীর মোবাইল নম্বর' : "Nominee's Mobile Number"}
                  </span>
                  <p className="font-semibold font-mono text-stone-900 mt-0.5">
                    {formatNumber(member.nomineeMobile) || '—'}
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 sm:col-span-2">
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <CreditCard size={12} className="text-blue-700" /> {language === 'bn' ? 'নমিনীর এনআইডি নম্বর' : "Nominee's NID Number"}
                  </span>
                  <p className="font-semibold font-mono text-stone-900 mt-0.5">
                    {formatNumber(member.nomineeNid) || (language === 'bn' ? 'দেওয়া হয়নি' : 'Not provided')}
                  </p>
                </div>

                {member.nomineeAddress && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 sm:col-span-2 lg:col-span-3">
                    <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                      <MapPin size={12} className="text-stone-700" /> {language === 'bn' ? 'নমিনীর স্থায়ী/বর্তমান ঠিকানা' : "Nominee's Permanent/Current Address"}
                    </span>
                    <p className="font-medium text-stone-800 mt-0.5">{member.nomineeAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Nominee NID Document */}
            {member.nomineeNidDoc ? (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-800 text-white flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>{language === 'bn' ? 'নমিনীর জাতীয় পরিচয়পত্র (NID) ডকুমেন্ট' : "Nominee's National ID (NID) Document"}</span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 font-mono font-bold px-1.5 py-0.2 rounded">
                        {member.nomineeNidDocType === 'pdf' ? 'PDF' : 'JPG'}
                      </span>
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {member.nomineeNidDocName || 'nominee-nid-document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        url: member.nomineeNidDoc!,
                        title: language === 'bn' ? `নমিনীর NID (${member.nomineeName || member.name})` : `Nominee's NID (${member.nomineeName || member.name})`,
                        type:
                          member.nomineeNidDocType ||
                          (member.nomineeNidDoc?.startsWith('data:application/pdf') ? 'pdf' : 'image'),
                        fileName: member.nomineeNidDocName || 'nominee-nid-card',
                      })
                    }
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Eye size={13} /> {language === 'bn' ? 'NID প্রিভিউ' : 'View Nominee NID'}
                  </button>
                  <a
                    href={member.nomineeNidDoc}
                    download={member.nomineeNidDocName || `${member.uid}-nominee-nid`}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download size={13} /> {language === 'bn' ? 'ডাউনলোড' : 'Download'}
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500 flex items-center justify-between">
                <span>{language === 'bn' ? 'নমিনীর কোনো NID ডকুমেন্ট আপলোড করা হয়নি।' : 'No NID document has been uploaded for the nominee.'}</span>
                {onEditMember && (
                  <button
                    type="button"
                    onClick={() => onEditMember(member)}
                    className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    {language === 'bn' ? '+ NID ডকুমেন্ট যোগ করুন' : '+ Add NID Document'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center bg-stone-50/70 border border-stone-200 rounded-xl">
            <User size={36} className="mx-auto text-stone-400 mb-2" />
            <p className="text-sm font-semibold text-stone-700">
              {language === 'bn' ? 'এই সদস্যের জন্য এখনও কোনো নমিনী যুক্ত করা হয়নি' : 'No nominee added for this member yet'}
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              {language === 'bn'
                ? 'নমিনীর নাম, ছবি, এনআইডি কার্ড (PDF/JPG) ও বিস্তারিত বিবরণ যুক্ত করতে তথ্য সংশোধন বাটনে ক্লিক করুন।'
                : 'Click edit button to add nominee name, photo, NID documents and details.'}
            </p>
            {onEditMember && (
              <button
                type="button"
                onClick={() => onEditMember(member)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <PlusCircle size={14} /> {language === 'bn' ? 'নমিনী ও এনআইডি যুক্ত করুন' : 'Add Nominee & NID'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Member's Deposit History */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50/70">
          <div>
            <h3 className="font-bold text-stone-800 text-base">{t.member_passbook}</h3>
            <p className="text-xs text-stone-500">
              {language === 'bn'
                ? 'এই সদস্যের সকল কিস্তি ও পেনাল্টি হিসেব'
                : 'All installments and late fee statements for this member'}
            </p>
          </div>
          {onAddDeposit && (
            <button
              id="member-add-deposit-btn"
              onClick={onAddDeposit}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle size={15} /> {t.btn_add_deposit}
            </button>
          )}
        </div>

        <div className="divide-y divide-stone-100">
          {deposits.map((d, idx) => (
            <div
              key={d.id}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {formatNumber(deposits.length - idx)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-stone-900 text-sm">{tMonth(d.month)}</p>
                    {d.attachment && (
                      <AttachmentBadge
                        attachment={d.attachment}
                        attachmentName={d.attachmentName}
                        compact
                      />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'bn' ? 'তারিখ' : 'Date'}: <span className="font-medium text-stone-700">{formatNumber(d.date)}</span> · {language === 'bn' ? 'মাধ্যম' : 'Method'}:{' '}
                    <span className="font-medium text-stone-700">{tMethod(d.method)}</span>
                    {d.note && <span className="italic text-stone-500"> ({d.note})</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-900 text-base">{formatMoney(d.amount)}</span>
                  {Number(d.fine) > 0 && (
                    <p className="text-xs text-red-600 font-mono">
                      {language === 'bn' ? 'বিলম্ব জরিমানা' : 'Late Fine'}: {formatMoney(d.fine)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onViewReceipt(d)}
                  title={t.btn_print_receipt}
                  className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <Receipt size={14} />
                  <span>{language === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                </button>
                {onDeleteDeposit && (
                  <button
                    onClick={() => setDeletingDeposit(d)}
                    title={language === 'bn' ? 'জমা কিস্তি মুছে ফেলুন' : 'Delete Deposit Record'}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {deposits.length === 0 && (
            <div className="p-8 text-center text-stone-400">
              <p className="text-sm">
                {language === 'bn'
                  ? 'এই সদস্যের কোনো জমার রেকর্ড এখনও নেই'
                  : 'No deposit records found for this member yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sensitive Confirmation: Delete Member */}
      {showDeleteMemberConfirm && (
        <ConfirmDeleteModal
          isOpen={showDeleteMemberConfirm}
          title={language === 'bn' ? "সদস্য প্রোফাইল মুছে ফেলুন" : "Delete Member Profile"}
          itemDescription={
            language === 'bn'
              ? `${displayName} (${formatUid(member.uid)}) · মোবাইল: ${member.mobile || '—'} · মোট সঞ্চয়: ${formatMoney(total)}`
              : `${displayName} (${formatUid(member.uid)}) · Mobile: ${member.mobile || '—'} · Total Savings: ${formatMoney(total)}`
          }
          warningMessage={language === 'bn'
            ? "সতর্কতা: এই সদস্যকে মুছে ফেললে তার সকল তথ্য, প্রোফাইল ছবি এবং সংযুক্ত এনআইডি ডকুমেন্ট স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
            : "Warning: Permanently removing this member will delete their profile, photo, NID documents and records. Proceed?"}
          onConfirm={() => {
            if (onDeleteMember) {
              onDeleteMember(member.uid);
            }
            setShowDeleteMemberConfirm(false);
          }}
          onClose={() => setShowDeleteMemberConfirm(false)}
        />
      )}

      {/* Sensitive Confirmation: Delete Specific Deposit */}
      {deletingDeposit && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingDeposit)}
          title={language === 'bn' ? "জমা কিস্তি মুছে ফেলুন" : "Delete Deposit Record"}
          itemDescription={
            language === 'bn'
              ? `${displayName} (${formatUid(member.uid)}) · ${tMonth(deletingDeposit.month)} · ${formatMoney(deletingDeposit.amount)} (রসিদ #${deletingDeposit.id})`
              : `${displayName} (${formatUid(member.uid)}) · ${tMonth(deletingDeposit.month)} · ${formatMoney(deletingDeposit.amount)} (Receipt #${deletingDeposit.id})`
          }
          warningMessage={language === 'bn'
            ? "এই জমা কিস্তির রসিদটি স্থায়ীভাবে মুছে ফেলা হবে এবং সদস্যের মোট জমার পরিমাণ স্বয়ংক্রিয়ভাবে কমে যাবে।"
            : "This deposit receipt will be deleted and the member's savings total will decrease."}
          onConfirm={() => {
            if (deletingDeposit && onDeleteDeposit) {
              onDeleteDeposit(deletingDeposit.id);
            }
            setDeletingDeposit(null);
          }}
          onClose={() => setDeletingDeposit(null)}
        />
      )}

      {/* Document Quick Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-amber-300" />
                <span className="font-bold text-sm truncate">{previewDoc.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName || 'nid-document'}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors"
                  title={language === 'bn' ? 'ডাউনলোড করুন' : 'Download'}
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-stone-100 flex items-center justify-center min-h-[300px]">
              {previewDoc.type === 'image' ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-stone-300"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-stone-300 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3">
                    <FileText size={32} />
                  </div>
                  <p className="font-bold text-stone-900 text-sm mb-1">{previewDoc.fileName || 'NID Document (PDF)'}</p>
                  <p className="text-xs text-stone-500 mb-4">{language === 'bn' ? 'এই পিডিএফ ফাইলটি ডাউনলোড করে পূর্ণাঙ্গ দেখতে পারেন' : 'Download this PDF file to view it in full'}</p>
                  <a
                    href={previewDoc.url}
                    download={previewDoc.fileName || 'nid-document.pdf'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download size={14} /> {language === 'bn' ? 'পিডিএফ ফাইল ডাউনলোড করুন' : 'Download PDF File'}
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
