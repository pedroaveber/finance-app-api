import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  route: text('route').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageLogs.userId],
    references: [users.id],
  }),
}))
