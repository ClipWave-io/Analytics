export function ClipwaveLogo({ size = 30 }: { size?: number }) {
  const id = `wl-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
      <defs>
        <linearGradient id={`${id}-g`} x1="8" y1="20" x2="56" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path
        d="M6 34 Q14 34 19 28 Q24 22 27 18 Q30 14 32 30 Q34 44 38 40 Q42 36 48 34 Q54 32 58 34"
        stroke={`url(#${id}-g)`}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
