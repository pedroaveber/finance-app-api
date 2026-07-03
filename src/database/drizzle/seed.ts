import { randomBytes, scryptSync } from 'node:crypto'
import { isNull } from 'drizzle-orm'
import { reset, seed } from 'drizzle-seed'
import { db } from './connection'
import * as schema from './schemas'
import { categories } from './schemas/categories'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password.normalize('NFKC'), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  })
  return `${salt}:${key.toString('hex')}`
}

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
}

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

  const johnId = crypto.randomUUID()
  const passwordHash = hashPassword('senha123')

  console.log("Creating John's user and account...")
  await db.insert(schema.users).values({
    id: johnId,
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
  })

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    accountId: 'john@example.com',
    providerId: 'credential',
    userId: johnId,
    password: passwordHash,
  })

  const defaultCatIds = new Map(
    (
      await db
        .select({ name: categories.name, id: categories.id })
        .from(categories)
        .where(isNull(categories.userId))
    ).map((c) => [c.name, c.id]),
  )

  const johnCats = await db
    .insert(categories)
    .values([
      { name: 'Restaurante', type: 'expense', userId: johnId },
      { name: 'Mercado', type: 'expense', userId: johnId },
      { name: 'Combustível', type: 'expense', userId: johnId },
      { name: 'Streaming', type: 'expense', userId: johnId },
      { name: 'Academia', type: 'expense', userId: johnId },
      { name: 'Freela', type: 'income', userId: johnId },
    ])
    .returning({ id: categories.id, name: categories.name })

  const johnCatIds = new Map(johnCats.map((c) => [c.name, c.id]))

  const johnCards = await db
    .insert(schema.creditCards)
    .values([
      {
        userId: johnId,
        name: 'Nubank',
        bank: 'Nubank',
        closingDay: 15,
        paymentDay: 22,
      },
      {
        userId: johnId,
        name: 'Inter',
        bank: 'Inter',
        closingDay: 10,
        paymentDay: 18,
      },
    ])
    .returning({ id: schema.creditCards.id, name: schema.creditCards.name })

  const johnCardIds = new Map(johnCards.map((c) => [c.name, c.id]))

  console.log("Creating John's transactions...")
  await db.insert(schema.transactions).values([
    {
      userId: johnId,
      description: 'Salário Junho/2026',
      amount: '5500.00',
      type: 'income',
      date: '2026-06-05',
      categoryId: defaultCatIds.get('Salário')!,
    },
    {
      userId: johnId,
      description: 'Freela - Site institucional',
      amount: '2000.00',
      type: 'income',
      date: '2026-06-10',
      categoryId: johnCatIds.get('Freela')!,
    },
    {
      userId: johnId,
      description: 'Almoço no centro',
      amount: '45.00',
      type: 'expense',
      date: '2026-06-03',
      categoryId: johnCatIds.get('Restaurante')!,
    },
    {
      userId: johnId,
      description: 'Jantar Família',
      amount: '132.50',
      type: 'expense',
      date: '2026-06-10',
      categoryId: johnCatIds.get('Restaurante')!,
      creditCardId: johnCardIds.get('Nubank'),
    },
    {
      userId: johnId,
      description: 'Compras do mês',
      amount: '387.50',
      type: 'expense',
      date: '2026-06-07',
      categoryId: johnCatIds.get('Mercado')!,
      creditCardId: johnCardIds.get('Inter'),
    },
    {
      userId: johnId,
      description: 'Compras semanais',
      amount: '215.30',
      type: 'expense',
      date: '2026-06-14',
      categoryId: johnCatIds.get('Mercado')!,
    },
    {
      userId: johnId,
      description: 'Gasolina',
      amount: '187.00',
      type: 'expense',
      date: '2026-06-08',
      categoryId: johnCatIds.get('Combustível')!,
    },
    {
      userId: johnId,
      description: 'Gasolina',
      amount: '205.00',
      type: 'expense',
      date: '2026-06-15',
      categoryId: johnCatIds.get('Combustível')!,
      creditCardId: johnCardIds.get('Nubank'),
    },
    {
      userId: johnId,
      description: 'Netflix',
      amount: '55.90',
      type: 'expense',
      date: '2026-06-05',
      categoryId: johnCatIds.get('Streaming')!,
      creditCardId: johnCardIds.get('Nubank'),
    },
    {
      userId: johnId,
      description: 'Mensalidade',
      amount: '99.90',
      type: 'expense',
      date: '2026-06-01',
      categoryId: johnCatIds.get('Academia')!,
    },
    {
      userId: johnId,
      description: 'Conta de luz',
      amount: '156.80',
      type: 'expense',
      date: '2026-06-15',
      categoryId: defaultCatIds.get('Luz')!,
    },
    {
      userId: johnId,
      description: 'Internet',
      amount: '109.90',
      type: 'expense',
      date: '2026-06-10',
      categoryId: defaultCatIds.get('Internet')!,
    },
    {
      userId: johnId,
      description: 'Aluguel',
      amount: '1800.00',
      type: 'expense',
      date: '2026-06-01',
      categoryId: defaultCatIds.get('Moradia')!,
    },
    {
      userId: johnId,
      description: 'Salário Julho/2026',
      amount: '5500.00',
      type: 'income',
      date: '2026-07-05',
      categoryId: defaultCatIds.get('Salário')!,
    },
    {
      userId: johnId,
      description: 'Mensalidade',
      amount: '99.90',
      type: 'expense',
      date: '2026-07-01',
      categoryId: johnCatIds.get('Academia')!,
    },
    {
      userId: johnId,
      description: 'Netflix',
      amount: '55.90',
      type: 'expense',
      date: '2026-07-05',
      categoryId: johnCatIds.get('Streaming')!,
      creditCardId: johnCardIds.get('Nubank'),
    },
  ])

  console.log(
    'Seeding additional users with categories, credit cards, and transactions...',
  )
  await seed(db, schema, { seed: 42, count: 4 }).refine((funcs) => ({
    users: {
      columns: {
        name: funcs.fullName(),
        email: funcs.email(),
      },
      with: {
        categories: [
          { weight: 0.3, count: [2, 3] },
          { weight: 0.5, count: [4, 5] },
          { weight: 0.2, count: [6, 8] },
        ],
        creditCards: [
          { weight: 0.3, count: [1] },
          { weight: 0.5, count: [2] },
          { weight: 0.2, count: [3] },
        ],
        transactions: [
          { weight: 0.3, count: [15, 25] },
          { weight: 0.4, count: [30, 40] },
          { weight: 0.3, count: [50, 70] },
        ],
      },
    },
    categories: {
      columns: {
        name: funcs.valuesFromArray({
          values: [
            'Mercado',
            'Restaurante',
            'Farmácia',
            'Pet Shop',
            'Viagem',
            'Presente',
            'Streaming',
            'Cabeleireiro',
            'Estacionamento',
            'Pedágio',
            'Combustível',
            'Manutenção',
            'Curso',
            'Livro',
            'Doação',
          ],
        }),
      },
    },
    creditCards: {
      columns: {
        name: funcs.valuesFromArray({
          values: [
            'Visa Platinum',
            'Mastercard Gold',
            'Nubank',
            'Inter',
            'Santander',
            'Bradesco',
            'Itaú',
          ],
        }),
        bank: funcs.valuesFromArray({
          values: [
            'Nubank',
            'Inter',
            'Santander',
            'Bradesco',
            'Itaú',
            'Banco do Brasil',
            'Caixa',
          ],
        }),
        closingDay: funcs.int({ minValue: 1, maxValue: 28 }),
        paymentDay: funcs.int({ minValue: 1, maxValue: 28 }),
      },
    },
    transactions: {
      columns: {
        description: funcs.loremIpsum({ sentencesCount: 1 }),
        amount: funcs.number({ minValue: 10, maxValue: 5000, precision: 2 }),
        type: funcs.valuesFromArray({
          values: [
            { weight: 0.7, values: ['expense'] },
            { weight: 0.3, values: ['income'] },
          ],
        }),
        date: funcs.date({
          minDate: '2024-01-01',
          maxDate: '2026-07-03',
        }),
      },
    },
  }))

  console.log('Seed completed successfully!')
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
