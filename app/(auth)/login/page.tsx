'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'

/* ── Olivia Herrick 스타일 배경 SVG ── */
function OliviaBg({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      {/* 상단 좌 - 코럴 반원 */}
      <path d="M-10,90 A90,90 0 0,1 80,0 L80,90 Z" fill="#E07B54" />
      {/* 상단 우 - 틸 호 */}
      <path d="M330,10 A70,70 0 0,1 400,80" stroke="#5BA8A0" strokeWidth="18" fill="none" strokeLinecap="round"/>
      {/* 우상 - 세이지 잎 */}
      <ellipse cx="370" cy="190" rx="22" ry="52" fill="#8BA05A" transform="rotate(25 370 190)" />
      {/* 좌중 - 라벤더 원 */}
      <circle cx="28" cy="260" r="38" fill="#9B87C4" opacity="0.85" />
      {/* 좌 - 머스타드 알약 */}
      <rect x="15" y="370" width="55" height="26" rx="13" fill="#D4A830" />
      {/* 우중 - 핑크 원 */}
      <circle cx="362" cy="330" r="30" fill="#F2A8A8" />
      {/* 좌하 - 틸 반원 */}
      <path d="M0,500 A55,55 0 0,1 110,500 Z" fill="#3A9898" />
      {/* 우하 - 코럴 물방울 */}
      <path d="M375,570 C400,535 418,500 375,478 C332,500 350,535 375,570 Z" fill="#E07B54" opacity="0.8"/>
      {/* 우하 - 블루 호 */}
      <path d="M310,660 A75,75 0 0,0 390,735" stroke="#4A7FBE" strokeWidth="15" fill="none" strokeLinecap="round"/>
      {/* 하단 - 소형 도형들 */}
      <circle cx="75" cy="695" r="22" fill="#F2A8A8" />
      <ellipse cx="195" cy="760" rx="32" ry="16" fill="#8BA05A" opacity="0.7" />
      <circle cx="295" cy="728" r="16" fill="#D4A830" />
      {/* 악센트 점 */}
      <circle cx="155" cy="155" r="9" fill="#E07B54" opacity="0.45" />
      <circle cx="245" cy="415" r="7" fill="#5BA8A0" opacity="0.45" />
      <circle cx="100" cy="560" r="11" fill="#9B87C4" opacity="0.35" />
    </svg>
  )
}

/* ── 걷는 사람 SVG ── */
function Walker({ walking }: { walking: boolean }) {
  const anim = walking
    ? {
        armL: { animation: 'armSwingL 0.42s ease-in-out infinite', transformOrigin: '11px 17px' },
        armR: { animation: 'armSwingR 0.42s ease-in-out infinite', transformOrigin: '17px 17px' },
        legL: { animation: 'legSwingL 0.42s ease-in-out infinite', transformOrigin: '11px 31px' },
        legR: { animation: 'legSwingR 0.42s ease-in-out infinite', transformOrigin: '17px 31px' },
        body: { animation: 'walkBob 0.42s ease-in-out infinite' },
      }
    : { armL: {}, armR: {}, legL: {}, legR: {}, body: {} }

  return (
    <svg width="28" height="56" viewBox="0 0 28 56" style={anim.body}>
      <circle cx="14" cy="6" r="5.5" fill="#3D2E22" />
      <rect x="10" y="12" width="8" height="18" rx="3" fill="#3D2E22" />
      <line x1="11" y1="17" x2="3" y2="27" stroke="#3D2E22" strokeWidth="2.8" strokeLinecap="round" style={anim.armL} />
      <line x1="17" y1="17" x2="25" y2="27" stroke="#3D2E22" strokeWidth="2.8" strokeLinecap="round" style={anim.armR} />
      <line x1="11" y1="30" x2="5"  y2="50" stroke="#3D2E22" strokeWidth="2.8" strokeLinecap="round" style={anim.legL} />
      <line x1="17" y1="30" x2="23" y2="50" stroke="#3D2E22" strokeWidth="2.8" strokeLinecap="round" style={anim.legR} />
    </svg>
  )
}

/* ── 문 컴포넌트 ── */
function Door({ open }: { open: boolean }) {
  return (
    <div style={{ position: 'relative', width: 88, height: 136 }}>
      {/* 문틀 */}
      <div style={{
        position: 'absolute', inset: 0,
        border: '5px solid #7A5030',
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        zIndex: 2, pointerEvents: 'none',
      }} />
      {/* 문 안쪽 빛 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, #FFFAE8 0%, #FAF0D0 70%, transparent 100%)',
        borderRadius: '3px 3px 0 0',
        opacity: open ? 1 : 0,
        transition: 'opacity 0.8s ease 0.3s',
      }} />
      {/* 문 패널 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#C4845A',
        borderRadius: '3px 3px 0 0',
        transformOrigin: 'left center',
        transform: open ? 'perspective(600px) rotateY(-78deg)' : 'perspective(600px) rotateY(0deg)',
        transition: 'transform 1.1s ease-in-out',
        boxShadow: open ? 'none' : 'inset -4px 0 10px rgba(0,0,0,0.18)',
      }}>
        {/* 패널 테두리 */}
        <div style={{
          position: 'absolute', left: 8, top: 12, right: 8, bottom: 18,
          border: '2px solid rgba(0,0,0,0.12)', borderRadius: 3,
        }} />
        {/* 손잡이 */}
        <div style={{
          position: 'absolute', right: 13, top: '44%',
          width: 10, height: 10, borderRadius: '50%',
          background: '#D4A830',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }} />
      </div>
    </div>
  )
}

/* ── 입장 애니메이션 화면 ── */
function EntranceAnim({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0)
  // 0: 걷는 중  1: 문 앞 도착  2: 문 열림  3: 페이드아웃

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2600)
    const t2 = setTimeout(() => setPhase(2), 3100)
    const t3 = setTimeout(() => setPhase(3), 4300)
    const t4 = setTimeout(() => onDone(), 4900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  const figureLeft =
    phase === 0 ? '3%'
    : phase === 1 ? 'calc(50% - 50px)'
    : 'calc(50% - 44px)'

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: '#FAF6ED',
        opacity: phase === 3 ? 0 : 1,
        transition: phase === 3 ? 'opacity 0.65s ease' : undefined,
      }}
    >
      <OliviaBg />

      {/* 상단 텍스트 */}
      <div className="absolute left-0 right-0 text-center" style={{ top: '22%', zIndex: 10 }}>
        <p style={{
          color: '#6B5040',
          fontSize: 12,
          letterSpacing: 3,
          fontWeight: 600,
          textTransform: 'uppercase',
          transition: 'opacity 0.4s',
        }}>
          {phase >= 2 ? '어서 오세요 ✨' : 'AI Survival Crew'}
        </p>
      </div>

      {/* 씬 영역 */}
      <div className="absolute" style={{ bottom: '22%', left: 0, right: 0 }}>
        {/* 바닥선 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#D4C0A8' }} />

        {/* 문 */}
        <div style={{
          position: 'absolute', bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
        }}>
          <Door open={phase >= 2} />
        </div>

        {/* 걷는 사람 */}
        <div style={{
          position: 'absolute', bottom: 2,
          left: figureLeft,
          opacity: phase >= 2 ? 0 : 1,
          transition: [
            `left ${phase === 0 ? '2.6s ease-in-out' : '0.5s ease'}`,
            `opacity ${phase >= 2 ? '0.3s ease' : '0s'}`,
          ].join(', '),
        }}>
          <Walker walking={phase === 0} />
        </div>
      </div>

      {/* Olivia Herrick 크레딧 */}
      <p style={{
        position: 'absolute', bottom: 16, left: 0, right: 0,
        textAlign: 'center', fontSize: 10, color: '#A89080', letterSpacing: 1,
      }}>
        Design inspiration: Olivia Herrick
      </p>
    </div>
  )
}

/* ── 로그인 폼 ── */
function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M9 0.5C4.029 0.5 0 3.695 0 7.635c0 2.522 1.614 4.74 4.048 6.01L3.06 17.176a.277.277 0 00.428.296L8.22 14.21c.258.02.518.031.78.031 4.971 0 9-3.195 9-7.135C18 3.695 13.971.5 9 .5z"
        fill="#191919" />
    </svg>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [showAnim, setShowAnim] = useState(true)

  return (
    <>
      {showAnim && <EntranceAnim onDone={() => setShowAnim(false)} />}

      <div
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{
          background: '#FAF6ED',
          opacity: showAnim ? 0 : 1,
          transition: 'opacity 0.5s ease',
          animation: showAnim ? undefined : 'fadeInUp 0.6s ease',
        }}
      >
        <OliviaBg opacity={0.5} />

        {/* 로고 */}
        <div className="relative flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: '#7B6FC4', boxShadow: '0 8px 24px rgba(123,111,196,0.3)' }}>
            <span className="text-4xl">⚓</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: '#2D3566' }}>AI Survival Crew</h1>
          <p className="text-sm mt-1.5" style={{ color: '#8B7B6B' }}>건국대 부동산대학원</p>
          <span className="mt-3 text-xs font-semibold px-3 py-1 rounded-full text-white"
            style={{ background: '#7B6FC4' }}>
            Season 1
          </span>
        </div>

        {/* 로그인 카드 */}
        <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl"
          style={{ border: '1px solid #E8DDD0' }}>
          <h2 className="text-center text-base font-bold mb-1" style={{ color: '#2D3566' }}>
            크루에 합류하세요
          </h2>
          <p className="text-center text-sm mb-6" style={{ color: '#8B7B6B' }}>
            카카오 계정으로 간편하게 시작하세요
          </p>
          <button
            onClick={() => signIn('kakao', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: '#FEE500', color: '#191919' }}
          >
            <KakaoIcon />
            카카오로 로그인
          </button>
          <p className="text-center text-xs mt-5 leading-relaxed" style={{ color: '#A89888' }}>
            로그인 시 서비스 이용약관 및<br />개인정보처리방침에 동의하는 것으로 간주합니다
          </p>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
