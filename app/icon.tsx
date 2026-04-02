import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background: '#0c0e18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
          <path
            d="M6 34 Q14 34 19 28 Q24 22 27 18 Q30 14 32 30 Q34 44 38 40 Q42 36 48 34 Q54 32 58 34"
            stroke="#3388ff"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
