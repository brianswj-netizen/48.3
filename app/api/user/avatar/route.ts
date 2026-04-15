import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }

  // 5MB 제한
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WebP, GIF만 업로드 가능합니다.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const kakaoId = session.user.kakaoId

  // 파일 확장자 추출 (iOS 등에서 확장자 없을 경우 MIME 타입으로 대체)
  const extMatch = file.name.match(/\.([^.]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : (file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg')
  const path = `avatars/${kakaoId}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('Profiles')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: `업로드 오류: ${uploadError.message}` }, { status: 500 })
  }

  // public URL 생성 (DB에는 타임스탬프 없이 저장)
  let storedUrl: string
  const { data: urlData } = supabase.storage.from('Profiles').getPublicUrl(path)
  if (urlData?.publicUrl) {
    storedUrl = urlData.publicUrl
  } else {
    const { data: signedData, error: signedErr } = await supabase.storage
      .from('Profiles')
      .createSignedUrl(path, 315360000) // 10년
    if (signedErr || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'URL 생성 실패. Supabase Storage 버킷 설정을 확인해주세요.' }, { status: 500 })
    }
    storedUrl = signedData.signedUrl
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: storedUrl })
    .eq('kakao_id', kakaoId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 응답에는 캐시 버스팅용 타임스탬프 포함 (즉시 표시용)
  const displayUrl = storedUrl.includes('?') ? storedUrl + '&t=' + Date.now() : storedUrl + '?t=' + Date.now()
  return NextResponse.json({ ok: true, avatar_url: displayUrl })
}
