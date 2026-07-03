import dayjs from 'dayjs'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { aiUsageLogs } from '@/database/drizzle/schemas'
import { BadRequestException } from '@/http/exceptions'

export const getAiUsage: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/ai/usage',
    {
      schema: {
        tags: ['AI'],
        summary: 'Get AI usage data for the authenticated user',
        querystring: z.object({
          startDate: z.iso.date().optional(),
          endDate: z.iso.date().optional(),
        }),
        response: {
          200: z.object({
            startDate: z.string(),
            endDate: z.string(),
            totals: z.object({
              totalInputTokens: z.number(),
              totalOutputTokens: z.number(),
              totalTokens: z.number(),
              totalCalls: z.number(),
            }),
            byRoute: z.array(
              z.object({
                route: z.string(),
                calls: z.number(),
                totalTokens: z.number(),
              }),
            ),
            recentLogs: z.array(
              z.object({
                id: z.string(),
                model: z.string(),
                route: z.string(),
                inputTokens: z.number(),
                outputTokens: z.number(),
                totalTokens: z.number(),
                durationMs: z.number().nullable(),
                createdAt: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.userId
      const { startDate: queryStartDate, endDate: queryEndDate } = request.query

      const endDate = queryEndDate ?? dayjs().format('YYYY-MM-DD')
      const startDate =
        queryStartDate ?? dayjs().subtract(30, 'days').format('YYYY-MM-DD')

      const differenceInDays = dayjs(endDate).diff(dayjs(startDate), 'days')

      if (differenceInDays > 90) {
        throw new BadRequestException('O período não pode exceder 90 dias')
      }

      const conditions = and(
        eq(aiUsageLogs.userId, userId),
        gte(aiUsageLogs.createdAt, new Date(startDate)),
        lte(aiUsageLogs.createdAt, new Date(`${endDate}T23:59:59.999Z`)),
      )

      const [totals] = await db
        .select({
          totalInputTokens: sql<number>`COALESCE(SUM(${aiUsageLogs.inputTokens}), 0)`,
          totalOutputTokens: sql<number>`COALESCE(SUM(${aiUsageLogs.outputTokens}), 0)`,
          totalTokens: sql<number>`COALESCE(SUM(${aiUsageLogs.totalTokens}), 0)`,
          totalCalls: sql<number>`COUNT(*)`,
        })
        .from(aiUsageLogs)
        .where(conditions)

      const byRoute = await db
        .select({
          route: aiUsageLogs.route,
          calls: sql<number>`COUNT(*)`,
          totalTokens: sql<number>`COALESCE(SUM(${aiUsageLogs.totalTokens}), 0)`,
        })
        .from(aiUsageLogs)
        .where(conditions)
        .groupBy(aiUsageLogs.route)
        .orderBy(aiUsageLogs.route)

      const recentLogs = await db
        .select({
          id: aiUsageLogs.id,
          model: aiUsageLogs.model,
          route: aiUsageLogs.route,
          inputTokens: aiUsageLogs.inputTokens,
          outputTokens: aiUsageLogs.outputTokens,
          totalTokens: aiUsageLogs.totalTokens,
          durationMs: aiUsageLogs.durationMs,
          createdAt: aiUsageLogs.createdAt,
        })
        .from(aiUsageLogs)
        .where(conditions)
        .orderBy(desc(aiUsageLogs.createdAt))
        .limit(20)

      return reply.status(200).send({
        startDate,
        endDate,
        totals: {
          totalInputTokens: Number(totals.totalInputTokens),
          totalOutputTokens: Number(totals.totalOutputTokens),
          totalTokens: Number(totals.totalTokens),
          totalCalls: Number(totals.totalCalls),
        },
        byRoute: byRoute.map((r) => ({
          route: r.route,
          calls: Number(r.calls),
          totalTokens: Number(r.totalTokens),
        })),
        recentLogs: recentLogs.map((l) => ({
          id: l.id,
          model: l.model,
          route: l.route,
          inputTokens: l.inputTokens,
          outputTokens: l.outputTokens,
          totalTokens: l.totalTokens,
          durationMs: l.durationMs,
          createdAt: l.createdAt.toISOString(),
        })),
      })
    },
  )
}
