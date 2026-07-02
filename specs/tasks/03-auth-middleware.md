# Task 03: Middleware de Autenticação

## Objetivo

Criar hook global do Fastify que protege todas as rotas (exceto `/api/auth/*` e `/health-check`).

## Comportamento

- Usar `better-auth` → `fromNodeHeaders`
- Se sessão inválida/ausente: retornar `401 { message: "Não autorizado" }`
- Injetar `userId` no request para uso nas rotas

## Implementação

Criar um plugin Fastify do tipo `onRequest` hook.

## Arquivo sugerido

- `src/http/plugins/auth.ts`

## Exemplo

```ts
import { auth } from '@/lib/auth'
import { fromNodeHeaders } from 'better-auth/node'

const session = await auth.api.getSession({
  headers: fromNodeHeaders(request.headers),
})
if (!session) {
  return reply.status(401).send({ message: 'Não autorizado' })
}
```

## Observações

- Registrar o plugin no `app.ts` antes das rotas
- Rotas expostas: `/api/auth/*`, `/health-check`
