import type { NextAuthOptions } from 'next-auth'
import KakaoProvider from 'next-auth/providers/kakao'
import { createAdminClient } from '@/lib/supabase/admin'

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'kakao') return false

      const kakaoId = account.providerAccountId
      const supabase = createAdminClient()

      // 기존 유저 확인
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('kakao_id', kakaoId)
        .single()

      if (!existing) {
        // 신규 유저 생성 (name은 setup 페이지에서 입력)
        const isAdmin = kakaoId === process.env.ADMIN_KAKAO_ID
        const kakaoProfile = profile as { kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } } }
        const nickname = kakaoProfile?.kakao_account?.profile?.nickname ?? null
        const avatarUrl = kakaoProfile?.kakao_account?.profile?.profile_image_url ?? null

        // pre_등록 멤버 자동 매칭: 닉네임과 일치하는 pre_ 레코드 찾기
        // (setup 페이지에서 실명 입력 후 매칭되도록 kakao_id만 업데이트)
        await supabase.from('users').insert({
          kakao_id: kakaoId,
          nickname,
          avatar_url: avatarUrl,
          role: isAdmin ? 'admin' : 'member',
          status: isAdmin ? 'approved' : 'pending',
        })
      } else {
        // 기존 유저: 카카오 프로필 업데이트
        const kakaoProfile = profile as { kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } } }
        const nickname = kakaoProfile?.kakao_account?.profile?.nickname ?? null
        const avatarUrl = kakaoProfile?.kakao_account?.profile?.profile_image_url ?? null

        // 퇴장된 멤버가 재로그인하면 pending으로 복구 → admin 승인 대기열에 표시
        const { data: existingUser } = await supabase
          .from('users')
          .select('status')
          .eq('kakao_id', kakaoId)
          .single()

        const updates: Record<string, unknown> = { nickname, avatar_url: avatarUrl }
        if (existingUser?.status === 'removed') {
          updates.status = 'pending'
        }

        await supabase
          .from('users')
          .update(updates)
          .eq('kakao_id', kakaoId)
      }

      return true
    },

    async jwt({ token, account }) {
      if (account?.provider === 'kakao') {
        // 최초 로그인 시에만 DB에서 정보 가져오기
        token.kakaoId = account.providerAccountId

        const supabase = createAdminClient()
        const { data } = await supabase
          .from('users')
          .select('name, role')
          .eq('kakao_id', account.providerAccountId)
          .single()

        token.dbName = data?.name ?? null
        token.role = data?.role ?? 'member'
      }
      return token
    },

    async session({ session, token }) {
      session.user.kakaoId = token.kakaoId as string
      session.user.role = (token.role ?? 'member') as 'admin' | 'member'
      // hasName: DB에 실명이 저장됐는지 여부
      session.user.hasName = typeof token.dbName === 'string' && token.dbName.length > 0
      return session
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },
}
