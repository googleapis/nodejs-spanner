// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  SEMATTRS_DB_STATEMENT,
  SEMATTRS_DB_SYSTEM,
  SEMATTRS_DB_SQL_TABLE,
} from '@opentelemetry/semantic-conventions';

const {TracerProvider} = require('@opentelemetry/sdk-trace-node');

// Optional instrumentation that the user will configure if they'd like to.
const {
  Instrumentation,
  registerInstrumentations,
} = require('@opentelemetry/instrumentation');

import {
  ContextManager,
  Span,
  SpanStatusCode,
  context,
  trace,
  INVALID_SPAN_CONTEXT,
  SpanAttributes,
  TimeInput,
  Link,
  Exception,
  SpanContext,
  SpanStatus,
  SpanKind,
} from '@opentelemetry/api';

let optedInPII: boolean =
  process.env.SPANNER_ENABLE_EXTENDED_TRACING === 'true';

interface SQLStatement {
  sql: string;
}

interface observabilityOptions {
  tracerProvider: typeof TracerProvider;
  enableExtendedTracing: boolean;
}

export type {observabilityOptions as ObservabilityOptions};

export function applyObservabilityOptions(
  opts: observabilityOptions | undefined
) {
  if (!opts) {
    return;
  }

  if (opts.tracerProvider) {
    setTracerProvider(opts.tracerProvider);
  }

  if (opts.enableExtendedTracing) {
    optInForSQLStatementOnSpans();
  }
}

/*
-------------------------------------------------------
Notes and requests from peer review:
-------------------------------------------------------
* TODO: Allow the TracerProvider to be explicitly
    added to receive Cloud Spanner traces.
* TODO: Read Java Spanner to find the nodeTracerProvider
    and find out how they inject it locally or use it globally
    please see https://github.com/googleapis/java-spanner?tab=readme-ov-file#opentelemetry-configuration.
*/

let defaultTracerProvider: typeof TracerProvider = undefined;

// setTracerProvider allows the caller to hook up an OpenTelemetry
// TracerProvider that spans generated from this library shall be attached to,
// instead of using the global configuration. Later on if `getTracer` is invoked and
// the default tracerProvider is unset, it'll use the global tracer
// otherwise it'll use the set TracerProvider.
export function setTracerProvider(freshTracerProvider: typeof TracerProvider) {
  defaultTracerProvider = freshTracerProvider;
}

const TRACER_NAME = 'nodejs-spanner';

// getTracer fetches the tracer each time that it is invoked to solve
// the problem of observability being initialized after Spanner objects
// have been already created.
export function getTracer(config?: traceConfig) {
  if (config && config.opts && config.opts.tracerProvider) {
    return config.opts.tracerProvider.getTracer(TRACER_NAME);
  }
  if (defaultTracerProvider) {
    return defaultTracerProvider.getTracer(TRACER_NAME);
  }
  // Otherwise use the global tracer.
  return trace.getTracer(TRACER_NAME);
}

// optInForSQLStatementOnSpans is a configurable knob that if
// invoked allows spans to be annotated with the SQL statement
// of the producing function; if optOutofSQLStatementOnSpans
// is invoked the SQL statement annotation shall be dropped.
export function optInForSQLStatementOnSpans() {
  optedInPII = true;
}

export function optOutOfSQLStatementOnSpans() {
  optedInPII = false;
}

interface traceConfig {
  sql?: string | SQLStatement;
  tableName?: string;
  opts?: observabilityOptions;
  enableExtendedTracing?: boolean;
  that?: Object;
}

export function startTrace<F extends (span: Span) => ReturnType<F>>(
  spanNameSuffix: string,
  opts: traceConfig | undefined,
  cb: F
): ReturnType<F> {
  const origOpts = opts;
  opts = opts || {};
  if (typeof origOpts === 'string') {
    opts.sql = origOpts as string;
  }

  return getTracer(opts).startActiveSpan(
    'cloud.google.com/nodejs/spanner/' + spanNameSuffix,
    {kind: SpanKind.CLIENT},
    span => {
      span.setAttribute(SEMATTRS_DB_SYSTEM, 'spanner');

      if (opts.tableName) {
        span.setAttribute(SEMATTRS_DB_SQL_TABLE, opts.tableName);
      }

      const definedExtendedTracing = opts.enableExtendedTracing !== undefined;
      // If they optedInPII but opts.enableExtendedTracing=false, reject it.
      const explicitlySkipET =
        definedExtendedTracing && !opts.enableExtendedTracing;
      if (
        opts.sql &&
        !explicitlySkipET &&
        (opts.enableExtendedTracing || optedInPII)
      ) {
        const sql = opts.sql;
        if (typeof sql === 'string') {
          span.setAttribute(SEMATTRS_DB_STATEMENT, sql as string);
        } else {
          const stmt = sql as SQLStatement;
          span.setAttribute(SEMATTRS_DB_STATEMENT, stmt.sql);
        }
      }

      if (opts.that) {
        const fn = cb.bind(opts.that);
        return fn(span);
      } else {
        return cb(span);
      }
    }
  );
}

// setSpanError sets err, if non-nil onto the span with
// status.code=ERROR and the message of err.toString()
export function setSpanError(span: Span, err: Error | String) {
  if (!err || !span) {
    return;
  }

  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: err.toString(),
  });
}

export function setGlobalContextManager(manager: ContextManager) {
  context.setGlobalContextManager(manager);
}

export function disableContextAndManager(manager: typeof ContextManager) {
  manager.disable();
  context.disable();
}

// getActiveOrNoopSpan queries the tracer for the currently active span
// and returns it, otherwise if there is no active span available, it'll
// simply create a NoopSpan. This is important in the cases where we don't
// want to create a new span such is sensitive and frequently called code
// for which the new spans would be too many and thus pollute the trace,
// but yet we'd like to record an important annotation.
export function getActiveOrNoopSpan(): Span {
  const span = trace.getActiveSpan();
  if (span) {
    return span;
  }
  return new noopSpan();
}

// noopSpan is a pass-through Span that does nothing and shall not
// be exported, nor added into any context. It serves as a placeholder
// to allow calls in sensitive areas like sessionPools to transparently
// add attributes to spans without lots of ugly null checks.
class noopSpan implements Span {
  constructor() {}

  spanContext(): SpanContext {
    return INVALID_SPAN_CONTEXT;
  }

  setAttribute(key: string, value: unknown): this {
    return this;
  }

  setAttributes(attributes: SpanAttributes): this {
    return this;
  }

  addEvent(name: string, attributes?: SpanAttributes): this {
    return this;
  }

  addLink(link: Link): this {
    return this;
  }

  addLinks(links: Link[]): this {
    return this;
  }

  setStatus(status: SpanStatus): this {
    return this;
  }

  end(endTime?: TimeInput): void {}

  isRecording(): boolean {
    return false;
  }

  recordException(exc: Exception, timeAt?: TimeInput): void {}

  updateName(name: string): this {
    return this;
  }
}
