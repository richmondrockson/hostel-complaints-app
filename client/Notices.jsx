/**
 * components/Notices.jsx
 *
 * WHAT THIS IS:
 * Displays hostel notices for students. Read-only — admins create
 * notices via the backend, students only view them here.
 *
 * PROPS:
 * - notices: array of notice objects from Firestore (passed from Dashboard)
 *
 * FEATURES:
 * - Filter tabs: All, Urgent, Maintenance, General
 * - Search bar: filters by title or description
 * - Pinned section: notices with pinned: true appear at top
 * - Recent section: remaining notices
 * - Unread count: notices without a readBy field containing current user
 *
 * FIRESTORE "notices" document shape:
 * {
 *   title: string,
 *   description: string,
 *   category: "urgent" | "maintenance" | "general",
 *   scope: string (e.g. "Hostel Warden", "IT Department"),
 *   date: Timestamp,
 *   pinned: boolean,
 * }
 */

import { useState, useMemo } from "react";

const CATEGORY_META = {
  urgent:      { label: "Urgent",      color: "#fff", bg: "#e05555" },
  maintenance: { label: "Maintenance", color: "#fff", bg: "#2dbdaa" },
  general:     { label: "General",     color: "#fff", bg: "#6b9999" },
};

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category?.toLowerCase()] || CATEGORY_META.general;
  return (
    <span style={{
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 700,
      color: meta.color,
      background: meta.bg,
      whiteSpace: "nowrap",
      letterSpacing: "0.3px",
    }}>
      {meta.label}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Category icon backgrounds matching the mockup
function NoticeIcon({ category }) {
  const colors = {
    urgent:      { bg: "rgba(224,85,85,0.12)",  stroke: "#e05555" },
    maintenance: { bg: "rgba(45,189,170,0.12)", stroke: "#2dbdaa" },
    general:     { bg: "rgba(107,153,153,0.12)",stroke: "#6b9999" },
  };
  const c = colors[category?.toLowerCase()] || colors.general;

  return (
    <div style={{
      width: "40px", height: "40px", borderRadius: "10px",
      background: c.bg, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      {category?.toLowerCase() === "urgent" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L1.5 15.5h15L9 2z" stroke={c.stroke} strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 7v4M9 13v.5" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
      {category?.toLowerCase() === "maintenance" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M14.5 3.5l-2 2-2-2 2-2 2 2zM3.5 14.5l7-7M12 6l2.5 2.5-7 7L5 13l7-6.5z"
            stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {category?.toLowerCase() === "general" && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke={c.stroke} strokeWidth="1.5"/>
          <path d="M9 8v5M9 6v.5" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

const FILTERS = [
  { value: "all",         label: "All" },
  { value: "urgent",      label: "Urgent" },
  { value: "maintenance", label: "Maintenance" },
  { value: "general",     label: "General" },
];

export default function Notices({ notices = [] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // ── Filtering + Search ────────────────────────────────
  // useMemo recalculates only when notices, activeFilter or search changes
  // This avoids unnecessary recalculations on every render
  const filtered = useMemo(() => {
    return notices.filter((n) => {
      const matchesFilter =
        activeFilter === "all" ||
        n.category?.toLowerCase() === activeFilter;

      const searchTerm = search.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        n.title?.toLowerCase().includes(searchTerm) ||
        n.description?.toLowerCase().includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [notices, activeFilter, search]);

  // Split into pinned and recent
  const pinned = filtered.filter((n) => n.pinned);
  const recent = filtered.filter((n) => !n.pinned);

  // Unread count — notices from last 7 days
  const now = Date.now();
  const unreadCount = notices.filter((n) => {
    if (!n.date) return false;
    const d = n.date.toDate ? n.date.toDate() : new Date(n.date);
    const daysDiff = (now - d.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  return (
    <>
      <style>{`
        .nt-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Top row ── */
        .nt-toprow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .nt-unread {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b9999;
          font-weight: 500;
        }
        .nt-unread-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #2dbdaa;
          flex-shrink: 0;
        }

        /* ── Search ── */
        .nt-search-wrap {
          position: relative;
          width: 220px;
        }
        .nt-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9bbcbc;
          pointer-events: none;
        }
        .nt-search {
          width: 100%;
          padding: 9px 12px 9px 36px;
          border: 1.5px solid #d6ecea;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nt-search:focus {
          border-color: #2dbdaa;
          box-shadow: 0 0 0 3px rgba(45,189,170,0.1);
        }
        .nt-search::placeholder { color: #9bbcbc; }

        /* ── Filter tabs ── */
        .nt-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .nt-filter-btn {
          padding: 7px 16px;
          border-radius: 20px;
          border: 1.5px solid #d6ecea;
          background: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #6b9999;
          cursor: pointer;
          transition: all 0.15s;
        }
        .nt-filter-btn:hover { border-color: #2dbdaa; color: #2dbdaa; }
        .nt-filter-btn.active { background: #2dbdaa; border-color: #2dbdaa; color: #fff; }

        /* ── Section label ── */
        .nt-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #9bbcbc;
          margin-bottom: 4px;
        }
        .nt-section-line {
          flex: 1;
          height: 1px;
          background: #d6ecea;
        }

        /* ── Notice list ── */
        .nt-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Notice card ── */
        .nt-card {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 0.15s, transform 0.15s;
          animation: fadeUp 0.3s ease both;
          cursor: pointer;
        }
        .nt-card:hover {
          box-shadow: 0 4px 16px rgba(45,189,170,0.08);
          transform: translateY(-1px);
        }
        .nt-card.pinned {
          border-left: 3px solid #2dbdaa;
        }
        .nt-card.urgent {
          border-left: 3px solid #e05555;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nt-card-main {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
        }
        .nt-card-body { flex: 1; min-width: 0; }
        .nt-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
        }
        .nt-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a2e2e;
          line-height: 1.4;
        }
        .nt-card-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .nt-card-date {
          font-size: 11px;
          color: #9bbcbc;
          white-space: nowrap;
        }
        .nt-card-desc {
          font-size: 13px;
          color: #6b9999;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .nt-card-desc.expanded {
          display: block;
          -webkit-line-clamp: unset;
        }
        .nt-card-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 11px;
          color: #9bbcbc;
        }
        .nt-pin-icon { color: #2dbdaa; }

        /* ── Empty state ── */
        .nt-empty {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 12px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .nt-empty-icon {
          width: 48px; height: 48px;
          background: #eef6f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .nt-empty-title { font-size: 15px; font-weight: 700; color: #1a2e2e; }
        .nt-empty-sub { font-size: 13px; color: #9bbcbc; max-width: 260px; line-height: 1.6; }

        @media (max-width: 600px) {
          .nt-toprow { flex-direction: column; align-items: flex-start; }
          .nt-search-wrap { width: 100%; }
          .nt-card-top { flex-direction: column; gap: 6px; }
        }
      `}</style>

      <div className="nt-root">

        {/* Top row — unread count + search */}
        <div className="nt-toprow">
          <div className="nt-filters">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={`nt-filter-btn ${activeFilter === f.value ? "active" : ""}`}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
                {f.value !== "all" && (
                  <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                    ({notices.filter((n) => n.category?.toLowerCase() === f.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {unreadCount > 0 && (
              <div className="nt-unread">
                <span className="nt-unread-dot" />
                {unreadCount} unread {unreadCount === 1 ? "notice" : "notices"}
              </div>
            )}
            <div className="nt-search-wrap">
              <span className="nt-search-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                className="nt-search"
                type="text"
                placeholder="Search notices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 1.5A5.5 5.5 0 005.5 7v4.5L3.5 14h15l-2-2.5V7A5.5 5.5 0 0011 1.5z"
                  stroke="#2dbdaa" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8.5 14a2.5 2.5 0 005 0" stroke="#2dbdaa" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="nt-empty-title">
              {search ? "No notices found" : "No notices yet"}
            </div>
            <div className="nt-empty-sub">
              {search
                ? `No notices match "${search}". Try a different search term.`
                : "There are no notices to display right now."}
            </div>
          </div>
        )}

        {/* Pinned section */}
        {pinned.length > 0 && (
          <div>
            <div className="nt-section-label">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3L6 1z"
                  fill="#2dbdaa"/>
              </svg>
              Pinned
              <span className="nt-section-line" />
            </div>
            <div className="nt-list">
              {pinned.map((n, i) => (
                <NoticeCard
                  key={n.id}
                  notice={n}
                  index={i}
                  expanded={expandedId === n.id}
                  onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent section */}
        {recent.length > 0 && (
          <div>
            <div className="nt-section-label">
              Recent
              <span className="nt-section-line" />
            </div>
            <div className="nt-list">
              {recent.map((n, i) => (
                <NoticeCard
                  key={n.id}
                  notice={n}
                  index={i}
                  expanded={expandedId === n.id}
                  onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── Notice Card ───────────────────────────────────────────
function NoticeCard({ notice, index, expanded, onToggle }) {
  const isUrgent = notice.category?.toLowerCase() === "urgent";
  return (
    <div
      className={`nt-card ${notice.pinned ? "pinned" : ""} ${isUrgent ? "urgent" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onToggle}
    >
      <div className="nt-card-main">
        <NoticeIcon category={notice.category} />
        <div className="nt-card-body">
          <div className="nt-card-top">
            <div className="nt-card-title">{notice.title}</div>
            <div className="nt-card-right">
              <CategoryBadge category={notice.category} />
              <span className="nt-card-date">{formatDate(notice.date)}</span>
            </div>
          </div>
          <div className={`nt-card-desc ${expanded ? "expanded" : ""}`}>
            {notice.description}
          </div>
          {notice.scope && (
            <div className="nt-card-footer">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5.5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {notice.scope}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
