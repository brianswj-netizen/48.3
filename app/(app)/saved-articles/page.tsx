import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import Link from 'next/link'
import SavedArticlesClient from '@/components/SavedArticlesClient'

const NEWS_CATEGORIES = ['ai_news', 'deep_article', 'kr_news']
const TIP_CATEGORIES = ['tips']

export default async function SavedArticlesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const user = await getCurrentUser()
  if (!user) return null
  const { open: openId } = await searchParams

  const supabase = createAdminClient()
  const { data: cards } = await supabase
    .from('daily_cards')
    .select('id, category, title, source_name, source_url, level, tldr, body, tips, quote, quote_src, card_date')
    .order('card_date', { ascending: false })
    .limit(60)

  const allCards = (cards ?? []).map((c: any) => ({
    id: c.id,
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

  const newsCards = allCards.filter(c => NEWS_CATEGORIES.includes(c.category))
  const tipCards = allCards.filter(c => TIP_CATEGORIES.includes(c.category))

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 flex items-center gap-3" style={{ background: '#2880A0' }}>
        <Link href="/more" className="text-white/80 text-xl leading-none">‹</Link>
        <h1 className="text-xl font-black text-white">지난 기사와 꿀팁</h1>
        <span className="text-white/60 text-sm ml-1">({allCards.length}개)</span>
      </header>

      <SavedArticlesClient newsCards={newsCards} tipCards={tipCards} openId={openId} />
    </div>
  )
}
