import { SkeletonBox, SkeletonListItem } from '@/components/Skeleton'

export default function GroupsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-16" />
      </header>
      {/* 소모임 탭 스켈레톤 */}
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        {[60, 60, 60, 60].map((w, i) => (
          <SkeletonBox key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="flex flex-col py-2">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonListItem key={i} />)}
      </div>
    </div>
  )
}
