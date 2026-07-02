import type { FastifyInstance } from 'fastify'
import { checkCategory } from './categories/check-category'
import { createCategory } from './categories/create-category'
import { deleteCategory } from './categories/delete-category'
import { getCategories } from './categories/get-categories'
import { updateCategory } from './categories/update-category'
import { createCreditCard } from './credit-cards/create-credit-card'
import { deleteCreditCard } from './credit-cards/delete-credit-card'
import { getCreditCards } from './credit-cards/get-credit-cards'
import { updateCreditCard } from './credit-cards/update-credit-card'
import { getDashboardRoute } from './dashboard/get-dashboard'
import { healthCheck } from './health/health-check'
import { createTransaction } from './transactions/create-transaction'
import { deleteTransaction } from './transactions/delete-transaction'
import { getTransactions } from './transactions/get-transactions'
import { updateTransaction } from './transactions/update-transaction'

export const appRoutes = (app: FastifyInstance) => {
  app.register(healthCheck)
  app.register(getCategories)
  app.register(checkCategory)
  app.register(createCategory)
  app.register(updateCategory)
  app.register(deleteCategory)
  app.register(getCreditCards)
  app.register(createCreditCard)
  app.register(updateCreditCard)
  app.register(deleteCreditCard)
  app.register(getDashboardRoute)
  app.register(getTransactions)
  app.register(createTransaction)
  app.register(updateTransaction)
  app.register(deleteTransaction)
}
