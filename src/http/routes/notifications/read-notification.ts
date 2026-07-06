import { and, eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { notifications } from '@/database/drizzle/schemas'

export const readNotification: FastifyPluginCallbackZod = (app) => {
  app.patch(
    '/notifications/:id/read',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        operationId: 'markNotificationRead',
        params: z.object({
          id: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, request.userId),
          ),
        )

      return reply.status(204).send(null)
    },
  )
}
