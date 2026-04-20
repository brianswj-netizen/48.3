'use client'

import { useState, useEffect, useRef } from 'react'
import DailyCardMessage from '@/components/chat/DailyCardMessage'

type Article = {
  id: string
  category: 'ai_news' | 'deep_article' | 'kr_news' | 'tips'
  title: string
  source_name: string | null
  source_url: string | null
  level: string | null
  tldr: string[]
  body: string | null
  tips: string[] | null
  quote: string | null
  quote_src: string | null
  date: string
}

const CATEGORY_LABEL: Record<string, string> = {
  ai_news: 'AI뉴스',
  deep_article: '심층기사',
  kr_news: '국내뉴스',
  tips: '꿀팁',
}

function ArticleList({ articles, openId }: { articles: Article[]; openId?: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(openId ?? null)
  const targetRef = useRef<HTMLDivElement | null>(null)

  // openId로 자동 스크롤
  useEffect(() => {
    if (openId && targetRef.current) {
      setTimeout(() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [openId])

  return (
    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
      {articles.map(article => {
        const isOpen = expandedId === article.id
        const isTarget = article.id === openId
        const catLabel = CATEGORY_LABEL[article.category] ?? article.category
        return (
          <div key={article.id} ref={isTarget ? targetRef : null}>
            {/* 목록 행 */}
            <button
              onClick={() => setExpandedId(isOpen ? null : article.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              style={isTarget && !isOpen ? { background: '#F0F9FF' } : undefined}
            >
              <span className="text-[10px] text-muted shrink-0 w-16">{article.date}</span>
              <span className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full"
                style={{
                  background: article.category === 'tips' ? '#FEF9C3' : '#E0F2FE',
                  color: article.category === 'tips' ? '#854D0E' : '#075985',
                }}>
                {catLabel}
              </span>
              <span className="text-sm text-gray-800 font-medium flex-1 truncate leading-snug">{article.title}</span>
              <span className="text-muted text-sm shrink-0">{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* 펼쳐진 전체 카드 */}
            {isOpen && (
              <div className="px-3 pb-3">
                <DailyCardMessage data={article as any} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CollapsibleSection({
  emoji, title, count, defaultOpen, articles, openId,
}: {
  emoji: string; title: string; count: number; defaultOpen: boolean; articles: Article[]; openId?: string
}) {
  // openId가 이 섹션의 아이템이면 강제로 펼침
  const hasTarget = openId ? articles.some(a => a.id === openId) : false
  const [open, setOpen] = useState(defaultOpen || hasTarget)

  return (
    <div className="rounded-[14px] overflow-hidden bg-white" style={{ border: '0.5px solid var(--border)' }}>
      {/* 섹션 헤더 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-sm font-black text-gray-900">{title}</span>
          <span className="text-xs text-muted">({count}개)</span>
        </div>
        <span className="text-muted text-base transition-transform duration-200"
          style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ›
        </span>
      </button>

      {/* 목록 */}
      {open && <ArticleList articles={articles} openId={openId && hasTarget ? openId : undefined} />}
    </div>
  )
}

export default function SavedArticlesClient({
  newsCards,
  tipCards,
  openId,
}: {
  newsCards: Article[]
  tipCards: Article[]
  openId?: string
}) {
  const total = newsCards.length + tipCards.length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl">📭</span>
        <p className="text-sm text-muted">아직 발행된 콘텐츠가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3 pb-24">
      {newsCards.length > 0 && (
        <CollapsibleSection
          emoji="📰"
          title="기사"
          count={newsCards.length}
          defaultOpen={true}
          articles={newsCards}
          openId={openId}
        />
      )}
      {tipCards.length > 0 && (
        <CollapsibleSection
          emoji="💡"
          title="꿀팁"
          count={tipCards.length}
          defaultOpen={true}
          articles={tipCards}
          openId={openId}
        />
      )}
    </div>
  )
}
