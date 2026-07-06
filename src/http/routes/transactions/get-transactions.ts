import dayjs from 'dayjs'
import { and, between, count, desc, eq, sql } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { categories, transactions } from '@/database/drizzle/schemas'
import { BadRequestException } from '@/http/exceptions'

export const getTransactions: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/transactions',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'List transactions',
        operationId: 'getTransactions',
        querystring: z.object({
          startDate: z.iso.date(),
          endDate: z.iso.date(),
          type: z.enum(['income', 'expense']).optional(),
          categoryId: z.uuid().optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        }),
        response: {
          200: z.object({
            data: z.array(
              z.object({
                id: z.string(),
                description: z.string(),
                amount: z.number(),
                type: z.enum(['income', 'expense']),
                date: z.string(),
                category: z.object({
                  id: z.string(),
                  name: z.string(),
                }),
                creditCardId: z.string().nullable(),
                createdAt: z.date(),
              }),
            ),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            metadata: z.object({
              totalIncomes: z.number(),
              totalExpenses: z.number(),
              balance: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { startDate, endDate, type, categoryId, page, limit } =
        request.query

      const differenceInDays = dayjs(endDate).diff(dayjs(startDate), 'days')

      if (differenceInDays > 90) {
        throw new BadRequestException('O período não pode exceder 90 dias')
      }

      const where = [
        eq(transactions.userId, request.userId),
        between(transactions.date, startDate, endDate),
      ]

      if (type) where.push(eq(transactions.type, type))
      if (categoryId) where.push(eq(transactions.categoryId, categoryId))

      const offset = (page - 1) * limit

      const [rows, totalResult, aggregates] = await Promise.all([
        db
          .select({
            id: transactions.id,
            description: transactions.description,
            amount: transactions.amount,
            type: transactions.type,
            date: transactions.date,
            categoryId: transactions.categoryId,
            categoryName: categories.name,
            creditCardId: transactions.creditCardId,
            createdAt: transactions.createdAt,
          })
          .from(transactions)
          .leftJoin(categories, eq(transactions.categoryId, categories.id))
          .where(and(...where))
          .orderBy(desc(transactions.date))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(transactions)
          .where(and(...where)),
        db
          .select({
            type: transactions.type,
            total: sql<string>`sum(${transactions.amount})`,
          })
          .from(transactions)
          .where(and(...where))
          .groupBy(transactions.type),
      ])

      const totalIncomes = Number(
        aggregates.find((a) => a.type === 'income')?.total ?? 0,
      )
      const totalExpenses = Number(
        aggregates.find((a) => a.type === 'expense')?.total ?? 0,
      )

      const data = rows.map((row) => ({
        id: row.id,
        description: row.description,
        amount: Number(row.amount),
        type: row.type as 'income' | 'expense',
        date: row.date,
        category: {
          id: row.categoryId,
          name: row.categoryName || 'Categoria não cadastrada',
        },
        creditCardId: row.creditCardId,
        createdAt: row.createdAt,
      }))

      return reply.status(200).send({
        data,
        total: Number(totalResult[0].count),
        page,
        limit,
        metadata: {
          totalIncomes,
          totalExpenses,
          balance: totalIncomes - totalExpenses,
        },
      })
    },
  )
}
