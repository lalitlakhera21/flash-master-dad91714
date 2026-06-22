/**
 * Lightweight platform detection. Used to dial down expensive animations
 * (confetti, infinite blur pulses, shimmer) on Android WebView where they
 * can wedge the compositor and cause apparent UI freezes.
 */
let cachedIsNative: boolean | null = null;

export function isNativePlatform(): boolean {
  if (cachedIsNative !== null) return cachedIsNative;
  if (typeof window === "undefined") return false;
  try {
    const w = window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    };
    const cap = w.Capacitor;
    const native =
      typeof cap?.isNativePlatform === "function"
        ? cap.isNativePlatform()
        : cap?.getPlatform?.() === "android" || cap?.getPlatform?.() === "ios";
    cachedIsNative = !!native;
  } catch {
    cachedIsNative = false;
  }
  return cachedIsNative;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Heavy decorative animations should be skipped on native + reduced motion. */
export function shouldReduceMotion(): boolean {
  return isNativePlatform() || prefersReducedMotion();
}
