# Home Expenses API — Specs

## Stack (existente)

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Fastify 5 |
| Validação | Zod (via `fastify-type-provider-zod`) |
| ORM | Drizzle ORM + PostgreSQL |
| Auth | Better Auth (email/senha + Google OAuth) |
| Migrations | Drizzle Kit |
| Linter | Biome |
| Build | tsup |
| Docs | Scalar API Reference (`/docs`) |
| Container | Docker Compose (Postgres) |

---

## 1. Domain Model

### Conceitos

- **User** — dono dos dados; autenticado via Better Auth
- **Category** — categoriza transações (default + personalizadas por usuário)
- **Transaction** — receita ou despesa individual (manual ou importada)
- **CreditCard** — cartão de crédito cadastrado pelo usuário
- **InvoiceUpload** — registro de um upload de fatura (1 por cartão/mês)
- **InvoiceTransaction** — despesa extraída da fatura, pendente de aprovação

### Regras de negócio

- Cada usuário vê apenas seus próprios dados
- Categorias default são criadas no seed para todos; usuário pode criar categorias personalizadas
- AI (Gemini via Vercel AI SDK) sugere categoria ao criar despesa e ao extrair fatura; usuário confirma ou ajusta
- Upload de fatura: 1 por cartão/mês (chave única: `userId + cardId + YYYY-MM`)
- Fatura extraída retorna lista de despesas "pendentes"; usuário confirma em lote
- Dashboard mensal: soma receitas - soma despesas + agrupamento por categoria

---

## 2. Database Schema

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

---

## 3. API Endpoints

Todas as rotas protegidas exigem `Authorization: Bearer <session_token>`.

### 3.1 Auth (delegado ao Better Auth)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/auth/*` | Sign-in, sign-up, verify email, reset password, session |

### 3.2 Categories

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Lista categorias (default + do usuário) |
| POST | `/categories` | Cria categoria personalizada |
| PUT | `/categories/:id` | Edita categoria personalizada |
| DELETE | `/categories/:id` | Remove categoria personalizada (só se sem transações) |

**GET `/categories` query params:**
- `type` (opcional) — "income" | "expense" | undefined (todos)

**POST `/categories` payload:**
```json
{
  "name": "string",
  "type": "income" | "expense",
  "icon": "string"
}
```

### 3.3 Transactions

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/transactions` | Lista transações do período |
| POST | `/transactions` | Cria transação manual (com sugestão de categoria via AI) |
| PUT | `/transactions/:id` | Edita transação |
| DELETE | `/transactions/:id` | Remove transação |

**GET `/transactions` query params:**
- `startDate` (obrigatório) — "YYYY-MM-DD"
- `endDate` (obrigatório) — "YYYY-MM-DD" (máximo 90 dias entre startDate e endDate)
- `type` (opcional) — "income" | "expense"
- `categoryId` (opcional) — filtrar por categoria
- `page` (opcional) — paginação, default 1
- `limit` (opcional) — default 50

**POST `/transactions` payload:**
```json
{
  "description": "string",
  "amount": 1234.56,
  "type": "income" | "expense",
  "date": "2026-07-15",
  "categoryId": "uuid | null (deixa a AI sugerir)",
  "aiSuggest": true
}
```

Quando `aiSuggest = true` e sem `categoryId`, a API chama o Gemini que retorna uma categoria sugerida. O retorno inclui `suggestedCategory` para o front-end exibir ao usuário. O usuário pode confirmar ou escolher outra categoria antes de enviar.

**POST `/transactions` response:**
```json
{
  "id": "uuid",
  "description": "string",
  "amount": 1234.56,
  "type": "expense",
  "date": "2026-07-15",
  "categoryId": "uuid",
  "category": {
    "name": "Alimentação",
    "icon": "Utensils"
  },
  "suggestedCategory": null
}
```

### 3.4 Credit Cards

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/credit-cards` | Lista cartões do usuário |
| POST | `/credit-cards` | Cadastra cartão |
| PUT | `/credit-cards/:id` | Edita cartão |
| DELETE | `/credit-cards/:id` | Remove cartão (só se sem faturas vinculadas) |

**POST `/credit-cards` payload:**
```json
{
  "name": "Nubank Ana",
  "bank": "Nubank",
  "closingDay": 3,
  "paymentDay": 10
}
```

### 3.5 Invoice Upload (Fatura)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/credit-cards/:cardId/invoices/upload` | Upload PDF → extrai dados com Gemini |
| POST | `/credit-cards/:cardId/invoices/confirm` | Confirma/rejeita despesas extraídas |
| GET | `/credit-cards/:cardId/invoices/:period` | Histórico de uploads do período |

**POST `/credit-cards/:cardId/invoices/upload`**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF da fatura)

Validações:
- Só aceita PDF
- Verifica hash do PDF; se já existe um upload no mesmo mês, retorna erro (em português)
- Chama Gemini: extrai `[{description, amount, date}]` e sugere categoria para cada item
- Salva em `invoice_uploads` (status: pending)
- Salva em `pending_invoice_transactions` (status: pending)

**Response:**
```json
{
  "uploadId": "uuid",
  "period": "2026-07",
  "transactions": [
    {
      "id": "uuid",
      "description": "Restaurante",
      "amount": 89.90,
      "date": "2026-07-10",
      "suggestedCategory": {
        "id": "uuid",
        "name": "Alimentação"
      }
    }
  ]
}
```

**POST `/credit-cards/:cardId/invoices/confirm` payload:**
```json
{
  "uploadId": "uuid",
  "transactions": [
    {
      "id": "uuid",
      "action": "approve" | "reject",
      "categoryId": "uuid | null (se approve, pode alterar categoria)"
    }
  ]
}
```

Ao confirmar: cada transação aprovada vira um `Transaction` (vinculado ao cartão). Se alguma for rejeitada, simplesmente marca como rejected.

### 3.6 Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard` | Resumo financeiro do período |

**GET `/dashboard` query params:**
- `startDate` (obrigatório) — "YYYY-MM-DD"
- `endDate` (obrigatório) — "YYYY-MM-DD" (máximo 90 dias entre startDate e endDate)

**Response:**
```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "totalIncome": 5000.00,
  "totalExpenses": 3200.00,
  "balance": 1800.00,
  "byCategory": [
    {
      "categoryId": "uuid",
      "categoryName": "Alimentação",
      "icon": "Utensils",
      "total": 890.00,
      "percentage": 27.81,
      "transactionCount": 12
    }
  ],
  "byCard": [
    {
      "cardId": "uuid",
      "cardName": "Nubank Ana",
      "total": 1200.00,
      "percentage": 37.50
    }
  ]
}
```

---

## 4. Categorias Default (Seed)

### Despesas
| Categoria | Ícone |
|-----------|-------|
| Moradia | Home |
| Alimentação | Utensils |
| Transporte | Car |
| Saúde | Heart |
| Educação | Book |
| Lazer | Music |
| Assinaturas | Repeat |
| Vestuário | ShoppingBag |
| Utilidades | Package |
| Luz | Zap |
| Água | Droplets |
| Gás | Flame |
| Condomínio | Building |
| Internet | Wifi |
| Seguros | Shield |
| Academia | Dumbbell |
| Games | Gamepad |
| Suplementos | Pill |
| Contas Domésticas | ClipboardList |

### Receitas
| Categoria | Ícone |
|-----------|-------|
| Salário | Briefcase |
| Freela | Code |
| Investimentos | TrendingUp |
| Outros | Plus |

---

## 5. AI Integration (Gemini)

### Fluxo: Sugestão de categoria em despesa manual

1. Recebe `description` + `amount`
2. Monta prompt: `"Categorize this expense: '{description}', R$ {amount}. Available categories: {lista de categorias do usuário}. Respond only with the category name."`
3. Retorna nome da categoria → resolve para `category_id`
4. Se o usuário configurou "AI pode criar categorias dinamicamente", a AI pode sugerir nome novo
5. Front-end exibe: "Categoria sugerida: Alimentação ✓ [Aceitar] [Trocar]"

### Fluxo: Extração de fatura PDF

1. Recebe PDF em buffer
2. Converte para texto (ex: `pdf-parse`)
3. Monta prompt: `"Extract all transactions from this credit card statement. Return a JSON array with: description, amount (number), date (YYYY-MM-DD). Also suggest a category for each from this list: {lista de categorias}. Response format: [{description, amount, date, suggested_category}]"`
4. Retorna array parseado
5. Salva como pendente

### Bibliotecas necessárias

- `ai` (Vercel AI SDK)
- `@google/generative-ai` (provider Gemini)
- `pdf-parse` (extrair texto do PDF)

---

## 6. Variáveis de ambiente (novas)

```env
# AI
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-2.0-flash
```

---

## 7. Diretrizes de implementação

### Estrutura de diretórios (src/)

```
src/
├── app.ts
├── server.ts
├── env/
│   └── index.ts
├── lib/
│   ├── auth.ts
│   ├── ai.ts              # Gemini client + prompt helpers
│   └── pdf.ts             # PDF text extraction
├── database/
│   └── drizzle/
│       ├── connection.ts
│       ├── schemas/
│       │   ├── index.ts
│       │   ├── auth.ts
│       │   ├── categories.ts
│       │   ├── transactions.ts
│       │   ├── credit-cards.ts
│       │   └── invoice-uploads.ts
│       └── seed/
│           └── categories.ts
├── http/
│   └── routes/
│       ├── app-routes.ts
│       ├── health/
│       │   └── health-check.ts
│       ├── categories/
│       │   ├── get-categories.ts
│       │   ├── create-category.ts
│       │   ├── update-category.ts
│       │   └── delete-category.ts
│       ├── transactions/
│       │   ├── get-transactions.ts
│       │   ├── create-transaction.ts
│       │   ├── update-transaction.ts
│       │   └── delete-transaction.ts
│       ├── credit-cards/
│       │   ├── get-credit-cards.ts
│       │   ├── create-credit-card.ts
│       │   ├── update-credit-card.ts
│       │   ├── delete-credit-card.ts
│       │   ├── upload-invoice.ts
│       │   ├── confirm-invoice.ts
│       │   └── get-invoice.ts
│       └── dashboard/
│           └── get-dashboard.ts
└── use-cases/             # Lógica de negócio
    ├── suggest-category.ts
    ├── extract-invoice.ts
    ├── confirm-invoice.ts
    └── dashboard.ts
```

### Padrões de código

- Nomes de arquivos: kebab-case
- Nomes de variáveis/funções: camelCase
- Nomes de tabelas: snake_case
- Rotas: kebab-case (`/credit-cards`, `/health-check`)
- Mensagens de erro: português
- Todo payload/response validado com Zod

### Middleware de autenticação

Todas as rotas (exceto `/api/auth/*` e `/health-check`) devem verificar sessão usando `better-auth` → `fromNodeHeaders`.

```ts
import { auth } from '@/lib/auth'
import { fromNodeHeaders } from 'better-auth/node'

const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
if (!session) throw reply.status(401).send({ message: 'Não autorizado' })
```

---

## 8. Ordem de implementação sugerida

1. **Schemas Drizzle** — `categories`, `transactions`, `credit_cards`, `invoice_uploads`, `pending_invoice_transactions`
2. **Seed** — categorias default
3. **CRUD Categories** — GET/POST/PUT/DELETE
4. **Middleware de auth** — proteger rotas
5. **CRUD Credit Cards**
6. **CRUD Transactions** — inclusão manual + sugestão de categoria
7. **Dashboard** — query agregada por período
8. **AI: suggest category** — integração Gemini
9. **Upload de fatura** — PDF + extração com Gemini + pending + confirm
