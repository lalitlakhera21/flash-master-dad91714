import confetti from "canvas-confetti";
import { shouldReduceMotion } from "./platform";

/**
 * Fires a short burst of confetti. Skipped on native Capacitor / reduced-motion
 * because the long-running rAF loop + fullscreen canvas leaks on Android WebView
 * and can wedge the renderer, making the UI appear frozen after a few uses.
 */
export function fireConfetti() {
  if (shouldReduceMotion()) return;
  try {
    const duration = 900;
    const end = Date.now() + duration;
    const colors = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 70, origin: { x: 0 }, colors, disableForReducedMotion: true });
      confetti({ particleCount: 3, angle: 120, spread: 70, origin: { x: 1 }, colors, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  } catch {
    /* never let confetti crash the app */
  }
}
