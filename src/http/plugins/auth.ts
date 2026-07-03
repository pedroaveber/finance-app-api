import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import { auth } from '@/lib/auth'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
}

export const authMiddleware = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    const { url } = request

    if (
      url.startsWith('/api/auth') ||
      url.startsWith('/docs') ||
      url.startsWith('/admin/queues') ||
      url === '/health-check'
    ) {
      return
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })

    if (!session) {
      return reply.status(401).send({ message: 'Não autorizado' })
    }

    request.userId = session.user.id
  })
}
