import { Briefcase, PlusCircle, ChevronRight, Calendar, Archive, Sparkles } from "lucide-react";
import { Project } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface ProjectsPageProps {
  projects: Project[];
  onSelect: (id: string) => void;
  /** Omit to hide the "New Project" button — Admin and Treasurer/GS only. */
  onAddProject?: () => void;
}

function projectTotals(project: Project) {
  const income = project.entries
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expense = project.entries
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  return { income, expense, net: income - expense };
}

export function ProjectsPage({ projects, onSelect, onAddProject }: ProjectsPageProps) {
  const { language, formatNumber, formatMoney } = useLanguage();

  const ongoing = projects.filter((p) => p.status !== "completed");
  const previous = projects.filter((p) => p.status === "completed");

  const renderProjectCard = (p: Project) => {
    const { income, expense, net } = projectTotals(p);
    return (
      <button
        key={p.id}
        onClick={() => onSelect(p.id)}
        className="text-left bg-white rounded-xl border border-stone-200/90 hover:border-emerald-500 hover:shadow-md transition-all p-4 flex items-center justify-between group gap-3 cursor-pointer w-full"
      >
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-stone-900 text-sm sm:text-base truncate group-hover:text-emerald-900 transition-colors">
              {p.title}
            </p>
            {p.status === "completed" ? (
              <span className="shrink-0 text-[10px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.2 rounded-full">
                {language === "bn" ? "সম্পন্ন" : "Completed"}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                {language === "bn" ? "চলমান" : "Ongoing"}
              </span>
            )}
          </div>
          {p.description && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2">{p.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500 flex-wrap">
            {p.startDate && (
              <span className="flex items-center gap-1">
                <Calendar size={11} className="text-stone-400" />
                {formatNumber(p.startDate)}
                {p.endDate ? ` – ${formatNumber(p.endDate)}` : ""}
              </span>
            )}
            <span>
              {formatNumber(p.entries.length)} {language === "bn" ? "টি এন্ট্রি" : "entries"}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 pl-2 border-l border-stone-100 flex flex-col items-end">
          <span className="text-[11px] text-stone-400 font-medium">
            {language === "bn" ? "নীট" : "Net"}
          </span>
          <p className={`font-mono font-bold text-base ${net >= 0 ? "text-emerald-900" : "text-red-700"}`}>
            {formatMoney(net)}
          </p>
          <div className="flex items-center text-xs text-emerald-700 font-medium mt-1 group-hover:translate-x-0.5 transition-transform">
            <span>{language === "bn" ? "বিস্তারিত" : "Details"}</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div id="projects-tab" className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">
              {language === "bn" ? "প্রজেক্ট" : "Projects"}
            </h2>
            <p className="text-xs text-stone-500">
              {language === "bn"
                ? "সমিতির মূল হিসাব থেকে সম্পূর্ণ আলাদা — এককালীন কার্যক্রমের জমা-খরচের হিসাব"
                : "Fully separate from the Society's main accounting — income/expenses for one-off activities"}
            </p>
          </div>
        </div>
        {onAddProject && (
          <button
            id="add-project-btn"
            onClick={onAddProject}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle size={16} /> {language === "bn" ? "নতুন প্রজেক্ট" : "New Project"}
          </button>
        )}
      </div>

      {/* Ongoing Projects */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Sparkles size={13} className="text-emerald-600" />
          {language === "bn" ? `চলমান প্রজেক্ট (${formatNumber(ongoing.length)})` : `Ongoing Projects (${ongoing.length})`}
        </h3>
        {ongoing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {ongoing.map((p) => renderProjectCard(p))}
          </div>
        ) : (
          <div className="py-8 text-center bg-white rounded-xl border border-dashed border-stone-300">
            <p className="text-sm text-stone-500">
              {language === "bn" ? "বর্তমানে কোনো চলমান প্রজেক্ট নেই" : "No ongoing projects right now"}
            </p>
          </div>
        )}
      </div>

      {/* Previous Projects */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Archive size={13} className="text-stone-500" />
          {language === "bn"
            ? `পূর্ববর্তী প্রজেক্ট (${formatNumber(previous.length)})`
            : `Previous Projects (${previous.length})`}
        </h3>
        {previous.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {previous.map((p) => renderProjectCard(p))}
          </div>
        ) : (
          <div className="py-8 text-center bg-white rounded-xl border border-dashed border-stone-300">
            <p className="text-sm text-stone-500">
              {language === "bn" ? "এখনো কোনো প্রজেক্ট সম্পন্ন হয়নি" : "No projects have been completed yet"}
            </p>
          </div>
        )}
      </div>

      {projects.length === 0 && (
        <div className="col-span-full py-4 text-center text-xs text-stone-400">
          {language === "bn"
            ? "উপরের \"নতুন প্রজেক্ট\" বাটনে চেপে প্রথম প্রজেক্ট তৈরি করুন।"
            : 'Click "New Project" above to create your first one.'}
        </div>
      )}
    </div>
  );
}
