import { SkeletonBox, SkeletonCard } from '@/components/Skeleton'

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      {/* 헤더 스켈레톤 */}
      <header className="px-5 pt-12 pb-5 md:pt-6" style={{ background: 'var(--navy)' }}>
        <SkeletonBox className="h-7 w-48 mb-2 bg-white/20" />
        <SkeletonBox className="h-4 w-28 bg-white/10" />
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* 공지사항 */}
        <section>
          <SkeletonBox className="h-4 w-20 mb-3" />
          <SkeletonCard rows={1} />
        </section>

        {/* 일정 */}
        <section>
          <SkeletonBox className="h-4 w-16 mb-3" />
          <SkeletonCard rows={1} />
        </section>

        {/* 채팅 */}
        <section>
          <SkeletonBox className="h-4 w-12 mb-3" />
          <div className="bg-white rounded-[14px] border border-border overflow-hidden">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                <SkeletonBox className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <SkeletonBox className="h-3.5 w-1/4" />
                  <SkeletonBox className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
