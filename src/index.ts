import { Hono } from 'hono'
import type { Env } from './types.ts'
import { parseTelegramUpdate, sendTelegramMessage } from './telegram.ts'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.text('OK'))

app.post('/webhook', async (c) => {
  const body = await c.req.json()
  const update = parseTelegramUpdate(body)
  if (!update) return c.text('OK')

  const { chatId, text } = update
  await sendTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, text)

  return c.text('OK')
})

export default app
