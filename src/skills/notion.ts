import type { Type } from '@google/genai'
import type { Skill } from './types.ts'
import {
  notionSearch,
  notionCreateDatabase,
  notionCreatePage,
  notionQueryDatabase,
} from '../notion-api.ts'

export const notionSkill: Skill = {
  name: 'notion',
  description: 'Search, create databases, create pages, and query Notion',
  triggers: ['notion', '노션', '저장', '기록', '데이터베이스', '페이지'],
  instructions: `Notion API 도구를 사용할 수 있습니다.
- notion_search로 기존 데이터베이스/페이지 검색
- notion_create_database로 새 데이터베이스 생성
- notion_create_page로 데이터베이스에 페이지 추가
- notion_query_database로 데이터베이스 조회
properties 파라미터는 Notion API 형식의 JSON 문자열입니다.`,
  tools: [
    {
      declaration: {
        name: 'notion_search',
        description:
          'Search Notion for pages and databases matching a query.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            query: {
              type: 'STRING' as Type,
              description: 'Search query string',
            },
          },
          required: ['query'],
        },
      },
      async execute(args, env) {
        return notionSearch(env.NOTION_API_KEY, args.query as string)
      },
    },
    {
      declaration: {
        name: 'notion_create_database',
        description:
          'Create a new database under the parent page in Notion.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            title: {
              type: 'STRING' as Type,
              description: 'Database title',
            },
            properties: {
              type: 'STRING' as Type,
              description:
                'JSON string of Notion property schemas (e.g. {"Name": {"title": {}}, "Tags": {"multi_select": {"options": []}}})',
            },
          },
          required: ['title', 'properties'],
        },
      },
      async execute(args, env) {
        const properties = JSON.parse(args.properties as string) as Record<
          string,
          unknown
        >
        const result = (await notionCreateDatabase(
          env.NOTION_API_KEY,
          env.NOTION_PAGE_ID,
          args.title as string,
          properties
        )) as { id: string; url: string }
        return { database_id: result.id, url: result.url }
      },
    },
    {
      declaration: {
        name: 'notion_create_page',
        description: 'Create a new page in a Notion database.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            database_id: {
              type: 'STRING' as Type,
              description: 'Target database ID',
            },
            properties: {
              type: 'STRING' as Type,
              description:
                'JSON string of Notion property values (e.g. {"Name": {"title": [{"text": {"content": "My Page"}}]}})',
            },
            cover_url: {
              type: 'STRING' as Type,
              description: 'Optional cover image URL',
            },
          },
          required: ['database_id', 'properties'],
        },
      },
      async execute(args, env) {
        const properties = JSON.parse(args.properties as string) as Record<
          string,
          unknown
        >
        const result = (await notionCreatePage(
          env.NOTION_API_KEY,
          args.database_id as string,
          properties,
          args.cover_url as string | undefined
        )) as { id: string; url: string }
        return { page_id: result.id, url: result.url }
      },
    },
    {
      declaration: {
        name: 'notion_query_database',
        description: 'Query a Notion database with optional filters.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            database_id: {
              type: 'STRING' as Type,
              description: 'Database ID to query',
            },
            filter: {
              type: 'STRING' as Type,
              description:
                'Optional JSON string of Notion filter object',
            },
          },
          required: ['database_id'],
        },
      },
      async execute(args, env) {
        const filter = args.filter
          ? (JSON.parse(args.filter as string) as unknown)
          : undefined
        return notionQueryDatabase(
          env.NOTION_API_KEY,
          args.database_id as string,
          filter
        )
      },
    },
  ],
}
