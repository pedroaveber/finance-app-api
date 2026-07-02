# Task 06: CRUD Transactions (sem AI)

## Objetivo

Implementar rotas de CRUD para transações. A sugestão de categoria via AI será feita em task separada.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/transactions` | Lista transações por período |
| POST | `/transactions` | Cria transação manual |
| PUT | `/transactions/:id` | Edita transação |
| DELETE | `/transactions/:id` | Remove transação |

## Arquivos

- `src/http/routes/transactions/get-transactions.ts`
- `src/http/routes/transactions/create-transaction.ts`
- `src/http/routes/transactions/update-transaction.ts`
- `src/http/routes/transactions/delete-transaction.ts`
- Registrar em `src/http/routes/app-routes.ts`

## GET `/transactions`

**Query params:**
- `startDate` (obrigatório) — "YYYY-MM-DD"
- `endDate` (obrigatório) — "YYYY-MM-DD" (máximo 90 dias entre startDate e endDate)
- `type` (opcional) — "income" | "expense"
- `categoryId` (opcional) — filtrar por categoria
- `page` (opcional) — paginação, default 1
- `limit` (opcional) — default 50

Retorna apenas transações do usuário logado, ordenadas por `date` DESC.

## POST `/transactions`

**Payload:**
```json
{
  "description": "string",
  "amount": 1234.56,
  "type": "income" | "expense",
  "date": "2026-07-15",
  "categoryId": "uuid",
  "aiSuggest": false
}
```

- Se `aiSuggest = true` e `categoryId` não informado, delegar para AI (task 08)
- Nesta task, implementar apenas o fluxo sem AI (`aiSuggest = false`)

## POST `/transactions` response

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

## Observações

- TODO: campos de data devem ser validados com Zod (coerce)
- `amount` deve ser sempre positivo (o `type` define se é receita/despesa)
