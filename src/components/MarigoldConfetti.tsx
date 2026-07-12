import confetti from 'canvas-confetti';

const petalColors = ['#FF6B1A', '#FFA733', '#FFD08A', '#D4A94A', '#FFF3EA'];

export function fireMarigoldBurst() {
  const duration = 1600;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.4 },
      colors: petalColors,
      scalar: 1.1,
      shapes: ['circle'],
      gravity: 0.9,
      ticks: 200,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.4 },
      colors: petalColors,
      scalar: 1.1,
      shapes: ['circle'],
      gravity: 0.9,
      ticks: 200,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function fireWinnerCelebration() {
  const end = Date.now() + 3000;
  (function frame() {
    confetti({
      particleCount: 6,
      startVelocity: 35,
      spread: 100,
      origin: { x: Math.random(), y: -0.1 },
      colors: petalColors,
      gravity: 0.7,
      scalar: 1.2,
      ticks: 260,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({
    particleCount: 160,
    spread: 180,
    origin: { x: 0.5, y: 0.4 },
    colors: petalColors,
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.3,
    ticks: 300,
  });
}
