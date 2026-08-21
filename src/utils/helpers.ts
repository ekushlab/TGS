import * as XLSX from 'xlsx';
import { Member, Deposit, AccountEntry, FundIncome, Expense, AppSettings, AppData } from '../types';

export const STORAGE_KEY = "tgs-ledger-data-v2";

export const DEFAULT_SETTINGS: AppSettings = {
  defaultFine: 50,
  deadlineDay: 10,
  societyName: "Trust Growth Society",
  societyNameEn: "Trust Growth Society",
  societySubtitle: "উলানিয়া বাজার, উলানিয়া, গলাচিপা",
  societySubtitleEn: "Ulania Bazar, Galachipa, Patuakhali",
  societyAddress: "উলানিয়া বাজার, উলানিয়া, গলাচিপা, পটুয়াখালী",
  societyAddressEn: "Ulania Bazar, Ulania, Galachipa, Patuakhali",
  establishedDate: "২৫ সেপ্টেম্বর ২০২৫",
  establishedDateEn: "25 September 2025",
  contactPhone: "01911797438",
  treasurerName: "কোষাধ্যক্ষ",
  presidentRole: "president",
  presidentName: "সভাপতি",
  watermarkType: "seal",
  watermarkOpacity: 0.06,
  watermarkSize: 520,
  watermarkRotation: 0,
  watermarkEnabled: true,
  watermarkInReceipts: true,
  watermarkInReports: true,
  watermarkInConstitution: true,
  aboutUs: `ট্রাস্ট গ্রোথ সোসাইটি (TGS) একটি আদর্শ ও সুশৃঙ্খল সঞ্চয়ী সমবায় সংগঠন। ২৫ সেপ্টেম্বর ২০২৫ তারিখে উলানিয়া বাজার, গলাচিপা, পটুয়াখালীতে এর যাত্রা শুরু হয়। 

আমাদের মূল লক্ষ্য ও উদ্দেশ্য:
১. সদস্যদের নিয়মিত মাসিক সঞ্চয় বৃদ্ধি ও আর্থিক নিরাপত্তা নিশ্চিত করা।
২. লাভজনক ও নিরাপদ খাতে বিনিয়োগের মাধ্যমে সঞ্চিত মূলধনের সমৃদ্ধি ঘটানো।
৩. সদস্যদের পারস্পরিক ভ্রাতৃত্ব, ঐক্য ও সামাজিক কল্যাণ বজায় রাখা।
৪. স্বচ্ছ ও ডিজিটাল পদ্ধতিতে সকল লেনদেন পরিচালনা করা।

পরিচালনা পরিষদ ও অ্যাডমিন প্যানেল সর্বদা সদস্যদের সর্বোচ্চ সেবা ও আস্থা রক্ষায় অঙ্গীকারবদ্ধ।`,
  constitution: `বিসমিল্লাহির রাহমানির রাহিম

ট্রাস্ট গ্রোথ সোসাইটি (TGS) - এর গঠনতন্ত্র ও কার্যপ্রণালী বিধিমালা
প্রতিষ্ঠা তারিখ: ২৫ সেপ্টেম্বর ২০২৫ ইং
কার্যালয়: উলানিয়া বাজার, উলানিয়া, গলাচিপা, পটুয়াখালী।

ধারা ১: সংগঠনের নাম ও পরিচিতি
১.১ এই সংগঠনের পূর্ণ নাম "ট্রাস্ট গ্রোথ সোসাইটি" (সংক্ষেপে TGS)।
১.২ এটি একটি অরাজনৈতিক, সামাজিক, সঞ্চয়ী ও ক্ষুদ্র বিনিয়োগ সমবায় উদ্যোগ।

ধারা ২: লক্ষ্য ও উদ্দেশ্য
২.১ সদস্যদের মাঝে নিয়মিত সঞ্চয়ের অভ্যাস গড়ে তোলা ও আর্থিক স্বচ্ছলতা অর্জন।
২.২ সম্মিলিত সঞ্চিত মূলধন শরীয়াহ সম্মত ও লাভজনক নিরাপদ ব্যবসায়িক খাতে বিনিয়োগ করা।
২.৩ সদস্যদের পারস্পরিক সহযোগিতা, সৌহার্দ্য ও জরুরি প্রয়োজনে পাশে দাঁড়ানো।

ধারা ৩: সদস্যপদ প্রাপ্তি ও যোগ্যতা
৩.১ যেকোনো সৎ, কর্মঠ ও দায়িত্বশীল প্রাপ্তবয়স্ক ব্যক্তি নির্ধারিত ফরম পূরণ ও পরিচালনা কমিটির অনুমোদনক্রমে সদস্য হতে পারবেন।
৩.২ প্রত্যেক সদস্যকে সংগঠনের নিয়ম-কানুন ও সিদ্ধান্তের প্রতি শ্রদ্ধাশীল হতে হবে।

ধারা ৪: মাসিক সঞ্চয় ও জরিমানা বিধিমালা
৪.১ প্রতি মাসের ১০ তারিখের মধ্যে প্রত্যেক সদস্যকে নিয়মিত মাসিক সঞ্চয় জমা প্রদান করতে হবে।
৪.২ নির্ধারিত ১০ তারিখের মধ্যে জমা না দিলে প্রতি মাসের জন্য নির্ধারিত হারে বিলম্ব ফি/জরিমানা প্রযোজ্য হবে।
৪.৩ টানা ৩ মাস কোনো যুক্তিসঙ্গত কারণ ছাড়া সঞ্চয় বন্ধ রাখলে পরিচালনা পর্ষদ প্রয়োজনীয় ব্যবস্থা গ্রহণ করবে।

ধারা ৫: বিনিয়োগ ও মুনাফা বণ্টন
৫.১ সদস্যদের জমাকৃত অর্থ ঝুঁকিহীন লাভজনক ব্যবসায় বিনিয়োগ করা হবে।
৫.২ অর্জিত মোট মুনাফার ৯৫% বিনিয়োগকৃত মূলধনের বিপরীতে সঞ্চিত থাকবে এবং ৫% অংশ সংগঠনের কল্যাণ ও জরুরি তহবিলে জমা হবে।

ধারা ৬: পরিচালনা পরিষদ ও ক্ষমতা
৬.১ সংগঠন পরিচালনার জন্য সভাপতি, সাধারণ সম্পাদক, কোষাধ্যক্ষ ও নির্বাহী সদস্য সমন্বয়ে পরিচালনা কমিটি দায়িত্ব পালন করবেন।
৬.২ আর্থিক লেনদেনের স্বচ্ছতার স্বার্থে সকল আয়-ব্যয়ের ডিজিটাল হিসাব ও ভাউচার সংরক্ষণ বাধ্যতামূলক।

ধারা ৭: সংশোধন ও সংযোজন
৭.১ সাধারণ সভায় সদস্যদের দুই-তৃতীয়াংশের মতামতের ভিত্তিতে গঠনতন্ত্রের যেকোনো ধারা সংশোধন বা পরিমার্জন করা যাবে।`,
  constitutionUpdatedAt: "২৫ সেপ্টেম্বর ২০২৫",
  isLiveVotingEnabled: false,
};

export const MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

export const METHODS = ["হাতে নগদ", "বিকাশ", "নগদ (মোবাইল)", "রকেট", "ব্যাংক ডিপোজিট"];

export const BN_DIGITS: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
};

export function toBnDigits(n: number | string): string {
  return String(n)
    .split("")
    .map((c) => BN_DIGITS[c] ?? c)
    .join("");
}

export function getRecentMonths(count = 12, from = new Date()): string[] {
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    list.push(`${MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear())}`);
  }
  return list;
}

export function getCurrentRunningMonth(now = new Date()): string {
  return `${MONTHS[now.getMonth()]} ${toBnDigits(now.getFullYear())}`;
}

/**
 * Returns deposit timeline months starting from October 2025 (সোসাইটির ১ম কিস্তি জমা মাস)
 * to future months (60 months ahead).
 */
export function getDepositTimelineMonths(startYear = 2025, startMonthIndex = 9, totalMonths = 60): string[] {
  const list: string[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const totalM = startMonthIndex + i;
    const y = startYear + Math.floor(totalM / 12);
    const m = totalM % 12;
    list.push(`${MONTHS[m]} ${toBnDigits(y)}`);
  }
  return list;
}

export function currency(n: number | string | undefined): string {
  const num = Number(n || 0);
  return "৳" + num.toLocaleString("en-BD");
}

/**
 * Converts a number into Bengali words (টাকার অঙ্ক কথায় রূপান্তর)
 */
export function numberToBnWords(amount: number): string {
  const n = Math.floor(Math.abs(Number(amount) || 0));
  if (n === 0) return "শূন্য টাকা মাত্র";

  const ones = [
    "", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
    "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোল", "সতেরো", "আঠারো", "উনিশ",
    "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ",
    "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
    "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
    "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
    "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
    "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
    "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "অষ্টআশি", "ঊননব্বই",
    "নব্বই", "একানব্বই", "বানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"
  ];

  function convertTwoDigits(val: number): string {
    return ones[val] || "";
  }

  let words = "";
  let rem = n;

  // Crore (কোটি) = 1,00,00,000
  if (rem >= 10000000) {
    const crore = Math.floor(rem / 10000000);
    words += `${numberToBnWords(crore).replace(" টাকা মাত্র", "")} কোটি `;
    rem %= 10000000;
  }

  // Lakh (লাখ) = 1,00,000
  if (rem >= 100000) {
    const lakh = Math.floor(rem / 100000);
    words += `${convertTwoDigits(lakh)} লাখ `;
    rem %= 100000;
  }

  // Thousand (হাজার) = 1,000
  if (rem >= 1000) {
    const thousand = Math.floor(rem / 1000);
    words += `${convertTwoDigits(thousand)} হাজার `;
    rem %= 1000;
  }

  // Hundred (শত) = 100
  if (rem >= 100) {
    const hundred = Math.floor(rem / 100);
    words += `${ones[hundred]} শত `;
    rem %= 100;
  }

  // Remaining (1-99)
  if (rem > 0) {
    words += `${convertTwoDigits(rem)} `;
  }

  return words.trim() + " টাকা মাত্র";
}

/**
 * Month names mapping for Bengali and English
 */
const BENGALI_MONTHS: Record<string, number> = {
  "জানুয়ারি": 0, "জানুয়ারি": 0, "january": 0, "jan": 0,
  "ফেব্রুয়ারি": 1, "ফেব্রুয়ারি": 1, "february": 1, "feb": 1,
  "মার্চ": 2, "march": 2, "mar": 2,
  "এপ্রিল": 3, "april": 3, "apr": 3,
  "মে": 4, "may": 4,
  "জুন": 5, "june": 5, "jun": 5,
  "জুলাই": 6, "july": 6, "jul": 6,
  "আগস্ট": 7, "আগষ্ট": 7, "august": 7, "aug": 7,
  "সেপ্টেম্বর": 8, "september": 8, "sep": 8, "sept": 8,
  "অক্টোবর": 9, "october": 9, "oct": 9,
  "নভেম্বর": 10, "november": 10, "nov": 10,
  "ডিসেম্বর": 11, "december": 11, "dec": 11,
};

/**
 * Converts Bengali digits to English digits
 */
export function bnToEnDigits(str: string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let res = str;
  bnDigits.forEach((d, i) => {
    res = res.replaceAll(d, String(i));
  });
  return res;
}

/**
 * Parses date string (dd/mm/yyyy, yyyy-mm-dd, or Date parseable) to Date object
 */
export function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleaned = bnToEnDigits(dateStr.trim());
  const parts = cleaned.split(/[\/\-\.]/);
  
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      // yyyy-mm-dd
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    } else {
      // dd/mm/yyyy
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
  }

  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Parses target month string (e.g. "জুলাই ২০২৬", "July 2026", "2026-07") into year and month index (0-11)
 */
export function parseTargetMonth(monthStr?: string): { year: number; month: number } {
  const current = new Date();
  if (!monthStr) {
    return { year: current.getFullYear(), month: current.getMonth() };
  }

  const cleaned = bnToEnDigits(monthStr.toLowerCase().trim());
  
  // Extract 4 digit year if present
  const yearMatch = cleaned.match(/\b(20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : current.getFullYear();

  // Find month keyword
  for (const [key, mIdx] of Object.entries(BENGALI_MONTHS)) {
    if (cleaned.includes(key.toLowerCase())) {
      return { year, month: mIdx };
    }
  }

  // Check format like 2026-07 or 07/2026
  const numMatches = cleaned.match(/(\d+)/g);
  if (numMatches && numMatches.length >= 2) {
    const m = parseInt(numMatches[0] === String(year) ? numMatches[1] : numMatches[0], 10);
    if (m >= 1 && m <= 12) {
      return { year, month: m - 1 };
    }
  }

  return { year, month: current.getMonth() };
}

/**
 * Normalizes a month string to a standard year-month key: "জানুয়ারি ২০২৬" -> "2026-00"
 */
export function getMonthIndexKey(monthStr: string): string {
  const { year, month } = parseTargetMonth(monthStr);
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Formats a year and month index to standard Bengali string "জুলাই ২০২৬"
 */
export function formatBengaliMonthYear(year: number, month: number): string {
  const m = ((month % 12) + 12) % 12;
  return `${MONTHS[m]} ${toBnDigits(year)}`;
}

/**
 * Returns an array of consecutive month strings starting from startMonthStr for count months.
 */
export function getConsecutiveMonths(startMonthStr: string, count = 1): string[] {
  const { year: baseYear, month: baseMonth } = parseTargetMonth(startMonthStr);
  const result: string[] = [];
  const validCount = Math.max(1, count);
  for (let i = 0; i < validCount; i++) {
    const mIdx = (baseMonth + i) % 12;
    const y = baseYear + Math.floor((baseMonth + i) / 12);
    result.push(formatBengaliMonthYear(y, mIdx));
  }
  return result;
}

/**
 * Returns a Set of normalized month keys already paid by a member based on deposits.
 */
export function getMemberPaidMonthKeys(memberUid: string, deposits: Deposit[]): Set<string> {
  const paidSet = new Set<string>();
  if (!memberUid || !deposits) return paidSet;
  const memberDeposits = deposits.filter((d) => d.memberUid === memberUid);
  for (const dep of memberDeposits) {
    const count = Math.max(1, dep.monthsCount || 1);
    const months = getConsecutiveMonths(dep.month, count);
    for (const m of months) {
      paidSet.add(getMonthIndexKey(m));
    }
  }
  return paidSet;
}

/**
 * Checks if a specific month is already paid by a member.
 */
export function isMemberMonthPaid(memberUid: string, monthStr: string, deposits: Deposit[]): boolean {
  const paidSet = getMemberPaidMonthKeys(memberUid, deposits);
  return paidSet.has(getMonthIndexKey(monthStr));
}

/**
 * File validation interface
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sizeKb: number;
}

/**
 * Validates NID Document file:
 * - Allowed types: PDF or Images (JPG, JPEG, PNG, WEBP)
 * - Allowed size: 100 KB to 1 MB (1024 KB)
 */
export function validateNidDocumentFile(file: File): FileValidationResult {
  const minSize = 100 * 1024; // 100 KB
  const maxSize = 1024 * 1024; // 1 MB (1024 KB)
  const sizeKb = Math.round(file.size / 1024);

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

  if (!isPdf && !isImage) {
    return {
      valid: false,
      error: 'শুধুমাত্র PDF অথবা JPG/PNG ছবি আপলোড করা যাবে।',
      sizeKb,
    };
  }

  if (file.size < minSize) {
    return {
      valid: false,
      error: `ফাইলের আকার খুব ছোট (${sizeKb} KB)। এনআইডি ফাইলের আকার সর্বনিম্ন ১০০ KB এবং সর্বোচ্চ ১ MB হতে হবে।`,
      sizeKb,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `ফাইলের আকার খুব বড় (${(file.size / (1024 * 1024)).toFixed(2)} MB)। এনআইডি ফাইলের আকার সর্বোচ্চ ১ MB (১০২৪ KB) হতে হবে।`,
      sizeKb,
    };
  }

  return { valid: true, sizeKb };
}

/**
 * Validates Photo file:
 * - Allowed types: Images (JPG, JPEG, PNG, WEBP)
 * - Allowed size: 30 KB to 300 KB
 */
export function validatePhotoFileSize(file: File, minKb = 30, maxKb = 300): FileValidationResult {
  const minSize = minKb * 1024;
  const maxSize = maxKb * 1024;
  const sizeKb = Math.round(file.size / 1024);

  if (!file.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
    return {
      valid: false,
      error: 'শুধুমাত্র ছবি (JPG, JPEG, PNG, WEBP) আপলোড করা যাবে।',
      sizeKb,
    };
  }

  if (file.size < minSize) {
    return {
      valid: false,
      error: `ছবির আকার খুব ছোট (${sizeKb} KB)। ছবির আকার সর্বনিম্ন ${minKb} KB এবং সর্বোচ্চ ${maxKb} KB হতে হবে।`,
      sizeKb,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `ছবির আকার খুব বড় (${sizeKb} KB)। ছবির আকার সর্বোচ্চ ${maxKb} KB হতে হবে।`,
      sizeKb,
    };
  }

  return { valid: true, sizeKb };
}

export interface DetailedFineResult {
  fine: number;
  totalCycles: number;
  perMonthBreakdown: { monthName: string; cycles: number; fineAmount: number }[];
  notice: string;
}

/**
 * Calculates smart automatic fine based on target month and actual deposit date.
 * Rule example: If July 2026 deposit is given after August 10th (e.g. August 11+),
 * 2 deadline cutoffs have elapsed (July 10 and August 10) -> 2 * 50 = ৳100 fine!
 */
export function calculateDetailedAutoFine(
  dateStr: string,
  targetMonthStr?: string,
  deadlineDay = 10,
  defaultFinePerMonth = 50,
  monthsCount = 1
): DetailedFineResult {
  const depositDate = parseDateString(dateStr);
  const { year: baseYear, month: baseMonth } = parseTargetMonth(targetMonthStr);
  const count = Math.max(1, Number(monthsCount) || 1);
  const finePerMonth = Number(defaultFinePerMonth) || 50;
  const limitDay = Number(deadlineDay) || 10;

  const breakdown: { monthName: string; cycles: number; fineAmount: number }[] = [];
  let totalCycles = 0;

  for (let i = 0; i < count; i++) {
    // Current target month in batch
    const mIdx = (baseMonth + i) % 12;
    const y = baseYear + Math.floor((baseMonth + i) / 12);
    
    // Deadline for this target month: limitDay of (y, mIdx) at 23:59:59
    const deadlineDate = new Date(y, mIdx, limitDay, 23, 59, 59, 999);
    
    let cycles = 0;
    if (depositDate.getTime() > deadlineDate.getTime()) {
      // Calculate how many deadline cutoffs (limitDay of month) have passed
      // Month difference:
      const yearDiff = depositDate.getFullYear() - y;
      const monthDiff = depositDate.getMonth() - mIdx + yearDiff * 12;
      
      if (monthDiff === 0) {
        // Same month, but after limitDay -> 1 cutoff passed
        cycles = 1;
      } else if (monthDiff > 0) {
        // e.g. target is July (6), deposit is August (7) => monthDiff = 1
        // If deposit day > limitDay (e.g. Aug 11+), it passed July 10 AND August 10 => 2 cutoffs!
        // If deposit day <= limitDay (e.g. Aug 8), it passed July 10, but not yet passed August 10 => 1 cutoff!
        if (depositDate.getDate() > limitDay) {
          cycles = monthDiff + 1;
        } else {
          cycles = monthDiff;
        }
      } else {
        // Deposit date is earlier than target month (advance payment) -> 0 fine
        cycles = 0;
      }
    }

    const monthNameBn = Object.keys(BENGALI_MONTHS).find((k) => BENGALI_MONTHS[k] === mIdx) || `মাস ${mIdx + 1}`;
    breakdown.push({
      monthName: `${monthNameBn} ${y}`,
      cycles,
      fineAmount: cycles * finePerMonth,
    });
    totalCycles += cycles;
  }

  const totalFine = totalCycles * finePerMonth;
  let notice = "";

  if (totalFine > 0) {
    if (count === 1) {
      notice = `⚠️ ${breakdown[0].monthName} এর জমার শেষ তারিখ ছিল ${limitDay}ই তারিখ। নির্ধারিত সময়ের পরে জমার কারণে ${totalCycles} গুণ জরিমানা (${totalCycles} × ৳${finePerMonth} = ৳${totalFine}) স্বয়ংক্রিয়ভাবে ধার্য করা হয়েছে।`;
    } else {
      notice = `⚠️ ${count} মাসের বকেয়া সঞ্চয় জমা: মোট ${totalCycles} টি কিস্তির বিলম্ব জরিমানা (${totalCycles} × ৳${finePerMonth} = ৳${totalFine}) স্বয়ংক্রিয়ভাবে প্রযোজ্য হয়েছে।`;
    }
  } else {
    notice = `✅ সময়সীমার (${limitDay} তারিখের) মধ্যে জমা — কোনো জরিমানা প্রযোজ্য নয়।`;
  }

  return {
    fine: totalFine,
    totalCycles,
    perMonthBreakdown: breakdown,
    notice,
  };
}

/**
 * Calculates automatic fine (simple number return for backward compatibility)
 */
export function calculateAutoFine(
  dateStr: string,
  targetMonthStr?: string,
  deadlineDay = 10,
  defaultFinePerMonth = 50,
  monthsCount = 1
): number {
  return calculateDetailedAutoFine(dateStr, targetMonthStr, deadlineDay, defaultFinePerMonth, monthsCount).fine;
}

/**
 * Image processing helper:
 * Resizes and crops image to Passport Size (4:5) or 300x300 (1:1)
 * Returns a lightweight Base64 JPEG data URL
 */
export async function processMemberPhoto(
  file: File,
  format: 'passport' | '300x300' = 'passport'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const targetWidth = 300;
        const targetHeight = format === 'passport' ? 375 : 300; // 4:5 ratio for passport, 1:1 for 300x300

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        // Center crop calculation
        const imgAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        if (imgAspect > targetAspect) {
          // Source is wider than target
          srcW = img.height * targetAspect;
          srcX = (img.width - srcW) / 2;
        } else {
          // Source is taller than target
          srcH = img.width / targetAspect;
          srcY = (img.height - srcH) / 2;
        }

        // Draw cropped and scaled image onto canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

        // Convert to quality JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Clean phone number for WhatsApp URL (e.g. 01911797438 -> 8801911797438)
 */
export function cleanWhatsAppNumber(phone?: string): string {
  if (!phone) return "";
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  if (digitsOnly.startsWith("880")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return "88" + digitsOnly;
  if (digitsOnly.length === 10) return "880" + digitsOnly;
  return digitsOnly;
}

/**
 * Generates Bengali Money Receipt Text for WhatsApp & Sharing
 */
export function generateWhatsAppReceiptText(
  deposit: Deposit,
  member?: Member,
  settings: AppSettings = DEFAULT_SETTINGS
): string {
  const memberName = member?.name || deposit.memberUid;
  const fineAmount = Number(deposit.fine || 0);
  const depositAmount = Number(deposit.amount || 0);
  const totalAmount = depositAmount + fineAmount;
  const mCount = deposit.monthsCount || (settings.defaultFine && fineAmount > 0 ? Math.round(fineAmount / settings.defaultFine) : 1);

  let text = `*━━━━━━━━━━━━━━━━━━━━━*\n`;
  text += `🏛️ *${settings.societyName.toUpperCase()}*\n`;
  text += `📍 ${settings.societySubtitle}\n`;
  text += `*টাকা প্রাপ্তি রসিদ (MONEY RECEIPT)*\n`;
  text += `*━━━━━━━━━━━━━━━━━━━━━*\n\n`;
  text += `🧾 *রসিদ নং:* ${deposit.id}\n`;
  text += `👤 *সদস্যের নাম:* ${memberName}\n`;
  text += `🆔 *মেম্বার আইডি:* ${deposit.memberUid}\n`;
  text += `📅 *জমার মাস:* ${deposit.month}${deposit.monthsCount && deposit.monthsCount > 1 ? ` (${deposit.monthsCount} মাস)` : ''}\n`;
  text += `🗓️ *জমার তারিখ:* ${deposit.date}\n`;
  text += `💵 *মাসিক সঞ্চয়:* ${currency(depositAmount)}\n`;
  if (fineAmount > 0) {
    const fineFormula = mCount > 1 ? ` (${mCount} মাস × ৳${settings.defaultFine})` : ` (১ মাস × ৳${settings.defaultFine})`;
    text += `⚠️ *বিলম্ব জরিমানা${fineFormula}:* ${currency(fineAmount)}\n`;
  }
  text += `💳 *সর্বমোট গৃহীত:* ${currency(totalAmount)}\n`;
  text += `🏷️ *জমার মাধ্যম:* ${deposit.method}\n`;
  if (deposit.note) {
    text += `📝 *মন্তব্য/Trx:* ${deposit.note}\n`;
  }
  text += `\n*━━━━━━━━━━━━━━━━━━━━━*\n`;
  text += `✅ আপনার মাসিক সঞ্চয় সফলভাবে জমা হয়েছে। ধন্যবাদ!\n`;
  if (settings.contactPhone) {
    text += `📞 যোগাযোগ: ${settings.contactPhone}`;
  }

  return text;
}

export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = cleanWhatsAppNumber(phone);
  const encoded = encodeURIComponent(message);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function withRunningBalance(entries: AccountEntry[]): AccountEntry[] {
  const sorted = [...entries].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  let running = 0;
  const withBal = sorted.map((e) => {
    running += e.type === "in" ? Number(e.amount || 0) : -Number(e.amount || 0);
    return { ...e, balance: running };
  });
  return withBal.reverse();
}

/**
 * Calculates metrics for the complete financial architecture and two primary funds:
 * 1. Deposit Fund (ডিপোজিট ফান্ড / সদস্যদের মোট মাসিক সঞ্চয়)
 * 2. TGS Fund (টিজিএস ফান্ড / বিনিয়োগের ৫% লভ্যাংশ + আলাদা আয় - খরচ)
 * 3. Complete Financial Reconciliation (ক্যাশ, ব্যাংক, ইনভেস্ট ও মুনাফা সমন্বয়)
 */
export function calculateTwoFundsSummary(
  depositsOrObj: Deposit[] | { deposits: Deposit[]; investEntries: AccountEntry[]; fundIncome: FundIncome[]; expenses: Expense[]; bankEntries?: AccountEntry[] },
  investEntriesParam: AccountEntry[] = [],
  fundIncomeParam: FundIncome[] = [],
  expensesParam: Expense[] = [],
  bankEntriesParam: AccountEntry[] = []
) {
  let deposits: Deposit[];
  let investEntries: AccountEntry[];
  let fundIncome: FundIncome[];
  let expenses: Expense[];
  let bankEntries: AccountEntry[];

  if (Array.isArray(depositsOrObj)) {
    deposits = depositsOrObj;
    investEntries = investEntriesParam;
    fundIncome = fundIncomeParam;
    expenses = expensesParam;
    bankEntries = bankEntriesParam;
  } else {
    deposits = depositsOrObj.deposits || [];
    investEntries = depositsOrObj.investEntries || [];
    fundIncome = depositsOrObj.fundIncome || [];
    expenses = depositsOrObj.expenses || [];
    bankEntries = depositsOrObj.bankEntries || [];
  }

  // 1. Deposit Fund (সদস্যদের মূল মাসিক সঞ্চয় জমা ও জরিমানা)
  const depositFundTotal = deposits.reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalFineCollected = deposits.reduce((s, d) => s + Number(d.fine || 0), 0);

  // 2. Investment Profits and 5% TGS allocation
  const totalInvestDividends = investEntries.reduce((s, e) => s + Number(e.dividend || 0), 0);
  const tgsFromInvestProfit = Math.round(totalInvestDividends * 0.05); // 5% auto allocation to TGS Fund
  const generalInvestProfit = totalInvestDividends - tgsFromInvestProfit; // 95% general profit

  // 3. Bank Profits / Dividends
  const totalBankDividends = bankEntries.reduce((s, e) => s + Number(e.dividend || 0), 0);
  const totalProfit = totalInvestDividends + totalBankDividends;

  // 4. TGS Fund direct incomes (আলাদা এন্ট্রি)
  const tgsDirectIncomes = fundIncome.reduce((s, f) => s + Number(f.amount || 0), 0);

  // 5. Total TGS Fund Inflow (৫% বিনিয়োগ লভ্যাংশ + সরাসরি আলাদা আয়)
  const tgsFundTotalInflow = tgsFromInvestProfit + tgsDirectIncomes;

  // 6. Total TGS Expenses (টিজিএস ফান্ড থেকে মোট খরচ)
  const tgsExpensesTotal = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);

  // 7. Current Net TGS Fund Balance (টিজিএস ফান্ডে বর্তমান অবশিষ্ট)
  const tgsFundBalance = tgsFundTotalInflow - tgsExpensesTotal;

  // 8. Bank and Investment Active Balances
  const bankWithBal = withRunningBalance(bankEntries);
  const investWithBal = withRunningBalance(investEntries);
  const bankBalance = bankWithBal[0]?.balance ?? 0;
  const investBalance = investWithBal[0]?.balance ?? 0;

  // 9. Total Integrated Society Inflow and Net Capital
  // মোট প্রাপ্তি = মোট সঞ্চয় + মোট জরিমানা + টিজিএস সরাসরি আয় + অর্জিত মোট লভ্যাংশ
  const totalSocietyInflow = depositFundTotal + totalFineCollected + tgsDirectIncomes + totalProfit;
  // সর্বমোট নেট ক্যাপিটাল ও স্থিতি = মোট প্রাপ্তি - মোট খরচ
  const totalNetCapital = totalSocietyInflow - tgsExpensesTotal;

  // 10. Cash in Hand (হাতে নগদ ক্যাশ)
  // ব্যাংকে জমা রাখলে ফান্ড/ক্যাশ থেকে মাইনাস হবে, উত্তোলন করলে ক্যাশে যোগ হবে।
  // নতুন বিনিয়োগ করলে ক্যাশ থেকে মাইনাস হবে, বিনিয়োগ ফেরত আসলে ক্যাশে যোগ হবে।
  // সমন্বয় সূত্র: হাতে নগদ = সর্বমোট নেট ক্যাপিটাল - ব্যাংকে স্থিতি - বিনিয়োগকৃত মূলধন
  const cashInHand = totalNetCapital - bankBalance - investBalance;

  return {
    depositFundTotal,
    totalFineCollected,
    totalInvestDividends,
    totalBankDividends,
    totalProfit,
    tgsFromInvestProfit,
    generalInvestProfit,
    tgsDirectIncomes,
    tgsFundTotalInflow,
    tgsExpensesTotal,
    tgsFundBalance,
    bankBalance,
    investBalance,
    totalSocietyInflow,
    totalNetCapital,
    cashInHand,
  };
}

export function buildWorkbook(
  members: Member[],
  deposits: Deposit[],
  fundIncome: FundIncome[] = [],
  expenses: Expense[] = [],
  investEntries: AccountEntry[] = []
): XLSX.WorkBook {
  const memberTotals = Object.fromEntries(
    members.map((m) => [
      m.uid,
      deposits.filter((d) => d.memberUid === m.uid).reduce((s, d) => s + Number(d.amount || 0), 0),
    ])
  );

  const memberRows = members.map((m) => ({
    "ইউনিক আইডি": m.uid,
    "সদস্যের নাম": m.name,
    "Name (English)": m.nameEn || "",
    "মোবাইল": m.mobile || "",
    "রক্তের গ্রুপ": m.blood || "",
    "যোগদানের তারিখ": m.joined || "",
    "মেইল": m.email || "",
    "ঠিকানা": m.address || "",
    "মোট জমা": memberTotals[m.uid] || 0,
  }));

  const nameFor = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;
  const depositRows = deposits
    .slice()
    .reverse()
    .map((d) => ({
      "রসিদ নং": d.id,
      "সদস্যের নাম": nameFor(d.memberUid),
      "ইউনিক আইডি": d.memberUid,
      "মাস": d.month,
      "মেয়াদ (মাস)": d.monthsCount || 1,
      "তারিখ": d.date,
      "সঞ্চয় পরিমাণ": Number(d.amount || 0),
      "বিলম্ব জরিমানা": Number(d.fine || 0),
      "মোট প্রাপ্তি": Number(d.amount || 0) + Number(d.fine || 0),
      "মাধ্যম": d.method,
      "মন্তব্য": d.note || "",
    }));

  const tgsIncomeRows = fundIncome.map((f) => ({
    "তারিখ": f.date,
    "খাত / উৎস": f.source,
    "বিবরণ": f.desc,
    "টাকার পরিমাণ": Number(f.amount || 0),
    "মন্তব্য": f.note || "",
  }));

  const expenseRows = expenses.map((e) => ({
    "তারিখ": e.date,
    "খরচের বিবরণ": e.desc,
    "পরিমাণ": Number(e.amount || 0),
    "ভাউচার নং": e.invoice || "",
    "মন্তব্য": e.note || "",
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberRows), "সদস্য তালিকা");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(depositRows), "ডিপোজিট ফান্ড (সঞ্চয়)");
  if (tgsIncomeRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tgsIncomeRows), "টিজিএস ফান্ড আয়");
  }
  if (expenseRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), "টিজিএস খরচ");
  }
  return wb;
}

export function downloadExcel(
  members: Member[],
  deposits: Deposit[],
  fundIncome: FundIncome[] = [],
  expenses: Expense[] = [],
  investEntries: AccountEntry[] = []
) {
  const wb = buildWorkbook(members, deposits, fundIncome, expenses, investEntries);
  XLSX.writeFile(wb, "TGS_Ledger.xlsx");
}

function csvEscape(v: any): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildBackupCsv(members: Member[], deposits: Deposit[]): string {
  const nameFor = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;
  const memberTotal = (uid: string) =>
    deposits.filter((d) => d.memberUid === uid).reduce((s, d) => s + Number(d.amount || 0), 0);

  const memberLines = [
    "সদস্য তালিকা",
    ["ইউনিক আইডি", "নাম", "মোবাইল", "রক্তের গ্রুপ", "যোগদানের তারিখ", "মোট জমা"].join(","),
    ...members.map((m) =>
      [m.uid, m.name, m.mobile || "", m.blood || "", m.joined || "", memberTotal(m.uid)].map(csvEscape).join(",")
    ),
  ];
  const depositLines = [
    "",
    "জমার খতিয়ান",
    ["রসিদ নং", "নাম", "ইউনিক আইডি", "মাস", "তারিখ", "সঞ্চয় পরিমাণ", "জরিমানা", "মোট", "মাধ্যম"].join(","),
    ...deposits.map((d) =>
      [
        d.id,
        nameFor(d.memberUid),
        d.memberUid,
        d.month,
        d.date,
        d.amount,
        d.fine || 0,
        Number(d.amount || 0) + Number(d.fine || 0),
        d.method,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  return [...memberLines, ...depositLines].join("\n");
}

export function exportFullBackupJson(data: AppData) {
  const payload = {
    appName: "Trust Growth Society Ledger",
    version: "2.0",
    exportDate: new Date().toISOString(),
    exportDateFormatted: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString(),
    ...data,
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TGS_Cloud_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

