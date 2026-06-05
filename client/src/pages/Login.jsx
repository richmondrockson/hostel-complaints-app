import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function parseError(code) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const tokenResult = await userCredential.user.getIdTokenResult();

      if (tokenResult.claims.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(parseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #eef6f6;
        }

        /* ── Left panel ── */
        .lg-left {
          background: #1a2e2e;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          position: relative;
          overflow: hidden;
        }
        .lg-left::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: rgba(45,189,170,0.08);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }
        .lg-left::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(45,189,170,0.05);
          top: 80px; right: -50px;
          pointer-events: none;
        }
        .lg-logo {
          display: flex; align-items: center; gap: 10px;
          position: relative; z-index: 1;
        }
        .lg-logo-mark {
          width: 36px; height: 36px; background: #2dbdaa;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lg-logo-name { font-size: 18px; font-weight: 700; color: #fff; }

        .lg-hero {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 48px 0;
          position: relative; z-index: 1;
        }
        .lg-hero h1 {
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 700; color: #fff;
          line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px;
        }
        .lg-hero h1 span { color: #2dbdaa; }
        .lg-hero p {
          font-size: 14px; color: rgba(255,255,255,0.45);
          line-height: 1.7; max-width: 320px; margin-bottom: 36px;
        }

        /* Stat pills */
        .lg-stats { display: flex; flex-direction: column; gap: 12px; }
        .lg-stat {
          display: flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 14px 16px;
        }
        .lg-stat-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(45,189,170,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lg-stat-label { font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 2px; }
        .lg-stat-value { font-size: 14px; font-weight: 600; color: #fff; }

        .lg-footer {
          font-size: 12px; color: rgba(255,255,255,0.2);
          position: relative; z-index: 1;
        }

        /* ── Right panel ── */
        .lg-right {
          display: flex; align-items: center;
          justify-content: center; padding: 48px 40px;
          background: #fff;
        }
        .lg-form-wrap {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lg-form-title {
          font-size: 26px; font-weight: 700;
          color: #1a2e2e; margin-bottom: 6px; letter-spacing: -0.3px;
        }
        .lg-form-sub {
          font-size: 13px; color: #9bbcbc;
          margin-bottom: 32px; line-height: 1.6;
        }

        /* ── Error banner ── */
        .lg-error {
          padding: 12px 16px; margin-bottom: 16px;
          background: rgba(224,85,85,0.08);
          border: 1px solid rgba(224,85,85,0.2);
          border-radius: 10px; font-size: 13px; color: #e05555;
          display: flex; align-items: center; gap: 8px;
        }

        /* ── Fields ── */
        .lg-field { margin-bottom: 16px; }
        .lg-label {
          display: block; font-size: 12px; font-weight: 600;
          letter-spacing: 0.5px; text-transform: uppercase;
          color: #4a7070; margin-bottom: 7px;
        }
        .lg-input-wrap { position: relative; }
        .lg-input {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #d6ecea; border-radius: 10px;
          font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e; background: #f7fcfc; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lg-input:focus {
          border-color: #2dbdaa; background: #fff;
          box-shadow: 0 0 0 3px rgba(45,189,170,0.1);
        }
        .lg-input-suffix {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9bbcbc; padding: 4px;
          display: flex; align-items: center; transition: color 0.15s;
        }
        .lg-input-suffix:hover { color: #2dbdaa; }

        /* ── Forgot password ── */
        .lg-forgot {
          display: flex; justify-content: flex-end;
          margin-top: -8px; margin-bottom: 20px;
        }
        .lg-forgot button {
          background: none; border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          color: #2dbdaa; cursor: pointer; padding: 0;
        }
        .lg-forgot button:hover { text-decoration: underline; }

        /* ── Submit ── */
        .lg-btn {
          width: 100%; padding: 13px;
          background: #2dbdaa; color: #fff;
          border: none; border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .lg-btn:hover:not(:disabled) { background: #25a896; }
        .lg-btn:active:not(:disabled) { transform: scale(0.99); }
        .lg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lg-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .lg-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0; color: #d6ecea; font-size: 12px;
        }
        .lg-divider::before, .lg-divider::after {
          content: ''; flex: 1; height: 1px; background: #d6ecea;
        }

        /* ── Switch ── */
        .lg-switch {
          text-align: center; font-size: 13px; color: #9bbcbc;
        }
        .lg-switch button {
          background: none; border: none; color: #2dbdaa;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px; padding: 0 2px;
        }
        .lg-switch button:hover { color: #25a896; }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .lg-root { grid-template-columns: 1fr; }
          .lg-left { display: none; }
          .lg-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="lg-root">
        {/* ── Left panel ── */}
        <div className="lg-left">
          <div className="lg-logo">
            <div className="lg-logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L2 15h14L9 2z" fill="#fff" />
              </svg>
            </div>
            <span className="lg-logo-name">HostelDesk</span>
          </div>

          <div className="lg-hero">
            <h1>
              Welcome
              <br />
              back to <span>HostelDesk.</span>
            </h1>
            <p>
              Sign in to view and track your complaints, read hostel notices,
              and manage your profile.
            </p>
            <div className="lg-stats">
              {[
                {
                  label: "Quick submission",
                  value: "Submit in under 2 minutes",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                  ),
                },
                {
                  label: "Real-time updates",
                  value: "Track status instantly",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle
                        cx="8"
                        cy="8"
                        r="6.5"
                        stroke="#2dbdaa"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M8 4.5V8l2.5 2.5"
                        stroke="#2dbdaa"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Stay informed",
                  value: "Read hostel notices",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 1.5A4.5 4.5 0 003.5 6v3L2 11h12l-1.5-2V6A4.5 4.5 0 008 1.5z"
                        stroke="#2dbdaa"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.5 11.5a1.5 1.5 0 003 0"
                        stroke="#2dbdaa"
                        strokeWidth="1.3"
                      />
                    </svg>
                  ),
                },
              ].map((s) => (
                <div className="lg-stat" key={s.label}>
                  <div className="lg-stat-icon">{s.icon}</div>
                  <div>
                    <div className="lg-stat-label">{s.label}</div>
                    <div className="lg-stat-value">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg-footer">
            © 2025 HostelCare. All rights reserved.
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="lg-right">
          <div className="lg-form-wrap">
            <div className="lg-form-title">Welcome back</div>
            <div className="lg-form-sub">
              Sign in to view and track your complaints.
            </div>

            {error && (
              <div className="lg-error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="#e05555"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M7 4v3.5M7 9.5v.5"
                    stroke="#e05555"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div className="lg-field">
                <label className="lg-label">Email Address</label>
                <div className="lg-input-wrap">
                  <input
                    className="lg-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lg-field">
                <label className="lg-label">Password</label>
                <div className="lg-input-wrap">
                  <input
                    className="lg-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    className="lg-input-suffix"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="8"
                          cy="8"
                          r="2"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M2 2l12 12"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="8"
                          cy="8"
                          r="2"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="lg-forgot">
                <button type="button">Forgot password?</button>
              </div>

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="lg-spinner" /> Signing in...
                  </>
                ) : (
                  "Sign In →"
                )}
              </button>
            </form>

            <div className="lg-divider">or</div>

            <div className="lg-switch">
              Don't have an account?{" "}
              <button type="button" onClick={() => navigate("/")}>
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
