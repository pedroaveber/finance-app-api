import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { creditCards } from './credit-cards'
import { pendingInvoiceTransactions } from './pending-invoice-transactions'

export const invoiceUploads = pgTable('invoice_uploads', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  creditCardId: text('credit_card_id')
    .notNull()
    .references(() => creditCards.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  fileHash: text('file_hash').notNull(),
  status: text('status', {
    enum: ['pending', 'confirmed', 'rejected'],
  }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const invoiceUploadsRelations = relations(
  invoiceUploads,
  ({ one, many }) => ({
    user: one(users, {
      fields: [invoiceUploads.userId],
      references: [users.id],
    }),
    creditCard: one(creditCards, {
      fields: [invoiceUploads.creditCardId],
      references: [creditCards.id],
    }),
    pendingTransactions: many(pendingInvoiceTransactions),
  }),
)
