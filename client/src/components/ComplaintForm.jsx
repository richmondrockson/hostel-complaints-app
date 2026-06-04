/**
 * components/ComplaintForm.jsx
 *
 * WHAT THIS IS:
 * A reusable form component that handles collecting and submitting
 * complaint data. It is used by the NewComplaint page.
 *
 * WHY IT'S A SEPARATE COMPONENT AND NOT INSIDE THE PAGE:
 * Separation of concerns — the form handles its own state and submission
 * logic. The page handles layout and navigation. If you ever need this
 * form somewhere else, you just import it.
 *
 * KEY CONCEPTS USED HERE:
 * 1. Controlled inputs — every input's value lives in React state
 * 2. getIdToken() — gets the Firebase token to send with the request
 * 3. fetch() — sends the POST request to your Express backend
 * 4. onSuccess prop — tells the parent page the form submitted successfully
 */

import { useState } from "react";
import { auth } from "../firebase";

// Categories must match what your backend and Firestore expect
const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Furniture",
  "Cleanliness",
  "IT Support",
  "Security",
  "Other",
];

export default function ComplaintForm({ onSuccess }) {
  // ── Controlled input state ──────────────────────────────
  // Every field in the form has its own piece of state.
  // When the student types, state updates. When we submit,
  // we read from state — not from the DOM directly.
  // This is what "controlled inputs" means in React.
  const [fields, setFields] = useState({
    title: "",
    roomNumber: "",
    category: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the student types
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  }

  // ── Client-side validation ──────────────────────────────
  // We validate on the frontend BEFORE sending to the backend.
  // This gives instant feedback to the student without a network request.
  // The backend ALSO validates — never rely on frontend validation alone.
  function validate() {
    const newErrors = {};
    if (!fields.title.trim()) newErrors.title = "Title is required.";
    if (!fields.roomNumber.trim())
      newErrors.roomNumber = "Room number is required.";
    if (!fields.category) newErrors.category = "Please select a category.";
    if (!fields.description.trim())
      newErrors.description = "Description is required.";
    else if (fields.description.trim().length < 20)
      newErrors.description =
        "Please provide more detail (at least 20 characters).";
    return newErrors;
  }

  // ── Form submission ─────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    // Step 1: Run client-side validation
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");

    const token = await auth.currentUser.getIdToken();

    try {
      const requestBody = {
        ...fields,
        studentId: auth.currentUser?.uid,
        studentEmail: auth.currentUser?.email,
      };

      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }

      onSuccess(data.complaintId);
    } catch (error) {
      console.error("Submission error:", error);
      setServerError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .cf-form { display: flex; flex-direction: column; gap: 20px; }

        .cf-field { display: flex; flex-direction: column; gap: 6px; }

        .cf-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #4a7070;
        }

        .cf-input, .cf-select, .cf-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #d6ecea;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a2e2e;
          background: #f7fcfc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .cf-input:focus, .cf-select:focus, .cf-textarea:focus {
          border-color: #2dbdaa;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45,189,170,0.1);
        }

        .cf-input.error, .cf-select.error, .cf-textarea.error {
          border-color: #e05555;
          box-shadow: 0 0 0 3px rgba(224,85,85,0.08);
        }

        .cf-textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        .cf-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232dbdaa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }

        .cf-error-msg {
          font-size: 12px;
          color: #e05555;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cf-server-error {
          padding: 12px 16px;
          background: rgba(224,85,85,0.08);
          border: 1px solid rgba(224,85,85,0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #e05555;
        }

        .cf-submit {
          width: 100%;
          padding: 14px;
          background: #2dbdaa;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }

        .cf-submit:hover:not(:disabled) { background: #25a896; }
        .cf-submit:active:not(:disabled) { transform: scale(0.99); }
        .cf-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .cf-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cf-char-count {
          font-size: 11px;
          color: #9bbcbc;
          text-align: right;
          margin-top: 2px;
        }
      `}</style>

      <form className="cf-form" onSubmit={handleSubmit} noValidate>
        {/* Server error banner */}
        {serverError && <div className="cf-server-error">{serverError}</div>}

        {/* Title */}
        <div className="cf-field">
          <label className="cf-label">Complaint Title</label>
          <input
            className={`cf-input ${errors.title ? "error" : ""}`}
            type="text"
            name="title"
            placeholder="e.g. Taps are not flowing, Faulty heater switch"
            value={fields.title}
            onChange={handleChange}
            maxLength={100}
          />
          {errors.title && (
            <span className="cf-error-msg">↑ {errors.title}</span>
          )}
        </div>

        {/* Room Number */}
        <div className="cf-field">
          <label className="cf-label">Room Number</label>
          <input
            className={`cf-input ${errors.roomNumber ? "error" : ""}`}
            type="text"
            name="roomNumber"
            placeholder="A1-02, B3-05, C9-14, etc."
            value={fields.roomNumber}
            onChange={handleChange}
          />
          {errors.roomNumber && (
            <span className="cf-error-msg">↑ {errors.roomNumber}</span>
          )}
        </div>

        {/* Category */}
        <div className="cf-field">
          <label className="cf-label">Category</label>
          <select
            className={`cf-select ${errors.category ? "error" : ""}`}
            name="category"
            value={fields.category}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="cf-error-msg">↑ {errors.category}</span>
          )}
        </div>

        {/* Description */}
        <div className="cf-field">
          <label className="cf-label">Description</label>
          <textarea
            className={`cf-textarea ${errors.description ? "error" : ""}`}
            name="description"
            placeholder="Describe the issue in detail. The more information you provide, the faster we can resolve it!"
            value={fields.description}
            onChange={handleChange}
            maxLength={1000}
          />
          <div className="cf-char-count">{fields.description.length}/1000</div>
          {errors.description && (
            <span className="cf-error-msg">↑ {errors.description}</span>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="cf-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="cf-spinner" /> Submitting...
            </>
          ) : (
            "Submit Complaint →"
          )}
        </button>
      </form>
    </>
  );
}
