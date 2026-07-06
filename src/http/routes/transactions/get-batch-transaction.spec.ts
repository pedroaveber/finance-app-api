import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeBatchTransaction } from '@/test/factories/make-batch-transaction'

describe('Get Batch Transaction Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should get a batch transaction', async () => {
    const { cookie, userId } = await createSession()

    const batch = await makeBatchTransaction({ userId })

    const response = await request(app.server)
      .get(`/transactions/batch/${batch.id}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      id: batch.id,
      jobId: batch.jobId,
      fileHash: batch.fileHash,
      userId,
      status: batch.status,
    })
    expect(response.body).toHaveProperty('createdAt')
    expect(response.body).toHaveProperty('data')
  })

  it('should return 404 for non-existent batch', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/transactions/batch/non-existent-id')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(404)
  })

  it('should return 404 for another users batch', async () => {
    const { cookie } = await createSession()
    const { userId: otherUserId } = await createSession()

    const batch = await makeBatchTransaction({ userId: otherUserId })

    const response = await request(app.server)
      .get(`/transactions/batch/${batch.id}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(404)
  })
})
