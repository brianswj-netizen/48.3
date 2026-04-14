import { SkeletonBox, SkeletonCard } from '@/components/Skeleton'

export default function AnnouncementsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-24" />
      </header>
      <div className="px-4 py-4 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} rows={2} />)}
      </div>
    </div>
  )
}
