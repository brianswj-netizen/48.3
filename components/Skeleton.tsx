// 공용 스켈레톤 컴포넌트

export function SkeletonBox({
  className = '',
  style = {},
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      style={style}
    />
  )
}

export function SkeletonCard({ rows = 2 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-[14px] border border-border p-4 flex flex-col gap-3">
      <SkeletonBox className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} className="h-3" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  )
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
      <SkeletonBox className="w-12 h-12 rounded-2xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonBox className="h-3.5 w-1/3" />
        <SkeletonBox className="h-3 w-2/3" />
      </div>
    </div>
  )
}
