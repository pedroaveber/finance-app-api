import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { batchTransactions } from './batch-transactions'
import { invoiceUploads } from './invoice-uploads'
import { transactions } from './transactions'

export const creditCards = pgTable('credit_cards', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  bank: text('bank').notNull(),
  closingDay: integer('closing_day').notNull(),
  paymentDay: integer('payment_day').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  user: one(users, {
    fields: [creditCards.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  invoiceUploads: many(invoiceUploads),
  batchTransactions: many(batchTransactions),
}))
