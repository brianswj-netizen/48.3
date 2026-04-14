// ─── 크루 점수 시스템 정의 ───────────────────────────────────────────────────
//
// 점수 기준 (객관적·자동 계산)
// ─────────────────────────────
// 채팅 메시지 전송     +1점  (하루 최대 10점)
// 채팅 리액션 주기     +0.5점
// Daily Pick 댓글     +3점
// 공지사항 댓글        +2점
// 공지사항 리액션      +1점
// 일정 댓글           +2점
// 제안 댓글           +2점
// 삽질기 댓글         +2점
// 삽질기 글 작성       +10점
// 삽질기 리액션 주기   +0.5점  (하루 최대 5점)
// 제안 등록           +5점
// 제안 공감(좋아요)    +1점
// 제안이 해결됨        +15점  (내 제안 기준)
// 투표 참여           +3점  (투표당 1회)
// ─────────────────────────────
// 관리자 수동 보정: users.score 에 직접 가산 가능

export const SCORE_RULES = {
  chat_message:          { label: '채팅 메시지',    points: 1,  note: '하루 최대 10점' },
  chat_reaction:         { label: '채팅 리액션',    points: 0.5 },
  daily_card_comment:    { label: 'Daily Pick 댓글', points: 3 },
  announcement_comment:  { label: '공지사항 댓글',   points: 2 },
  announcement_reaction: { label: '공지사항 리액션', points: 1 },
  event_comment:         { label: '일정 댓글',      points: 2 },
  suggestion_comment:    { label: '제안 댓글',      points: 2 },
  sapjil_comment:        { label: '삽질기 댓글',    points: 2 },
  sapjil_post:           { label: '삽질기 글 작성', points: 10 },
  sapjil_reaction:       { label: '삽질기 리액션',  points: 0.5, note: '하루 최대 5점' },
  suggestion_submit:     { label: '제안 등록',      points: 5 },
  suggestion_like:       { label: '제안 공감',      points: 1 },
  suggestion_resolved:   { label: '제안 해결됨',    points: 15 },
  vote_participation:    { label: '투표 참여',      points: 3,  note: '투표당 1회' },
} as const

export type LevelInfo = {
  level: number
  name: string
  emoji: string
  minScore: number
  maxScore: number
  color: string
  bg: string
  textColor: string
}

export const LEVEL_CONFIG: LevelInfo[] = [
  { level: 1, name: '씨앗',     emoji: '🌱', minScore: 0,     maxScore: 2999,    color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' },
  { level: 2, name: '새싹',     emoji: '🌿', minScore: 3000,  maxScore: 9999,    color: '#16A34A', bg: '#DCFCE7', textColor: '#15803D' },
  { level: 3, name: '크루원',   emoji: '⚡', minScore: 10000, maxScore: 24999,   color: '#2563EB', bg: '#DBEAFE', textColor: '#1D4ED8' },
  { level: 4, name: '코어 크루', emoji: '🔥', minScore: 25000, maxScore: 49999,   color: '#EA580C', bg: '#FFEDD5', textColor: '#C2410C' },
  { level: 5, name: 'MVP',      emoji: '👑', minScore: 50000, maxScore: 999999,  color: '#7C3AED', bg: '#EDE9FE', textColor: '#6D28D9' },
]

export function getLevelInfo(level: number): LevelInfo {
  return LEVEL_CONFIG.find(l => l.level === level) ?? LEVEL_CONFIG[0]
}

export function getLevelFromScore(score: number): number {
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (score >= LEVEL_CONFIG[i].minScore) return LEVEL_CONFIG[i].level
  }
  return 1
}

/** 현재 레벨에서 다음 레벨까지의 진행률 (0–100) */
export function getProgressPercent(score: number, level: number): number {
  if (level >= 5) return 100
  const current = LEVEL_CONFIG.find(l => l.level === level)
  const next    = LEVEL_CONFIG.find(l => l.level === level + 1)
  if (!current || !next) return 100
  const range    = next.minScore - current.minScore
  const progress = score - current.minScore
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)))
}

/** 다음 레벨까지 남은 점수 */
export function getScoreToNextLevel(score: number, level: number): number | null {
  if (level >= 5) return null
  const next = LEVEL_CONFIG.find(l => l.level === level + 1)
  if (!next) return null
  return Math.max(0, next.minScore - score)
}
