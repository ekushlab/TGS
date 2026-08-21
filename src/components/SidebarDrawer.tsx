import React from 'react';
import {
  Menu,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Building,
  TrendingUp,
  Landmark,
  BookOpen,
  Download,
  UserPlus,
  PlusCircle,
  Database,
  Settings,
  Info,
  Camera,
  X,
  ChevronRight,
  ShieldCheck,
  Phone,
  Sparkles,
  Layers,
  Languages,
  Image as ImageIcon,
  LogOut,
  Vote,
  Bell,
  Percent,
  Smartphone,
} from 'lucide-react';
import { AppSettings } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

type TabKey = 'dashboard' | 'members' | 'deposits' | 'bank' | 'invest' | 'fund' | 'voting' | 'profit_center' | 'admin' | 'constitution' | 'downloads';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  membersCount: number;
  depositsCount: number;
  unreadNotifsCount?: number;
  activePollsCount?: number;
  settings: AppSettings;
  onOpenAddMember: () => void;
  onOpenAddDeposit: () => void;
  onOpenCloudBackup: () => void;
  onOpenSettings: () => void;
  onOpenAboutUs: () => void;
  onOpenLogoUpload: () => void;
  onOpenWatermarkSettings: () => void;
  onOpenExitModal: () => void;
  /** Only provided when Supabase login is active — shows a real "log out" entry. */
  onSignOut?: () => void;
  currentUserLabel?: string;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  membersCount,
  depositsCount,
  unreadNotifsCount = 0,
  activePollsCount = 0,
  settings,
  onOpenAddMember,
  onOpenAddDeposit,
  onOpenCloudBackup,
  onOpenSettings,
  onOpenAboutUs,
  onOpenLogoUpload,
  onOpenWatermarkSettings,
  onOpenExitModal,
  onSignOut,
  currentUserLabel,
}) => {
  const { language, t, formatNumber } = useLanguage();

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'dashboard' as const,
      label: language === 'bn' ? 'সারসংক্ষেপ (ড্যাশবোর্ড)' : 'Dashboard Summary',
      icon: LayoutDashboard,
      badge: null,
      desc: language === 'bn' ? 'সংক্ষিপ্ত পরিসংখ্যান ও ব্যালেন্স' : 'Financial overview & stats',
    },
    {
      id: 'members' as const,
      label: language === 'bn' ? 'সদস্য তালিকা ও প্রোফাইল' : 'Member Directory & Profiles',
      icon: Users,
      badge: `${formatNumber(membersCount)} ${language === 'bn' ? 'জন' : 'Members'}`,
      desc: language === 'bn' ? 'সদস্য পরিচিতি, নমিনী ও ছবি' : 'Passbook, ID card & details',
    },
    {
      id: 'deposits' as const,
      label: language === 'bn' ? 'সঞ্চয় জমার খতিয়ান' : 'Monthly Deposits Ledger',
      icon: FileSpreadsheet,
      badge: `${formatNumber(depositsCount)} ${language === 'bn' ? 'টি' : 'Entries'}`,
      desc: language === 'bn' ? 'মাসিক জমা, রসিদ ও জরিমানা' : 'Vouchers, receipts & fines',
    },
    {
      id: 'bank' as const,
      label: language === 'bn' ? 'ব্যাংক হিসাব' : 'Bank Ledger & Account',
      icon: Building,
      badge: null,
      desc: language === 'bn' ? 'ব্যাংক ডিপোজিট ও ব্যালেন্স' : 'Bank cashflow & balance',
    },
    {
      id: 'invest' as const,
      label: language === 'bn' ? 'বিনিয়োগ ও লাভ' : 'Investments & Business',
      icon: TrendingUp,
      badge: null,
      desc: language === 'bn' ? 'মূলধন খাটানো ও মুনাফা' : 'Capital assets & dividends',
    },
    {
      id: 'fund' as const,
      label: language === 'bn' ? 'টিজিএস ফান্ড (TGS Fund)' : 'Welfare Fund & Expenses',
      icon: Landmark,
      badge: null,
      desc: language === 'bn' ? 'বিশেষ তহবিল ও আলাদা আয়' : 'Grants, fees & office bills',
    },
    {
      id: 'voting' as const,
      label: language === 'bn' ? 'ভোটিং ও নোটিফাই সেন্টার' : 'Voting & Notice Center',
      icon: Vote,
      badge: activePollsCount > 0
        ? (language === 'bn' ? `🔴 লাইভ (${formatNumber(activePollsCount)})` : `🔴 Live (${activePollsCount})`)
        : unreadNotifsCount > 0
        ? (language === 'bn' ? `নতুন ${formatNumber(unreadNotifsCount)} টি` : `${unreadNotifsCount} New`)
        : null,
      badgeColor: activePollsCount > 0
        ? 'bg-red-500/20 text-red-300 border-red-400/40'
        : 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      desc: language === 'bn' ? 'লাইভ ভোটিং, নোটিশ বোর্ড ও ফলাফল রিপোর্ট' : 'Live polling, notices & audit report',
    },
    {
      id: 'profit_center' as const,
      label: language === 'bn' ? 'বিনিয়োগ প্রফিট সেন্টার' : 'Investment Profit Center',
      icon: Percent,
      badge: '৫% + ৯৫%',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      desc: language === 'bn' ? 'জমার অনুপাতে ৯৫% প্রফিট বণ্টন হিসাব' : 'Pro-rata 95% member profit calculation',
    },
    {
      id: 'admin' as const,
      label: language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel',
      icon: ShieldCheck,
      badge: language === 'bn' ? 'কন্ট্রোল' : 'Control',
      badgeColor: 'bg-amber-400/30 text-amber-200 border-amber-400/50',
      desc: language === 'bn' ? 'সদস্য এন্ট্রি, সঞ্চয়, সেটিংস, ভোটিং ও ব্যাকআপ' : 'Admin controls, settings & member management',
    },
    {
      id: 'constitution' as const,
      label: language === 'bn' ? 'গঠনতন্ত্র ও বিধিমালা (Constitution)' : 'Constitution & By-Laws',
      icon: BookOpen,
      badge: language === 'bn' ? 'অফিসিয়াল' : 'Official',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
      desc: language === 'bn' ? 'সংগঠনের নীতিমালা, টেক্সট ও ফাইল ডাউনলোড' : 'Rules, guidelines & PDF download',
    },
    {
      id: 'downloads' as const,
      label: language === 'bn' ? 'ডাউনলোড ও রিপোর্ট অপশন' : 'Downloads & Audit Reports',
      icon: Download,
      badge: 'PDF / Excel',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      desc: language === 'bn' ? 'অডিট শিট, মানি রসিদ ও কালেকশন বই' : 'Audit sheets & money receipts',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex animate-in fade-in duration-200 overscroll-contain select-none"
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-emerald-950/70 backdrop-blur-xs transition-opacity overscroll-contain touch-none cursor-pointer"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Drawer content */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm bg-emerald-950 text-amber-50 h-full flex flex-col shadow-2xl border-r border-emerald-900 overflow-hidden animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/90 bg-emerald-900/50">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Active Hamburger 3-line Menu Button: Remains visible and closes sidebar when clicked */}
              <button
                id="sidebar-active-menu-btn"
                type="button"
                onClick={onClose}
                title={language === 'bn' ? "মেনু বন্ধ করতে ক্লিক করুন" : "Click to close menu"}
                aria-label={language === 'bn' ? "মেনু বন্ধ করুন" : "Close menu"}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 border-2 border-amber-300 flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
              >
                <Menu size={22} className="stroke-[2.5]" />
              </button>

              {/* Circular Logo with Upload Button overlay */}
              <div className="relative group shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md border-2 border-amber-300">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={(language === 'en' && settings.societyNameEn) ? settings.societyNameEn : (settings.societyName || 'TGS Logo')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Landmark size={20} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogoUpload();
                  }}
                  title={language === 'bn' ? "লোগো পরিবর্তন / ছবি আপলোড" : "Change logo / upload picture"}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={15} />
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-white text-sm sm:text-base truncate">
                    {(language === 'en' && settings.societyNameEn) ? settings.societyNameEn : (settings.societyName || 'Trust Growth Society')}
                  </h3>
                </div>
                <p className="text-[10px] sm:text-[11px] text-emerald-300 truncate">
                  {language === 'en'
                    ? (settings.societySubtitleEn || settings.societyAddressEn || 'Ulania Bazar, Galachipa, Patuakhali')
                    : (settings.societySubtitle || settings.societyAddress || 'উলানিয়া বাজার, গলাচিপা, পটুয়াখালী')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              title={language === 'bn' ? "মেনু বন্ধ করুন" : "Close menu"}
              className="w-8 h-8 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-amber-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Change Logo & Watermark separate button banner */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              id="sidebar-logo-btn"
              onClick={() => {
                onClose();
                onOpenLogoUpload();
              }}
              className="py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 text-[10px] font-semibold flex items-center justify-between border border-emerald-800/80 transition-colors"
              title={language === 'bn' ? 'প্রতিষ্ঠানের গোল ছবি ও লোগো ক্রপ' : 'Change society circular logo'}
            >
              <span className="flex items-center gap-1 truncate">
                <Camera size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">{t.btn_change_logo}</span>
              </span>
              <ChevronRight size={11} className="text-emerald-400 shrink-0" />
            </button>

            <button
              id="sidebar-watermark-btn"
              onClick={() => {
                onClose();
                onOpenWatermarkSettings();
              }}
              className="py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-amber-300 text-[10px] font-semibold flex items-center justify-between border border-emerald-800/80 transition-colors"
              title={language === 'bn' ? 'রসিদ ও রিপোর্টের ব্যাকগ্রাউন্ড জলছাপ কনফিগারেশন' : 'Configure watermark settings'}
            >
              <span className="flex items-center gap-1 truncate">
                <Layers size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">{t.btn_watermark}</span>
              </span>
              <ChevronRight size={11} className="text-amber-400 shrink-0" />
            </button>
          </div>

          {/* Language Switcher in Drawer */}
          <div className="mt-2.5">
            <LanguageSwitcher variant="sidebar" />
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-emerald-800">
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold text-emerald-400">
            {t.nav_menu_title}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-amber-400 text-emerald-950 font-bold shadow-md'
                    : 'hover:bg-emerald-900/70 text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-950 text-amber-300'
                        : 'bg-emerald-900/80 text-amber-300 group-hover:bg-emerald-800'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">{item.label}</p>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-emerald-900' : 'text-emerald-400/80'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ml-1 ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-emerald-950 text-amber-300'
                        : 'bg-emerald-900 text-emerald-200 border border-emerald-800')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="my-2 border-t border-emerald-900/80 pt-2 px-3 text-[11px] uppercase tracking-wider font-bold text-emerald-400">
            {t.quick_actions}
          </div>

          <div className="grid grid-cols-2 gap-1.5 px-1">
            <button
              onClick={() => {
                onClose();
                onOpenAddMember();
              }}
              className="p-2 bg-emerald-900/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-xl text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center mb-1">
                <UserPlus size={14} />
              </div>
              <p className="text-[11px] font-bold text-white leading-tight">{t.btn_add_member}</p>
              <p className="text-[9px] text-emerald-300">{language === 'bn' ? 'ফরম এন্ট্রি' : 'New Form'}</p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAddDeposit();
              }}
              className="p-2 bg-emerald-900/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-xl text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-700 text-emerald-100 flex items-center justify-center mb-1">
                <PlusCircle size={14} />
              </div>
              <p className="text-[11px] font-bold text-white leading-tight">{t.btn_add_deposit}</p>
              <p className="text-[9px] text-emerald-300">{language === 'bn' ? 'রসিদ জেনারেট' : 'Get Receipt'}</p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCloudBackup();
              }}
              className="p-2 bg-emerald-900/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-xl text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-800 text-amber-300 flex items-center justify-center mb-1">
                <Database size={14} />
              </div>
              <p className="text-[11px] font-bold text-white leading-tight">{t.btn_cloud_backup}</p>
              <p className="text-[9px] text-emerald-300">JSON / Excel</p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="p-2 bg-emerald-900/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-xl text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-800 text-amber-300 flex items-center justify-center mb-1">
                <Settings size={14} />
              </div>
              <p className="text-[11px] font-bold text-white leading-tight">{t.btn_settings}</p>
              <p className="text-[9px] text-emerald-300">{language === 'bn' ? 'জরিমানা ও স্বাক্ষর' : 'Fines & Signs'}</p>
            </button>
          </div>
        </div>

        {/* Drawer Footer - Consolidated Settings & About Us */}
        <div className="p-3 border-t border-emerald-900/90 bg-emerald-950 space-y-2">
          {/* Prominent Comprehensive Settings Button at Bottom of Sidebar */}
          <button
            id="sidebar-settings-btn"
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 flex items-center justify-between transition-all shadow-md group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-amber-300 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Settings size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black leading-tight text-emerald-950">
                  {language === 'bn' ? 'সফটওয়্যার সেটিংস ও এডিটিং' : 'Software Settings & Customization'}
                </p>
                <p className="text-[10px] text-emerald-900/80 font-semibold">
                  {language === 'bn' ? 'প্রোফাইল, লোগো, ঠিকানা, জলছাপ ও ভাষা' : 'Profile, Logo, Address, Watermark & Language'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-emerald-950 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="sidebar-about-us-btn"
            type="button"
            onClick={() => {
              onClose();
              onOpenAboutUs();
            }}
            className="w-full p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-amber-100 border border-emerald-800/70 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
                <Info size={14} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-amber-200 leading-tight">{t.btn_about_us}</p>
                <p className="text-[9px] text-emerald-300">{language === 'bn' ? 'পরিচিতি ও লক্ষ্য' : 'Society overview & goals'}</p>
              </div>
            </div>
            <ChevronRight size={13} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Sign Out (Supabase login) Button */}
          {onSignOut && (
            <button
              id="sidebar-sign-out-btn"
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full p-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 border border-stone-700/60 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-stone-500/20 text-stone-300 flex items-center justify-center font-bold shrink-0">
                  <LogOut size={14} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-stone-200 leading-tight">
                    {language === 'bn' ? 'লগ-আউট করুন' : 'Log Out'}
                  </p>
                  <p className="text-[9px] text-stone-400/80">
                    {currentUserLabel || (language === 'bn' ? 'অ্যাকাউন্ট থেকে সাইন-আউট' : 'Sign out of your account')}
                  </p>
                </div>
              </div>
              <ChevronRight size={13} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Exit Application Button */}
          <button
            id="sidebar-exit-app-btn"
            type="button"
            onClick={() => {
              onClose();
              onOpenExitModal();
            }}
            className="w-full p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/60 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 flex items-center justify-center font-bold shrink-0">
                <LogOut size={14} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-red-200 leading-tight">
                  {language === 'bn' ? 'অ্যাপ থেকে প্রস্থান (Exit)' : 'Exit Application'}
                </p>
                <p className="text-[9px] text-red-400/80">
                  {language === 'bn' ? 'সেশন সমাপ্তি ও নিরাপদ প্রস্থান' : 'Close session safely'}
                </p>
              </div>
            </div>
            <ChevronRight size={13} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center justify-between text-[10px] text-emerald-400/80 px-2 pt-0.5">
            <span>TGS Ledger v2.5</span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-amber-400" />
              <span>{language === 'bn' ? 'নিরাপদ সিস্টেম' : 'Secure System'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
