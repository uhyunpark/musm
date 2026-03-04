import { GoogleGenAI } from '@google/genai'
import type { Env } from './types.ts'
import { getSoul } from './soul.ts'
import { loadHistory, saveHistory } from './history.ts'
import { sendTypingAction } from './telegram.ts'
import { SkillRegistry } from './skills/registry.ts'
import { notionSkill } from './skills/notion.ts'
import { webResearchSkill } from './skills/web-research.ts'
import { soulManagementSkill } from './skills/soul-management.ts'

const MAX_AGENT_TURNS = 10

function createRegistry(): SkillRegistry {
  const registry = new SkillRegistry()
  registry.register(notionSkill)
  registry.register(webResearchSkill)
  registry.register(soulManagementSkill)
  return registry
}

export async function runAgent(
  userMessage: string,
  chatId: number,
  env: Env
): Promise<string> {
  const registry = createRegistry()
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  const soul = await getSoul(env.KV)
  const history = await loadHistory(env.KV, chatId)

  const skills = registry.resolve(userMessage)
  const toolDeclarations = registry.getToolDeclarations(skills)

  const chat = ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: soul,
      tools: [{ functionDeclarations: toolDeclarations }],
    },
    history,
  })

  let response = await chat.sendMessage({ message: userMessage })
  let turns = 0

  while (response.functionCalls?.length) {
    turns++
    if (turns > MAX_AGENT_TURNS) {
      return '처리 단계가 너무 많아 중단했습니다. 요청을 더 간단하게 나눠서 다시 시도해주세요.'
    }

    // Refresh typing indicator before executing tools
    await sendTypingAction(env.TELEGRAM_BOT_TOKEN, chatId)

    // Execute all tool calls in parallel
    const toolResults = await Promise.allSettled(
      response.functionCalls.map((fc) =>
        registry.executeTool(
          fc.name!,
          (fc.args ?? {}) as Record<string, unknown>,
          env
        )
      )
    )

    const results = response.functionCalls.map((fc, i) => {
      const settled = toolResults[i]!
      const result =
        settled.status === 'fulfilled'
          ? settled.value
          : {
              error: settled.reason?.message ?? 'Unknown error',
              hint: '[Analyze the error and try a different approach.]',
            }
      return {
        functionResponse: {
          name: fc.name!,
          response: { result },
        },
      }
    })

    // Refresh typing indicator before LLM call
    await sendTypingAction(env.TELEGRAM_BOT_TOKEN, chatId)
    response = await chat.sendMessage({ message: results })
  }

  const allHistory = chat.getHistory()
  await saveHistory(env.KV, chatId, allHistory)
  return response.text ?? ''
}
