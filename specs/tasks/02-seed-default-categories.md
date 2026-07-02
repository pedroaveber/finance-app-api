# Task 02: Seed — Categorias Default

## Objetivo

Criar script de seed que insere as categorias default (sem `user_id` = null) no banco.

## Despesas

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

## Receitas

| Categoria | Ícone |
|-----------|-------|
| Salário | Briefcase |
| Freela | Code |
| Investimentos | TrendingUp |
| Outros | Plus |

## Arquivo

- `src/database/drizzle/seed/categories.ts`

## Regras

- Inserir apenas se não existirem (idempotente)
- `type` = "expense" para despesas, "income" para receitas
- `user_id` = null (categorias default, visíveis a todos os usuários)
- Não definir `color` — campo removido
