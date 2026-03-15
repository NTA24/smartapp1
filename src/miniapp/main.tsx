import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Mini app styles (same as vanilla app)
import "../frontend/css/style.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
