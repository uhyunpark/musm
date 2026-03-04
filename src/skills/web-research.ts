import type { Type } from '@google/genai'
import type { Skill } from './types.ts'
import { fetchUrlTool } from './fetch-url.ts'
import { searchBook } from '../books.ts'

export const webResearchSkill: Skill = {
  name: 'web-research',
  description: 'Fetch web pages and search for books',
  triggers: ['http', 'https', 'url', '기사', '아티클', '책', 'book', '검색'],
  tools: [
    fetchUrlTool,
    {
      declaration: {
        name: 'search_book',
        description: 'Search for books using Google Books API.',
        parameters: {
          type: 'OBJECT' as Type,
          properties: {
            query: {
              type: 'STRING' as Type,
              description: 'Search query for the book',
            },
          },
          required: ['query'],
        },
      },
      async execute(args) {
        const results = await searchBook(args.query as string)
        return { results }
      },
    },
  ],
}
