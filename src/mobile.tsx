import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import { installCapacitorSafeAreaFallbacks } from "./lib/capacitor-safe-area";
import "./styles.css";

async function setupKeyboard() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const mod = await import("@capacitor/keyboard");
    const Keyboard = mod.Keyboard;
    const KeyboardResize = mod.KeyboardResize;
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch {}
    try {
      await Keyboard.setScroll({ isDisabled: false });
    } catch {}
    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty("--kb-height", `${info.keyboardHeight}px`);
      document.body.classList.add("kb-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--kb-height", "0px");
      document.body.classList.remove("kb-open");
    });
    Keyboard.addListener("keyboardDidHide", () => {
      document.documentElement.style.setProperty("--kb-height", "0px");
      document.body.classList.remove("kb-open");
    });
  } catch (e) {
    console.warn("Keyboard plugin unavailable", e);
  }
}

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
  setupKeyboard();

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
