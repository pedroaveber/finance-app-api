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

export const invoiceItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
  installment: z.string().nullable(),
  suggestedCategory: z.string().nullable(),
})

export type CreditCardInvoiceItem = z.infer<typeof invoiceItemSchema>

export type ParseCreditCardInvoiceResponse = {
  items: CreditCardInvoiceItem[]
}

export type ParseCreditCardInvoiceParams = {
  pdfBuffer: Buffer
  availableCategories: string[]
  userId: string
  lastTransactionsExample?: {
    description: string
    categoryName: string
    categoryId: string
  }[]
}

export async function parseCreditCardInvoice({
  pdfBuffer,
  availableCategories,
  userId,
  lastTransactionsExample,
}: ParseCreditCardInvoiceParams): Promise<ParseCreditCardInvoiceResponse> {
  const startTime = performance.now()

  try {
    const { output, usage } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          items: z.array(invoiceItemSchema),
        }),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a credit card invoice analyzer for a personal finance app.

Analyze the attached credit card invoice PDF and list all purchases.

For each purchase, extract:

1. description: A short, clear description of what was purchased (in Portuguese if possible)
2. amount: The total amount paid as a number (e.g., 150.00). When a purchase was made in a foreign currency, include the IOF (Imposto sobre Operações Financeiras) value in the total amount.
3. installment: If the purchase is an installment (parcelada), return the current installment in the format "X/Y" (e.g., "2/12" for the second of twelve installments). Return null if it's a single payment.
4. suggestedCategory: Pick the EXACT category name from the list below that best matches this purchase. Be specific — prefer a narrower category (e.g., "Gás" over "Utilidades"). Return null only if absolutely nothing fits.

Use the user's recent transactions below as reference for which categories similar purchases were assigned to in the past. This helps ensure consistency with the user's existing categorization patterns.

Available categories: ${JSON.stringify(availableCategories)}

${
  lastTransactionsExample && lastTransactionsExample.length > 0
    ? `Recent user transactions (description → category):
${lastTransactionsExample.map((t) => `- "${t.description}" → ${t.categoryName}`).join('\n')}`
    : ''
}`,
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
      route: 'import-credit-card-invoice',
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      durationMs: Math.round(performance.now() - startTime),
    })

    return output
  } catch (err) {
    console.log(err)
    throw new BadRequestException(
      'Não foi possível processar a fatura no momento',
    )
  }
}
