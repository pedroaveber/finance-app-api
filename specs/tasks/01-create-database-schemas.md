# Task 01: Create Drizzle Schemas

## Objetivo

Criar os schemas do Drizzle ORM para todas as tabelas do domínio.

## Tabelas

### `categories`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text (PK) | UUID |
| user_id | text (FK → users) | Nullable — null = default, preenchido = personalizada |
| name | text | Ex: "Alimentação" |
| type | text | "income" ou "expense" |
| icon | text | Nome do ícone (ex: "Utensils") |
| created_at | timestamp | |

### `transactions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text (PK) | UUID |
| user_id | text (FK → users) | |
| category_id | text (FK → categories) | |
| credit_card_id | text (FK → credit_cards) | Nullable — preenchido se veio de fatura |
| description | text | |
| amount | numeric(12,2) | Sempre positivo; type define se é receita/despesa |
| type | text | "income" ou "expense" |
| date | date | Data da transação |
| created_at | timestamp | |

### `credit_cards`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text (PK) | UUID |
| user_id | text (FK → users) | |
| name | text | Apelido (ex: "Nubank Ana") |
| bank | text | Banco (ex: "Nubank", "Inter") |
| closing_day | integer | Dia de fechamento (1-31) |
| payment_day | integer | Dia de pagamento (1-31) |
| created_at | timestamp | |
| updated_at | timestamp | |

### `invoice_uploads`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text (PK) | UUID |
| user_id | text (FK → users) | |
| credit_card_id | text (FK → credit_cards) | |
| period | text | "YYYY-MM" — mês de referência da fatura |
| file_hash | text | Hash SHA256 do PDF para detectar re-upload |
| status | text | "pending", "confirmed", "rejected" |
| created_at | timestamp | |

### `pending_invoice_transactions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text (PK) | UUID |
| invoice_upload_id | text (FK → invoice_uploads) | |
| description | text | Extraído pela AI |
| amount | numeric(12,2) | Extraído pela AI |
| date | date | Extraído pela AI |
| suggested_category_id | text (FK → categories) | Sugerido pela AI |
| category_id | text (FK → categories) | Nullable — preenchido se usuário alterar |
| status | text | "pending", "approved", "rejected" |
| created_at | timestamp | |

## Arquivos

- `src/database/drizzle/schemas/categories.ts`
- `src/database/drizzle/schemas/transactions.ts`
- `src/database/drizzle/schemas/credit-cards.ts`
- `src/database/drizzle/schemas/invoice-uploads.ts`
- `src/database/drizzle/schemas/pending-invoice-transactions.ts`
- Atualizar `src/database/drizzle/schemas/index.ts` para exportar todos

## Padrões

- Usar `pgTable` do drizzle-orm/pg-core
- Nomes das tabelas em snake_case
- Colunas com `camelCase` no TS → `snake_case` no banco (usar `casing: 'snake_case'` na conexão já configurada)
- FK com `references(() => table.column, { onDelete: 'cascade' })`
- `created_at` com `defaultNow()`
- `updated_at` com `defaultNow().$onUpdate(() => new Date())`
- UUIDs: `text('id').primaryKey().$defaultFn(() => crypto.randomUUID())`
