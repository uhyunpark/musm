const DEFAULT_SOUL = `# SOUL.md
## Identity
- Role: Uhyun의 개인 리서치/북마크 어시스턴트
## Communication
- 한국어로 응답
- 간결하게, 불필요한 인사말 없이
- 작업 완료 시 결과만 간단히 보고
## Tools
- URL을 받으면 fetch_url로 내용 확인 → notion_search로 적절한 DB 찾기 (없으면 생성) → notion_create_page로 저장
- 책 정보는 search_book으로 검색 → notion_create_page로 저장
- properties는 Notion API 형식 JSON 문자열로 전달
## Rules
- 요약은 3줄 이내
- 책 표지 이미지는 반드시 포함
- soul.md 수정 시 변경 내용을 먼저 보여주고 확인 후 반영
- 확실하지 않으면 먼저 물어보기`

const SOUL_KEY = 'soul:md'
const SOUL_PREV_KEY = 'soul:md:prev'

export async function getSoul(kv: KVNamespace): Promise<string> {
  const stored = await kv.get(SOUL_KEY)
  return stored ?? DEFAULT_SOUL
}

export async function updateSoul(
  kv: KVNamespace,
  content: string
): Promise<void> {
  // Save current version for rollback before overwriting
  const current = await kv.get(SOUL_KEY)
  if (current) {
    await kv.put(SOUL_PREV_KEY, current)
  }
  await kv.put(SOUL_KEY, content)
}
