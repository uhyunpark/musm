---
name: cf-ops
description: Cloudflare Workers operations — check deployment status, tail live logs, inspect KV data, and diagnose issues for the musm worker. Use this skill whenever the user asks about their worker's status, wants to see logs or errors, needs to debug why the bot isn't responding, or wants to inspect KV store contents. Also trigger when the user mentions "cloudflare", "worker status", "wrangler", "tail logs", "KV", or asks "is my bot up?" / "what happened?" / "any errors?"
---

# Cloudflare Workers Operations

Quick diagnostics and debugging for Cloudflare Workers via `wrangler` CLI.

## Prerequisites

All commands require `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set in the environment. These are stored in `/Users/uhyun/personal/musm/.env.local`. Load them before running any wrangler command:

```bash
export $(grep -v '^#' /Users/uhyun/personal/musm/.env.local | xargs)
```

If the env file is missing or the token is invalid, tell the user to create one at dash.cloudflare.com → My Profile → API Tokens.

## Important

- Always load `.env.local` first, then run wrangler via `bunx wrangler`
- Always pass `--cwd /Users/uhyun/personal/musm` so wrangler picks up `wrangler.toml`
- The worker name is `musm` and the KV namespace ID is `3909e474e9f44cdfaeaaa935fd9f4663`

## Commands Reference

### 1. Deployment Status

Quick check on what's currently deployed:

```bash
# Current production status
bunx wrangler deployments status --cwd /Users/uhyun/personal/musm

# Recent deployment history (last 10)
bunx wrangler deployments list --cwd /Users/uhyun/personal/musm
```

### 2. Live Tail Logs

Stream real-time logs from the worker. `wrangler tail` runs continuously, so always use a timeout. On macOS there's no `timeout` command — use `perl -e 'alarm N; exec @ARGV' --` as a portable alternative. Set the Bash tool's timeout parameter to a few seconds beyond the alarm.

```bash
# Tail all logs (run for 30 seconds, JSON format for parseability)
perl -e 'alarm 30; exec @ARGV' -- bunx wrangler tail musm --format json --cwd /Users/uhyun/personal/musm

# Errors only (most common debugging use case)
perl -e 'alarm 15; exec @ARGV' -- bunx wrangler tail musm --format json --status error --cwd /Users/uhyun/personal/musm

# Search for specific text in console.log output
perl -e 'alarm 30; exec @ARGV' -- bunx wrangler tail musm --format json --search "some keyword" --cwd /Users/uhyun/personal/musm
```

When presenting tail output to the user:
- Summarize the key events (requests, errors, console logs)
- Highlight any errors or exceptions prominently
- Show timestamps in KST (UTC+9) since the user is in Korea
- If there are no events during the tail window, say so — the worker might just be idle

### 3. KV Inspection

The KV namespace ID is `3909e474e9f44cdfaeaaa935fd9f4663`.

```bash
# List all keys (useful to see what's stored)
bunx wrangler kv key list --namespace-id 3909e474e9f44cdfaeaaa935fd9f4663 --cwd /Users/uhyun/personal/musm

# Read a specific key
bunx wrangler kv key get <key> --namespace-id 3909e474e9f44cdfaeaaa935fd9f4663 --cwd /Users/uhyun/personal/musm
```

Common keys to inspect:
- `soul:md` — the current system prompt (agent personality)
- `soul:md:prev` — previous version of the system prompt
- `history:<chatId>` — conversation history for a specific chat

When showing KV contents:
- For `soul:md`, display the full content (it's the agent's personality config)
- For `history:*` keys, summarize the conversation turns rather than dumping raw JSON
- Note the key count and approximate data stored

### 4. Quick Diagnostics

When the user asks "why isn't my bot working?" or "is my bot up?", run these in sequence:

1. **Check deployment status** — is something actually deployed?
2. **Check recent errors** — tail with `--status error` for 15 seconds
3. **Check KV** — is `soul:md` present? Are there recent history entries?

Present findings as a short summary with clear next steps if something looks wrong.

## Output Style

Keep output concise and actionable. The user is debugging, not reading a report. Lead with the answer: "Worker is up, last deployed 2 hours ago, no errors in the last 30s" or "Found 3 errors in the last 30s — all are timeout errors from the Gemini API."
