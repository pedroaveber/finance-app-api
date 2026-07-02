import { isNull } from 'drizzle-orm'
import { db } from '../connection'
import { categories } from '../schemas/categories'

const defaultCategories = {
  expense: [
    { name: 'Moradia', icon: 'Home' },
    { name: 'Alimentação', icon: 'Utensils' },
    { name: 'Transporte', icon: 'Car' },
    { name: 'Saúde', icon: 'Heart' },
    { name: 'Educação', icon: 'Book' },
    { name: 'Lazer', icon: 'Music' },
    { name: 'Assinaturas', icon: 'Repeat' },
    { name: 'Vestuário', icon: 'ShoppingBag' },
    { name: 'Utilidades', icon: 'Package' },
    { name: 'Luz', icon: 'Zap' },
    { name: 'Água', icon: 'Droplets' },
    { name: 'Gás', icon: 'Flame' },
    { name: 'Condomínio', icon: 'Building' },
    { name: 'Internet', icon: 'Wifi' },
    { name: 'Seguros', icon: 'Shield' },
    { name: 'Academia', icon: 'Dumbbell' },
    { name: 'Games', icon: 'Gamepad' },
    { name: 'Suplementos', icon: 'Pill' },
    { name: 'Contas Domésticas', icon: 'ClipboardList' },
  ],
  income: [
    { name: 'Salário', icon: 'Briefcase' },
    { name: 'Freela', icon: 'Code' },
    { name: 'Investimentos', icon: 'TrendingUp' },
    { name: 'Outros', icon: 'Plus' },
  ],
} as const

async function seedCategories() {
  const existing = await db
    .select({ name: categories.name, type: categories.type })
    .from(categories)
    .where(isNull(categories.userId))

  const existingKeys = new Set(existing.map((c) => `${c.type}:${c.name}`))

  const toInsert = []

  for (const [type, items] of Object.entries(defaultCategories)) {
    for (const item of items) {
      const key = `${type}:${item.name}`
      if (!existingKeys.has(key)) {
        toInsert.push({
          name: item.name,
          type: type as 'income' | 'expense',
          icon: item.icon,
        })
      }
    }
  }

  if (toInsert.length === 0) {
    console.log('No new categories to seed.')
    return
  }

  await db.insert(categories).values(toInsert)

  console.log(`Seeded ${toInsert.length} default categories.`)
}

seedCategories()
  .then(() => {
    process.exit()
  })
  .catch((error) => {
    console.error('Failed to seed categories:', error)
    process.exit(1)
  })
