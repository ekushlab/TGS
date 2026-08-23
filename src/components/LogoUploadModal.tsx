import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Check,
  X,
  Landmark,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Move,
  Sliders,
  Sparkles,
  Eye,
  Grid,
  FileImage,
  FlipHorizontal,
  Layers,
  HardDrive,
} from 'lucide-react';
import { AppSettings } from '../types';
import { STORAGE_MIME_TYPES, openFilePickerWithStorage } from '../utils/fileStorage';
import { useLanguage } from '../utils/LanguageContext';

interface LogoUploadModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSaveLogo: (logoUrl: string | undefined) => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  settings,
  onClose,
  onSaveLogo,
}) => {
  const { language } = useLanguage();

  // Source image loaded (before crop)
  const [sourceImage, setSourceImage] = useState<string | null>(settings.logoUrl || null);
  const [rawImageElement, setRawImageElement] = useState<HTMLImageElement | null>(null);

  // Adjustment parameters
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // in degrees
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flipH, setFlipH] = useState<boolean>(false);
  const [bgStyle, setBgStyle] = useState<'transparent' | 'white' | 'dark'>('transparent');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Dragging state for panning
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Output preview data URL
  const [croppedPreview, setCroppedPreview] = useState<string | undefined>(settings.logoUrl);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorBoxRef = useRef<HTMLDivElement>(null);

  // Load raw image element whenever source image changes
  useEffect(() => {
    if (!sourceImage) {
      setRawImageElement(null);
      setCroppedPreview(undefined);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setRawImageElement(img);
      // Reset transform when new image is loaded
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setFlipH(false);
    };
    img.onerror = () => {
      setErrorMsg(language === 'bn' ? 'ছবি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।' : 'There was a problem loading the image. Please select a different image.');
    };
    img.src = sourceImage;
  }, [sourceImage]);

  // Generate cropped output canvas whenever adjustments change
  const renderCroppedImage = useCallback(() => {
    if (!rawImageElement) return;

    const canvas = previewCanvasRef.current || document.createElement('canvas');
    const size = 512; // High-definition 512x512 circular logo
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Optional background fill behind circular logo
    if (bgStyle === 'white') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (bgStyle === 'dark') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#064e3b';
      ctx.fill();
    }

    // Save state for circular clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Move to center of canvas
    ctx.translate(size / 2 + pan.x * (size / 260), size / 2 + pan.y * (size / 260));

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flip
    if (flipH) {
      ctx.scale(-1, 1);
    }

    // Calculate aspect ratio fit
    const imgAspect = rawImageElement.naturalWidth / rawImageElement.naturalHeight;
    let drawWidth = size * zoom;
    let drawHeight = size * zoom;

    if (imgAspect > 1) {
      // Wider than tall
      drawWidth = size * imgAspect * zoom;
      drawHeight = size * zoom;
    } else {
      // Taller than wide
      drawWidth = size * zoom;
      drawHeight = (size / imgAspect) * zoom;
    }

    // Draw centered
    ctx.drawImage(
      rawImageElement,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setCroppedPreview(dataUrl);
    } catch (e) {
      console.error('Canvas export error:', e);
    }
  }, [rawImageElement, zoom, rotation, pan, flipH, bgStyle]);

  useEffect(() => {
    renderCroppedImage();
  }, [renderCroppedImage]);

  // Handle file input selection or drop
  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|svg|bmp)$/i)) {
      setErrorMsg(language === 'bn' ? 'অনুগ্রহ করে সঠিক ইমেজ ফাইল (PNG, JPG, JPEG, WEBP, SVG) নির্বাচন করুন।' : 'Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg(language === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ১৫ মেগাবাইট (15MB) এর মধ্যে হতে হবে।' : 'The image size must not exceed 15 megabytes (15MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSourceImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleTriggerPicker = () => {
    openFilePickerWithStorage(fileInputRef.current, {
      types: [
        {
          description: 'Image Files (Internal, SD Card, USB, Drive)',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
          },
        },
      ],
      onFileSelected: handleFileProcess,
    });
  };

  // Mouse & Touch Pan Handling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rawImageElement) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + deltaX,
      y: panStartRef.current.y + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Mouse wheel zoom over editor
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!rawImageElement) return;
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(0.4, prev + delta), 4.0));
  };

  // Reset all adjustments
  const handleResetAdjustments = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setFlipH(false);
  };

  // Fit image to circle
  const handleAutoFit = () => {
    if (!rawImageElement) return;
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setZoom(1.05);
  };

  // Rotate helper
  const handleRotateBy = (deg: number) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  // Final save
  const handleSave = () => {
    onSaveLogo(croppedPreview);
    onClose();
  };

  // Remove logo completely
  const handleRemove = () => {
    setSourceImage(null);
    setRawImageElement(null);
    setCroppedPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
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
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 text-amber-50 px-5 py-4 flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-xs">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">{language === 'bn' ? 'প্রতিষ্ঠানের গোল লোগো ও ছবি এডজাস্টমেন্ট' : 'Organization Circular Logo & Image Adjustment'}</h3>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  {language === 'bn' ? 'ক্রপ ও স্কেলিং' : 'Crop & Scale'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-300">
                {language === 'bn' ? 'ছবি টেনে বা জুম করে গোল ফ্রেমের ঠিক মাঝে বসান' : 'Drag or zoom the image to center it exactly within the circular frame'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Visual Cropper Box */}
          {sourceImage && rawImageElement ? (
            <div className="space-y-4">
              {/* Interactive Stage & Live Previews */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Left (2 cols): Interactive Drag & Drop / Pan Canvas Stage */}
                <div className="md:col-span-2 flex flex-col items-center">
                  <div
                    ref={editorBoxRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                    className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl bg-stone-900 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none border-2 border-stone-700 shadow-inner touch-none group"
                  >
                    {/* Background Preview Image transformed with CSS */}
                    <div
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom}) ${flipH ? 'scaleX(-1)' : ''}`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                      }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <img
                        src={sourceImage}
                        alt="Logo workspace"
                        className="max-w-none max-h-none object-contain pointer-events-none"
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    </div>

                    {/* Darkened Mask outside the circle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 288 288">
                        <defs>
                          <mask id="circle-cutout">
                            <rect width="288" height="288" fill="white" />
                            <circle cx="144" cy="144" r="120" fill="black" />
                          </mask>
                        </defs>
                        {/* Shaded area outside circle */}
                        <rect
                          width="288"
                          height="288"
                          fill="rgba(0, 0, 0, 0.65)"
                          mask="url(#circle-cutout)"
                        />
                        {/* Circular Border Guide */}
                        <circle
                          cx="144"
                          cy="144"
                          r="120"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="3"
                          strokeDasharray={showGrid ? "none" : "none"}
                        />
                        {/* Inner Grid / Rule of Thirds */}
                        {showGrid && (
                          <g stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="3 3">
                            <line x1="64" y1="24" x2="64" y2="264" />
                            <line x1="224" y1="24" x2="224" y2="264" />
                            <line x1="24" y1="64" x2="264" y2="64" />
                            <line x1="24" y1="224" x2="264" y2="224" />
                            <circle cx="144" cy="144" r="3" fill="#fbbf24" />
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Quick Hint Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/80 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg pointer-events-none">
                      <span className="flex items-center gap-1 font-medium">
                        <Move size={11} className="text-amber-300" /> {language === 'bn' ? 'ড্র্যাগ করে পজিশন ঠিক করুন' : 'Drag to adjust position'}
                      </span>
                      <span className="font-mono text-amber-300">
                        {Math.round(zoom * 100)}% · {rotation}°
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 mt-2 font-medium">
                    {language === 'bn' ? '🖱️ মাউস বা আঙুল দিয়ে ছবি সরিয়ে গোল বৃত্তের মাঝে ঠিকমতো বসান।' : '🖱️ Move the image with your mouse or finger to position it correctly within the circle.'}
                  </p>
                </div>

                {/* Right (1 col): Live Output & Preview Badges */}
                <div className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold text-stone-800 flex items-center justify-center gap-1">
                      <Eye size={13} className="text-emerald-700" /> {language === 'bn' ? 'অ্যাপে যেমন দেখাবে' : 'How it will appear in the app'}
                    </span>
                    <p className="text-[10px] text-stone-500 mt-0.5">{language === 'bn' ? 'রিয়েল-টাইম লাইভ প্রিভিউ' : 'Real-time live preview'}</p>
                  </div>

                  {/* Header Style Preview Badge */}
                  <div className="flex items-center gap-3 bg-emerald-950 p-2.5 rounded-xl border border-emerald-900 w-full shadow-xs">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 bg-white shrink-0 flex items-center justify-center">
                      {croppedPreview ? (
                        <img src={croppedPreview} alt="Header Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Landmark size={20} className="text-emerald-900" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-bold truncate">{settings.societyName}</p>
                      <p className="text-[10px] text-emerald-300 truncate">{language === 'bn' ? 'হেডার ও মেনুবার ভিউ' : 'Header & menu bar view'}</p>
                    </div>
                  </div>

                  {/* Receipt Style Preview Badge */}
                  <div className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-stone-200 w-full shadow-2xs">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-emerald-900/40 bg-white shrink-0 flex items-center justify-center">
                      {croppedPreview ? (
                        <img src={croppedPreview} alt="Receipt Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Landmark size={16} className="text-stone-700" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-stone-800 text-[11px] font-bold truncate">{language === 'bn' ? 'রসিদ ও রিপোর্ট ভিউ' : 'Receipt & report view'}</p>
                      <p className="text-[9px] text-stone-500 truncate">{language === 'bn' ? 'মানি রিসিট ও ডকুমেন্টস' : 'Money receipts & documents'}</p>
                    </div>
                  </div>

                  {/* Grid Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                      showGrid
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <Grid size={13} />
                    <span>{showGrid ? (language === 'bn' ? 'গ্রিড গাইডলাইন বন্ধ' : 'Turn off grid guide') : (language === 'bn' ? 'গ্রিড গাইডলাইন চালু' : 'Turn on grid guide')}</span>
                  </button>
                </div>
              </div>

              {/* Adjustment Controls Panel (Zoom, Rotate, Flip, Background) */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4">
                {/* 1. Zoom Slider & Quick Steppers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn size={14} className="text-emerald-800" /> {language === 'bn' ? 'জুম / সাইজ এডজাস্ট (Zoom):' : 'Zoom / Size Adjust:'}
                    </span>
                    <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                      className="p-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-stone-700 transition-colors cursor-pointer"
                      title={language === 'bn' ? 'জুম কমান' : 'Zoom out'}
                    >
                      <ZoomOut size={15} />
                    </button>

                    <input
                      type="range"
                      min="0.4"
                      max="3.5"
                      step="0.02"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-800 h-2 bg-stone-200 rounded-lg cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.1).toFixed(2))))}
                      className="p-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-stone-700 transition-colors cursor-pointer"
                      title={language === 'bn' ? "জুম বাড়ান" : "Zoom in"}
                    >
                      <ZoomIn size={15} />
                    </button>
                  </div>
                </div>

                {/* 2. Rotation Slider & Quick 90deg buttons */}
                <div className="space-y-1.5 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <RotateCw size={14} className="text-emerald-800" /> {language === 'bn' ? "ঘূর্ণন / সোজা করা (Rotate):" : "Rotate / Straighten:"}
                    </span>
                    <span className="font-mono text-stone-700 font-bold bg-stone-200 px-2 py-0.5 rounded">
                      {rotation}°
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRotateBy(-90)}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} /> {language === 'bn' ? "-৯০°" : "-90°"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRotateBy(90)}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCw size={13} /> {language === 'bn' ? "+৯০°" : "+90°"}
                    </button>

                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation > 180 ? rotation - 360 : rotation}
                      onChange={(e) => setRotation((parseInt(e.target.value, 10) + 360) % 360)}
                      className="flex-1 min-w-[120px] accent-emerald-800 h-2 bg-stone-200 rounded-lg cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                        flipH
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                      title={language === 'bn' ? "ছবি ডানে-বামে উল্টান" : "Flip image horizontally"}
                    >
                      <FlipHorizontal size={13} /> {language === 'bn' ? "উল্টান" : "Flip"}
                    </button>
                  </div>
                </div>

                {/* 3. Background fill options and Quick Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-600">{language === 'bn' ? "ব্যাকগ্রাউন্ড:" : "Background:"}</span>
                    <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setBgStyle('transparent')}
                        className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          bgStyle === 'transparent'
                            ? 'bg-white text-emerald-950 shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {language === 'bn' ? "স্বচ্ছ (PNG)" : "Transparent (PNG)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgStyle('white')}
                        className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          bgStyle === 'white'
                            ? 'bg-white text-emerald-950 shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {language === 'bn' ? "সাদা ব্যাকগ্রাউন্ড" : "White background"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgStyle('dark')}
                        className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          bgStyle === 'dark'
                            ? 'bg-emerald-900 text-amber-300 shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {language === 'bn' ? "গাঢ় সবুজ" : "Dark green"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFit}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Maximize2 size={13} className="text-emerald-700" /> {language === 'bn' ? "অটো ফিট" : "Auto fit"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAdjustments}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={13} className="text-amber-700" /> {language === 'bn' ? "রিসেট" : "Reset"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Blank state when no image is loaded */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) handleFileProcess(droppedFile);
              }}
              className="text-center py-8 px-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Landmark size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-stone-800 text-base">{language === 'bn' ? "সংগঠনের লোগো বা ছবি আপলোড করুন" : "Upload Organization Logo or Image"}</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {language === 'bn' ? "ছবি আপলোড করার পর আপনি জুম, ঘূর্ণন ও টেনে গোল ফ্রেমের ঠিক মাঝে বসাতে পারবেন।" : "After uploading an image, you can zoom, rotate, and drag it to center it exactly within the circular frame."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTriggerPicker}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer border border-amber-500/50 w-full sm:w-auto"
                >
                  <Upload size={16} />
                  <span>{language === 'bn' ? "ডিভাইস / স্টোরেজ থেকে ছবি নির্বাচন" : "Select image from device / storage"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs rounded-xl border border-stone-300 shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
                  title={language === 'bn' ? "মেমোরি কার্ড (SD Card), OTG/পেনড্রাইভ বা ফাইল ম্যানেজার থেকে বেছে নিন" : "Choose from memory card (SD Card), OTG/pen drive, or file manager"}
                >
                  <HardDrive size={14} className="text-emerald-800" />
                  <span>{language === 'bn' ? "এক্সটার্নাল স্টোরেজ / ফাইল ব্রাউজ" : "External storage / Browse files"}</span>
                </button>
              </div>

              <p className="text-[11px] text-stone-400 pt-1">
                {language === 'bn' ? "(ইন্টারনাল স্টোরেজ, SD Card, OTG পেনড্রাইভ, Google Drive বা ফাইল ড্রপ সাপোর্ট করে)" : "(Supports internal storage, SD Card, OTG pen drive, Google Drive, or file drop)"}
              </p>
            </div>
          )}

          {/* Hidden Canvas used for high-definition render */}
          <canvas ref={previewCanvasRef} className="hidden" />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={STORAGE_MIME_TYPES.images}
            onChange={handleFileChange}
            className="hidden"
          />

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Image source action bar (Replace file / Remove logo) */}
          {sourceImage && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200 flex-wrap">
              <button
                type="button"
                onClick={handleTriggerPicker}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-stone-300 cursor-pointer"
              >
                <Upload size={14} className="text-emerald-800" />
                <span>{language === 'bn' ? "অন্য ছবি নির্বাচন / এক্সটার্নাল স্টোরেজ" : "Select another image / External storage"}</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{language === 'bn' ? "লোগো মুছে ফেলুন" : "Remove logo"}</span>
              </button>
            </div>
          )}

          {/* Guidance Notice */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Sparkles size={13} className="text-emerald-700" /> {language === 'bn' ? "পরামর্শ:" : "Suggestions:"}
            </p>
            <p>
              {language === 'bn' ? "• ছবিকে টেনে ঠিক মাঝখানে রাখুন এবং জুম স্লাইডার দিয়ে সাইজ এমনভাবে রাখুন যেন লোগোর কোনো লেখা বা সীমানা কেটে না যায়।" : "• Drag the image to the exact center and use the zoom slider to size it so no part of the logo text or border gets cut off."}
            </p>
            <p>
              {language === 'bn' ? "• \"সংরক্ষণ করুন\" বাটনে ক্লিক করলেই অ্যাডজাস্ট করা ক্রপড গোল ছবিটি হেডার, রসিদ এবং অফিসিয়াল প্রতিবেদনে সেট হয়ে যাবে।" : "• Clicking the \"Save\" button will set the adjusted, cropped circular image on the header, receipts, and official reports."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {language === 'bn' ? "বাতিল" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-900"
          >
            <Check size={16} className="text-amber-300" />
            <span>{language === 'bn' ? "লোগো সংরক্ষণ করুন" : "Save logo"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
