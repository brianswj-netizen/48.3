/**
 * 텍스트 안의 @이름을 보라색 bold로 렌더링
 * 내가 멘션된 경우 currentUserName을 넘기면 강조 배경 추가
 */
export default function MentionText({
  text,
  currentUserName,
}: {
  text: string
  currentUserName?: string | null
}) {
  // @이름 패턴 분리
  const parts = text.split(/(@[^\s@,!?。]+)/g)

  return (
    <span>
      {parts.map((part, i) => {
        if (!part.startsWith('@')) return <span key={i}>{part}</span>
        const name = part.slice(1)
        const isMe = currentUserName && name === currentUserName
        return (
          <span
            key={i}
            className="font-bold"
            style={{
              color: 'var(--purple)',
              background: isMe ? 'rgba(124,58,237,0.10)' : undefined,
              borderRadius: isMe ? '3px' : undefined,
              padding: isMe ? '0 2px' : undefined,
            }}
          >
            {part}
          </span>
        )
      })}
    </span>
  )
}
