import React, { useState, useRef, useEffect } from "react";
import {
  Vote,
  Bell,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Image as ImageIcon,
  Clock,
  Timer,
  Users,
  ShieldCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  Search,
  Pin,
  Flame,
  Check,
  X,
  Printer,
  Award,
  Eye,
  Trash2,
  BarChart3,
  ListOrdered,
  Layers,
  HelpCircle,
  Send,
  Upload,
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
  FileDown,
  Paperclip,
  Maximize2,
  UserCheck,
  Inbox,
  Share2,
  RotateCcw,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toPng, toJpeg } from "html-to-image";
import {
  Member,
  Poll,
  PollOption,
  PollVote,
  AppNotification,
  AppSettings,
} from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { TgsLogoSvg, PageWatermark } from "./TgsLogoWatermark";
import { STORAGE_MIME_TYPES, openFilePickerWithStorage } from "../utils/fileStorage";

interface VotingNotifyCenterProps {
  polls: Poll[];
  notifications: AppNotification[];
  members: Member[];
  settings: AppSettings;
  onSavePoll: (poll: Poll) => void;
  onDeletePoll: (pollId: string) => void;
  onCastVote: (vote: PollVote) => void;
  onSaveNotification: (notif: AppNotification) => void;
  onDeleteNotification: (notifId: string) => void;
  readNotificationIds?: string[];
  onMarkNotificationAsRead?: (notifId: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  initialSubTab?: "voting" | "notices" | "admin" | "reports";
  onBackToDashboard?: () => void;
  /** The Member.uid linked to the logged-in account, if any (enables real voting). */
  currentMemberUid?: string | null;
  isAdmin?: boolean;
}

export function VotingNotifyCenter({
  polls,
  notifications,
  members,
  settings,
  onSavePoll,
  onDeletePoll,
  onCastVote,
  onSaveNotification,
  onDeleteNotification,
  readNotificationIds = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  initialSubTab = "voting",
  onBackToDashboard,
  currentMemberUid,
  isAdmin,
}: VotingNotifyCenterProps) {
  const { language, t, formatNumber, formatUid } = useLanguage();
  const [subTab, setSubTab] = useState<"voting" | "notices" | "reports" | "admin">(initialSubTab);

  // Monthly Period & Archive Filter State
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>("current"); // "current" | "all_archive" | "MM/YYYY"

  // Voting Selection State
  const [selectedPollId, setSelectedPollId] = useState<string>(
    polls.find((p) => p.status === "active")?.id || (polls[0]?.id ?? "")
  );
  const [voterMemberUid, setVoterMemberUid] = useState<string>(currentMemberUid || "");

  // Keep the voter locked to the logged-in member — no free-text/dropdown
  // selection of someone else's ID.
  useEffect(() => {
    setVoterMemberUid(currentMemberUid || "");
  }, [currentMemberUid]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [voterComment, setVoterComment] = useState<string>("");
  const [voteSuccessMsg, setVoteSuccessMsg] = useState<string>("");
  const [voteErrorMsg, setVoteErrorMsg] = useState<string>("");

  // Report Modal / Preview States
  const [viewingReportPoll, setViewingReportPoll] = useState<Poll | null>(null);
  const [reportType, setReportType] = useState<"results" | "voters">("results");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "jpg" | null>(null);

  // Notice Viewing Modal States
  const [viewingNotice, setViewingNotice] = useState<AppNotification | null>(null);
  const [viewingNoticeAttachment, setViewingNoticeAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isExportingNotice, setIsExportingNotice] = useState<boolean>(false);

  // Member Inbox Modal State
  const [inboxMemberUid, setInboxMemberUid] = useState<string | null>(null);

  // Admin Security / Direct Access (PIN disabled for seamless admin experience)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(true);
  const [adminPinInput, setAdminPinInput] = useState<string>("");
  const [adminPinError, setAdminPinError] = useState<string>("");

  // Admin New Poll State
  const [newPollTitle, setNewPollTitle] = useState("");
  const [newPollDesc, setNewPollDesc] = useState("");
  const [newPollCategory, setNewPollCategory] = useState<Poll["category"]>("investment");
  const [newPollStartDate, setNewPollStartDate] = useState(
    new Date().toLocaleDateString("en-GB")
  );
  const [pollDurationLimit, setPollDurationLimit] = useState<string>("48"); // default 48 hours (2 days)
  const [customDurationHours, setCustomDurationHours] = useState<number>(48);
  const [newPollEndDate, setNewPollEndDate] = useState(
    new Date(Date.now() + 48 * 3600000).toLocaleDateString("en-GB")
  );
  const [newPollOptions, setNewPollOptions] = useState<string[]>([
    "হ্যাঁ, সম্পূর্ণ একমত (Approve)",
    "না, ভিন্নমত / এখনই নয় (Decline)",
    "সংশোধিত শর্ত সাপেক্ষে একমত (Conditional)",
  ]);
  const [newOptionInput, setNewOptionInput] = useState("");
  const [newPollSecret, setNewPollSecret] = useState(false);

  // Admin New Notification State (Dual format: Text & Upload)
  const [noticePublishMode, setNoticePublishMode] = useState<"text" | "upload" | "both">("both");
  const [newNotifTitle, setNewNotifTitle] = useState("");
  const [newNotifContent, setNewNotifContent] = useState("");
  const [newNotifCircularNo, setNewNotifCircularNo] = useState(`TGS/NOTIF/${new Date().getFullYear()}/${String(notifications.length + 1).padStart(3, "0")}`);
  const [newNotifCategory, setNewNotifCategory] = useState<AppNotification["category"]>("general");
  const [newNotifPriority, setNewNotifPriority] = useState<AppNotification["priority"]>("normal");
  const [newNotifPinned, setNewNotifPinned] = useState(false);
  const [newNotifAuthor, setNewNotifAuthor] = useState("সাধারণ সম্পাদক");
  const [newNotifAuthorRole, setNewNotifAuthorRole] = useState("কার্যনির্বাহী পরিষদ");
  const [newNotifAttachment, setNewNotifAttachment] = useState<string | undefined>(undefined);
  const [newNotifAttachmentName, setNewNotifAttachmentName] = useState<string | undefined>(undefined);
  const [newNotifAttachmentType, setNewNotifAttachmentType] = useState<"image" | "pdf" | "document">("image");
  const [newNotifAttachmentSize, setNewNotifAttachmentSize] = useState<number | undefined>(undefined);
  const [autoAttachSignatures, setAutoAttachSignatures] = useState(true);

  // Search filters
  const [noticeSearch, setNoticeSearch] = useState("");
  const [noticeCatFilter, setNoticeCatFilter] = useState("all");

  const reportRef = useRef<HTMLDivElement>(null);
  const noticePrintRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePolls = polls.filter((p) => p.status === "active");
  const closedPolls = polls.filter((p) => p.status === "closed");
  const currentPoll = polls.find((p) => p.id === selectedPollId) || polls[0];

  // Check if chosen voter already voted in current poll
  const currentVoterVote = currentPoll?.votes.find(
    (v) => v.memberUid === voterMemberUid
  );

  // Handle Admin PIN Unlock
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === "1234" || adminPinInput.trim() === "admin" || adminPinInput.trim().length >= 4) {
      setIsAdminUnlocked(true);
      setAdminPinError("");
    } else {
      setAdminPinError(language === "bn" ? "ভুল পিন কোড! পুনরায় চেষ্টা করুন।" : "Invalid PIN code! Try again.");
    }
  };

  // Handle File Upload for Notice
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImg = file.type.startsWith("image/");

    if (!isPdf && !isImg) {
      alert(language === "bn" ? "অনুগ্রহ করে ছবি (JPG/PNG) অথবা পিডিএফ (PDF) ফাইল আপলোড করুন।" : "Please upload JPG/PNG image or PDF document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setNewNotifAttachment(evt.target?.result as string);
      setNewNotifAttachmentName(file.name);
      setNewNotifAttachmentType(isPdf ? "pdf" : "image");
      setNewNotifAttachmentSize(file.size);
    };
    reader.readAsDataURL(file);
  };

  // Handle Member Vote Submission (Strictly User ID Verification, NO Admin dummy IDs)
  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVoteErrorMsg("");

    if (!currentPoll) {
      setVoteErrorMsg(language === "bn" ? "কোনো ভোটিং নির্বাচন করা হয়নি।" : "No poll selected.");
      return;
    }

    if (!voterMemberUid) {
      setVoteErrorMsg(language === "bn" ? "অনুগ্রহ করে আপনার বৈধ সদস্য আইডি নির্বাচন করুন।" : "Please select your valid Member ID.");
      return;
    }

    // STRICT CHECK: Ensure it is a registered member ID and NOT an admin account
    const voter = members.find((m) => m.uid === voterMemberUid);
    if (!voter) {
      setVoteErrorMsg(
        language === "bn"
          ? "সতর্কতা: এডমিন আইডি থেকে সরাসরি কোনো ভোট গ্রহণ করা যাবে না। শুধুমাত্র নিবন্ধিত সদস্য আইডি থেকে ভোট দিন।"
          : "Warning: Admin ID cannot cast votes. Please select a registered Member ID."
      );
      return;
    }

    if (!selectedOptionId) {
      setVoteErrorMsg(language === "bn" ? "অনুগ্রহ করে আপনার রায় / ভোটিং অপশন বেছে নিন।" : "Please choose your voting option.");
      return;
    }

    const option = currentPoll.options.find((o) => o.id === selectedOptionId);
    if (!option) return;

    const vote: PollVote = {
      id: `vote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pollId: currentPoll.id,
      memberUid: voter.uid,
      memberName: voter.name,
      memberMobile: voter.mobile,
      optionId: option.id,
      optionText: option.text,
      votedAt: `${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now(),
      comment: voterComment.trim() || undefined,
    };

    onCastVote(vote);
    setVoteSuccessMsg(
      language === "bn"
        ? `ধন্যবাদ! ${voter.name} (${formatUid(voter.uid)}) এর ভোট সফলভাবে নিবন্ধিত হয়েছে।`
        : `Thank you! Vote successfully recorded for ${voter.name} (${formatUid(voter.uid)}).`
    );
    setVoterComment("");
    setTimeout(() => setVoteSuccessMsg(""), 5000);
  };

  // Time Remaining Helper
  const getTimeRemaining = (poll: Poll) => {
    if (poll.status === "closed") {
      return language === "bn" ? "ভোটগ্রহণ সমাপ্ত (Closed)" : "Poll Closed";
    }
    const targetTime =
      poll.endTimestamp ||
      (poll.createdAt ? poll.createdAt + (poll.durationHours || 48) * 3600000 : null);
    if (!targetTime) {
      return `${poll.startDate} - ${poll.endDate}`;
    }
    const diff = targetTime - Date.now();
    if (diff <= 0) {
      return language === "bn" ? "সময়সীমা সমাপ্ত (Expired)" : "Time Expired";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return language === "bn"
        ? `⏳ ${formatNumber(days)} দিন ${formatNumber(hours)} ঘণ্টা বাকি`
        : `⏳ ${days}d ${hours}h left`;
    }
    if (hours > 0) {
      return language === "bn"
        ? `⏳ ${formatNumber(hours)} ঘণ্টা ${formatNumber(minutes)} মিনিট বাকি`
        : `⏳ ${hours}h ${minutes}m left`;
    }
    return language === "bn"
      ? `⏳ ${formatNumber(minutes)} মিনিট বাকি`
      : `⏳ ${minutes}m left`;
  };

  // Leading Option Text Helper
  const getLeadingOptionText = (p: Poll) => {
    if (!p.votes || p.votes.length === 0) {
      return language === "bn" ? "ভোটের অপেক্ষমাণ" : "No votes cast yet";
    }
    const counts: Record<string, number> = {};
    p.votes.forEach((v) => {
      counts[v.optionId] = (counts[v.optionId] || 0) + 1;
    });
    let topOptId = "";
    let maxCount = -1;
    Object.entries(counts).forEach(([optId, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        topOptId = optId;
      }
    });
    const opt = p.options.find((o) => o.id === topOptId);
    return opt ? `${opt.text} (${formatNumber(maxCount)} ভোট)` : "";
  };

  // Close Poll & Declare Results Resolution (Strict Rule: 2/3 of TOTAL REGISTERED VOTERS required to pass)
  const handleCloseCurrentPoll = (pollId: string) => {
    const p = polls.find((x) => x.id === pollId);
    if (!p) return;
    
    const totalVotes = p.votes?.length || 0;
    const totalMembersCount = members.length || 1;
    const required23Votes = Math.ceil((totalMembersCount * 2) / 3);

    let leadOptText = "প্রস্তাবনা";
    let maxVotes = 0;
    p.options.forEach((opt) => {
      const optVotes = p.votes?.filter((v) => v.optionId === opt.id).length || 0;
      if (optVotes > maxVotes) {
        maxVotes = optVotes;
        leadOptText = opt.text;
      }
    });

    const pctOfVotes = totalVotes > 0 ? ((maxVotes / totalVotes) * 100).toFixed(1) : "0";
    const pctOfTotalMembers = ((maxVotes / totalMembersCount) * 100).toFixed(1);
    const passed23 = maxVotes >= required23Votes;

    const defaultResolution =
      language === "bn"
        ? passed23
          ? `সোসাইটির সর্বমোট ${formatNumber(totalMembersCount)} জন নিবন্ধিত ভোটারের মধ্যে '${leadOptText}' পক্ষে ${formatNumber(maxVotes)} টি ভোট পড়েছে (মোট ভোটারের ${formatNumber(pctOfTotalMembers)}%)। সংবিধান অনুযায়ী আবশ্যক ২/৩ (দুই-তৃতীয়াংশ = মোট ভোটারের অন্তত ${formatNumber(required23Votes)} জন) সমর্থন পূর্ণাঙ্গভাবে অর্জিত হওয়ায় প্রস্তাবটি চূড়ান্তভাবে পাস ও রেজোলিউশন আকারে কার্যকর করা হলো।`
          : `সোসাইটির সর্বমোট ${formatNumber(totalMembersCount)} জন নিবন্ধিত ভোটারের মধ্যে সর্বোচ্চ '${leadOptText}' পক্ষে ${formatNumber(maxVotes)} টি ভোট (${formatNumber(pctOfTotalMembers)}%) পড়লেও, সংবিধান অনুযায়ী আবশ্যক মোট ভোটারের ২/৩ (দুই-তৃতীয়াংশ = অন্তত ${formatNumber(required23Votes)} জন) সমর্থন না পাওয়ায় প্রস্তাবটি পাস হয়নি / বাতিল ঘোষণা করা হলো।`
        : passed23
        ? `Passed with constitutional 2/3 supermajority of total voters: '${leadOptText}' achieved ${maxVotes} votes (${pctOfTotalMembers}% of all ${totalMembersCount} registered voters; required: ${required23Votes}).`
        : `Did not meet constitutional 2/3 requirement of total registered voters (${maxVotes}/${required23Votes} votes achieved from ${totalMembersCount} total members). Proposal declined.`;

    const resolution = window.prompt(
      language === "bn"
        ? `ভোটিং সমাপ্তির আনুষ্ঠানিক রেজোলিউশন / সিদ্ধান্ত লিখুন (${passed23 ? `✅ মোট ভোটারের ২/৩ সমর্থনে পাস (${maxVotes}/${required23Votes} ভোট)` : `⚠️ মোট ভোটারের ২/৩ অর্জিত হয়নি (${maxVotes}/${required23Votes} ভোট)`}):`
        : "Enter official poll resolution / decision summary:",
      defaultResolution
    );
    if (resolution === null) return;

    const updated: Poll = {
      ...p,
      status: "closed",
      requiresTwoThirds: true,
      twoThirdsPassed: passed23,
      resolutionSummary: resolution.trim() || defaultResolution,
    };
    onSavePoll(updated);
  };

  // Extend Poll Duration
  const handleExtendTime = (pollId: string, hoursToAdd: number) => {
    const p = polls.find((x) => x.id === pollId);
    if (!p) return;
    const currentEnd =
      p.endTimestamp ||
      (p.createdAt ? p.createdAt + (p.durationHours || 48) * 3600000 : Date.now());
    const newEnd = Math.max(Date.now(), currentEnd) + hoursToAdd * 3600000;
    const newEndDateStr =
      new Date(newEnd).toLocaleDateString("en-GB") +
      " " +
      new Date(newEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const updated: Poll = {
      ...p,
      durationHours: (p.durationHours || 48) + hoursToAdd,
      endTimestamp: newEnd,
      endDate: newEndDateStr,
      status: "active",
    };
    onSavePoll(updated);
    alert(
      language === "bn"
        ? `ভোটিংয়ের সময়সীমা আরও ${formatNumber(hoursToAdd)} ঘণ্টা বৃদ্ধি করা হয়েছে। নতুন সময়সীমা: ${newEndDateStr}`
        : `Poll duration extended by ${hoursToAdd} hours.`
    );
  };

  // Re-open Closed Poll
  const handleReopenPoll = (pollId: string) => {
    const p = polls.find((x) => x.id === pollId);
    if (!p) return;
    const hoursToAdd = 24;
    const newEnd = Date.now() + hoursToAdd * 3600000;
    const newEndDateStr =
      new Date(newEnd).toLocaleDateString("en-GB") +
      " " +
      new Date(newEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const updated: Poll = {
      ...p,
      status: "active",
      durationHours: hoursToAdd,
      endTimestamp: newEnd,
      endDate: newEndDateStr,
    };
    onSavePoll(updated);
  };

  // Create Poll (Admin Only)
  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollTitle.trim() || newPollOptions.filter(Boolean).length < 2) {
      alert(language === "bn" ? "ভোটিং শিরোনাম ও কমপক্ষে ২টি অপশন প্রদান করুন।" : "Provide a title and at least 2 options.");
      return;
    }

    const durationHrs =
      pollDurationLimit === "custom"
        ? customDurationHours || 48
        : Number(pollDurationLimit) || 48;
    const endTimestamp = Date.now() + durationHrs * 3600000;
    const formattedEndDate =
      new Date(endTimestamp).toLocaleDateString("en-GB") +
      " " +
      new Date(endTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const pollColors = ["emerald", "rose", "amber", "blue", "purple", "indigo"];
    const createdPoll: Poll = {
      id: `poll-${Date.now()}`,
      title: newPollTitle.trim(),
      description: newPollDesc.trim(),
      category: newPollCategory,
      startDate: newPollStartDate,
      endDate: formattedEndDate,
      durationHours: durationHrs,
      endTimestamp: endTimestamp,
      status: "active",
      createdAt: Date.now(),
      createdBy: settings.societyName || "কার্যনির্বাহী কমিটি",
      allowChangeVote: true,
      isSecretBallot: newPollSecret,
      options: newPollOptions.filter(Boolean).map((text, idx) => ({
        id: `opt-${idx + 1}-${Date.now()}`,
        text: text.trim(),
        color: pollColors[idx % pollColors.length],
      })),
      votes: [],
    };

    onSavePoll(createdPoll);

    // Broadcast automatic notification to ALL Member IDs
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `🔴 লাইভ ভোটিং: ${createdPoll.title}`,
      content:
        createdPoll.description ||
        "সকল সম্মানিত সদস্যকে ভোটিং সেন্টারে গিয়ে স্ব স্ব সদস্য আইডি দিয়ে মতামত ও ভোট প্রদানের জন্য অনুরোধ করা হচ্ছে।",
      circularNo: `TGS/VOTE/${new Date().getFullYear()}/${String(polls.length + 1).padStart(3, "0")}`,
      category: "voting",
      date: newPollStartDate,
      createdAt: Date.now(),
      priority: "urgent",
      isPinned: true,
      author: "নির্বাচন ও ভোটিং পরিচালনা পরিষদ",
      authorRole: "এডমিন প্যানেল",
      pollId: createdPoll.id,
      targetAudience: "all",
      recipients: members.map((m) => m.uid),
      noticeType: "text",
      includeSignature: true,
      signatory1Name: settings.presidentName || "সভাপতি",
      signatory1Role: "সভাপতি",
      signatory1Signature: settings.presidentSignature,
      signatory2Name: settings.secretaryName || settings.treasurerName || "সাধারণ সম্পাদক",
      signatory2Role: "সাধারণ সম্পাদক",
      signatory2Signature: settings.secretarySignature || settings.treasurerSignature,
    };
    onSaveNotification(notif);

    setNewPollTitle("");
    setNewPollDesc("");
    setNewPollOptions(["হ্যাঁ, সম্পূর্ণ একমত (Approve)", "না, ভিন্নমত / এখনই নয় (Decline)"]);
    setSelectedPollId(createdPoll.id);
    setSubTab("voting");
    alert(
      language === "bn"
        ? `নতুন লাইভ ভোটিং শুরু হয়েছে এবং সকল (${members.length} জন) সদস্যের আইডিতে নোটিফিকেশন পৌঁছে দেওয়া হয়েছে! সময়সীমা: ${durationHrs} ঘণ্টা।`
        : `Live poll launched with ${durationHrs}h time limit and broadcast to all ${members.length} member IDs!`
    );
  };

  // Publish Notification (Dual Format: Text & Upload, Broadcast to ALL user IDs)
  const handleCreateNotif = (e: React.FormEvent) => {
    e.preventDefault();

    if (noticePublishMode === "text" && (!newNotifTitle.trim() || !newNotifContent.trim())) {
      alert(language === "bn" ? "নোটিশের শিরোনাম ও বিস্তারিত বিষয়বস্তু লিখুন।" : "Please enter notice title and content.");
      return;
    }

    if (noticePublishMode === "upload" && !newNotifAttachment) {
      alert(language === "bn" ? "অনুগ্রহ করে নোটিশের স্ক্যান কপি বা ডকুমেন্ট আপলোড করুন।" : "Please upload notice document or scanned image.");
      return;
    }

    if (!newNotifTitle.trim()) {
      alert(language === "bn" ? "নোটিশের শিরোনাম প্রদান করুন।" : "Please provide a notice title.");
      return;
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: newNotifTitle.trim(),
      content: newNotifContent.trim() || (newNotifAttachmentName ? `সংযুক্ত অফিসিয়াল নোটিশ ডকুমেন্টস (${newNotifAttachmentName}) সংযুক্ত করা হয়েছে।` : "অফিসিয়াল বিজ্ঞপ্তি।"),
      circularNo: newNotifCircularNo.trim(),
      category: newNotifCategory,
      priority: newNotifPriority,
      date: new Date().toLocaleDateString("en-GB"),
      createdAt: Date.now(),
      isPinned: newNotifPinned,
      author: newNotifAuthor.trim() || "কার্যনির্বাহী পরিষদ",
      authorRole: newNotifAuthorRole.trim() || "প্রশাসন",
      noticeType: noticePublishMode,
      attachment: newNotifAttachment,
      attachmentName: newNotifAttachmentName,
      attachmentType: newNotifAttachmentType,
      attachmentSize: newNotifAttachmentSize,
      targetAudience: "all",
      recipients: members.map((m) => m.uid),
      includeSignature: autoAttachSignatures,
      signatory1Name: settings.presidentName || "সভাপতি",
      signatory1Role: "সভাপতি",
      signatory1Signature: settings.presidentSignature,
      signatory2Name: settings.secretaryName || settings.treasurerName || "সাধারণ সম্পাদক",
      signatory2Role: "সাধারণ সম্পাদক",
      signatory2Signature: settings.secretarySignature || settings.treasurerSignature,
    };

    onSaveNotification(notif);

    // Reset Form
    setNewNotifTitle("");
    setNewNotifContent("");
    setNewNotifAttachment(undefined);
    setNewNotifAttachmentName(undefined);
    setNewNotifCircularNo(`TGS/NOTIF/${new Date().getFullYear()}/${String(notifications.length + 2).padStart(3, "0")}`);
    setSubTab("notices");

    alert(
      language === "bn"
        ? `নোটিশ সফলভাবে প্রকাশিত হয়েছে এবং সকল (${members.length} জন) সদস্যের ইউজার আইডিতে নোটিফিকেশন পাঠানো হয়েছে!`
        : `Notice published successfully and delivered to all ${members.length} member IDs!`
    );
  };

  // Export Voting Report to PDF or JPG
  const handleExportReport = async (format: "pdf" | "jpg") => {
    if (!reportRef.current || !viewingReportPoll) return;
    setIsExporting(true);
    setExportFormat(format);

    try {
      await new Promise((r) => setTimeout(r, 250));
      const element = reportRef.current;
      const fileName = `TGS-Voting-Report-${viewingReportPoll.id}-${reportType === 'results' ? 'Resolution' : 'VoterAuditRoll'}`;

      if (format === "jpg") {
        const dataUrl = await toJpeg(element, {
          quality: 0.98,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });
        const link = document.createElement("a");
        link.download = `${fileName}.jpg`;
        link.href = dataUrl;
        link.click();
      } else {
        const dataUrl = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          quality: 0.98,
        });
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error("Export error", err);
      alert(language === "bn" ? "রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে।" : "Failed to export report.");
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  // Export Official Notice Circular (PDF or JPG)
  const handleExportNotice = async (format: "pdf" | "jpg") => {
    if (!noticePrintRef.current || !viewingNotice) return;
    setIsExportingNotice(true);

    try {
      await new Promise((r) => setTimeout(r, 250));
      const element = noticePrintRef.current;
      const fileName = `TGS-Official-Notice-${viewingNotice.circularNo ? viewingNotice.circularNo.replace(/[^a-zA-Z0-9]/g, "_") : viewingNotice.id}`;

      if (format === "jpg") {
        const dataUrl = await toJpeg(element, {
          quality: 0.98,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });
        const link = document.createElement("a");
        link.download = `${fileName}.jpg`;
        link.href = dataUrl;
        link.click();
      } else {
        const dataUrl = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          quality: 0.98,
        });
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error("Notice export error", err);
      alert(language === "bn" ? "অফিসিয়াল নোটিশ ডাউনলোড করতে সমস্যা হয়েছে।" : "Failed to export official notice.");
    } finally {
      setIsExportingNotice(false);
    }
  };

  // Helper to extract MM/YYYY from date string or timestamp
  const getMonthYearKey = (dateStr?: string, timestamp?: number): string => {
    if (timestamp) {
      const d = new Date(timestamp);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
    if (dateStr) {
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          return `${parts[1].padStart(2, "0")}/${parts[2]}`;
        }
      } else if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          return `${parts[1].padStart(2, "0")}/${parts[0]}`;
        }
      }
    }
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const now = new Date();
  const currentMonthYearKey = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  const filteredNotices = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      (n.circularNo && n.circularNo.toLowerCase().includes(noticeSearch.toLowerCase()));
    const matchesCat = noticeCatFilter === "all" || n.category === noticeCatFilter;

    let matchesPeriod = true;
    if (selectedPeriodFilter === "current") {
      const key = getMonthYearKey(n.date, n.createdAt);
      matchesPeriod = key === currentMonthYearKey || Boolean(n.isPinned);
    } else if (selectedPeriodFilter !== "all_archive") {
      matchesPeriod = getMonthYearKey(n.date, n.createdAt) === selectedPeriodFilter;
    }

    return matchesSearch && matchesCat && matchesPeriod;
  });

  return (
    <div id="voting-notify-center" className="space-y-5 sm:space-y-6">
      {/* 🟢 TOP HEADER BANNER & CENTER BRANDING */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-emerald-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0 mt-0.5 sm:mt-0">
              <Vote size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {language === "bn" ? "ভোটিং ও নোটিফাই সেন্টার" : "Voting & Notification Center"}
                </h2>
                {activePolls.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    🔴 LIVE {activePolls.length}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                {language === "bn"
                  ? "সোসাইটির যেকোনো সিদ্ধান্ত গ্রহণে গণতান্ত্রিক লাইভ ভোটিং, ইউজার নোটিফিকেশন ও অফিসিয়াল নোটিশ বোর্ড"
                  : "Democratic live voting polls, member notifications, and official society notice board"}
              </p>
            </div>
          </div>

          {/* Sub Navigation Pills (Swipeable on mobile) */}
          <div className="w-full lg:w-auto max-w-full overflow-x-auto scrollbar-none flex items-center gap-1.5 bg-emerald-950/90 p-1.5 rounded-xl border border-emerald-800/80 shrink-0 touch-pan-x snap-x scroll-smooth">
            <button
              type="button"
              onClick={() => setSubTab("voting")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                subTab === "voting"
                  ? "bg-amber-400 text-emerald-950 shadow-xs font-black"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-900/60"
              }`}
            >
              <Vote size={15} />
              {language === "bn" ? "লাইভ ভোটিং" : "Live Polls"}
              {activePolls.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activePolls.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTab("notices")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                subTab === "notices"
                  ? "bg-amber-400 text-emerald-950 shadow-xs font-black"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-900/60"
              }`}
            >
              <Bell size={15} />
              {language === "bn" ? "নোটিশ বোর্ড" : "Notice Board"}
              <span className="px-1.5 py-0.2 rounded bg-emerald-800 text-amber-200 text-[10px] font-mono">
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab("reports")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                subTab === "reports"
                  ? "bg-amber-400 text-emerald-950 shadow-xs font-black"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-900/60"
              }`}
            >
              <BarChart3 size={15} />
              {language === "bn" ? "ফলাফল ও অডিট" : "Reports & Audit"}
            </button>

            {isAdmin && (
            <button
              type="button"
              onClick={() => setSubTab("admin")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                subTab === "admin"
                  ? "bg-amber-400 text-emerald-950 shadow-xs font-black"
                  : "text-amber-300 hover:text-white hover:bg-emerald-900/60"
              }`}
            >
              <ShieldCheck size={15} />
              {language === "bn" ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
            </button>
            )}
          </div>
        </div>
      </div>

      {/* 📊 SUMMARY OVERVIEW PLACEHOLDER METRIC CARDS (Perfect Alignment) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-stone-600">
              {language === "bn" ? "সক্রিয় লাইভ ভোটিং" : "Active Live Polls"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <Vote size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
              {formatNumber(activePolls.length)} টি
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {activePolls.length > 0 ? "🔴 ভোট গ্রহণ চলমান" : "কোনো সক্রিয় ভোট নেই"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-stone-600">
              {language === "bn" ? "মোট প্রকাশিত নোটিশ" : "Published Notices"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Bell size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
              {formatNumber(notifications.length)} টি
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {language === "bn" ? "সকল সদস্য আইডিতে প্রেরিত" : "Broadcasted to all member IDs"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-stone-600">
              {language === "bn" ? "সোসাইটি নিবন্ধিত ভোটার" : "Registered Voters"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
              {formatNumber(members.length)} জন
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {language === "bn" ? "সদস্য ইউজার আইডি" : "Active Member IDs"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-stone-600">
              {language === "bn" ? "বর্তমান ভোটার উপস্থিতি" : "Current Turnout Rate"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
              {currentPoll && members.length > 0
                ? `${Math.round((currentPoll.votes.length / members.length) * 100)}%`
                : "০%"}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {currentPoll ? `${formatNumber(currentPoll.votes.length)} জন সদস্যের ভোট` : "ভোটিং নির্বাচন করুন"}
            </p>
          </div>
        </div>
      </div>

      {/* 🔄 MONTHLY RESET & ARCHIVE HISTORY NAVIGATOR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-900">
                {language === "bn" ? "নোটিফিকেশন সেন্টার সময়কাল:" : "Notification Center Period:"}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-200">
                {selectedPeriodFilter === "current"
                  ? (language === "bn" ? "চলতি মাস (স্বয়ংক্রিয় মাসিক ড্যাশবোর্ড)" : "Current Month (Active)")
                  : selectedPeriodFilter === "all_archive"
                  ? (language === "bn" ? "সকল পূর্ববর্তী আর্কাইভ ও হিস্টোরি" : "All Previous History Archive")
                  : `হিস্টোরি: ${selectedPeriodFilter}`}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {language === "bn"
                ? "নোটিফিকেশন সেন্টার প্রতিমাসে স্বয়ংক্রিয়ভাবে রিসেট হয়। পূর্ববর্তী যেকোনো মাসের নোটিশ ও ভোটিং রেজোলিউশন হিস্টোরিতে সংরক্ষিত থাকে।"
                : "The notification dashboard resets monthly while all previous notices and polls are stored in history archive."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setSelectedPeriodFilter(selectedPeriodFilter === "current" ? "all_archive" : "current")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              selectedPeriodFilter === "current"
                ? "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300"
                : "bg-emerald-800 text-amber-300 border-emerald-700 shadow-xs"
            }`}
          >
            <Calendar size={13} />
            {selectedPeriodFilter === "current"
              ? (language === "bn" ? "📂 পূর্ববর্তী হিস্টোরি দেখুন" : "View History Archive")
              : (language === "bn" ? "🔄 চলতি মাসে ফিরে যান" : "Return to Current Month")}
          </button>

          {onMarkAllNotificationsAsRead && (
            <button
              type="button"
              onClick={onMarkAllNotificationsAsRead}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
              title={language === "bn" ? "সকল নোটিফিকেশনের লাল ব্যাজ মুছে ফেলুন" : "Mark all as read"}
            >
              <CheckCircle2 size={13} className="text-emerald-700" />
              <span>{language === "bn" ? "সব পঠিত চিহ্নিত করুন" : "Mark All Read"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ⚖️ DEMOCRATIC 2/3RD MAJORITY GOVERNANCE BANNER */}
      <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck size={18} className="text-amber-800 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong className="text-amber-950">{language === "bn" ? "গণতান্ত্রিক সংবিধান নীতি:" : "Democratic Constitutional Rule:"}</strong>{" "}
            {language === "bn"
              ? `সোসাইটির যেকোনো প্রস্তাব বা ভোটিং পাস হওয়ার জন্য অবশ্যই মোট নিবন্ধিত ভোটারের দুই-তৃতীয়াংশ (২/৩ = মোট ${formatNumber(members.length)} জনের মধ্যে অন্তত ${formatNumber(Math.ceil((members.length * 2) / 3))} ভোট) সমর্থন আবশ্যক।`
              : `Any proposal requires a strict two-thirds supermajority of total registered voters (${Math.ceil((members.length * 2) / 3)} of ${members.length} total members) to pass.`}
          </span>
        </div>
        <span className="font-bold text-[11px] bg-amber-200 text-amber-950 px-2.5 py-1 rounded-md border border-amber-300 shrink-0 font-mono">
          {language === "bn" ? `পাস লক্ষ্য: ${formatNumber(Math.ceil((members.length * 2) / 3))} ভোট (২/৩)` : `Target: ${Math.ceil((members.length * 2) / 3)} Votes (2/3)`}
        </span>
      </div>

      {/* ======================================================== */}
      {/* 🗳️ SUB-TAB 1: LIVE VOTING & CAST VOTE VIEW */}
      {/* ======================================================== */}
      {subTab === "voting" && (
        <div className="space-y-6">
          {/* Active Polls Selector Tabs if multiple (Swipeable on mobile) */}
          {polls.length > 1 && (
            <div className="w-full max-w-full overflow-x-auto scrollbar-none flex items-center gap-2 pb-1 touch-pan-x snap-x scroll-smooth">
              {polls.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPollId(p.id);
                    setSelectedOptionId("");
                    setVoteErrorMsg("");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap cursor-pointer shrink-0 ${
                    p.id === selectedPollId
                      ? "bg-emerald-800 text-amber-300 border-emerald-700 shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  {p.status === "active" ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  ) : (
                    <CheckCircle2 size={13} className="text-stone-400" />
                  )}
                  <span className="max-w-[220px] truncate">{p.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono">
                    {formatNumber(p.votes.length)} ভোট
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentPoll ? (
            <div className="flex flex-col space-y-6">
              {/* 1. TOP SECTION: Poll Info, Category, Countdown Timer & Live Vote Tally Results */}
              <div className="w-full">
                <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                  {/* Top Poll Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          currentPoll.status === "active"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-stone-100 text-stone-700 border border-stone-200"
                        }`}
                      >
                        {currentPoll.status === "active" ? "🔴 LIVE ভোটিং চলছে" : "ভোটিং সম্পন্ন (Closed)"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                        {currentPoll.category === "investment" && "বিনিয়োগ প্রস্তাব"}
                        {currentPoll.category === "election" && "কমিটি নির্বাচন"}
                        {currentPoll.category === "constitution" && "গঠনতন্ত্র সংশোধন"}
                        {currentPoll.category === "general" && "সাধারণ সিদ্ধান্ত"}
                        {currentPoll.category === "opinion" && "মতামত জরিপ"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 font-bold">
                        <Clock size={13} className="text-emerald-700" />
                        {getTimeRemaining(currentPoll)}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-stone-900 leading-snug">
                      {currentPoll.title}
                    </h3>
                    {currentPoll.description && (
                      <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                        {currentPoll.description}
                      </p>
                    )}
                  </div>

                  {/* Live Progress Tally Bars */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between text-xs font-bold text-stone-700 gap-2">
                      <span className="flex items-center gap-1.5">
                        {language === "bn" ? "লাইভ ফলাফল অগ্রগতি" : "Live Results Tally"}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold font-mono">
                          {language === "bn" ? `পাস লক্ষ্য: ${formatNumber(Math.ceil((members.length * 2) / 3))} ভোট (২/৩)` : `Pass Target: ${Math.ceil((members.length * 2) / 3)} Votes`}
                        </span>
                      </span>
                      <span className="text-emerald-800 font-mono font-bold">
                        {formatNumber(currentPoll.votes.length)} / {formatNumber(members.length)} ভোট প্রদত্ত (
                        {members.length ? Math.round((currentPoll.votes.length / members.length) * 100) : 0}%)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {currentPoll.options.map((opt) => {
                        const optVotes = currentPoll.votes.filter((v) => v.optionId === opt.id).length;
                        const totalVotes = currentPoll.votes.length;
                        const totalMembersCount = members.length || 1;
                        const required23 = Math.ceil((totalMembersCount * 2) / 3);
                        const pctOfVotes = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const pctOfTotal = Math.round((optVotes / totalMembersCount) * 100);
                        const hasReached23 = optVotes >= required23;
                        const isLeading =
                          totalVotes > 0 &&
                          optVotes === Math.max(...currentPoll.options.map((o) => currentPoll.votes.filter((v) => v.optionId === o.id).length));

                        const colorMap: Record<string, { fill: string }> = {
                          emerald: { fill: "bg-emerald-600" },
                          rose: { fill: "bg-rose-600" },
                          amber: { fill: "bg-amber-500" },
                          blue: { fill: "bg-blue-600" },
                          purple: { fill: "bg-purple-600" },
                        };
                        const c = colorMap[opt.color || "emerald"] || colorMap.emerald;

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border transition-all ${
                              hasReached23
                                ? "border-emerald-500 bg-emerald-50/60 shadow-xs"
                                : isLeading && totalVotes > 0
                                ? "border-amber-400 bg-amber-50/40"
                                : "border-stone-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold mb-1.5 gap-1">
                              <span className="text-stone-800 flex items-center gap-1.5">
                                {opt.text}
                                {hasReached23 ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-700 text-white font-bold">
                                    ✅ ২/৩ পাস
                                  </span>
                                ) : isLeading && totalVotes > 0 ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                                    শীর্ষে
                                  </span>
                                ) : null}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-stone-500 font-mono">
                                  মোট ভোটারের {formatNumber(pctOfTotal)}%
                                </span>
                                <span className="font-mono font-bold text-stone-900">
                                  {formatNumber(optVotes)} ভোট ({formatNumber(pctOfVotes)}%)
                                </span>
                              </div>
                            </div>

                            {/* Progress bar with 2/3 marker */}
                            <div className="relative w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${hasReached23 ? "bg-emerald-600" : c.fill} transition-all duration-500 rounded-full`}
                                style={{ width: `${pctOfVotes}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resolution if closed */}
                  {currentPoll.resolutionSummary && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950">
                      <p className="font-bold flex items-center gap-1 text-emerald-900 mb-1">
                        <Award size={14} />
                        {language === "bn" ? "গৃহীত সিদ্ধান্ত ও ফলাফল:" : "Final Resolution:"}
                      </p>
                      <p>{currentPoll.resolutionSummary}</p>
                    </div>
                  )}

                  {/* Actions for this poll */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingReportPoll(currentPoll);
                        setReportType("results");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <FileText size={14} />
                      {language === "bn" ? "ফলাফল রিপোর্ট (PDF/JPG)" : "Outcome Report"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewingReportPoll(currentPoll);
                        setReportType("voters");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer border border-stone-200"
                    >
                      <ListOrdered size={14} />
                      {language === "bn" ? "কে কোথায় ভোট দিয়েছে তালিকা" : "Voter Audit Roll"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1.5 MEMBER VOTE CARD: only shown to a logged-in member linked to a Member record */}
              {currentMemberUid && (
                <div className="w-full">
                  <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
                        <Vote size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                          {language === "bn" ? "আপনার ভোট দিন" : "Cast Your Vote"}
                        </h4>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {formatUid(currentMemberUid)}
                          {members.find((m) => m.uid === currentMemberUid)?.name
                            ? ` · ${members.find((m) => m.uid === currentMemberUid)?.name}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {currentPoll.status !== "active" ? (
                      <p className="text-xs text-stone-500">
                        {language === "bn" ? "এই ভোটিং সমাপ্ত হয়ে গেছে।" : "This poll has closed."}
                      </p>
                    ) : currentVoterVote && !currentPoll.allowChangeVote ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" />
                        {language === "bn"
                          ? `আপনি ইতিমধ্যে "${currentVoterVote.optionText}" এ ভোট দিয়েছেন। ধন্যবাদ!`
                          : `You already voted for "${currentVoterVote.optionText}". Thank you!`}
                      </div>
                    ) : (
                      <form onSubmit={handleVoteSubmit} className="space-y-3">
                        <div className="space-y-2">
                          {currentPoll.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedOptionId(opt.id)}
                              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                                selectedOptionId === opt.id
                                  ? "bg-emerald-800 text-amber-200 border-emerald-800"
                                  : "bg-stone-50 text-stone-800 border-stone-200 hover:border-emerald-400"
                              }`}
                            >
                              <span className="font-bold text-sm">{opt.text}</span>
                              {opt.description && (
                                <p className="text-[11px] mt-0.5 opacity-80">{opt.description}</p>
                              )}
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={voterComment}
                          onChange={(e) => setVoterComment(e.target.value)}
                          placeholder={language === "bn" ? "মন্তব্য (ঐচ্ছিক)" : "Comment (optional)"}
                          rows={2}
                          className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-700"
                        />

                        {voteErrorMsg && (
                          <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                            {voteErrorMsg}
                          </div>
                        )}
                        {voteSuccessMsg && (
                          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                            {voteSuccessMsg}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm shadow-md cursor-pointer transition-all active:scale-95"
                        >
                          {currentVoterVote
                            ? language === "bn"
                              ? "ভোট পরিবর্তন করুন"
                              : "Change Vote"
                            : language === "bn"
                            ? "ভোট জমা দিন"
                            : "Submit Vote"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* 2. BOTTOM SECTION: Admin Live Polling Status & Monitoring Console */}
              {isAdmin && (
              <div className="w-full">
                <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                          {language === "bn" ? "অ্যাডমিন লাইভ মনিটরিং কনসোল" : "Admin Live Monitoring Console"}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            এডমিন অ্যাপ
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          {language === "bn" ? "ভোট শুধুমাত্র সদস্য ইউজার অ্যাপ থেকে গৃহীত হয়" : "Votes are strictly cast by members via User Apps"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentPoll.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handleCloseCurrentPoll(currentPoll.id)}
                          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <CheckCircle2 size={14} />
                          {language === "bn" ? "ভোট সমাপ্ত ও রেজোলিউশন ঘোষণা" : "Close Poll & Finalize"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReopenPoll(currentPoll.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <RotateCcw size={14} />
                          {language === "bn" ? "পুনরায় ভোটিং চালু করুন" : "Re-open Poll"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Admin Governance Notice */}
                  <div className="bg-amber-50/90 border border-amber-200 text-amber-950 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">
                        {language === "bn" ? "ভোট কাস্টিং নীতি ও নিরাপত্তা:" : "Voting Security Directives:"}
                      </p>
                      <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                        {language === "bn"
                          ? "ভোটিং শুধুমাত্র ইউজার অ্যাপস থেকে সাধারণ সদস্যরা স্ব স্ব আইডি দিয়ে প্রদান করবেন। এটি এডমিন অ্যাপস বিধায় এখান থেকে কোনো ভোট কাস্ট করার অপশন রাখা হয়নি। এডমিন প্যানেল থেকে শুধুমাত্র ভোটিং তৈরি, সময়সীমা নিয়ন্ত্রণ, সার্বক্ষণিক উপস্থিতি মনিটরিং এবং ফলাফল রিপোর্ট সংরক্ষণ করা যাবে।"
                          : "Voting is strictly conducted through Member User Apps. Direct vote casting is disabled in this Admin App to ensure unbiased governance. Admins manage poll durations, live turnout rates, and official outcome resolutions."}
                      </p>
                    </div>
                  </div>

                  {/* Polling Live Statistics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl">
                      <p className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                        <Clock size={13} className="text-emerald-700" />
                        {language === "bn" ? "ভোটিংয়ের সময়সীমা" : "Voting Time Limit"}
                      </p>
                      <p className="text-sm font-bold text-stone-900 mt-1 font-mono">
                        {getTimeRemaining(currentPoll)}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5 font-mono">
                        {currentPoll.startDate} থেকে {currentPoll.endDate}
                      </p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl">
                      <p className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                        <Users size={13} className="text-blue-700" />
                        {language === "bn" ? "ভোটার উপস্থিতি" : "Voter Participation"}
                      </p>
                      <p className="text-sm font-bold text-stone-900 mt-1 font-mono">
                        {formatNumber(currentPoll.votes.length)} / {formatNumber(members.length)} জন (
                        {members.length > 0 ? Math.round((currentPoll.votes.length / members.length) * 100) : 0}%)
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {formatNumber(Math.max(0, members.length - currentPoll.votes.length))} জন সদস্যের ভোট বাকি
                      </p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl">
                      <p className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                        <Award size={13} className="text-amber-700" />
                        {language === "bn" ? "বর্তমান শীর্ষে থাকা রায়" : "Current Lead Option"}
                      </p>
                      <p className="text-sm font-bold text-emerald-800 mt-1 truncate">
                        {getLeadingOptionText(currentPoll)}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        সর্বোচ্চ ভোট প্রাপ্ত ফলাফল
                      </p>
                    </div>
                  </div>

                  {/* Fast Admin Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingReportPoll(currentPoll);
                        setReportType("results");
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <FileText size={14} />
                      {language === "bn" ? "অফিসিয়াল রেজোলিউশন রিপোর্ট (PDF/JPG)" : "Resolution Report"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewingReportPoll(currentPoll);
                        setReportType("voters");
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer border border-stone-200"
                    >
                      <ListOrdered size={14} />
                      {language === "bn" ? "ভোটার অডিট রোল (কে কখন ভোট দিয়েছেন)" : "Voter Audit Roll"}
                    </button>

                    {currentPoll.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleExtendTime(currentPoll.id, 24)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold transition-colors cursor-pointer border border-amber-300"
                      >
                        <Clock size={14} className="text-amber-700" />
                        {language === "bn" ? "সময়সীমা ২৪ ঘণ্টা বৃদ্ধি করুন" : "Extend 24h"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
              <Vote size={36} className="mx-auto text-stone-300 mb-2" />
              <p className="font-bold text-stone-700">বর্তমানে কোনো সক্রিয় ভোটিং নেই</p>
              {isAdmin && (
              <button
                type="button"
                onClick={() => setSubTab("admin")}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-800 text-amber-300 text-xs font-bold cursor-pointer"
              >
                নতুন ভোটিং শুরু করুন (Admin)
              </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 📢 SUB-TAB 2: NOTICE BOARD (TEXT & UPLOADED NOTICES) */}
      {/* ======================================================== */}
      {subTab === "notices" && (
        <div className="space-y-5">
          {/* Filter, Search & Member Inbox Selector Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                placeholder={language === "bn" ? "স্মারক নং বা নোটিশ খুঁজুন..." : "Search notices..."}
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full w-full sm:w-auto scrollbar-none touch-pan-x snap-x scroll-smooth">
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                {[
                  { id: "all", label: "সকল নোটিশ" },
                  { id: "voting", label: "🔴 ভোটিং" },
                  { id: "meeting", label: "📅 সভা/মিটিং" },
                  { id: "financial", label: "💰 আর্থিক" },
                  { id: "emergency", label: "⚡ জরুরি" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNoticeCatFilter(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      noticeCatFilter === c.id
                        ? "bg-white text-emerald-900 shadow-xs font-bold"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {isAdmin && (
              <button
                type="button"
                onClick={() => setSubTab("admin")}
                className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>নতুন নোটিশ</span>
              </button>
              )}
            </div>
          </div>

          {/* Notices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotices.length > 0 ? (
              filteredNotices.map((n) => {
                const isUnread = !readNotificationIds.includes(n.id);
                const priorityStyles: Record<string, { badge: string; border: string }> = {
                  urgent: { badge: "bg-red-100 text-red-700 border-red-200", border: "border-red-300" },
                  high: { badge: "bg-amber-100 text-amber-800 border-amber-200", border: "border-amber-300" },
                  normal: { badge: "bg-stone-100 text-stone-700 border-stone-200", border: "border-stone-200" },
                  low: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-emerald-200" },
                };
                const pStyle = priorityStyles[n.priority || "normal"] || priorityStyles.normal;

                return (
                  <div
                    key={n.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between ${
                      n.isPinned ? "border-amber-300 bg-amber-50/20" : isUnread ? "border-emerald-400 ring-1 ring-emerald-300" : pStyle.border
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-2xs animate-pulse">
                              {language === "bn" ? "নতুন" : "NEW"}
                            </span>
                          )}
                          {n.isPinned && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400 text-emerald-950 text-[10px] font-bold shadow-2xs">
                              <Pin size={10} /> পিন্ড
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pStyle.badge}`}>
                            {n.priority === "urgent" && "⚡ অতীব জরুরি"}
                            {n.priority === "high" && "🔥 উচ্চ অগ্রাধিকার"}
                            {n.priority === "normal" && "সাধারণ নোটিশ"}
                            {n.priority === "low" && "তথ্যমূলক"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                            {n.category === "voting" && "🔴 ভোটিং"}
                            {n.category === "meeting" && "📅 সভা"}
                            {n.category === "financial" && "💰 আর্থিক"}
                            {n.category === "emergency" && "⚡ জরুরি"}
                            {n.category === "general" && "বিজ্ঞপ্তি"}
                          </span>
                        </div>

                        <span className="text-[11px] text-stone-400 font-mono">{n.date}</span>
                      </div>

                      {/* Memo / Circular Number */}
                      {n.circularNo && (
                        <p className="text-[10px] text-stone-400 font-mono">
                          স্মারক নং: <span className="text-stone-700 font-semibold">{n.circularNo}</span>
                        </p>
                      )}

                      {/* Notice Title & Body */}
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                          {n.title}
                        </h4>
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed line-clamp-3">
                          {n.content}
                        </p>
                      </div>

                      {/* Uploaded Document / Image Indicator */}
                      {n.attachment && (
                        <div
                          onClick={() => {
                            if (n.attachment) {
                              onMarkNotificationAsRead?.(n.id);
                              setViewingNoticeAttachment({
                                url: n.attachment,
                                name: n.attachmentName || "Attached_Document",
                                type: n.attachmentType || "image",
                              });
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs text-stone-700 cursor-pointer transition-colors"
                        >
                          <Paperclip size={14} className="text-emerald-700 shrink-0" />
                          <span className="truncate flex-1 font-medium">{n.attachmentName || "অফিসিয়াল স্ক্যান কপি সংযুক্ত"}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                            {n.attachmentType === "pdf" ? "PDF ভিউ" : "ছবি ভিউ"}
                          </span>
                        </div>
                      )}

                      {/* Delivery Status Badge (Broadcast to ALL user IDs) */}
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>
                          {language === "bn"
                            ? `সকল (${formatNumber(members.length)}) জন সদস্যের ইউজার আইডিতে প্রেরিত`
                            : `Delivered to all ${members.length} Member User IDs`}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-stone-100">
                      <span className="text-[10px] text-stone-400 font-medium">
                        স্বাক্ষর: <strong className="text-stone-700">{n.author || "সাধারণ সম্পাদক"}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onMarkNotificationAsRead?.(n.id);
                            setViewingNotice(n);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={13} />
                          {language === "bn" ? "পূর্ণ নোটিশ ও প্রিন্ট" : "View Official Letter"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(language === "bn" ? "এই নোটিশটি মুছে ফেলতে চান?" : "Delete this notice?")) {
                              onDeleteNotification(n.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12 text-stone-400 text-xs bg-white rounded-2xl border border-stone-200">
                <Bell size={32} className="mx-auto mb-2 opacity-40 text-stone-400" />
                <p>কোনো নোটিশ পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📊 SUB-TAB 3: REPORTS & AUDIT ROLL (PDF / JPG) */}
      {/* ======================================================== */}
      {subTab === "reports" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {language === "bn" ? "ভোটিং অডিট ও রেজুলেশন রিপোর্ট" : "Voting Audit & Resolution Reports"}
                </h3>
                <p className="text-xs text-stone-500">
                  {language === "bn"
                    ? "যেকোনো সমাপ্ত বা সক্রিয় ভোটের ফলাফল সারসংক্ষেপ এবং কে কোথায় ভোট দিয়েছে তার পূর্ণাঙ্গ ভোটার তালিকা পিডিএফ ও জেপিজি ফরম্যাটে ডাউনলোড করুন।"
                    : "Download voting outcomes and comprehensive voter audit logs in both PDF and JPG formats."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {polls.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-stone-200 hover:border-emerald-300 transition-colors bg-stone-50/50"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === "active" ? "bg-red-100 text-red-700" : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {p.status === "active" ? "🔴 সক্রিয় (Active)" : "সম্পন্ন (Closed)"}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {p.startDate} - {p.endDate}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-800 text-sm">{p.title}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      মোট ভোট: <strong className="text-stone-800 font-mono">{formatNumber(p.votes.length)}</strong> জন সদস্য
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingReportPoll(p);
                        setReportType("results");
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <FileText size={14} />
                      {language === "bn" ? "ফলাফল রিপোর্ট" : "Results Report"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewingReportPoll(p);
                        setReportType("voters");
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ListOrdered size={14} />
                      {language === "bn" ? "ভোটার তালিকা" : "Voter Roll"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔐 SUB-TAB 4: ADMIN CREATE & MANAGE (PROTECTED PANEL) */}
      {/* ======================================================== */}
      {subTab === "admin" && isAdmin && (
        <div className="space-y-6">
          <div>
            {/* Admin Active Banner */}
            <div className="bg-emerald-900 text-white p-3.5 rounded-xl flex items-center justify-between mb-5 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-300" />
                <span className="text-xs font-bold">
                  {language === "bn" ? "অ্যাডমিন প্যানেল সক্রিয়: নতুন ভোটিং ও নোটিশ তৈরি করুন" : "Admin Panel: Create Polls & Notices"}
                </span>
              </div>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Launch New Poll (Admin Only) */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                      <Vote size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        {language === "bn" ? "নতুন ভোটিং / পোল তৈরি করুন" : "Launch New Live Poll"}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {language === "bn" ? "সদস্যদের মতামত গ্রহণের জন্য নতুন লাইভ ভোট চালু করুন" : "Create democratic voting for society"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleCreatePoll} className="space-y-4 mt-4 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">ভোটিংয়ের শিরোনাম *</label>
                      <input
                        type="text"
                        required
                        value={newPollTitle}
                        onChange={(e) => setNewPollTitle(e.target.value)}
                        placeholder="যেমন: নতুন বাণিজ্যিক প্রকল্পে বিনিয়োগ অনুমোদন..."
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">ক্যাটাগরি</label>
                        <select
                          value={newPollCategory}
                          onChange={(e) => setNewPollCategory(e.target.value as any)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800"
                        >
                          <option value="investment">বিনিয়োগ প্রস্তাব</option>
                          <option value="election">কমিটি নির্বাচন</option>
                          <option value="constitution">গঠনতন্ত্র সংশোধন</option>
                          <option value="general">সাধারণ সিদ্ধান্ত</option>
                          <option value="opinion">মতামত জরিপ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1 flex items-center justify-between">
                          <span>ভোটিং সময়সীমা (Time Limit) *</span>
                          <span className="text-emerald-700 text-[10px] font-mono font-normal flex items-center gap-1">
                            <Timer size={11} /> অটো-ক্লোজ
                          </span>
                        </label>
                        <select
                          value={pollDurationLimit}
                          onChange={(e) => setPollDurationLimit(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-semibold"
                        >
                          <option value="12">১২ ঘণ্টা (জরুরি ভোটিং)</option>
                          <option value="24">২৪ ঘণ্টা (১ দিন)</option>
                          <option value="48">৪৮ ঘণ্টা (২ দিন - ডিফল্ট)</option>
                          <option value="72">৭২ ঘণ্টা (৩ দিন)</option>
                          <option value="168">৭ দিন (১ সপ্তাহ)</option>
                          <option value="custom">কাস্টম ঘণ্টা নির্ধারণ</option>
                        </select>
                      </div>
                    </div>

                    {pollDurationLimit === "custom" && (
                      <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                        <Timer size={16} className="text-amber-800 shrink-0" />
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-amber-900 mb-0.5">
                            কাস্টম সময়সীমা (ঘণ্টার সংখ্যা লিখুন):
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={720}
                            value={customDurationHours}
                            onChange={(e) => setCustomDurationHours(Number(e.target.value) || 1)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="যেমন: 36"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">বিস্তারিত বিবরণ ও প্রেক্ষাপট</label>
                      <textarea
                        rows={2}
                        value={newPollDesc}
                        onChange={(e) => setNewPollDesc(e.target.value)}
                        placeholder="বিনিয়োগ বা সিদ্ধান্তের সার্বিক প্রেক্ষাপট ও শর্তাবলী সংক্ষেপে লিখুন..."
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    {/* Poll Options Builder */}
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">ভোটিং অপশনসমূহ (কমপক্ষে ২টি)</label>
                      <div className="space-y-2 mb-2">
                        {newPollOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newPollOptions];
                                updated[i] = e.target.value;
                                setNewPollOptions(updated);
                              }}
                              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 text-xs"
                            />
                            {newPollOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setNewPollOptions(newPollOptions.filter((_, idx) => idx !== i))}
                                className="text-stone-400 hover:text-red-600 p-1"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOptionInput}
                          onChange={(e) => setNewOptionInput(e.target.value)}
                          placeholder="নতুন অপশন লিখুন..."
                          className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newOptionInput.trim()) {
                              setNewPollOptions([...newPollOptions, newOptionInput.trim()]);
                              setNewOptionInput("");
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold"
                        >
                          + যোগ
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold py-2.5 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Vote size={15} />
                      লাইভ ভোটিং প্রকাশ করুন (সকল সদস্য আইডিতে নোটিফাই হবে)
                    </button>
                  </form>
                </div>

                {/* 2. Publish New Notice (Dual Modes: Text & Upload) */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <Bell size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        {language === "bn" ? "নতুন নোটিশ প্রকাশ করুন" : "Publish Official Notice"}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {language === "bn" ? "টেক্সট ও আপলোড উভয় অপশনে নোটিশ তৈরি ও সকল সদস্যে প্রেরণ" : "Text & file upload notice publishing"}
                      </p>
                    </div>
                  </div>

                  {/* Dual Mode Selector Pills */}
                  <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl mt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setNoticePublishMode("both")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        noticePublishMode === "both" ? "bg-white text-emerald-950 shadow-xs" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      ✨ টেক্সট ও ফাইল উভয়ই
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticePublishMode("text")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        noticePublishMode === "text" ? "bg-white text-emerald-950 shadow-xs" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      📝 শুধুমাত্র টেক্সট
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticePublishMode("upload")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        noticePublishMode === "upload" ? "bg-white text-emerald-950 shadow-xs" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      📎 শুধুমাত্র ফাইল আপলোড
                    </button>
                  </div>

                  <form onSubmit={handleCreateNotif} className="space-y-3.5 mt-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">স্মারক নং / Circular No</label>
                        <input
                          type="text"
                          value={newNotifCircularNo}
                          onChange={(e) => setNewNotifCircularNo(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">ক্যাটাগরি</label>
                        <select
                          value={newNotifCategory}
                          onChange={(e) => setNewNotifCategory(e.target.value as any)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800"
                        >
                          <option value="general">সাধারণ নোটিশ</option>
                          <option value="meeting">সভা ও বৈঠক</option>
                          <option value="financial">আর্থিক / সঞ্চয়</option>
                          <option value="emergency">জরুরি বিজ্ঞপ্তি</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">নোটিশের বিষয় / শিরোনাম *</label>
                      <input
                        type="text"
                        required
                        value={newNotifTitle}
                        onChange={(e) => setNewNotifTitle(e.target.value)}
                        placeholder="যেমন: আসন্ন সাধারণ সভা ও কিস্তি পরিশোধ সংক্রান্ত..."
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    {/* Text content field if Text or Both */}
                    {(noticePublishMode === "text" || noticePublishMode === "both") && (
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">নোটিশের মূল বক্তব্য *</label>
                        <textarea
                          rows={3}
                          value={newNotifContent}
                          onChange={(e) => setNewNotifContent(e.target.value)}
                          placeholder="বিজ্ঞপ্তির পূর্ণ বিবরণ লিখুন..."
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                      </div>
                    )}

                    {/* File upload option if Upload or Both */}
                    {(noticePublishMode === "upload" || noticePublishMode === "both") && (
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">
                          অফিসিয়াল ডকুমেন্ট / স্ক্যান কপি আপলোড (JPG / PNG / PDF)
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleAttachmentUpload}
                          className="hidden"
                        />

                        {newNotifAttachment ? (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck size={18} className="text-emerald-700 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-bold text-emerald-950 truncate">{newNotifAttachmentName}</p>
                                <p className="text-[10px] text-emerald-700 font-mono">
                                  {newNotifAttachmentType?.toUpperCase()} ফাইল সংযুক্ত
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setNewNotifAttachment(undefined);
                                setNewNotifAttachmentName(undefined);
                              }}
                              className="text-stone-400 hover:text-red-600 p-1"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-3.5 bg-stone-50/50 hover:bg-stone-50 text-center transition-colors cursor-pointer"
                          >
                            <Upload size={18} className="mx-auto text-stone-400 mb-1" />
                            <p className="font-bold text-stone-700">ফাইল নির্বাচন করতে এখানে ক্লিক করুন</p>
                            <p className="text-[10px] text-stone-400">JPG, PNG বা PDF ফরম্যাট সমর্থিত</p>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">স্বাক্ষরকারী / পদবী</label>
                        <input
                          type="text"
                          value={newNotifAuthor}
                          onChange={(e) => setNewNotifAuthor(e.target.value)}
                          placeholder="যেমন: সাধারণ সম্পাদক"
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800"
                        />
                      </div>

                      <div className="space-y-1 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                          <input
                            type="checkbox"
                            checked={newNotifPinned}
                            onChange={(e) => setNewNotifPinned(e.target.checked)}
                            className="accent-emerald-700 w-4 h-4"
                          />
                          <span>শীর্ষে পিন করুন</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-900 text-[11px]">
                          <input
                            type="checkbox"
                            checked={autoAttachSignatures}
                            onChange={(e) => setAutoAttachSignatures(e.target.checked)}
                            className="accent-emerald-700 w-4 h-4"
                          />
                          <span>অথোরাইজড সিগনেচার যুক্ত করুন</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold py-2.5 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Bell size={15} />
                      নোটিশ প্রকাশ করুন (সকল ইউজার আইডিতে ব্রডকাস্ট)
                    </button>
                  </form>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📄 MODAL 1: OFFICIAL VOTING REPORT EXPORTER (PDF & JPG) */}
      {/* ======================================================== */}
      {viewingReportPoll && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {reportType === "results" ? "ভোটিং ফলাফল ও রেজুলেশন রিপোর্ট" : "কে কোথায় ভোট দিয়েছে (ভোটার অডিট রোল)"}
                  </h3>
                  <p className="text-[11px] text-emerald-300">পিডিএফ এবং জেপিজি উভয় ফরম্যাটে ডাউনলোড করুন</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportType(reportType === "results" ? "voters" : "results")}
                  className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-semibold cursor-pointer"
                >
                  {reportType === "results" ? "ভোটার তালিকা দেখুন" : "ফলাফল সারসংক্ষেপ দেখুন"}
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReportPoll(null)}
                  className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Report Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100 flex justify-center">
              <div
                ref={reportRef}
                className="bg-white text-stone-900 p-6 sm:p-8 rounded-xl shadow-sm border border-stone-200 w-full max-w-[700px] relative font-sans text-xs"
                style={{ minHeight: "650px" }}
              >
                {/* Official Watermark */}
                <PageWatermark settings={settings} />

                {/* Society Official Letterhead */}
                <div className="text-center pb-4 border-b-2 border-emerald-900">
                  <div className="flex justify-center mb-2">
                    <TgsLogoSvg size={50} logoUrl={settings.logoUrl} />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-emerald-950 uppercase tracking-tight">
                    {settings.societyName || "ট্রাস্ট গ্রোথ সোসাইটি"}
                  </h1>
                  <p className="text-[11px] text-stone-600">
                    {settings.societyAddress || "উলানিয়া বাজার, গলাচিপা, পটুয়াখালী"}
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-900 text-amber-300 font-bold text-xs">
                    {reportType === "results" ? "অফিসিয়াল ভোটিং ফলাফল বিবরণী" : "বিস্তারিত ভোটার অডিট তালিকা (কে কোথায় ভোট দিয়েছেন)"}
                  </div>
                </div>

                {/* Poll Details Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 bg-stone-50 p-3 rounded-lg border border-stone-200 text-[11px]">
                  <div>
                    <span className="text-stone-500">ভোটিং বিষয়: </span>
                    <strong className="text-stone-900 block truncate">{viewingReportPoll.title}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">মোট নিবন্ধিত ভোটার: </span>
                    <strong className="text-stone-900 block font-mono">{formatNumber(members.length)} জন</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">প্রদত্ত ভোট ও উপস্থিতি: </span>
                    <strong className="text-emerald-800 block font-mono">
                      {formatNumber(viewingReportPoll.votes.length)} ভোট ({members.length ? Math.round((viewingReportPoll.votes.length / members.length) * 100) : 0}%)
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500">পাস কোরাম (মোটের ২/৩): </span>
                    <strong className="text-amber-900 block font-mono">
                      অন্তত {formatNumber(Math.ceil((members.length * 2) / 3))} ভোট
                    </strong>
                  </div>
                </div>

                {/* REPORT TYPE 1: RESULTS & TALLY */}
                {reportType === "results" ? (
                  <div className="space-y-4">
                    <table className="w-full text-left border-collapse border border-stone-300 text-xs">
                      <thead>
                        <tr className="bg-emerald-900 text-white font-bold">
                          <th className="border border-stone-300 p-2 text-center w-10">ক্রমিক</th>
                          <th className="border border-stone-300 p-2">ভোটিং অপশন / বিকল্প</th>
                          <th className="border border-stone-300 p-2 text-center w-20">প্রাপ্ত ভোট</th>
                          <th className="border border-stone-300 p-2 text-center w-20">প্রদত্ত %</th>
                          <th className="border border-stone-300 p-2 text-center w-24">মোট ভোটারের %</th>
                          <th className="border border-stone-300 p-2 text-center w-28">২/৩ ফলাফল</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingReportPoll.options.map((opt, i) => {
                          const optVotes = viewingReportPoll.votes.filter((v) => v.optionId === opt.id).length;
                          const totalVotes = viewingReportPoll.votes.length;
                          const totalMembersCount = members.length || 1;
                          const required23 = Math.ceil((totalMembersCount * 2) / 3);
                          const pctOfVotes = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                          const pctOfTotal = Math.round((optVotes / totalMembersCount) * 100);
                          const isPassed23 = optVotes >= required23;
                          const isLeading =
                            totalVotes > 0 &&
                            optVotes ===
                              Math.max(...viewingReportPoll.options.map((o) => viewingReportPoll.votes.filter((v) => v.optionId === o.id).length));

                          return (
                            <tr key={opt.id} className={isPassed23 ? "bg-emerald-50 font-bold" : isLeading ? "bg-amber-50/50" : ""}>
                              <td className="border border-stone-300 p-2 text-center font-mono">{formatNumber(i + 1)}</td>
                              <td className="border border-stone-300 p-2">
                                <span>{opt.text}</span>
                              </td>
                              <td className="border border-stone-300 p-2 text-center font-mono font-bold">
                                {formatNumber(optVotes)}
                              </td>
                              <td className="border border-stone-300 p-2 text-center font-mono font-bold text-stone-700">
                                {formatNumber(pctOfVotes)}%
                              </td>
                              <td className="border border-stone-300 p-2 text-center font-mono font-bold text-emerald-800">
                                {formatNumber(pctOfTotal)}%
                              </td>
                              <td className="border border-stone-300 p-2 text-center">
                                {isPassed23 ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold">
                                    ✅ ২/৩ পাস
                                  </span>
                                ) : isLeading ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                    শীর্ষে (২/৩ অপূর্ণ)
                                  </span>
                                ) : (
                                  <span className="text-stone-400 text-[10px]">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Official Resolution Text */}
                    <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                      <p className="font-bold text-emerald-950 mb-1">রেজুলেশন ও চূড়ান্ত সিদ্ধান্ত:</p>
                      <p className="text-stone-700 leading-relaxed">
                        {viewingReportPoll.resolutionSummary ||
                          "ভোটিংয়ের ফলাফলের ভিত্তিতে অধিকাংশ সদস্যের মতামতের প্রেক্ষিতে প্রস্তাবিত সিদ্ধান্ত চূড়ান্ত অনুমোদন ও কার্যকর করা হলো।"}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* REPORT TYPE 2: WHO VOTED WHERE (DETAILED VOTER ROLL) */
                  <div className="space-y-3">
                    <table className="w-full text-left border-collapse border border-stone-300 text-[11px]">
                      <thead>
                        <tr className="bg-emerald-900 text-white font-bold">
                          <th className="border border-stone-300 p-1.5 text-center w-8">ক্র:</th>
                          <th className="border border-stone-300 p-1.5">সদস্যের নাম</th>
                          <th className="border border-stone-300 p-1.5 text-center">আইডি</th>
                          <th className="border border-stone-300 p-1.5">প্রদত্ত ভোট (Option)</th>
                          <th className="border border-stone-300 p-1.5 text-center">তারিখ ও সময়</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingReportPoll.votes.map((v, i) => (
                          <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                            <td className="border border-stone-300 p-1.5 text-center font-mono">{formatNumber(i + 1)}</td>
                            <td className="border border-stone-300 p-1.5 font-bold text-stone-900">{v.memberName}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono text-stone-600">
                              {formatUid(v.memberUid)}
                            </td>
                            <td className="border border-stone-300 p-1.5 font-bold text-emerald-900">{v.optionText}</td>
                            <td className="border border-stone-300 p-1.5 text-center font-mono text-[10px] text-stone-500">
                              {v.votedAt}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ✍️ AUTOMATIC AUTHORIZED SIGNATURES */}
                <div className="grid grid-cols-3 gap-4 pt-10 mt-8 text-center text-[10px] text-stone-600 border-t border-stone-200">
                  <div>
                    <div className="h-10 flex items-end justify-center mb-1">
                      {settings.treasurerSignature ? (
                        <img src={settings.treasurerSignature} alt="Treasurer Sig" className="max-h-9 object-contain" />
                      ) : (
                        <span className="text-stone-300 text-[10px] italic">স্বাক্ষরিত</span>
                      )}
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {settings.treasurerName || "কোষাধ্যক্ষ"}
                    </div>
                    <div className="text-[9px] text-stone-500">কোষাধ্যক্ষ</div>
                  </div>

                  <div>
                    <div className="h-10 flex items-end justify-center mb-1">
                      {settings.secretarySignature ? (
                        <img src={settings.secretarySignature} alt="Secretary Sig" className="max-h-9 object-contain" />
                      ) : (
                        <span className="text-stone-300 text-[10px] italic">স্বাক্ষরিত</span>
                      )}
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {settings.secretaryName || "সাধারণ সম্পাদক"}
                    </div>
                    <div className="text-[9px] text-stone-500">সাধারণ সম্পাদক</div>
                  </div>

                  <div>
                    <div className="h-10 flex items-end justify-center mb-1">
                      {settings.presidentSignature ? (
                        <img src={settings.presidentSignature} alt="President Sig" className="max-h-9 object-contain" />
                      ) : (
                        <span className="text-stone-300 text-[10px] italic">স্বাক্ষরিত</span>
                      )}
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {settings.presidentName || "সভাপতি"}
                    </div>
                    <div className="text-[9px] text-stone-500">সভাপতি</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-stone-500 font-medium">
                {language === "bn" ? "ডকুমেন্ট ফরম্যাট নির্বাচন করুন:" : "Select download format:"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportReport("pdf")}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} />
                  {isExporting && exportFormat === "pdf" ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}
                </button>

                <button
                  type="button"
                  onClick={() => handleExportReport("jpg")}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon size={14} />
                  {isExporting && exportFormat === "jpg" ? "তৈরি হচ্ছে..." : "JPG ছবি ডাউনলোড"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📜 MODAL 2: OFFICIAL NOTICE LETTERHEAD & EXPORTER (PDF/JPG) */}
      {/* ======================================================== */}
      {viewingNotice && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Bell size={20} className="text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">অফিসিয়াল নোটিশ পত্র ও বিজ্ঞপ্তি</h3>
                  <p className="text-[11px] text-emerald-300">পিডিএফ এবং জেপিজি ডাউনলোড ফরম্যাট</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingNotice(null)}
                className="w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Notice Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100 flex justify-center">
              <div
                ref={noticePrintRef}
                className="bg-white text-stone-900 p-6 sm:p-8 rounded-xl shadow-sm border border-stone-200 w-full max-w-[650px] relative font-sans text-xs"
                style={{ minHeight: "550px" }}
              >
                {/* Official Watermark */}
                <PageWatermark settings={settings} />

                {/* Society Official Letterhead */}
                <div className="text-center pb-3 border-b-2 border-emerald-900">
                  <div className="flex justify-center mb-1.5">
                    <TgsLogoSvg size={46} logoUrl={settings.logoUrl} />
                  </div>
                  <h1 className="text-lg font-bold text-emerald-950 uppercase tracking-tight">
                    {settings.societyName || "ট্রাস্ট গ্রোথ সোসাইটি"}
                  </h1>
                  <p className="text-[11px] text-stone-600">
                    {settings.societyAddress || "উলানিয়া বাজার, গলাচিপা, পটুয়াখালী"}
                  </p>
                  <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-900 text-amber-300 font-bold text-xs">
                    অফিসিয়াল বিজ্ঞপ্তি / নোটিশ
                  </div>
                </div>

                {/* Notice Meta Details */}
                <div className="flex justify-between items-center text-[11px] border-b border-stone-200 py-2.5 text-stone-600 font-mono">
                  <span>স্মারক নং: <strong className="text-stone-900">{viewingNotice.circularNo || viewingNotice.id}</strong></span>
                  <span>তারিখ: <strong className="text-stone-900">{viewingNotice.date}</strong></span>
                </div>

                {/* Notice Body */}
                <div className="py-4 space-y-3">
                  <h2 className="text-base font-bold text-emerald-950 leading-snug">
                    বিষয়: {viewingNotice.title}
                  </h2>

                  <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line text-justify">
                    {viewingNotice.content}
                  </p>

                  {/* If image attachment */}
                  {viewingNotice.attachment && viewingNotice.attachmentType !== "pdf" && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-stone-700 mb-1">সংযুক্ত বিজ্ঞপ্তি চিত্র:</p>
                      <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                        <img
                          src={viewingNotice.attachment}
                          alt="Notice attachment"
                          className="w-full max-h-[350px] object-contain mx-auto"
                        />
                      </div>
                    </div>
                  )}

                  {/* Delivery Note */}
                  <div className="text-[10px] text-stone-500 pt-2 italic">
                    * এই বিজ্ঞপ্তিটি সোসাইটির সকল সদস্যের অবগতি ও প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য জারী করা হলো।
                  </div>
                </div>

                {/* ✍️ AUTOMATIC AUTHORIZED SIGNATURES */}
                <div className="grid grid-cols-2 gap-6 pt-10 mt-6 text-center text-[10px] text-stone-600 border-t border-stone-200">
                  <div>
                    <div className="h-10 flex items-end justify-center mb-1">
                      {settings.secretarySignature ? (
                        <img src={settings.secretarySignature} alt="Secretary Sig" className="max-h-9 object-contain" />
                      ) : (
                        <span className="text-stone-300 text-[10px] italic">স্বাক্ষরিত</span>
                      )}
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {settings.secretaryName || viewingNotice.author || "সাধারণ সম্পাদক"}
                    </div>
                    <div className="text-[9px] text-stone-500">সাধারণ সম্পাদক</div>
                  </div>

                  <div>
                    <div className="h-10 flex items-end justify-center mb-1">
                      {settings.presidentSignature ? (
                        <img src={settings.presidentSignature} alt="President Sig" className="max-h-9 object-contain" />
                      ) : (
                        <span className="text-stone-300 text-[10px] italic">স্বাক্ষরিত</span>
                      )}
                    </div>
                    <div className="border-t border-stone-400 pt-1 font-bold text-stone-800">
                      {settings.presidentName || "সভাপতি"}
                    </div>
                    <div className="text-[9px] text-stone-500">সভাপতি</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-stone-500 font-medium">ডাউনলোড অপশন:</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportNotice("pdf")}
                  disabled={isExportingNotice}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} />
                  {isExportingNotice ? "তৈরি হচ্ছে..." : "অফিসিয়াল PDF ডাউনলোড"}
                </button>

                <button
                  type="button"
                  onClick={() => handleExportNotice("jpg")}
                  disabled={isExportingNotice}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon size={14} />
                  {isExportingNotice ? "তৈরি হচ্ছে..." : "JPG ডাউনলোড"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🖼️ MODAL 3: FULL SCREEN ATTACHMENT VIEWER */}
      {/* ======================================================== */}
      {viewingNoticeAttachment && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col bg-stone-900 rounded-2xl overflow-hidden border border-stone-800">
            <div className="p-3 bg-stone-950 text-white flex items-center justify-between">
              <span className="font-bold text-xs truncate text-amber-300">{viewingNoticeAttachment.name}</span>
              <button
                type="button"
                onClick={() => setViewingNoticeAttachment(null)}
                className="w-8 h-8 rounded-lg bg-stone-800 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-950">
              {viewingNoticeAttachment.type === "pdf" ? (
                <iframe
                  src={viewingNoticeAttachment.url}
                  className="w-full h-[70vh] rounded-lg border border-stone-800"
                  title="PDF Attachment"
                />
              ) : (
                <img
                  src={viewingNoticeAttachment.url}
                  alt={viewingNoticeAttachment.name}
                  className="max-h-[75vh] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
