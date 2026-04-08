import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { app, auth } from "./config/firebase";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log("Firebase app:", app);
console.log("Firebase auth:", auth);
