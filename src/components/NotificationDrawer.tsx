import { Bell, AlertTriangle, Wallet, CheckCheck, Inbox, ChevronRight } from "lucide-react";
import { AppNotification, Deposit, Member } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface NotificationDrawerProps {
  notifications: AppNotification[];
  deposits: Deposit[];
  members: Member[];
  readNotificationIds: string[];
  /** Fixed viewport coordinates computed from the Bell button's own rect. */
  position: { top: number; right: number };
  onMarkAsRead: (notifId: string) => void;
  /** Omit to hide the "Mark all read" shortcut (nothing unread right now). */
  onMarkAllAsRead?: () => void;
  onViewAll: () => void;
}

type ActivityItem =
  | { kind: "notice"; id: string; timestamp: number; notif: AppNotification; unread: boolean }
  | { kind: "deposit"; id: string; timestamp: number; deposit: Deposit; memberName: string };

// Deposit dates are stored as "DD/MM/YYYY" (en-GB) strings; createdAt is a
// more reliable sort key when present but older records may not have it.
function parseEnGbDate(dateStr?: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const d = Number(parts[0]);
    const m = Number(parts[1]);
    const y = Number(parts[2]);
    if (d && m && y) return new Date(y, m - 1, d).getTime();
  }
  const t = Date.parse(dateStr);
  return isNaN(t) ? 0 : t;
}

function timeAgo(ts: number, language: "bn" | "en", formatNumber: (n: number) => string): string {
  if (!ts) return "";
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return language === "bn" ? "এইমাত্র" : "just now";
  if (mins < 60) return language === "bn" ? `${formatNumber(mins)} মিনিট আগে` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return language === "bn" ? `${formatNumber(hours)} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return language === "bn" ? `${formatNumber(days)} দিন আগে` : `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-GB");
}

export function NotificationDrawer({
  notifications,
  deposits,
  members,
  readNotificationIds,
  position,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
}: NotificationDrawerProps) {
  const { language, formatNumber, formatMoney } = useLanguage();

  const noticeItems: ActivityItem[] = notifications.map((n) => ({
    kind: "notice",
    id: n.id,
    timestamp: n.createdAt || parseEnGbDate(n.date),
    notif: n,
    unread: !readNotificationIds.includes(n.id),
  }));

  const depositItems: ActivityItem[] = deposits.map((d) => {
    const member = members.find((m) => m.uid === d.memberUid);
    return {
      kind: "deposit",
      id: d.id,
      timestamp: d.createdAt || parseEnGbDate(d.date),
      deposit: d,
      memberName: member?.name || d.memberUid,
    };
  });

  const activity = [...noticeItems, ...depositItems]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25);

  return (
    <div
      className="fixed w-[92vw] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden animate-in fade-in duration-150 flex flex-col"
      style={{ top: position.top, right: position.right, maxHeight: "calc(100vh - 120px)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-emerald-800" />
          <p className="text-xs font-bold text-stone-900">
            {language === "bn" ? "সাম্প্রতিক কার্যক্রম" : "Recent Activity"}
          </p>
        </div>
        {onMarkAllAsRead && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <CheckCheck size={13} />
            {language === "bn" ? "সব পঠিত" : "Mark all read"}
          </button>
        )}
      </div>

      {/* Scrollable activity list */}
      <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
        {activity.length === 0 ? (
          <div className="py-10 text-center px-4">
            <Inbox size={28} className="mx-auto text-stone-300 mb-2" />
            <p className="text-xs text-stone-500">
              {language === "bn" ? "এখনো কোনো কার্যক্রম নেই" : "No activity yet"}
            </p>
          </div>
        ) : (
          activity.map((item) => {
            if (item.kind === "notice") {
              const isUrgent = item.notif.priority === "urgent" || item.notif.priority === "high";
              return (
                <button
                  key={`notice-${item.id}`}
                  type="button"
                  onClick={() => item.unread && onMarkAsRead(item.id)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-stone-50 transition-colors cursor-pointer ${
                    item.unread ? "bg-amber-50/60" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isUrgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isUrgent ? <AlertTriangle size={15} /> : <Bell size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-stone-900 truncate">{item.notif.title}</p>
                      {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{item.notif.content}</p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {timeAgo(item.timestamp, language, formatNumber)}
                    </p>
                  </div>
                </button>
              );
            }
            return (
              <div key={`deposit-${item.id}`} className="w-full text-left px-4 py-3 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Wallet size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {language === "bn"
                      ? `${item.memberName} জমা দিয়েছেন`
                      : `${item.memberName} made a deposit`}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                    {formatMoney(item.deposit.amount)}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {timeAgo(item.timestamp, language, formatNumber)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <button
        type="button"
        onClick={onViewAll}
        className="shrink-0 border-t border-stone-100 bg-white hover:bg-stone-50 transition-colors px-4 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer"
      >
        {language === "bn" ? "সব দেখুন" : "View All"}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
