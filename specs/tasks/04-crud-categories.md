# Task 04: CRUD Categories

## Objetivo

Implementar rotas de CRUD para categorias.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Lista categorias (default + do usuário) |
| POST | `/categories` | Cria categoria personalizada |
| PUT | `/categories/:id` | Edita categoria personalizada |
| DELETE | `/categories/:id` | Remove categoria personalizada (só se sem transações) |

## Arquivos

- `src/http/routes/categories/get-categories.ts`
- `src/http/routes/categories/create-category.ts`
- `src/http/routes/categories/update-category.ts`
- `src/http/routes/categories/delete-category.ts`
- Registrar em `src/http/routes/app-routes.ts`

## GET `/categories`

**Query params:**
- `type` (opcional) — "income" | "expense"

Retorna categorias default (`user_id` null) + personalizadas do usuário logado.

## POST `/categories`

**Payload:**
```json
{
  "name": "string",
  "type": "income" | "expense",
  "icon": "string"
}
```

- `user_id` = usuário logado (personalizada)

## PUT `/categories/:id`

**Payload:** mesmo que POST (parcial)
- Só permite editar categorias do próprio usuário (não default)

## DELETE `/categories/:id`

- Só permite remover categorias do próprio usuário (não default)
- Verificar se existem transações vinculadas — se sim, retornar erro

## Validação

Usar Zod com `fastify-type-provider-zod` para validar payload e query params.
