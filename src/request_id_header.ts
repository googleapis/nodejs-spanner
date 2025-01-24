/**
 * Copyright 2025 Google LLC. All Rights Reserved.
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
// eslint-disable-next-line n/no-extraneous-import
import * as grpc from '@grpc/grpc-js';
const randIdForProcess = randomBytes(8).readBigUint64LE(0).toString();
const X_GOOG_SPANNER_REQUEST_ID_HEADER = 'x-goog-spanner-request-id';

class AtomicCounter {
  private readonly backingBuffer: Uint32Array;

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

  public reset() {
    Atomics.store(this.backingBuffer, 0, 0);
  }
}

const REQUEST_HEADER_VERSION = 1;

function craftRequestId(
  nthClientId: number,
  channelId: number,
  nthRequest: number,
  attempt: number
) {
  return `${REQUEST_HEADER_VERSION}.${randIdForProcess}.${nthClientId}.${channelId}.${nthRequest}.${attempt}`;
}

const nthClientId = new AtomicCounter();

// Only exported for deterministic testing.
export function resetNthClientId() {
  nthClientId.reset();
}

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
  private prefixesToIgnore?: string[];
  constructor(prefixesToIgnore?: string[]) {
    this.nStream = 0;
    this.streamCalls = [];
    this.nUnary = 0;
    this.unaryCalls = [];
    this.prefixesToIgnore = prefixesToIgnore || [];
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

  generateClientInterceptor() {
    return this.interceptUnary.bind(this);
  }

  interceptStream(call, next) {
    const gotReqId = this.assertHasHeader(call);
    this.streamCalls.push({method: call.method, reqId: gotReqId});
    this.nStream++;
    next(call);
  }

  generateServerInterceptor() {
    return this.serverInterceptor.bind(this);
  }

  reset() {
    this.nStream = 0;
    this.streamCalls = [];
    this.nUnary = 0;
    this.unaryCalls = [];
  }

  public getUnaryCalls() {
    return this.unaryCalls;
  }

  public getStreamingCalls() {
    return this.streamCalls;
  }

  serverInterceptor(methodDescriptor, call) {
    const method = call.handler.path;
    const isUnary = call.handler.type === 'unary';
    const listener = new grpc.ServerListenerBuilder()
      .withOnReceiveMetadata((metadata, next) => {
        let i = 0;
        const prefixesToIgnore: string[] = this.prefixesToIgnore || [];
        for (i = 0; i < prefixesToIgnore.length; i++) {
          const prefix = prefixesToIgnore[i];
          if (method.startsWith(prefix)) {
            next(metadata);
            return;
          }
        }

        const gotReqIds = metadata.get(X_GOOG_SPANNER_REQUEST_ID_HEADER);
        if (!(gotReqIds && gotReqIds.length > 0)) {
          call.sendStatus({
            code: grpc.status.INVALID_ARGUMENT,
            details: `${method} is missing ${X_GOOG_SPANNER_REQUEST_ID_HEADER} header`,
          });
          return;
        }

        if (gotReqIds.length !== 1) {
          call.sendStatus({
            code: grpc.status.INVALID_ARGUMENT,
            details: `${method} set multiple ${X_GOOG_SPANNER_REQUEST_ID_HEADER} headers: ${gotReqIds}`,
          });
          return;
        }

        const gotReqId = gotReqIds[0].toString();
        if (!gotReqId.match(X_GOOG_REQ_ID_REGEX)) {
          call.sendStatus({
            code: grpc.status.INVALID_ARGUMENT,
            details: `${method} reqID header ${gotReqId} does not match ${X_GOOG_REQ_ID_REGEX}`,
          });
          return;
        }

        if (isUnary) {
          this.unaryCalls.push({method: method, reqId: gotReqId});
          this.nUnary++;
        } else {
          this.streamCalls.push({method: method, reqId: gotReqId});
          this.nStream++;
        }

        next(metadata);
      })
      .build();

    const responder = new grpc.ResponderBuilder()
      .withStart(next => next(listener))
      .build();
    return new grpc.ServerInterceptingCall(call, responder);
  }
}

interface withHeaders {
  headers: {[k: string]: string};
}

function extractRequestID(config: any): string {
  if (!config) {
    return '';
  }

  const hdrs = config as withHeaders;
  if (hdrs && hdrs.headers) {
    return hdrs.headers[X_GOOG_SPANNER_REQUEST_ID_HEADER];
  }
  return '';
}

function injectRequestIDIntoError(config: any, err: Error) {
  if (!err) {
    return;
  }

  // Inject that RequestID into the actual
  // error object regardless of the type.
  const requestID = extractRequestID(config);
  if (requestID) {
    Object.assign(err, {requestID: requestID});
  }
}

interface withNextNthRequest {
  _nextNthRequest: Function;
}

interface withMetadataWithRequestId {
  _nthClientId: number;
  _channelId: number;
}

function injectRequestIDIntoHeaders(
  headers: {[k: string]: string},
  session: any,
  nthRequest?: number,
  attempt?: number
) {
  if (!session) {
    return headers;
  }

  if (!nthRequest) {
    const database = session.parent as withNextNthRequest;
    if (!(database && typeof database._nextNthRequest === 'function')) {
      return headers;
    }
    nthRequest = database._nextNthRequest();
  }

  attempt = attempt || 1;
  return _metadataWithRequestId(session, nthRequest!, attempt, headers);
}

function _metadataWithRequestId(
  session: any,
  nthRequest: number,
  attempt: number,
  priorMetadata?: {[k: string]: string}
): {[k: string]: string} {
  if (!priorMetadata) {
    priorMetadata = {};
  }
  const withReqId = {
    ...priorMetadata,
  };
  const database = session.parent as withMetadataWithRequestId;
  let clientId = 1;
  let channelId = 1;
  if (database) {
    clientId = database._nthClientId || 1;
    channelId = database._channelId || 1;
  }
  withReqId[X_GOOG_SPANNER_REQUEST_ID_HEADER] = craftRequestId(
    clientId,
    channelId,
    nthRequest,
    attempt
  );
  return withReqId;
}

function nextNthRequest(database): number {
  if (!(database && typeof database._nextNthRequest === 'function')) {
    return 1;
  }
  return database._nextNthRequest();
}

export interface RequestIDError extends grpc.ServiceError {
  requestID: string;
}

export {
  AtomicCounter,
  X_GOOG_SPANNER_REQUEST_ID_HEADER,
  XGoogRequestHeaderInterceptor,
  craftRequestId,
  injectRequestIDIntoError,
  injectRequestIDIntoHeaders,
  nextNthRequest,
  nextSpannerClientId,
  newAtomicCounter,
  randIdForProcess,
};
