import { relations } from 'drizzle-orm'
import {
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { categories } from './categories'
import { creditCards } from './credit-cards'

export const transactions = pgTable('transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  creditCardId: text('credit_card_id').references(() => creditCards.id, {
    onDelete: 'cascade',
  }),
  description: text('description').notNull(),
  amountInCents: integer('amount_in_cents').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  date: date('date').notNull(),
  installment: jsonb('installment').$type<{
    current: number
    total: number
  } | null>(),
  nickname: text('nickname'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  creditCard: one(creditCards, {
    fields: [transactions.creditCardId],
    references: [creditCards.id],
  }),
}))
