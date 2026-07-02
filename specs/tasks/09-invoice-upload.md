# Task 09: Invoice Upload (Fatura)

## Objetivo

Implementar upload de fatura em PDF com extração de dados via Gemini.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/credit-cards/:cardId/invoices/upload` | Upload PDF → extrai dados com Gemini |
| POST | `/credit-cards/:cardId/invoices/confirm` | Confirma/rejeita despesas extraídas |
| GET | `/credit-cards/:cardId/invoices/:period` | Histórico de uploads do período |

## Arquivos

- `src/http/routes/credit-cards/upload-invoice.ts`
- `src/http/routes/credit-cards/confirm-invoice.ts`
- `src/http/routes/credit-cards/get-invoice.ts`
- `src/lib/pdf.ts` — extração de texto do PDF
- `src/use-cases/extract-invoice.ts` — lógica de extração com Gemini
- `src/use-cases/confirm-invoice.ts` — lógica de confirmação em lote

## POST `/credit-cards/:cardId/invoices/upload`

- Content-Type: `multipart/form-data`
- Body: `file` (PDF da fatura)

**Validações:**
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

## POST `/credit-cards/:cardId/invoices/confirm`

**Payload:**
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

**Regras:**
- Cada transação aprovada vira um `Transaction` (vinculado ao cartão)
- Transações rejeitadas são marcadas como `rejected`
- Se o usuário informar `categoryId`, sobrescreve a categoria sugerida

## GET `/credit-cards/:cardId/invoices/:period`

- `period` = "YYYY-MM"
- Retorna histórico de uploads + suas transações pendentes para aquele cartão/mês

## Dependências

- `pdf-parse` (extrair texto do PDF)
- `ai` (Vercel AI SDK)
- `@google/generative-ai` (provider Gemini)
