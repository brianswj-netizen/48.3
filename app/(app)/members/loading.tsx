import { SkeletonBox, SkeletonListItem } from '@/components/Skeleton'

export default function MembersLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-20" />
      </header>
      <div className="flex flex-col py-2">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonListItem key={i} />)}
      </div>
    </div>
  )
}
