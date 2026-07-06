import { relations } from 'drizzle-orm'
import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { creditCards } from './credit-cards'

export const batchTransactionsStatusEnum = pgEnum(
  'batch_transactions_status_enum',
  ['awaiting_ai_analysis', 'failed', 'finished', 'awaiting_manual_approve'],
)

export const batchTransactions = pgTable('batch_transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobId: text('job_id').notNull(),
  creditCardId: text('credit_card_id').references(() => creditCards.id, {
    onDelete: 'cascade',
  }),
  fileHash: text('file_hash').notNull(),
  data: jsonb().$type<{
    items: {
      description: string
      amount: number
      installment: string | null
      suggestedCategory: { id: string; name: string } | null
    }[]
  }>(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  status: batchTransactionsStatusEnum()
    .default('awaiting_ai_analysis')
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export const batchTransactionsRelations = relations(
  batchTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [batchTransactions.userId],
      references: [users.id],
    }),
    creditCard: one(creditCards, {
      fields: [batchTransactions.creditCardId],
      references: [creditCards.id],
    }),
  }),
)
