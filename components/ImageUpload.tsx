'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  value: string | null
  onChange: (url: string | null) => void
  uploadType?: string
}

function isPdfUrl(url: string) {
  return url.split('?')[0].toLowerCase().endsWith('.pdf')
}

export default function ImageUpload({ value, onChange, uploadType = 'misc' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', uploadType)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok) {
        onChange(json.url)
      } else {
        setError(json.error ?? '업로드 실패')
      }
    } catch {
      setError('업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const isPdf = value ? isPdfUrl(value) : false

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleSelect}
      />

      {value ? (
        isPdf ? (
          /* PDF 미리보기 */
          <div className="relative flex items-center gap-3 rounded-xl border border-border bg-gray-50 px-3 py-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <span className="text-lg">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">PDF 파일</p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-500 hover:underline"
              >
                열어보기 →
              </a>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center hover:bg-gray-300 shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          /* 이미지 미리보기 */
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src={value}
              alt="첨부 이미지"
              width={600}
              height={400}
              className="w-full object-cover max-h-48"
              style={{ maxHeight: 192 }}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm text-muted border border-dashed border-border rounded-xl px-3 py-2.5 w-full hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span>📎</span>
          <span>{uploading ? '업로드 중...' : '이미지 또는 PDF 첨부'}</span>
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
