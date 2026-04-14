'use client'

import { useEffect } from 'react'

export default function FontSizeApplier() {
  useEffect(() => {
    const size = localStorage.getItem('appFontSize')
    if (size === 'large') {
      document.documentElement.classList.add('font-large')
    } else {
      document.documentElement.classList.remove('font-large')
    }
  }, [])
  return null
}
