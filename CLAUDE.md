# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Telegram personal assistant on Cloudflare Workers. Uses Gemini Flash for agentic tool-use with Notion as backend store. Korean language responses.

## Commands

```bash
bun run dev          # Local dev server (wrangler dev)
bun run deploy       # Deploy to Cloudflare Workers
bun run typecheck    # TypeScript check (tsc --noEmit)
```

No test framework is set up yet. Use `bun run typecheck` as the primary verification step.

## Architecture

**Request flow:** Telegram webhook → Hono router (`src/index.ts`) → allowlist check → `runAgent()` → Gemini Chat API with function calling → skill registry → Telegram reply (Markdown with fallback).

**Agentic loop** (`src/agent.ts`): Creates a Gemini chat session with conversation history from KV, sends the user message, then loops while the model returns `functionCalls` (max 10 turns). Tool calls execute in parallel via `Promise.allSettled()`. Typing indicator refreshes each iteration.

**Skill system** (`src/skills/`): Replaces the old monolithic `tools.ts`. Each skill groups related tools with metadata:

- `types.ts` — `Tool` and `Skill` interfaces
- `registry.ts` — `SkillRegistry` class (register, resolve, dispatch)
- `fetch-url.ts` — standalone URL fetcher with SSRF protection
- `notion.ts` — generic Notion API tools (search, create database, create page, query database)
- `web-research.ts` — fetch URLs and search books (Google Books API)
- `soul-management.ts` — update system prompt with version history

**Adding a new skill:**
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

**State in KV:**
- `soul:md` — system prompt, editable by the agent via `update_soul` tool
- `soul:md:prev` — previous version of soul for rollback
- `history:{chatId}` — conversation history per chat, capped at 20 turns, trimmed to start on user turn

## Key Conventions

- All external API calls use raw `fetch` (no SDKs for Notion, Telegram, Google Books)
- Gemini SDK: `@google/genai` — `chat.getHistory()` is synchronous (not async)
- Telegram messages >4096 chars are auto-split; sent with Markdown parse mode (plain text fallback on error)
- Tool parameters use Gemini's type enums (`'OBJECT' as Type`, `'STRING' as Type`)
- Dates use KST (UTC+9) for Korean user
- Tool errors are caught by the registry and returned to the model with a hint to try a different approach
- `DEFAULT_SOUL` constant in `soul.ts` is the reference template; runtime version lives in KV

## Secrets (via `bunx wrangler secret put`)

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `NOTION_API_KEY`, `NOTION_PAGE_ID`, `ALLOWED_CHAT_IDS`

## Wrangler Setup

KV namespace ID in `wrangler.toml` must be replaced with actual value from `bunx wrangler kv namespace create KV`. Webhook URL: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<SECRET>`
