import React, { useState, useRef } from "react";
import {
  BookOpen,
  Edit3,
  Download,
  FileText,
  Paperclip,
  CheckCircle2,
  Calendar,
  Save,
  X,
  Printer,
  Copy,
  Check,
  Building,
  ShieldCheck,
  FileDown,
  Loader2,
  Sparkles,
  FileCheck,
  ImageDown,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toPng, toJpeg } from "html-to-image";
import { AppSettings } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { AttachmentUpload } from "./AttachmentUpload";
import { PageWatermark, TgsLogoSvg } from "./TgsLogoWatermark";

interface ConstitutionPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenWatermarkSettings?: () => void;
}

export function ConstitutionPage({ settings, onUpdateSettings, onOpenWatermarkSettings }: ConstitutionPageProps) {
  const { language, t, formatNumber } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(settings.constitution || "");
  const [attachment, setAttachment] = useState<string | undefined>(settings.constitutionAttachment);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(settings.constitutionAttachmentName);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState("");

  const documentRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const todayStr = new Date().toLocaleDateString(language === 'bn' ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    onUpdateSettings({
      constitution: text,
      constitutionAttachment: attachment,
      constitutionAttachmentName: attachmentName,
      constitutionUpdatedAt: todayStr,
    });

    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    setText(settings.constitution || "");
    setAttachment(settings.constitutionAttachment);
    setAttachmentName(settings.constitutionAttachmentName);
    setIsEditing(false);
  };

  const handleCopyText = () => {
    if (settings.constitution) {
      navigator.clipboard.writeText(settings.constitution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([settings.constitution || ""], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${settings.societyName}_${language === 'bn' ? 'গঠনতন্ত্র' : 'Constitution'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /**
   * Generates and downloads a multi-page high-definition PDF of the text constitution
   */
  const handleDownloadPdf = async () => {
    const element = document.getElementById("constitution-document-sheet");
    if (!element) {
      window.print();
      return;
    }

    try {
      setIsDownloadingPdf(true);
      setDownloadNotice(language === 'bn' ? "⏳ উচ্চ মানের গঠনতন্ত্র PDF তৈরি হচ্ছে..." : "⏳ Generating high quality Constitution PDF...");

      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      pdf.save(`${settings.societyName}_${language === 'bn' ? 'গঠনতন্ত্র' : 'Constitution'}.pdf`);
      setDownloadNotice(language === 'bn' ? `✅ গঠনতন্ত্র PDF সফলভাবে ডাউনলোড হয়েছে` : `✅ Constitution PDF downloaded successfully`);
      setTimeout(() => setDownloadNotice(""), 5000);
    } catch (error) {
      console.error("PDF generation failed:", error);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById("constitution-document-sheet");
    if (!element) return;

    try {
      setIsDownloadingImage(true);
      setDownloadNotice(language === 'bn' ? "⏳ ছবি তৈরি হচ্ছে..." : "⏳ Generating image...");

      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${settings.societyName}_${language === 'bn' ? 'গঠনতন্ত্র' : 'Constitution'}.jpg`;
      link.href = dataUrl;
      link.click();

      setDownloadNotice(language === 'bn' ? `✅ গঠনতন্ত্র হাই-রেজ্যুলেশন ছবি (JPG) সফলভাবে ডাউনলোড হয়েছে` : `✅ Constitution image (JPG) downloaded successfully`);
      setTimeout(() => setDownloadNotice(""), 6000);
    } catch (err) {
      console.error("Constitution image generation failed:", err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0 shadow-md border border-emerald-800">
            <BookOpen size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {t.nav_constitution}
              </h2>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {language === 'bn' ? "অফিসিয়াল বিধিমালা" : "Official Bylaws"}
              </span>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              {language === 'bn'
                ? `${settings.societyName} - এর সকল নিয়ম-কানুন, উদ্দেশ্য, সঞ্চয় ও বিনিয়োগ বিধিমালা`
                : `Rules, regulations, savings, and investment bylaws of ${settings.societyName}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          {!isEditing ? (
            <>
              {/* Primary PDF Download button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer border border-emerald-950 disabled:opacity-50"
                title={language === 'bn' ? "টেক্সট গঠনতন্ত্রকে পিডিএফ ফাইল হিসেবে ডাউনলোড করুন" : "Download Constitution as PDF"}
              >
                {isDownloadingPdf ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} className="text-amber-300" />
                )}
                <span>{isDownloadingPdf ? (language === 'bn' ? "PDF তৈরি হচ্ছে..." : "Creating PDF...") : (language === 'bn' ? "পিডিএফ (PDF) ডাউনলোড" : "Download PDF")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setText(settings.constitution || "");
                  setAttachment(settings.constitutionAttachment);
                  setAttachmentName(settings.constitutionAttachmentName);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer border border-amber-500/50"
              >
                <Edit3 size={15} />
                <span>{language === 'bn' ? "সম্পাদনা করুন" : "Edit"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-all border border-stone-300 cursor-pointer"
                title={language === 'bn' ? "প্রিন্ট করুন" : "Print"}
              >
                <Printer size={15} />
                <span className="hidden sm:inline">{language === 'bn' ? "প্রিন্ট" : "Print"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-all border border-stone-300 cursor-pointer"
                title={language === 'bn' ? "টেক্সট ফাইল হিসেবে ডাউনলোড" : "Download as text"}
              >
                <FileDown size={15} />
                <span className="hidden sm:inline">{language === 'bn' ? "টেক্সট" : "Text"}</span>
              </button>

              {onOpenWatermarkSettings && (
                <button
                  type="button"
                  onClick={onOpenWatermarkSettings}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs sm:text-sm transition-all border border-emerald-300 cursor-pointer shadow-2xs"
                  title={language === 'bn' ? "গঠনতন্ত্র ডকুমেন্টের ব্যাকগ্রাউন্ড জলছাপ (Watermark) সেটিংস" : "Watermark settings"}
                >
                  <Sparkles size={15} className="text-amber-600" />
                  <span>{language === 'bn' ? "জলছাপ" : "Watermark"}</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm transition-all border border-stone-300 cursor-pointer"
              >
                <X size={15} />
                <span>{t.btn_cancel}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer border border-emerald-900"
              >
                <Save size={15} />
                <span>{t.btn_save}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          <span>{language === 'bn' ? "গঠনতন্ত্র এবং ফাইল সংযুক্তি সফলভাবে সংরক্ষিত হয়েছে!" : "Constitution and attachment saved successfully!"}</span>
        </div>
      )}

      {downloadNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Main Constitution Content & Attachment Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Constitution Reader or Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden relative">
            {/* Header bar of Constitution Document */}
            <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {isEditing ? (language === 'bn' ? "গঠনতন্ত্রের টেক্সট সম্পাদনা ফরম" : "Edit Constitution Form") : (language === 'bn' ? "গঠনতন্ত্র ও বিধিমালা নথি" : "Constitution & Bylaws Document")}
                </h3>
              </div>

              {!isEditing && (
                <div className="flex items-center gap-2">
                  {settings.constitutionUpdatedAt && (
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {language === 'bn' ? "সর্বশেষ আপডেট:" : "Last Updated:"} {formatNumber(settings.constitutionUpdatedAt)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
                    title={language === 'bn' ? "টেক্সট কপি করুন" : "Copy text"}
                  >
                    {copied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>

            {/* Document Body */}
            {isEditing ? (
              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {language === 'bn' ? "গঠনতন্ত্রের পূর্ণাঙ্গ বিবরণ (টেক্সট ফরম্যাট):" : "Full Constitution Text (Text format):"}
                  </label>
                  <textarea
                    rows={18}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={language === 'bn' ? "এখানে সংগঠনের লক্ষ্য, উদ্দেশ্য, নীতিমালা, সদস্যপদের নিয়ম এবং ধারা বিস্তারিত লিখুন..." : "Write aims, objectives, policies, membership rules and sections here..."}
                    className="w-full p-4 rounded-xl border border-stone-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-stone-900 text-sm sm:text-base leading-relaxed font-mono outline-hidden resize-y bg-stone-50/50"
                  />
                  <p className="text-[11px] text-stone-500 mt-1.5">
                    {language === 'bn' ? '* ধারা, উপ-ধারা এবং বিধিমালার যেকোনো পরিবর্তন এখানে লিখে উপরের বা নিচের "সংরক্ষণ করুন" বাটনে ক্লিক করুন।' : '* Update any articles and clauses here and click Save.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <AttachmentUpload
                    label={language === 'bn' ? "গঠনতন্ত্রের অফিশিয়াল ফাইল/পিডিএফ বা স্বাক্ষরিত স্ক্যান কপি (সংযুক্তি)" : "Official PDF File or Signed Scan Copy (Attachment)"}
                    hint={language === 'bn' ? "PDF ফাইল বা পাতার ছবি যুক্ত করুন" : "Attach PDF file or page images"}
                    value={attachment}
                    fileName={attachmentName}
                    onChange={(val, name) => {
                      setAttachment(val);
                      setAttachmentName(name);
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Printable Sheet Area used for on-screen view, Print, and instant PDF rendering */
              <div
                id="constitution-document-sheet"
                ref={documentRef}
                className="p-6 sm:p-10 relative min-h-[500px] bg-white text-stone-900"
              >
                {/* Visual Background Watermark */}
                <PageWatermark settings={settings} documentType="constitution" />

                {/* Document Letterhead */}
                <div className="text-center pb-6 mb-6 border-b-2 border-stone-800 relative z-10">
                  <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 border-2 border-emerald-900 shadow-xs flex items-center justify-center bg-white">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <TgsLogoSvg size={52} />
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                    {language === 'en' && settings.societyNameEn ? settings.societyNameEn : settings.societyName}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-700 font-semibold mt-0.5">
                    {language === 'en' && settings.societySubtitleEn ? settings.societySubtitleEn : settings.societySubtitle}
                  </p>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    {language === 'en' && settings.societyAddressEn ? settings.societyAddressEn : settings.societyAddress} · {language === 'bn' ? 'মোবাইল' : 'Mobile'}: {formatNumber(settings.contactPhone)}
                  </p>
                  <div className="inline-block mt-3 px-4 py-1 bg-emerald-900 text-amber-300 font-bold text-xs sm:text-sm rounded-full shadow-xs">
                    {language === 'bn' ? "অফিসিয়াল গঠনতন্ত্র ও কার্যপ্রণালী বিধিমালা" : "Official Constitution & Code of Procedure"}
                  </div>
                </div>

                {/* Formatted Text Viewer */}
                {settings.constitution ? (
                  <div className="relative z-10 text-stone-900 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap font-sans space-y-4 text-justify">
                    {settings.constitution}
                  </div>
                ) : (
                  <div className="text-center py-16 text-stone-400 relative z-10">
                    <BookOpen size={48} className="mx-auto mb-3 text-stone-300" />
                    <p className="text-stone-600 font-bold text-base">{language === 'bn' ? "এখনো কোনো গঠনতন্ত্র টেক্সট যুক্ত করা হয়নি" : "No constitution text added yet"}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {language === 'bn' ? 'উপরের "সম্পাদনা করুন" বাটনে ক্লিক করে টেক্সট ও ফাইল যুক্ত করুন।' : 'Click "Edit" above to add text and file.'}
                    </p>
                  </div>
                )}

                {/* Footer Signature area */}
                <div className="mt-14 pt-6 border-t border-stone-400 grid grid-cols-2 gap-8 text-center relative z-10">
                  <div>
                    <div className="h-12 flex items-end justify-center mb-1">
                      {settings.treasurerSignature ? (
                        <img src={settings.treasurerSignature} alt="Treasurer Signature" className="max-h-11 object-contain" />
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">{language === 'bn' ? 'স্বাক্ষরিত' : 'Signed'}</span>
                      )}
                    </div>
                    <div className="border-t border-stone-500 pt-1.5">
                      <p className="font-bold text-xs sm:text-sm text-stone-900">{settings.treasurerName || (language === 'bn' ? "কোষাধ্যক্ষ" : "Treasurer")}</p>
                      <p className="text-[11px] text-stone-600">{language === 'bn' ? `কোষাধ্যক্ষ, ${settings.societyName}` : `Treasurer, ${settings.societyName}`}</p>
                    </div>
                  </div>

                  <div>
                    <div className="h-12 flex items-end justify-center mb-1">
                      {settings.presidentSignature ? (
                        <img src={settings.presidentSignature} alt="President Signature" className="max-h-11 object-contain" />
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">{language === 'bn' ? 'স্বাক্ষরিত' : 'Signed'}</span>
                      )}
                    </div>
                    <div className="border-t border-stone-500 pt-1.5">
                      <p className="font-bold text-xs sm:text-sm text-stone-900">{settings.presidentName || (language === 'bn' ? "সভাপতি" : "President")}</p>
                      <p className="text-[11px] text-stone-600">
                        {settings.presidentRole === 'secretary' ? (language === 'bn' ? 'সাধারণ সম্পাদক' : 'General Secretary') : (language === 'bn' ? 'সভাপতি' : 'President')}, {settings.societyName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right / Side Panel for Download & Attachment */}
        <div className="space-y-4">
          {/* Quick PDF & Document Generation Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
              <Download size={18} className="text-emerald-800" />
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                {language === 'bn' ? "গঠনতন্ত্র ডাউনলোড অপশন" : "Download Options"}
              </h3>
            </div>

            {/* Instant PDF Button */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-emerald-950 text-xs sm:text-sm">
                    {language === 'bn' ? "অফিসিয়াল গঠনতন্ত্র (PDF ফাইল)" : "Official Constitution (PDF)"}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {language === 'bn' ? "লেটারহেড, লোগো ও স্বাক্ষরসহ রেডিমেড পিডিএফ" : "With letterhead, logo & signatures"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} className="text-amber-300" />
                )}
                <span>{isDownloadingPdf ? (language === 'bn' ? "পিডিএফ তৈরি হচ্ছে..." : "Generating PDF...") : (language === 'bn' ? "পিডিএফ (PDF) ডাউনলোড করুন" : "Download PDF")}</span>
              </button>
            </div>

            {/* Secondary Formats (Image & Text) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloadingImage}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImageDown size={14} />}
                <span>{language === 'bn' ? "ছবি (JPG)" : "Image (JPG)"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
              >
                <FileDown size={14} />
                <span>{language === 'bn' ? "টেক্সট ফাইল" : "Text File"}</span>
              </button>
            </div>
          </div>

          {/* File Attachment Download Box (if uploaded by admin) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
              <Paperclip size={18} className="text-emerald-800" />
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                {language === 'bn' ? "সংযুক্ত কাস্টম ফাইল / স্ক্যান কপি" : "Attached Custom File / Scan"}
              </h3>
            </div>

            <div className="mt-4">
              {settings.constitutionAttachment ? (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-300 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                      <Paperclip size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {settings.constitutionAttachmentName || (language === 'bn' ? "সংযুক্ত অফিশিয়াল ফাইল" : "Attached Official File")}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {language === 'bn' ? "অ্যাডমিন কর্তৃক আপলোডকৃত মূল ফাইল" : "Uploaded original file"}
                      </p>
                    </div>
                  </div>

                  {settings.constitutionAttachment.startsWith("data:image/") && (
                    <div className="rounded-lg overflow-hidden border border-stone-300 max-h-40 bg-white">
                      <img
                        src={settings.constitutionAttachment}
                        alt="Constitution preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <a
                    href={settings.constitutionAttachment}
                    download={settings.constitutionAttachmentName || `${settings.societyName}_${language === 'bn' ? 'সংযুক্ত_গঠনতন্ত্র' : 'Constitution_Attachment'}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download size={15} />
                    <span>{language === 'bn' ? "আপলোডকৃত ফাইল ডাউনলোড" : "Download Attached File"}</span>
                  </a>
                </div>
              ) : (
                <div className="text-center p-5 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  <Paperclip size={28} className="mx-auto text-stone-400 mb-1.5" />
                  <p className="text-xs font-bold text-stone-700">{language === 'bn' ? "কোনো ফাইল সংযুক্ত করা নেই" : "No file attached"}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'bn' ? "অ্যাডমিন চাইলে স্বাক্ষরিত স্ক্যান কপি বা আলাদা পিডিএফ ফাইলও সংযুক্ত করতে পারেন।" : "Signed scan copy or PDF file can also be attached."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setText(settings.constitution || "");
                      setAttachment(settings.constitutionAttachment);
                      setAttachmentName(settings.constitutionAttachmentName);
                      setIsEditing(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Paperclip size={12} />
                    <span>{language === 'bn' ? "ফাইল সংযুক্ত করুন" : "Attach File"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info & Highlights */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-800" />
              <span>{language === 'bn' ? "গঠনতন্ত্রের মূল নিয়মাবলি" : "Key Constitutional Rules"}</span>
            </h4>
            <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 mt-1.5 shrink-0" />
                <span>{language === 'bn' ? "প্রতি মাসের ১০ তারিখের মধ্যে মাসিক সঞ্চয় পরিশোধ করতে হবে।" : "Monthly savings must be paid by the 10th of every month."}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 mt-1.5 shrink-0" />
                <span>{language === 'bn' ? `বিলম্বে পরিশোধের ক্ষেত্রে প্রতি মাসের জন্য ৳${formatNumber(settings.defaultFine)} হারে বিলম্ব ফি প্রযোজ্য।` : `Late fee of ৳${formatNumber(settings.defaultFine)} per month applies for late payments.`}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 mt-1.5 shrink-0" />
                <span>{language === 'bn' ? "বিনিয়োগের মোট লভ্যাংশ থেকে ৫% অংশ সংগঠনের ফান্ডে জমা রাখা হয়।" : "5% share of total investment profit is retained in TGS Fund."}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 mt-1.5 shrink-0" />
                <span>{language === 'bn' ? "যেকোনো সংশোধন সাধারণ সভার দুই-তৃতীয়াংশ সদস্যের মতামতের ভিত্তিতে হবে।" : "Any amendment requires a two-thirds majority in general meeting."}</span>
              </li>
            </ul>
          </div>

          {/* Organization contact box */}
          <div className="bg-emerald-950 text-amber-50 rounded-2xl p-5 border border-emerald-900 space-y-2.5">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-amber-400" />
              <h4 className="font-bold text-sm text-white">
                {language === 'en' && settings.societyNameEn ? settings.societyNameEn : settings.societyName}
              </h4>
            </div>
            <p className="text-xs text-emerald-200">
              {language === 'en' && (settings.societySubtitleEn || settings.societyAddressEn)
                ? (settings.societySubtitleEn ? `${settings.societySubtitleEn} · ` : '') + (settings.societyAddressEn || '')
                : `${settings.societySubtitle} · ${settings.societyAddress}`}
            </p>
            <p className="text-[11px] text-emerald-300/80 pt-1 border-t border-emerald-800/60">
              {language === 'bn' ? "জরুরি যোগাযোগ:" : "Contact:"} <span className="text-amber-300 font-mono font-bold">{formatNumber(settings.contactPhone)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
