import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

// Map Firebase error codes to friendly messages
function parseError(code) {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

const Signup = () => {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  }

  function validate() {
    const errs = {};
    if (!fields.name.trim()) errs.name = "Full name is required.";
    if (!fields.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      errs.email = "Enter a valid email address.";
    if (!fields.password) errs.password = "Password is required.";
    else if (fields.password.length < 6)
      errs.password = "At least 6 characters.";
    if (fields.password !== fields.confirm)
      errs.confirm = "Passwords do not match.";
    return errs;
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        fields.email,
        fields.password,
      );
      // Attach the display name to the Firebase user profile
      // This is what shows up as user.displayName throughout the app
      await updateProfile(userCredential.user, {
        displayName: fields.name.trim(),
      });
      navigate("/login");
    } catch (error) {
      setServerError(parseError(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #eef6f6;
        }

        /* ── Left panel ── */
        .sg-left {
          background: #1a2e2e;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          position: relative;
          overflow: hidden;
        }
        .sg-left::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: rgba(45,189,170,0.08);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }
        .sg-left::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(45,189,170,0.05);
          top: 80px; right: -50px;
          pointer-events: none;
        }
        .sg-logo {
          display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;
        }
        .sg-logo-mark {
          width: 36px; height: 36px; background: #2dbdaa;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sg-logo-name { font-size: 18px; font-weight: 700; color: #fff; }

        .sg-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0; position: relative; z-index: 1; }
        .sg-hero h1 {
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 700; color: #fff;
          line-height: 1.2; letter-spacing: -0.5px;
          margin-bottom: 16px;
        }
        .sg-hero h1 span { color: #2dbdaa; }
        .sg-hero p {
          font-size: 14px; color: rgba(255,255,255,0.45);
          line-height: 1.7; max-width: 320px; margin-bottom: 36px;
        }
        .sg-features { display: flex; flex-direction: column; gap: 14px; }
        .sg-feature {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: rgba(255,255,255,0.55);
        }
        .sg-feature-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #2dbdaa; flex-shrink: 0;
        }

        .sg-footer { font-size: 12px; color: rgba(255,255,255,0.2); position: relative; z-index: 1; }

        /* ── Right panel ── */
        .sg-right {
          display: flex; align-items: center;
          justify-content: center; padding: 48px 40px;
          background: #fff;
        }
        .sg-form-wrap {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sg-form-title {
          font-size: 26px; font-weight: 700;
          color: #1a2e2e; margin-bottom: 6px; letter-spacing: -0.3px;
        }
        .sg-form-sub {
          font-size: 13px; color: #9bbcbc; margin-bottom: 32px; line-height: 1.6;
        }

        /* ── Server error ── */
        .sg-server-error {
          padding: 12px 16px; margin-bottom: 16px;
          background: rgba(224,85,85,0.08);
          border: 1px solid rgba(224,85,85,0.2);
          border-radius: 10px; font-size: 13px; color: #e05555;
          display: flex; align-items: center; gap: 8px;
        }

        /* ── Fields ── */
        .sg-field { margin-bottom: 16px; }
        .sg-label {
          display: block; font-size: 12px; font-weight: 600;
          letter-spacing: 0.5px; text-transform: uppercase;
          color: #4a7070; margin-bottom: 7px;
        }
        .sg-input-wrap { position: relative; }
        .sg-input {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #d6ecea; border-radius: 10px;
          font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e; background: #f7fcfc; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .sg-input:focus {
          border-color: #2dbdaa; background: #fff;
          box-shadow: 0 0 0 3px rgba(45,189,170,0.1);
        }
        .sg-input.error {
          border-color: #e05555;
          box-shadow: 0 0 0 3px rgba(224,85,85,0.08);
        }
        .sg-input-suffix {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9bbcbc; padding: 4px;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .sg-input-suffix:hover { color: #2dbdaa; }
        .sg-error-msg {
          margin-top: 5px; font-size: 12px;
          color: #e05555; display: flex; align-items: center; gap: 4px;
        }

        /* ── Submit ── */
        .sg-btn {
          width: 100%; padding: 13px;
          background: #2dbdaa; color: #fff;
          border: none; border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s, transform 0.1s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sg-btn:hover:not(:disabled) { background: #25a896; }
        .sg-btn:active:not(:disabled) { transform: scale(0.99); }
        .sg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .sg-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Switch ── */
        .sg-switch {
          margin-top: 24px; text-align: center;
          font-size: 13px; color: #9bbcbc;
        }
        .sg-switch button {
          background: none; border: none; color: #2dbdaa;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px; padding: 0 2px;
        }
        .sg-switch button:hover { color: #25a896; }

        /* ── Divider ── */
        .sg-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0; color: #d6ecea; font-size: 12px;
        }
        .sg-divider::before, .sg-divider::after {
          content: ''; flex: 1; height: 1px; background: #d6ecea;
        }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .sg-root { grid-template-columns: 1fr; }
          .sg-left { display: none; }
          .sg-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="sg-root">
        {/* ── Left panel ── */}
        <div className="sg-left">
          <div className="sg-logo">
            <div className="sg-logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L2 15h14L9 2z" fill="#fff" />
              </svg>
            </div>
            <span className="sg-logo-name">HostelDesk</span>
          </div>

          <div className="sg-hero">
            <h1>
              Your voice,
              <br />
              <span>your hostel.</span>
            </h1>
            <p>
              Signup to HostelDesk to submit and track maintenance complaints.
              Get notified when your issues are resolved.
            </p>
            <div className="sg-features">
              {[
                "Submit complaints with photos and details",
                "Track status in real time",
                "Get notified when issues are resolved",
                "View hostel notices and announcements",
              ].map((f) => (
                <div className="sg-feature" key={f}>
                  <span className="sg-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="sg-footer">
            © 2025 HostelDesk. All rights reserved.
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="sg-right">
          <div className="sg-form-wrap">
            <div className="sg-form-title">Create account</div>
            <div className="sg-form-sub">
              Register to start submitting hostel complaints.
            </div>

            {serverError && (
              <div className="sg-server-error">
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
                {serverError}
              </div>
            )}

            <form onSubmit={handleSignup} noValidate>
              {/* Full name */}
              <div className="sg-field">
                <label className="sg-label">Full Name</label>
                <div className="sg-input-wrap">
                  <input
                    className={`sg-input ${errors.name ? "error" : ""}`}
                    type="text"
                    name="name"
                    placeholder="e.g. Kwame Mensah"
                    value={fields.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
                {errors.name && (
                  <div className="sg-error-msg">↑ {errors.name}</div>
                )}
              </div>

              {/* Email */}
              <div className="sg-field">
                <label className="sg-label">Email Address</label>
                <div className="sg-input-wrap">
                  <input
                    className={`sg-input ${errors.email ? "error" : ""}`}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={fields.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <div className="sg-error-msg">↑ {errors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="sg-field">
                <label className="sg-label">Password</label>
                <div className="sg-input-wrap">
                  <input
                    className={`sg-input ${errors.password ? "error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="At least 6 characters"
                    value={fields.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    className="sg-input-suffix"
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
                {errors.password && (
                  <div className="sg-error-msg">↑ {errors.password}</div>
                )}
              </div>

              {/* Confirm password */}
              <div className="sg-field">
                <label className="sg-label">Confirm Password</label>
                <div className="sg-input-wrap">
                  <input
                    className={`sg-input ${errors.confirm ? "error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    name="confirm"
                    placeholder="Repeat your password"
                    value={fields.confirm}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirm && (
                  <div className="sg-error-msg">↑ {errors.confirm}</div>
                )}
              </div>

              <button type="submit" className="sg-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="sg-spinner" /> Creating account...
                  </>
                ) : (
                  "Create Account →"
                )}
              </button>
            </form>

            <div className="sg-divider">or</div>

            <div className="sg-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
