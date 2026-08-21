/**
 * Utilities to handle file selection from device, external storage (SD Card, USB/OTG),
 * cloud drives, and local file systems across all browsers and platforms.
 */

export const STORAGE_MIME_TYPES = {
  images: "image/*,image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg,*/*",
  documents: "application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,*/*",
  nid: "application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,*/*",
  jsonBackup: "application/json,text/plain,application/octet-stream,.json,.txt,*/*",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,.xlsx,.xls,.csv,*/*",
  all: "*/*",
};

export interface FilePickerOptions {
  accept?: string;
  multiple?: boolean;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

/**
 * Triggers standard file browser or modern File System Access API
 * ensuring access to Internal Storage, SD Card, USB Drives, and Cloud folders.
 */
export async function openFilePickerWithStorage(
  fallbackInput: HTMLInputElement | null,
  options?: {
    types?: { description: string; accept: Record<string, string[]> }[];
    onFileSelected?: (file: File) => void;
  }
): Promise<File | null> {
  // If File System Access API is supported (e.g. Chrome, Edge, Chromium Android/Desktop)
  if ('showOpenFilePicker' in window && options?.types) {
    try {
      const picker = (window as unknown as { showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker;
      const [handle] = await picker({
        types: options.types,
        excludeAcceptAllOption: false,
        multiple: false,
      });
      if (handle) {
        const file = await handle.getFile();
        if (options.onFileSelected) {
          options.onFileSelected(file);
        }
        return file;
      }
    } catch (err: unknown) {
      // If user cancelled, return null
      if ((err as Error)?.name === 'AbortError') {
        return null;
      }
      // Otherwise fallback to input click
    }
  }

  // Fallback to standard input click (which triggers device storage / file manager / SD Card picker)
  if (fallbackInput) {
    fallbackInput.click();
  }
  return null;
}
