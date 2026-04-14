import { SkeletonBox, SkeletonCard } from '@/components/Skeleton'

export default function SuggestionsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-16" />
      </header>
      <div className="px-4 py-4 flex flex-col gap-3 pb-24">
        {/* 필터 버튼 스켈레톤 */}
        <div className="flex gap-2">
          {[60, 80, 72, 56].map((w, i) => (
            <SkeletonBox key={i} className="h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
    </div>
  )
}
