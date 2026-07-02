# Task 05: CRUD Credit Cards

## Objetivo

Implementar rotas de CRUD para cartões de crédito.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/credit-cards` | Lista cartões do usuário |
| POST | `/credit-cards` | Cadastra cartão |
| PUT | `/credit-cards/:id` | Edita cartão |
| DELETE | `/credit-cards/:id` | Remove cartão (só se sem faturas vinculadas) |

## Arquivos

- `src/http/routes/credit-cards/get-credit-cards.ts`
- `src/http/routes/credit-cards/create-credit-card.ts`
- `src/http/routes/credit-cards/update-credit-card.ts`
- `src/http/routes/credit-cards/delete-credit-card.ts`
- Registrar em `src/http/routes/app-routes.ts`

## POST `/credit-cards`

**Payload:**
```json
{
  "name": "Nubank Ana",
  "bank": "Nubank",
  "closingDay": 3,
  "paymentDay": 10
}
```

- `user_id` = usuário logado

## DELETE `/credit-cards/:id`

- Só permite remover cartões do próprio usuário
- Verificar se existem faturas vinculadas — se sim, retornar erro

## Observações

- PUT permite alterar todos os campos
- `closingDay` e `paymentDay` devem ser inteiros entre 1 e 31
