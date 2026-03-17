# CLAUDE.md

## Project

**musm** — Telegram personal assistant on Cloudflare Workers. Gemini Flash (`gemini-3-flash-preview`) with agentic tool-use, Notion backend, Korean responses.

## Commands

```bash
bun run dev          # Local dev (wrangler dev)
bun run deploy       # Deploy to CF Workers
bun run typecheck    # TypeScript check (tsc --noEmit)
```

No test framework yet. `bun run typecheck` is the primary check.

## Key Conventions

- **Always use `bun`** — never npm/yarn/pnpm
- Raw `fetch` for all external APIs (no SDKs for Notion, Telegram, Google Books)
- Gemini SDK: `@google/genai` — `chat.getHistory()` is synchronous
- Tool params use Gemini type enums (`'OBJECT' as Type`, `'STRING' as Type`)
- Dates in KST (UTC+9)

## Adding a Skill

```typescript
// src/skills/my-skill.ts
export const mySkill: Skill = {
  name: 'my-skill',
  description: '...',
  triggers: ['keyword1', 'keyword2'],
  tools: [{ declaration: {...}, execute(args, env) {...} }],
}
// Register in src/agent.ts: registry.register(mySkill)
```

## Secrets (via `bunx wrangler secret put`)

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `NOTION_API_KEY`, `NOTION_PAGE_ID`, `ALLOWED_CHAT_IDS`
