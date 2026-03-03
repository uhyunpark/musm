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

**Request flow:** Telegram webhook → Hono router (`src/index.ts`) → `runAgent()` → Gemini Chat API with function calling → tool executor → Telegram reply.

**Agentic loop** (`src/agent.ts`): Creates a Gemini chat session with conversation history from KV, sends the user message, then loops while the model returns `functionCalls`. Each tool call is executed via `executeTool()` and results are sent back until the model produces a text response.

**Tool system** (`src/tools.ts`): `toolDeclarations` array defines Gemini FunctionDeclarations. `executeTool()` is a switch-based dispatcher. To add a new tool: add declaration to the array, add case to the switch.

**State in KV:**
- `soul:md` — system prompt, editable by the agent via `update_soul` tool
- `history:{chatId}` — conversation history per chat, capped at 20 turns

## Key Conventions

- All external API calls use raw `fetch` (no SDKs for Notion, Telegram, Google Books)
- Gemini SDK: `@google/genai` — `chat.getHistory()` is synchronous (not async)
- Telegram messages >4096 chars are auto-split in `sendTelegramMessage()`
- Tool parameters use Gemini's type enums (`'OBJECT' as Type`, `'STRING' as Type`)
- `soul.md` file in repo root is the reference template; runtime version lives in KV

## Secrets (via `bunx wrangler secret put`)

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `NOTION_API_KEY`, `NOTION_ARTICLES_DB_ID`, `NOTION_BOOKS_DB_ID`

## Wrangler Setup

KV namespace ID in `wrangler.toml` must be replaced with actual value from `bunx wrangler kv namespace create KV`. Webhook URL: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<SECRET>`
