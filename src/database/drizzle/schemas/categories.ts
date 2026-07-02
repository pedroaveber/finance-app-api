import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { pendingInvoiceTransactions } from './pending-invoice-transactions'
import { transactions } from './transactions'

export const categories = pgTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  suggestedPendingTransactions: many(pendingInvoiceTransactions, {
    relationName: 'suggestedCategory',
  }),
  pendingTransactions: many(pendingInvoiceTransactions, {
    relationName: 'category',
  }),
}))
