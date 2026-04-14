import { SkeletonBox, SkeletonListItem } from '@/components/Skeleton'

export default function ChatLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-16" />
      </header>
      <div className="flex flex-col">
        <SkeletonBox className="h-3 w-10 mx-5 mt-4 mb-2" />
        {[1, 2].map(i => <SkeletonListItem key={i} />)}
        <SkeletonBox className="h-3 w-14 mx-5 mt-4 mb-2" />
        {[1].map(i => <SkeletonListItem key={i} />)}
      </div>
    </div>
  )
}
