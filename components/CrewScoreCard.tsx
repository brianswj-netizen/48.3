import { getLevelInfo, getProgressPercent, getScoreToNextLevel } from '@/lib/crewScore'

// ─── 홈 헤더용 컴팩트 배지 ───────────────────────────────────────
export function CrewScoreBadge({ score, level }: { score: number; level: number }) {
  const info = getLevelInfo(level)
  const progress = getProgressPercent(score, level)
  const toNext = getScoreToNextLevel(score, level)

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
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
    </div>
  )
}

// ─── 설정 화면용 풀 카드 ─────────────────────────────────────────
export function CrewScoreFullCard({ score, level }: { score: number; level: number }) {
  const info = getLevelInfo(level)
  const progress = getProgressPercent(score, level)
  const toNext = getScoreToNextLevel(score, level)

  const LEVELS = [
    { level: 1, name: '씨앗',      emoji: '🌱', min: 0     },
    { level: 2, name: '새싹',      emoji: '🌿', min: 3000  },
    { level: 3, name: '크루원',    emoji: '⚡', min: 10000 },
    { level: 4, name: '코어 크루', emoji: '🔥', min: 25000 },
    { level: 5, name: 'MVP',       emoji: '👑', min: 50000 },
  ]

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

      {/* 레벨 로드맵 */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-bold text-muted mb-2.5">레벨 로드맵</p>
        <div className="flex items-center gap-0">
          {LEVELS.map((lv, i) => {
            const isReached = level >= lv.level
            const isCurrent = level === lv.level
            return (
              <div key={lv.level} className="flex items-center flex-1">
                {/* 노드 */}
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
                    <span style={{ fontWeight: 400, color: '#9CA3AF' }}>{lv.min}+</span>
                  </span>
                </div>
                {/* 연결선 */}
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

      {/* 점수 산정 기준 (접이식) */}
      <details className="border-t border-border">
        <summary className="px-4 py-2.5 text-[11px] font-semibold text-muted cursor-pointer select-none list-none flex items-center justify-between">
          <span>점수 산정 기준 보기</span>
          <span className="text-base leading-none">⌄</span>
        </summary>
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            ['채팅 메시지',    '+1점 (하루 최대 10점)'],
            ['채팅 리액션',    '+0.5점'],
            ['Daily Pick 댓글', '+3점'],
            ['공지사항 댓글',  '+2점'],
            ['공지사항 리액션', '+1점'],
            ['일정 댓글',      '+2점'],
            ['제안 댓글',      '+2점'],
            ['삽질기 댓글',    '+2점'],
            ['삽질기 글 작성', '+10점'],
            ['삽질기 리액션',  '+0.5점 (하루 최대 5점)'],
            ['제안 등록',      '+5점'],
            ['제안 공감',      '+1점'],
            ['제안 해결됨',    '+15점'],
            ['투표 참여',      '+3점 (투표당 1회)'],
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
