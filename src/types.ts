export interface Member {
  uid: string;
  name: string;
  nameEn?: string;
  mobile?: string;
  blood?: string;
  email?: string;
  joined?: string;
  address?: string;
  photo?: string; // Base64 data URL or image link
  photoFormat?: 'passport' | '300x300'; // Passport size (4:5 / 3.5x4.5cm) or 300x300 square
  photoSize?: number; // Size in bytes
  nid?: string;
  fatherName?: string;
  // Member NID Document Attachment (PDF or JPG/JPEG/PNG) - Size: 100 KB to 1 MB
  nidDoc?: string; // Base64 data URL
  nidDocName?: string;
  nidDocType?: 'pdf' | 'image';
  nidDocSize?: number;
  // Nominee Details
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeMobile?: string;
  nomineeNid?: string;
  nomineeAddress?: string;
  // Nominee Photo - Size: 30 KB to 300 KB
  nomineePhoto?: string; // Base64 data URL
  nomineePhotoFormat?: 'passport' | '300x300';
  nomineePhotoSize?: number;
  // Nominee NID Document Attachment (PDF or JPG/JPEG/PNG) - Size: 100 KB to 1 MB
  nomineeNidDoc?: string; // Base64 data URL
  nomineeNidDocName?: string;
  nomineeNidDocType?: 'pdf' | 'image';
  nomineeNidDocSize?: number;
  // Self-service "My Profile" personal message/bio, editable by the member themself
  bio?: string;
}

export interface Deposit {
  id: string;
  memberUid: string;
  month: string;
  date: string;
  amount: number;
  method: string;
  fine?: number;
  monthsCount?: number;
  note?: string;
  attachment?: string; // Base64 or image/document data URL
  attachmentName?: string;
  createdAt?: number;
}

export interface AccountEntry {
  id: string;
  seq?: number;
  date: string;
  desc: string;
  place?: string;
  type: 'in' | 'out'; // in: deposit/investment made, out: withdrawal/returned
  amount: number;
  dividend?: number;
  expectedProfitAmount?: number; // প্রত্যাশিত মুনাফার পরিমাণ
  expectedProfitPercent?: number; // প্রত্যাশিত মুনাফার শতকরা হার (যেমন ১৫%)
  maturityDate?: string; // ম্যাচুরিটি বা মেয়াদপূর্তির তারিখ
  actualProfitAmount?: number; // মেয়াদপূর্তিতে কম-বেশি হলে অর্জিত প্রকৃত মুনাফা
  isMatured?: boolean; // মেয়াদ পূর্ণ হয়েছে কিনা
  isProfitSettled?: boolean; // প্রফিট বণ্টন কার্যকর হয়েছে কিনা
  settledDistributionId?: string; // লিঙ্কড প্রফিট ডিস্ট্রিবিউশন আইডি
  note?: string;
  balance?: number;
  attachment?: string; // Base64 / data URL for slip, receipt, deed, check
  attachmentName?: string;
}

export interface FundIncome {
  id: string;
  source: string;
  date: string;
  desc: string;
  amount: number;
  note?: string;
  attachment?: string;
  attachmentName?: string;
}

export interface Expense {
  id: string;
  desc: string;
  amount: number;
  date: string;
  invoice?: string;
  note?: string;
  attachment?: string; // Base64 bill/voucher slip image
  attachmentName?: string;
}

export interface AppSettings {
  defaultFine: number; // default 50
  deadlineDay: number; // default 10 (10th of every month)
  societyName: string;
  societyNameEn?: string;
  societySubtitle: string;
  societySubtitleEn?: string;
  societyAddress: string;
  societyAddressEn?: string;
  establishedDate?: string;
  establishedDateEn?: string;
  contactPhone: string;
  logoUrl?: string; // Custom uploaded circular logo (Base64 data URL)
  // Watermark Settings (আলাদা জলছাপ কনফিগারেশন)
  watermarkType?: 'seal' | 'logo' | 'custom_image' | 'custom_text';
  watermarkUrl?: string; // Custom uploaded watermark image (Base64 data URL)
  watermarkRawUrl?: string; // Original unedited upload before bg removal
  watermarkText?: string; // Custom watermark text (e.g. "TRUST GROWTH SOCIETY")
  watermarkOpacity?: number; // 0.01 to 0.30 (default 0.08)
  watermarkSize?: number; // size in px (e.g. 250 to 700, default 500)
  watermarkRotation?: number; // rotation in deg (e.g. 0, -15, -30, -45)
  watermarkEnabled?: boolean; // default true
  watermarkRemoveBg?: boolean; // automatically strip solid/white background
  watermarkBlendMode?: 'multiply' | 'normal'; // default multiply
  watermarkInReceipts?: boolean; // default true
  watermarkInReports?: boolean; // default true
  watermarkInConstitution?: boolean; // default true
  aboutUs?: string; // Custom About Us text written by admin
  constitution?: string; // Custom Constitution / গঠনতন্ত্র text written/managed by admin
  constitutionAttachment?: string; // Base64 data URL for PDF/Document/Image
  constitutionAttachmentName?: string; // Name of the uploaded constitution file
  constitutionUpdatedAt?: string; // Last updated date
  lastBackupDate?: string;
  // Signatures for Money Receipts & Documents
  treasurerName?: string;
  treasurerSignature?: string; // Base64 signature image or drawn
  presidentRole?: 'president' | 'secretary'; // 'president' or 'secretary'
  presidentName?: string;
  presidentSignature?: string; // Base64 signature image or drawn
  secretaryName?: string;
  secretarySignature?: string; // Base64 signature image or drawn
  // Live Voting ON/OFF Toggle
  isLiveVotingEnabled?: boolean; // Master toggle for live voting display on homepage (default true)
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'emergency' | 'meeting' | 'financial' | 'voting';
  date: string;
  createdAt: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPinned?: boolean;
  author?: string;
  authorRole?: string;
  // Notice Publish Format (Text, Upload, or Both)
  noticeType?: 'text' | 'upload' | 'both';
  attachment?: string; // Base64 image or PDF data URL
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf' | 'document';
  attachmentSize?: number;
  pollId?: string; // Links directly to a poll if it's a voting notice
  targetAudience?: 'all' | 'specific';
  recipients?: string[]; // Member UIDs who received this notification
  circularNo?: string; // Official circular memo number (স্মারক নং)
  // Automatic Authorized Signatures
  signatory1Name?: string;
  signatory1Role?: string;
  signatory1Signature?: string;
  signatory2Name?: string;
  signatory2Role?: string;
  signatory2Signature?: string;
  includeSignature?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  color?: string; // visual badge color e.g. emerald, amber, rose, blue, purple
}

export interface PollVote {
  id: string;
  pollId: string;
  memberUid: string;
  memberName: string;
  memberMobile?: string;
  optionId: string;
  optionText: string;
  votedAt: string; // Formatted date string
  timestamp: number;
  comment?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  category: 'election' | 'investment' | 'constitution' | 'general' | 'opinion';
  options: PollOption[];
  startDate: string;
  endDate: string;
  durationHours?: number; // Time limit in hours (e.g. 12, 24, 48, 72, 168)
  endTimestamp?: number; // Milliseconds timestamp for deadline auto-timer
  status: 'draft' | 'active' | 'closed'; // active = LIVE voting
  createdAt: number;
  createdBy?: string;
  allowChangeVote?: boolean;
  isSecretBallot?: boolean;
  votes: PollVote[];
  resolutionSummary?: string; // Final decision / declaration of results
  requiresTwoThirds?: boolean; // ২/৩ (দুই-তৃতীয়াংশ) সংখ্যাগরিষ্ঠতা নীতি (default true)
  twoThirdsPassed?: boolean;
}

export interface ProfitShareItem {
  memberUid: string;
  memberName: string;
  memberMobile?: string;
  depositAtInvestDate: number; // Member total deposit as of investment date
  ratio: number; // Decimal proportion (e.g. 0.0524 for 5.24%)
  capitalShare: number; // Member's portion of capital deployed
  profitShare: number; // 95% member profit cut (rounded or decimal)
  status?: 'calculated' | 'paid' | 'reinvested';
  paidDate?: string;
}

export interface ProfitDistribution {
  id: string;
  title: string;
  investEntryId?: string; // linked investment entry
  investmentTitle: string;
  investmentAmount: number;
  investmentDate: string;
  profitAmount: number; // Total profit earned
  tgsFundPercent: number; // default 5%
  membersPercent: number; // default 95%
  tgsFundAmount: number; // Profit * 5%
  membersPoolAmount: number; // Profit * 95%
  totalSocietyDepositsAtDate: number; // Sum of all members deposits at investment date
  eligibleMembersCount: number;
  calculatedAt: string;
  shares: ProfitShareItem[];
  note?: string;
  status: 'draft' | 'finalized' | 'distributed';
}

export interface AppData {
  members: Member[];
  deposits: Deposit[];
  bankEntries: AccountEntry[];
  investEntries: AccountEntry[];
  fundIncome: FundIncome[];
  expenses: Expense[];
  settings?: AppSettings;
  notifications?: AppNotification[];
  polls?: Poll[];
  profitDistributions?: ProfitDistribution[];
}

