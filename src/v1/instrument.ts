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

import {context, trace} from '@opentelemetry/api';
const tracer = trace.getTracer('nodejs-spanner');
import {Span, SpanStatusCode} from '@opentelemetry/api';

// Ensure that we've registered the gRPC instrumentation.
const {GrpcInstrumentation} = require('@opentelemetry/instrumentation-grpc');
const {BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {HttpInstrumentation} = require('@opentelemetry/instrumentation-http');
const {registerInstrumentations} = require('@opentelemetry/instrumentation');
// Ensure that the auto-instrumentation for gRPC & HTTP generates
// traces that'll be retrieved along with the spans we've created.
registerInstrumentations({
  instrumentations: [new GrpcInstrumentation(), new HttpInstrumentation()],
});

const {
  CallbackMethod,
  CallbackifyAllOptions,
  PromiseMethod,
  PromisifyAllOptions,
  PromisifyOptions,
  WithPromise,
} = require('@google-cloud/promisify');

const optedInPII = process.env.SPANNER_NODEJS_ANNOTATE_PII_SQL === '1';

interface SQLStatement {
  sql: string;
}

// startTrace synchronously returns a tracing span, to avoid the dramatic
// scope change in which trying to use tracer.startActiveSpan
// would change the meaning of "this", which is heavily used around
// the library, and also the introduction of callbacks
// would radically change all the code structures making it more invasive.
export function startTrace(
  spanNameSuffix: string,
  sql?: string | SQLStatement
): Span {
  const span = tracer.startSpan(
    'cloud.google.com/nodejs/spanner/' + spanNameSuffix
  );

  if (optedInPII && sql) {
    if (typeof sql === 'string') {
      span.setAttribute('sql', sql as string);
    } else {
      const stmt = sql as SQLStatement;
      span.setAttribute('sql', stmt.sql);
    }
  }

  // Now set the span as the active one in the current context so that
  // future invocations to startTrace will have this current span as
  // the parent.
  trace.setSpan(context.active(), span);
  return span;
}

// setSpanError sets an error on the span using code SpanStatusCode.Error
// as well as the message of the string representation of err.
export function setSpanError(span: Span, err: Error | String) {
  if (err) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.toString(),
    });
  }
}

/**
 * Wraps a promisy type function to conditionally call a callback function.
 *
 * @param {function} originalMethod - The method to callbackify.
 * @param {object=} options - Callback options.
 * @param {boolean} options.singular - Pass to the callback a single arg instead of an array.
 * @return {function} wrapped
 *
 * This code although modified for OpenTelemetry instrumentation, is copied from
 * https://github.com/googleapis/nodejs-promisify/blob/main/src/index.ts
 */
function callbackify(originalMethod: typeof CallbackMethod) {
  if (originalMethod.callbackified_) {
    return originalMethod;
  }

  // tslint:disable-next-line:no-any
  const wrapper = function (this: any) {
    if (typeof arguments[arguments.length - 1] !== 'function') {
      return originalMethod.apply(this, arguments);
    }

    const cb = Array.prototype.pop.call(arguments);

    const span = startTrace('Spanner.' + cb.name);
    originalMethod.apply(this, arguments).then(
      // tslint:disable-next-line:no-any
      (res: any) => {
        res = Array.isArray(res) ? res : [res];
        span.end();
        cb(null, ...res);
      },
      (err: Error) => {
        setSpanError(span, err);
        span.end();
        cb(err);
      }
    );
  };
  wrapper.callbackified_ = true;
  return wrapper;
}

/**
 * Callbackifies certain Class methods. This will not callbackify private or
 * streaming methods.
 *
 * @param {module:common/service} Class - Service class.
 * @param {object=} options - Configuration object.
 *
 * This code although modified for OpenTelemetry instrumentation, is copied from
 * https://github.com/googleapis/nodejs-promisify/blob/main/src/index.ts
 */
export function callbackifyAll(
  // tslint:disable-next-line:variable-name
  Class: Function,
  options?: typeof CallbackifyAllOptions
) {
  const exclude = (options && options.exclude) || [];
  const ownPropertyNames = Object.getOwnPropertyNames(Class.prototype);
  const methods = ownPropertyNames.filter(methodName => {
    // clang-format off
    return (
      !exclude.includes(methodName) &&
      typeof Class.prototype[methodName] === 'function' && // is it a function?
      !/^_|(Stream|_)|^constructor$/.test(methodName) // is it callbackifyable?
    );
    // clang-format on
  });

  methods.forEach(methodName => {
    const originalMethod = Class.prototype[methodName];
    if (!originalMethod.callbackified_) {
      Class.prototype[methodName] = callbackify(originalMethod);
    }
  });
}

/**
 * Wraps a callback style function to conditionally return a promise.
 *
 * @param {function} originalMethod - The method to promisify.
 * @param {object=} options - Promise options.
 * @param {boolean} options.singular - Resolve the promise with single arg instead of an array.
 * @return {function} wrapped
 *
 * This code although modified for OpenTelemetry instrumentation, is copied from
 * https://github.com/googleapis/nodejs-promisify/blob/main/src/index.ts
 */
export function promisify(
  originalMethod: typeof PromiseMethod,
  options?: typeof PromisifyOptions
) {
  if (originalMethod.promisified_) {
    return originalMethod;
  }

  options = options || {};

  const slice = Array.prototype.slice;

  const wrapper: any = function (this: typeof WithPromise) {
    const span = startTrace('Spanner.' + originalMethod.name);

    // tslint:disable-next-line:no-any
    let last;

    for (last = arguments.length - 1; last >= 0; last--) {
      const arg = arguments[last];

      if (typeof arg === 'undefined') {
        continue; // skip trailing undefined.
      }

      if (typeof arg !== 'function') {
        break; // non-callback last argument found.
      }

      return originalMethod.apply(this, arguments);
    }

    // peel trailing undefined.
    const args = slice.call(arguments, 0, last + 1);

    // tslint:disable-next-line:variable-name
    let PromiseCtor = Promise;

    // Because dedupe will likely create a single install of
    // @google-cloud/common to be shared amongst all modules, we need to
    // localize it at the Service level.
    if (this && this.Promise) {
      PromiseCtor = this.Promise;
    }

    return new PromiseCtor((resolve, reject) => {
      // tslint:disable-next-line:no-any
      args.push((...args: any[]) => {
        const callbackArgs = slice.call(args);
        const err = callbackArgs.shift();

        if (err) {
          setSpanError(span, err);
          span.end();
          return reject(err);
        }

        span.end();
        if (options!.singular && callbackArgs.length === 1) {
          resolve(callbackArgs[0]);
        } else {
          resolve(callbackArgs);
        }
      });

      originalMethod.apply(this, args);
    });
  };

  wrapper.promisified_ = true;
  return wrapper;
}

/**
 * Promisifies certain Class methods. This will not promisify private or
 * streaming methods.
 *
 * @param {module:common/service} Class - Service class.
 * @param {object=} options - Configuration object.
 *
 * This code although modified for OpenTelemetry instrumentation, is copied from
 * https://github.com/googleapis/nodejs-promisify/blob/main/src/index.ts
 */
// tslint:disable-next-line:variable-name
export function promisifyAll(
  Class: Function,
  options?: typeof PromisifyAllOptions
) {
  const exclude = (options && options.exclude) || [];
  const ownPropertyNames = Object.getOwnPropertyNames(Class.prototype);
  const methods = ownPropertyNames.filter(methodName => {
    // clang-format off
    return (
      !exclude.includes(methodName) &&
      typeof Class.prototype[methodName] === 'function' && // is it a function?
      !/(^_|(Stream|_)|promise$)|^constructor$/.test(methodName) // is it promisable?
    );
    // clang-format on
  });

  methods.forEach(methodName => {
    const originalMethod = Class.prototype[methodName];
    if (!originalMethod.promisified_) {
      Class.prototype[methodName] = exports.promisify(originalMethod, options);
    }
  });
}
