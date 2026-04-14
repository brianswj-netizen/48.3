import { aiLevels, gradeConfig } from '@/lib/data'

interface LevelBadgeProps {
  level: number
  className?: string
}

export function LevelBadge({ level, className = '' }: LevelBadgeProps) {
  const info = aiLevels.find((l) => l.level === level)
  if (!info) return null
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-light text-purple ${className}`}
    >
      {info.emoji} {info.name}
    </span>
  )
}

interface GradeBadgeProps {
  grade: keyof typeof gradeConfig
  className?: string
}

export function GradeBadge({ grade, className = '' }: GradeBadgeProps) {
  const info = gradeConfig[grade]
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${info.color} ${className}`}
    >
      {info.emoji} {info.label}
    </span>
  )
}
