import { relations } from 'drizzle-orm'
import { date, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { categories } from './categories'
import { invoiceUploads } from './invoice-uploads'

export const pendingInvoiceTransactions = pgTable(
  'pending_invoice_transactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    invoiceUploadId: text('invoice_upload_id')
      .notNull()
      .references(() => invoiceUploads.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    amountInCents: integer('amount_in_cents').notNull().default(0),
    date: date('date').notNull(),
    suggestedCategoryId: text('suggested_category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    categoryId: text('category_id').references(() => categories.id, {
      onDelete: 'cascade',
    }),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected'],
    }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
)

export const pendingInvoiceTransactionsRelations = relations(
  pendingInvoiceTransactions,
  ({ one }) => ({
    invoiceUpload: one(invoiceUploads, {
      fields: [pendingInvoiceTransactions.invoiceUploadId],
      references: [invoiceUploads.id],
    }),
    suggestedCategory: one(categories, {
      fields: [pendingInvoiceTransactions.suggestedCategoryId],
      references: [categories.id],
      relationName: 'suggestedCategory',
    }),
    category: one(categories, {
      fields: [pendingInvoiceTransactions.categoryId],
      references: [categories.id],
      relationName: 'category',
    }),
  }),
)
