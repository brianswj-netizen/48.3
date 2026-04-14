export default function PendingPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
        {/* 아이콘 */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: 'var(--amber-light)' }}
        >
          ⏳
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-black text-gray-900">승인 대기 중이에요</h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            가입 신청이 완료되었습니다.<br />
            관리자가 확인 후 승인하면<br />
            앱을 이용하실 수 있어요.
          </p>
        </div>

        {/* 안내 카드 */}
        <div
          className="w-full rounded-2xl px-5 py-4 text-left"
          style={{ background: 'white', border: '0.5px solid var(--border)' }}
        >
          <p className="text-xs font-semibold text-gray-700 mb-1">승인까지 시간이 걸리나요?</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            관리자가 카카오톡으로 승인 안내를 드릴 예정입니다.
            승인 후 이 페이지를 새로고침하거나 다시 로그인해 주세요.
          </p>
        </div>

        {/* 새로고침 버튼 */}
        <a
          href="/"
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white text-center block transition-opacity"
          style={{ background: 'var(--purple)' }}
        >
          새로고침
        </a>
      </div>
    </div>
  )
}
