import React from "react";
import { AppSettings } from "../types";

export interface WatermarkLogoProps {
  className?: string;
  opacity?: number;
  size?: number | string;
  showText?: boolean;
  settings?: AppSettings;
  customUrl?: string;
  customText?: string;
  rotation?: number;
  blendMode?: 'multiply' | 'normal';
  type?: 'seal' | 'logo' | 'custom_image' | 'custom_text';
  documentType?: 'receipt' | 'report' | 'constitution' | 'general';
}

/**
 * Official Trust Growth Society (TGS) Circular Seal & Logo SVG component
 * Faithfully reconstructed from the official emblem:
 * - Circular Outer Dark Forest Green Ring (#0c4a34)
 * - Inner Concentric Parallel Ring (#0c4a34)
 * - Arced Bold Top Text: "TRUST GROWTH SOCIETY"
 * - Five-Pointed Star Accents on Left and Right
 * - Arced Bottom Text: "Galachipa, Patuakhali"
 * - Two-Tone Handshake (Dark Emerald Green left #0c4a34 -> Golden Amber right #c28807)
 * - Two Vibrant Green Leaves Sprouting from the handshake
 * - Bottom Text: "ESTD. 2025"
 * - Crisp Clean Rendering for watermarks
 */
export const TgsLogoSvg: React.FC<{
  className?: string;
  size?: number | string;
  glow?: boolean;
  transparentBg?: boolean;
}> = ({
  className = "",
  size = 48,
  glow = false,
  transparentBg = true,
}) => {
  return (
    <svg
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Handshake Green-to-Gold Gradient */}
        <linearGradient id="tgsHandshakeGrad" x1="20%" y1="20%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#0c4a34" />
          <stop offset="35%" stopColor="#1b6348" />
          <stop offset="60%" stopColor="#688426" />
          <stop offset="85%" stopColor="#ba8b09" />
          <stop offset="100%" stopColor="#d49a0a" />
        </linearGradient>

        {/* Leaves Gradient */}
        <linearGradient id="tgsLeafGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#063826" />
          <stop offset="50%" stopColor="#0e5e40" />
          <stop offset="100%" stopColor="#1f7a55" />
        </linearGradient>

        {/* Text Arc for "TRUST GROWTH SOCIETY" (Top Semi-circle) */}
        <path
          id="tgsTopArcPath"
          d="M 64,250 A 186,186 0 1,1 436,250"
          fill="none"
        />

        {/* Text Arc for "Galachipa, Patuakhali" (Bottom Semi-circle) */}
        <path
          id="tgsBottomArcPath"
          d="M 436,250 A 186,186 0 0,1 64,250"
          fill="none"
        />
      </defs>

      {/* Subtle outer glow if requested */}
      {glow && (
        <circle cx="250" cy="250" r="242" fill="#0c4a34" opacity="0.12" />
      )}

      {/* Background White Canvas (optional) */}
      {!transparentBg && (
        <circle cx="250" cy="250" r="240" fill="#ffffff" />
      )}

      {/* Outer Thick Forest Green Ring */}
      <circle
        cx="250"
        cy="250"
        r="230"
        fill="none"
        stroke="#0c4a34"
        strokeWidth="11"
      />

      {/* Inner Concentric Double Rings */}
      <circle
        cx="250"
        cy="250"
        r="142"
        fill="none"
        stroke="#0c4a34"
        strokeWidth="7"
      />
      <circle
        cx="250"
        cy="250"
        r="133"
        fill="none"
        stroke="#0c4a34"
        strokeWidth="3.5"
      />

      {/* TOP CIRCULAR TEXT: "TRUST GROWTH SOCIETY" */}
      <text
        fill="#0c4a34"
        fontSize="34.5"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="4"
      >
        <textPath
          href="#tgsTopArcPath"
          startOffset="50%"
          textAnchor="middle"
        >
          TRUST GROWTH SOCIETY
        </textPath>
      </text>

      {/* LEFT 5-POINTED STAR */}
      <polygon
        points="96,242 101,257 117,257 104,266 109,281 96,271 83,281 88,266 75,257 91,257"
        fill="#0c4a34"
        transform="rotate(-15, 96, 260)"
      />

      {/* RIGHT 5-POINTED STAR */}
      <polygon
        points="404,242 409,257 425,257 412,266 417,281 404,271 391,281 396,266 383,257 399,257"
        fill="#0c4a34"
        transform="rotate(15, 404, 260)"
      />

      {/* BOTTOM CIRCULAR TEXT: "Galachipa, Patuakhali" */}
      <text
        fill="#0c4a34"
        fontSize="32"
        fontWeight="bold"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="3"
      >
        <textPath
          href="#tgsBottomArcPath"
          startOffset="50%"
          textAnchor="middle"
        >
          Galachipa, Patuakhali
        </textPath>
      </text>

      {/* CENTER PIECE: Sprouting Growth Plant & Two-Tone Handshake & ESTD. 2025 */}
      <g id="center-emblem">
        {/* SPROUTING LEAVES / GROWTH PLANT (Top of handshake) */}
        <g id="sprout-plant" transform="translate(250, 202)">
          {/* Central Stem */}
          <path
            d="M 0,-4 L 0,22"
            stroke="#0c4a34"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Left Leaf */}
          <path
            d="M 0,10 C -22,-5 -48,-18 -52,6 C -55,30 -22,25 0,10 Z"
            fill="url(#tgsLeafGradient)"
          />

          {/* Right Leaf */}
          <path
            d="M 0,10 C 22,-5 48,-18 52,6 C 55,30 22,25 0,10 Z"
            fill="url(#tgsLeafGradient)"
          />
        </g>

        {/* TWO-TONE HANDSHAKE */}
        <g id="handshake" transform="translate(250, 268)">
          {/* Left Sleeve / Cuff (Forest Green) */}
          <path
            d="M -102,-36 L -58,-54 L -32,-16 L -76,2 Z"
            fill="#0c4a34"
          />

          {/* Right Sleeve / Cuff (Golden Yellow) */}
          <path
            d="M 102,-36 L 58,-54 L 32,-16 L 76,2 Z"
            fill="#c28807"
          />

          {/* Left Main Hand Body (Green) */}
          <path
            d="M -56,-52 L -18,-30 C -2,-18 10,2 6,18 L -36,36 L -74,0 Z"
            fill="#0e563d"
          />

          {/* Right Main Hand Clasp (Golden Amber) */}
          <path
            d="M 56,-52 L 18,-30 C 2,-18 -10,2 -6,18 L 36,36 L 74,0 Z"
            fill="#d49a0a"
          />

          {/* Intertwined Fingers */}
          <path
            d="M -38,18 C -38,30 -26,38 -16,36 C -8,34 -6,24 -10,14 Z"
            fill="#156e4e"
          />
          <path
            d="M -22,22 C -22,34 -10,42 0,40 C 8,38 10,28 6,18 Z"
            fill="#3e7c3a"
          />
          <path
            d="M -4,26 C -4,38 8,46 18,44 C 26,42 28,32 24,22 Z"
            fill="#8d8916"
          />
          <path
            d="M 14,30 C 14,42 26,50 36,48 C 44,46 46,36 42,26 Z"
            fill="#c28807"
          />

          {/* Handshake White Inner Contour */}
          <path
            d="M -32,-14 C -18,-6 2,0 8,-12 C 14,-24 32,-30 46,-38"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* ESTD. 2025 Typography */}
        <text
          x="250"
          y="346"
          fill="#0c4a34"
          fontSize="20"
          fontWeight="900"
          fontFamily="Arial, Helvetica, sans-serif"
          letterSpacing="3"
          textAnchor="middle"
        >
          ESTD. 2025
        </text>
      </g>
    </svg>
  );
};

/**
 * Full Page Background Watermark component
 * Renders the chosen watermark (Official Seal, Organization Logo, Custom Image, or Text)
 */
export const PageWatermark: React.FC<WatermarkLogoProps> = ({
  className = "",
  opacity,
  size,
  showText = false,
  settings,
  customUrl,
  customText,
  rotation,
  blendMode,
  type,
  documentType = "general",
}) => {
  // Check if watermark is globally or selectively disabled
  if (settings) {
    if (settings.watermarkEnabled === false) return null;
    if (documentType === "receipt" && settings.watermarkInReceipts === false) return null;
    if (documentType === "report" && settings.watermarkInReports === false) return null;
    if (documentType === "constitution" && settings.watermarkInConstitution === false) return null;
  }

  const effectiveType = type || settings?.watermarkType || "seal";
  const effectiveOpacity = opacity !== undefined ? opacity : (settings?.watermarkOpacity ?? 0.09);
  const effectiveSize = size !== undefined ? size : (settings?.watermarkSize ?? 480);
  const effectiveRotation = rotation !== undefined ? rotation : (settings?.watermarkRotation ?? 0);
  const effectiveBlendMode = blendMode || settings?.watermarkBlendMode || "multiply";
  const effectiveText = customText || settings?.watermarkText || settings?.societyName || "TRUST GROWTH SOCIETY";

  const customImageSrc = customUrl || settings?.watermarkUrl;
  const logoImageSrc = settings?.logoUrl;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="transition-all duration-300 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: effectiveOpacity,
          transform: effectiveRotation ? `rotate(${effectiveRotation}deg)` : undefined,
          mixBlendMode: effectiveBlendMode === 'multiply' ? 'multiply' : 'normal',
        }}
      >
        {/* Render according to watermark type */}
        {effectiveType === "seal" ? (
          /* Official Circular Seal SVG */
          <div className="flex items-center justify-center pointer-events-none">
            <TgsLogoSvg
              size={effectiveSize}
              transparentBg={settings?.watermarkRemoveBg !== false}
            />
          </div>
        ) : effectiveType === "logo" && logoImageSrc ? (
          /* Main Organization Logo */
          <div
            className="flex items-center justify-center pointer-events-none"
            style={{ width: effectiveSize, height: effectiveSize }}
          >
            <img
              src={logoImageSrc}
              alt="Society Logo Watermark"
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={{
                maxWidth: `${effectiveSize}px`,
                maxHeight: `${effectiveSize}px`,
              }}
            />
          </div>
        ) : effectiveType === "custom_image" && customImageSrc ? (
          /* Custom Uploaded Image */
          <div
            className="flex items-center justify-center pointer-events-none"
            style={{ width: effectiveSize, height: effectiveSize }}
          >
            <img
              src={customImageSrc}
              alt="Custom Watermark"
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={{
                maxWidth: `${effectiveSize}px`,
                maxHeight: `${effectiveSize}px`,
              }}
            />
          </div>
        ) : effectiveType === "custom_text" ? (
          /* Custom Text Watermark */
          <div className="text-center px-6 py-4 max-w-2xl border-4 border-emerald-950/40 rounded-3xl p-8 pointer-events-none">
            <h1
              className="font-black text-emerald-950 tracking-widest uppercase font-serif whitespace-pre-wrap leading-tight"
              style={{ fontSize: typeof effectiveSize === 'number' ? Math.max(26, effectiveSize / 10) : '40px' }}
            >
              {effectiveText}
            </h1>
            <p className="mt-2 text-xs font-bold text-emerald-900 tracking-wider">
              {settings?.societySubtitle || "OFFICIAL DOCUMENT"}
            </p>
          </div>
        ) : (
          /* Default to Official Seal if no custom image is present */
          <div className="flex items-center justify-center pointer-events-none">
            <TgsLogoSvg size={effectiveSize} transparentBg />
          </div>
        )}

        {showText && effectiveType !== "seal" && effectiveType !== "custom_text" && (
          <div className="mt-3 text-center text-emerald-950 font-black tracking-widest uppercase text-xs">
            {settings?.societyName || "Trust Growth Society"}
          </div>
        )}
      </div>
    </div>
  );
};
