const MAX_MESSAGE_LENGTH = 4096

export function parseTelegramUpdate(body: unknown): {
  chatId: number
  text: string
  messageId: number
} | null {
  const update = body as Record<string, unknown>
  const message = update.message as Record<string, unknown> | undefined
  if (!message) return null

  const chatId = (message.chat as Record<string, unknown>)?.id as
    | number
    | undefined
  const text = message.text as string | undefined
  const messageId = message.message_id as number | undefined

  if (!chatId || !text || !messageId) return null

  return { chatId, text, messageId }
}

export async function sendTypingAction(
  token: string,
  chatId: number
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  })
}

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string
): Promise<void> {
  if (!text.trim()) {
    text = '(빈 응답)'
  }

  const chunks: string[] = []
  for (let i = 0; i < text.length; i += MAX_MESSAGE_LENGTH) {
    chunks.push(text.slice(i, i + MAX_MESSAGE_LENGTH))
  }

  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
      }),
    })
  }
}
