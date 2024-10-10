## Observability with OpenTelemetry

This Cloud Spanner client supports [OpenTelemetry Traces](https://opentelemetry.io/), which gives insight into the client internals and aids in debugging/troubleshooting production issues.

By default, the functionality is disabled. You shall need to add OpenTelemetry dependencies, and must configure and
enable OpenTelemetry with appropriate exporters at the startup of your application:

**Table of contents:**

* [Observability](#observability)
  * [Tracing](#tracing)
    * [OpenTelemetry Dependencies](#opentelemetry-dependencies)
    * [OpenTelemetry Configuration](#opentelemetry-configuration)
    * [SQL Statement span annotation](#sql-statement-span-annotation)
    * [OpenTelemetry gRCP instrumentation](#opentelemetry-grpc-instrumentation)
    * [Tracing Sample](#tracing-sample)

### Tracing

#### OpenTelemetry Dependencies

Use a trace exporter of your choice, such as Google Cloud Trace like below:

```javascript
const {
  TraceExporter,
} = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const exporter = new TraceExporter();
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

// Create the tracerProvider that the exporter shall be attached to.
const provider = new NodeTracerProvider({resource: resource});
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

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
  },
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
