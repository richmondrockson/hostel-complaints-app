import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { auth } from "./firebase";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const tokenResult = await u.getIdTokenResult(true);
        setIsAdmin(tokenResult.claims.role === "admin");
        setUser(u);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#eef6f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#9bbcbc",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected student routes */}
        <Route
          path="/dashboard"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : isAdmin ? (
              <Navigate to="/admin" />
            ) : (
              <Dashboard />
            )
          }
        />
        <Route
          path="/complaints/new"
          element={user ? <NewComplaint /> : <Navigate to="/login" />}
        />

        {/* Protected admin route */}
        <Route
          path="/admin"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : !isAdmin ? (
              <Navigate to="/dashboard" />
            ) : (
              <AdminDashboard />
            )
          }
        />

        {/* Catch-all — redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
