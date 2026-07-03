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

export type ParseBankSlipResponse = {
  amount: number
  dueDate: string
  description: string
  suggestedCategory: string | null
}

export async function parseBankSlip(
  pdfBuffer: Buffer,
  availableCategories: string[],
  userId: string,
): Promise<ParseBankSlipResponse> {
  const startTime = performance.now()

  try {
    const { output, usage } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          amount: z.number(),
          dueDate: z.string(),
          description: z.string(),
          suggestedCategory: z.string().nullable(),
        }),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a bank slip analyzer for a personal finance app.

Analyze the attached bank slip PDF and extract:

1. amount: The payment value as a number (e.g., 150.00)
2. dueDate: The due date in ISO format (YYYY-MM-DD)
3. description: A short description of what this expense is for
4. suggestedCategory: Pick the EXACT category name from the list below that best matches this expense. Be specific — prefer a narrower category (e.g., "Gás" over "Utilidades"). Return null only if absolutely nothing fits.

Available categories: ${JSON.stringify(availableCategories)}`,
            },
            {
              type: 'file',
              data: pdfBuffer,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    })

    await logAiUsage({
      userId,
      model: MODEL,
      route: 'import-bank-slip',
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      durationMs: Math.round(performance.now() - startTime),
    })

    return output
  } catch {
    throw new BadRequestException(
      'Não foi possível processar o boleto no momento',
    )
  }
}
