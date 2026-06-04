/**
 * components/MyComplaints.jsx
 *
 * WHAT THIS IS:
 * A component that renders inside the Dashboard when the student
 * clicks "My Complaints" in the sidebar.
 *
 * WHY IT RECEIVES complaints AS A PROP:
 * The Dashboard already fetched all complaints from Firestore.
 * Instead of fetching again, we pass that data down as a prop.
 * This avoids duplicate Firestore reads and keeps data in sync —
 * if a complaint updates in the dashboard, it updates here too.
 * This pattern is called "lifting state up."
 *
 * PROPS:
 * - complaints: array of complaint objects from Firestore
 * - loading: boolean — whether complaints are still being fetched
 * - onNewComplaint: function — called when student clicks "New Complaint"
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Helpers ──────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_META = {
  open:          { label: "Open",        color: "#fff", bg: "#f5a623" },
  "in-progress": { label: "In Progress", color: "#fff", bg: "#2dbdaa" },
  resolved:      { label: "Resolved",    color: "#fff", bg: "#2dbdaa" },
  pending:       { label: "Pending",     color: "#fff", bg: "#f5a623" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span style={{
      padding: "5px 14px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 700,
      color: meta.color,
      background: meta.bg,
      whiteSpace: "nowrap",
    }}>
      {meta.label}
    </span>
  );
}

// Filter options — "all" shows everything
const FILTERS = [
  { value: "all",         label: "All" },
  { value: "open",        label: "Open" },
  { value: "pending",     label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
];

// ── Main Component ────────────────────────────────────────
export default function MyComplaints({ complaints, loading }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  // ── Client-side filtering ─────────────────────────────
  // We don't go back to Firestore to filter.
  // We already have all complaints in memory — we just show a subset.
  // When activeFilter is "all", show everything.
  // Otherwise show only complaints matching the selected status.
  const filtered = activeFilter === "all"
    ? complaints
    : complaints.filter((c) => c.status === activeFilter);

  // Toggle expanded row to show full description
  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .mc-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Top row ── */
        .mc-toprow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .mc-count {
          font-size: 13px;
          color: #6b9999;
          font-weight: 500;
        }
        .mc-count span {
          font-weight: 700;
          color: #1a2e2e;
        }
        .mc-new-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: #2dbdaa;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .mc-new-btn:hover { background: #25a896; }

        /* ── Filter tabs ── */
        .mc-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mc-filter-btn {
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
        .mc-filter-btn:hover {
          border-color: #2dbdaa;
          color: #2dbdaa;
        }
        .mc-filter-btn.active {
          background: #2dbdaa;
          border-color: #2dbdaa;
          color: #fff;
        }

        /* ── Complaints list ── */
        .mc-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── Complaint card ── */
        .mc-card {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 0.15s, transform 0.15s;
          animation: fadeUp 0.3s ease both;
        }
        .mc-card:hover {
          box-shadow: 0 4px 16px rgba(45,189,170,0.08);
          transform: translateY(-1px);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mc-card-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: pointer;
          gap: 12px;
        }
        .mc-card-left { flex: 1; min-width: 0; }
        .mc-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a2e2e;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mc-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 11px;
          color: #9bbcbc;
        }
        .mc-meta-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #b8d4d4;
          flex-shrink: 0;
        }
        .mc-card-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .mc-chevron {
          color: #9bbcbc;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .mc-chevron.open { transform: rotate(180deg); }

        /* ── Expanded detail ── */
        .mc-detail {
          padding: 0 20px 18px;
          border-top: 1px solid #f0f8f8;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeUp 0.2s ease both;
        }
        .mc-detail-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9bbcbc;
          margin-bottom: 4px;
        }
        .mc-detail-value {
          font-size: 13px;
          color: #1a2e2e;
          line-height: 1.6;
        }
        .mc-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding-top: 12px;
        }
        .mc-admin-note {
          background: rgba(45,189,170,0.06);
          border: 1px solid rgba(45,189,170,0.2);
          border-radius: 8px;
          padding: 12px 14px;
        }
        .mc-admin-note .mc-detail-label { color: #2dbdaa; }

        /* ── Empty state ── */
        .mc-empty {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 12px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .mc-empty-icon {
          width: 52px; height: 52px;
          background: #eef6f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mc-empty-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a2e2e;
        }
        .mc-empty-sub {
          font-size: 13px;
          color: #9bbcbc;
          max-width: 280px;
          line-height: 1.6;
        }

        /* ── Skeleton ── */
        .mc-skeleton {
          height: 80px;
          border-radius: 12px;
          background: linear-gradient(90deg, #d6ecea 25%, #eef6f6 50%, #d6ecea 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        @media (max-width: 600px) {
          .mc-card-title { white-space: normal; }
          .mc-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mc-root">
        {/* Top row — count + new complaint button */}
        <div className="mc-toprow">
          <div className="mc-count">
            Showing <span>{filtered.length}</span> of{" "}
            <span>{complaints.length}</span> complaints
          </div>
          <button
            className="mc-new-btn"
            onClick={() => navigate("/complaints/new")}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Complaint
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mc-filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`mc-filter-btn ${activeFilter === f.value ? "active" : ""}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
              {/* Show count per filter */}
              {f.value !== "all" && (
                <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                  ({complaints.filter((c) => c.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Complaints list */}
        {loading ? (
          <div className="mc-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mc-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L2 19h18L11 2z" stroke="#2dbdaa" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M11 9v5M11 16v.5" stroke="#2dbdaa" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="mc-empty-title">
              {activeFilter === "all"
                ? "No complaints yet"
                : `No ${activeFilter} complaints`}
            </div>
            <div className="mc-empty-sub">
              {activeFilter === "all"
                ? "You haven't submitted any complaints yet."
                : `You have no complaints with status "${activeFilter}".`}
            </div>
            {activeFilter === "all" && (
              <button
                className="mc-new-btn"
                onClick={() => navigate("/complaints/new")}
                style={{ marginTop: "4px" }}
              >
                Submit your first complaint
              </button>
            )}
          </div>
        ) : (
          <div className="mc-list">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                className="mc-card"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Card header — always visible */}
                <div
                  className="mc-card-main"
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="mc-card-left">
                    <div className="mc-card-title">{c.title}</div>
                    <div className="mc-card-meta">
                      <span>{c.complaintId || `#${c.id.slice(0, 7).toUpperCase()}`}</span>
                      <span className="mc-meta-dot" />
                      <span>{c.category}</span>
                      <span className="mc-meta-dot" />
                      <span>Room {c.roomNumber}</span>
                      <span className="mc-meta-dot" />
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mc-card-right">
                    <StatusBadge status={c.status} />
                    <svg
                      className={`mc-chevron ${expandedId === c.id ? "open" : ""}`}
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                    >
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail — shown when card is clicked */}
                {expandedId === c.id && (
                  <div className="mc-detail">
                    <div className="mc-detail-grid">
                      <div>
                        <div className="mc-detail-label">Category</div>
                        <div className="mc-detail-value">{c.category}</div>
                      </div>
                      <div>
                        <div className="mc-detail-label">Room Number</div>
                        <div className="mc-detail-value">{c.roomNumber}</div>
                      </div>
                      <div>
                        <div className="mc-detail-label">Submitted</div>
                        <div className="mc-detail-value">{formatDate(c.createdAt)}</div>
                      </div>
                      <div>
                        <div className="mc-detail-label">Last Updated</div>
                        <div className="mc-detail-value">{formatDate(c.updatedAt)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="mc-detail-label">Description</div>
                      <div className="mc-detail-value">{c.description}</div>
                    </div>

                    {/* Admin note — only show if admin left one */}
                    {c.adminNote && (
                      <div className="mc-admin-note">
                        <div className="mc-detail-label">Admin Response</div>
                        <div className="mc-detail-value">{c.adminNote}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
