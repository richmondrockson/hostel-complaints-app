import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
        padding: "4px 12px",
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

// ── Main Component ────────────────────────────────────────
export default function Profile({ user, complaints }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  // Fetch profile from Firestore on mount
  // doc(db, "users", user.uid) — gets the document where ID = user's uid
  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Called by EditProfileModal after saving
  // Updates local state so UI reflects changes immediately
  // without needing to re-fetch from Firestore
  function handleProfileUpdate(updatedData) {
    setProfile(updatedData);
    setShowEdit(false);
  }

  // Stats derived from complaints array passed from Dashboard
  const stats = {
    total: complaints.length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const recentComplaints = complaints.slice(0, 4);

  // Display name — profile takes priority over Auth displayName
  const displayName = profile?.displayName || user?.displayName || "Student";

  return (
    <>
      <style>{`
        .pr-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Profile card ── */
        .pr-card {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 14px;
          overflow: hidden;
        }

        /* Header */
        .pr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          gap: 20px;
          flex-wrap: wrap;
          border-bottom: 1px solid #d6ecea;
        }
        .pr-header-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .pr-avatar {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: #2dbdaa;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .pr-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a2e2e;
          margin-bottom: 6px;
        }
        .pr-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          color: #6b9999;
          margin-bottom: 8px;
        }
        .pr-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pr-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pr-badge {
          padding: "4px 10px";
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
        }
        .pr-badge-teal { background: rgba(45,189,170,0.1); color: #2dbdaa; }
        .pr-badge-orange { background: rgba(245,166,35,0.1); color: #f5a623; }

        .pr-header-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pr-edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #2dbdaa;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .pr-edit-btn:hover { background: #25a896; }
        .pr-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: none;
          color: #e05555;
          border: 1.5px solid rgba(224,85,85,0.3);
          border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .pr-logout-btn:hover { background: rgba(224,85,85,0.05); }

        /* ── Stat cards ── */
        .pr-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid #d6ecea;
        }
        .pr-stat {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          border-right: 1px solid #d6ecea;
        }
        .pr-stat:last-child { border-right: none; }
        .pr-stat-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pr-stat-num {
          font-size: 24px;
          font-weight: 700;
          color: #1a2e2e;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .pr-stat-label { font-size: 11px; color: #9bbcbc; margin-top: 3px; }

        /* ── Info panels ── */
        .pr-panels {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .pr-panel {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 14px;
          padding: 22px 24px;
        }
        .pr-panel-title {
          font-size: 13px;
          font-weight: 700;
          color: #1a2e2e;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pr-info-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pr-info-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9bbcbc;
          margin-bottom: 4px;
        }
        .pr-info-value {
          font-size: 13px;
          font-weight: 500;
          color: #1a2e2e;
        }
        .pr-info-empty {
          font-size: 13px;
          color: #b8d4d4;
          font-style: italic;
        }

        /* ── Recent complaints ── */
        .pr-recent {
          background: #fff;
          border: 1px solid #d6ecea;
          border-radius: 14px;
          overflow: hidden;
        }
        .pr-recent-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px 14px;
          border-bottom: 1px solid #d6ecea;
        }
        .pr-recent-title { font-size: 14px; font-weight: 700; color: #1a2e2e; }
        .pr-view-all {
          font-size: 12px; color: #2dbdaa; background: none;
          border: none; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600; padding: 0;
        }
        .pr-view-all:hover { text-decoration: underline; }
        .pr-complaint-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 24px;
          border-bottom: 1px solid #f0f8f8;
          gap: 12px;
          transition: background 0.12s;
        }
        .pr-complaint-row:last-child { border-bottom: none; }
        .pr-complaint-row:hover { background: #f7fcfc; }
        .pr-complaint-title {
          font-size: 13px; font-weight: 600; color: #1a2e2e;
          white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; margin-bottom: 3px;
        }
        .pr-complaint-meta {
          font-size: 11px; color: #9bbcbc;
          display: flex; align-items: center; gap: 6px;
        }
        .pr-meta-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: #b8d4d4; flex-shrink: 0;
        }

        /* ── Empty ── */
        .pr-empty {
          padding: 32px 24px;
          text-align: center;
          color: #9bbcbc;
          font-size: 13px;
        }

        /* ── Skeleton ── */
        .pr-skeleton {
          height: 13px; border-radius: 6px;
          background: linear-gradient(90deg, #d6ecea 25%, #eef6f6 50%, #d6ecea 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        @media (max-width: 768px) {
          .pr-panels { grid-template-columns: 1fr; }
          .pr-stats { grid-template-columns: repeat(3, 1fr); }
          .pr-header { flex-direction: column; align-items: flex-start; }
          .pr-header-right { flex-direction: row; }
        }
      `}</style>

      <div className="pr-root">
        {/* ── Profile card ── */}
        <div className="pr-card">
          {/* Header */}
          <div className="pr-header">
            <div className="pr-header-left">
              <div className="pr-avatar">{getInitials(displayName)}</div>
              <div>
                <div className="pr-name">{displayName}</div>
                <div className="pr-meta">
                  {profile?.studentId && (
                    <span className="pr-meta-item">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <rect
                          x="1"
                          y="2"
                          width="10"
                          height="8"
                          rx="1.5"
                          stroke="#9bbcbc"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M4 5h4M4 7h2"
                          stroke="#9bbcbc"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      Student ID: {profile.studentId}
                    </span>
                  )}
                  {profile?.roomNumber && (
                    <span className="pr-meta-item">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 10V5l4-3 4 3v5"
                          stroke="#9bbcbc"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4.5 10V7.5h3V10"
                          stroke="#9bbcbc"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {profile.block ? `${profile.block}, ` : ""}Room{" "}
                      {profile.roomNumber}
                    </span>
                  )}
                  <span className="pr-meta-item">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M1 3l5 3.5L11 3"
                        stroke="#9bbcbc"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <rect
                        x="1"
                        y="2"
                        width="10"
                        height="8"
                        rx="1.5"
                        stroke="#9bbcbc"
                        strokeWidth="1.2"
                      />
                    </svg>
                    {user?.email}
                  </span>
                </div>
                <div className="pr-badges">
                  {profile?.status && (
                    <span className="pr-badge pr-badge-teal">
                      {profile.status}
                    </span>
                  )}
                  {profile?.yearOfStudy && (
                    <span className="pr-badge pr-badge-orange">
                      {profile.yearOfStudy}
                    </span>
                  )}
                  {!profile?.status && !profile?.yearOfStudy && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#b8d4d4",
                        fontStyle: "italic",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowEdit(true)}
                    >
                      Complete your profile →
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pr-header-right">
              <button className="pr-edit-btn" onClick={() => setShowEdit(true)}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M9.5 2.5l1 1-7 7-1.5.5.5-1.5 7-7z"
                    stroke="#fff"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit Profile
              </button>
              <button
                className="pr-logout-btn"
                onClick={async () => {
                  const { signOut } = await import("firebase/auth");
                  const { auth } = await import("../firebase");
                  await signOut(auth);
                  window.location.href = "/login";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.5 9L11.5 6.5 8.5 4M11.5 6.5H5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Log Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="pr-stats">
            <div className="pr-stat">
              <div
                className="pr-stat-icon"
                style={{ background: "rgba(45,189,170,0.1)" }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z"
                    stroke="#2dbdaa"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 1v5h5"
                    stroke="#2dbdaa"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="pr-stat-num">{stats.total}</div>
                <div className="pr-stat-label">Total Complaints</div>
              </div>
            </div>
            <div className="pr-stat">
              <div
                className="pr-stat-icon"
                style={{ background: "rgba(245,166,35,0.1)" }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="#f5a623"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M8 4.5V8l2.5 2.5"
                    stroke="#f5a623"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="pr-stat-num">{stats.inProgress}</div>
                <div className="pr-stat-label">In Progress</div>
              </div>
            </div>
            <div className="pr-stat">
              <div
                className="pr-stat-icon"
                style={{ background: "rgba(45,189,170,0.1)" }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="#2dbdaa"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M5 8l2.5 2.5L11 5.5"
                    stroke="#2dbdaa"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="pr-stat-num">{stats.resolved}</div>
                <div className="pr-stat-label">Resolved</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Info panels ── */}
        <div className="pr-panels">
          {/* Personal Information */}
          <div className="pr-panel">
            <div className="pr-panel-title">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="5"
                  r="3"
                  stroke="#2dbdaa"
                  strokeWidth="1.3"
                />
                <path
                  d="M1.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"
                  stroke="#2dbdaa"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              Personal Information
            </div>
            {loadingProfile ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div
                      className="pr-skeleton"
                      style={{ width: "40%", height: 10, marginBottom: 6 }}
                    />
                    <div className="pr-skeleton" style={{ width: "65%" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pr-info-grid">
                <InfoField
                  label="Full Name"
                  value={profile?.displayName || user?.displayName}
                />
                <InfoField label="Date of Birth" value={profile?.dateOfBirth} />
                <InfoField label="Gender" value={profile?.gender} />
                <InfoField label="Phone Number" value={profile?.phoneNumber} />
              </div>
            )}
          </div>

          {/* Hostel Information */}
          <div className="pr-panel">
            <div className="pr-panel-title">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 12V6l5-4 5 4v6"
                  stroke="#2dbdaa"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 12V9h4v3"
                  stroke="#2dbdaa"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              Hostel Information
            </div>
            {loadingProfile ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div
                      className="pr-skeleton"
                      style={{ width: "40%", height: 10, marginBottom: 6 }}
                    />
                    <div className="pr-skeleton" style={{ width: "65%" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pr-info-grid">
                <InfoField label="Block" value={profile?.block} />
                <InfoField label="Room Number" value={profile?.roomNumber} />
                <InfoField label="Check-in Date" value={profile?.checkInDate} />
              </div>
            )}
          </div>
        </div>

        {/* ── Recent complaints ── */}
        <div className="pr-recent">
          <div className="pr-recent-head">
            <span className="pr-recent-title">Recent Complaints</span>
            <button className="pr-view-all">View All</button>
          </div>
          {recentComplaints.length === 0 ? (
            <div className="pr-empty">No complaints yet.</div>
          ) : (
            recentComplaints.map((c) => (
              <div className="pr-complaint-row" key={c.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pr-complaint-title">{c.title}</div>
                  <div className="pr-complaint-meta">
                    <span>
                      #{c.complaintId || c.id.slice(0, 7).toUpperCase()}
                    </span>
                    <span className="pr-meta-dot" />
                    <span>{formatDate(c.createdAt)}</span>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEdit && (
        <EditProfileModal
          user={user}
          profile={profile}
          onSave={handleProfileUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

// ── Info Field ────────────────────────────────────────────
function InfoField({ label, value }) {
  return (
    <div>
      <div className="pr-info-label">{label}</div>
      {value ? (
        <div className="pr-info-value">{value}</div>
      ) : (
        <div className="pr-info-empty">Not provided</div>
      )}
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────
function EditProfileModal({ user, profile, onSave, onClose }) {
  const [fields, setFields] = useState({
    displayName: profile?.displayName || user?.displayName || "",
    studentId: profile?.studentId || "",
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    phoneNumber: profile?.phoneNumber || "",
    block: profile?.block || "",
    roomNumber: profile?.roomNumber || "",
    checkInDate: profile?.checkInDate || "",
    yearOfStudy: profile?.yearOfStudy || "",
    status: profile?.status || "Active Student",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSave() {
    if (!fields.displayName.trim()) {
      setError("Full name is required.");
      return;
    }
    setSaving(true);
    try {
      const { updateProfile } = await import("firebase/auth");
      const { auth } = await import("../firebase");

      // Save to Firestore users collection
      // setDoc with merge: true — creates the doc if it doesn't exist,
      // updates only changed fields if it does
      const docRef = doc(db, "users", user.uid);
      const updatedData = {
        ...fields,
        email: user.email,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, updatedData, { merge: true });

      // Also update Firebase Auth display name
      await updateProfile(auth.currentUser, {
        displayName: fields.displayName.trim(),
      });

      onSave(updatedData);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{`
        .epm-overlay {
          position: fixed; inset: 0;
          background: rgba(26,46,46,0.5);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .epm-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.25s ease;
          box-shadow: 0 24px 64px rgba(26,46,46,0.2);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .epm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 26px 18px;
          border-bottom: 1px solid #d6ecea;
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 1;
        }
        .epm-title { font-size: 16px; font-weight: 700; color: #1a2e2e; }
        .epm-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: none;
          background: #eef6f6;
          color: #6b9999;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .epm-close:hover { background: #d6ecea; }

        .epm-body { padding: 22px 26px; display: flex; flex-direction: column; gap: 18px; }

        .epm-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #9bbcbc;
          margin-bottom: 4px;
        }

        .epm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .epm-field { display: flex; flex-direction: column; gap: 6px; }
        .epm-label {
          font-size: 12px;
          font-weight: 600;
          color: #4a7070;
          letter-spacing: 0.3px;
        }
        .epm-input, .epm-select {
          padding: 10px 14px;
          border: 1.5px solid #d6ecea;
          border-radius: 9px;
          font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e;
          background: #f7fcfc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .epm-input:focus, .epm-select:focus {
          border-color: #2dbdaa;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45,189,170,0.1);
        }
        .epm-select { cursor: pointer; }

        .epm-error {
          padding: 10px 14px;
          background: rgba(224,85,85,0.08);
          border: 1px solid rgba(224,85,85,0.2);
          border-radius: 8px;
          font-size: 12px;
          color: #e05555;
        }

        .epm-footer {
          display: flex;
          gap: 10px;
          padding: 16px 26px 22px;
          border-top: 1px solid #d6ecea;
          position: sticky;
          bottom: 0;
          background: #fff;
        }
        .epm-cancel {
          flex: 1;
          padding: 12px;
          background: #eef6f6;
          color: #6b9999;
          border: none;
          border-radius: 9px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .epm-cancel:hover { background: #d6ecea; }
        .epm-save {
          flex: 2;
          padding: 12px;
          background: #2dbdaa;
          color: #fff;
          border: none;
          border-radius: 9px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .epm-save:hover:not(:disabled) { background: #25a896; }
        .epm-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .epm-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 500px) {
          .epm-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div
        className="epm-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="epm-modal">
          <div className="epm-header">
            <span className="epm-title">Edit Profile</span>
            <button className="epm-close" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="epm-body">
            {error && <div className="epm-error">{error}</div>}

            {/* Personal Information */}
            <div>
              <div className="epm-section-title">Personal Information</div>
              <div className="epm-grid">
                <div className="epm-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="epm-label">Full Name</label>
                  <input
                    className="epm-input"
                    name="displayName"
                    value={fields.displayName}
                    onChange={handleChange}
                    placeholder="e.g. Alex Johnson"
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Student ID</label>
                  <input
                    className="epm-input"
                    name="studentId"
                    value={fields.studentId}
                    onChange={handleChange}
                    placeholder="e.g. STU 2021 0402"
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Phone Number</label>
                  <input
                    className="epm-input"
                    name="phoneNumber"
                    value={fields.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g. +233 24 000 0000"
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Date of Birth</label>
                  <input
                    className="epm-input"
                    name="dateOfBirth"
                    type="date"
                    value={fields.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Gender</label>
                  <select
                    className="epm-select"
                    name="gender"
                    value={fields.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <div className="epm-section-title">Academic Information</div>
              <div className="epm-grid">
                <div className="epm-field">
                  <label className="epm-label">Year of Study</label>
                  <select
                    className="epm-select"
                    name="yearOfStudy"
                    value={fields.yearOfStudy}
                    onChange={handleChange}
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div className="epm-field">
                  <label className="epm-label">Status</label>
                  <select
                    className="epm-select"
                    name="status"
                    value={fields.status}
                    onChange={handleChange}
                  >
                    <option value="Active Student">Active Student</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hostel Information */}
            <div>
              <div className="epm-section-title">Hostel Information</div>
              <div className="epm-grid">
                <div className="epm-field">
                  <label className="epm-label">Block</label>
                  <input
                    className="epm-input"
                    name="block"
                    value={fields.block}
                    onChange={handleChange}
                    placeholder="e.g. Block A"
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Room Number</label>
                  <input
                    className="epm-input"
                    name="roomNumber"
                    value={fields.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 402"
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Check-in Date</label>
                  <input
                    className="epm-input"
                    name="checkInDate"
                    type="date"
                    value={fields.checkInDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="epm-footer">
            <button className="epm-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="epm-save" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="epm-spinner" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
