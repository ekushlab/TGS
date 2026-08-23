import React, { useState, useRef } from 'react';
import {
  FileText,
  Trash2,
  Eye,
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Camera,
  CreditCard,
  User,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { validateNidDocumentFile, validatePhotoFileSize, processMemberPhoto } from '../utils/helpers';
import { STORAGE_MIME_TYPES, openFilePickerWithStorage } from '../utils/fileStorage';
import { useLanguage } from '../utils/LanguageContext';

/* =========================================================================
   NID DOCUMENT UPLOAD (PDF or JPG/JPEG/PNG) - Size: 100 KB to 1 MB
   ========================================================================= */
interface NidDocumentUploadProps {
  label: string;
  hint?: string;
  value?: string; // base64 / data URL
  fileName?: string;
  fileType?: 'pdf' | 'image';
  fileSize?: number; // in bytes
  onChange: (dataUrl?: string, name?: string, type?: 'pdf' | 'image', size?: number) => void;
  required?: boolean;
}

export const NidDocumentUpload: React.FC<NidDocumentUploadProps> = ({
  label,
  hint,
  value,
  fileName,
  fileType,
  fileSize,
  onChange,
  required = false,
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);

  const hintText =
    hint ??
    (language === 'bn'
      ? 'PDF অথবা JPG/PNG ফরম্যাটে এনআইডি আপলোড করুন (১০০ KB থেকে ১ MB)'
      : 'Upload NID in PDF or JPG/PNG format (100 KB to 1 MB)');

  const isPdf =
    fileType === 'pdf' ||
    value?.startsWith('data:application/pdf') ||
    fileName?.toLowerCase().endsWith('.pdf');
  const isImage = !isPdf && (fileType === 'image' || value?.startsWith('data:image/'));

  const handleFile = (file: File) => {
    setErrorMsg('');
    const validation = validateNidDocumentFile(file);
    if (!validation.valid) {
      setErrorMsg(
        validation.error ||
          (language === 'bn'
            ? 'ফাইলের সাইজ ১০০ KB থেকে ১ MB এর মধ্যে হতে হবে।'
            : 'File size must be between 100 KB and 1 MB.')
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const detectedType: 'pdf' | 'image' = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      ? 'pdf'
      : 'image';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onChange(dataUrl, file.name, detectedType, file.size);
      }
    };
    reader.onerror = () => {
      setErrorMsg(
        language === 'bn'
          ? 'ফাইল লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : 'Failed to load the file. Please try again.'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg('');
    onChange(undefined, undefined, undefined, undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTriggerBrowse = () => {
    openFilePickerWithStorage(fileInputRef.current, {
      types: [
        {
          description: 'NID Card Document (PDF, Image, Storage, SD Card)',
          accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
          },
        },
      ],
      onFileSelected: handleFile,
    });
  };

  const formattedSize = fileSize
    ? fileSize > 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(fileSize / 1024)} KB`
    : '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <CreditCard size={14} className="text-emerald-800" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-2 py-0.5 rounded">
          {language === 'bn' ? '১০০ KB – ১ MB' : '100 KB – 1 MB'}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={STORAGE_MIME_TYPES.nid}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImage ? (
              <div
                onClick={() => setShowPreview(true)}
                className="w-12 h-12 rounded-lg border border-emerald-400 bg-white overflow-hidden shrink-0 cursor-pointer shadow-2xs group relative"
              >
                <img src={value} alt="NID thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Eye size={14} />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-red-800 text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <FileText size={18} />
                <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">PDF</span>
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                  {fileName || (language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID) ডকুমেন্ট' : 'National ID (NID) Document')}
                </p>
                {formattedSize && (
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-mono font-bold px-1.5 py-0.2 rounded">
                    {formattedSize}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline cursor-pointer"
                >
                  <Eye size={12} /> {language === 'bn' ? 'প্রিভিউ দেখুন' : 'View Preview'}
                </button>
                <button
                  type="button"
                  onClick={handleTriggerBrowse}
                  className="text-[11px] font-medium text-stone-600 hover:text-stone-900 underline cursor-pointer"
                >
                  {language === 'bn' ? 'ফাইল পরিবর্তন / স্টোরেজ' : 'Change File / Storage'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            title={language === 'bn' ? 'মুছুন' : 'Delete'}
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
          className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
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
              {language === 'bn'
                ? 'ডিভাইস, মেমোরি কার্ড (SD Card) বা ড্রাইভ থেকে NID ফাইল নির্বাচন করুন'
                : 'Select NID file from device, memory card (SD Card), or drive'}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {language === 'bn'
                ? `${hintText} (PDF, JPG, PNG - এক্সটার্নাল স্টোরেজ ও ড্রপ সাপোর্টেড)`
                : `${hintText} (PDF, JPG, PNG - external storage & drag-drop supported)`}
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preview Modal */}
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
                <CreditCard size={16} className="text-amber-300" />
                <span className="font-bold text-sm truncate">
                  {fileName || (language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)')}
                </span>
                {formattedSize && (
                  <span className="text-[10px] bg-emerald-800 text-emerald-200 font-mono px-1.5 py-0.5 rounded">
                    {formattedSize}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={value}
                  download={fileName || 'nid-card-document'}
                  className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 transition-colors"
                  title={language === 'bn' ? 'ডাউনলোড করুন' : 'Download'}
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
                  alt="NID Preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-stone-300"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-stone-300 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3">
                    <FileText size={32} />
                  </div>
                  <p className="font-bold text-stone-900 text-sm mb-1">{fileName || 'NID Document (PDF)'}</p>
                  <p className="text-xs text-stone-500 mb-4">
                    {language === 'bn'
                      ? 'এই পিডিএফ ফাইলটি ডাউনলোড করে পূর্ণাঙ্গ দেখতে পারেন'
                      : 'Download this PDF file to view it in full'}
                  </p>
                  <a
                    href={value}
                    download={fileName || 'nid-document.pdf'}
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
                onClick={() => setShowPreview(false)}
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
};

/* =========================================================================
   NOMINEE PHOTO UPLOAD - Size: 30 KB to 300 KB
   ========================================================================= */
interface NomineePhotoUploadProps {
  photo?: string;
  photoFormat?: 'passport' | '300x300';
  photoSize?: number;
  onChange: (photo?: string, format?: 'passport' | '300x300', size?: number) => void;
}

export const NomineePhotoUpload: React.FC<NomineePhotoUploadProps> = ({
  photo,
  photoFormat = 'passport',
  photoSize,
  onChange,
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processNomineeFile = async (file: File) => {
    setErrorMsg('');
    const validation = validatePhotoFileSize(file, 30, 300);
    if (!validation.valid) {
      setErrorMsg(
        validation.error ||
          (language === 'bn'
            ? 'ছবির আকার ৩০ KB থেকে ৩০০ KB এর মধ্যে হতে হবে।'
            : 'Photo size must be between 30 KB and 300 KB.')
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessing(true);
      const safeFormat: 'passport' | '300x300' = photoFormat === '300x300' ? '300x300' : 'passport';
      const processedBase64 = await processMemberPhoto(file, safeFormat);
      onChange(processedBase64, safeFormat, file.size);
    } catch (err) {
      console.error('Failed to process nominee photo', err);
      setErrorMsg(
        language === 'bn' ? 'ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে।' : 'Failed to process the photo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processNomineeFile(file);
  };

  const handleTriggerPhotoBrowse = () => {
    openFilePickerWithStorage(fileInputRef.current, {
      types: [
        {
          description: 'Photo (Storage, SD Card, USB, Drive)',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
          },
        },
      ],
      onFileSelected: processNomineeFile,
    });
  };

  const handleFormatChange = async (newFormat: 'passport' | '300x300') => {
    if (fileInputRef.current?.files?.[0]) {
      try {
        setIsProcessing(true);
        const processed = await processMemberPhoto(fileInputRef.current.files[0], newFormat);
        onChange(processed, newFormat, fileInputRef.current.files[0].size);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      onChange(photo, newFormat, photoSize);
    }
  };

  const clearPhoto = () => {
    setErrorMsg('');
    onChange(undefined, photoFormat, undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formattedSize = photoSize ? `${Math.round(photoSize / 1024)} KB` : '';

  return (
    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <Camera size={14} className="text-emerald-800" />{' '}
          {language === 'bn' ? 'নমিনীর ছবি (৩০ KB – ৩০০ KB)' : "Nominee's Photo (30 KB – 300 KB)"}
        </span>
        {photo && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            {language === 'bn'
              ? photoFormat === 'passport'
                ? 'পাসপোর্ট সাইজ'
                : '৩০০ × ৩০০'
              : photoFormat === 'passport'
              ? 'Passport Size'
              : '300 × 300'}{' '}
            {formattedSize && `(${formattedSize})`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-stone-600">
          {language === 'bn' ? 'ছবির সাইজ:' : 'Photo size:'}
        </span>
        <button
          type="button"
          onClick={() => handleFormatChange('passport')}
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
            photoFormat === 'passport'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
          }`}
        >
          {language === 'bn' ? 'পাসপোর্ট সাইজ (Passport)' : 'Passport Size'}
        </button>
        <button
          type="button"
          onClick={() => handleFormatChange('300x300')}
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
            photoFormat === '300x300'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
          }`}
        >
          {language === 'bn' ? '৩০০ × ৩০০ (Square)' : '300 × 300 (Square)'}
        </button>
      </div>

      <div className="flex items-center gap-4 pt-1">
        {photo ? (
          <div className="relative group">
            <div
              className={`overflow-hidden rounded-xl border-2 border-emerald-800 shadow-xs bg-white ${
                photoFormat === 'passport' ? 'w-20 h-25' : 'w-20 h-20'
              }`}
            >
              <img src={photo} alt="Nominee Preview" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
              title={language === 'bn' ? 'ছবি মুছুন' : 'Delete Photo'}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ) : (
          <div
            onClick={handleTriggerPhotoBrowse}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-300 bg-white hover:border-emerald-700 hover:bg-emerald-50/40 cursor-pointer flex flex-col items-center justify-center text-stone-400 hover:text-emerald-800 transition-all p-2 text-center"
          >
            <Camera size={22} />
            <span className="text-[9px] font-semibold mt-1">{language === 'bn' ? 'ছবি যোগ' : 'Add Photo'}</span>
          </div>
        )}

        <div className="flex-1 space-y-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={STORAGE_MIME_TYPES.images}
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleTriggerPhotoBrowse}
            className="px-3 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload size={12} className="text-emerald-800" />
            <span>
              {language === 'bn'
                ? photo
                  ? 'ছবি পরিবর্তন'
                  : 'নমিনীর ছবি নির্বাচন (স্টোরেজ / SD Card)'
                : photo
                ? 'Change Photo'
                : "Select Nominee's Photo (Storage / SD Card)"}
            </span>
          </button>
          <p className="text-[10px] text-stone-500 leading-tight">
            {language === 'bn'
              ? 'ফাইলের আকার ৩০ KB থেকে ৩০০ KB হতে হবে (ইন্টারনাল, মেমোরি কার্ড বা ড্রাইভ থেকে নির্বাচনযোগ্য)।'
              : 'File size must be between 30 KB and 300 KB (selectable from internal storage, memory card, or drive).'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
