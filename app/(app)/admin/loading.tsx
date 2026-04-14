import { SkeletonBox, SkeletonListItem } from '@/components/Skeleton'

export default function AdminLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-24" />
      </header>
      <div className="flex flex-col py-2">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonListItem key={i} />)}
      </div>
    </div>
  )
}
