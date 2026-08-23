// Bridges to native Android functionality exposed by the packaged TGS app's
// WebView (see android/app/src/main/java/.../MainActivity.java ->
// AndroidBridge). A stock Android WebView does NOT implement window.print()
// (it silently no-ops) and does NOT deliver blob: <a download> clicks to
// the OS download manager (they're silently ignored too) — so both the
// Print button and every Download button on the Reports & Downloads page
// used to do nothing at all inside the installed app, even though they
// worked fine in a normal desktop/mobile browser.
//
// window.AndroidBridge only exists when running inside that WebView, so
// every function here safely falls back to the normal browser behavior
// everywhere else (dev server, Vercel/Netlify web build, etc.).

declare global {
  interface Window {
    AndroidBridge?: {
      printPage: () => void;
      saveFile: (base64Data: string, fileName: string, mimeType: string) => void;
    };
    __onNativeFileSaved?: (fileName: string, success: boolean) => void;
  }
}

export function isNativeAndroidApp(): boolean {
  return typeof window !== "undefined" && !!window.AndroidBridge;
}

/** Prints via Android's native print dialog when running in the app, else the normal browser print. */
export function nativePrint(): void {
  if (isNativeAndroidApp()) {
    window.AndroidBridge!.printPage();
  } else {
    window.print();
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Saves a Blob or data-URL as a downloaded file with the given name.
 * Inside the Android app this hands the bytes to the native bridge, which
 * writes a real file into the device's Downloads folder (MediaStore on
 * Android 10+, legacy external storage below that). In a normal browser it
 * uses the standard anchor-click download trick, unchanged.
 */
export async function nativeSaveFile(
  source: Blob | string,
  fileName: string,
  mimeType: string
): Promise<void> {
  if (isNativeAndroidApp()) {
    const base64 = typeof source === "string" ? source : await blobToBase64(source);
    window.AndroidBridge!.saveFile(base64, fileName, mimeType);
    return;
  }

  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }, 2500);
}
