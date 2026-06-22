import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import { installCapacitorSafeAreaFallbacks } from "./lib/capacitor-safe-area";
import "./styles.css";

function getAppRoot() {
  if (typeof document === "undefined") return null;

  let root = document.getElementById("root");
  if (!root && document.body) {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
  }
  return root;
}

function boot() {
  installCapacitorSafeAreaFallbacks();

  const root = getAppRoot();
  if (!root) {
    window.setTimeout(boot, 0);
    return;
  }

  const router = getRouter();
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

if (typeof window !== "undefined") {
  startTransition(boot);
}