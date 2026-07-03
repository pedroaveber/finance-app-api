import { createGoogle } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { env } from '@/env'
import { BadRequestException } from '@/http/exceptions'
import { logAiUsage } from './track-usage'

const MODEL = 'gemini-2.5-flash-lite'

const google = createGoogle({
  apiKey: env.GEMINI_API_KEY,
})

const model = google(MODEL)

export type ExistingCategory = {
  id: string
  name: string
  type: 'income' | 'expense'
}

export async function checkSimilarCategories(
  name: string,
  existingCategories: ExistingCategory[],
  userId: string,
): Promise<ExistingCategory[]> {
  if (existingCategories.length === 0) {
    return []
  }

  const startTime = performance.now()

  try {
    const { output, usage } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          similarIds: z.array(z.string()),
        }),
      }),
      prompt: `You are a category similarity checker for a personal finance app.

Given a proposed category name and a list of existing categories, find any existing categories that are SIMILAR to the proposed one.

Similarity includes:
- Synonyms or same meaning in different words (e.g., "Comida" and "Alimentação")
- Typos and spelling errors (e.g., "Comida" and "Comda")
- Very close in spelling (Levenshtein distance of 1-2)
- Same word in different languages

Return the IDs of existing categories that are similar. Return an empty array if none match.

Proposed category name: "${name}"

Existing categories:
${JSON.stringify(existingCategories.map((c) => ({ id: c.id, name: c.name })))}`,
    })

    await logAiUsage({
      userId,
      model: MODEL,
      route: 'check-category',
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      durationMs: Math.round(performance.now() - startTime),
    })

    const matchedIds = new Set(output.similarIds)
    return existingCategories.filter((c) => matchedIds.has(c.id))
  } catch {
    throw new BadRequestException('Serviço não disponível no momento')
  }
}
