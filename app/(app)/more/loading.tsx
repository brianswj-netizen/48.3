import { SkeletonBox } from '@/components/Skeleton'

function SkeletonMenuItem() {
  return (
    <div className="bg-white rounded-[14px] px-4 py-4 flex items-center gap-4 border border-border/50">
      <SkeletonBox className="w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonBox className="h-3.5 w-1/4" />
        <SkeletonBox className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export default function MoreLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#8C6AAE' }}>
        <SkeletonBox className="h-6 w-20 bg-white/30" />
      </header>
      <div className="px-4 py-4 flex flex-col gap-2 pb-24">
        {Array.from({ length: 7 }).map((_, i) => <SkeletonMenuItem key={i} />)}
      </div>
    </div>
  )
}
