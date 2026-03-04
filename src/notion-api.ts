const NOTION_VERSION = '2022-06-28'
const NOTION_BASE = 'https://api.notion.com/v1'

function notionHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  }
}

async function notionFetch(
  apiKey: string,
  path: string,
  method: string,
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`${NOTION_BASE}${path}`, {
    method,
    headers: notionHeaders(apiKey),
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error: ${res.status} ${err}`)
  }

  return res.json()
}

export async function notionSearch(
  apiKey: string,
  query: string,
  filter?: string
): Promise<unknown> {
  const body: Record<string, unknown> = { query }
  if (filter) {
    body.filter = { value: filter, property: 'object' }
  }
  return notionFetch(apiKey, '/search', 'POST', body)
}

export async function notionCreateDatabase(
  apiKey: string,
  parentPageId: string,
  title: string,
  properties: Record<string, unknown>
): Promise<unknown> {
  return notionFetch(apiKey, '/databases', 'POST', {
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: title } }],
    properties,
  })
}

export async function notionCreatePage(
  apiKey: string,
  databaseId: string,
  properties: Record<string, unknown>,
  cover?: string
): Promise<unknown> {
  const body: Record<string, unknown> = {
    parent: { database_id: databaseId },
    properties,
  }
  if (cover) {
    body.cover = { type: 'external', external: { url: cover } }
  }
  return notionFetch(apiKey, '/pages', 'POST', body)
}

export async function notionQueryDatabase(
  apiKey: string,
  databaseId: string,
  filter?: unknown,
  sorts?: unknown
): Promise<unknown> {
  const body: Record<string, unknown> = {}
  if (filter) body.filter = filter
  if (sorts) body.sorts = sorts
  return notionFetch(apiKey, `/databases/${databaseId}/query`, 'POST', body)
}
