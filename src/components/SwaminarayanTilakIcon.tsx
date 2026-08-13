export default function SwaminarayanTilakIcon({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
    >
      {/* Vibrant Saffron/Orange Parallel U-Shaped Tilak */}
      <path
        d="M 33 16 L 33 62 C 33 77 67 77 67 62 L 67 16"
        stroke="#FF6B1A"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bright Red Solid Kumkum Chandlo Dot */}
      <circle cx="50" cy="50" r="11" fill="#FF2A2A" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}
