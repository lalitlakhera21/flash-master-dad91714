import confetti from "canvas-confetti";

export function fireConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
