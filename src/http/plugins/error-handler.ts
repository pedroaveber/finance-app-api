import type { FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'

export const errorHandler: FastifyInstance['errorHandler'] = (
  error,
  request,
  reply,
) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      code: 'E001',
      message: 'Requisição não está de acordo com o schema',
      details: {
        issues: error.validation.map(({ message }) => message).join(', '),
        method: request.method,
        url: request.url,
      },
    })
  }

  const err = error as { statusCode?: number; message: string; name: string }
  if (err.statusCode && err.statusCode < 500) {
    return reply.status(err.statusCode).send({
      code: `E${String(err.statusCode).padStart(3, '0')}`,
      message: err.message,
    })
  }

  switch (err.name) {
    case 'ConflictException':
      return reply.status(409).send({
        code: 'E002',
        message: err.message,
      })

    case 'ResourceNotFoundException':
      return reply.status(404).send({
        code: 'E003',
        message: err.message,
      })

    case 'BadRequestException':
      return reply.status(400).send({
        code: 'E004',
        message: err.message,
      })

    case 'UnauthorizedException':
      return reply.status(401).send({
        code: 'E005',
        message: err.message,
      })

    case 'ForbiddenException':
      return reply.status(403).send({
        code: 'E006',
        message: err.message,
      })

    default:
      console.log(err)
      return reply.status(500).send({
        code: 'E000',
        message: 'Erro interno do servidor',
      })
  }
}
