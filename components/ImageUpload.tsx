'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  value: string | null
  onChange: (url: string | null) => void
  uploadType?: string
}

export default function ImageUpload({ value, onChange, uploadType = 'misc' }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', uploadType)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json()
        onChange(url)
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      {value ? (
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
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm text-muted border border-dashed border-border rounded-xl px-3 py-2.5 w-full hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span>📷</span>
          <span>{uploading ? '업로드 중...' : '이미지 첨부'}</span>
        </button>
      )}
    </div>
  )
}
