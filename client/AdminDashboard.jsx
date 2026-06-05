/**
 * pages/AdminDashboard.jsx
 *
 * WHAT THIS IS:
 * The admin-only dashboard. Only accessible when the logged-in user
 * has { role: "admin" } as a Firebase custom claim.
 *
 * FEATURES:
 * 1. Stats overview — total, open, in-progress, resolved complaints
 * 2. Complaints table — all complaints from all students with filters
 * 3. Update complaint status + add admin note via modal
 * 4. Create notices for students
 *
 * HOW DATA IS FETCHED:
 * Unlike the student dashboard which uses Firestore onSnapshot directly,
 * the admin dashboard fetches data through your Express backend.
 * This is because the admin routes require the Firebase token to be
 * verified server-side — only your backend can read all complaints.
 *
 * API CALLS:
 * GET  /api/admin/complaints         → fetch all complaints
 * PATCH /api/complaints/:id          → update complaint status
 */

import { useState, useEffect, useMemo } from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

const STATUS_META = {
  open:          { label: "Open",        color: "#fff", bg: "#f5a623" },
  "in-progress": { label: "In Progress", color: "#fff", bg: "#3a8be0" },
  resolved:      { label: "Resolved",    color: "#fff", bg: "#2dbdaa" },
  pending:       { label: "Pending",     color: "#fff", bg: "#a07ae0" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span style={{
      padding: "4px 12px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 700, color: meta.color, background: meta.bg, whiteSpace: "nowrap",
    }}>
      {meta.label}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const FILTERS = ["all", "open", "pending", "in-progress", "resolved"];
const CATEGORIES = ["All", "Plumbing", "Electrical", "Furniture", "Cleanliness", "IT Support", "Security", "Other"];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [activeNav, setActiveNav] = useState("complaints");
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);
    });
    return unsub;
  }, [navigate]);

  // Fetch all complaints via backend
  // We use the backend instead of Firestore directly because:
  // the Admin SDK on the backend has full access to all complaints
  // regardless of studentId — something the client SDK can't do safely
  useEffect(() => {
    if (!user) return;
    fetchComplaints();
  }, [user]);

  async function fetchComplaints() {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API}/api/admin/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComplaints(data.complaints);
    } catch (err) {
      setError("Failed to load complaints. " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Client-side filtering + search
  // Data is already in memory — no need to re-fetch for each filter
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesStatus = activeFilter === "all" || c.status === activeFilter;
      const matchesCategory = categoryFilter === "All" || c.category === categoryFilter;
      const term = search.toLowerCase();
      const matchesSearch = !term ||
        c.title?.toLowerCase().includes(term) ||
        c.guestName?.toLowerCase().includes(term) ||
        c.roomNumber?.toLowerCase().includes(term) ||
        c.complaintId?.toLowerCase().includes(term);
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [complaints, activeFilter, categoryFilter, search]);

  // Stats derived from full complaints array
  const stats = {
    total:      complaints.length,
    open:       complaints.filter((c) => c.status === "open" || c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved:   complaints.filter((c) => c.status === "resolved").length,
  };

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ad-root {
          display: flex; min-height: 100vh;
          background: #eef6f6;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e;
        }

        /* ── Sidebar ── */
        .ad-sidebar {
          width: 220px; flex-shrink: 0;
          background: #1a2e2e;
          display: flex; flex-direction: column;
          padding: 24px 0;
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }
        .ad-logo {
          display: flex; align-items: center; gap: 10px;
          padding: 0 20px 28px;
        }
        .ad-logo-mark {
          width: 32px; height: 32px; background: #2dbdaa;
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ad-logo-name { font-size: 15px; font-weight: 700; color: #fff; }
        .ad-logo-badge {
          font-size: 9px; font-weight: 700;
          background: rgba(45,189,170,0.2); color: #2dbdaa;
          padding: 2px 6px; border-radius: 4px;
          letter-spacing: 0.5px; margin-left: 2px;
        }
        .ad-nav {
          flex: 1; display: flex; flex-direction: column;
          gap: 2px; padding: 0 10px;
        }
        .ad-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.45);
          border: none; background: none; width: 100%; text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        .ad-nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }
        .ad-nav-item.active { background: #2dbdaa; color: #fff; font-weight: 600; }
        .ad-sidebar-footer {
          padding: 16px 10px 0;
          border-top: 1px solid rgba(255,255,255,0.08); margin-top: 16px;
        }

        /* ── Main ── */
        .ad-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        /* ── Header ── */
        .ad-header {
          background: #fff; border-bottom: 1px solid #d6ecea;
          position: sticky; top: 0; z-index: 10;
        }
        .ad-header-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 32px; border-bottom: 1px solid #d6ecea;
        }
        .ad-header-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px;
          color: #2dbdaa; background: rgba(45,189,170,0.08);
          padding: 4px 10px; border-radius: 6px;
        }
        .ad-user-row { display: flex; align-items: center; gap: 10px; }
        .ad-user-name { font-size: 13px; font-weight: 600; color: #1a2e2e; text-align: right; }
        .ad-user-sub  { font-size: 11px; color: #6b9999; text-align: right; margin-top: 1px; }
        .ad-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #1a2e2e; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
        }
        .ad-header-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 32px;
        }
        .ad-page-title { font-size: 20px; font-weight: 700; color: #1a2e2e; }
        .ad-notice-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 18px; background: #2dbdaa; color: #fff;
          border: none; border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .ad-notice-btn:hover { background: #25a896; }

        /* ── Content ── */
        .ad-content {
          flex: 1; padding: 28px 32px;
          display: flex; flex-direction: column; gap: 24px;
        }

        /* ── Stats ── */
        .ad-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .ad-stat-card {
          background: #fff; border-radius: 12px; padding: 20px 22px;
          border: 1px solid #d6ecea;
          display: flex; flex-direction: column; gap: 10px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ad-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45,189,170,0.1); }
        .ad-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .ad-stat-label { font-size: 12px; color: #6b9999; font-weight: 500; }
        .ad-stat-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .ad-stat-num { font-size: 34px; font-weight: 700; color: #1a2e2e; line-height: 1; letter-spacing: -1px; }
        .ad-stat-sub { font-size: 11px; color: #9bbcbc; }

        /* ── Toolbar ── */
        .ad-toolbar {
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .ad-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .ad-filter-btn {
          padding: 7px 16px; border-radius: 20px;
          border: 1.5px solid #d6ecea; background: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 600; color: #6b9999; cursor: pointer;
          transition: all 0.15s; text-transform: capitalize;
        }
        .ad-filter-btn:hover { border-color: #2dbdaa; color: #2dbdaa; }
        .ad-filter-btn.active { background: #2dbdaa; border-color: #2dbdaa; color: #fff; }
        .ad-search-wrap { position: relative; }
        .ad-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9bbcbc; pointer-events: none; }
        .ad-search {
          padding: 9px 12px 9px 36px; border: 1.5px solid #d6ecea;
          border-radius: 8px; font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e; background: #fff; outline: none; width: 220px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ad-search:focus { border-color: #2dbdaa; box-shadow: 0 0 0 3px rgba(45,189,170,0.1); }
        .ad-search::placeholder { color: #9bbcbc; }

        /* ── Category select ── */
        .ad-cat-select {
          padding: 9px 14px; border: 1.5px solid #d6ecea;
          border-radius: 8px; font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e; background: #fff; outline: none; cursor: pointer;
        }
        .ad-cat-select:focus { border-color: #2dbdaa; }

        /* ── Table ── */
        .ad-table-wrap {
          background: #fff; border-radius: 14px;
          border: 1px solid #d6ecea; overflow: hidden;
        }
        .ad-table-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px; border-bottom: 1px solid #d6ecea;
        }
        .ad-table-title { font-size: 14px; font-weight: 700; color: #1a2e2e; }
        .ad-table-count { font-size: 12px; color: #9bbcbc; }

        .ad-complaint-card {
          display: flex; align-items: center;
          padding: 16px 22px; border-bottom: 1px solid #f0f8f8;
          gap: 14px; transition: background 0.12s; cursor: pointer;
        }
        .ad-complaint-card:last-child { border-bottom: none; }
        .ad-complaint-card:hover { background: #f7fcfc; }

        .ad-complaint-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #eef6f6; color: #2dbdaa;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .ad-complaint-info { flex: 1; min-width: 0; }
        .ad-complaint-title {
          font-size: 13px; font-weight: 600; color: #1a2e2e;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .ad-complaint-meta {
          font-size: 11px; color: #9bbcbc;
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        }
        .ad-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: #b8d4d4; flex-shrink: 0; }
        .ad-complaint-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .ad-complaint-date { font-size: 11px; color: #9bbcbc; white-space: nowrap; }

        /* ── Empty / Error ── */
        .ad-empty {
          padding: 56px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .ad-empty-icon {
          width: 48px; height: 48px; background: #eef6f6;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; margin-bottom: 4px;
        }
        .ad-empty-title { font-size: 15px; font-weight: 700; color: #1a2e2e; }
        .ad-empty-sub { font-size: 13px; color: #9bbcbc; }
        .ad-error { padding: 14px 18px; background: #fff4f2; color: #b23312; border: 1px solid #f5c6cb; border-radius: 10px; font-size: 13px; }

        /* ── Skeleton ── */
        .ad-skeleton { height: 72px; border-radius: 0; background: linear-gradient(90deg, #d6ecea 25%, #eef6f6 50%, #d6ecea 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-bottom: 1px solid #f0f8f8; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Responsive ── */
        @media (max-width: 1024px) { .ad-stats { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 768px) {
          .ad-sidebar { display: none; }
          .ad-content { padding: 20px 16px; }
          .ad-stats { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      <div className="ad-root">
        {/* ── Sidebar ── */}
        <aside className="ad-sidebar">
          <div className="ad-logo">
            <div className="ad-logo-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L2 13h12L8 2z" fill="#fff"/>
              </svg>
            </div>
            <div>
              <span className="ad-logo-name">HostelCare</span>
              <span className="ad-logo-badge">ADMIN</span>
            </div>
          </div>
          <nav className="ad-nav">
            {[
              { id: "complaints", label: "Complaints",    icon: "📋" },
              { id: "notices",    label: "Notices",       icon: "📢" },
            ].map((item) => (
              <button
                key={item.id}
                className={`ad-nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ad-sidebar-footer">
            <button className="ad-nav-item" onClick={handleLogout} style={{ color: "rgba(255,100,100,0.7)" }}>
              <span>🚪</span> Sign out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="ad-main">
          <header className="ad-header">
            <div className="ad-header-top">
              <span className="ad-header-label">Admin Panel</span>
              <div className="ad-user-row">
                <div>
                  <div className="ad-user-name">{user.displayName || user.email}</div>
                  <div className="ad-user-sub">Administrator</div>
                </div>
                <div className="ad-avatar">{getInitials(user.displayName || user.email)}</div>
              </div>
            </div>
            <div className="ad-header-bottom">
              <div className="ad-page-title">
                {activeNav === "complaints" && "All Complaints"}
                {activeNav === "notices" && "Manage Notices"}
              </div>
              {activeNav === "notices" && (
                <button className="ad-notice-btn" onClick={() => setShowNoticeForm(true)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  New Notice
                </button>
              )}
            </div>
          </header>

          <main className="ad-content">
            {error && <div className="ad-error">{error}</div>}

            {/* ── Complaints view ── */}
            {activeNav === "complaints" && (
              <>
                {/* Stats */}
                <div className="ad-stats">
                  {[
                    { label: "Total", value: stats.total, sub: "All complaints", bg: "rgba(45,189,170,0.1)", color: "#2dbdaa" },
                    { label: "Open / Pending", value: stats.open, sub: "Need attention", bg: "rgba(245,166,35,0.1)", color: "#f5a623" },
                    { label: "In Progress", value: stats.inProgress, sub: "Being addressed", bg: "rgba(58,139,224,0.1)", color: "#3a8be0" },
                    { label: "Resolved", value: stats.resolved, sub: "Successfully fixed", bg: "rgba(45,189,170,0.1)", color: "#2dbdaa" },
                  ].map((s) => (
                    <div className="ad-stat-card" key={s.label}>
                      <div className="ad-stat-top">
                        <span className="ad-stat-label">{s.label}</span>
                        <div className="ad-stat-icon" style={{ background: s.bg }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6.5" stroke={s.color} strokeWidth="1.3"/>
                          </svg>
                        </div>
                      </div>
                      <div className="ad-stat-num">{loading ? "—" : s.value}</div>
                      <div className="ad-stat-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="ad-toolbar">
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div className="ad-filters">
                      {FILTERS.map((f) => (
                        <button
                          key={f}
                          className={`ad-filter-btn ${activeFilter === f ? "active" : ""}`}
                          onClick={() => setActiveFilter(f)}
                        >
                          {f === "all" ? "All" : f}
                        </button>
                      ))}
                    </div>
                    <select
                      className="ad-cat-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="ad-search-wrap">
                    <span className="ad-search-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      className="ad-search"
                      placeholder="Search by name, room, ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Complaints table */}
                <div className="ad-table-wrap">
                  <div className="ad-table-head">
                    <span className="ad-table-title">Complaints</span>
                    <span className="ad-table-count">{filtered.length} of {complaints.length}</span>
                  </div>

                  {loading ? (
                    [1,2,3,4,5].map(i => <div key={i} className="ad-skeleton" />)
                  ) : filtered.length === 0 ? (
                    <div className="ad-empty">
                      <div className="ad-empty-icon">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <path d="M11 2L2 19h18L11 2z" stroke="#2dbdaa" strokeWidth="1.5" strokeLinejoin="round"/>
                          <path d="M11 9v5M11 16v.5" stroke="#2dbdaa" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="ad-empty-title">No complaints found</div>
                      <div className="ad-empty-sub">Try adjusting your filters.</div>
                    </div>
                  ) : (
                    filtered.map((c) => (
                      <div
                        key={c.id}
                        className="ad-complaint-card"
                        onClick={() => setSelectedComplaint(c)}
                      >
                        <div className="ad-complaint-avatar">
                          {getInitials(c.guestName || c.studentEmail)}
                        </div>
                        <div className="ad-complaint-info">
                          <div className="ad-complaint-title">{c.title}</div>
                          <div className="ad-complaint-meta">
                            <span>{c.complaintId || `#${c.id.slice(0,7).toUpperCase()}`}</span>
                            <span className="ad-meta-dot"/>
                            <span>{c.guestName || c.studentEmail}</span>
                            <span className="ad-meta-dot"/>
                            <span>Room {c.roomNumber}</span>
                            <span className="ad-meta-dot"/>
                            <span>{c.category}</span>
                          </div>
                        </div>
                        <div className="ad-complaint-right">
                          <span className="ad-complaint-date">{formatDate(c.createdAt)}</span>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── Notices view ── */}
            {activeNav === "notices" && (
              <NoticesManager user={user} />
            )}
          </main>
        </div>
      </div>

      {/* ── Update complaint modal ── */}
      {selectedComplaint && (
        <UpdateComplaintModal
          complaint={selectedComplaint}
          user={user}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={(updatedId, newStatus, adminNote) => {
            setComplaints((prev) =>
              prev.map((c) =>
                c.id === updatedId
                  ? { ...c, status: newStatus, adminNote }
                  : c
              )
            );
            setSelectedComplaint(null);
          }}
        />
      )}

      {/* ── Create notice modal ── */}
      {showNoticeForm && (
        <CreateNoticeModal
          user={user}
          onClose={() => setShowNoticeForm(false)}
        />
      )}
    </>
  );
}

// ── Update Complaint Modal ────────────────────────────────
function UpdateComplaintModal({ complaint, user, onClose, onUpdated }) {
  const [status, setStatus] = useState(complaint.status);
  const [adminNote, setAdminNote] = useState(complaint.adminNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdate() {
    setSaving(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API}/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(complaint.id, status, adminNote);
    } catch (err) {
      setError("Failed to update: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{`
        .ucm-overlay {
          position: fixed; inset: 0;
          background: rgba(26,46,46,0.5);
          backdrop-filter: blur(4px);
          z-index: 100; display: flex;
          align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ucm-modal {
          background: #fff; border-radius: 16px;
          width: 100%; max-width: 500px;
          animation: slideUp 0.25s ease;
          box-shadow: 0 24px 64px rgba(26,46,46,0.2);
          overflow: hidden;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ucm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #d6ecea;
        }
        .ucm-title { font-size: 16px; font-weight: 700; color: #1a2e2e; font-family: 'Plus Jakarta Sans', sans-serif; }
        .ucm-close {
          width: 30px; height: 30px; border-radius: 8px;
          border: none; background: #eef6f6; color: #6b9999;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .ucm-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 16px; font-family: 'Plus Jakarta Sans', sans-serif; }
        .ucm-complaint-info {
          background: #f7fcfc; border: 1px solid #d6ecea;
          border-radius: 10px; padding: 14px 16px;
        }
        .ucm-complaint-title { font-size: 14px; font-weight: 600; color: #1a2e2e; margin-bottom: 6px; }
        .ucm-complaint-meta { font-size: 12px; color: #9bbcbc; display: flex; gap: 8px; flex-wrap: wrap; }
        .ucm-label { font-size: 12px; font-weight: 600; color: #4a7070; letter-spacing: 0.3px; margin-bottom: 6px; display: block; }
        .ucm-select, .ucm-textarea {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #d6ecea; border-radius: 9px;
          font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e; background: #f7fcfc; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ucm-select:focus, .ucm-textarea:focus {
          border-color: #2dbdaa; background: #fff;
          box-shadow: 0 0 0 3px rgba(45,189,170,0.1);
        }
        .ucm-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .ucm-error { padding: 10px 14px; background: rgba(224,85,85,0.08); border: 1px solid rgba(224,85,85,0.2); border-radius: 8px; font-size: 12px; color: #e05555; font-family: 'Plus Jakarta Sans', sans-serif; }
        .ucm-footer { display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid #d6ecea; }
        .ucm-cancel {
          flex: 1; padding: 11px; background: #eef6f6; color: #6b9999;
          border: none; border-radius: 9px; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .ucm-save {
          flex: 2; padding: 11px; background: #2dbdaa; color: #fff;
          border: none; border-radius: 9px; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s;
        }
        .ucm-save:hover:not(:disabled) { background: #25a896; }
        .ucm-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .ucm-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ucm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="ucm-modal">
          <div className="ucm-header">
            <span className="ucm-title">Update Complaint</span>
            <button className="ucm-close" onClick={onClose}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="ucm-body">
            {error && <div className="ucm-error">{error}</div>}
            <div className="ucm-complaint-info">
              <div className="ucm-complaint-title">{complaint.title}</div>
              <div className="ucm-complaint-meta">
                <span>{complaint.complaintId}</span>
                <span>·</span>
                <span>{complaint.guestName || complaint.studentEmail}</span>
                <span>·</span>
                <span>Room {complaint.roomNumber}</span>
                <span>·</span>
                <span>{complaint.category}</span>
              </div>
              {complaint.description && (
                <p style={{ fontSize: "13px", color: "#6b9999", marginTop: "10px", lineHeight: 1.6 }}>
                  {complaint.description}
                </p>
              )}
            </div>
            <div>
              <label className="ucm-label">Update Status</label>
              <select className="ucm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="ucm-label">Admin Note (optional)</label>
              <textarea
                className="ucm-textarea"
                placeholder="Add a note for the student about this complaint..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <div className="ucm-footer">
            <button className="ucm-cancel" onClick={onClose}>Cancel</button>
            <button className="ucm-save" onClick={handleUpdate} disabled={saving}>
              {saving ? <><span className="ucm-spinner" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Notices Manager ───────────────────────────────────────
function NoticesManager({ user }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { db } = require("../firebase");
  const { collection, query, orderBy, onSnapshot } = require("firebase/firestore");

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ad-notice-btn" onClick={() => setShowForm(true)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Notice
        </button>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d6ecea", overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #d6ecea", fontWeight: 700, fontSize: 14, color: "#1a2e2e" }}>
          All Notices
        </div>
        {loading ? (
          <div style={{ padding: 24, color: "#9bbcbc", fontSize: 13, textAlign: "center" }}>Loading...</div>
        ) : notices.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#9bbcbc", fontSize: 13 }}>
            No notices yet. Create your first one.
          </div>
        ) : (
          notices.map((n) => (
            <div key={n.id} style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              padding: "14px 22px", borderBottom: "1px solid #f0f8f8", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2e2e", marginBottom: 4 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: "#9bbcbc" }}>
                  {n.category} · {n.scope} · {n.date?.toDate?.().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {n.pinned && <span style={{ marginLeft: 8, color: "#2dbdaa", fontWeight: 700 }}>📌 Pinned</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {showForm && <CreateNoticeModal user={user} onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ── Create Notice Modal ───────────────────────────────────
function CreateNoticeModal({ user, onClose }) {
  const [fields, setFields] = useState({
    title: "", description: "", category: "general", scope: "", pinned: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleCreate() {
    if (!fields.title.trim() || !fields.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      const { db } = await import("../firebase");
      const { collection, addDoc, Timestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "notices"), {
        ...fields,
        date: Timestamp.now(),
        createdBy: user.email,
      });
      onClose();
    } catch (err) {
      setError("Failed to create notice: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(26,46,46,0.5)", backdropFilter: "blur(4px)",
      zIndex: 100, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
        boxShadow: "0 24px 64px rgba(26,46,46,0.2)", overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #d6ecea" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a2e2e" }}>Create Notice</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#eef6f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b9999" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div style={{ padding: "10px 14px", background: "rgba(224,85,85,0.08)", borderRadius: 8, fontSize: 12, color: "#e05555" }}>{error}</div>}
          {[
            { label: "Title", name: "title", placeholder: "e.g. Water Supply Shutdown" },
            { label: "Scope", name: "scope", placeholder: "e.g. Block A, All Hostels" },
          ].map((f) => (
            <div key={f.name}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4a7070", display: "block", marginBottom: 6 }}>{f.label}</label>
              <input name={f.name} value={fields[f.name]} onChange={handleChange} placeholder={f.placeholder}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d6ecea", borderRadius: 9, fontSize: 13, fontFamily: "inherit", color: "#1a2e2e", background: "#f7fcfc", outline: "none" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4a7070", display: "block", marginBottom: 6 }}>Category</label>
            <select name="category" value={fields.category} onChange={handleChange}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d6ecea", borderRadius: 9, fontSize: 13, fontFamily: "inherit", color: "#1a2e2e", background: "#f7fcfc", outline: "none", cursor: "pointer" }}>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4a7070", display: "block", marginBottom: 6 }}>Description</label>
            <textarea name="description" value={fields.description} onChange={handleChange}
              placeholder="Write the full notice content here..."
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d6ecea", borderRadius: 9, fontSize: 13, fontFamily: "inherit", color: "#1a2e2e", background: "#f7fcfc", outline: "none", minHeight: 100, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1a2e2e", cursor: "pointer", fontWeight: 500 }}>
            <input type="checkbox" name="pinned" checked={fields.pinned} onChange={handleChange} style={{ accentColor: "#2dbdaa", width: 15, height: 15 }} />
            Pin this notice (shows at top for students)
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid #d6ecea" }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: "#eef6f6", color: "#6b9999", border: "none", borderRadius: 9, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            style={{ flex: 2, padding: 11, background: "#2dbdaa", color: "#fff", border: "none", borderRadius: 9, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Creating..." : "Create Notice"}
          </button>
        </div>
      </div>
    </div>
  );
}
