import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import Link from 'next/link'
import DailyCardMessage from '@/components/chat/DailyCardMessage'

export default async function SavedArticlesPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createAdminClient()
  const { data: cards } = await supabase
    .from('daily_cards')
    .select('id, category, title, source_name, source_url, level, tldr, body, tips, quote, quote_src, card_date')
    .order('card_date', { ascending: false })
    .limit(60)

  const articles = (cards ?? []).map((c: any) => ({
    category: c.category,
    title: c.title,
    source_name: c.source_name,
    source_url: c.source_url,
    level: c.level,
    tldr: c.tldr ?? [],
    body: c.body,
    tips: c.tips,
    quote: c.quote,
    quote_src: c.quote_src,
    date: c.card_date,
  }))

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 flex items-center gap-3" style={{ background: '#2880A0' }}>
        <Link href="/more" className="text-white/80 text-xl leading-none">‹</Link>
        <h1 className="text-xl font-black text-white">저장된 기사</h1>
        <span className="text-white/60 text-sm ml-1">({articles.length}개)</span>
      </header>

      <div className="px-4 py-4 flex flex-col gap-4 pb-24">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-muted">아직 발행된 뉴스레터가 없습니다.</p>
          </div>
        ) : (
          articles.map((article, i) => (
            <DailyCardMessage key={`${article.title}-${article.date}-${i}`} data={article} />
          ))
        )}
      </div>
    </div>
  )
}
