import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { db } from '@/database/drizzle/connection'
import { aiUsageLogs } from '@/database/drizzle/schemas'
import { createSession } from '@/test/create-session'

describe('GET /ai/usage', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return empty usage with default 30-day range', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/ai/usage')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.startDate).toBeDefined()
    expect(response.body.endDate).toBeDefined()
    expect(response.body).toMatchObject({
      totals: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCalls: 0,
      },
      byRoute: [],
      recentLogs: [],
    })
  })

  it('should return aggregated usage data', async () => {
    const { cookie, userId } = await createSession()

    await db.insert(aiUsageLogs).values([
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'import-bank-slip',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        durationMs: 1200,
      },
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'import-bank-slip',
        inputTokens: 200,
        outputTokens: 80,
        totalTokens: 280,
        durationMs: 900,
      },
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'check-category',
        inputTokens: 60,
        outputTokens: 20,
        totalTokens: 80,
        durationMs: 500,
      },
    ])

    const response = await request(app.server)
      .get('/ai/usage')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.totals).toMatchObject({
      totalInputTokens: 360,
      totalOutputTokens: 150,
      totalTokens: 510,
      totalCalls: 3,
    })

    expect(response.body.byRoute).toHaveLength(2)
    expect(response.body.byRoute).toContainEqual({
      route: 'check-category',
      calls: 1,
      totalTokens: 80,
    })
    expect(response.body.byRoute).toContainEqual({
      route: 'import-bank-slip',
      calls: 2,
      totalTokens: 430,
    })

    expect(response.body.recentLogs).toHaveLength(3)
    expect(response.body.recentLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          model: 'gemini-2.5-flash-lite',
          route: 'check-category',
          inputTokens: 60,
          outputTokens: 20,
          totalTokens: 80,
          durationMs: 500,
        }),
        expect.objectContaining({
          model: 'gemini-2.5-flash-lite',
          route: 'import-bank-slip',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          durationMs: 1200,
        }),
        expect.objectContaining({
          model: 'gemini-2.5-flash-lite',
          route: 'import-bank-slip',
          inputTokens: 200,
          outputTokens: 80,
          totalTokens: 280,
          durationMs: 900,
        }),
      ]),
    )
  })

  it('should not return another users usage data', async () => {
    const { userId } = await createSession()
    const { cookie: otherCookie } = await createSession()

    await db.insert(aiUsageLogs).values([
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'import-bank-slip',
        inputTokens: 500,
        outputTokens: 200,
        totalTokens: 700,
        durationMs: 1500,
      },
    ])

    const response = await request(app.server)
      .get('/ai/usage')
      .set('Cookie', otherCookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.totals.totalCalls).toEqual(0)
    expect(response.body.byRoute).toHaveLength(0)
    expect(response.body.recentLogs).toHaveLength(0)
  })

  it('should filter by date range', async () => {
    const { cookie, userId } = await createSession()

    await db.insert(aiUsageLogs).values([
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'import-bank-slip',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        durationMs: 1000,
        createdAt: new Date('2026-06-01'),
      },
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'check-category',
        inputTokens: 60,
        outputTokens: 20,
        totalTokens: 80,
        durationMs: 500,
        createdAt: new Date('2026-06-15'),
      },
      {
        userId,
        model: 'gemini-2.5-flash-lite',
        route: 'import-bank-slip',
        inputTokens: 200,
        outputTokens: 80,
        totalTokens: 280,
        durationMs: 900,
        createdAt: new Date('2026-07-01'),
      },
    ])

    const response = await request(app.server)
      .get('/ai/usage')
      .query({ startDate: '2026-06-10', endDate: '2026-06-30' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.totals).toMatchObject({
      totalCalls: 1,
      totalInputTokens: 60,
      totalOutputTokens: 20,
      totalTokens: 80,
    })
    expect(response.body.byRoute).toHaveLength(1)
    expect(response.body.recentLogs).toHaveLength(1)
    expect(response.body.recentLogs[0].route).toEqual('check-category')
  })

  it('should return 400 when range exceeds 90 days', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/ai/usage')
      .query({ startDate: '2026-01-01', endDate: '2026-07-01' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(400)
    expect(response.body.message).toEqual(
      'O período não pode exceder 90 dias',
    )
  })

  it('should default endDate to today when only startDate is provided', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/ai/usage')
      .query({ startDate: '2026-06-01' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.startDate).toEqual('2026-06-01')
    expect(response.body.endDate).toBeDefined()
  })

  it('should default startDate to 30 days ago when only endDate is provided', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/ai/usage')
      .query({ endDate: '2026-07-01' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.endDate).toEqual('2026-07-01')
    expect(response.body.startDate).toBeDefined()
  })

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/ai/usage')

    expect(response.statusCode).toEqual(401)
  })
})
