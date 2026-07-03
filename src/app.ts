import { fastifyCors } from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import { fastifySwagger } from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from '@/env'
import { authRoutes } from '@/lib/auth'
import { authMiddleware } from './http/plugins/auth'
import { errorHandler } from './http/plugins/error-handler'
import { appRoutes } from './http/routes/app-routes'

const app = fastify({
  logger:
    env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : false,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, {
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})

app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

app.register(fastifySwagger, {
  transform: jsonSchemaTransform,
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Home Expenses API',
      description: 'API for managing personal home expenses',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Development server',
      },
    ],
  },
})

app.register(ScalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    theme: 'bluePlanet',
  },
})

app.setErrorHandler(errorHandler)

authRoutes(app)
authMiddleware(app)
appRoutes(app)

export { app }
