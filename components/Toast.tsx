'use client'

import { useEffect, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setMessage(msg)
  }

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [message])

  return { message, showToast }
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      className="fixed top-16 left-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg"
      style={{
        transform: 'translateX(-50%)',
        background: 'var(--purple)',
        animation: 'fadeInDown 0.2s ease',
      }}
    >
      {message}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
