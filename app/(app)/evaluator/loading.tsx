import { SkeletonBox } from '@/components/Skeleton'

export default function EvaluatorLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 bg-white border-b border-border">
        <SkeletonBox className="h-6 w-24" />
      </header>
      <div className="px-4 py-6 flex flex-col gap-4">
        <SkeletonBox className="h-32 w-full rounded-[14px]" />
        <SkeletonBox className="h-12 w-full rounded-[14px]" />
        <SkeletonBox className="h-48 w-full rounded-[14px]" />
      </div>
    </div>
  )
}
