// ── 入口 (entry) ─────────────────────────────────────────────
// 唯一責任：把 React 應用掛載到頁面上。其他邏輯都不放這裡。
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
