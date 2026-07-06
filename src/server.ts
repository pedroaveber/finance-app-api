import './lib/otel'

import { app } from './app'
import { closeRedis } from './database/redis'
import { env } from './env'
import { aiUsageWorker } from './jobs/workers/ai-usage'
import { creditCardImportWorker } from './jobs/workers/credit-card-import'

const server = app

server
  .listen({
    port: env.PORT,
    host: env.HOST,
  })
  .then(() => {
    console.log(`🔥 HTTP Server Running on port `.concat(env.PORT.toString()))
  })

async function shutdown() {
  await aiUsageWorker.close()
  await creditCardImportWorker.close()
  await closeRedis()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
