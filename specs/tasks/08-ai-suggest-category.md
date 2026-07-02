# Task 08: AI — Sugestão de Categoria

## Objetivo

Integrar Gemini (via Vercel AI SDK) para sugerir categoria ao criar uma transação.

## Fluxo

1. Recebe `description` + `amount` do payload de criação de transação
2. Monta prompt: `"Categorize this expense: '{description}', R$ {amount}. Available categories: {lista de categorias do usuário}. Respond only with the category name."`
3. Retorna nome da categoria → resolve para `category_id`
4. Se `aiSuggest = true` e sem `categoryId`, a API chama o Gemini
5. O response inclui `suggestedCategory` para o front-end exibir ao usuário

## Arquivo

- `src/lib/ai.ts` — cliente Gemini + prompt helpers
- `src/use-cases/suggest-category.ts` — lógica de negócio

## Prompt

```
Categorize this expense: '{description}', R$ {amount}.
Available categories: {lista de categorias do usuário}.
Respond only with the category name.
```

## Regras

- Se a AI retornar um nome que não existe nas categorias do usuário, pode-se criar uma nova categoria dinamicamente (comportamento configurável)
- Se `aiSuggest = false` ou `categoryId` já foi informado, não chamar a AI

## Variáveis de ambiente

```env
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-2.0-flash
```
