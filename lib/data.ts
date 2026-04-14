// 더미 데이터 (Supabase 연동 전 개발용)

export const members = [
  { id: '1',  name: '서정욱', role: '운영자·시행', industry: '시행·개발', level: 3, score: 88, grade: 'leader' as const },
  { id: '2',  name: '이태윤', role: '멤버',        industry: '금융·투자',  level: 2, score: 58, grade: 'active' as const },
  { id: '3',  name: '차범석', role: '멤버',        industry: '시행·개발', level: 2, score: 54, grade: 'active' as const },
  { id: '4',  name: '이소진', role: '멤버',        industry: '중개·컨설팅', level: 1, score: 45, grade: 'active' as const },
  { id: '5',  name: '박진석', role: '멤버',        industry: '시행·개발', level: 1, score: 42, grade: 'active' as const },
  { id: '6',  name: '채우병', role: '멤버',        industry: '금융·투자',  level: 2, score: 38, grade: 'watch' as const },
  { id: '7',  name: '김형진', role: '멤버',        industry: '감정평가',   level: 3, score: 60, grade: 'active' as const },
  { id: '8',  name: '이주호', role: '멤버',        industry: '중개·컨설팅', level: 1, score: 32, grade: 'watch' as const },
  { id: '9',  name: '이건명', role: '멤버',        industry: '시행·개발', level: 2, score: 48, grade: 'active' as const },
  { id: '10', name: '정영경', role: '멤버',        industry: '중개·컨설팅', level: 1, score: 35, grade: 'watch' as const },
  { id: '11', name: '최유미', role: '멤버',        industry: '감정평가',   level: 2, score: 50, grade: 'active' as const },
  { id: '12', name: '김동영', role: '멤버',        industry: '금융·투자',  level: 3, score: 60, grade: 'active' as const },
  { id: '13', name: '문지연', role: '멤버',        industry: '중개·컨설팅', level: 1, score: 30, grade: 'watch' as const },
  { id: '14', name: '방소윤', role: '멤버',        industry: '시행·개발', level: 1, score: 40, grade: 'active' as const },
  { id: '15', name: '유지안', role: '멤버',        industry: '금융·투자',  level: 2, score: 47, grade: 'active' as const },
  { id: '16', name: '고영선', role: '멤버',        industry: '감정평가',   level: 4, score: 75, grade: 'leader' as const },
]

export const aiLevels = [
  { level: 1, emoji: '🌊', name: 'AI 입문자',  desc: 'AI 툴 사용 경험 거의 없음' },
  { level: 2, emoji: '🚢', name: 'AI 갑판원',  desc: 'ChatGPT 등 AI 툴 사용 경험 있음' },
  { level: 3, emoji: '⚓', name: 'AI 갑판장',  desc: 'AI 툴로 결과물 직접 제작' },
  { level: 4, emoji: '🧭', name: 'AI 조타수',  desc: '업무에 AI 실제 적용' },
  { level: 5, emoji: '⚙️', name: 'AI 기관사',  desc: '타인이 쓸 수 있는 수준으로 배포' },
  { level: 6, emoji: '🚀', name: 'AI 선장',    desc: '팀/조직을 AI로 이끄는 단계' },
]

export const gradeConfig = {
  leader: { label: '크루 리더', emoji: '🏆', color: 'text-amber bg-amber-light' },
  active: { label: '액티브 크루', emoji: '⚡', color: 'text-teal bg-teal-light' },
  watch:  { label: '관찰 대상', emoji: '⚠', color: 'text-amber bg-amber-light' },
  out:    { label: '아웃', emoji: '✕', color: 'text-coral bg-coral-light' },
}

export const dummyAnnouncements = [
  { id: '1', title: '4월 정기모임 안내', content: '4월 15일(화) 저녁 7시, 건국대 부동산대학원 세미나실', createdAt: '2025-04-01' },
  { id: '2', title: 'AI Survival Crew 앱 오픈!', content: '드디어 우리만의 커뮤니티 앱이 생겼습니다. 많이 활용해주세요!', createdAt: '2025-03-28' },
  { id: '3', title: '시즌 1 활동지수 중간 결과', content: '현재까지의 활동지수를 멤버 소개 페이지에서 확인하세요.', createdAt: '2025-03-20' },
]

export const dummyEvents = [
  { id: '1', title: '4월 정기모임',     date: '2025-04-15', time: '19:00', location: '건국대 부동산대학원 세미나실', category: 'meeting' },
  { id: '2', title: '중급반 스터디',    date: '2025-04-18', time: '20:00', location: '온라인 (Zoom)',              category: 'study' },
  { id: '3', title: '고급반 해커톤',    date: '2025-04-25', time: '10:00', location: '강남 코워킹스페이스',         category: 'event' },
  { id: '4', title: '5월 정기모임',     date: '2025-05-13', time: '19:00', location: '건국대 부동산대학원 세미나실', category: 'meeting' },
]

export const dummyChatPreview = {
  roomName: '전체방',
  lastMessage: '고영선: 방금 GPT로 임장보고서 초안 만들었는데 대박이에요 ㅋㅋ',
  unread: 5,
  time: '오후 2:34',
}

export type Member = typeof members[0]
export type AiLevel = typeof aiLevels[0]
export type Event = typeof dummyEvents[0]
export type Announcement = typeof dummyAnnouncements[0]
