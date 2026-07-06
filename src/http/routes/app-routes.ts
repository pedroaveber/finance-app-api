import type { FastifyInstance } from 'fastify'
import { getAiUsage } from './ai/get-ai-usage'
import { importBankSlip } from './ai/import-bank-slip'
import { importCreditCardInvoice } from './ai/import-credit-card-invoice'
import { checkCategory } from './categories/check-category'
import { createCategory } from './categories/create-category'
import { deleteCategory } from './categories/delete-category'
import { getCategories } from './categories/get-categories'
import { updateCategory } from './categories/update-category'
import { createCreditCard } from './credit-cards/create-credit-card'
import { deleteCreditCard } from './credit-cards/delete-credit-card'
import { getCreditCards } from './credit-cards/get-credit-cards'
import { updateCreditCard } from './credit-cards/update-credit-card'
import { getDashboard } from './dashboard/get-dashboard'
import { healthCheck } from './health/health-check'
import { getNotifications } from './notifications/get-notifications'
import { notificationStream } from './notifications/get-notifications-stream'
import { readNotification } from './notifications/read-notification'
import { createTransaction } from './transactions/create-transaction'
import { createTransactionBatch } from './transactions/create-transaction-batch'
import { deleteTransaction } from './transactions/delete-transaction'
import { getBatchTransaction } from './transactions/get-batch-transaction'
import { getTransactions } from './transactions/get-transactions'
import { updateTransaction } from './transactions/update-transaction'

export const appRoutes = (app: FastifyInstance) => {
  app.register(healthCheck)
  app.register(getCategories)
  app.register(checkCategory)
  app.register(createCategory)
  app.register(updateCategory)
  app.register(deleteCategory)
  app.register(getAiUsage)
  app.register(importBankSlip)
  app.register(importCreditCardInvoice)
  app.register(getCreditCards)
  app.register(createCreditCard)
  app.register(updateCreditCard)
  app.register(deleteCreditCard)
  app.register(getDashboard)
  app.register(getBatchTransaction)
  app.register(getTransactions)
  app.register(createTransaction)
  app.register(createTransactionBatch)
  app.register(updateTransaction)
  app.register(deleteTransaction)
  app.register(getNotifications)
  app.register(readNotification)
  app.register(notificationStream)
}
