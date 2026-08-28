import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  Building,
  Camera,
  Sparkles,
  Languages,
  PenTool,
  Sliders,
  RotateCcw,
  Layers,
  Phone,
  Calendar,
  Eye,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Globe,
  Info,
} from 'lucide-react';
import { AppSettings } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { PageWatermark, TgsLogoSvg } from './TgsLogoWatermark';
import { STORAGE_MIME_TYPES, openFilePickerWithStorage } from '../utils/fileStorage';

interface UnifiedSettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSaveSettings: (updated: Partial<AppSettings>) => void;
  initialTab?: 'profile' | 'logo' | 'watermark' | 'language' | 'signatures' | 'fines';
}

function SignatureDrawCanvas({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl?: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // dark ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange(undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      onChange(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <div className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-1 bg-white relative">
        <canvas
          ref={canvasRef}
          width={280}
          height={90}
          className="w-full h-[90px] bg-stone-50/50 rounded-lg cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!value && !isDrawing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-stone-400 text-xs font-medium">
            ✍️ {language === 'bn' ? 'এখানে মাউস বা আঙুল দিয়ে স্বাক্ষর আঁকুন' : 'Draw signature here'}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Upload size={12} />
          <span>{language === 'bn' ? 'স্বাক্ষর ছবি আপলোড (স্টোরেজ / SD Card)' : 'Upload Image (Storage)'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={STORAGE_MIME_TYPES.images}
          onChange={handleFileUpload}
          className="hidden"
        />
        {value && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>{language === 'bn' ? 'মুছে নতুন করে আঁকুন' : 'Clear'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  settings,
  onClose,
  onSaveSettings,
  initialTab = 'profile',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'logo' | 'watermark' | 'language' | 'signatures' | 'fines'>(initialTab);

  // 1. Profile & Address (Bilingual)
  const [societyName, setSocietyName] = useState(settings.societyName || 'Trust Growth Society');
  const [societyNameEn, setSocietyNameEn] = useState(settings.societyNameEn || 'Trust Growth Society');
  const [societySubtitle, setSocietySubtitle] = useState(settings.societySubtitle || 'আস্থার সাথে অগ্রগতির যাত্রা');
  const [societySubtitleEn, setSocietySubtitleEn] = useState(settings.societySubtitleEn || 'From Trust to Prosperity');
  const [societyAddress, setSocietyAddress] = useState(settings.societyAddress || 'উলানিয়া বাজার, উলানিয়া, গলাচিপা, পটুয়াখালী');
  const [societyAddressEn, setSocietyAddressEn] = useState(settings.societyAddressEn || 'Ulania Bazar, Ulania, Galachipa, Patuakhali');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '01911797438');
  const [establishedDate, setEstablishedDate] = useState(settings.establishedDate || '২৫ সেপ্টেম্বর ২০২৫');
  const [establishedDateEn, setEstablishedDateEn] = useState(settings.establishedDateEn || '25 September 2025');

  // 2. Logo
  const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.logoUrl);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 3. Watermark
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(settings.watermarkEnabled !== false);
  const [watermarkType, setWatermarkType] = useState<'seal' | 'logo' | 'custom_image' | 'custom_text'>(
    settings.watermarkType || 'seal'
  );
  const [watermarkUrl, setWatermarkUrl] = useState<string | undefined>(settings.watermarkUrl);
  const [watermarkText, setWatermarkText] = useState<string>(
    settings.watermarkText || settings.societyName || 'TRUST GROWTH SOCIETY'
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(settings.watermarkOpacity ?? 0.08);
  const [watermarkSize, setWatermarkSize] = useState<number>(settings.watermarkSize ?? 500);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(settings.watermarkRotation ?? 0);
  const [watermarkRemoveBg, setWatermarkRemoveBg] = useState<boolean>(settings.watermarkRemoveBg !== false);
  const [watermarkInReceipts, setWatermarkInReceipts] = useState<boolean>(settings.watermarkInReceipts !== false);
  const [watermarkInReports, setWatermarkInReports] = useState<boolean>(settings.watermarkInReports !== false);
  const [watermarkInConstitution, setWatermarkInConstitution] = useState<boolean>(settings.watermarkInConstitution !== false);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // 4. Signatures
  const [treasurerName, setTreasurerName] = useState(settings.treasurerName || 'কোষাধ্যক্ষ');
  const [treasurerSignature, setTreasurerSignature] = useState<string | undefined>(settings.treasurerSignature);
  const [presidentRole, setPresidentRole] = useState<'president' | 'secretary'>(settings.presidentRole || 'president');
  const [presidentName, setPresidentName] = useState(settings.presidentName || (settings.presidentRole === 'secretary' ? 'সাধারণ সম্পাদক' : 'সভাপতি'));
  const [presidentSignature, setPresidentSignature] = useState<string | undefined>(settings.presidentSignature);

  // 5. Fines & Deadline
  const [defaultFine, setDefaultFine] = useState<number>(settings.defaultFine || 50);
  const [deadlineDay, setDeadlineDay] = useState<number>(settings.deadlineDay || 10);

  // Process Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setLogoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process Watermark Image Upload with Auto Background Removal
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawData = evt.target?.result as string;
      if (watermarkRemoveBg) {
        // Auto strip white / light background
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i];
              const g = d[i + 1];
              const b = d[i + 2];
              // If near white
              if (r > 230 && g > 230 && b > 230) {
                d[i + 3] = 0; // make transparent
              }
            }
            ctx.putImageData(imgData, 0, 0);
            setWatermarkUrl(canvas.toDataURL('image/png'));
          } else {
            setWatermarkUrl(rawData);
          }
        };
        img.src = rawData;
      } else {
        setWatermarkUrl(rawData);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      societyName,
      societyNameEn,
      societySubtitle,
      societySubtitleEn,
      societyAddress,
      societyAddressEn,
      contactPhone,
      establishedDate,
      establishedDateEn,
      logoUrl,
      watermarkEnabled,
      watermarkType,
      watermarkUrl,
      watermarkText,
      watermarkOpacity,
      watermarkSize,
      watermarkRotation,
      watermarkRemoveBg,
      watermarkInReceipts,
      watermarkInReports,
      watermarkInConstitution,
      treasurerName,
      treasurerSignature,
      presidentRole,
      presidentName,
      presidentSignature,
      defaultFine,
      deadlineDay,
    });
    onClose();
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-white text-stone-900 transition-all shadow-2xs";

  const tabs = [
    { id: 'profile' as const, label: language === 'bn' ? 'প্রতিষ্ঠান ও ঠিকানা' : 'Society & Address', icon: Building },
    { id: 'logo' as const, label: language === 'bn' ? 'লোগো ও ছবি' : 'App Logo', icon: Camera },
    { id: 'watermark' as const, label: language === 'bn' ? 'জলছাপ (Watermark)' : 'Watermark', icon: Sparkles },
    { id: 'language' as const, label: language === 'bn' ? 'ভাষা নির্বাচন' : 'Language', icon: Globe },
    { id: 'signatures' as const, label: language === 'bn' ? 'স্বাক্ষর ও কর্তৃপক্ষ' : 'Signatures', icon: PenTool },
    { id: 'fines' as const, label: language === 'bn' ? 'জরিমানা ও তারিখ' : 'Fines & Rules', icon: Sliders },
  ];

  return (
    <div
      id="unified-settings-modal"
      className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-150 overscroll-contain"
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
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-emerald-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-xs">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                {language === 'bn' ? 'সফটওয়্যার সেটিংস ও কনফিগারেশন' : 'Software Settings & Configuration'}
              </h3>
              <p className="text-[11px] text-emerald-300">
                {language === 'bn' ? 'প্রতিষ্ঠানের নাম, ঠিকানা, লোগো, জলছাপ ও স্বাক্ষর পরিবর্তন' : 'Manage organization details, address, logo, watermark & signatures'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-900 text-amber-300 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/80'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-stone-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: Profile & Address (Bilingual) */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
                <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  {language === 'bn'
                    ? 'এখানে বাংলা ও ইংরেজি উভয় ভাষায় প্রতিষ্ঠানের নাম, ঠিকানা ও উপশিরোনাম প্রদান করুন। ভাষা পরিবর্তনের সাথে সাথে রসিদ ও হেডার স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট ভাষায় প্রদর্শিত হবে।'
                    : 'Provide organization name, address & subtitle in both Bengali and English. When language is toggled, headers, reports, and receipts will automatically adapt.'}
                </p>
              </div>

              {/* Bengali Section */}
              <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b border-stone-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    {language === 'bn' ? 'বাংলা তথ্য (Bangla Information)' : 'Bengali Information'}
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'bn' ? 'প্রতিষ্ঠানের নাম (বাংলা)' : 'Society Name (Bengali)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                    placeholder={language === 'bn' ? "যেমন: ট্রাস্ট গ্রোথ সোসাইটি" : "e.g. Trust Growth Society"}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'bn' ? 'সংক্ষিপ্ত ঠিকানা / উপশিরোনাম (বাংলা)' : 'Short Address / Subtitle (Bengali)'}
                  </label>
                  <input
                    value={societySubtitle}
                    onChange={(e) => setSocietySubtitle(e.target.value)}
                    placeholder={language === 'bn' ? "যেমন: আস্থার সাথে অগ্রগতির যাত্রা" : "e.g. From Trust to Prosperity"}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'bn' ? 'পূর্ণাঙ্গ ঠিকানা (অ্যাড্রেস বার - বাংলা)' : 'Full Address (Address Bar - Bengali)'}
                  </label>
                  <input
                    value={societyAddress}
                    onChange={(e) => setSocietyAddress(e.target.value)}
                    placeholder={language === 'bn' ? "যেমন: উলানিয়া বাজার, উলানিয়া, গলাচিপা, পটুয়াখালী" : "e.g. Ulania Bazar, Ulania, Galachipa, Patuakhali"}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {language === 'bn' ? 'প্রতিষ্ঠার তারিখ (বাংলা)' : 'Established Date (Bengali)'}
                  </label>
                  <input
                    value={establishedDate}
                    onChange={(e) => setEstablishedDate(e.target.value)}
                    placeholder={language === 'bn' ? "যেমন: ২৫ সেপ্টেম্বর ২০২৫" : "e.g. 25 September 2025"}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* English Section */}
              <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b border-stone-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    {language === 'bn' ? 'ইংরেজি তথ্য (English Information)' : 'English Information'}
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Society Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={societyNameEn}
                    onChange={(e) => setSocietyNameEn(e.target.value)}
                    placeholder="e.g. Trust Growth Society"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Short Address / Subtitle (English)
                  </label>
                  <input
                    value={societySubtitleEn}
                    onChange={(e) => setSocietySubtitleEn(e.target.value)}
                    placeholder="e.g. From Trust to Prosperity"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Full Address (Address Bar - English)
                  </label>
                  <input
                    value={societyAddressEn}
                    onChange={(e) => setSocietyAddressEn(e.target.value)}
                    placeholder="e.g. Ulania Bazar, Ulania, Galachipa, Patuakhali"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Established Date (English)
                  </label>
                  <input
                    value={establishedDateEn}
                    onChange={(e) => setEstablishedDateEn(e.target.value)}
                    placeholder="e.g. 25 September 2025"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'bn' ? 'রসিদ ও ডকুমেন্টে প্রদর্শিত মোবাইল নম্বর (Contact Phone)' : 'Mobile Number Shown on Receipts & Documents (Contact Phone)'}
                </label>
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="01911797438"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Logo & Profile Image */}
          {activeTab === 'logo' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-amber-400 bg-emerald-950 text-amber-300 flex items-center justify-center shadow-lg">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 flex flex-col items-center">
                        <Building size={36} />
                        <span className="text-[10px] font-bold mt-1">TGS Vector</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera size={24} />
                    <span className="text-[10px] font-bold mt-1">{language === 'bn' ? 'ছবি পরিবর্তন' : 'Change Photo'}</span>
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                    {language === 'bn'
                      ? (logoUrl ? 'কাস্টম গোল লোগো সক্রিয়' : 'ডিফল্ট ভেক্টর সিল সক্রিয়')
                      : (logoUrl ? 'Custom Round Logo Active' : 'Default Vector Seal Active')}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'bn' ? 'হেডার, মানি রসিদ, সাইডবার ও ডাউনলোড শিটে এই গোল লোগোটি ব্যবহৃত হবে।' : 'This round logo will be used in the header, money receipts, sidebar, and download sheets.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>{language === 'bn' ? 'নতুন লোগো / ছবি আপলোড' : 'Upload New Logo / Image'}</span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept={STORAGE_MIME_TYPES.images}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(undefined)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>{language === 'bn' ? 'রিমুভ / ডিফল্ট সিল' : 'Remove / Default Seal'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Watermark Configuration */}
          {activeTab === 'watermark' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Enable / Disable Watermark */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      {language === 'bn' ? 'ডকুমেন্ট ব্যাকগ্রাউন্ড জলছাপ (Watermark)' : 'Document Watermark'}
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {language === 'bn' ? 'মানি রসিদ, মাসিক শিট ও গঠনতন্ত্রে হালকা প্রাতিষ্ঠানিক জলছাপ' : 'A subtle institutional watermark on money receipts, monthly sheets, and the constitution'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
                    watermarkEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      watermarkEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {watermarkEnabled && (
                <div className="space-y-4">
                  {/* Watermark Type */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-2">
                      {language === 'bn' ? 'জলছাপের ধরন নির্বাচন করুন:' : 'Select Watermark Type:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          id: 'seal' as const,
                          label: language === 'bn' ? 'অফিসিয়াল সিল' : 'Official Seal',
                          desc: language === 'bn' ? 'বৃত্তাকার সিল' : 'Circular seal',
                        },
                        {
                          id: 'logo' as const,
                          label: language === 'bn' ? 'প্রধান লোগো' : 'Main Logo',
                          desc: language === 'bn' ? 'আপলোডকৃত লোগো' : 'Uploaded logo',
                        },
                        {
                          id: 'custom_image' as const,
                          label: language === 'bn' ? 'কাস্টম ছবি' : 'Custom Image',
                          desc: language === 'bn' ? 'আলাদা ব্যাকগ্রাউন্ড' : 'Separate background',
                        },
                        {
                          id: 'custom_text' as const,
                          label: language === 'bn' ? 'কাস্টম টেক্সট' : 'Custom Text',
                          desc: language === 'bn' ? 'সোসাইটির নাম' : "Society's name",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setWatermarkType(t.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            watermarkType === t.id
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20 font-bold'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <p className="text-xs">{t.label}</p>
                          <p className="text-[10px] text-stone-500 font-normal">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Watermark Image Upload (if custom_image) */}
                  {watermarkType === 'custom_image' && (
                    <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800">{language === 'bn' ? 'কাস্টম জলছাপ ছবি আপলোড' : 'Upload Custom Watermark Image'}</span>
                        <label className="flex items-center gap-1.5 text-xs text-emerald-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={watermarkRemoveBg}
                            onChange={(e) => setWatermarkRemoveBg(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>{language === 'bn' ? 'সাদা ব্যাকগ্রাউন্ড অটো রিমুভ' : 'Auto-remove white background'}</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => watermarkInputRef.current?.click()}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload size={14} />
                          <span>{language === 'bn' ? 'ছবি সিলেক্ট করুন' : 'Select Image'}</span>
                        </button>
                        <input
                          ref={watermarkInputRef}
                          type="file"
                          accept={STORAGE_MIME_TYPES.images}
                          onChange={handleWatermarkUpload}
                          className="hidden"
                        />
                        {watermarkUrl && (
                          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 size={14} /> {language === 'bn' ? 'ছবি প্রস্তুত' : 'Image ready'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Watermark Custom Text */}
                  {watermarkType === 'custom_text' && (
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'bn' ? 'জলছাপ টেক্সট (Watermark Text)' : 'Watermark Text'}
                      </label>
                      <input
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="TRUST GROWTH SOCIETY"
                        className={inputCls}
                      />
                    </div>
                  )}

                  {/* Sliders: Opacity & Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-stone-800">{language === 'bn' ? 'গাঢ়ত্ব / অপাসিটি (Opacity)' : 'Opacity'}</span>
                        <span className="text-xs font-mono font-bold text-emerald-900">
                          {Math.round(watermarkOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.02"
                        max="0.25"
                        step="0.01"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-emerald-800 cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-500">{language === 'bn' ? 'প্রস্তাবিত: ৫% থেকে ১০% (লেখা স্পষ্ট রাখতে)' : 'Recommended: 5% to 10% (to keep text legible)'}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-stone-800">{language === 'bn' ? 'আকার / সাইজ (Size)' : 'Size'}</span>
                        <span className="text-xs font-mono font-bold text-emerald-900">{watermarkSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="250"
                        max="700"
                        step="20"
                        value={watermarkSize}
                        onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                        className="w-full accent-emerald-800 cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-500">{language === 'bn' ? 'প্রস্তাবিত: ৪৫০px থেকে ৫৫০px' : 'Recommended: 450px to 550px'}</span>
                    </div>
                  </div>

                  {/* Display Target Checkboxes */}
                  <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-stone-800 block">{language === 'bn' ? 'জলছাপ প্রদর্শনের স্থানসমূহ:' : 'Watermark Display Locations:'}</span>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-stone-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watermarkInReceipts}
                          onChange={(e) => setWatermarkInReceipts(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>{language === 'bn' ? 'টাকা প্রাপ্তি রসিদে' : 'Money receipts'}</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watermarkInReports}
                          onChange={(e) => setWatermarkInReports(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>{language === 'bn' ? 'মাসিক অডিট শিট ও রিপোর্টে' : 'Monthly audit sheets & reports'}</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watermarkInConstitution}
                          onChange={(e) => setWatermarkInConstitution(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>{language === 'bn' ? 'গঠনতন্ত্র নীতিমালায়' : 'Constitution document'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Language Selection */}
          {activeTab === 'language' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">{language === 'bn' ? 'অ্যাপ্লিকেশনের ভাষা পরিবর্তন (Select Language)' : 'Change Application Language'}</h4>
                <p className="text-xs text-stone-600">
                  {language === 'bn' ? 'সফটওয়্যারের সকল মেনু, ট্যাব, রসিদ, টেবিল ও হিসাব বিবরণী প্রদর্শনের ভাষা নির্বাচন করুন।' : 'Choose the language used to display all menus, tabs, receipts, tables, and financial statements in the software.'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('bn')}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                      language === 'bn'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-base">বাংলা (Bangla)</p>
                      <p className="text-xs text-stone-500">{language === 'bn' ? 'ডিফল্ট ভাষা' : 'Default Language'}</p>
                    </div>
                    {language === 'bn' && <CheckCircle2 size={22} className="text-emerald-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                      language === 'en'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-base">English</p>
                      <p className="text-xs text-stone-500">English Mode</p>
                    </div>
                    {language === 'en' && <CheckCircle2 size={22} className="text-emerald-700" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Signatures & Authority */}
          {activeTab === 'signatures' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                {language === 'bn' ? 'রসিদ ও প্রিন্ট কপিতে স্বয়ংক্রিয়ভাবে সিল ও স্বাক্ষর যুক্ত করার জন্য নিচে কোষাধ্যক্ষ ও সভাপতির নাম ও স্বাক্ষর সংরক্ষণ করুন।' : "Save the treasurer's and president's names and signatures below to automatically add a seal and signature to receipts and printed copies."}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Treasurer */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-800">
                      {language === 'bn' ? 'কোষাধ্যক্ষ (Treasurer)' : 'Treasurer'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      {language === 'bn' ? 'স্বাক্ষর ১' : 'Signature 1'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'bn' ? 'কোষাধ্যক্ষের নাম' : "Treasurer's Name"}</label>
                    <input
                      value={treasurerName}
                      onChange={(e) => setTreasurerName(e.target.value)}
                      placeholder={language === 'bn' ? 'কোষাধ্যক্ষের নাম' : "Treasurer's Name"}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'bn' ? 'স্বাক্ষর' : 'Signature'}</label>
                    <SignatureDrawCanvas
                      value={treasurerSignature}
                      onChange={(sig) => setTreasurerSignature(sig)}
                    />
                  </div>
                </div>

                {/* President / Secretary */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-800">
                      {language === 'bn' ? 'দ্বিতীয় স্বাক্ষরকারী' : 'Second Signatory'}
                    </span>
                    <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPresidentRole('president')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          presidentRole === 'president' ? 'bg-emerald-800 text-white' : 'text-stone-700'
                        }`}
                      >
                        {language === 'bn' ? 'সভাপতি' : 'President'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresidentRole('secretary')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          presidentRole === 'secretary' ? 'bg-emerald-800 text-white' : 'text-stone-700'
                        }`}
                      >
                        {language === 'bn' ? 'সেক্রেটারি' : 'Secretary'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'bn' ? (presidentRole === 'secretary' ? 'সাধারণ সম্পাদকের নাম' : 'সভাপতির নাম') : (presidentRole === 'secretary' ? "Secretary's Name" : "President's Name")}
                    </label>
                    <input
                      value={presidentName}
                      onChange={(e) => setPresidentName(e.target.value)}
                      placeholder={language === 'bn' ? (presidentRole === 'secretary' ? 'সেক্রেটারির নাম' : 'সভাপতির নাম') : (presidentRole === 'secretary' ? "Secretary's Name" : "President's Name")}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'bn' ? 'স্বাক্ষর' : 'Signature'}</label>
                    <SignatureDrawCanvas
                      value={presidentSignature}
                      onChange={(sig) => setPresidentSignature(sig)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Fines & Deadline */}
          {activeTab === 'fines' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {language === 'bn' ? 'মাসিক ডিফল্ট বিলম্ব ফি / জরিমানা (৳)' : 'Monthly Default Late Fee / Fine (৳)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={defaultFine}
                      onChange={(e) => setDefaultFine(Number(e.target.value))}
                      className={`${inputCls} max-w-[150px] font-mono font-bold text-amber-900 text-base`}
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 30, 50, 100, 150].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDefaultFine(amt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            defaultFine === amt
                              ? 'bg-amber-500 text-emerald-950 border-amber-600 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          ৳{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {language === 'bn' ? 'মাসের জমার শেষ সময়সীমা (Deadline Day of Month)' : 'Deadline Day of Month'}
                  </label>
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={deadlineDay}
                      onChange={(e) => setDeadlineDay(Number(e.target.value))}
                      className={`${inputCls} font-mono font-bold text-emerald-900 text-base`}
                    />
                    <span className="text-xs font-bold text-stone-600 whitespace-nowrap">{language === 'bn' ? 'তারিখের মধ্যে' : 'by this date'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {language === 'bn' ? 'মাসের এই তারিখ পার হলে স্বয়ংক্রিয়ভাবে সফটওয়্যার বিলম্ব ফি হিসাব করবে।' : 'After this date each month, the software will automatically calculate the late fee.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {t.btn_cancel || 'বাতিল'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Check size={16} />
              <span>{t.btn_save || 'সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
