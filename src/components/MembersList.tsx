import { Search, PlusCircle, Phone, Droplet, ChevronRight, Mail, Calendar, UserCheck } from "lucide-react";
import { Member } from "../types";
import { useLanguage } from "../utils/LanguageContext";

interface MembersListProps {
  members: Member[];
  query: string;
  setQuery: (q: string) => void;
  onSelect: (uid: string) => void;
  memberTotal: (uid: string) => number;
  onAddMember: () => void;
}

export function MembersList({
  members,
  query,
  setQuery,
  onSelect,
  memberTotal,
  onAddMember,
}: MembersListProps) {
  const { language, t, formatNumber, formatMoney, formatUid } = useLanguage();

  return (
    <div id="members-tab" className="space-y-4">
      {/* Header action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="search-members-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.members_search}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 bg-stone-50/50 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium px-2 py-1 bg-stone-100 rounded-md">
            {language === 'bn' ? `মোট: ${formatNumber(members.length)} জন` : `Total: ${formatNumber(members.length)}`}
          </span>
          <button
            id="add-member-btn"
            onClick={onAddMember}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle size={16} /> {t.btn_new_member}
          </button>
        </div>
      </div>

      {/* Grid of members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {members.map((m) => {
          const total = memberTotal(m.uid);
          const displayName = language === 'en' && m.nameEn ? m.nameEn : m.name;
          const secondaryName = language === 'en' ? (m.name !== m.nameEn ? m.name : undefined) : m.nameEn;

          return (
            <button
              key={m.uid}
              id={`member-card-${m.uid}`}
              onClick={() => onSelect(m.uid)}
              className="text-left bg-white rounded-xl border border-stone-200/90 hover:border-emerald-500 hover:shadow-md transition-all p-4 flex items-center justify-between group gap-3 cursor-pointer"
            >
              {/* Member Photo or Initial Avatar */}
              <div className="shrink-0">
                {m.photo ? (
                  <div
                    className={`overflow-hidden rounded-xl border border-stone-200 shadow-2xs bg-stone-100 ${
                      m.photoFormat === 'passport' ? 'w-12 h-15' : 'w-12 h-12'
                    }`}
                  >
                    <img
                      src={m.photo}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-lg shadow-2xs">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-stone-900 text-sm sm:text-base truncate group-hover:text-emerald-900 transition-colors">
                    {displayName}
                  </p>
                  {m.blood && (
                    <span className="shrink-0 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                      {m.blood}
                    </span>
                  )}
                </div>

                {secondaryName && (
                  <p className="text-xs text-stone-500 font-normal truncate mt-0.5">{secondaryName}</p>
                )}

                <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-600 flex-wrap">
                  <span className="font-mono bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                    {formatUid(m.uid)}
                  </span>
                  {m.mobile && (
                    <span className="flex items-center gap-1 text-stone-600 font-medium">
                      <Phone size={12} className="text-stone-400" />
                      {formatNumber(m.mobile)}
                    </span>
                  )}
                  {m.joined && (
                    <span className="flex items-center gap-1 text-stone-500 text-[11px]">
                      <Calendar size={11} className="text-stone-400" />
                      {formatNumber(m.joined)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 pl-2 border-l border-stone-100 flex flex-col items-end">
                <span className="text-[11px] text-stone-400 font-medium">{t.col_total_deposited}</span>
                <p className="font-mono font-bold text-emerald-900 text-base">{formatMoney(total)}</p>
                <div className="flex items-center text-xs text-emerald-700 font-medium mt-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{t.btn_view_details}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </button>
          );
        })}

        {members.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-stone-300">
            <UserCheck size={36} className="mx-auto text-stone-300 mb-2" />
            <p className="text-stone-600 font-medium">{t.no_data_found}</p>
            <p className="text-xs text-stone-400 mt-1">
              {language === 'bn' ? 'অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন সদস্য যুক্ত করুন' : 'Change search filter or add a new member'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

