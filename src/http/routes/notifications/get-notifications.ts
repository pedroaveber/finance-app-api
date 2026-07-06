import { and, desc, eq, lt } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { notifications } from '@/database/drizzle/schemas'

const notificationSchema = z.object({
  id: z.string(),
  cursorId: z.number(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string().nullable(),
  data: z.unknown().nullable(),
  read: z.boolean(),
  createdAt: z.date(),
})

export const getNotifications: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/notifications',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'List notifications',
        operationId: 'listNotifications',
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20),
          cursor: z.coerce.number().int().optional(),
        }),
        response: {
          200: z.object({
            data: z.array(notificationSchema),
            nextCursor: z.number().nullable(),
            hasMore: z.boolean(),
          }),
        },
      },
    },
    async (request) => {
      const { limit, cursor } = request.query

      const rows = await db
        .select()
        .from(notifications)
        .where(
          cursor
            ? and(
                eq(notifications.userId, request.userId),
                lt(notifications.cursorId, cursor),
              )
            : eq(notifications.userId, request.userId),
        )
        .orderBy(desc(notifications.cursorId))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = data.length > 0 ? data[data.length - 1].cursorId : null

      return { data, nextCursor, hasMore }
    },
  )
}
