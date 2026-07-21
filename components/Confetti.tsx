"use client";

const COLORS = ["#16a34a", "#e11d48", "#f59e0b", "#3b82f6", "#a855f7"];
const PIECE_COUNT = 16;

const PIECES = Array.from({ length: PIECE_COUNT }, (_, i) => {
  const angle = ((360 / PIECE_COUNT) * i * Math.PI) / 180;
  const distance = 60 + ((i * 37) % 40);
  return {
    color: COLORS[i % COLORS.length],
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    delay: (i % 5) * 0.03,
  };
});

export default function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
          style={
            {
              backgroundColor: p.color,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              animation: `confetti-burst 0.7s ease-out ${p.delay}s forwards`,
            } as React.CSSProperties
          }
        />
      ))}

      <style>{`
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
