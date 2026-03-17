# musm

MUch SiMplified personal assistant running on Cloudflare Workers. Uses Gemini Flash for agentic tool-use with Notion as the backend store. Responds in Korean.

## Features

- **Agentic loop** — Gemini chat with function calling, up to 10 tool-use turns per message
- **Notion integration** — search, create databases/pages, query databases
- **Web research** — fetch URLs (with SSRF protection) and search books via Google Books API
- **Self-modifying system prompt** — the agent can edit its own instructions ("soul") with version history
- **Conversation memory** — per-chat history stored in KV (last 20 turns)

## Setup

```bash
bun install
cp wrangler.toml.example wrangler.toml  # configure KV namespace ID
```

Set secrets:

```bash
bunx wrangler secret put TELEGRAM_BOT_TOKEN
bunx wrangler secret put TELEGRAM_WEBHOOK_SECRET
bunx wrangler secret put GEMINI_API_KEY
bunx wrangler secret put NOTION_API_KEY
bunx wrangler secret put NOTION_PAGE_ID
bunx wrangler secret put ALLOWED_CHAT_IDS
```

Register the Telegram webhook:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<SECRET>
```

## Development

```bash
bun run dev          # local dev server
bun run deploy       # deploy to Cloudflare Workers
bun run typecheck    # TypeScript check
```

## Architecture

```
Telegram webhook → Hono router → allowlist check → runAgent()
  → Gemini Chat API (function calling loop) → skill registry → Telegram reply
```

Skills live in `src/skills/`. Each skill bundles related tools with metadata and triggers. See `CLAUDE.md` for details on adding new skills.
