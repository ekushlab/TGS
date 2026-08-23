import React, { useState, useRef } from "react";
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  Upload,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
  FileText,
  FileCheck,
  RotateCw,
  Maximize2,
  Trash2,
  Type,
  ShieldCheck,
  Wand2,
  HardDrive,
} from "lucide-react";
import { AppSettings } from "../types";
import { PageWatermark, TgsLogoSvg } from "./TgsLogoWatermark";
import { STORAGE_MIME_TYPES } from "../utils/fileStorage";
import { useLanguage } from "../utils/LanguageContext";

interface WatermarkModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSaveWatermark: (updatedSettings: Partial<AppSettings>) => void;
  onOpenLogoUpload?: () => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  settings,
  onClose,
  onSaveWatermark,
}) => {
  const { language } = useLanguage();
  const [enabled, setEnabled] = useState<boolean>(settings.watermarkEnabled !== false);
  const [type, setType] = useState<'seal' | 'logo' | 'custom_image' | 'custom_text'>(
    settings.watermarkType || 'seal'
  );
  const [customUrl, setCustomUrl] = useState<string | undefined>(settings.watermarkUrl);
  const [rawUrl, setRawUrl] = useState<string | undefined>(settings.watermarkRawUrl);
  const [customText, setCustomText] = useState<string>(
    settings.watermarkText || settings.societyName || "TRUST GROWTH SOCIETY"
  );
  const [opacity, setOpacity] = useState<number>(settings.watermarkOpacity ?? 0.09);
  const [size, setSize] = useState<number>(settings.watermarkSize ?? 480);
  const [rotation, setRotation] = useState<number>(settings.watermarkRotation ?? 0);
  const [removeBg, setRemoveBg] = useState<boolean>(settings.watermarkRemoveBg !== false);
  const [blendMode, setBlendMode] = useState<'multiply' | 'normal'>(
    settings.watermarkBlendMode || 'multiply'
  );

  // Document checkboxes
  const [inReceipts, setInReceipts] = useState<boolean>(settings.watermarkInReceipts !== false);
  const [inReports, setInReports] = useState<boolean>(settings.watermarkInReports !== false);
  const [inConstitution, setInConstitution] = useState<boolean>(settings.watermarkInConstitution !== false);

  const [previewTab, setPreviewTab] = useState<'receipt' | 'report'>('receipt');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto clean white background from uploaded image
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(language === 'bn' ? "অনুগ্রহ করে একটি সঠিক ছবি ফাইল (PNG, JPG, JPEG, SVG, WebP) নির্বাচন করুন।" : "Please select a valid image file (PNG, JPG, JPEG, SVG, WebP).");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const rawResult = reader.result as string;
      setRawUrl(rawResult);

      // Create image to convert/clean white background if enabled
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setCustomUrl(rawResult);
            setIsUploading(false);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // If background removal is active, make near-white pixels transparent
          if (removeBg) {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // If pixel is near-white (brightness > 235)
              if (r > 235 && g > 235 && b > 235) {
                data[i + 3] = 0; // Alpha transparent
              } else if (r > 215 && g > 215 && b > 215) {
                // Feather edge
                data[i + 3] = Math.round((255 - ((r + g + b) / 3)) * 2);
              }
            }
            ctx.putImageData(imgData, 0, 0);
            setCustomUrl(canvas.toDataURL("image/png"));
          } else {
            setCustomUrl(rawResult);
          }
        } catch {
          setCustomUrl(rawResult);
        }
        setType('custom_image');
        setIsUploading(false);
      };
      img.onerror = () => {
        setCustomUrl(rawResult);
        setType('custom_image');
        setIsUploading(false);
      };
      img.src = rawResult;
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert(language === 'bn' ? "ছবি লোড করতে সমস্যা হয়েছে।" : "There was a problem loading the image.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setCustomUrl(urlInput.trim());
    setRawUrl(urlInput.trim());
    setType('custom_image');
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = () => {
    setCustomUrl(undefined);
    setRawUrl(undefined);
    setType('seal');
  };

  const handleResetDefault = () => {
    setEnabled(true);
    setType('seal');
    setCustomUrl(undefined);
    setRawUrl(undefined);
    setCustomText(settings.societyName || "TRUST GROWTH SOCIETY");
    setOpacity(0.09);
    setSize(480);
    setRotation(0);
    setRemoveBg(true);
    setBlendMode('multiply');
    setInReceipts(true);
    setInReports(true);
    setInConstitution(true);
  };

  const handleSave = () => {
    onSaveWatermark({
      watermarkEnabled: enabled,
      watermarkType: type,
      watermarkUrl: customUrl,
      watermarkRawUrl: rawUrl,
      watermarkText: customText,
      watermarkOpacity: opacity,
      watermarkSize: size,
      watermarkRotation: rotation,
      watermarkRemoveBg: removeBg,
      watermarkBlendMode: blendMode,
      watermarkInReceipts: inReceipts,
      watermarkInReports: inReports,
      watermarkInConstitution: inConstitution,
    });
    onClose();
  };

  // Mock settings for live preview
  const livePreviewSettings: AppSettings = {
    ...settings,
    watermarkEnabled: enabled,
    watermarkType: type,
    watermarkUrl: customUrl,
    watermarkRawUrl: rawUrl,
    watermarkText: customText,
    watermarkOpacity: opacity,
    watermarkSize: size,
    watermarkRotation: rotation,
    watermarkRemoveBg: removeBg,
    watermarkBlendMode: blendMode,
    watermarkInReceipts: inReceipts,
    watermarkInReports: inReports,
    watermarkInConstitution: inConstitution,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/80 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-200"
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
        id="watermark-settings-modal"
        className="relative bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 text-amber-50 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  {language === 'bn' ? "ওয়াটারমার্ক কন্ট্রোল" : "WATERMARK CONTROL"}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {language === 'bn' ? "ডকুমেন্ট জলছাপ (Watermark) সেটিংস" : "Document Watermark Settings"}
                </h3>
              </div>
              <p className="text-xs text-emerald-300 mt-0.5">
                {language === 'bn' ? "রসিদ, অডিট স্টেটমেন্ট ও গঠনতন্ত্র ডকুমেন্টের ব্যাকগ্রাউন্ড সিল ও জলছাপ কাস্টমাইজ করুন" : "Customize the background seal and watermark for receipts, audit statements, and constitution documents"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin">
          {/* LEFT COLUMN: Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. MASTER TOGGLE SWITCH */}
            <div
              onClick={() => setEnabled(!enabled)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                enabled
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                  : 'bg-stone-50 border-stone-300 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    enabled
                      ? 'bg-emerald-800 text-amber-300'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    {language === 'bn' ? "ডকুমেন্টসমূহে জলছাপ (Watermark) প্রদর্শন" : "Show Watermark on Documents"}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {enabled
                      ? (language === 'bn' ? 'জলছাপ বর্তমানে চালু রয়েছে' : 'Watermark is currently enabled')
                      : (language === 'bn' ? 'জলছাপ বন্ধ রয়েছে' : 'Watermark is disabled')}
                  </p>
                </div>
              </div>

              <div
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  enabled ? 'bg-emerald-700' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
                    enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* 2. WATERMARK TYPE SELECTOR (4 Options) */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <span>{language === 'bn' ? "১. জলছাপের ধরন নির্বাচন করুন:" : "1. Select Watermark Type:"}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Official Seal */}
                <button
                  type="button"
                  onClick={() => setType('seal')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    type === 'seal'
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-600'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner p-1">
                    <TgsLogoSvg size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{language === 'bn' ? "অফিসিয়াল সিল" : "Official Seal"}</p>
                    <p className={`text-[10px] mt-0.5 ${type === 'seal' ? 'text-amber-300' : 'text-stone-500'}`}>
                      {language === 'bn' ? "TGS গোল সিল" : "TGS Round Seal"}
                    </p>
                  </div>
                </button>

                {/* 2. Main Society Logo */}
                <button
                  type="button"
                  onClick={() => setType('logo')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    type === 'logo'
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-600'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner p-1 overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-emerald-900" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{language === 'bn' ? "মূল লোগো" : "Main Logo"}</p>
                    <p className={`text-[10px] mt-0.5 ${type === 'logo' ? 'text-amber-300' : 'text-stone-500'}`}>
                      {language === 'bn' ? "সংগঠনের লোগো" : "Organization Logo"}
                    </p>
                  </div>
                </button>

                {/* 3. Custom Image Upload */}
                <button
                  type="button"
                  onClick={() => setType('custom_image')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    type === 'custom_image'
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-600'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner p-1 overflow-hidden">
                    {customUrl ? (
                      <img src={customUrl} alt="Custom" className="w-full h-full object-contain" />
                    ) : (
                      <Upload size={18} className="text-emerald-900" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{language === 'bn' ? "কাস্টম ছবি" : "Custom Image"}</p>
                    <p className={`text-[10px] mt-0.5 ${type === 'custom_image' ? 'text-amber-300' : 'text-stone-500'}`}>
                      {language === 'bn' ? "ফাইল আপলোড" : "File Upload"}
                    </p>
                  </div>
                </button>

                {/* 4. Custom Text */}
                <button
                  type="button"
                  onClick={() => setType('custom_text')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    type === 'custom_text'
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-600'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner">
                    <Type size={18} className="text-emerald-900" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{language === 'bn' ? "টেক্সট জলছাপ" : "Text Watermark"}</p>
                    <p className={`text-[10px] mt-0.5 ${type === 'custom_text' ? 'text-amber-300' : 'text-stone-500'}`}>
                      {language === 'bn' ? "কাস্টম লেখা" : "Custom Text"}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* CONDITIONAL CONFIG BOX: Custom Image Upload */}
            {type === 'custom_image' && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-950">
                    {language === 'bn' ? "কাস্টম জলছাপ ছবি আপলোড ও প্রসেসিং" : "Upload & Process Custom Watermark Image"}
                  </h4>
                  {customUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> {language === 'bn' ? "মুছে ফেলুন" : "Remove"}
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept={STORAGE_MIME_TYPES.images}
                  className="hidden"
                />

                {customUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-300">
                    <div className="w-14 h-14 bg-stone-100 rounded-lg p-1 flex items-center justify-center border shrink-0 overflow-hidden">
                      <img src={customUrl} alt="Custom" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{language === 'bn' ? "সংযুক্ত কাস্টম ছবি" : "Attached Custom Image"}</p>
                      <p className="text-[11px] text-stone-500">{language === 'bn' ? "ব্যাকগ্রাউন্ড জলছাপ হিসেবে প্রস্তুত" : "Ready as background watermark"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      {language === 'bn' ? "পরিবর্তন" : "Change"}
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragOver ? 'border-emerald-600 bg-emerald-100/50' : 'border-emerald-300 bg-white hover:bg-emerald-50'
                    }`}
                  >
                    <Upload size={22} className="mx-auto text-emerald-800 mb-1.5" />
                    <p className="text-xs font-bold text-stone-800">
                      {language === 'bn' ? "ডিভাইস, মেমোরি কার্ড বা এক্সটার্নাল স্টোরেজ থেকে ছবি বেছে নিন" : "Choose an image from your device, memory card, or external storage"}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      {language === 'bn' ? "PNG, JPG, JPEG, SVG, WebP (SD Card, USB, Drive ও ড্রপ সাপোর্টেড)" : "PNG, JPG, JPEG, SVG, WebP (SD Card, USB, Drive, and drag-and-drop supported)"}
                    </p>
                  </div>
                )}

                {/* Transparency cleaner toggle */}
                <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeBg}
                    onChange={(e) => setRemoveBg(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  <div className="text-xs text-stone-800">
                    <span className="font-bold">{language === 'bn' ? "সাদা ব্যাকগ্রাউন্ড স্বয়ংক্রিয়ভাবে স্বচ্ছ (Transparent) করুন" : "Automatically make white background transparent"}</span>
                    <p className="text-[10px] text-stone-500">{language === 'bn' ? "ছবির চারপাশের সাদা বা হালকা অংশ বাদ দিয়ে শুধু মূল লোগো রাখবে" : "Removes the white or light areas around the image, keeping only the main logo"}</p>
                  </div>
                </label>
              </div>
            )}

            {/* CONDITIONAL CONFIG BOX: Custom Text */}
            {type === 'custom_text' && (
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-stone-800">
                  {language === 'bn' ? "জলছাপের লেখা (Watermark Text):" : "Watermark Text:"}
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={language === 'bn' ? "যেমন: TRUST GROWTH SOCIETY" : "e.g. TRUST GROWTH SOCIETY"}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-hidden font-bold"
                />
              </div>
            )}

            {/* 3. SLIDERS: Opacity, Size, Rotation */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                  {language === 'bn' ? "২" : "2"}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  {language === 'bn' ? "জলছাপের দৃশ্যমানতা ও আকার সমন্বয়" : "Adjust Watermark Visibility & Size"}
                </h4>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} className="text-emerald-700" /> {language === 'bn' ? "অস্বচ্ছতা (Opacity / জলছাপের গাঢ়ত্ব):" : "Opacity (Watermark Darkness):"}
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-emerald-950 font-black">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                  <span>{language === 'bn' ? "হালকা (2%)" : "Light (2%)"}</span>
                  <span>{language === 'bn' ? "সুপারিশকৃত (8-10%)" : "Recommended (8-10%)"}</span>
                  <span>{language === 'bn' ? "গাঢ় (30%)" : "Dark (30%)"}</span>
                </div>
              </div>

              {/* Size Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 size={14} className="text-emerald-700" /> {language === 'bn' ? "আকার (Watermark Size):" : "Size (Watermark Size):"}
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-emerald-950 font-black">
                    {size}px
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="750"
                  step="20"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                  <span>{language === 'bn' ? "ছোট (200px)" : "Small (200px)"}</span>
                  <span>{language === 'bn' ? "মাঝারি (480px)" : "Medium (480px)"}</span>
                  <span>{language === 'bn' ? "বড় পেজ সাইজ (750px)" : "Large Page Size (750px)"}</span>
                </div>
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={14} className="text-emerald-700" /> {language === 'bn' ? "ঘূর্ণন কোণ (Rotation Angle):" : "Rotation Angle:"}
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-emerald-950 font-black">
                    {rotation}°
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, -15, -30, -45].map((angle) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => setRotation(angle)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        rotation === angle
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'bg-white hover:bg-stone-200 text-stone-800 border border-stone-300'
                      }`}
                    >
                      {angle === 0 ? (language === 'bn' ? 'সরাসরি (0°)' : 'Straight (0°)') : (language === 'bn' ? `${angle}° কোণ` : `${angle}° angle`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. DOCUMENT TARGET CHECKBOXES */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                  {language === 'bn' ? "৩" : "3"}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  {language === 'bn' ? "যেসব ডকুমেন্টে জলছাপ প্রদর্শিত হবে:" : "Documents where the watermark will appear:"}
                </h4>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={inReceipts}
                    onChange={(e) => setInReceipts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <FileCheck size={16} className="text-emerald-700" />
                    <span>{language === 'bn' ? "মানি রসিদ (Money Receipts & Invoices)" : "Money Receipts & Invoices"}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={inReports}
                    onChange={(e) => setInReports(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <FileText size={16} className="text-emerald-700" />
                    <span>{language === 'bn' ? "অডিট রিপোর্ট ও স্টেটমেন্ট (Audit Reports & Ledger Sheets)" : "Audit Reports & Ledger Sheets"}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={inConstitution}
                    onChange={(e) => setInConstitution(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <Layers size={16} className="text-emerald-700" />
                    <span>{language === 'bn' ? "গঠনতন্ত্র ও বিধিমালা (Constitution Document Pages)" : "Constitution & Bylaws (Constitution Document Pages)"}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Real-Time Document Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950">
                  {language === 'bn' ? "লাইভ প্রিভিউ (Live Preview)" : "Live Preview"}
                </h4>
              </div>

              {/* Tab Selector: Receipt or Report */}
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-300 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('receipt')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    previewTab === 'receipt'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {language === 'bn' ? "রসিদ" : "Receipt"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('report')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    previewTab === 'report'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {language === 'bn' ? "রিপোর্ট" : "Report"}
                </button>
              </div>
            </div>

            {/* Document Preview Stage Container */}
            <div className="flex-1 bg-stone-100 rounded-2xl border-2 border-dashed border-stone-300 p-3 sm:p-4 flex items-center justify-center min-h-[380px] overflow-hidden">
              {/* Document Mock Sheet */}
              <div className="relative w-full max-w-sm bg-white rounded-xl shadow-md border border-stone-200 p-4 sm:p-5 overflow-hidden text-stone-800 select-none">
                {/* Embedded Live Watermark */}
                <PageWatermark
                  settings={livePreviewSettings}
                  type={type}
                  customUrl={customUrl}
                  customText={customText}
                  opacity={opacity}
                  size={size * 0.55} // Scale proportionally for modal preview card
                  rotation={rotation}
                  blendMode={blendMode}
                  documentType={previewTab}
                />

                {/* Document Mock Content on Top of Watermark */}
                <div className="relative z-10 space-y-3 text-xs">
                  {/* Mock Header */}
                  <div className="text-center border-b border-stone-200 pb-2">
                    <h5 className="font-black text-emerald-950 text-sm">
                      {settings.societyName || "TRUST GROWTH SOCIETY"}
                    </h5>
                    <p className="text-[10px] text-stone-500">
                      {previewTab === 'receipt'
                        ? (language === 'bn' ? 'টাকা প্রাপ্তি রসিদ (MONEY RECEIPT)' : 'MONEY RECEIPT')
                        : (language === 'bn' ? 'মাসিক আর্থিক বিবরণী ও অডিট স্টেটমেন্ট' : 'Monthly Financial Statement & Audit Report')}
                    </p>
                  </div>

                  {/* Mock Rows */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-stone-100">
                      <span className="text-stone-500">{language === 'bn' ? "রসিদ নং / ভাউচার:" : "Receipt No. / Voucher:"}</span>
                      <span className="font-mono font-bold text-emerald-950">#TGS-2025-089</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-stone-100">
                      <span className="text-stone-500">{language === 'bn' ? "সদস্যের নাম:" : "Member Name:"}</span>
                      <span className="font-bold text-stone-900">{language === 'bn' ? "মোঃ মোহিম খান" : "Md. Mohim Khan"}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-stone-100">
                      <span className="text-stone-500">{language === 'bn' ? "মাস ও বছর:" : "Month & Year:"}</span>
                      <span className="font-bold text-stone-800">{language === 'bn' ? "অক্টোবর ২০২৫" : "October 2025"}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-stone-100">
                      <span className="text-stone-500">{language === 'bn' ? "জমার পরিমাণ:" : "Deposit Amount:"}</span>
                      <span className="font-mono font-black text-emerald-900">{language === 'bn' ? "৳ ৫,০০০.০০" : "৳ 5,000.00"}</span>
                    </div>
                  </div>

                  {/* Mock Footer Signatures */}
                  <div className="pt-4 flex justify-between items-end text-[9px] text-stone-500 border-t border-dashed border-stone-200">
                    <div className="text-center">
                      <div className="w-16 border-b border-stone-400 mb-0.5" />
                      <span>{language === 'bn' ? "আদায়কারী" : "Collector"}</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 border-b border-stone-400 mb-0.5" />
                      <span>{language === 'bn' ? "সভাপতি / ক্যাশিয়ার" : "President / Cashier"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview helper notice */}
            <p className="text-[11px] text-stone-500 text-center">
              {language === 'bn' ? "প্রিন্ট বা ডাউনলোডের সময় নির্বাচিত সিল বা ছবিটিই ডকুমেন্টের ব্যাকগ্রাউন্ডে জলছাপ হিসেবে রেন্ডার হবে।" : "The selected seal or image will render as the background watermark on the document during print or download."}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>{language === 'bn' ? "রিসেট করুন" : "Reset"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {language === 'bn' ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              {language === 'bn' ? "সেটিংস ও জলছাপ সংরক্ষণ করুন" : "Save Settings & Watermark"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
