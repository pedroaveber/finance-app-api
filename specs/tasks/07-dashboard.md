# Task 07: Dashboard

## Objetivo

Implementar rota que retorna resumo financeiro do período.

## Rota

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard` | Resumo financeiro do período |

## Arquivo

- `src/http/routes/dashboard/get-dashboard.ts`
- `src/use-cases/dashboard.ts` (lógica de negócio)
- Registrar em `src/http/routes/app-routes.ts`

## GET `/dashboard`

**Query params:**
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

## Lógica (use-case)

- Agregar transações do usuário no período
- Calcular `totalIncome` (soma de `amount` onde `type = 'income'`)
- Calcular `totalExpenses` (soma de `amount` onde `type = 'expense'`)
- `balance = totalIncome - totalExpenses`
- `byCategory`: agrupar por categoria com total, porcentagem e contagem
- `byCard`: agrupar por cartão de crédito (apenas transações com `credit_card_id` preenchido)

## Observações

- Usar query SQL agregada (GROUP BY) — Drizzle queries com `sum`, `count`, etc.
- `percentage` é calculado sobre o total de despesas (para categorias) ou sobre o total de cada grupo
