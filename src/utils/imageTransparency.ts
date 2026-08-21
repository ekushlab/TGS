/**
 * Image Transparency and Background Cleaning Utilities
 * Strips white, light, or solid background colors from PNG/JPG/WebP images
 * and produces clean transparent PNG with anti-aliased alpha borders.
 */

export function cleanImageTransparency(
  imageSrc: string,
  tolerance = 32 // Tolerance range (0 - 80)
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Sample colors from 4 corners to detect solid background color
        const corners = [
          [0, 0], // Top-Left
          [w - 1, 0], // Top-Right
          [0, h - 1], // Bottom-Left
          [w - 1, h - 1], // Bottom-Right
        ];

        let avgR = 255;
        let avgG = 255;
        let avgB = 255;
        let sampleCount = 0;

        for (const [cx, cy] of corners) {
          const idx = (cy * w + cx) * 4;
          const a = d[idx + 3];
          if (a > 20) {
            avgR += d[idx];
            avgG += d[idx + 1];
            avgB += d[idx + 2];
            sampleCount++;
          }
        }

        if (sampleCount > 0) {
          avgR = Math.round(avgR / (sampleCount + 1));
          avgG = Math.round(avgG / (sampleCount + 1));
          avgB = Math.round(avgB / (sampleCount + 1));
        }

        const isLightBg = avgR > 210 && avgG > 210 && avgB > 210;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const a = d[i + 3];

          if (a === 0) continue;

          // Pure or near-white removal
          const isPureWhite = r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance;

          // Distance from corner sample background color
          const distToBg = Math.sqrt(
            Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
          );

          if (isPureWhite || (isLightBg && distToBg < tolerance * 1.8)) {
            d[i + 3] = 0; // 100% transparent!
          } else {
            // Anti-aliasing fringe removal for smooth edges (feathering)
            const brightness = (r + g + b) / 3;
            if (brightness > 255 - tolerance * 2) {
              const alphaFactor = (255 - brightness) / (tolerance * 2);
              d[i + 3] = Math.min(a, Math.max(0, Math.round(a * alphaFactor)));
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("Transparency processing fallback to raw image:", err);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}
