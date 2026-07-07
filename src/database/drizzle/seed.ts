import { reset } from 'drizzle-seed'
import { db } from './connection'
import * as schema from './schemas'
import { categories } from './schemas/categories'

const defaultCategories = {
  expense: [
    { name: 'Moradia' },
    { name: 'Alimentação' },
    { name: 'Transporte' },
    { name: 'Saúde' },
    { name: 'Educação' },
    { name: 'Lazer' },
    { name: 'Assinaturas' },
    { name: 'Vestuário' },
    { name: 'Utilidades' },
    { name: 'Luz' },
    { name: 'Água' },
    { name: 'Gás' },
    { name: 'Condomínio' },
    { name: 'Internet' },
    { name: 'Seguros' },
    { name: 'Academia' },
    { name: 'Games' },
    { name: 'Suplementos' },
    { name: 'Contas Domésticas' },
  ],
  income: [
    { name: 'Salário' },
    { name: 'Freela' },
    { name: 'Investimentos' },
    { name: 'Outros' },
  ],
} as const

async function main() {
  console.log('Resetting database...')
  await reset(db, schema)

  console.log('Inserting default categories...')
  for (const [type, items] of Object.entries(defaultCategories)) {
    await db.insert(categories).values(
      items.map((item) => ({
        name: item.name,
        type: type as 'income' | 'expense',
      })),
    )
  }
  const totalDefaults = Object.values(defaultCategories).flat().length
  console.log(`Inserted ${totalDefaults} default categories.`)

  console.log('Seed completed successfully!')
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
