import { SkeletonBox } from '@/components/Skeleton'

export default function CalendarLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-16" />
      </header>
      <div className="px-4 py-4 flex flex-col gap-3">
        <SkeletonBox className="h-64 w-full rounded-[14px]" />
        <SkeletonBox className="h-4 w-20 mt-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[14px] border border-border p-4 flex items-center gap-4">
            <SkeletonBox className="w-10 h-12 rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonBox className="h-4 w-1/2" />
              <SkeletonBox className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
