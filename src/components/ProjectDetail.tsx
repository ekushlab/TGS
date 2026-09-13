import { useState } from "react";
import {
  ArrowLeft,
  PlusCircle,
  Calendar,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
} from "lucide-react";
import { Project } from "../types";
import { useLanguage } from "../utils/LanguageContext";
import { AttachmentBadge } from "./AttachmentUpload";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmActionModal } from "./ConfirmActionModal";

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  /** Omit to hide the "Add Entry" button — Admin and Treasurer/GS only. */
  onAddEntry?: () => void;
  /** Omit to hide per-entry delete buttons — Admin only. */
  onDeleteEntry?: (entryId: string) => void;
  /** Omit to hide the complete/reopen toggle — Admin and Treasurer/GS only. */
  onToggleStatus?: (status: "ongoing" | "completed") => void;
  /** Omit to hide the "Delete Project" button — Admin only. */
  onDeleteProject?: () => void;
}

export function ProjectDetail({
  project,
  onBack,
  onAddEntry,
  onDeleteEntry,
  onToggleStatus,
  onDeleteProject,
}: ProjectDetailProps) {
  const { language, formatNumber, formatMoney } = useLanguage();
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  const isCompleted = project.status === "completed";
  const income = project.entries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount || 0), 0);
  const expense = project.entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount || 0), 0);
  const net = income - expense;
  const deletingEntry = project.entries.find((e) => e.id === deletingEntryId) || null;

  return (
    <div id="project-detail-view" className="space-y-5">
      {/* Top nav & actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> {language === "bn" ? "প্রজেক্ট তালিকায় ফিরুন" : "Back to Projects"}
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {onToggleStatus &&
            (isCompleted ? (
              <button
                type="button"
                onClick={() => setShowReopenConfirm(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <RotateCcw size={15} /> {language === "bn" ? "পুনরায় চালু করুন" : "Reopen"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle2 size={15} className="text-emerald-700" />{" "}
                {language === "bn" ? "সম্পন্ন করুন" : "Mark Completed"}
              </button>
            ))}
          {onDeleteProject && (
            <button
              type="button"
              onClick={() => setShowDeleteProjectConfirm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Trash2 size={15} /> {language === "bn" ? "প্রজেক্ট মুছুন" : "Delete"}
            </button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{project.title}</h2>
                {isCompleted ? (
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.2 rounded-full">
                    {language === "bn" ? "সম্পন্ন" : "Completed"}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                    {language === "bn" ? "চলমান" : "Ongoing"}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-stone-600 mt-1 max-w-xl">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-500 flex-wrap">
                {project.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-stone-400" />
                    {language === "bn" ? "শুরু:" : "Started:"} {formatNumber(project.startDate)}
                  </span>
                )}
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-stone-400" />
                    {language === "bn" ? "সম্পন্ন:" : "Completed:"} {formatNumber(project.endDate)}
                  </span>
                )}
                {project.createdByName && (
                  <span>
                    {language === "bn" ? "তৈরি করেছেন:" : "Created by:"} {project.createdByName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold">{language === "bn" ? "মোট জমা" : "Total Income"}</span>
            <p className="text-lg font-bold font-mono text-emerald-950 mt-0.5">{formatMoney(income)}</p>
          </div>
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-xs text-rose-800 font-semibold">{language === "bn" ? "মোট খরচ" : "Total Expense"}</span>
            <p className="text-lg font-bold font-mono text-rose-950 mt-0.5">{formatMoney(expense)}</p>
          </div>
          <div className={`p-3.5 rounded-xl border ${net >= 0 ? "bg-stone-50 border-stone-200" : "bg-red-50 border-red-200"}`}>
            <span className={`text-xs font-semibold ${net >= 0 ? "text-stone-600" : "text-red-800"}`}>
              {language === "bn" ? "নীট ব্যালেন্স" : "Net Balance"}
            </span>
            <p className={`text-lg font-bold font-mono mt-0.5 ${net >= 0 ? "text-stone-900" : "text-red-950"}`}>
              {formatMoney(net)}
            </p>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50/70">
          <div>
            <h3 className="font-bold text-stone-800 text-base">
              {language === "bn" ? "জমা ও খরচের হিসাব" : "Income & Expense Entries"}
            </h3>
            <p className="text-xs text-stone-500">
              {formatNumber(project.entries.length)} {language === "bn" ? "টি এন্ট্রি" : "entries"}
            </p>
          </div>
          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle size={15} /> {language === "bn" ? "নতুন এন্ট্রি" : "Add Entry"}
            </button>
          )}
        </div>

        <div className="divide-y divide-stone-100">
          {project.entries.map((e) => (
            <div key={e.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-stone-50/80 transition-colors gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    e.type === "income" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {e.type === "income" ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-stone-900 text-sm truncate">{e.category}</p>
                    {e.attachment && (
                      <AttachmentBadge attachment={e.attachment} attachmentName={e.attachmentName} compact />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === "bn" ? "তারিখ" : "Date"}: <span className="font-medium text-stone-700">{formatNumber(e.date)}</span>
                    {e.note && <span className="italic text-stone-500"> · {e.note}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`font-mono font-bold text-base ${e.type === "income" ? "text-emerald-900" : "text-rose-800"}`}
                >
                  {e.type === "income" ? "+" : "-"}
                  {formatMoney(e.amount)}
                </span>
                {onDeleteEntry && (
                  <button
                    onClick={() => setDeletingEntryId(e.id)}
                    title={language === "bn" ? "এন্ট্রি মুছে ফেলুন" : "Delete Entry"}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {project.entries.length === 0 && (
            <div className="p-8 text-center text-stone-400">
              <p className="text-sm">
                {language === "bn" ? "এই প্রজেক্টে এখনো কোনো এন্ট্রি যোগ করা হয়নি" : "No entries have been added to this project yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm: Mark Completed */}
      {showCompleteConfirm && (
        <ConfirmActionModal
          isOpen={showCompleteConfirm}
          title={language === "bn" ? "প্রজেক্ট সম্পন্ন করুন" : "Mark Project Completed"}
          tone="success"
          icon={<CheckCircle2 size={20} className="text-white" />}
          itemDescription={project.title}
          message={
            language === "bn"
              ? 'এই প্রজেক্ট সম্পন্ন হিসেবে চিহ্নিত হবে এবং "পূর্ববর্তী প্রজেক্ট" তালিকায় দেখা যাবে। প্রয়োজনে পরে আবার চালু (reopen) করা যাবে।'
              : 'This project will be marked completed and moved under "Previous Projects". It can be reopened later if needed.'
          }
          confirmLabel={language === "bn" ? "হ্যাঁ, সম্পন্ন করুন" : "Yes, Mark Completed"}
          onConfirm={() => onToggleStatus && onToggleStatus("completed")}
          onClose={() => setShowCompleteConfirm(false)}
        />
      )}

      {/* Confirm: Reopen */}
      {showReopenConfirm && (
        <ConfirmActionModal
          isOpen={showReopenConfirm}
          title={language === "bn" ? "প্রজেক্ট পুনরায় চালু করুন" : "Reopen Project"}
          tone="success"
          icon={<RotateCcw size={20} className="text-white" />}
          itemDescription={project.title}
          message={
            language === "bn"
              ? "এই প্রজেক্টটি আবার চলমান হিসেবে চিহ্নিত হবে।"
              : "This project will be marked ongoing again."
          }
          confirmLabel={language === "bn" ? "হ্যাঁ, চালু করুন" : "Yes, Reopen"}
          onConfirm={() => onToggleStatus && onToggleStatus("ongoing")}
          onClose={() => setShowReopenConfirm(false)}
        />
      )}

      {/* Confirm: Delete Project */}
      {showDeleteProjectConfirm && (
        <ConfirmDeleteModal
          isOpen={showDeleteProjectConfirm}
          title={language === "bn" ? "প্রজেক্ট মুছে ফেলুন" : "Delete Project"}
          itemDescription={`${project.title} · ${formatNumber(project.entries.length)} ${language === "bn" ? "টি এন্ট্রি" : "entries"} · ${language === "bn" ? "নীট" : "Net"}: ${formatMoney(net)}`}
          warningMessage={
            language === "bn"
              ? "এই প্রজেক্ট ও এর সকল জমা-খরচের এন্ট্রি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
              : "This project and all of its income/expense entries will be permanently deleted. Proceed?"
          }
          onConfirm={() => {
            if (onDeleteProject) onDeleteProject();
          }}
          onClose={() => setShowDeleteProjectConfirm(false)}
        />
      )}

      {/* Confirm: Delete Entry */}
      {deletingEntry && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingEntry)}
          title={language === "bn" ? "এন্ট্রি মুছে ফেলুন" : "Delete Entry"}
          itemDescription={`${deletingEntry.category} · ${formatMoney(deletingEntry.amount)} (${formatNumber(deletingEntry.date)})`}
          warningMessage={
            language === "bn"
              ? "এই এন্ট্রিটি স্থায়ীভাবে মুছে ফেলা হবে এবং প্রজেক্টের মোট হিসাব থেকে বাদ যাবে।"
              : "This entry will be permanently deleted and removed from the project's totals."
          }
          onConfirm={() => {
            if (deletingEntry && onDeleteEntry) onDeleteEntry(deletingEntry.id);
            setDeletingEntryId(null);
          }}
          onClose={() => setDeletingEntryId(null)}
        />
      )}
    </div>
  );
}
