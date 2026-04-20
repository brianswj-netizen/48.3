'use client'

import { useState } from 'react'
import { getLevelInfo, getProgressPercent, getScoreToNextLevel } from '@/lib/crewScore'

const LEVELS = [
  { level: 1, name: '씨앗',      emoji: '🌱', min: 0,     minStr: '0점~',      desc: '크루 기본 멤버 자격',       benefits: [] },
  { level: 2, name: '새싹',      emoji: '🌿', min: 3000,  minStr: '3,000점~',  desc: '적극적으로 참여하는 크루',  benefits: ['Season 2 멤버십 신청 자격'] },
  { level: 3, name: '크루원',    emoji: '⚡', min: 10000, minStr: '10,000점~', desc: '핵심 활동 크루',             benefits: ['Season 2 멤버십 우선 신청권', 'AI 세미나·특강 우선 초대'] },
  { level: 4, name: '코어 크루', emoji: '🔥', min: 25000, minStr: '25,000점~', desc: '크루를 이끄는 핵심 멤버',   benefits: ['Season 2 멤버십 최우선 신청권', 'AI 세미나·특강 우선 초대', '운영진 협력 기회'] },
  { level: 5, name: 'MVP',       emoji: '👑', min: 50000, minStr: '50,000점~', desc: '크루 최고 기여자',           benefits: ['Season 2 멤버십 VIP 초대', '모든 세미나·특강 VIP 초대', '운영진 협력 기회', '특별 혜택 (추가 예정)'] },
]

// ─── 홈 헤더용 컴팩트 배지 ───────────────────────────────────────
export function CrewScoreBadge({ score, level }: { score: number; level: number }) {
  const info = getLevelInfo(level)
  const progress = getProgressPercent(score, level)
  const toNext = getScoreToNextLevel(score, level)
  const [showDrawer, setShowDrawer] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowDrawer(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-[12px] w-full text-left active:opacity-80 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        {/* 레벨 배지 */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
          style={{ background: info.bg, color: info.textColor }}
        >
          <span>{info.emoji}</span>
          <span>{info.name}</span>
        </div>

        {/* 점수 + 프로그레스 */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90">{score}점</span>
            {toNext !== null ? (
              <span className="text-[10px] text-white/50">Lv{level + 1}까지 {toNext}점</span>
            ) : (
              <span className="text-[10px] text-white/50">최고 레벨</span>
            )}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: info.color }}
            />
          </div>
        </div>

        <span className="text-white/40 text-xs shrink-0">›</span>
      </button>

      {/* 등급 설명 드로어 */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 z-[59] bg-black/30" onClick={() => setShowDrawer(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <h3 className="font-bold text-gray-900">크루 등급 안내</h3>
              <button onClick={() => setShowDrawer(false)}
                className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
              {/* 현재 내 등급 */}
              <div className="rounded-[14px] p-4 mb-3 flex items-center gap-3"
                style={{ background: `${info.color}15`, border: `1.5px solid ${info.color}40` }}>
                <span className="text-3xl">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted font-medium">현재 내 등급</p>
                  <p className="text-base font-black" style={{ color: info.color }}>{info.name}</p>
                  <p className="text-xs text-muted mt-0.5">{score.toLocaleString()}점{toNext !== null ? ` · Lv${level + 1}까지 ${toNext}점` : ' · 최고 레벨'}</p>
                </div>
              </div>

              {/* 등급 목록 */}
              {LEVELS.map(lv => {
                const isCurrent = level === lv.level
                const isReached = level >= lv.level
                return (
                  <div key={lv.name}
                    className="rounded-[12px] p-3.5 flex items-start gap-3"
                    style={{
                      background: isCurrent ? `${info.color}10` : '#FAFAFA',
                      border: isCurrent ? `1.5px solid ${info.color}50` : '1px solid var(--border)',
                    }}>
                    <span className="text-2xl shrink-0 mt-0.5" style={{ opacity: isReached ? 1 : 0.4 }}>{lv.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: isCurrent ? info.color : isReached ? '#374151' : '#9CA3AF' }}>
                          {lv.name}
                        </span>
                        <span className="text-[10px] text-muted">{lv.minStr}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: info.color, color: 'white' }}>현재</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{lv.desc}</p>
                      {lv.benefits.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-1">
                          {lv.benefits.map(b => (
                            <li key={b} className="text-xs flex items-center gap-1.5"
                              style={{ color: isReached ? '#374151' : '#9CA3AF' }}>
                              <span style={{ color: isReached ? info.color : '#D1D5DB' }}>✓</span> {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
              <p className="text-[10px] text-muted text-center pt-2 pb-1">* 혜택은 운영 방침에 따라 변경될 수 있습니다</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─── 설정 화면용 풀 카드 ─────────────────────────────────────────
export function CrewScoreFullCard({ score, level }: { score: number; level: number }) {
  const info = getLevelInfo(level)
  const progress = getProgressPercent(score, level)
  const toNext = getScoreToNextLevel(score, level)

  return (
    <section className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
      {/* 상단 색상 배너 */}
      <div
        className="px-4 pt-4 pb-5"
        style={{ background: `linear-gradient(135deg, ${info.color}22 0%, ${info.bg} 100%)` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">크루 점수</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black" style={{ color: info.color }}>{score}</span>
              <span className="text-sm text-muted font-medium">점</span>
            </div>
          </div>
          {/* 레벨 배지 */}
          <div
            className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-bold shadow-sm"
            style={{ background: info.bg, border: `2px solid ${info.color}40` }}
          >
            <span className="text-2xl leading-none">{info.emoji}</span>
            <span className="text-[10px] mt-1 font-bold" style={{ color: info.textColor }}>{info.name}</span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-semibold" style={{ color: info.textColor }}>
              Lv{level} {info.name}
            </span>
            {toNext !== null ? (
              <span className="text-[11px] text-muted">Lv{level + 1}까지 {toNext}점 남음</span>
            ) : (
              <span className="text-[11px]" style={{ color: info.textColor }}>🏆 최고 레벨</span>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${info.color}20` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: info.color }}
            />
          </div>
        </div>
      </div>

      {/* 크루 등급 로드맵 */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-bold text-muted mb-2.5">크루 등급 로드맵</p>
        <div className="flex items-center gap-0">
          {LEVELS.map((lv, i) => {
            const isReached = level >= lv.level
            const isCurrent = level === lv.level
            return (
              <div key={lv.level} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={
                      isCurrent
                        ? { background: info.color, boxShadow: `0 0 0 3px ${info.color}30` }
                        : isReached
                        ? { background: info.color + '80' }
                        : { background: '#F3F4F6', border: '1.5px solid #E5E7EB' }
                    }
                  >
                    <span style={{ fontSize: 14 }}>{lv.emoji}</span>
                  </div>
                  <span
                    className="text-[9px] mt-0.5 font-semibold text-center leading-tight"
                    style={{ color: isReached ? info.textColor : '#9CA3AF' }}
                  >
                    {lv.name}
                    <br />
                    <span style={{ fontWeight: 400, color: '#9CA3AF' }}>{lv.min.toLocaleString()}+</span>
                  </span>
                </div>
                {i < LEVELS.length - 1 && (
                  <div
                    className="h-0.5 flex-1 -mt-4 mx-0.5"
                    style={{ background: level > lv.level ? info.color + '60' : '#E5E7EB' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 등급별 혜택 (접이식) */}
      <details className="border-t border-border">
        <summary className="px-4 py-2.5 text-[11px] font-semibold text-muted cursor-pointer select-none list-none flex items-center justify-between">
          <span>등급별 혜택 보기</span>
          <span className="text-base leading-none">⌄</span>
        </summary>
        <div className="px-4 pb-4 flex flex-col gap-2.5">
          {LEVELS.map(lv => (
            <div key={lv.name} className="flex items-start gap-2.5 py-1">
              <span className="text-lg shrink-0 mt-0.5">{lv.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-gray-900">{lv.name}</span>
                  <span className="text-[10px] text-muted">{lv.minStr}</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">{lv.desc}</p>
                {lv.benefits.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {lv.benefits.map(b => (
                      <li key={b} className="text-[10px] text-gray-600 flex items-center gap-1">
                        <span style={{ color: info.color }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted pt-1 border-t border-border">* 혜택은 운영 방침에 따라 변경될 수 있습니다</p>
        </div>
      </details>

      {/* 점수 산정 기준 (접이식) */}
      <details className="border-t border-border">
        <summary className="px-4 py-2.5 text-[11px] font-semibold text-muted cursor-pointer select-none list-none flex items-center justify-between">
          <span>점수 산정 기준 보기</span>
          <span className="text-base leading-none">⌄</span>
        </summary>
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            ['채팅 메시지',      '+1점 (하루 최대 10점)'],
            ['채팅 리액션',      '+0.5점'],
            ['Daily Pick 댓글',  '+3점'],
            ['공지사항 댓글',    '+2점'],
            ['공지사항 리액션',  '+1점'],
            ['일정 댓글',        '+2점'],
            ['제안 댓글',        '+2점'],
            ['삽질기 댓글',      '+2점'],
            ['삽질기 글 작성',   '+30점'],
            ['삽질기 리액션',    '+0.5점 (하루 최대 5점)'],
            ['나의 피조물 등록', '+50점'],
            ['피조물 댓글',      '+2점'],
            ['피조물 리액션',    '+0.5점'],
            ['제안 등록',        '+5점'],
            ['제안 공감',        '+1점'],
            ['제안 해결됨',      '+15점'],
            ['투표 참여',        '+3점 (투표당 1회)'],
          ].map(([label, pts]) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-[10px] text-gray-600">{label}</span>
              <span className="text-[10px] font-semibold shrink-0" style={{ color: info.textColor }}>{pts}</span>
            </div>
          ))}
          <div className="col-span-2 mt-1 pt-1 border-t border-border">
            <p className="text-[10px] text-muted">* 점수는 매일 자정 자동 갱신됩니다</p>
          </div>
        </div>
      </details>
    </section>
  )
}
