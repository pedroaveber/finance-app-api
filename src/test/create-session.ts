import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { auth } from '@/lib/auth'

type CreateSessionResult = {
  cookie: string
  userId: string
  user: typeof schema.users.$inferSelect
}

export async function createSession(): Promise<CreateSessionResult> {
  const email = `test-${Date.now()}-${faker.string.alphanumeric(8)}@test.com`
  const password = 'TestPass123!'

  const { user } = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: faker.person.fullName(),
    },
    headers: new Headers(),
  })

  await db
    .update(schema.users)
    .set({ emailVerified: true })
    .where(eq(schema.users.id, user.id))

  const signInResponse = await auth.api.signInEmail({
    body: { email, password },
    headers: new Headers(),
    asResponse: true,
  })

  const setCookie = signInResponse.headers.get('set-cookie')

  if (!setCookie) {
    throw new Error('No set-cookie header in sign-in response')
  }

  const cookie = setCookie.split(';')[0]

  return { cookie, userId: user.id, user }
}
