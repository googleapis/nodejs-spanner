// Copyright 2025 Google LLC
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

import {grpc} from 'google-gax';
import {MetricsTracerFactory} from './metrics-tracer-factory';
import {MetricsTracer} from './metrics-tracer';

/**
 * Interceptor for recording metrics on gRPC calls.
 *
 * This interceptor records attempt metrics at the start and completion of each gRPC call,
 * and also records Google Front End (GFE) metrics such as latency and connectivity errors
 * based on the presence and value of the 'server-timing' header in the response metadata.
 *
 * @param {object} options - The gRPC call options, including method definition.
 * @param {function} nextCall - The next function to call in the gRPC request chain.
 * @returns {grpc.InterceptingCall} - The intercepting call with added metrics recording.
 */
export const MetricInterceptor = (options, nextCall) => {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function (metadata, listener, next) {
      // Record attempt metric on request start
      const factory = MetricsTracerFactory.getInstance();
      const metricsTracer = factory?.getCurrentTracer(
        options.method_definition.path,
      ) as MetricsTracer;
      metricsTracer?.recordAttemptStart();

      const newListener = {
        onReceiveMetadata: function (metadata, next) {
          // Record GFE Metrics
          // GFE latency if available,
          // or else increase the GFE connectivity error count
          if (metricsTracer) {
            const gfeHeader = metadata.getMap()['server-timing'];
            const timing = metricsTracer?.extractGfeLatency(gfeHeader);
            metricsTracer.gfeLatency = timing ?? null;
          }

          next(metadata);
        },
        onReceiveMessage: function (message, next) {
          next(message);
        },
        onReceiveStatus: function (status, next) {
          next(status);

          // Record attempt metric completion
          metricsTracer?.recordAttemptCompletion(status.code);
          if (metricsTracer?.gfeLatency) {
            metricsTracer?.recordGfeLatency(status.code);
          } else {
            metricsTracer?.recordGfeConnectivityErrorCount(status.code);
          }
        },
      };
      next(metadata, newListener);
    },
    sendMessage: function (message, next) {
      next(message);
    },

    halfClose: function (next) {
      next();
    },

    cancel: function (next) {
      next();
    },
  });
};
