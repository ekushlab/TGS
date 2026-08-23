import React, { useState, useRef } from 'react';
import { Paperclip, FileImage, FileText, Trash2, Eye, X, Upload, ExternalLink, Download, HardDrive } from 'lucide-react';
import { STORAGE_MIME_TYPES, openFilePickerWithStorage } from '../utils/fileStorage';
import { useLanguage } from '../utils/LanguageContext';

interface AttachmentUploadProps {
  label?: string;
  hint?: string;
  value?: string; // base64 or data url
  fileName?: string;
  onChange: (dataUrl?: string, name?: string) => void;
}

export function AttachmentUpload({
  label,
  hint,
  value,
  fileName,
  onChange,
}: AttachmentUploadProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const resolvedLabel = label ?? (language === 'bn' ? "ডকুমেন্ট বা স্লিপ অ্যাটাচমেন্ট (সংযুক্তি)" : "Document or Slip Attachment");
  const resolvedHint = hint ?? (language === 'bn' ? "চেক, ব্যাংক জমা স্লিপ, বিনিয়োগের চুক্তিপত্র বা ভাউচারের ছবি" : "Photo of a check, bank deposit slip, investment agreement, or voucher");

  const processFile = (file: File) => {
    // Check max size (up to 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert(language === 'bn' ? "ফাইলের সাইজ সর্বোচ্চ ৮ মেগাবাইট (8MB) হতে পারবে।" : "File size must not exceed 8 megabytes (8MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleTriggerBrowse = () => {
    openFilePickerWithStorage(fileInputRef.current, {
      types: [
        {
          description: 'Documents & Images (Storage, SD Card, USB, Drive)',
          accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
          },
        },
      ],
      onFileSelected: processFile,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImage = value?.startsWith('data:image/') || value?.includes('.jpg') || value?.includes('.png') || value?.includes('.jpeg');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <Paperclip size={14} className="text-emerald-800" />
          <span>{resolvedLabel}</span>
        </label>
        {value && (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            {language === 'bn' ? "✓ সংযুক্ত করা হয়েছে" : "✓ Attached"}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={STORAGE_MIME_TYPES.documents}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImage ? (
              <div 
                onClick={() => setShowPreview(true)}
                className="w-12 h-12 rounded-lg border border-emerald-400 bg-white overflow-hidden shrink-0 cursor-pointer shadow-2xs group relative"
              >
                <img src={value} alt="Attachment thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Eye size={14} />
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText size={18} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-950 truncate">
                {fileName || (language === 'bn' ? "সংযুক্ত ডকুমেন্ট / স্লিপ" : "Attached Document / Slip")}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline cursor-pointer"
                >
                  <Eye size={12} /> {language === 'bn' ? "প্রিভিউ দেখুন" : "View Preview"}
                </button>
                <button
                  type="button"
                  onClick={handleTriggerBrowse}
                  className="text-[11px] font-medium text-stone-600 hover:text-stone-900 underline cursor-pointer"
                >
                  {language === 'bn' ? "পরিবর্তন / স্টোরেজ" : "Change / Storage"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            title={language === 'bn' ? "সংযুক্তি মুছুন" : "Remove Attachment"}
            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-stone-500 hover:text-rose-700 border border-stone-300 hover:border-rose-300 transition-colors shrink-0 cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <div
          onClick={handleTriggerBrowse}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
            dragOver
              ? 'border-emerald-700 bg-emerald-50/80 scale-[0.99]'
              : 'border-stone-300 bg-stone-50/60 hover:bg-emerald-50/40 hover:border-emerald-600'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Upload size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">
              {language === 'bn' ? "ডিভাইস, মেমোরি কার্ড (SD Card) বা ড্রাইভ থেকে ফাইল নির্বাচন করুন" : "Select a file from device, memory card (SD Card), or drive"}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {hint} {language === 'bn' ? "(JPG, PNG, PDF - এক্সটার্নাল স্টোরেজ ও ড্র্যাগ-ড্রপ সাপোর্টেড)" : "(JPG, PNG, PDF - external storage & drag-and-drop supported)"}
            </p>
          </div>
        </div>
      )}

      {/* Full Attachment Preview Modal */}
      {showPreview && value && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreview(false);
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
                <Paperclip size={16} className="text-amber-300" />
                <span className="font-bold text-sm truncate">
                  {fileName || (language === 'bn' ? "সংযুক্ত ডকুমেন্ট / রসিদ প্রিভিউ" : "Attached Document / Receipt Preview")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={value}
                  download={fileName || "attachment-document"}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors"
                  title={language === 'bn' ? "ডাউনলোড করুন" : "Download"}
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-stone-100 flex items-center justify-center min-h-[300px]">
              {isImage ? (
                <img
                  src={value}
                  alt={fileName || "Attachment"}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-stone-300"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-stone-300 max-w-md">
                  <FileText size={48} className="mx-auto text-emerald-800 mb-2" />
                  <p className="font-bold text-stone-900 text-sm mb-1">{fileName || (language === 'bn' ? "ডকুমেন্ট ফাইল" : "Document File")}</p>
                  <p className="text-xs text-stone-500 mb-4">{language === 'bn' ? "এই ফাইলটি ডাউনলোড করে দেখতে পারেন" : "You can download this file to view it"}</p>
                  <a
                    href={value}
                    download={fileName || "attachment-document"}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download size={14} /> {language === 'bn' ? "ফাইল ডাউনলোড করুন" : "Download File"}
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition-colors"
              >
                {language === 'bn' ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AttachmentBadgeProps {
  attachment?: string;
  attachmentName?: string;
  compact?: boolean;
}

export function AttachmentBadge({ attachment, attachmentName, compact = false }: AttachmentBadgeProps) {
  const { language } = useLanguage();
  const [showPreview, setShowPreview] = useState(false);

  if (!attachment) return null;

  const isImage = attachment.startsWith('data:image/') || attachment.includes('.jpg') || attachment.includes('.png');

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPreview(true);
        }}
        title={language === 'bn' ? "সংযুক্তি দেখুন / প্রিভিউ" : "View Attachment / Preview"}
        className={`inline-flex items-center gap-1 font-semibold rounded-md border transition-all cursor-pointer ${
          compact
            ? 'px-1.5 py-0.5 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
            : 'px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
        }`}
      >
        <Paperclip size={compact ? 11 : 13} className="text-emerald-700" />
        <span className="truncate max-w-[120px]">
          {compact ? (language === 'bn' ? 'স্লিপ/ফাইল' : 'Slip/File') : (attachmentName || (language === 'bn' ? 'সংযুক্তি' : 'Attachment'))}
        </span>
      </button>

      {/* Quick View Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreview(false);
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
                <Paperclip size={16} className="text-amber-300" />
                <span className="font-bold text-sm truncate">
                  {attachmentName || (language === 'bn' ? "সংযুক্ত ডকুমেন্ট / ভাউচার স্লিপ" : "Attached Document / Voucher Slip")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={attachment}
                  download={attachmentName || "attachment-document"}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors"
                  title={language === 'bn' ? "ডাউনলোড করুন" : "Download"}
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-stone-100 flex items-center justify-center min-h-[300px]">
              {isImage ? (
                <img
                  src={attachment}
                  alt={attachmentName || "Attachment"}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-stone-300"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-stone-300 max-w-md">
                  <FileText size={48} className="mx-auto text-emerald-800 mb-2" />
                  <p className="font-bold text-stone-900 text-sm mb-1">{attachmentName || (language === 'bn' ? "ডকুমেন্ট ফাইল" : "Document File")}</p>
                  <a
                    href={attachment}
                    download={attachmentName || "attachment-document"}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors mt-3"
                  >
                    <Download size={14} /> {language === 'bn' ? "ফাইল ডাউনলোড করুন" : "Download File"}
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition-colors"
              >
                {language === 'bn' ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
