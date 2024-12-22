/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {randomBytes} from 'crypto';
import * as grpc from '@grpc/grpc-js';
const randIdForProcess = randomBytes(8).readBigUint64LE(0).toString();
const X_GOOG_SPANNER_REQUEST_ID_HEADER = 'x-goog-spanner-request-id';

class AtomicCounter {
  private backingBuffer: Uint32Array;

  constructor(initialValue?: number) {
    this.backingBuffer = new Uint32Array(
      new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT)
    );
    if (initialValue) {
      this.increment(initialValue);
    }
  }

  public increment(n?: number): number {
    if (!n) {
      n = 1;
    }
    Atomics.add(this.backingBuffer, 0, n);
    return this.value();
  }

  public value(): number {
    return Atomics.load(this.backingBuffer, 0);
  }

  public toString(): string {
    return `${this.value()}`;
  }
}

function craftRequestId(
  nthClientId: number,
  channelId: number,
  nthRequest: number,
  attempt: number
) {
  return `1.${randIdForProcess}.${nthClientId}.${channelId}.${nthRequest}.${attempt}`;
}

const nthClientId = new AtomicCounter();

/*
 * nextSpannerClientId increments the internal
 * counter for created SpannerClients, for use
 * with x-goog-spanner-request-id.
 */
function nextSpannerClientId(): number {
  nthClientId.increment(1);
  return nthClientId.value();
}

function newAtomicCounter(n?: number): AtomicCounter {
  return new AtomicCounter(n);
}

const X_GOOG_REQ_ID_REGEX = /(\d+\.){5}\d+/;

class XGoogRequestHeaderInterceptor {
  private nStream: number;
  private nUnary: number;
  private streamCalls: any[];
  private unaryCalls: any[];
  constructor() {
    this.nStream = 0;
    this.streamCalls = [];
    this.nUnary = 0;
    this.unaryCalls = [];
  }

  assertHasHeader(call): string | unknown {
    const metadata = call.metadata;
    const gotReqId = metadata[X_GOOG_SPANNER_REQUEST_ID_HEADER];
    if (!gotReqId) {
      throw new Error(
        `${call.method} is missing ${X_GOOG_SPANNER_REQUEST_ID_HEADER} header`
      );
    }

    if (!gotReqId.match(X_GOOG_REQ_ID_REGEX)) {
      throw new Error(
        `${call.method} reqID header ${gotReqId} does not match ${X_GOOG_REQ_ID_REGEX}`
      );
    }
    return gotReqId;
  }

  interceptUnary(call, next) {
    const gotReqId = this.assertHasHeader(call);
    this.unaryCalls.push({method: call.method, reqId: gotReqId});
    this.nUnary++;
    next(call);
  }

  interceptStream(call, next) {
    const gotReqId = this.assertHasHeader(call);
    this.streamCalls.push({method: call.method, reqId: gotReqId});
    this.nStream++;
    next(call);
  }

  serverInterceptor(methodDescriptor, call) {
    const method = call.handler.path;
    const isUnary = call.handler.type === 'unary';
    const listener = new grpc.ServerListenerBuilder()
      .withOnReceiveMetadata((metadata, next) => {
        const gotReqId = metadata[X_GOOG_SPANNER_REQUEST_ID_HEADER];
        if (!gotReqId) {
          call.sendStatus({
            code: grpc.status.INVALID_ARGUMENT,
            details: `${method} is missing ${X_GOOG_SPANNER_REQUEST_ID_HEADER} header`,
          });
          return;
        }

        if (!gotReqId.match(X_GOOG_REQ_ID_REGEX)) {
          call.sendStatus({
            code: grpc.status.INVALID_ARGUMENT,
            details: `${method} reqID header ${gotReqId} does not match ${X_GOOG_REQ_ID_REGEX}`,
          });
        }

        // Otherwise it matched all good.
        if (isUnary) {
          this.unaryCalls.push({method: method, reqId: gotReqId});
          this.nUnary++;
        } else {
          this.streamCalls.push({method: method, reqId: gotReqId});
          this.nStream++;
        }
      })
      .build();

    const responder = new grpc.ResponderBuilder()
      .withStart(next => next(listener))
      .build();
    return new grpc.ServerInterceptingCall(call, responder);
  }
}

export {
  AtomicCounter,
  X_GOOG_SPANNER_REQUEST_ID_HEADER,
  craftRequestId,
  nextSpannerClientId,
  newAtomicCounter,
  XGoogRequestHeaderInterceptor,
};
