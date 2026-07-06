import dayjs from 'dayjs'
import { and, between, count, eq, isNotNull, sql } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import {
  categories,
  creditCards,
  transactions,
} from '@/database/drizzle/schemas'
import { BadRequestException } from '@/http/exceptions'

export const getDashboard: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/dashboard',
    {
      schema: {
        tags: ['Dashboard'],
        summary: 'Get financial summary for a period',
        operationId: 'getDashboard',
        querystring: z.object({
          startDate: z.iso.date(),
          endDate: z.iso.date(),
        }),
        response: {
          200: z.object({
            startDate: z.string(),
            endDate: z.string(),
            totalIncome: z.number(),
            totalExpenses: z.number(),
            balance: z.number(),
            byCategory: z.array(
              z.object({
                category: z.object({
                  id: z.string(),
                  name: z.string(),
                }),
                total: z.number(),
                percentage: z.number(),
                transactionCount: z.number(),
              }),
            ),
            byCard: z.array(
              z.object({
                cardId: z.string(),
                cardName: z.string(),
                total: z.number(),
                percentage: z.number(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { startDate, endDate } = request.query

      const differenceInDays = dayjs(endDate).diff(dayjs(startDate), 'days')

      if (differenceInDays > 90) {
        throw new BadRequestException('O período não pode exceder 90 dias')
      }

      const [incomeResult, expenseResult] = await Promise.all([
        db
          .select({
            total: sql<string>`coalesce(sum(${transactions.amountInCents}), '0')`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, request.userId),
              eq(transactions.type, 'income'),
              between(transactions.date, startDate, endDate),
            ),
          ),
        db
          .select({
            total: sql<string>`coalesce(sum(${transactions.amountInCents}), '0')`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, request.userId),
              eq(transactions.type, 'expense'),
              between(transactions.date, startDate, endDate),
            ),
          ),
      ])

      const totalIncome = Number(incomeResult[0].total)
      const totalExpenses = Number(expenseResult[0].total)
      const balance = totalIncome - totalExpenses

      const [byCategoryRows, byCardRows] = await Promise.all([
        db
          .select({
            id: categories.id,
            name: categories.name,
            total: sql<string>`sum(${transactions.amountInCents})`,
            transactionCount: count(),
          })
          .from(transactions)
          .innerJoin(categories, eq(transactions.categoryId, categories.id))
          .where(
            and(
              eq(transactions.userId, request.userId),
              eq(transactions.type, 'expense'),
              between(transactions.date, startDate, endDate),
            ),
          )
          .groupBy(categories.id, categories.name),
        db
          .select({
            cardId: transactions.creditCardId,
            cardName: creditCards.name,
            total: sql<string>`sum(${transactions.amountInCents})`,
          })
          .from(transactions)
          .innerJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
          .where(
            and(
              eq(transactions.userId, request.userId),
              eq(transactions.type, 'expense'),
              isNotNull(transactions.creditCardId),
              between(transactions.date, startDate, endDate),
            ),
          )
          .groupBy(transactions.creditCardId, creditCards.name),
      ])

      const byCategory = byCategoryRows.map((row) => ({
        category: {
          id: row.id,
          name: row.name,
        },
        total: Number(row.total),
        percentage:
          totalExpenses > 0
            ? Number(((Number(row.total) / totalExpenses) * 100).toFixed(2))
            : 0,
        transactionCount: Number(row.transactionCount),
      }))

      const byCard = byCardRows.map((row) => ({
        cardId: row.cardId as string,
        cardName: row.cardName as string,
        total: Number(row.total),
        percentage:
          totalExpenses > 0
            ? Number(((Number(row.total) / totalExpenses) * 100).toFixed(2))
            : 0,
      }))

      return reply.status(200).send({
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        balance,
        byCategory,
        byCard,
      })
    },
  )
}
