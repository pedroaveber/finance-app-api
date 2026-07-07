import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import { env } from '@/env'
import { db } from '../database/drizzle/connection'
import * as schema from '../database/drizzle/schemas'

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CLIENT_ORIGIN],
  advanced: {
    disableCSRFCheck: env.NODE_ENV !== 'production',
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      console.log('Send reset password email to', user.email, 'with url', url)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      if (env.NODE_ENV !== 'test') {
        console.log('Send verification email to', user.email, 'with url', url)
      }
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
})

export const authRoutes = async (app: FastifyInstance) => {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    schema: {
      tags: ['Auth'],
      summary: 'Authentication endpoints',
      description:
        'Sign-in, sign-up, session, email verification, password reset — gerenciado internamente pelo better-auth',
    },
    async handler(request, reply) {
      const url = new URL(
        request.url,
        `${request.protocol}://${request.hostname}`,
      )
      const headers = fromNodeHeaders(request.headers)

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })

      const response = await auth.handler(req)

      reply.status(response.status)
      for (const [key, value] of response.headers.entries()) {
        reply.header(key, value)
      }

      return reply.send(response.body ? await response.text() : null)
    },
  })
}
