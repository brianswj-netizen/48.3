'use client'

import { useState } from 'react'
import Link from 'next/link'

const labMenus = [
  { href: '/saved-articles', emoji: '📰', label: '지난 기사와 꿀팁', desc: '저장한 뉴스레터·꿀팁 모아보기', disabled: false },
  { href: '/evaluator', emoji: '🤖', label: 'AI 평가관', desc: '(제작소 내 Claude 피드백으로 기능 이전)', disabled: true },
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
          <p className="text-xs text-muted mt-0.5">지난 기사, AI 평가관 등 실험적 기능</p>
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
          {labMenus.map((menu) =>
            menu.disabled ? (
              <div key={menu.href}
                className="bg-white rounded-[14px] px-4 py-4 flex items-center gap-4 opacity-50"
                style={{ border: '0.5px solid var(--border)' }}
              >
                <span className="text-2xl w-9 text-center grayscale">{menu.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-500">{menu.label}</p>
                  <p className="text-xs text-muted mt-0.5">{menu.desc}</p>
                </div>
              </div>
            ) : (
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
            )
          )}
        </div>
      )}
    </div>
  )
}
