'use client'

import { useState } from 'react'

function EnjoyTodaySVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#F5EDE6" />
      <path d="M10,80 A70,70 0 0,1 80,10 L80,80 Z" fill="#2D7070" />
      <path d="M140,8 A50,50 0 0,1 192,60" stroke="#E07B54" strokeWidth="20" fill="none" strokeLinecap="round"/>
      <ellipse cx="178" cy="120" rx="16" ry="40" fill="#7A9840" transform="rotate(15 178 120)"/>
      <path d="M10,140 A45,45 0 0,1 100,140 Z" fill="#9B80C0" />
      <path d="M100,190 C120,160 140,140 100,120 C60,140 80,160 100,190 Z" fill="#E07B54" opacity="0.85"/>
      <circle cx="168" cy="178" r="18" fill="#F2A0B8" />
      <rect x="15" y="168" width="45" height="20" rx="10" fill="#D4A030" />
      <circle cx="130" cy="55" r="14" fill="#4A80BE" opacity="0.9" />
      <rect x="148" y="20" width="20" height="42" rx="10" fill="#8B9840" />
      <circle cx="88" cy="108" r="9" fill="#D04030" />
      <text x="100" y="194" textAnchor="middle" fontSize="9" fill="#6B4830"
        fontWeight="700" letterSpacing="2" fontFamily="sans-serif">ENJOY TODAY</text>
    </svg>
  )
}

function KeepLearningSVG() {
  const dots = [
    ['#C04030','#D86050','#E89070','#F0B898'],
    ['#B07820','#C89030','#A0A040','#6A8840'],
    ['#B0C0D8','#4898C8','#2858A8','#2880A0'],
    ['#E0A8B8','#C86888','#8858B0','#C0A0D8'],
  ]
  const stipple = new Set(['0-0','1-1','2-2','3-3'])
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="5" height="5">
          <circle cx="2.5" cy="2.5" r="1" fill="rgba(0,0,0,0.18)"/>
        </pattern>
      </defs>
      <rect width="200" height="200" fill="#FAF4EC" />
      {dots.map((row, ri) =>
        row.map((color, ci) => {
          const cx = 28 + ci * 48
          const cy = 28 + ri * 48
          const key = `${ri}-${ci}`
          return (
            <g key={key}>
              <circle cx={cx} cy={cy} r={20} fill={color} />
              {stipple.has(key) && <circle cx={cx} cy={cy} r={20} fill="url(#dots)" />}
            </g>
          )
        })
      )}
      <text x="100" y="194" textAnchor="middle" fontSize="7.5" fill="#6B5030"
        fontWeight="700" letterSpacing="1" fontFamily="sans-serif">KEEP LEARNING · KEEP EVOLVING</text>
    </svg>
  )
}

export default function DesignInspirationSection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-4 bg-white rounded-[14px] px-4 py-4" style={{ border: '0.5px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Design Inspiration</p>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--purple)' }}>Olivia Herrick</span>
      </div>

      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <div className="w-full aspect-square rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
            <EnjoyTodaySVG />
          </div>
        </div>
        <div className="flex-1">
          <div className="w-full aspect-square rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
            <KeepLearningSVG />
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: '#6B5040' }}>
        이 앱의 색감과 디자인 영감은{' '}
        <span className="font-bold" style={{ color: 'var(--purple)' }}>Olivia Herrick</span>의
        작품에서 얻었습니다. 따뜻한 크림 배경 위에 펼쳐지는 생동감 있는 추상 도형들이 특징입니다.
      </p>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs leading-relaxed text-gray-700 mb-2">
            Olivia Herrick는 영국을 기반으로 활동하는 일러스트레이터이자 아티스트입니다.
            그녀의 작품은 따뜻한 크림 배경 위에 유기적 형태의 추상 도형과 풍부한 컬러팔레트를
            결합한 것이 특징입니다.
          </p>
          <p className="text-xs leading-relaxed text-gray-700 mb-2">
            단순하고 명료한 메시지 속에 삶의 철학을 담아내는 그녀의 작업 방식은
            많은 이들에게 영감을 줍니다. "Enjoy Today"는 현재 이 순간을 충분히 즐기라는
            메시지를, "Keep Learning; Keep Evolving"은 끊임없는 배움과 성장의 가치를 전합니다.
          </p>
          <p className="text-xs leading-relaxed text-gray-700 mb-2">
            밝고 다채로운 컬러들이 각자의 자리에서 조화를 이루는 그녀의 작품처럼,
            AI Survival Crew의 크루원들도 각자의 색깔로 함께 성장하길 바라는 마음을 담아
            이 앱의 디자인 영감으로 삼았습니다.
          </p>
          <p className="text-[10px] text-muted mt-2">※ 수록 작품: "Enjoy Today" · "Keep Learning; Keep Evolving"</p>
          <p className="text-[10px] text-muted mb-2">© Olivia Herrick. All rights reserved.</p>
          <a
            href="https://www.oliviaherrick.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl"
            style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
            🔗 Olivia Herrick 홈페이지 방문하기
          </a>
        </div>
      )}

      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-3 w-full text-center text-xs font-semibold py-2 rounded-xl transition-colors"
        style={{ color: 'var(--purple)', background: 'var(--purple-light)' }}
      >
        {expanded ? '접기 ∧' : '더보기 ∨'}
      </button>
    </div>
  )
}
