# AI Survival Crew — 앱 개선 작업 보고서

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-04-12 |
| 작성자 | Brian Sungwook Jung |
| 배포 환경 | Vercel (Next.js 16 App Router + Supabase PostgreSQL) |
| 총 개선 항목 | 20건 |
| 신규 DB 테이블 | 3개 (suggestion_comments, message_reactions, mention_notifications) |

---

## 목차

| 분류 | 항목 |
|------|------|
| 🏠 홈·네비게이션 | #1 공지사항 아코디언 / #2 홈→캘린더 이동 / #10 AI 로고 / #11 헤더 컬러 / #19 홈 투표 섹션 |
| 📅 캘린더 | #3 지난 일정 섹션 |
| 💬 채팅 | #5 메시지 수정·삭제 / #8 이모티콘 반응 / #9 이모지 피커 / #20 @멘션 |
| 💡 제안 게시판 | #4 토스트 알림 / #6 해결됨·댓글 / #7 모바일 버튼 / #15 타이틀 / #16 해결 버튼 |
| 🗳️ 투표 | #7 모바일 버튼 |
| 👥 멤버 | #18 임시 숨김 |
| ⚙️ 설정·전역 | #12 글씨 크기 / #13 Design Inspiration / #14 저작권 푸터 / #17 Admin 삭제 |

---

## 상세 개선 내용

---

### #1 공지사항 아코디언

- **요청** 공지사항 목록에서 항목을 누르면 본문이 펼쳐지도록
- **구현** 각 항목에 `expanded` 상태 추가. 클릭 시 본문 내용 토글 표시
- **수정 파일** `components/AnnouncementsClient.tsx`

---

### #2 홈 화면 일정 → 캘린더 이동

- **요청** 홈 화면 "다음 일정" 항목 클릭 시 캘린더 페이지로 이동
- **구현** 이벤트 항목을 `<Link href="/calendar">` 로 감쌈
- **수정 파일** `app/(app)/page.tsx`

---

### #3 캘린더 지난 일정 섹션

- **요청** 지난 일정도 한 곳에 모아서, 누르면 최근일부터 역순으로 표시
- **구현** 캘린더 하단에 "📂 지난 일정 (N개)" 토글 버튼 추가. 클릭 시 `pastEvents` 목록을 최근순(역순)으로 펼침
- **수정 파일** `components/CalendarClient.tsx`

---

### #4 등록 완료 토스트 알림

- **요청** 제안 등록·해결 처리 후 완료 피드백 표시
- **구현** `Toast` / `useToast` 컴포넌트 신규 작성. 제안 등록 시 "제안이 등록됐습니다! 👍", 해결 처리 시 "✅ 해결됨으로 표시했습니다!" 토스트 표시
- **신규 파일** `components/Toast.tsx`
- **수정 파일** `components/SuggestionsClient.tsx`

---

### #5 채팅 메시지 수정·삭제

- **요청** 본인이 쓴 메시지는 수정·삭제 가능, admin은 모든 메시지 삭제 가능
- **구현**
  - 내 메시지: "수정" 클릭 → 인라인 textarea로 교체 → 저장/취소
  - 삭제: soft delete (`deleted = true`) 처리, 화면에서 즉시 제거
  - Admin: 타인 메시지에도 "삭제" 버튼 노출
- **신규 API**
  - `PATCH /api/chat/[roomId]/messages/[messageId]` — 메시지 수정 (본인만)
  - `DELETE /api/chat/[roomId]/messages/[messageId]` — 메시지 삭제 (본인 또는 admin)
- **수정 파일** `components/chat/MessageItem.tsx`, `app/api/chat/[roomId]/messages/[messageId]/route.ts`

---

### #6 제안 게시판 — 해결됨 버튼 + 의견 댓글

- **요청** 제안한 사람이 "해결됨" 버튼을 눌러 상태 변경 가능. 해결 후에도 의견을 남길 수 있도록 댓글 기능 추가
- **구현**
  - **해결 버튼**: 작성자 또는 admin에게만 표시. 클릭 시 open ↔ resolved 토글. 해결된 제안에는 초록 배지 "해결됨" 표시
  - **댓글(의견)**: "💬 의견" 버튼 클릭 시 댓글 섹션 펼침. Enter키로 등록, 여러 번 의견 추가 가능
- **신규 DB** `suggestion_comments` 테이블 (`supabase/suggestion_comments_migration.sql`)
- **신규 API**
  - `POST /api/suggestions/[id]/resolve` — 해결 상태 토글
  - `GET /api/suggestions/[id]/comments` — 댓글 목록 조회
  - `POST /api/suggestions/[id]/comments` — 댓글 등록
- **수정 파일** `components/SuggestionsClient.tsx`, `app/(app)/suggestions/page.tsx`

---

### #7 모바일(iPhone 13) 등록 버튼 미표시 수정

- **요청** 제안 작성·투표 생성 모달에서 iOS 키보드가 올라오면 "등록" 버튼이 화면 밖으로 밀려 보이지 않음
- **원인** 모달 전체가 스크롤되는 구조여서 키보드 높이만큼 버튼이 가려짐
- **해결**
  - 모달 구조를 `flex-col`로 재구성: 헤더 + 스크롤 가능한 입력 영역 + sticky 하단 버튼 영역으로 분리
  - `maxHeight: '85dvh'` 적용 (dynamic viewport height, iOS 키보드 인식)
  - 하단 버튼 영역에 `paddingBottom: 'max(24px, env(safe-area-inset-bottom))'` 적용
- **수정 파일** `components/SuggestionsClient.tsx`, `components/VotesClient.tsx`

---

### #8 채팅 이모티콘 반응 (롱프레스)

- **요청** 카카오톡처럼 메시지를 길게 누르면 이모티콘을 달 수 있도록. 이모티콘은 메시지 아래 조그맣게 표시
- **구현**
  - 500ms 롱프레스(터치·마우스 공통) 감지 → 6개 퀵 리액션 팝업 표시
  - 선택한 이모티콘이 메시지 아래 배지(pill) 형태로 표시 (숫자 포함)
  - 내가 선택한 반응은 보라색으로 강조, 같은 이모티콘 재클릭 시 취소(토글)
  - 낙관적 UI 업데이트로 즉각 반응
- **신규 DB** `message_reactions` 테이블 — `(message_id, user_id, emoji)` UNIQUE 제약 (`supabase/message_reactions_migration.sql`)
- **신규 API**
  - `GET /api/chat/[roomId]/reactions` — 방 전체 반응 일괄 조회
  - `POST /api/chat/[roomId]/messages/[messageId]/reactions` — 반응 토글 (추가/취소)
- **수정 파일** `components/chat/MessageItem.tsx`, `components/chat/ChatRoomClient.tsx`

---

### #9 이모지 피커 그룹화 + 컬러 적용

- **요청** 채팅 입력창 이모지 피커 디자인을 작가(Olivia Herrick) 컬러코드에 맞춰 변경
- **구현** 4개 그룹으로 구분, 각 그룹 배경에 작가 컬러 적용

  | 그룹 | 이모지 예시 | 배경 컬러 |
  |------|------------|----------|
  | 표정 | 😊😂🥰😍🤔 | coral `rgba(224,123,84,0.10)` |
  | 행동 | 👍🔥❤️✅🎉 | teal `rgba(40,128,160,0.10)` |
  | 기타 | 👏🤝😎🤩🙌 | purple `rgba(123,111,196,0.10)` |
  | 심볼 | 💡📌🚀⚡🎯 | gold `rgba(196,144,48,0.10)` |

- **수정 파일** `components/chat/MessageInput.tsx`

---

### #10 앱 로고 AI 텍스트 강조

- **요청** 홈화면 로고의 'AI' 텍스트를 폰트 1.5배, 굵게, 진한 컬러로 변경
- **구현** `fontSize: '2.2rem'`, `fontWeight: 900`, `color: '#C4B5FD'` (lavender)
- **수정 파일** `app/(app)/page.tsx`

---

### #11 전체 페이지 헤더 컬러 강화

- **요청** 홈 헤더의 강한 컬러처럼, 다른 페이지도 작가 팔레트 컬러로 헤더 변경
- **구현** 각 페이지 헤더에 작가(Olivia Herrick) 팔레트 컬러 적용

  | 페이지 | 컬러 | 코드 |
  |--------|------|------|
  | 홈 | Navy | `var(--navy)` |
  | 공지사항 | Coral | `#E07B54` |
  | 채팅 목록 | Teal-Blue | `#2880A0` |
  | 캘린더 | Purple | `#7B6FC4` |
  | 제안 | Deep Purple | `#8858B0` |
  | 멤버 소개 | Gold | `#C89030` |
  | 투표 | Deep Blue | `#2858A8` |
  | 설정 | Green | `#7A9840` |
  | 더보기 | Navy | `var(--navy)` |

- **수정 파일** 각 페이지 Client 컴포넌트 헤더 영역

---

### #12 전체 화면 글씨 크기 설정

- **요청** 채팅뿐 아니라 전체 화면의 글씨 크기를 크게 볼 수 있는 설정 추가
- **구현**
  - 설정 > "화면 설정" 섹션 신규 추가 → 기본(15px) / 크게(17px) 토글 버튼
  - `html.font-large { font-size: 17px }` 적용 → Tailwind의 모든 `rem` 기반 크기가 자동 비례 확대
  - `FontSizeApplier` 클라이언트 컴포넌트: 앱 로드 시 `localStorage` 값 읽어 즉시 적용 (깜빡임 없음)
  - 설정값은 `localStorage('appFontSize')`에 영구 저장
- **신규 파일** `components/FontSizeApplier.tsx`
- **수정 파일** `components/SettingsClient.tsx`, `app/globals.css`, `app/layout.tsx`

---

### #13 Design Inspiration 섹션 개선

- **요청** 작품 아래 이탤릭 제목 삭제, 작가 홈페이지 URL 추가
- **구현**
  - 각 작품 이미지 아래 이탤릭 `<p>` 제목 태그 제거
  - 섹션 하단에 작가 홈페이지 링크 버튼 추가: `https://www.oliviaherrick.com`
- **수정 파일** `components/DesignInspirationSection.tsx`

---

### #14 저작권 푸터

- **요청** 더보기 페이지 하단에 저작권 표기 삽입
- **구현** 더보기 메뉴 최하단에 2줄 저작권 표기 추가
  ```
  © 2026-04-10   Made by Brian Sungwook Jung
  Powered by Claude AI (Anthropic)
  ```
- **수정 파일** `app/(app)/more/page.tsx`

---

### #15 제안 페이지 타이틀 변경

- **요청** "제안 게시판" → "제안"으로 축약
- **구현** 페이지 헤더 h1 및 더보기 메뉴 label 변경
- **수정 파일** `components/SuggestionsClient.tsx`, `app/(app)/more/page.tsx`

---

### #16 해결 버튼 텍스트 변경

- **요청** 미해결 상태의 버튼 텍스트 "해결됨?" → "해결?"
- **구현** 조건부 텍스트 렌더링 수정 (`resolved` 상태 → "해결됨", 그 외 → "해결?")
- **수정 파일** `components/SuggestionsClient.tsx`

---

### #17 Admin 전체 콘텐츠 삭제 권한

- **요청** 모든 게시물(제안, 투표, 댓글)에 admin 삭제 권한 부여
- **구현**

  | 대상 | UI | API |
  |------|----|-----|
  | 제안 | 각 카드 하단 "🗑 제안 삭제" 버튼 (admin 전용) | `DELETE /api/suggestions/[id]` |
  | 투표 | 투표 카드 우측 "🗑" 버튼 (admin 전용) | `DELETE /api/votes/[id]` |
  | 제안 댓글 | 댓글 옆 "삭제" 버튼 (admin 또는 본인) | `DELETE /api/suggestions/comments/[commentId]` |

- **신규 파일** `app/api/suggestions/[id]/route.ts`, `app/api/votes/[id]/route.ts`, `app/api/suggestions/comments/[commentId]/route.ts`
- **수정 파일** `components/SuggestionsClient.tsx`, `components/VotesClient.tsx`

---

### #18 멤버 목록 임시 숨김

- **요청** 방수진·문지연·최유미 — DB에는 유지하되 멤버 소개 화면에서만 숨김 (추후 재초대 예정)
- **구현** `getMembers()` 쿼리에 `.neq('name', '방수진').neq('name', '문지연').neq('name', '최유미')` 필터 추가
- **복구 방법** 해당 `.neq()` 3줄 제거 시 즉시 복구
- **수정 파일** `app/(app)/members/page.tsx`

---

### #19 홈화면 진행 중인 투표 섹션

- **요청** 투표가 생기면 홈화면에서도 바로 확인할 수 있도록
- **구현**
  - `getData()`에 투표 쿼리 추가: 마감일이 오늘 이후이거나 마감일이 없는 투표만 최대 3개 조회
  - "다음 일정"과 "채팅" 섹션 사이에 "🗳️ 진행 중인 투표" 섹션 표시
  - 각 항목에 D-Day 배지 표시 (`D-3`, `D-Day` 등), 클릭 시 투표 페이지 이동
  - 진행 중인 투표가 없으면 섹션 자체 미표시
- **수정 파일** `app/(app)/page.tsx`

---

### #20 채팅 @멘션 기능

- **요청** 채팅에서 @이름을 입력하면 해당 멤버에게 알림이 가도록
- **구현 — 4단계**

  **① 자동완성 (입력창)**
  - 채팅 입력창에서 `@` 입력 시 멤버 목록 드롭다운 자동 표시
  - 이름·닉네임으로 실시간 필터링 (최대 5명)
  - 멤버 선택 시 `@이름 ` 텍스트 자동 삽입, 커서 위치 정확하게 이동

  **② 하이라이트 (메시지 렌더링)**
  - 메시지 본문 내 `@이름` 패턴을 라벤더(`#C4B5FD`) 굵은 텍스트로 강조 표시
  - 내 메시지(보라 배경), 상대방 메시지(흰 배경) 모두 적용

  **③ 알림 저장 (서버)**
  - 메시지 전송 시 서버에서 `@이름` 패턴 파싱
  - 이름·닉네임 일치하는 유저 조회 → `mention_notifications` 테이블에 저장
  - 자기 자신 멘션은 알림 생성 안 함

  **④ 홈화면 알림 표시 + 읽음 처리**
  - 홈화면 최상단에 "💬 새 멘션" 섹션 표시 (보라색 배경 카드)
  - 발신자 이름, 메시지 미리보기, 채팅방 이름 표시
  - 카드 클릭 시 해당 채팅방으로 이동
  - 채팅방 입장 시 그 방의 멘션 알림 자동 읽음 처리 (`is_read = true`)

- **신규 DB** `mention_notifications` 테이블 (`supabase/mention_notifications_migration.sql`)
- **신규 API** `GET/PATCH /api/notifications/mentions`
- **수정 파일** `components/chat/MessageInput.tsx`, `components/chat/MessageItem.tsx`, `components/chat/ChatRoomClient.tsx`, `app/(app)/chat/[roomId]/page.tsx`, `app/api/chat/[roomId]/messages/route.ts`, `app/(app)/page.tsx`

---

## DB 마이그레이션 목록

> Supabase 대시보드 → SQL Editor에서 아래 파일의 내용을 실행하세요.

| 파일 경로 | 테이블 | 실행 상태 |
|-----------|--------|---------|
| `supabase/suggestion_comments_migration.sql` | `suggestion_comments` | ✅ 완료 |
| `supabase/message_reactions_migration.sql` | `message_reactions` | ✅ 완료 |
| `supabase/mention_notifications_migration.sql` | `mention_notifications` | ✅ 완료 |

---

## 신규 생성 파일 목록

| 파일 | 용도 |
|------|------|
| `components/Toast.tsx` | 토스트 알림 UI 컴포넌트 |
| `components/FontSizeApplier.tsx` | 앱 로드 시 글씨 크기 설정 적용 |
| `app/api/chat/[roomId]/reactions/route.ts` | 채팅방 이모티콘 반응 일괄 조회 |
| `app/api/chat/[roomId]/messages/[messageId]/reactions/route.ts` | 이모티콘 반응 토글 |
| `app/api/chat/[roomId]/messages/[messageId]/route.ts` | 메시지 수정·삭제 |
| `app/api/suggestions/[id]/route.ts` | 제안 삭제 |
| `app/api/suggestions/[id]/resolve/route.ts` | 제안 해결 상태 토글 |
| `app/api/suggestions/[id]/comments/route.ts` | 제안 댓글 조회·등록 |
| `app/api/suggestions/comments/[commentId]/route.ts` | 댓글 삭제 |
| `app/api/votes/[id]/route.ts` | 투표 삭제 |
| `app/api/notifications/mentions/route.ts` | 멘션 알림 조회·읽음 처리 |
| `supabase/suggestion_comments_migration.sql` | DB 마이그레이션 |
| `supabase/message_reactions_migration.sql` | DB 마이그레이션 |
| `supabase/mention_notifications_migration.sql` | DB 마이그레이션 |

---

## 하단 네비게이션 컬러 현황

> 이미 작가 팔레트로 적용되어 있었습니다. (변경 없음 ✅)

| 탭 | 컬러 이름 | 코드 |
|----|----------|------|
| 홈 | Coral | `#D86040` |
| 채팅 | Teal-Blue | `#2880A0` |
| 캘린더 | Purple | `#7B6FC4` |
| 더보기 | Gold | `#C49030` |

---

*본 문서는 QA 팀 검토 및 배포 후 테스트 확인 용도로 작성되었습니다.*
*배포 URL: https://aisurvival.vercel.app*
