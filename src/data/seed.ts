import { Member, Deposit, FundIncome, Expense, AccountEntry, AppNotification, Poll, ProfitDistribution } from '../types';

export const SEED_MEMBERS: Member[] = [
  { uid: "TGS-2025-001", name: "মোঃ মোহাইমিনুল ইসলাম", nameEn: "Md. Mohaiminul Islam", mobile: "01911797438", blood: "B+", email: "mohim.khan7746@gmail.com", joined: "25/09/2025" },
  { uid: "TGS-2025-002", name: "শুভ দেবনাথ", nameEn: "Shuvo Debonath", mobile: "01723898918", blood: "A+", email: "", joined: "27/09/2025" },
  { uid: "TGS-2025-003", name: "মোঃ তুষার ইমরান রাব্বি", nameEn: "Md. Tusar Imran", mobile: "01726736967", blood: "A+", email: "", joined: "" },
  { uid: "TGS-2025-004", name: "পলাশ বিশ্বাস", nameEn: "Polash Biswas", mobile: "01925743530", blood: "B+", email: "polashb02@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-005", name: "মোঃ রিফাত গাজী", nameEn: "Rifat Gazi", mobile: "01744551335", blood: "B+", email: "gazirifat31@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-006", name: "মোঃ মোকাম্মেল হক মান্না", nameEn: "Mokammel Haque Manna", mobile: "01728366779", blood: "A+", email: "", joined: "28/09/2025" },
  { uid: "TGS-2025-007", name: "রাজীব বিশ্বাস", nameEn: "Rajib Biswas", mobile: "01600194649", blood: "A+", email: "rajibbiswasbsl@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-008", name: "মোঃ আসাদুল ইসলাম", nameEn: "Md. Asadul Islam", mobile: "01817302808", blood: "", email: "mdasad5131@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-009", name: "মোঃ আদনান আবদুল্লাহ", nameEn: "Adnan Abdullah", mobile: "01721343816", blood: "", email: "advabdullahadnan92@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-010", name: "আবু তাহের ইমরান", nameEn: "Md. Abu Taher", mobile: "01725829737", blood: "B+", email: "", joined: "" },
  { uid: "TGS-2025-011", name: "সুজন দেবনাথ", nameEn: "Sujon Debnath", mobile: "01714934025", blood: "O+", email: "sujondabnath@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-012", name: "মোঃ লিমন", nameEn: "Md. Limon", mobile: "01771604251", blood: "A+", email: "learlimon11@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-013", name: "মোঃ সাইদুল", nameEn: "", mobile: "", blood: "", email: "", joined: "" },
  { uid: "TGS-2025-014", name: "মোঃ নাজমুল হোসাইন রনি", nameEn: "", mobile: "01910153263", blood: "B+", email: "n.hossainrony72@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-015", name: "মোঃ সুয়াইব ইসলাম সবুজ", nameEn: "Md. Suaib Islam", mobile: "01735282690", blood: "A+", email: "suaibislamsabuj@gmail.com", joined: "29/09/2025" },
  { uid: "TGS-2025-016", name: "মোঃ মোজাম্মেল", nameEn: "", mobile: "01954392380", blood: "A+", email: "", joined: "28/09/2025" },
  { uid: "TGS-2025-017", name: "কামরুল ইসলাম খান", nameEn: "", mobile: "", blood: "", email: "", joined: "" },
  { uid: "TGS-2025-018", name: "মোঃ জাহিদুল ইসলাম", nameEn: "", mobile: "01825989044", blood: "O+", email: "jahidraj26@gmail.com", joined: "26/09/2025" },
  { uid: "TGS-2025-019", name: "মোঃ মোহাইমিনুল ইসলাম সোহেল", nameEn: "", mobile: "01873410888", blood: "A+", email: "shisirsohel36@gmail.com", joined: "" },
  { uid: "TGS-2025-020", name: "সুমন বিশ্বাস", nameEn: "", mobile: "01723764592", blood: "", email: "sumonbaswas595@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-021", name: "মোঃ কামরুল ইসলাম", nameEn: "Md. Kamrul Islam", mobile: "01865794394", blood: "B+", email: "kamrul01792993801@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-022", name: "মোসাঃ রাশিদা বেগম", nameEn: "Mst. Rashida Begum", mobile: "01757645893", blood: "", email: "", joined: "28/09/2025" },
  { uid: "TGS-2025-023", name: "মোঃ মেহেদী হাসান", nameEn: "Md. Mehedi Hasan", mobile: "01713965019", blood: "", email: "mehediopu440@gmail.com", joined: "29/09/2025" },
  { uid: "TGS-2025-024", name: "মোঃ মেহেদী হাসান রাজিন", nameEn: "", mobile: "01839002347", blood: "AB+", email: "rajintanjin65@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-025", name: "মোঃ রাহান", nameEn: "", mobile: "", blood: "", email: "mdrahan8644@gmail.com", joined: "" },
  { uid: "TGS-2025-026", name: "মোঃ ইউছুফ আলী", nameEn: "", mobile: "01771604251", blood: "A+", email: "learlimon@gmail.com", joined: "28/09/2025" },
  { uid: "TGS-2025-027", name: "মোঃ লিকন", nameEn: "Md. Likon", mobile: "", blood: "", email: "", joined: "" },
];

export const SEED_DEPOSITS: Deposit[] = [];

export const SEED_BANK: AccountEntry[] = [];
export const SEED_INVEST: AccountEntry[] = [];

export const SEED_FUND_INCOME: FundIncome[] = [];

export const SEED_EXPENSES: Expense[] = [];

export const SEED_NOTIFICATIONS: AppNotification[] = [];

export const SEED_POLLS: Poll[] = [];

export const SEED_PROFIT_DISTRIBUTIONS: ProfitDistribution[] = [];

