import { SkeletonBox } from '@/components/Skeleton'

export default function ChatRoomLoading() {
  return (
    <div className="flex flex-col h-screen">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-3 md:pt-4 bg-white border-b border-border shrink-0">
        <SkeletonBox className="w-8 h-8 rounded-lg" />
        <SkeletonBox className="w-9 h-9 rounded-xl" />
        <SkeletonBox className="h-4 w-24" />
      </header>

      {/* 메시지 스켈레톤 */}
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 overflow-hidden">
        {/* 상대방 메시지 */}
        <div className="flex items-end gap-2">
          <SkeletonBox className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex flex-col gap-1.5">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-10 w-48 rounded-2xl rounded-tl-sm" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-9 shrink-0" />
          <SkeletonBox className="h-8 w-36 rounded-2xl rounded-tl-sm" />
        </div>

        {/* 내 메시지 */}
        <div className="flex items-end gap-2 justify-end">
          <SkeletonBox className="h-10 w-52 rounded-2xl rounded-tr-sm" style={{ background: '#C4B8D8' }} />
        </div>

        {/* 상대방 메시지 */}
        <div className="flex items-end gap-2">
          <SkeletonBox className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex flex-col gap-1.5">
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-12 w-56 rounded-2xl rounded-tl-sm" />
          </div>
        </div>
      </div>

      {/* 입력창 스켈레톤 */}
      <div className="px-4 py-3 border-t border-border bg-white">
        <SkeletonBox className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  )
}
