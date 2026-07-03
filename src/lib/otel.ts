import { FastifyOtelInstrumentation } from '@fastify/otel'
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { env } from '@/env'

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

const options = {
  url: env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  compression: CompressionAlgorithm.GZIP,
}
const metricExporter = new OTLPMetricExporter(options)

const traceExporter = new OTLPTraceExporter(options)

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  // exporter: new ConsoleMetricExporter(),
  exportIntervalMillis: Number(env.OTEL_METRIC_EXPORT_INTERVAL),
  exportTimeoutMillis: Number(env.OTEL_METRIC_EXPORT_TIMEOUT),
})

const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
  registerOnInitialization: true,
})
const sdk = new NodeSDK({
  metricReader,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({}),
    fastifyOtelInstrumentation,
  ],
})

process.on('beforeExit', async () => {
  await sdk.shutdown()
})

sdk.start()
