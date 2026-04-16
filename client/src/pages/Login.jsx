import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("Logged in:", userCredential.user);
      alert("Login successful!");
      navigate("/Dashboard");
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.icon}>📱</div>
        </div>

        {/* Title & Subtitle */}
        <h1 className={styles.title}>St.Theresa's Hostel</h1>
        <p className={styles.subtitle}>
          Login to report and track your hostel complaints
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className={styles.form}>
          {/* Student ID / Email */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Student ID / Email</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>👤</span>
              <input
                type="email"
                placeholder="e.g. STD-2023-045"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeIcon}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className={styles.forgotLink}>Forgot password?</div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Bottom Text */}
        <p className={styles.bottomText}>
          Don't have an account?{" "}
          <span className={styles.contactLink}>Contact Manager</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
