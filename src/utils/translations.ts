import { createContext, useContext } from 'react';

export type Language = 'bn' | 'en';

export interface TranslationDictionary {
  // Navigation & Tabs
  nav_dashboard: string;
  nav_members: string;
  nav_deposits: string;
  nav_bank: string;
  nav_invest: string;
  nav_invest_ledger: string;
  nav_fund: string;
  nav_tgs_fund: string;
  nav_constitution: string;
  nav_downloads: string;
  nav_voting_center: string;
  nav_profit_center: string;
  nav_menu_title: string;
  nav_bank_ledger: string;
  nav_deposits_ledger: string;

  // Header & Top bar
  app_name: string;
  app_subtitle: string;
  search_placeholder: string;
  quick_actions: string;
  btn_add_deposit: string;
  btn_add_member: string;
  btn_cloud_backup: string;
  btn_settings: string;
  btn_about_us: string;
  btn_change_logo: string;
  btn_watermark: string;
  btn_export_excel: string;
  btn_menu_open: string;
  btn_menu_close: string;
  btn_cancel: string;
  btn_save: string;
  lang_toggle: string;
  lang_current: string;

  // Dashboard Cards & Stats
  stat_total_collection: string;
  stat_total_collection_sub: string;
  stat_total_balance: string;
  stat_total_balance_sub: string;
  stat_bank_reserve: string;
  stat_bank_reserve_sub: string;
  stat_invested_capital: string;
  stat_invested_capital_sub: string;
  stat_fund_balance: string;
  stat_fund_balance_sub: string;
  stat_total_members: string;
  stat_total_members_sub: string;
  stat_this_month_collection: string;
  stat_paid_members: string;
  stat_unpaid_members: string;

  // Dashboard Sections
  sec_quick_overview: string;
  sec_recent_activities: string;
  sec_defaulters_warning: string;
  sec_financial_breakdown: string;
  sec_capital_growth: string;
  sec_pending_deposits: string;
  view_all: string;
  no_data_found: string;

  // Members Module
  members_title: string;
  members_subtitle: string;
  members_search: string;
  members_total_count: string;
  btn_new_member: string;
  col_sl: string;
  col_photo: string;
  col_name: string;
  col_mobile: string;
  col_blood_group: string;
  col_joined_date: string;
  col_total_deposited: string;
  col_status: string;
  col_actions: string;
  status_active: string;
  status_regular: string;
  status_due: string;
  btn_view_details: string;
  btn_edit: string;
  btn_delete: string;
  member_detail_title: string;
  member_father_name: string;
  member_nid: string;
  member_address: string;
  member_email: string;
  member_passbook: string;
  member_lifetime_deposit: string;
  member_due_months: string;
  btn_print_passbook: string;
  btn_id_card: string;

  // Deposits & Receipts Module
  deposits_title: string;
  deposits_subtitle: string;
  deposits_search: string;
  filter_month: string;
  filter_all_months: string;
  filter_member: string;
  filter_all_members: string;
  filter_method: string;
  filter_all_methods: string;
  col_receipt_no: string;
  col_date: string;
  col_member_name: string;
  col_for_month: string;
  col_amount: string;
  col_fine: string;
  col_total: string;
  col_method: string;
  col_attachment: string;
  btn_view_receipt: string;
  btn_print_receipt: string;
  receipt_title: string;
  receipt_voucher_no: string;
  receipt_received_from: string;
  receipt_amount_in_words: string;
  receipt_collector_sign: string;
  receipt_president_sign: string;

  // Bank & Investment
  bank_title: string;
  bank_subtitle: string;
  invest_title: string;
  invest_subtitle: string;
  btn_add_bank_entry: string;
  btn_add_invest_entry: string;
  col_desc: string;
  col_in: string;
  col_out: string;
  col_balance: string;
  col_dividend: string;
  col_deed_slip: string;

  // Fund & Expenses
  fund_title: string;
  fund_subtitle: string;
  btn_add_fund_income: string;
  btn_add_expense: string;
  sec_fund_income_list: string;
  sec_expense_list: string;
  col_expense_desc: string;
  col_invoice_no: string;

  // Downloads & Reports
  reports_title: string;
  reports_subtitle: string;
  rep_monthly_sheet: string;
  rep_monthly_sheet_desc: string;
  rep_audit_statement: string;
  rep_audit_statement_desc: string;
  rep_members_list_pdf: string;
  rep_members_list_pdf_desc: string;
  rep_all_receipts_pdf: string;
  rep_all_receipts_pdf_desc: string;
  rep_backup_json: string;
  rep_backup_json_desc: string;
  btn_download: string;
  btn_print: string;

  // Constitution & Rules
  constitution_title: string;
  constitution_subtitle: string;
  btn_edit_constitution: string;
  btn_upload_pdf: string;
  btn_download_pdf: string;
  last_updated: string;

  // Modals & Common Form Fields
  modal_save: string;
  modal_cancel: string;
  modal_update: string;
  modal_confirm_delete: string;
  modal_close: string;
  modal_upload_photo: string;
  modal_notes: string;
  modal_select_date: string;
  modal_select_month: string;
  modal_amount: string;
  modal_fine_amount: string;
  modal_payment_method: string;

  // Toast Messages
  toast_saved_success: string;
  toast_updated_success: string;
  toast_deleted_success: string;
  toast_backup_created: string;
  toast_backup_restored: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  bn: {
    // Navigation & Tabs
    nav_dashboard: "ড্যাশবোর্ড",
    nav_members: "সদস্যবৃন্দ",
    nav_deposits: "মাসিক জমা লেজার",
    nav_deposits_ledger: "জমার খতিয়ান",
    nav_bank: "ব্যাংক হিসাব",
    nav_bank_ledger: "ব্যাংক খতিয়ান",
    nav_invest: "ব্যবসা ও বিনিয়োগ",
    nav_invest_ledger: "বিনিয়োগ লেজার",
    nav_fund: "সংগঠন তহবিল ও খরচ",
    nav_tgs_fund: "টিজিএস ফান্ড ও খরচ",
    nav_constitution: "গঠনতন্ত্র ও বিধিমালা",
    nav_downloads: "ডাউনলোড ও রিপোর্ট",
    nav_voting_center: "ভোটিং এন্ড নোটিফাই সেন্টার",
    nav_profit_center: "বিনিয়োগ প্রফিট সেন্টার",
    nav_menu_title: "প্রধান মেনু ও মডিউলসমূহ",

    // Header & Top bar
    app_name: "Trust Growth Society",
    app_subtitle: "উলানিয়া বাজার, গলাচিপা, পটুয়াখালী",
    search_placeholder: "সদস্যের নাম, মোবাইল বা ট্রানজেকশন খুঁজুন...",
    quick_actions: "দ্রুত অ্যাকশন",
    btn_add_deposit: "টাকা জমা",
    btn_add_member: "নতুন সদস্য",
    btn_cloud_backup: "ব্যাকআপ ও রিস্টোর",
    btn_settings: "সেটিংস",
    btn_about_us: "আমাদের সম্পর্কে",
    btn_change_logo: "লোগো পরিবর্তন",
    btn_watermark: "জলছাপ (Watermark)",
    btn_export_excel: "এক্সেল এক্সপোর্ট",
    btn_menu_open: "মেনু খুলুন",
    btn_menu_close: "মেনু বন্ধ করুন",
    btn_cancel: "বাতিল",
    btn_save: "সংরক্ষণ করুন",
    lang_toggle: "English",
    lang_current: "বাংলা",

    // Dashboard Cards & Stats
    stat_total_collection: "মোট সঞ্চয় আদায়",
    stat_total_collection_sub: "সকল সদস্যের সর্বমোট জমা",
    stat_total_balance: "বর্তমান মোট তহবিল",
    stat_total_balance_sub: "নগদ + ব্যাংক + বিনিয়োগ স্থিতি",
    stat_bank_reserve: "ব্যাংক রিজার্ভ স্থিতি",
    stat_bank_reserve_sub: "ব্যাংক অ্যাকাউন্টে সংরক্ষিত অর্থ",
    stat_invested_capital: "চলমান ব্যবসায় বিনিয়োগ",
    stat_invested_capital_sub: "বিভিন্ন খাতে বিনিয়োগকৃত মূলধন",
    stat_fund_balance: "সংগঠন কল্যাণ তহবিল",
    stat_fund_balance_sub: "জরিমানা ও অনুদান থেকে অবশিষ্ট",
    stat_total_members: "মোট সক্রিয় সদস্য",
    stat_total_members_sub: "সংগঠনের নিবন্ধিত সদস্য",
    stat_this_month_collection: "চলতি মাসের আদায়",
    stat_paid_members: "পরিশোধিত সদস্য",
    stat_unpaid_members: "বকেয়া সদস্য",

    // Dashboard Sections
    sec_quick_overview: "আর্থিক সারসংক্ষেপ",
    sec_recent_activities: "সাম্প্রতিক লেনদেনসমূহ",
    sec_defaulters_warning: "চলতি মাসের বকেয়া তালিকা",
    sec_financial_breakdown: "তহবিল বণ্টন ও মূলধন বিভাজন",
    sec_capital_growth: "মাসভিত্তিক সঞ্চয় প্রবৃদ্ধি",
    sec_pending_deposits: "অপেক্ষমাণ কিস্তি",
    view_all: "সবগুলো দেখুন",
    no_data_found: "কোনো তথ্য পাওয়া যায়নি",

    // Members Module
    members_title: "সদস্য তালিকা ও প্রোফাইল",
    members_subtitle: "সংগঠনের সকল সদস্যের বিস্তারিত তথ্য ও লেজার বিবরণী",
    members_search: "সদস্য অনুসন্ধান...",
    members_total_count: "জন সদস্য",
    btn_new_member: "নতুন সদস্য যোগ করুন",
    col_sl: "নং",
    col_photo: "ছবি",
    col_name: "নাম",
    col_mobile: "মোবাইল নম্বর",
    col_blood_group: "রক্তের গ্রুপ",
    col_joined_date: "যোগদানের তারিখ",
    col_total_deposited: "সর্বমোট জমা",
    col_status: "স্ট্যাটাস",
    col_actions: "অ্যাকশন",
    status_active: "সক্রিয়",
    status_regular: "নিয়মিত",
    status_due: "বকেয়া আছে",
    btn_view_details: "বিস্তারিত প্রোফাইল",
    btn_edit: "সম্পাদনা",
    btn_delete: "মুছে ফেলুন",
    member_detail_title: "সদস্যের ব্যক্তিগত পাসবুক ও প্রোফাইল",
    member_father_name: "পিতার নাম",
    member_nid: "এনআইডি / জন্ম নিবন্ধন",
    member_address: "ঠিকানা",
    member_email: "ইমেইল",
    member_passbook: "মাসিক জমার পাসবুক",
    member_lifetime_deposit: "আজীবন মোট সঞ্চয়",
    member_due_months: "বকেয়া মাসসমূহ",
    btn_print_passbook: "পাসবুক প্রিন্ট করুন",
    btn_id_card: "সদস্য আইডি কার্ড",

    // Deposits & Receipts Module
    deposits_title: "মাসিক সঞ্চয় ও কিস্তি লেজার",
    deposits_subtitle: "সকল সদস্যের নিয়মিত মাসিক সঞ্চয় ও জরিমানা আদায়ের হিসাব",
    deposits_search: "সদস্যের নাম বা রসিদ নং দিয়ে খুঁজুন...",
    filter_month: "মাস নির্বাচন করুন",
    filter_all_months: "সকল মাস",
    filter_member: "সদস্য নির্বাচন করুন",
    filter_all_members: "সকল সদস্য",
    filter_method: "পেমেন্ট মাধ্যম",
    filter_all_methods: "সকল মাধ্যম",
    col_receipt_no: "রসিদ নং",
    col_date: "তারিখ",
    col_member_name: "সদস্যের নাম",
    col_for_month: "যে মাসের জমা",
    col_amount: "জমার পরিমাণ",
    col_fine: "বিলম্ব ফি/জরিমানা",
    col_total: "সর্বমোট",
    col_method: "মাধ্যম",
    col_attachment: "স্লিপ/রসিদ",
    btn_view_receipt: "রসিদ দেখুন",
    btn_print_receipt: "রসিদ প্রিন্ট",
    receipt_title: "টাকা প্রাপ্তি রসিদ (MONEY RECEIPT)",
    receipt_voucher_no: "রসিদ / ভাউচার নং",
    receipt_received_from: "আদায়কৃত সদস্যের নাম",
    receipt_amount_in_words: "কথায় (টাকা)",
    receipt_collector_sign: "আদায়কারী / কোষাধ্যক্ষ",
    receipt_president_sign: "সভাপতি / সাধারণ সম্পাদক",

    // Bank & Investment
    bank_title: "ব্যাংক হিসাব ও লেনদেন লেজার",
    bank_subtitle: "ব্যাংক অ্যাকাউন্টে টাকা জমা ও উত্তোলনের সম্পূর্ণ খতিয়ান",
    invest_title: "ব্যবসা ও লাভজনক বিনিয়োগ হিসাব",
    invest_subtitle: "বিভিন্ন লাভজনক খাতে বিনিয়োগকৃত মূলধন ও লভ্যাংশ অর্জনের হিসাব",
    btn_add_bank_entry: "নতুন ব্যাংক লেনদেন",
    btn_add_invest_entry: "নতুন বিনিয়োগ যোগ করুন",
    col_desc: "বিবরণ / খাত",
    col_in: "জমা / মূলধন (+) ",
    col_out: "উত্তোলন / ফেরত (-) ",
    col_balance: "স্থিতি / ব্যালেন্স",
    col_dividend: "লভ্যাংশ / মুনাফা",
    col_deed_slip: "ডকুমেন্ট / চেক",

    // Fund & Expenses
    fund_title: "সংগঠন কল্যাণ তহবিল ও অফিস খরচ",
    fund_subtitle: "জরিমানা ও অনুদান থেকে অর্জিত তহবিল এবং প্রাতিষ্ঠানিক খরচের বিবরণী",
    btn_add_fund_income: "তহবিলে অনুদান/আয় যোগ",
    btn_add_expense: "অফিস খরচ ভাউচার যোগ",
    sec_fund_income_list: "কল্যাণ তহবিলের আয়ের তালিকা",
    sec_expense_list: "অফিস ও প্রাতিষ্ঠানিক খরচের তালিকা",
    col_expense_desc: "খরচের বিবরণ",
    col_invoice_no: "ভাউচার নং",

    // Downloads & Reports
    reports_title: "ডকুমেন্ট ডাউনলোড ও অডিট রিপোর্ট",
    reports_subtitle: "মাসিক অডিট স্টেটমেন্ট, এক্সেল ফাইল ও পিডিএফ প্রিন্ট প্রস্তুত করুন",
    rep_monthly_sheet: "মাসিক সঞ্চয় ও অডিট বিবরণী",
    rep_monthly_sheet_desc: "সকল সদস্যের মাসভিত্তিক মোট সঞ্চয় ও বকেয়ার পূর্ণাঙ্গ স্টেটমেন্ট",
    rep_audit_statement: "বার্ষিক সামগ্রিক আর্থিক প্রতিবেদন",
    rep_audit_statement_desc: "ব্যাংক, বিনিয়োগ ও তহবিলের সামগ্রিক ব্যালেন্স শিট",
    rep_members_list_pdf: "সদস্য তালিকা ও ফোন ডিরেক্টরি",
    rep_members_list_pdf_desc: "সকল সদস্যের যোগাযোগের নম্বর, রক্ত ও ঠিকানার তালিকা",
    rep_all_receipts_pdf: "একত্রে সকল মানি রসিদ প্রিন্ট",
    rep_all_receipts_pdf_desc: "নির্বাচিত মাসের সকল সদস্যের রসিদ এক ক্লিকে প্রিন্ট",
    rep_backup_json: "পূর্ণাঙ্গ ডাটাবেজ ব্যাকআপ (JSON)",
    rep_backup_json_desc: "সফটওয়্যারের সকল হিসাব সুরক্ষিত রাখতে ফাইল সেভ করুন",
    btn_download: "ডাউনলোড",
    btn_print: "প্রিন্ট করুন",

    // Constitution & Rules
    constitution_title: "সংগঠনের গঠনতন্ত্র ও নীতিমালা",
    constitution_subtitle: "ট্রাস্ট গ্রোথ সোসাইটির মূল কার্যপ্রণালী, সঞ্চয় ও বিনিয়োগ বিধিমালা",
    btn_edit_constitution: "গঠনতন্ত্র সম্পাদনা",
    btn_upload_pdf: "পিডিএফ আপলোড",
    btn_download_pdf: "পিডিএফ ডাউনলোড",
    last_updated: "সর্বশেষ সংস্করণ",

    // Modals & Common Form Fields
    modal_save: "সংরক্ষণ করুন",
    modal_cancel: "বাতিল",
    modal_update: "আপডেট করুন",
    modal_confirm_delete: "আপনি কি নিশ্চিতভাবে মুছে ফেলতে চান?",
    modal_close: "বন্ধ করুন",
    modal_upload_photo: "ছবি আপলোড করুন",
    modal_notes: "মন্তব্য / নোট",
    modal_select_date: "তারিখ নির্বাচন করুন",
    modal_select_month: "মাস নির্বাচন করুন",
    modal_amount: "টাকার পরিমাণ",
    modal_fine_amount: "বিলম্ব ফি (জরিমানা)",
    modal_payment_method: "অর্থ জমার মাধ্যম",

    // Toast Messages
    toast_saved_success: "সফলভাবে সংরক্ষিত হয়েছে!",
    toast_updated_success: "সফলভাবে আপডেট করা হয়েছে!",
    toast_deleted_success: "সফলভাবে মুছে ফেলা হয়েছে!",
    toast_backup_created: "ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!",
    toast_backup_restored: "ডাটা সফলভাবে রিস্টোর হয়েছে!",
  },

  en: {
    // Navigation & Tabs
    nav_dashboard: "Dashboard",
    nav_members: "Members",
    nav_deposits: "Monthly Deposits",
    nav_deposits_ledger: "Deposits Ledger",
    nav_bank: "Bank Ledger",
    nav_bank_ledger: "Bank Ledger",
    nav_invest: "Investments",
    nav_invest_ledger: "Investments Ledger",
    nav_fund: "Welfare & Expenses",
    nav_tgs_fund: "TGS Fund & Expenses",
    nav_constitution: "Constitution",
    nav_downloads: "Reports & Downloads",
    nav_voting_center: "Voting & Notify Center",
    nav_profit_center: "Investment Profit Center",
    nav_menu_title: "Main Modules & Menu",

    // Header & Top bar
    app_name: "Trust Growth Society",
    app_subtitle: "Ulania Bazar, Galachipa, Patuakhali",
    search_placeholder: "Search member name, phone or transaction...",
    quick_actions: "Quick Actions",
    btn_add_deposit: "Add Deposit",
    btn_add_member: "New Member",
    btn_cloud_backup: "Backup & Restore",
    btn_settings: "Settings",
    btn_about_us: "About Us",
    btn_change_logo: "Change Logo",
    btn_watermark: "Watermark Settings",
    btn_export_excel: "Export Excel",
    btn_menu_open: "Open Menu",
    btn_menu_close: "Close Menu",
    btn_cancel: "Cancel",
    btn_save: "Save Changes",
    lang_toggle: "বাংলা",
    lang_current: "English",

    // Dashboard Cards & Stats
    stat_total_collection: "Total Savings Collected",
    stat_total_collection_sub: "Lifetime deposits by all members",
    stat_total_balance: "Net Capital Balance",
    stat_total_balance_sub: "Cash + Bank + Investment reserves",
    stat_bank_reserve: "Bank Account Reserve",
    stat_bank_reserve_sub: "Current balance in bank account",
    stat_invested_capital: "Invested Business Capital",
    stat_invested_capital_sub: "Active capital in profitable ventures",
    stat_fund_balance: "Welfare Fund Balance",
    stat_fund_balance_sub: "Available from fees & grants",
    stat_total_members: "Total Active Members",
    stat_total_members_sub: "Registered society members",
    stat_this_month_collection: "This Month Collection",
    stat_paid_members: "Paid Members",
    stat_unpaid_members: "Due / Unpaid",

    // Dashboard Sections
    sec_quick_overview: "Financial Summary",
    sec_recent_activities: "Recent Transactions",
    sec_defaulters_warning: "Current Month Due List",
    sec_financial_breakdown: "Fund Allocation & Asset Breakdown",
    sec_capital_growth: "Monthly Savings Growth",
    sec_pending_deposits: "Pending Installments",
    view_all: "View All",
    no_data_found: "No records found",

    // Members Module
    members_title: "Member Directory & Profiles",
    members_subtitle: "Complete member details, contact information, and deposit history",
    members_search: "Search members by name, phone, NID...",
    members_total_count: "Total Members",
    btn_new_member: "Add New Member",
    col_sl: "SL",
    col_photo: "Photo",
    col_name: "Name",
    col_mobile: "Mobile Number",
    col_blood_group: "Blood Group",
    col_joined_date: "Joining Date",
    col_total_deposited: "Total Deposited",
    col_status: "Status",
    col_actions: "Actions",
    status_active: "Active",
    status_regular: "Regular",
    status_due: "Has Dues",
    btn_view_details: "View Profile",
    btn_edit: "Edit",
    btn_delete: "Delete",
    member_detail_title: "Member Passbook & Profile",
    member_father_name: "Father's Name",
    member_nid: "NID / Birth Certificate",
    member_address: "Address",
    member_email: "Email",
    member_passbook: "Monthly Deposit Passbook",
    member_lifetime_deposit: "Lifetime Total Savings",
    member_due_months: "Due Months",
    btn_print_passbook: "Print Passbook",
    btn_id_card: "Member ID Card",

    // Deposits & Receipts Module
    deposits_title: "Monthly Savings & Deposit Ledger",
    deposits_subtitle: "Record and manage monthly member installments and late fee fines",
    deposits_search: "Search by member name or receipt #...",
    filter_month: "Select Month",
    filter_all_months: "All Months",
    filter_member: "Select Member",
    filter_all_members: "All Members",
    filter_method: "Payment Method",
    filter_all_methods: "All Methods",
    col_receipt_no: "Receipt #",
    col_date: "Date",
    col_member_name: "Member Name",
    col_for_month: "Deposit Month",
    col_amount: "Deposit Amount",
    col_fine: "Late Fee / Fine",
    col_total: "Total Amount",
    col_method: "Method",
    col_attachment: "Receipt Slip",
    btn_view_receipt: "View Receipt",
    btn_print_receipt: "Print Receipt",
    receipt_title: "MONEY RECEIPT & VOUCHER",
    receipt_voucher_no: "Receipt / Voucher #",
    receipt_received_from: "Received From (Member)",
    receipt_amount_in_words: "Amount in Words",
    receipt_collector_sign: "Collector / Treasurer",
    receipt_president_sign: "President / Secretary",

    // Bank & Investment
    bank_title: "Bank Account & Cash Ledger",
    bank_subtitle: "Full statement of deposits and withdrawals from bank accounts",
    invest_title: "Business & Investment Accounts",
    invest_subtitle: "Tracking invested capital, asset portfolios, and profit dividends",
    btn_add_bank_entry: "New Bank Entry",
    btn_add_invest_entry: "New Investment Entry",
    col_desc: "Description / Purpose",
    col_in: "Deposit / In (+) ",
    col_out: "Withdrawal / Out (-) ",
    col_balance: "Running Balance",
    col_dividend: "Dividend / Profit",
    col_deed_slip: "Deed / Check Slip",

    // Fund & Expenses
    fund_title: "Society Welfare Fund & Expenses",
    fund_subtitle: "Grants, late fees, welfare balance, and operational expenses",
    btn_add_fund_income: "Add Fund Income",
    btn_add_expense: "Add Expense Voucher",
    sec_fund_income_list: "Welfare Fund Income History",
    sec_expense_list: "Operational & Institutional Expenses",
    col_expense_desc: "Expense Purpose",
    col_invoice_no: "Voucher / Bill #",

    // Downloads & Reports
    reports_title: "Reports & Documents Download",
    reports_subtitle: "Generate monthly audit statements, print vouchers, and export Excel",
    rep_monthly_sheet: "Monthly Savings Statement",
    rep_monthly_sheet_desc: "Detailed ledger sheet of deposits and dues for all members",
    rep_audit_statement: "Annual Financial Audit Report",
    rep_audit_statement_desc: "Comprehensive balance sheet of Bank, Investments, and Funds",
    rep_members_list_pdf: "Member Contact Directory",
    rep_members_list_pdf_desc: "List of all member phone numbers, blood groups, and addresses",
    rep_all_receipts_pdf: "Bulk Money Receipts Print",
    rep_all_receipts_pdf_desc: "Print all monthly money receipts for the selected period",
    rep_backup_json: "Complete Database Backup (JSON)",
    rep_backup_json_desc: "Export and save entire software data safely to your computer",
    btn_download: "Download",
    btn_print: "Print Report",

    // Constitution & Rules
    constitution_title: "Constitution & Society By-Laws",
    constitution_subtitle: "Official guidelines, rules, savings schedule, and investment terms",
    btn_edit_constitution: "Edit Constitution",
    btn_upload_pdf: "Upload PDF",
    btn_download_pdf: "Download PDF",
    last_updated: "Last Updated",

    // Modals & Common Form Fields
    modal_save: "Save Information",
    modal_cancel: "Cancel",
    modal_update: "Update",
    modal_confirm_delete: "Are you sure you want to delete this record?",
    modal_close: "Close",
    modal_upload_photo: "Upload Photo",
    modal_notes: "Notes & Remarks",
    modal_select_date: "Select Date",
    modal_select_month: "Select Month",
    modal_amount: "Amount (BDT)",
    modal_fine_amount: "Late Fine (BDT)",
    modal_payment_method: "Payment Method",

    // Toast Messages
    toast_saved_success: "Saved successfully!",
    toast_updated_success: "Updated successfully!",
    toast_deleted_success: "Deleted successfully!",
    toast_backup_created: "Backup file downloaded successfully!",
    toast_backup_restored: "Data restored successfully!",
  }
};

export const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export const EN_METHODS = ["Cash in Hand", "bKash", "Nagad", "Rocket", "Bank Deposit"];
export const BN_METHODS = ["হাতে নগদ", "বিকাশ", "নগদ (মোবাইল)", "রকেট", "ব্যাংক ডিপোজিট"];

/**
 * Translate Month Name between Bengali and English
 */
export function formatMonthName(monthStr: string, lang: Language): string {
  if (!monthStr) return "";
  const parts = monthStr.trim().split(" ");
  const mName = parts[0];
  const yName = parts[1] || "";

  let monthIndex = BN_MONTHS.indexOf(mName);
  if (monthIndex === -1) {
    monthIndex = EN_MONTHS.indexOf(mName);
  }

  if (monthIndex === -1) return monthStr;

  if (lang === "en") {
    // English month + english year
    const enYear = yName ? toEnDigits(yName) : "";
    return `${EN_MONTHS[monthIndex]} ${enYear}`.trim();
  } else {
    // Bengali month + bengali year
    const bnYear = yName ? toBnDigits(yName) : "";
    return `${BN_MONTHS[monthIndex]} ${bnYear}`.trim();
  }
}

/**
 * Format Payment Method between Bengali and English
 */
export function formatPaymentMethod(methodStr: string, lang: Language): string {
  if (!methodStr) return "";
  const index = BN_METHODS.indexOf(methodStr);
  if (index !== -1) {
    return lang === 'en' ? EN_METHODS[index] : BN_METHODS[index];
  }
  const enIndex = EN_METHODS.indexOf(methodStr);
  if (enIndex !== -1) {
    return lang === 'en' ? EN_METHODS[enIndex] : BN_METHODS[enIndex];
  }
  return methodStr;
}

export const BN_DIGITS: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
};

export const EN_DIGITS: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
};

export function toBnDigits(n: number | string): string {
  return String(n)
    .split("")
    .map((c) => BN_DIGITS[c] ?? c)
    .join("");
}

export function toEnDigits(n: number | string): string {
  return String(n)
    .split("")
    .map((c) => EN_DIGITS[c] ?? c)
    .join("");
}

export function formatNum(n: number | string | undefined, lang: Language = 'bn'): string {
  if (n === undefined || n === null) return "";
  if (lang === 'en') {
    return toEnDigits(n);
  }
  return toBnDigits(n);
}

/**
 * Format Unique ID - ALWAYS returns strictly English digits/alphanumeric regardless of selected language
 */
export function formatUid(uid: string | number | undefined): string {
  if (uid === undefined || uid === null) return "";
  return toEnDigits(uid);
}

export function formatCurrencyValue(n: number | string | undefined, lang: Language = 'bn'): string {
  const num = Number(toEnDigits(n || 0));
  if (isNaN(num)) return lang === 'en' ? "৳ 0" : "৳ ০";
  const formatted = num.toLocaleString("en-US");
  if (lang === 'en') {
    return `৳ ${formatted}`;
  }
  return `৳ ${toBnDigits(formatted)}`;
}

export function getLocalizedMonths(count = 12, from = new Date(), lang: Language = 'bn'): string[] {
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    if (lang === 'en') {
      list.push(`${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    } else {
      list.push(`${BN_MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear())}`);
    }
  }
  return list;
}
