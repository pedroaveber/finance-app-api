import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'

vi.mock('@/services/ai/check-similar-categories', () => ({
  checkSimilarCategories: vi.fn(),
}))

import { checkSimilarCategories } from '@/services/ai/check-similar-categories'

describe('Check Category Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return ok when no similar categories found', async () => {
    vi.mocked(checkSimilarCategories).mockResolvedValueOnce([])

    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/categories/check')
      .query({ name: 'UniqueCategory', type: 'expense' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      status: 'ok',
      similarCategories: [],
    })
  })

  it('should return warning when similar categories found', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({
      userId,
      name: 'Alimentação',
      type: 'expense',
    })

    vi.mocked(checkSimilarCategories).mockResolvedValueOnce([
      { id: category.id, name: 'Alimentação', type: 'expense' },
    ])

    const response = await request(app.server)
      .get('/categories/check')
      .query({ name: 'Comida', type: 'expense' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      status: 'warning',
      similarCategories: [
        { id: category.id, name: 'Alimentação', type: 'expense' },
      ],
    })
  })
})
