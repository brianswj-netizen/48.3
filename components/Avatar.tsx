const AVATAR_COLORS = [
  '#534AB7', '#1D9E75', '#D85A30', '#BA7517',
  '#6366F1', '#0EA5E9', '#EC4899', '#8B5CF6',
]

function getColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export default function Avatar({ name, size = 36, className = '' }: AvatarProps) {
  const bg = getColor(name)
  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
    >
      {name.charAt(0)}
    </div>
  )
}
