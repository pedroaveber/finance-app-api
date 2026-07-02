import { FastifyOtelInstrumentation } from '@fastify/otel'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
} from '@opentelemetry/semantic-conventions'

const otelEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'home-expenses-api',
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({ url: `${otelEndpoint}/v1/traces` }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: `${otelEndpoint}/v1/metrics` }),
    exportIntervalMillis: 5000,
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new PinoInstrumentation(),
    new FastifyOtelInstrumentation({ registerOnInitialization: true }),
  ],
})

sdk.start()

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error)
})
