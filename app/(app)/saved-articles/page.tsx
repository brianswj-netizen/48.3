'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DailyCardMessage, { type DailyCardData } from '@/components/chat/DailyCardMessage'

const STORAGE_KEY = 'ai_saved_articles'

export default function SavedArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<DailyCardData[]>([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      setArticles(Array.isArray(saved) ? saved : [])
    } catch {
      setArticles([])
    }
  }, [])

  function removeArticle(title: string, date: string) {
    const updated = articles.filter(a => !(a.title === title && a.date === date))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setArticles(updated)
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 flex items-center gap-3" style={{ background: '#2880A0' }}>
        <button onClick={() => router.back()} className="text-white/80 text-xl leading-none">‹</button>
        <h1 className="text-xl font-black text-white">저장된 기사</h1>
      </header>

      <div className="px-4 py-4 flex flex-col gap-4 pb-24">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-muted">저장된 기사가 없습니다.</p>
            <p className="text-xs text-muted mt-1">채팅방의 뉴스레터 카드에서 저장 버튼을 눌러보세요.</p>
          </div>
        ) : (
          articles.map((article, i) => (
            <div key={`${article.title}-${article.date}-${i}`} className="flex flex-col gap-2">
              <DailyCardMessage data={article} />
              <button
                onClick={() => removeArticle(article.title, article.date)}
                className="text-xs text-red-400 hover:text-red-600 self-end px-2"
              >
                🗑 저장 취소
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
