import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const uploadType = (formData.get('type') as string) ?? 'misc'

  if (!file) return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })

  // 이미지 또는 PDF만 허용
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'
  if (!isImage && !isPdf) {
    return NextResponse.json({ error: '이미지 또는 PDF 파일만 업로드 가능합니다' }, { status: 400 })
  }

  // 크기 제한 (이미지 10MB, PDF 20MB)
  const sizeLimit = isPdf ? 20 * 1024 * 1024 : 10 * 1024 * 1024
  if (file.size > sizeLimit) {
    return NextResponse.json({ error: isPdf ? 'PDF는 20MB 이하여야 합니다' : '이미지는 10MB 이하여야 합니다' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${uploadType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const supabase = createAdminClient()
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
