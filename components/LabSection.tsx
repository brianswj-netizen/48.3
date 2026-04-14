'use client'

import { useState } from 'react'
import Link from 'next/link'

const labMenus = [
  { href: '/saved-articles', emoji: '📰', label: '저장된 기사', desc: '저장한 뉴스레터 기사 모아보기' },
  { href: '/evaluator',      emoji: '🤖', label: 'AI 평가관',   desc: 'AI 결과물 레벨 평가받기' },
]

export default function LabSection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      {/* 실험실 header row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full bg-white rounded-[14px] px-4 py-4 flex items-center gap-4 active:bg-gray-50"
        style={{ border: '0.5px solid var(--border)' }}
      >
        <span className="text-2xl w-9 text-center">🧪</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-gray-900">실험실</p>
          <p className="text-xs text-muted mt-0.5">저장 기사, AI 평가관 등 실험적 기능</p>
        </div>
        <span
          className="text-muted text-lg transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ›
        </span>
      </button>

      {/* sub-items */}
      {open && (
        <div className="flex flex-col gap-2 pl-4">
          {labMenus.map((menu) => (
            <Link key={menu.href} href={menu.href}>
              <div
                className="bg-white rounded-[14px] px-4 py-4 flex items-center gap-4 active:bg-gray-50"
                style={{ border: '0.5px solid var(--border)' }}
              >
                <span className="text-2xl w-9 text-center">{menu.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{menu.label}</p>
                  <p className="text-xs text-muted mt-0.5">{menu.desc}</p>
                </div>
                <span className="text-muted text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
