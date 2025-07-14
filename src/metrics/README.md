# Custom Metric Exporter
The custom metric exporter, as defined in [spanner-metrics-exporter.ts](./spanner-metrics-exporter.ts), is designed to work in conjunction with OpenTelemetry and the Spanner client. It converts data into its protobuf equivalent and sends it to Google Cloud Monitoring.

## Filtering Criteria
The exporter filters metrics based on the following conditions, utilizing values defined in [constants.ts](./constants.ts):

* Metrics with a scope set to `spanner-nodejs`.
* Metrics with one of the following predefined names:
  * `attempt_latencies`
  * `attempt_count`
  * `operation_latencies`
  * `operation_count`
  * `gfe_latencies`
  * `gfe_connectivity_error_count`

## Service Endpoint
The exporter sends metrics to the Google Cloud Monitoring [service endpoint](https://cloud.google.com/python/docs/reference/monitoring/latest/google.cloud.monitoring_v3.services.metric_service.MetricServiceClient#google_cloud_monitoring_v3_services_metric_service_MetricServiceClient_create_service_time_series), distinct from the regular client endpoint. This service endpoint operates under a different quota limit than the user endpoint and features an additional server-side filter that only permits a predefined set of metrics to pass through.

When introducing new service metrics, it is essential to ensure they are allowed through by the server-side filter as well.

## Architecture

### MetricsTracerFactory

MetricsTracerFactory is a singleton class in charge of managing the overall metrics functionality. This class manages the OpenTelemetry [Meter Providers](https://opentelemetry.io/docs/specs/otel/metrics/api/#meterprovider) to manage individual metric points and processes the metadata required for the metrics before being sent to Google.

### MetricsTracer

The MetricsTracer class handles the management of the metrics emitter for a singular operation and its attempts. The OpenTelemetry metrics are registered whenever the `recordOperationCompletion` and `recordAttemptCompletion`functions are called, for operation and attempt metrics respectively.

### MetricInterceptor

This is a gRPC interceptor that is injected into the gRPC client that the Spanner client uses internally to make requests to Google servers. This interceptor code will be run on every request sent, and the information relevant for the `attempt` and  and `gfe` metrics are recorded for their metric emissions.

### CloudMonitoringMetricsExporter

The CloudMonitoringMetricsExporter is an implementation of an [Opentelemetry Exporer](https://opentelemetry.io/docs/languages/js/exporters/). It handles the translation and emission of the Opentelemetry Metrics stored in the MeterProvider to the Protobuf definitions for these metrics as expected by Google Cloud Monitoring.
