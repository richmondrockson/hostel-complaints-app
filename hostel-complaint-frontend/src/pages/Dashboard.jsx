import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_META = {
  open: { label: "Open", color: "#fff", bg: "#f5a623" },
  "in-progress": { label: "In Progress", color: "#fff", bg: "#2dbdaa" },
  resolved: { label: "Resolved", color: "#fff", bg: "#2dbdaa" },
  pending: { label: "Pending", color: "#fff", bg: "#f5a623" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span
      style={{
        padding: "5px 14px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        color: meta.color,
        background: meta.bg,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "complaints", label: "My Complaints", icon: <FileIcon /> },
  { id: "notices", label: "Notices", icon: <BellIcon /> },
  { id: "profile", label: "Profile", icon: <UserIcon /> },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "complaints"),
      where("studentId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const q = query(
      collection(db, "notices"),
      orderBy("date", "desc"),
      limit(5),
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const stats = {
    total: complaints.length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    pending: complaints.filter(
      (c) => c.status === "pending" || c.status === "open",
    ).length,
  };

  const recentComplaints = complaints.slice(0, 4);

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

        .db-root {
          display: flex; min-height: 100vh;
          background: #eef6f6;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e;
        }

        /* Sidebar */
        .db-sidebar {
          width: 220px; flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #d6ecea;
          display: flex; flex-direction: column;
          padding: 24px 0;
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }

        .db-nav {
          flex: 1; display: flex; flex-direction: column;
          gap: 2px; padding: 0 10px;
        }
        .db-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 500; color: #6b9999;
          border: none; background: none; width: 100%; text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        .db-nav-item:hover { background: #eef6f6; color: #1a2e2e; }
        .db-nav-item.active { background: #2dbdaa; color: #fff; font-weight: 600; }
        .db-nav-item svg { flex-shrink: 0; }
        .db-sidebar-footer {
          padding: 16px 10px 0;
          border-top: 1px solid #d6ecea; margin-top: 16px;
        }

        /* Main */
        .db-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        /* Header — two rows */
        .db-header {
          background: #fff;
          border-bottom: 1px solid #d6ecea;
          position: sticky; top: 0; z-index: 10;
        }

        /* Row 1: Logo + user profile */
        .db-header-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 32px;
          border-bottom: 1px solid #d6ecea;
        }
        .db-logo-inline {
          display: flex; align-items: center; gap: 10px;
        }
        .db-logo-mark-inline {
          width: 30px; height: 30px; background: #2dbdaa;
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .db-logo-name-inline { font-size: 15px; font-weight: 700; color: #1a2e2e; }
        .db-user-row { display: flex; align-items: center; gap: 10px; }
        .db-user-info { text-align: right; }
        .db-user-name { font-size: 13px; font-weight: 600; color: #1a2e2e; }
        .db-user-sub  { font-size: 11px; color: #6b9999; margin-top: 1px; }
        .db-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #2dbdaa; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
        }

        /* Row 2: Page title + New Complaint button */
        .db-header-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 32px;
        }
        .db-topbar-title { font-size: 20px; font-weight: 700; color: #1a2e2e; }
        .db-new-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 18px; background: #2dbdaa; color: #fff;
          border: none; border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .db-new-btn:hover { background: #25a896; }
        .db-new-btn:active { transform: scale(0.98); }

        /* Content */
        .db-content {
          flex: 1; padding: 28px 32px;
          display: flex; flex-direction: column; gap: 24px;
          animation: fadeUp 0.35s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Stat cards */
        .db-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .db-stat-card {
          background: #fff; border-radius: 12px; padding: 20px 22px;
          border: 1px solid #d6ecea;
          display: flex; flex-direction: column; gap: 10px;
          transition: transform 0.15s, box-shadow 0.15s;
          animation: fadeUp 0.35s ease both;
        }
        .db-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45,189,170,0.1); }
        .db-stat-card:nth-child(1) { animation-delay: 0.05s; }
        .db-stat-card:nth-child(2) { animation-delay: 0.10s; }
        .db-stat-card:nth-child(3) { animation-delay: 0.15s; }
        .db-stat-card:nth-child(4) { animation-delay: 0.20s; }
        .db-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .db-stat-label { font-size: 12px; color: #6b9999; font-weight: 500; }
        .db-stat-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .db-stat-num { font-size: 34px; font-weight: 700; color: #1a2e2e; line-height: 1; letter-spacing: -1px; }
        .db-stat-sub { font-size: 11px; color: #9bbcbc; }

        /* Bottom grid */
        .db-bottom { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }

        /* Panels */
        .db-panel {
          background: #fff; border-radius: 12px;
          border: 1px solid #d6ecea; overflow: hidden;
          animation: fadeUp 0.35s ease 0.22s both;
        }
        .db-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px 14px; border-bottom: 1px solid #d6ecea;
        }
        .db-panel-title { font-size: 14px; font-weight: 700; color: #1a2e2e; }
        .db-view-all {
          font-size: 12px; color: #2dbdaa; background: none; border: none;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; padding: 0;
        }
        .db-view-all:hover { text-decoration: underline; }

        /* Complaint rows */
        .db-complaint-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 22px; border-bottom: 1px solid #f0f8f8;
          gap: 12px; transition: background 0.12s; cursor: pointer;
        }
        .db-complaint-row:last-child { border-bottom: none; }
        .db-complaint-row:hover { background: #f7fcfc; }
        .db-complaint-info { flex: 1; min-width: 0; }
        .db-complaint-title {
          font-size: 13px; font-weight: 600; color: #1a2e2e;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
        }
        .db-complaint-meta {
          font-size: 11px; color: #9bbcbc;
          display: flex; align-items: center; gap: 6px;
        }
        .db-complaint-meta-dot {
          width: 3px; height: 3px; border-radius: 50%; background: #b8d4d4; flex-shrink: 0;
        }

        /* Notice rows */
        .db-notice-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 22px; border-bottom: 1px solid #f0f8f8;
          transition: background 0.12s; cursor: pointer;
        }
        .db-notice-row:last-child { border-bottom: none; }
        .db-notice-row:hover { background: #f7fcfc; }
        .db-notice-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(45,189,170,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .db-notice-info { flex: 1; min-width: 0; }
        .db-notice-title {
          font-size: 13px; font-weight: 600; color: #1a2e2e;
          margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .db-notice-meta { font-size: 11px; color: #9bbcbc; }

        /* Empty */
        .db-empty { padding: 40px 22px; text-align: center; color: #9bbcbc; font-size: 13px; line-height: 1.6; }

        /* Skeleton */
        .db-skeleton {
          height: 13px; border-radius: 6px;
          background: linear-gradient(90deg, #d6ecea 25%, #eef6f6 50%, #d6ecea 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Responsive */
        @media (max-width: 1024px) {
          .db-stats { grid-template-columns: repeat(2,1fr); }
          .db-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .db-sidebar { display: none; }
          .db-content { padding: 20px 16px; }
          .db-header-bottom { padding: 10px 16px; }
          .db-stats   { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      <div className="db-root">
        {/* Sidebar */}
        <aside className="db-sidebar">
          <nav className="db-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`db-nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="db-sidebar-footer">
            <button
              className="db-nav-item"
              onClick={handleLogout}
              style={{ color: "#e05555" }}
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="db-main">
          <header className="db-header">
            <div className="db-header-top">
              <div className="db-logo-inline">
                <div className="db-logo-mark-inline">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L2 13h12L8 2z" fill="#fff" />
                  </svg>
                </div>
                <span className="db-logo-name-inline">HostelCare</span>
              </div>
              <div className="db-user-row">
                <div className="db-user-info">
                  <div className="db-user-name">
                    {user.displayName || "Student"}
                  </div>
                  <div className="db-user-sub">{user.email}</div>
                </div>
                <div className="db-avatar">
                  {getInitials(user.displayName || user.email)}
                </div>
              </div>
            </div>
            <div className="db-header-bottom">
              <div className="db-topbar-title">
                {activeNav === "dashboard" && "Dashboard"}
                {activeNav === "complaints" && "My Complaints"}
                {activeNav === "notices" && "Notices"}
                {activeNav === "profile" && "Profile"}
              </div>
              <button
                className="db-new-btn"
                onClick={() => navigate("/complaints/new")}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M6.5 1.5v10M1.5 6.5h10"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                New Complaint
              </button>
            </div>
          </header>

          <main className="db-content">
            {/* Stat cards */}
            <div className="db-stats">
              <StatCard
                label="Total Complaints"
                value={loading ? "—" : stats.total}
                sub="This semester"
                iconBg="rgba(45,189,170,0.12)"
                icon={<FileIcon color="#2dbdaa" />}
              />
              <StatCard
                label="In Progress"
                value={loading ? "—" : stats.inProgress}
                sub="Currently being addressed"
                iconBg="rgba(245,166,35,0.12)"
                icon={<ClockIcon color="#f5a623" />}
              />
              <StatCard
                label="Resolved"
                value={loading ? "—" : stats.resolved}
                sub="Successfully fixed"
                iconBg="rgba(45,189,170,0.12)"
                icon={<CheckIcon color="#2dbdaa" />}
              />
              <StatCard
                label="Pending"
                value={loading ? "—" : stats.pending}
                sub="Awaiting assignment"
                iconBg="rgba(240,90,40,0.1)"
                icon={<AlertIcon color="#f05a28" />}
              />
            </div>

            {/* Bottom panels */}
            <div className="db-bottom">
              <div className="db-panel">
                <div className="db-panel-head">
                  <span className="db-panel-title">Recent Complaints</span>
                  <button
                    className="db-view-all"
                    onClick={() => setActiveNav("complaints")}
                  >
                    View All
                  </button>
                </div>
                {loading ? (
                  <div
                    style={{
                      padding: "18px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div className="db-skeleton" style={{ width: "55%" }} />
                        <div
                          className="db-skeleton"
                          style={{ width: "38%", height: 10 }}
                        />
                      </div>
                    ))}
                  </div>
                ) : recentComplaints.length === 0 ? (
                  <div className="db-empty">
                    No complaints yet.{" "}
                    <span
                      style={{
                        color: "#2dbdaa",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      onClick={() => navigate("/complaints/new")}
                    >
                      Submit your first one →
                    </span>
                  </div>
                ) : (
                  recentComplaints.map((c) => (
                    <div className="db-complaint-row" key={c.id}>
                      <div className="db-complaint-info">
                        <div className="db-complaint-title">{c.title}</div>
                        <div className="db-complaint-meta">
                          <span>
                            #{c.complaintId || c.id.slice(0, 7).toUpperCase()}
                          </span>
                          <span className="db-complaint-meta-dot" />
                          <span>{c.category}</span>
                          <span className="db-complaint-meta-dot" />
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))
                )}
              </div>

              <div className="db-panel">
                <div className="db-panel-head">
                  <span className="db-panel-title">Recent Notices</span>
                  <button
                    className="db-view-all"
                    onClick={() => setActiveNav("notices")}
                  >
                    View All
                  </button>
                </div>
                {notices.length === 0 ? (
                  <div className="db-empty">No notices yet.</div>
                ) : (
                  notices.map((n) => (
                    <div className="db-notice-row" key={n.id}>
                      <div className="db-notice-icon">
                        <BellIcon color="#2dbdaa" size={14} />
                      </div>
                      <div className="db-notice-info">
                        <div className="db-notice-title">{n.title}</div>
                        <div className="db-notice-meta">
                          {formatDate(n.date)}
                          {n.scope ? ` · ${n.scope}` : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, sub, icon, iconBg }) {
  return (
    <div className="db-stat-card">
      <div className="db-stat-top">
        <span className="db-stat-label">{label}</span>
        <div className="db-stat-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="db-stat-num">{value}</div>
      <div className="db-stat-sub">{sub}</div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect
        x="1"
        y="1"
        width="5.5"
        height="5.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="8.5"
        y="1"
        width="5.5"
        height="5.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="1"
        y="8.5"
        width="5.5"
        height="5.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="8.5"
        y="8.5"
        width="5.5"
        height="5.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
function FileIcon({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M9 1v5h5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M5 9h6M5 11.5h4"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function BellIcon({ color = "currentColor", size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5A4.5 4.5 0 003.5 6v3L2 11h12l-1.5-2V6A4.5 4.5 0 008 1.5z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.5 11.5a1.5 1.5 0 003 0" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ClockIcon({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3" />
      <path
        d="M8 4.5V8l2.5 2.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CheckIcon({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3" />
      <path
        d="M5 8l2.5 2.5L11 5.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function AlertIcon({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2L1.5 13.5h13L8 2z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.5v3M8 11v.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M10.5 11L14 8l-3.5-3M14 8H6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
