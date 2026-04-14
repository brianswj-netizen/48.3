import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FAF6ED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: '#7B6FC4',
            letterSpacing: -1,
            fontFamily: 'sans-serif',
          }}
        >
          ai
        </span>
      </div>
    ),
    { ...size }
  )
}
