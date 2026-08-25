import { useState, useEffect, useRef } from "react";
import {
  Landmark,
  Download,
  CloudUpload,
  Loader2,
  Check,
  PlusCircle,
  BookOpen,
  UserPlus,
  Settings,
  Database,
  Share2,
  Menu,
  Camera,
  Info,
  ShieldCheck,
  KeyRound,
  LogOut,
  CircleUserRound,
} from "lucide-react";
import { Member, Deposit, AccountEntry, FundIncome, Expense, AppSettings, AppData, Poll, PollVote, AppNotification, ProfitDistribution } from "./types";
import {
  getRecentMonths,
  withRunningBalance,
  currency,
  downloadExcel,
  DEFAULT_SETTINGS,
  calculateTwoFundsSummary,
} from "./utils/helpers";
import { loadAppData, saveAppData } from "./utils/storage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { STORAGE_KEY as APP_STORAGE_KEY } from "./utils/helpers";
import {
  subscribeToRealtimeChanges,
  syncPollVoteToSupabase,
} from "./utils/supabaseSync";
import { Dashboard } from "./components/Dashboard";
import { MembersList } from "./components/MembersList";
import { MemberDetail } from "./components/MemberDetail";
import { DepositsLedger } from "./components/DepositsLedger";
import { AccountLedgerPage } from "./components/AccountLedgerPage";
import { FundExpensesPage } from "./components/FundExpensesPage";
import { DownloadsReportsPage } from "./components/DownloadsReportsPage";
import { VotingNotifyCenter } from "./components/VotingNotifyCenter";
import { ProfitCenter } from "./components/ProfitCenter";
import { AdminPanel } from "./components/AdminPanel";
import {
  AddDepositModal,
  AddMemberModal,
  EditMemberModal,
  AddBankModal,
  AddInvestModal,
  AddFundIncomeModal,
  AddExpenseModal,
  ReceiptModal,
  FineSettingsModal,
  CloudBackupModal,
} from "./components/Modals";
import { TgsLogoSvg } from "./components/TgsLogoWatermark";
import { SidebarDrawer } from "./components/SidebarDrawer";
import { AboutUsModal } from "./components/AboutUsModal";
import { LogoUploadModal } from "./components/LogoUploadModal";
import { WatermarkModal } from "./components/WatermarkModal";
import { ConstitutionPage } from "./components/ConstitutionPage";
import { UnifiedSettingsModal } from "./components/UnifiedSettingsModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { ExitModal, ExitedScreen, performAppExit } from "./components/ExitModal";
import { useLanguage } from "./utils/LanguageContext";
import { toEnDigits } from "./utils/translations";
import { Vote, Bell, Percent } from "lucide-react";

function readCachedSettingsForLogin(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.settings) return { ...DEFAULT_SETTINGS, ...parsed.settings };
    }
  } catch {
    // ignore — fall back to defaults
  }
  return DEFAULT_SETTINGS;
}

function AuthGate() {
  const { authEnabled, loading, session } = useAuth();
  const { language } = useLanguage();

  if (authEnabled && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="flex items-center gap-3 text-emerald-900 bg-white px-6 py-4 rounded-xl border border-stone-200 shadow-sm">
          <Loader2 className="animate-spin text-emerald-800" size={26} />
          <span className="font-semibold text-sm">{language === 'bn' ? "সেশন যাচাই করা হচ্ছে…" : "Verifying session…"}</span>
        </div>
      </div>
    );
  }

  if (authEnabled && !session) {
    return <LoginScreen settings={readCachedSettingsForLogin()} />;
  }

  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AppContent() {
  const { language, t, formatNumber, formatUid, formatMoney } = useLanguage();
  const auth = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [bankEntries, setBankEntries] = useState<AccountEntry[]>([]);
  const [investEntries, setInvestEntries] = useState<AccountEntry[]>([]);
  const [fundIncome, setFundIncome] = useState<FundIncome[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgs_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [polls, setPolls] = useState<Poll[]>([]);
  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  type AppTab =
    | "dashboard"
    | "members"
    | "deposits"
    | "bank"
    | "invest"
    | "fund"
    | "voting"
    | "profit_center"
    | "admin"
    | "constitution"
    | "downloads";

  const [tab, setTab] = useState<AppTab>("dashboard");
  const [query, setQuery] = useState("");
  const [bloodFilter, setBloodFilter] = useState("");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  // Modals & Drawers
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddInvest, setShowAddInvest] = useState(false);
  const [showAddFundIncome, setShowAddFundIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFineSettings, setShowFineSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"profile" | "logo" | "watermark" | "language" | "signatures" | "fines">("profile");
  const [showCloudBackup, setShowCloudBackup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [viewingReceiptDeposit, setViewingReceiptDeposit] = useState<Deposit | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExited, setIsExited] = useState(false);
  const lastBackPressRef = useRef<number>(0);

  const [toast, setToast] = useState("");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const navigateToTab = (newTab: AppTab) => {
    if (selectedUid) {
      setSelectedUid(null);
    }
    setTab(newTab);
    scrollToTop();
  };

  // Members can never land on the admin tab (e.g. stale state after a
  // role change) — bounce them back to the dashboard.
  useEffect(() => {
    if (tab === "admin" && !auth.isAdmin) {
      setTab("dashboard");
    }
  }, [tab, auth.isAdmin]);

  // Scroll to top and scroll tab header item into view whenever tab or selected member changes
  useEffect(() => {
    scrollToTop();
    const activeTabEl = document.getElementById(`tab-${tab}`);
    if (activeTabEl) {
      activeTabEl.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    }
  }, [tab, selectedUid]);

  // Master Background Scroll Lock: Prevents background scrolling when any modal, drawer, or popup is open
  const isAnyOverlayOpen = Boolean(
    showSidebar ||
    showAboutUs ||
    showLogoUpload ||
    showWatermarkModal ||
    showAddDeposit ||
    showAddMember ||
    editingMember ||
    showAddBank ||
    showAddInvest ||
    showAddFundIncome ||
    showAddExpense ||
    showFineSettings ||
    showSettingsModal ||
    showCloudBackup ||
    showChangePassword ||
    viewingReceiptDeposit ||
    showExitModal
  );

  useEffect(() => {
    if (isAnyOverlayOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origDocOverflow = document.documentElement.style.overflow;
      const origTouchAction = document.body.style.touchAction;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origDocOverflow;
        document.body.style.touchAction = origTouchAction;
      };
    }
  }, [isAnyOverlayOpen]);

  // Keep a mutable reference of current app overlay & navigation states for popstate
  const stateRef = useRef({
    showExitModal,
    viewingReceiptDeposit,
    showAddDeposit,
    showAddMember,
    editingMember,
    showSettingsModal,
    showAboutUs,
    showLogoUpload,
    showWatermarkModal,
    showAddBank,
    showAddInvest,
    showAddFundIncome,
    showAddExpense,
    showFineSettings,
    showCloudBackup,
    showChangePassword,
    showProfileMenu,
    showSidebar,
    selectedUid,
    tab,
  });

  useEffect(() => {
    stateRef.current = {
      showExitModal,
      viewingReceiptDeposit,
      showAddDeposit,
      showAddMember,
      editingMember,
      showSettingsModal,
      showAboutUs,
      showLogoUpload,
      showWatermarkModal,
      showAddBank,
      showAddInvest,
      showAddFundIncome,
      showAddExpense,
      showFineSettings,
      showCloudBackup,
      showChangePassword,
      showProfileMenu,
      showSidebar,
      selectedUid,
      tab,
    };
  });

  // Strict Step-By-Step Inner Back Handler (Device / Browser Back Button & Escape Key)
  const handleStepBack = () => {
    const s = stateRef.current;

    // 1. If Exit Modal is open -> close it
    if (s.showExitModal) {
      setShowExitModal(false);
      return;
    }

    // 2. Modals & Overlays (close open modal step-by-step)
    if (s.viewingReceiptDeposit) {
      setViewingReceiptDeposit(null);
      return;
    }
    if (s.editingMember) {
      setEditingMember(null);
      return;
    }
    if (s.showAddDeposit) {
      setShowAddDeposit(false);
      return;
    }
    if (s.showAddMember) {
      setShowAddMember(false);
      return;
    }
    if (s.showSettingsModal) {
      setShowSettingsModal(false);
      return;
    }
    if (s.showAboutUs) {
      setShowAboutUs(false);
      return;
    }
    if (s.showLogoUpload) {
      setShowLogoUpload(false);
      return;
    }
    if (s.showWatermarkModal) {
      setShowWatermarkModal(false);
      return;
    }
    if (s.showCloudBackup) {
      setShowCloudBackup(false);
      return;
    }
    if (s.showChangePassword) {
      setShowChangePassword(false);
      return;
    }
    if (s.showProfileMenu) {
      setShowProfileMenu(false);
      return;
    }
    if (s.showFineSettings) {
      setShowFineSettings(false);
      return;
    }
    if (s.showAddBank) {
      setShowAddBank(false);
      return;
    }
    if (s.showAddInvest) {
      setShowAddInvest(false);
      return;
    }
    if (s.showAddFundIncome) {
      setShowAddFundIncome(false);
      return;
    }
    if (s.showAddExpense) {
      setShowAddExpense(false);
      return;
    }

    // 3. Sidebar Drawer -> close sidebar drawer
    if (s.showSidebar) {
      setShowSidebar(false);
      return;
    }

    // 4. Tab Sub-Views (e.g. Member Detailed Profile / Passbook view -> return to Members list)
    if (s.selectedUid) {
      setSelectedUid(null);
      scrollToTop();
      return;
    }

    // 5. On any Tab (other than Dashboard) -> Immediately return straight to Dashboard (Home tab)
    if (s.tab !== "dashboard") {
      setTab("dashboard");
      scrollToTop();
      return;
    }

    // 6. On Home Page / Dashboard -> Double press check (within 2.5 seconds) to prompt exit confirmation
    const now = Date.now();
    if (now - lastBackPressRef.current < 2500) {
      setShowExitModal(true);
    } else {
      lastBackPressRef.current = now;
      flashToast(
        language === "bn"
          ? "অ্যাপ থেকে বের হতে আর একবার ব্যাক বাটন চাপুন"
          : "Press back button again to exit app"
      );
    }
  };

  const handleStepBackRef = useRef(handleStepBack);
  useEffect(() => {
    handleStepBackRef.current = handleStepBack;
  });

  // Mobile / Hardware Back Button and Escape Key Management
  useEffect(() => {
    // Push an initial state into history stack so browser back button is trapped
    window.history.pushState({ app: "tgs-ledger", layer: "root" }, "");

    const handlePopState = (e: PopStateEvent) => {
      handleStepBackRef.current();
      window.history.pushState({ app: "tgs-ledger", time: Date.now() }, "");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleStepBackRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [language]);

  // Initial Load — waits for auth to resolve (when Supabase login is active)
  // so the very first fetch already has a session and can read real data.
  const applyLoadedData = (data: AppData) => {
    setMembers(data.members || []);
    setDeposits(data.deposits || []);
    setBankEntries(data.bankEntries || []);
    setInvestEntries(data.investEntries || []);
    setFundIncome(data.fundIncome || []);
    setExpenses(data.expenses || []);
    setNotifications(data.notifications || []);
    setPolls(data.polls || []);
    setProfitDistributions(data.profitDistributions || []);
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  useEffect(() => {
    if (auth.authEnabled && (auth.loading || !auth.session)) return;
    (async () => {
      const data = await loadAppData();
      applyLoadedData(data);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authEnabled, auth.loading, auth.session?.user?.id]);

  // Realtime auto-sync: refresh from Supabase whenever another device
  // changes data, and again the moment this device regains internet.
  useEffect(() => {
    if (!auth.authEnabled || !auth.session) return;

    const refresh = () => {
      loadAppData().then(applyLoadedData);
    };
    const unsubscribe = subscribeToRealtimeChanges(refresh);
    window.addEventListener("online", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("online", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authEnabled, auth.session?.user?.id]);

  const persist = (
    patch: {
      members?: Member[];
      deposits?: Deposit[];
      bankEntries?: AccountEntry[];
      investEntries?: AccountEntry[];
      fundIncome?: FundIncome[];
      expenses?: Expense[];
      notifications?: AppNotification[];
      polls?: Poll[];
      profitDistributions?: ProfitDistribution[];
      settings?: AppSettings;
    },
    opts?: { allowMemberWrite?: boolean }
  ) => {
    // Treasurer / General Secretary logins may only ADD new entries in
    // these specific areas (deposits, bank, investment, fund/expenses,
    // polls, and profit distribution statements) — never touch members,
    // notifications, or settings (which covers the Constitution & Bylaws
    // text too, so this also enforces "no Constitution edit access").
    const TREASURER_ALLOWED_KEYS = [
      "deposits",
      "bankEntries",
      "investEntries",
      "fundIncome",
      "expenses",
      "polls",
      "profitDistributions",
    ] as const;
    const isWithinTreasurerScope =
      auth.isTreasurer &&
      Object.keys(patch).every((k) => (TREASURER_ALLOWED_KEYS as readonly string[]).includes(k));

    if (!auth.isAdmin && !isWithinTreasurerScope && !opts?.allowMemberWrite) {
      flashToast(
        language === "bn"
          ? "এই তথ্য পরিবর্তনের অনুমতি আপনার নেই।"
          : "You don't have permission to modify this data."
      );
      return;
    }
    const payload: AppData = {
      members: patch.members ?? members,
      deposits: patch.deposits ?? deposits,
      bankEntries: patch.bankEntries ?? bankEntries,
      investEntries: patch.investEntries ?? investEntries,
      fundIncome: patch.fundIncome ?? fundIncome,
      expenses: patch.expenses ?? expenses,
      notifications: patch.notifications ?? notifications,
      polls: patch.polls ?? polls,
      profitDistributions: patch.profitDistributions ?? profitDistributions,
      settings: patch.settings ?? settings,
    };
    saveAppData(payload);
  };

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Polls & Voting Handlers
  const savePoll = (poll: Poll) => {
    const exists = polls.some((p) => p.id === poll.id);
    const next = exists ? polls.map((p) => (p.id === poll.id ? poll : p)) : [poll, ...polls];
    setPolls(next);
    persist({ polls: next });
    flashToast(language === "bn" ? "ভোট বা প্রস্তাবনা সংরক্ষিত হয়েছে!" : "Poll saved successfully!");
  };

  const deletePoll = (pollId: string) => {
    const next = polls.filter((p) => p.id !== pollId);
    setPolls(next);
    persist({ polls: next });
    flashToast(language === "bn" ? "ভোট মুছে ফেলা হয়েছে" : "Poll deleted");
  };

  const castVote = async (vote: PollVote) => {
    const next = polls.map((p) => {
      if (p.id !== vote.pollId) return p;
      const filteredVotes = (p.votes || []).filter((v) => v.memberUid !== vote.memberUid);
      return {
        ...p,
        votes: [...filteredVotes, vote],
      };
    });
    setPolls(next);
    // Voting is the one write every logged-in member is allowed to make —
    // bypass the admin-only gate, and (when Supabase is on) write the vote
    // directly to its own RLS-protected row rather than the admin-only
    // generic table sync.
    persist({ polls: next }, { allowMemberWrite: true });
    if (auth.authEnabled) {
      const { error } = await syncPollVoteToSupabase(vote);
      if (error) {
        flashToast(
          language === "bn"
            ? `ভোট ক্লাউডে সংরক্ষণ করা যায়নি: ${error}`
            : `Could not save the vote to the cloud: ${error}`
        );
        return;
      }
    }
    flashToast(language === "bn" ? "আপনার ভোট সফলভাবে গৃহীত হয়েছে! ধন্যবাদ।" : "Vote cast successfully! Thank you.");
  };

  // Notification Handlers
  const saveNotification = (notif: AppNotification) => {
    const exists = notifications.some((n) => n.id === notif.id);
    const next = exists ? notifications.map((n) => (n.id === notif.id ? notif : n)) : [notif, ...notifications];
    setNotifications(next);
    persist({ notifications: next });
    flashToast(language === "bn" ? "নোটিশ প্রকাশিত / সংরক্ষিত হয়েছে" : "Notice published / saved");
  };

  const markNotificationAsRead = (notifId: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(notifId)) return prev;
      const next = [...prev, notifId];
      try {
        localStorage.setItem("tgs_read_notifications", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem("tgs_read_notifications", JSON.stringify(allIds));
    } catch (e) {
      console.error(e);
    }
    flashToast(language === "bn" ? "সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে" : "All notifications marked as read");
  };

  const deleteNotification = (notifId: string) => {
    const next = notifications.filter((n) => n.id !== notifId);
    setNotifications(next);
    persist({ notifications: next });
    flashToast(language === "bn" ? "নোটিশ মুছে ফেলা হয়েছে" : "Notice deleted");
  };

  // Profit Distribution Handlers
  const saveProfitDistribution = (dist: ProfitDistribution) => {
    const exists = profitDistributions.some((p) => p.id === dist.id);
    const next = exists ? profitDistributions.map((p) => (p.id === dist.id ? dist : p)) : [dist, ...profitDistributions];
    setProfitDistributions(next);
    persist({ profitDistributions: next });
    flashToast(language === "bn" ? "প্রফিট বণ্টন স্টেটমেন্ট সংরক্ষিত হয়েছে!" : "Profit distribution statement saved!");
  };

  const deleteProfitDistribution = (distId: string) => {
    const next = profitDistributions.filter((p) => p.id !== distId);
    setProfitDistributions(next);
    persist({ profitDistributions: next });
    flashToast(language === "bn" ? "প্রফিট রেকর্ড মুছে ফেলা হয়েছে" : "Profit record deleted");
  };

  // Add Deposit -> Saves and IMMEDIATELY creates/opens money receipt for WhatsApp and printing
  const addDeposit = (entry: Omit<Deposit, "id">) => {
    const newDeposit: Deposit = {
      id: "REC-" + Date.now().toString().slice(-6),
      ...entry,
    };
    const next = [newDeposit, ...deposits];
    setDeposits(next);
    persist({ deposits: next });
    flashToast(language === "bn" ? "জমা সফল হয়েছে! রসিদ তৈরি হয়েছে ও স্টোরেজে সংরক্ষিত হয়েছে।" : "Deposit successful! Receipt has been generated and saved to storage.");
    // Automatically display the newly created Money Receipt with 1-click WhatsApp sending option
    setViewingReceiptDeposit(newDeposit);
  };

  // Add New Member
  const addMember = (entry: Member) => {
    const next = [...members, entry];
    setMembers(next);
    persist({ members: next });
    flashToast(language === "bn" ? `সদস্য ${entry.name} (${entry.uid}) সফলভাবে নিবন্ধিত হয়েছে` : `Member ${entry.name} (${entry.uid}) registered successfully`);
  };

  // Update Member (Details & Photo)
  const updateMember = (updated: Member) => {
    const next = members.map((m) => (m.uid === updated.uid ? updated : m));
    setMembers(next);
    persist({ members: next });
    setEditingMember(null);
    flashToast(language === "bn" ? `সদস্য ${updated.name} এর তথ্য ও ছবি আপডেট হয়েছে` : `${updated.name}'s information and photo have been updated`);
  };

  const addBankEntry = (entry: Omit<AccountEntry, "id">) => {
    const next = [...bankEntries, { id: "bk-" + Date.now(), seq: Date.now(), ...entry }];
    setBankEntries(next);
    persist({ bankEntries: next });
    flashToast(language === "bn" ? "ব্যাংক হিসাব এন্ট্রি সংরক্ষিত হয়েছে" : "Bank account entry saved");
  };

  const addInvestEntry = (entry: Omit<AccountEntry, "id">) => {
    const newInvestId = "iv-" + Date.now();
    const newEntry: AccountEntry = { id: newInvestId, seq: Date.now(), ...entry };
    const next = [...investEntries, newEntry];
    setInvestEntries(next);

    // If investment has maturity date or expected profit, automatically create an official notification alert
    let updatedNotifs = notifications;
    if (entry.maturityDate || entry.expectedProfitAmount) {
      const todayStr = new Date().toLocaleDateString("en-GB");
      const profitNote = entry.expectedProfitAmount
        ? `প্রত্যাশিত মুনাফা: ৳${Number(entry.expectedProfitAmount).toLocaleString("bn-BD")} (${entry.expectedProfitPercent || 0}%)`
        : "";
      const maturityNote = entry.maturityDate ? `মেয়াদপূর্তির তারিখ: ${entry.maturityDate}` : "";

      const autoNotif: AppNotification = {
        id: "notif-inv-" + Date.now(),
        title: `নতুন বিনিয়োগ প্রকল্প: ${entry.place || "সোসাইটি বিজনেস"} (৳${Number(entry.amount || 0).toLocaleString("bn-BD")})`,
        content: `সোসাইটি ফান্ড থেকে নতুন বিনিয়োগ করা হয়েছে। ${profitNote ? profitNote + "। " : ""}${maturityNote ? maturityNote + "। " : ""}মেয়াদপূর্তিতে বিনিয়োগকৃত মূলধনের মুনাফা ৯৫% সাধারণ সদস্যদের সঞ্চয়ের অনুপাতে এবং ৫% টিজিএস ফান্ডে বণ্টন করা হবে।`,
        category: "financial",
        priority: "high",
        date: todayStr,
        createdAt: Date.now(),
        author: "টিজিএস ইনভেস্টমেন্ট কমিটি",
        circularNo: `TGS/INV/${Date.now().toString().slice(-4)}`,
        isPinned: true,
      };
      updatedNotifs = [autoNotif, ...notifications];
      setNotifications(updatedNotifs);
    }

    persist({ investEntries: next, notifications: updatedNotifs });
    flashToast(language === "bn" ? "বিনিয়োগ এন্ট্রি ও অফিসিয়াল নোটিফিকেশন সংরক্ষিত হয়েছে" : "Investment entry and official notification saved");
  };

  const addFundIncome = (entry: Omit<FundIncome, "id">) => {
    const next = [{ id: "fi-" + Date.now(), ...entry }, ...fundIncome];
    setFundIncome(next);
    persist({ fundIncome: next });
    flashToast(language === "bn" ? "ফান্ড আয় সংরক্ষিত হয়েছে" : "Fund income saved");
  };

  const addExpense = (entry: Omit<Expense, "id">) => {
    const next = [{ id: "ex-" + Date.now(), ...entry }, ...expenses];
    setExpenses(next);
    persist({ expenses: next });
    flashToast(language === "bn" ? "খরচ সংরক্ষিত হয়েছে" : "Expense saved");
  };

  // Safe Record Deletion Handlers with Data Recalculation
  const deleteDeposit = (depositId: string) => {
    const next = deposits.filter((d) => d.id !== depositId);
    setDeposits(next);
    persist({ deposits: next });
    flashToast(language === "bn" ? "জমার রসিদ ও রেকর্ড সফলভাবে মুছে ফেলা হয়েছে" : "Deposit receipt and record deleted successfully");
  };

  const deleteMember = (memberUid: string) => {
    const nextMembers = members.filter((m) => m.uid !== memberUid);
    const nextDeposits = deposits.filter((d) => d.memberUid !== memberUid);
    setMembers(nextMembers);
    setDeposits(nextDeposits);
    persist({ members: nextMembers, deposits: nextDeposits });
    if (selectedUid === memberUid) {
      setSelectedUid(null);
    }
    flashToast(language === "bn" ? "সদস্য প্রোফাইল ও সংশ্লিষ্ট সকল রেকর্ড মুছে ফেলা হয়েছে" : "Member profile and all associated records deleted");
  };

  const deleteBankEntry = (id: string) => {
    const next = bankEntries.filter((e) => e.id !== id);
    setBankEntries(next);
    persist({ bankEntries: next });
    flashToast(language === "bn" ? "ব্যাংক হিসাবের এন্ট্রি মুছে ফেলা হয়েছে" : "Bank account entry deleted");
  };

  const deleteInvestEntry = (id: string) => {
    const next = investEntries.filter((e) => e.id !== id);
    setInvestEntries(next);
    persist({ investEntries: next });
    flashToast(language === "bn" ? "বিনিয়োগ এন্ট্রি মুছে ফেলা হয়েছে" : "Investment entry deleted");
  };

  const deleteFundIncome = (id: string) => {
    const next = fundIncome.filter((f) => f.id !== id);
    setFundIncome(next);
    persist({ fundIncome: next });
    flashToast(language === "bn" ? "ফান্ড জমার রেকর্ড মুছে ফেলা হয়েছে" : "Fund income record deleted");
  };

  const deleteExpense = (id: string) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    persist({ expenses: next });
    flashToast(language === "bn" ? "খরচের ভাউচার রেকর্ড মুছে ফেলা হয়েছে" : "Expense voucher record deleted");
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    persist({ settings: merged });
    setShowFineSettings(false);
    flashToast(language === "bn" ? "সেটিংস ও তথ্য আপডেট হয়েছে" : "Settings and information updated");
  };

  const restoreFullData = (restored: AppData) => {
    setMembers(restored.members || []);
    setDeposits(restored.deposits || []);
    setBankEntries(restored.bankEntries || []);
    setInvestEntries(restored.investEntries || []);
    setFundIncome(restored.fundIncome || []);
    setExpenses(restored.expenses || []);
    setNotifications(restored.notifications || []);
    setPolls(restored.polls || []);
    setProfitDistributions(restored.profitDistributions || []);
    if (restored.settings) {
      setSettings(restored.settings);
    }
    persist(restored);
  };

  // Financial Calculations & Complete Integrated Reconciliation Architecture
  const twoFunds = calculateTwoFundsSummary(deposits, investEntries, fundIncome, expenses, bankEntries);
  const totalDeposit = twoFunds.depositFundTotal;
  const totalFine = twoFunds.totalFineCollected;

  const bankWithBalance = withRunningBalance(bankEntries);
  const investWithBalance = withRunningBalance(investEntries);
  const bankBalance = twoFunds.bankBalance;
  const investBalance = twoFunds.investBalance;
  const totalProfit = twoFunds.totalProfit;
  
  const fundTotal = twoFunds.tgsFundTotalInflow;
  const expensesTotal = twoFunds.tgsExpensesTotal;
  const fundNow = twoFunds.tgsFundBalance;
  const totalMoney = twoFunds.totalNetCapital;
  const cashInHand = twoFunds.cashInHand;

  const memberTotal = (uid: string) =>
    deposits.filter((d) => d.memberUid === uid).reduce((s, d) => s + Number(d.amount || 0), 0);

  const activePollsCount = polls.filter((p) => p.status === "active").length;
  const unreadNotifsCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  const monthlyTotals = getRecentMonths(6)
    .slice()
    .reverse()
    .map((full) => ({
      label: full.split(" ")[0],
      total: deposits.filter((d) => d.month === full).reduce((s, d) => s + Number(d.amount || 0), 0),
    }));
  const maxMonthly = Math.max(1, ...monthlyTotals.map((m) => m.total));

  const filteredMembers = members.filter((m) => {
    if (bloodFilter && (m.blood || "").trim().toUpperCase() !== bloodFilter) return false;

    const raw = query.trim().toLowerCase();
    if (!raw) return true;
    // Normalize Bengali digits (০-৯) to English (0-9) so a member typing a
    // phone number or 3-digit member ID using a Bengali (Avro/Bijoy-style)
    // numeric keyboard still matches — the stored data is always in
    // English digits (see formatUid / Member.mobile).
    const qEn = toEnDigits(raw).toLowerCase();
    return (
      m.name.toLowerCase().includes(raw) ||
      (m.nameEn || "").toLowerCase().includes(raw) ||
      m.uid.toLowerCase().includes(raw) ||
      m.uid.toLowerCase().includes(qEn) ||
      // Matches the last 3 digits of the member ID too, e.g. "013" for
      // "TGS-2025-013", without requiring the full "TGS-2025-" prefix.
      m.uid.toLowerCase().endsWith(qEn) ||
      (m.mobile || "").includes(raw) ||
      (m.mobile || "").includes(qEn) ||
      (m.address || "").toLowerCase().includes(raw)
    );
  });

  const selectedMember = members.find((m) => m.uid === selectedUid);

  // The logged-in person's profile picture, if their login is linked to a
  // Member record with a photo — otherwise the header falls back to a
  // default avatar icon (e.g. Admin/Treasurer logins with no linked member).
  const currentUserPhoto = auth.currentMemberUid
    ? members.find((m) => m.uid === auth.currentMemberUid)?.photo || null
    : null;

  const currentAppData: AppData = {
    members,
    deposits,
    bankEntries,
    investEntries,
    fundIncome,
    expenses,
    notifications,
    polls,
    profitDistributions,
    settings,
  };

  const isAnyModalOpen =
    showExitModal ||
    viewingReceiptDeposit !== null ||
    editingMember !== null ||
    showAddDeposit ||
    showAddMember ||
    showSettingsModal ||
    showAboutUs ||
    showLogoUpload ||
    showWatermarkModal ||
    showCloudBackup ||
    showChangePassword ||
    showFineSettings ||
    showAddBank ||
    showAddInvest ||
    showAddFundIncome ||
    showAddExpense;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="flex items-center gap-3 text-emerald-900 bg-white px-6 py-4 rounded-xl border border-stone-200 shadow-sm">
          <BookOpen className="animate-pulse text-emerald-800" size={26} />
          <span className="font-semibold text-sm">{language === 'bn' ? "Trust Growth Society লেজার লোড হচ্ছে…" : "Loading Trust Growth Society ledger…"}</span>
        </div>
      </div>
    );
  }

  if (isExited) {
    return (
      <ExitedScreen
        onReopen={() => {
          setIsExited(false);
          window.history.pushState({ app: "tgs-ledger", layer: "root" }, "");
        }}
        societyName={language === 'en' && settings.societyNameEn ? settings.societyNameEn : settings.societyName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-24 antialiased selection:bg-emerald-200">
      {/* Society Header */}
      <header className="bg-emerald-950 text-amber-50 shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Hamburger 3-line Menu Button on top-left */}
              <button
                id="main-sidebar-menu-btn"
                type="button"
                onClick={() => setShowSidebar((prev) => !prev)}
                title={language === 'bn' ? (showSidebar ? "মেনু বন্ধ করুন" : "সাইডবার মেনু খুলুন") : (showSidebar ? "Close menu" : "Open sidebar menu")}
                aria-label={language === 'bn' ? (showSidebar ? "মেনু বন্ধ করুন" : "সাইডবার মেনু খুলুন") : (showSidebar ? "Close menu" : "Open sidebar menu")}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 flex items-center justify-center ${
                  showSidebar
                    ? "bg-amber-400 text-emerald-950 border-2 border-amber-300 shadow-md"
                    : "bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-emerald-800"
                }`}
              >
                <Menu size={22} className="stroke-[2.5]" />
              </button>

              {/* Circular Logo / Image — only a Super Admin can click through to edit it */}
              <div className="relative group shrink-0">
                {auth.isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setSettingsInitialTab("logo");
                    setShowSettingsModal(true);
                  }}
                  title={language === 'bn' ? "প্রতিষ্ঠানের গোল ছবি / লোগো পরিবর্তন করুন" : "Change society logo / circular picture"}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md font-black border-2 border-amber-300 transition-transform active:scale-95 cursor-pointer relative"
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.societyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Landmark size={24} />
                  )}
                  {/* Hover icon overlay */}
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} />
                  </div>
                </button>
                ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md font-black border-2 border-amber-300">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.societyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Landmark size={24} />
                  )}
                </div>
                )}
                {auth.isAdmin && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-xs pointer-events-none border border-emerald-950">
                  <Camera size={9} />
                </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {(language === 'en' && settings.societyNameEn) ? settings.societyNameEn : settings.societyName}
                  </h1>
                  <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                    TGS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end">
              {/* Notification Header Icon - Badge disappears once seen */}
              <button
                id="header-notification-btn"
                type="button"
                onClick={() => navigateToTab("voting")}
                title={language === 'bn' ? "নোটিশ ও ভোটিং সেন্টার খুলুন" : "Open Notices & Voting Center"}
                className={`relative p-2 sm:px-3 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                  tab === "voting"
                    ? "bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-bold"
                    : "bg-emerald-900/80 hover:bg-emerald-800 text-amber-200 border-emerald-800"
                }`}
              >
                <Bell size={18} className="text-amber-400" />
                <span className="hidden md:inline text-xs font-semibold">
                  {language === 'bn' ? "নোটিশ / ভোট" : "Notices"}
                </span>
                {activePollsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center border border-emerald-950 animate-pulse">
                    🔴 {activePollsCount}
                  </span>
                ) : unreadNotifsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-950 text-[10px] font-black rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center border border-emerald-950">
                    {unreadNotifsCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setShowAboutUs(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-200 border border-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Info size={14} className="text-amber-400" />
                <span>{t.btn_about_us}</span>
              </button>

              {/* Total Savings Block */}
              <div className="text-right bg-emerald-900/80 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-emerald-800/80 shadow-xs">
                <p className="text-emerald-300 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                  {language === 'bn' ? 'মোট সঞ্চয় জমা' : 'Total Savings'}
                </p>
                <p className="text-base sm:text-2xl font-bold text-amber-300 font-mono">{formatMoney(totalDeposit)}</p>
              </div>

              {/* Admin Panel Button (Exact matching size & height next to Total Savings) */}
              {auth.isAdmin && (
              <button
                id="header-admin-panel-btn"
                type="button"
                onClick={() => navigateToTab("admin")}
                title={language === 'bn' ? "অ্যাডমিন প্যানেল কন্ট্রোল সেন্টারে যান" : "Open Admin Control Panel"}
                className={`text-left px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-2 sm:gap-2.5 ${
                  tab === "admin"
                    ? "bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-bold ring-2 ring-amber-300/60"
                    : "bg-emerald-900/90 hover:bg-emerald-800 text-white border-emerald-700/90 hover:border-amber-400/60"
                }`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${tab === "admin" ? "bg-emerald-950 text-amber-300" : "bg-amber-400 text-emerald-950"}`}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold ${tab === "admin" ? "text-emerald-900 font-black" : "text-emerald-300"}`}>
                    {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
                  </p>
                  <p className={`text-xs sm:text-sm font-black flex items-center gap-1 ${tab === "admin" ? "text-emerald-950" : "text-amber-300 font-mono"}`}>
                    {language === 'bn' ? 'কন্ট্রোল সেন্টার' : 'Control Center'}
                  </p>
                </div>
              </button>
              )}

              {/* Logged-in User Profile Picture — click for Change Password / Logout */}
              {auth.authEnabled && auth.user && (
                <div className="relative shrink-0">
                  <button
                    id="header-profile-menu-btn"
                    type="button"
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                    title={auth.profile?.name || (language === 'bn' ? "প্রোফাইল মেনু" : "Profile menu")}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-emerald-900/90 hover:bg-emerald-800 border-2 border-emerald-700/90 hover:border-amber-400/60 flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    {currentUserPhoto ? (
                      <img
                        src={currentUserPhoto}
                        alt={auth.profile?.name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CircleUserRound size={24} className="text-amber-300" />
                    )}
                  </button>

                  {showProfileMenu && (
                    <>
                      {/* Invisible backdrop — click outside the menu to close it */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-stone-200 z-50 overflow-hidden animate-in fade-in duration-150">
                        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {auth.profile?.name || (language === 'bn' ? 'অতিথি' : 'Guest')}
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                            {auth.profile?.mobile}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowChangePassword(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          <KeyRound size={15} className="text-emerald-700 shrink-0" />
                          {language === 'bn' ? 'নিজের পাসওয়ার্ড পরিবর্তন করুন' : 'Change Own Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            auth.signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer transition-colors border-t border-stone-100"
                        >
                          <LogOut size={15} className="shrink-0" />
                          {language === 'bn' ? 'লগ-আউট' : 'Logout'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Fully Localized & Smooth Horizontal Scroll */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "dashboard" as const, label: t.nav_dashboard },
            { id: "members" as const, label: `${t.nav_members} (${formatNumber(members.length)})` },
            { id: "deposits" as const, label: `${t.nav_deposits_ledger || t.nav_deposits} (${formatNumber(deposits.length)})` },
            { id: "bank" as const, label: t.nav_bank },
            { id: "invest" as const, label: t.nav_invest },
            { id: "fund" as const, label: t.nav_fund },
            {
              id: "voting" as const,
              label: (
                <span className="flex items-center gap-1.5">
                  <Vote size={14} />
                  {t.nav_voting_center || "ভোটিং ও নোটিফাই"}
                  {polls.some((p) => p.status === "active") && (
                    <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] rounded-full animate-pulse font-bold">
                      LIVE
                    </span>
                  )}
                </span>
              ),
            },
            {
              id: "profit_center" as const,
              label: (
                <span className="flex items-center gap-1.5">
                  <Percent size={13} />
                  {t.nav_profit_center || "প্রফিট সেন্টার (৫%+৯৫%)"}
                </span>
              ),
            },
            {
              id: "admin" as const,
              label: (
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-400" />
                  {language === "bn" ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
                </span>
              ),
            },
            { id: "constitution" as const, label: `${t.nav_constitution} (Constitution)` },
            { id: "downloads" as const, label: t.nav_downloads },
          ]
            .filter((tabItem) => tabItem.id !== "admin" || auth.isAdmin)
            .map((tabItem) => (
            <button
              key={tabItem.id}
              id={`tab-${tabItem.id}`}
              onClick={() => navigateToTab(tabItem.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                tab === tabItem.id
                  ? "bg-stone-100 text-emerald-950 font-black shadow-md border-t-2 border-amber-400"
                  : "text-emerald-300 hover:text-white hover:bg-emerald-900/60"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {tab === "dashboard" && (
          <Dashboard
            totalDeposit={totalDeposit}
            totalFine={totalFine}
            memberCount={members.length}
            monthlyTotals={monthlyTotals}
            maxMonthly={maxMonthly}
            recentDeposits={deposits.slice(0, 8)}
            members={members}
            onAddDeposit={auth.canManageEntries ? () => setShowAddDeposit(true) : undefined}
            bankBalance={bankBalance}
            investBalance={investBalance}
            totalProfit={totalProfit}
            fundNow={fundNow}
            totalMoney={totalMoney}
            cashInHand={cashInHand}
            tgsFromInvestProfit={twoFunds.tgsFromInvestProfit}
            tgsDirectIncomes={twoFunds.tgsDirectIncomes}
            onViewReceipt={(d) => setViewingReceiptDeposit(d)}
            activePolls={polls.filter((p) => p.status === "active")}
            notifications={notifications}
            onNavigateToVoting={() => navigateToTab("voting")}
            onNavigateToProfitCenter={() => navigateToTab("profit_center")}
            settings={settings}
          />
        )}

        {tab === "members" && !selectedMember && (
          <MembersList
            members={filteredMembers}
            query={query}
            setQuery={setQuery}
            onSelect={setSelectedUid}
            memberTotal={memberTotal}
            onAddMember={auth.isAdmin ? () => setShowAddMember(true) : undefined}
            bloodFilter={bloodFilter}
            setBloodFilter={setBloodFilter}
          />
        )}

        {tab === "members" && selectedMember && (
          <MemberDetail
            member={selectedMember}
            deposits={deposits.filter((d) => d.memberUid === selectedMember.uid)}
            total={memberTotal(selectedMember.uid)}
            onBack={() => setSelectedUid(null)}
            onAddDeposit={auth.canManageEntries ? () => setShowAddDeposit(true) : undefined}
            onViewReceipt={(d) => setViewingReceiptDeposit(d)}
            onEditMember={auth.isAdmin ? (m) => setEditingMember(m) : undefined}
            onDeleteMember={auth.isAdmin ? deleteMember : undefined}
            onDeleteDeposit={auth.isAdmin ? deleteDeposit : undefined}
          />
        )}

        {tab === "deposits" && (
          <DepositsLedger
            deposits={deposits}
            members={members}
            onAddDeposit={auth.canManageEntries ? () => setShowAddDeposit(true) : undefined}
            onViewReceipt={(d) => setViewingReceiptDeposit(d)}
            onDeleteDeposit={auth.isAdmin ? deleteDeposit : undefined}
          />
        )}

        {tab === "bank" && (
          <AccountLedgerPage
            title={language === 'bn' ? "ব্যাংক হিসাব" : "Bank Account"}
            balance={bankBalance}
            entries={bankWithBalance}
            onAdd={auth.canManageEntries ? () => setShowAddBank(true) : undefined}
            showPlace={false}
            onDeleteEntry={auth.isAdmin ? deleteBankEntry : undefined}
          />
        )}

        {tab === "invest" && (
          <AccountLedgerPage
            title={language === 'bn' ? "বিনিয়োগ" : "Investment"}
            balance={investBalance}
            entries={investWithBalance}
            onAdd={auth.canManageEntries ? () => setShowAddInvest(true) : undefined}
            showPlace={true}
            onDeleteEntry={auth.isAdmin ? deleteInvestEntry : undefined}
          />
        )}

        {tab === "fund" && (
          <FundExpensesPage
            fundIncome={fundIncome}
            expenses={expenses}
            investEntries={investEntries}
            fundTotal={fundTotal}
            expensesTotal={expensesTotal}
            fundNow={fundNow}
            onAddIncome={auth.canManageEntries ? () => setShowAddFundIncome(true) : undefined}
            onAddExpense={auth.canManageEntries ? () => setShowAddExpense(true) : undefined}
            onDeleteIncome={auth.isAdmin ? deleteFundIncome : undefined}
            onDeleteExpense={auth.isAdmin ? deleteExpense : undefined}
          />
        )}

        {tab === "constitution" && (
          <ConstitutionPage
            settings={settings}
            onUpdateSettings={(patch) => updateSettings(patch)}
            onOpenWatermarkSettings={() => setShowWatermarkModal(true)}
            isAdmin={auth.isAdmin}
          />
        )}

        {tab === "voting" && (
          <VotingNotifyCenter
            polls={polls}
            notifications={notifications}
            readNotificationIds={readNotificationIds}
            members={members}
            settings={settings}
            onSavePoll={savePoll}
            onDeletePoll={deletePoll}
            onCastVote={castVote}
            onSaveNotification={saveNotification}
            onDeleteNotification={deleteNotification}
            onMarkNotificationAsRead={markNotificationAsRead}
            onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
            onBackToDashboard={() => navigateToTab("dashboard")}
            currentMemberUid={auth.currentMemberUid}
            isAdmin={auth.isAdmin}
            canManagePolls={auth.canManageEntries}
          />
        )}

        {tab === "profit_center" && (
          <ProfitCenter
            members={members}
            deposits={deposits}
            investEntries={investEntries}
            settings={settings}
            profitDistributions={profitDistributions}
            onSaveDistribution={auth.canManageEntries ? saveProfitDistribution : undefined}
            onDeleteDistribution={auth.isAdmin ? deleteProfitDistribution : undefined}
          />
        )}

        {tab === "admin" && auth.isAdmin && (
          <AdminPanel
            members={members}
            deposits={deposits}
            bankEntries={bankEntries}
            investEntries={investEntries}
            fundIncome={fundIncome}
            expenses={expenses}
            settings={settings}
            polls={polls}
            notifications={notifications}
            onOpenAddMember={() => setShowAddMember(true)}
            onOpenAddDeposit={() => setShowAddDeposit(true)}
            onOpenAddBank={() => setShowAddBank(true)}
            onOpenAddInvest={() => setShowAddInvest(true)}
            onOpenAddFundIncome={() => setShowAddFundIncome(true)}
            onOpenAddExpense={() => setShowAddExpense(true)}
            onOpenCloudBackup={() => setShowCloudBackup(true)}
            onOpenSettings={(initialTab) => {
              setSettingsInitialTab(initialTab || "profile");
              setShowSettingsModal(true);
            }}
            onOpenWatermarkSettings={() => setShowWatermarkModal(true)}
            onNavigateToTab={(t) => navigateToTab(t)}
            onExportExcel={() => downloadExcel(members, deposits)}
          />
        )}

        {tab === "downloads" && (
          <DownloadsReportsPage
            members={members}
            deposits={deposits}
            bankEntries={bankEntries}
            investEntries={investEntries}
            fundIncome={fundIncome}
            expenses={expenses}
            settings={settings}
            onOpenWatermarkSettings={() => setShowWatermarkModal(true)}
          />
        )}
      </main>

      {/* Floating Quick Action Button - Only on Dashboard tab */}
      {tab === "dashboard" && (auth.isAdmin || auth.canManageEntries) && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2 z-40">
          {auth.isAdmin && (
          <button
            id="floating-add-member-btn"
            onClick={() => setShowAddMember(true)}
            className="hidden sm:flex bg-emerald-900 hover:bg-emerald-800 text-amber-300 rounded-xl shadow-lg px-3.5 py-2 items-center gap-1.5 transition-all border border-emerald-700 text-xs font-bold cursor-pointer"
          >
            <UserPlus size={15} />
            <span>{t.btn_add_member}</span>
          </button>
          )}

          {auth.canManageEntries && (
          <button
            id="floating-add-deposit-btn"
            onClick={() => setShowAddDeposit(true)}
            className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 rounded-xl sm:rounded-2xl shadow-xl px-4 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2 transition-all border border-emerald-950 text-xs sm:text-sm font-black cursor-pointer"
            aria-label={t.btn_add_deposit}
          >
            <PlusCircle size={18} />
            <span>{t.btn_add_deposit}</span>
          </button>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-950 text-amber-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-semibold z-50 border border-emerald-800 animate-in fade-in duration-200 max-w-[90vw] text-center">
          <Check size={18} className="text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Modals */}
      {showAddDeposit && (
        <AddDepositModal
          members={members}
          deposits={deposits}
          defaultUid={selectedUid}
          settings={settings}
          onClose={() => setShowAddDeposit(false)}
          onSubmit={(entry) => {
            addDeposit(entry);
            setShowAddDeposit(false);
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          nextSerial={members.length + 1}
          onClose={() => setShowAddMember(false)}
          onSubmit={(entry) => {
            addMember(entry);
            setShowAddMember(false);
          }}
        />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdate={(updated) => {
            updateMember(updated);
          }}
        />
      )}

      {showFineSettings && (
        <FineSettingsModal
          settings={settings}
          onClose={() => setShowFineSettings(false)}
          onSave={updateSettings}
          onOpenLogoUpload={() => setShowLogoUpload(true)}
          onOpenWatermarkSettings={() => setShowWatermarkModal(true)}
        />
      )}

      {showCloudBackup && (
        <CloudBackupModal
          data={currentAppData}
          onClose={() => setShowCloudBackup(false)}
          onRestoreData={restoreFullData}
          onNotify={flashToast}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {showAddBank && (
        <AddBankModal
          onClose={() => setShowAddBank(false)}
          onSubmit={(entry) => {
            addBankEntry(entry);
            setShowAddBank(false);
          }}
        />
      )}

      {showAddInvest && (
        <AddInvestModal
          onClose={() => setShowAddInvest(false)}
          onSubmit={(entry) => {
            addInvestEntry(entry);
            setShowAddInvest(false);
          }}
        />
      )}

      {showAddFundIncome && (
        <AddFundIncomeModal
          onClose={() => setShowAddFundIncome(false)}
          onSubmit={(entry) => {
            addFundIncome(entry);
            setShowAddFundIncome(false);
          }}
        />
      )}

      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSubmit={(entry) => {
            addExpense(entry);
            setShowAddExpense(false);
          }}
        />
      )}

      {viewingReceiptDeposit && (
        <ReceiptModal
          deposit={viewingReceiptDeposit}
          member={members.find((m) => m.uid === viewingReceiptDeposit.memberUid)}
          settings={settings}
          onClose={() => setViewingReceiptDeposit(null)}
          onUpdateSettings={updateSettings}
        />
      )}

      {/* 3-Line Sidebar Menu Drawer */}
      <SidebarDrawer
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeTab={tab}
        onSelectTab={(newTab) => {
          navigateToTab(newTab);
        }}
        membersCount={members.length}
        depositsCount={deposits.length}
        unreadNotifsCount={unreadNotifsCount}
        activePollsCount={activePollsCount}
        settings={settings}
        onOpenAddMember={() => setShowAddMember(true)}
        onOpenAddDeposit={() => setShowAddDeposit(true)}
        onOpenCloudBackup={() => setShowCloudBackup(true)}
        onOpenSettings={() => {
          setSettingsInitialTab("profile");
          setShowSettingsModal(true);
        }}
        onOpenAboutUs={() => setShowAboutUs(true)}
        onOpenLogoUpload={() => {
          setSettingsInitialTab("logo");
          setShowSettingsModal(true);
        }}
        onOpenWatermarkSettings={() => {
          setSettingsInitialTab("watermark");
          setShowSettingsModal(true);
        }}
        onOpenExitModal={() => setShowExitModal(true)}
        onSignOut={auth.authEnabled ? () => auth.signOut() : undefined}
        currentUserLabel={
          auth.profile
            ? `${auth.profile.mobile}${auth.profile.name ? " · " + auth.profile.name : ""} (${
                auth.isAdmin
                  ? "Admin"
                  : auth.isTreasurer
                  ? (language === "bn" ? "কোষাধ্যক্ষ/সম্পাদক" : "Treasurer/Secretary")
                  : "Member"
              })`
            : undefined
        }
        isAdmin={auth.isAdmin}
        canManageEntries={auth.canManageEntries}
        onOpenChangePassword={auth.authEnabled && auth.user ? () => setShowChangePassword(true) : undefined}
      />

      {/* Exit Application Confirmation Modal */}
      <ExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={() => {
          setShowExitModal(false);
          setIsExited(true);
        }}
        societyName={language === 'en' && settings.societyNameEn ? settings.societyNameEn : settings.societyName}
      />

      {/* Consolidated Software Settings & Customization Modal */}
      {showSettingsModal && (
        <UnifiedSettingsModal
          settings={settings}
          initialTab={settingsInitialTab}
          onClose={() => setShowSettingsModal(false)}
          onSaveSettings={(updatedSettings) => {
            updateSettings(updatedSettings);
            flashToast(
              language === "bn"
                ? "সফটওয়্যার সেটিংস সফলভাবে সংরক্ষিত হয়েছে!"
                : "Software settings saved successfully!"
            );
          }}
        />
      )}

      {/* About Us (আমাদের সম্পর্কে) Modal */}
      {showAboutUs && (
        <AboutUsModal
          settings={settings}
          onClose={() => setShowAboutUs(false)}
          canEdit={auth.isAdmin}
          onSaveAboutUs={(updatedAboutUs) => {
            updateSettings({ ...settings, aboutUs: updatedAboutUs });
            flashToast(
              language === "bn"
                ? "আমাদের সম্পর্কে তথ্য সফলভাবে সংরক্ষিত হয়েছে!"
                : "About Us information saved successfully!"
            );
          }}
          onUploadLogoClick={
            auth.isAdmin
              ? () => {
                  setShowAboutUs(false);
                  setSettingsInitialTab("logo");
                  setShowSettingsModal(true);
                }
              : undefined
          }
        />
      )}

      {/* Circular Logo Upload Modal */}
      {showLogoUpload && (
        <LogoUploadModal
          settings={settings}
          onClose={() => setShowLogoUpload(false)}
          onSaveLogo={(logoUrl) => {
            updateSettings({ ...settings, logoUrl });
            flashToast(
              logoUrl
                ? (language === "bn" ? "প্রতিষ্ঠানের গোল ছবি সফলভাবে আপডেট করা হয়েছে!" : "Society logo updated successfully!")
                : (language === "bn" ? "প্রতিষ্ঠানের ছবি সরানো হয়েছে।" : "Society logo removed.")
            );
          }}
        />
      )}

      {/* Separate Background Watermark Settings Modal */}
      {showWatermarkModal && (
        <WatermarkModal
          settings={settings}
          onClose={() => setShowWatermarkModal(false)}
          onSaveWatermark={(updatedSettings) => {
            updateSettings(updatedSettings);
            flashToast(
              language === "bn"
                ? "জলছাপ (Watermark) সেটিংস সফলভাবে সংরক্ষিত হয়েছে!"
                : "Watermark settings saved successfully!"
            );
          }}
        />
      )}
    </div>
  );
}
