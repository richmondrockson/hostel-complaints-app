/**
 * pages/NewComplaint.jsx
 *
 * WHAT THIS IS:
 * The page that wraps the ComplaintForm component.
 * It handles three things:
 * 1. Auth guard — redirect to login if not logged in
 * 2. Layout — the page structure around the form
 * 3. Success state — shows a success message after submission
 *    then redirects to the dashboard
 *
 * WHY THE SUCCESS MESSAGE BEFORE REDIRECT:
 * Immediately redirecting after submit gives the student no
 * confirmation that anything happened. Showing the complaint
 * reference number (CMP-XXXXXXX) for a moment builds trust
 * and gives them something to reference when following up.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import ComplaintForm from "../components/ComplaintForm";

export default function NewComplaint() {
  const [user, setUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState("");
  const navigate = useNavigate();

  // Auth guard — same pattern as Dashboard
  // If no user is logged in, redirect to login immediately
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

  // This function is passed to ComplaintForm as the onSuccess prop.
  // When the form submits successfully, it calls onSuccess(complaintId)
  // which triggers this function in the parent page.
  // This is called "lifting state up" — the child tells the parent
  // what happened, and the parent decides what to do next.
  function handleSuccess(id) {
    setComplaintId(id);
    setSubmitted(true);

    // Auto-redirect to dashboard after 4 seconds
    // Enough time for the student to read the success message
    setTimeout(() => navigate("/dashboard"), 6000);
  }

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nc-root {
          min-height: 100vh;
          background: #eef6f6;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .nc-topbar {
          background: #fff;
          border-bottom: 1px solid #d6ecea;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nc-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #2dbdaa;
          cursor: pointer;
          padding: 0;
          transition: gap 0.15s;
        }
        .nc-back-btn:hover { gap: 12px; }
        .nc-topbar-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a2e2e;
        }
        .nc-topbar-right {
          font-size: 13px;
          color: #6b9999;
          font-weight: 500;
        }

        /* ── Content ── */
        .nc-content {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 24px;
        }
        .nc-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #d6ecea;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          animation: slideUp 0.35s ease both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nc-card-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid #d6ecea;
        }
        .nc-card-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a2e2e;
          margin-bottom: 6px;
        }
        .nc-card-sub {
          font-size: 13px;
          color: #6b9999;
          line-height: 1.6;
        }
        .nc-card-body { padding: 28px 32px; }

        /* ── Success state ── */
        .nc-success {
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          animation: slideUp 0.35s ease both;
        }
        .nc-success-icon {
          width: 64px;
          height: 64px;
          background: rgba(45,189,170,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nc-success-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a2e2e;
        }
        .nc-success-sub {
          font-size: 13px;
          color: #6b9999;
          line-height: 1.6;
          max-width: 360px;
        }
        .nc-success-id {
          background: #eef6f6;
          border: 1.5px dashed #2dbdaa;
          border-radius: 10px;
          padding: 14px 24px;
          font-size: 18px;
          font-weight: 700;
          color: #2dbdaa;
          letter-spacing: 1px;
        }
        .nc-success-note {
          font-size: 12px;
          color: #9bbcbc;
        }
        .nc-redirect-bar {
          width: 100%;
          height: 3px;
          background: #d6ecea;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }
        .nc-redirect-fill {
          height: 100%;
          background: #2dbdaa;
          border-radius: 2px;
          animation: fillBar 6s linear forwards;
        }
        @keyframes fillBar {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ── Steps indicator ── */
        .nc-steps {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }
        .nc-step {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          background: #d6ecea;
        }
        .nc-step.active { background: #2dbdaa; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .nc-topbar { padding: 14px 16px; }
          .nc-content { padding: 24px 16px; }
          .nc-card-header { padding: 20px; }
          .nc-card-body { padding: 20px; }
          .nc-success { padding: 32px 20px; }
        }
      `}</style>

      <div className="nc-root">
        {/* Topbar */}
        <header className="nc-topbar">
          <button
            className="nc-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8L10 13"
                stroke="#2dbdaa"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Dashboard
          </button>
          <span className="nc-topbar-title">New Complaint</span>
          <span className="nc-topbar-right">{user.email}</span>
        </header>

        {/* Content */}
        <div className="nc-content">
          <div className="nc-card">
            {submitted ? (
              /* ── Success state ── */
              <div className="nc-success">
                <div className="nc-success-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M6 14l6 6L22 8"
                      stroke="#2dbdaa"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="nc-success-title">Complaint Submitted!</div>
                <div className="nc-success-sub">
                  Your complaint has been received. Keep your reference number
                  safe — you'll need it to track your complaint status.
                </div>
                <div className="nc-success-id">{complaintId}</div>
                <div className="nc-success-note">Your reference number</div>
                <div style={{ width: "100%" }}>
                  <div className="nc-redirect-bar">
                    <div className="nc-redirect-fill" />
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9bbcbc",
                      marginTop: "8px",
                      textAlign: "center",
                    }}
                  >
                    Redirecting to dashboard...
                  </div>
                </div>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="nc-card-header">
                  {/* Progress steps — visual indicator */}
                  <div className="nc-steps">
                    <div className="nc-step active" />
                    <div className="nc-step active" />
                    <div className="nc-step" />
                  </div>
                  <div className="nc-card-title">Submit a Complaint</div>
                  <div className="nc-card-sub">
                    Fill in the details below. Be as specific as possible so we
                    can resolve your issue quickly.
                  </div>
                </div>
                <div className="nc-card-body">
                  <ComplaintForm onSuccess={handleSuccess} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
