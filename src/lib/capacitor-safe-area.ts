function setSafeAreaFallbacks() {
  if (typeof document === "undefined") return false;

  const root = document.documentElement;
  if (!root?.style) return false;

  root.style.setProperty("--safe-area-inset-top", "env(safe-area-inset-top, 0px)");
  root.style.setProperty("--safe-area-inset-right", "env(safe-area-inset-right, 0px)");
  root.style.setProperty("--safe-area-inset-bottom", "env(safe-area-inset-bottom, 0px)");
  root.style.setProperty("--safe-area-inset-left", "env(safe-area-inset-left, 0px)");
  return true;
}

export function installCapacitorSafeAreaFallbacks() {
  if (typeof document === "undefined") return;

  if (setSafeAreaFallbacks()) return;

  const retry = () => setSafeAreaFallbacks();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", retry, { once: true });
    return;
  }

  window.setTimeout(retry, 0);
}