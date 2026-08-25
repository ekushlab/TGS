import React, { useState } from 'react';
import { Info, Edit3, Check, X, Building2, ShieldCheck, HeartHandshake, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { AppSettings } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface AboutUsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSaveAboutUs: (updatedAboutUs: string) => void;
  onUploadLogoClick?: () => void;
  /** Omit (or pass false) to hide the "Edit" control on the admin message — only admins may edit it. */
  canEdit?: boolean;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  settings,
  onClose,
  onSaveAboutUs,
  onUploadLogoClick,
  canEdit = false,
}) => {
  const { language, formatNumber } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(
    settings.aboutUs ||
      `ট্রাস্ট গ্রোথ সোসাইটি (TGS) একটি আদর্শ ও সুশৃঙ্খল সঞ্চয়ী সমবায় সংগঠন। ২৫ সেপ্টেম্বর ২০২৫ তারিখে উলানিয়া বাজার, গলাচিপা, পটুয়াখালীতে এর যাত্রা শুরু হয়। 

আমাদের মূল লক্ষ্য ও উদ্দেশ্য:
১. সদস্যদের নিয়মিত মাসিক সঞ্চয় বৃদ্ধি ও আর্থিক নিরাপত্তা নিশ্চিত করা।
২. লাভজনক ও নিরাপদ খাতে বিনিয়োগের মাধ্যমে সঞ্চিত মূলধনের সমৃদ্ধি ঘটানো।
৩. সদস্যদের পারস্পরিক ভ্রাতৃত্ব, ঐক্য ও সামাজিক কল্যাণ বজায় রাখা।
৪. স্বচ্ছ ও ডিজিটাল পদ্ধতিতে সকল লেনদেন পরিচালনা করা।

পরিচালনা পরিষদ ও অ্যাডমিন প্যানেল সর্বদা সদস্যদের সর্বোচ্চ সেবা ও আস্থা রক্ষায় অঙ্গীকারবদ্ধ।`
  );

  const handleSave = () => {
    onSaveAboutUs(text);
    setIsEditing(false);
  };

  const displayName =
    language === 'en' && settings.societyNameEn
      ? settings.societyNameEn
      : settings.societyName || 'Trust Growth Society';

  const displayAddress =
    language === 'en'
      ? settings.societyAddressEn || settings.societySubtitleEn || 'Ulania Bazar, Galachipa, Patuakhali'
      : settings.societyAddress || settings.societySubtitle || 'উলানিয়া বাজার, গলাচিপা, পটুয়াখালী';

  const displayEst =
    language === 'en'
      ? (settings.establishedDateEn ? `Est: ${settings.establishedDateEn}` : 'Est: 25 September 2025')
      : (settings.establishedDate ? `প্রতিষ্ঠাকাল: ${settings.establishedDate}` : 'প্রতিষ্ঠাকাল: ২৫ সেপ্টেম্বর ২০২৫');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-200"
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
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-emerald-950 text-amber-50 px-6 py-5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div
              onClick={() => {
                if (onUploadLogoClick) {
                  onClose();
                  onUploadLogoClick();
                }
              }}
              title={onUploadLogoClick ? (language === 'bn' ? "লোগো ক্রপ বা পরিবর্তন করুন" : "Change or crop logo") : undefined}
              className={`w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-sm shrink-0 overflow-hidden relative group transition-all ${
                onUploadLogoClick ? "cursor-pointer hover:ring-2 hover:ring-amber-300" : ""
              }`}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Info size={22} />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {language === 'bn' ? 'আমাদের সম্পর্কে (About Us)' : 'About Us (Society Overview)'}
              </h2>
              <p className="text-xs text-emerald-300">
                {displayName} {language === 'bn' ? 'এর পরিচিতি ও লক্ষ্য' : 'Overview & Mission'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick info banner */}
          <div className="bg-linear-to-r from-emerald-50 to-amber-50/50 p-4 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <Building2 size={16} className="text-emerald-800" />
                <span>{displayName}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-xs">
                <MapPin size={14} className="text-stone-500" />
                <span>{displayAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-xs">
                <Calendar size={14} className="text-stone-500" />
                <span>{displayEst}</span>
              </div>
            </div>

            {settings.contactPhone && (
              <div className="bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-2xs flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <Phone size={14} className="text-emerald-700" />
                <span>{formatNumber(settings.contactPhone)}</span>
              </div>
            )}
          </div>

          {/* Admin Writeup / About text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <Award size={16} className="text-amber-600" />
                <span>{language === 'bn' ? "অ্যাডমিন প্যানেলের বার্তা ও সমিতি পরিচিতি" : "Admin Panel Message & Society Introduction"}</span>
              </label>
              {canEdit && (!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  <Edit3 size={14} /> {language === 'bn' ? "এডিট করুন" : "Edit"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setText(settings.aboutUs || '');
                      setIsEditing(false);
                    }}
                    className="text-xs font-medium text-stone-600 hover:text-stone-900 px-2.5 py-1"
                  >
                    {language === 'bn' ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                  >
                    <Check size={14} /> {language === 'bn' ? "সংরক্ষণ" : "Save"}
                  </button>
                </div>
              ))}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 text-sm bg-white border-2 border-emerald-600 rounded-xl focus:outline-hidden text-stone-800 font-sans leading-relaxed shadow-inner"
                  placeholder={language === 'bn' ? "সমিতির পরিচিতি, লক্ষ্য, উদ্দেশ্য এবং পরিচালনা পরিষদ সম্পর্কিত বিবরণ এখানে লিখুন..." : "Write the society's introduction, goals, objectives, and details about the governing committee here..."}
                />
                <p className="text-[11px] text-stone-500">
                  {language === 'bn' ? "* পরিচালনা পরিষদ ও অ্যাডমিন প্যানেল নিজেদের ইচ্ছেমতো যেকোনো সময় এই বার্তা পরিবর্তন বা পরিমার্জন করতে পারবেন।" : "* The governing committee and admin panel may edit or revise this message at any time, as they see fit."}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 text-sm leading-relaxed whitespace-pre-line">
                {text}
              </div>
            )}
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{language === 'bn' ? "১০০% স্বচ্ছ ও ডিজিটাল হিসাব" : "100% Transparent & Digital Accounts"}</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {language === 'bn' ? "প্রতিটি সদস্যের মাসিক সঞ্চয়, জরিমানা, ব্যাংক ও বিনিয়োগের পুঙ্খানুপুঙ্খ বিবরণ।" : "Detailed records of every member's monthly savings, fines, bank transactions, and investments."}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
              <HeartHandshake size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{language === 'bn' ? "সদস্য ঐক্য ও কল্যাণমুখী" : "Member Unity & Welfare-Oriented"}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {language === 'bn' ? "ভ্রাতৃত্ব ও পারস্পরিক সহযোগিতার ভিত্তিতে সুশৃঙ্খল সমবায় কার্যক্রম।" : "Disciplined cooperative activities based on brotherhood and mutual cooperation."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between flex-wrap gap-3">
          {onUploadLogoClick ? (
            <button
              onClick={() => {
                onClose();
                onUploadLogoClick();
              }}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              {language === 'bn' ? "📷 সমিতির গোল লোগো পরিবর্তন করুন" : "📷 Change Society's Round Logo"}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            {language === 'bn' ? "বন্ধ করুন" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
