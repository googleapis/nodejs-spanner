## Observability with OpenTelemetry

This Cloud Spanner client supports [OpenTelemetry Traces](https://opentelemetry.io/), which gives insight into the client internals and aids in debugging/troubleshooting production issues.

By default, the functionality is disabled. You shall need to add OpenTelemetry dependencies, and must configure and
enable OpenTelemetry with appropriate exporters at the startup of your application:

**Table of contents:**

* [Observability](#observability)
  * [Metrics](#metrics)
    * [Metrics Dependencies](#metrics-dependencies)
    * [Disabling Metrics](#disabling-metrics)
    * [Available Service Metrics](#available-service-metrics)
  * [Tracing](#tracing)
    * [OpenTelemetry Dependencies](#opentelemetry-dependencies)
    * [OpenTelemetry Configuration](#opentelemetry-configuration)
    * [SQL Statement span annotation](#sql-statement-span-annotation)
    * [OpenTelemetry gRCP instrumentation](#opentelemetry-grpc-instrumentation)
    * [Tracing Sample](#tracing-sample)

### Metrics

The spanner client emits service metrics to provide operational insight into the usage of the Spanner client. The metrics track the different operation requests made from the client, as well as the attempts made internally by the client to achieve this operation.

Each metric contains attributes with identifying information for the client connection, including:

Project
Instance
Database
Session

#### Metrics Dependencies

Add the following dependencies in your `package.json` or install them directly.
```javascript
// Required packages for Google Cloud metric definition and interaction
"@google-cloud/monitoring": "^5.0.0",
"@google-cloud/opentelemetry-resource-util": "^2.4.0",

// Required packages for Opentelemetry metrics
"@opentelemetry/api": "^1.9.0",
"@opentelemetry/core": "^2.0.0",
"@opentelemetry/resources": "^1.8.0",
"@opentelemetry/sdk-metrics": "^1.30.1",

// gRPC server interactions
"@grpc/grpc-js": "^1.13.2",
"google-gax": "^5.0.1-rc.0",
```
#### Disabling Metrics

By default, metrics are enabled, but they can be disabled by setting the environment variable `SPANNER_DISABLE_BUILTIN_METRICS` to `true`:
```bash
export SPANNER_DISABLE_BUILTIN_METRICS=true
```

Please note that if you are using the [Spanner Emulator](https://cloud.google.com/spanner/docs/emulator), the metrics will always be disabled regardless of the value of the environment variable flag.

#### Available Service Metrics

* `operation_latencies` - The total time until final operation success or failures, including retries and backoff.
* `operation_count` - The number of operations made.
* `attempt latencies` - The time an individual attempt took.
* `attempt_count` - The number of attempts made.
* `gfe_latencies` - The latency between Google's network receiving an RPC and reading back the first byte of the response.
* `gfe_connectivity_error_count` - The number of requests that failed to reach the Google network.

### Tracing

#### OpenTelemetry Dependencies

Add the following dependencies in your `package.json` or install them directly.
```javascript
// Required packages for OpenTelemetry SDKs
"@opentelemetry/sdk-trace-base": "^1.26.0",
"@opentelemetry/sdk-trace-node": "^1.26.0",

// Package to use Google Cloud Trace exporter
"@google-cloud/opentelemetry-cloud-trace-exporter": "^2.4.1",

// Packages to enable gRPC instrumentation
"@opentelemetry/instrumentation": "^0.53.0",
"@opentelemetry/instrumentation-grpc": "^0.53.0",
```

#### OpenTelemetry Configuration

```javascript
const {
  NodeTracerProvider,
  TraceIdRatioBasedSampler,
} = require('@opentelemetry/sdk-trace-node');
const {
  BatchSpanProcessor,
} = require('@opentelemetry/sdk-trace-base');
const {
  TraceExporter,
} = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const exporter = new TraceExporter();

// Create the tracerProvider that the exporter shall be attached to.
const provider = new NodeTracerProvider({
  resource: resource,
  spanProcessors: [new BatchSpanProcessor(exporter)]
});

// Create the Cloud Spanner Client.
const {Spanner} = require('@google-cloud/spanner');
const spanner = new Spanner({
  projectId: projectId,
  observabilityOptions: {
    // Inject the TracerProvider via SpannerOptions or
    // register it as a global by invoking `provider.register()`
    tracerProvider: provider,
  },
});
```

#### SQL Statement span annotation

To allow your SQL statements to be annotated in the appropriate spans, you need to opt-in, because
SQL statements can contain sensitive personally-identifiable-information (PII).

You can opt-in by either:

* Setting the environment variable `SPANNER_ENABLE_EXTENDED_TRACING=true` before your application is started
* In code, setting `enableExtendedTracing: true` in your SpannerOptions before creating the Cloud Spanner client

```javascript
const spanner = new Spanner({
  projectId: projectId,
  observabilityOptions: {
    tracerProvider: provider,
    enableExtendedTracing: true,
  }
}),
```

#### End to end tracing

In addition to client-side tracing, you can opt in for end-to-end tracing. End-to-end tracing helps you understand and debug latency issues that are specific to Spanner. Refer [here](https://cloud.google.com/spanner/docs/tracing-overview) for more information.

To configure end-to-end tracing.

1. Opt in for end-to-end tracing. You can opt-in by either:
* Setting the environment variable `SPANNER_ENABLE_END_TO_END_TRACING=true` before your application is started
* In code, setting `enableEndToEndTracing: true` in your SpannerOptions before creating the Cloud Spanner client

```javascript
const spanner = new Spanner({
  projectId: projectId,
  observabilityOptions: {
    tracerProvider: provider,
    enableEndToEndTracing: true,
  }
}),
```

2. Set the trace context propagation in OpenTelemetry.
```javascript
const {propagation} = require('@opentelemetry/api');
const {W3CTraceContextPropagator} = require('@opentelemetry/core');
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
```

#### OpenTelemetry gRPC instrumentation

Optionally, you can enable OpenTelemetry gRPC instrumentation which produces traces of executed remote procedure calls (RPCs)
in your programs by these imports and instantiation. You could pass in the traceProvider or register it globally
by invoking `tracerProvider.register()`

```javascript
  const {registerInstrumentations} = require('@opentelemetry/instrumentation');
  const {GrpcInstrumentation} = require('@opentelemetry/instrumentation-grpc');
  registerInstrumentations({
    tracerProvider: tracerProvider,
    instrumentations: [new GrpcInstrumentation()],
  });
```

#### Tracing Sample
For more information please see this [sample code](./samples/observability-traces.js)
