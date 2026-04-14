import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#FAF6ED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 82,
            fontWeight: 900,
            color: '#7B6FC4',
            letterSpacing: -3,
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
