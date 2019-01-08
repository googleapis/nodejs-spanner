/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
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

'use strict';

import {Service} from '@google-cloud/common-grpc';
import * as checkpointStream from 'checkpoint-stream';
import * as eventsIntercept from 'events-intercept';
import * as is from 'is';
import mergeStream = require('merge-stream');
import {common as p} from 'protobufjs';
import {Readable, Transform} from 'stream';
import * as streamEvents from 'stream-events';

import {codec, JSONOptions, Json, Field, Value} from './codec';
import {SpannerClient as s} from './v1';

type ResumeToken = string|Uint8Array;

/**
 * @callback RequestFunction
 * @param {string} [resumeToken] The token used to resume getting results.
 * @returns {Stream}
 */
interface RequestFunction {
  (resumeToken?: ResumeToken): Readable;
}

/**
 * @typedef RowOptions
 * @property {boolean} [json=false] Indicates if the Row objects should be
 *     formatted into JSON.
 * @property {JSONOptions} [jsonOptions] JSON options.
 */
export interface RowOptions {
  json?: boolean;
  jsonOptions?: JSONOptions;
}

/**
 * By default rows are an Array of values in the form of objects containing
 * `name` and `value` properties.
 *
 * If you prefer plain objects, you can use the {@link Row#toJSON} method.
 * NOTE: If you have duplicate field names only the last field will be present.
 *
 * @typedef {Array.<{name: string, value}>} Row
 */
export interface Row extends Array<Field> {
  /**
   * Converts the Row object into a pojo (plain old JavaScript object).
   *
   * @memberof Row
   * @name toJSON
   *
   * @param {JSONOptions} [options] JSON options.
   * @returns {object}
   */
  toJSON(options?: JSONOptions): JSON;
}

/**
 * @callback PartialResultStream~rowCallback
 * @param {Row|object} row The row data.
 */
interface RowCallback {
  (row: Row|Json): void;
}

/**
 * @callback PartialResultStream~statsCallback
 * @param {object} stats The result stats.
 */
interface StatsCallback {
  (stats: s.ResultSetStats): void;
}

/**
 * @callback PartialResultStream~responseCallback
 * @param {object} response The full API response.
 */
interface ResponseCallback {
  (response: s.PartialResultSet): void;
}

interface ResultEvents {
  addListener(event: 'data', listener: RowCallback): this;
  addListener(event: 'stats', listener: StatsCallback): this;
  addListener(event: 'response', listener: ResponseCallback): this;

  emit(event: 'data', data: Row|Json): boolean;
  emit(event: 'stats', data: s.ResultSetStats): boolean;
  emit(event: 'response', data: s.PartialResultSet): boolean;

  on(event: 'data', listener: RowCallback): this;
  on(event: 'stats', listener: StatsCallback): this;
  on(event: 'response', listener: ResponseCallback): this;

  once(event: 'data', listener: RowCallback): this;
  once(event: 'stats', listener: StatsCallback): this;
  once(event: 'response', listener: ResponseCallback): this;

  prependListener(event: 'data', listener: RowCallback): this;
  prependListener(event: 'stats', listener: StatsCallback): this;
  prependListener(event: 'response', listener: ResponseCallback): this;

  prependOnceListener(event: 'data', listener: RowCallback): this;
  prependOnceListener(event: 'stats', listener: StatsCallback): this;
  prependOnceListener(event: 'response', listener: ResponseCallback): this;
}

/**
 * The PartialResultStream transforms partial result set objects into Row
 * objects.
 *
 * @class
 * @extends {Transform}
 *
 * @param {RowOptions} [options] The row options.
 */
export class PartialResultStream extends Transform implements ResultEvents {
  private _fields!: s.Field[];
  private _options: RowOptions;
  private _pendingValue?: p.IValue;
  private _values: p.IValue[];
  constructor(options = {}) {
    super({objectMode: true});

    this._options = options;
    this._values = [];
  }
  /**
   * Destroys the stream.
   *
   * @param {Error} [err] Optional error to destroy stream with.
   */
  destroy(err?: Error): void {
    if (super.destroy) {
      return super.destroy(err);
    }

    process.nextTick(() => {
      if (err) {
        this.emit('error', err);
      }
      this.emit('close');
    });
  }
  /**
   * Processes each chunk.
   *
   * @private
   *
   * @param {object} chunk The partial result set.
   * @param {string} encoding Chunk encoding (Not used in object streams).
   * @param {function} next Function to be called upon completion.
   */
  _transform(chunk: s.PartialResultSet, enc: string, next: Function): void {
    this.emit('response', chunk);

    if (chunk.stats) {
      this.emit('stats', chunk.stats);
    }

    if (!this._fields && chunk.metadata) {
      this._fields = chunk.metadata.rowType!.fields;
    }

    if (!is.empty(chunk.values)) {
      this._addChunk(chunk);
    }

    next();
  }
  /**
   * Manages any chunked values.
   *
   * @private
   *
   * @param {object} chunk The partial result set.
   */
  private _addChunk(chunk: s.PartialResultSet): void {
    const values: Value[] = chunk.values.map(Service.decodeValue_);

    // If we have a chunk to merge, merge the values now.
    if (this._pendingValue) {
      const currentField = this._values.length % this._fields.length;
      const field = this._fields[currentField];
      const merged = PartialResultStream.merge(
          field.type!, this._pendingValue, values.shift());

      values.unshift(...merged);
      delete this._pendingValue;
    }

    // If the chunk is chunked, store the last value for merging with the next
    // chunk to be processed.
    if (chunk.chunkedValue) {
      this._pendingValue = values.pop();
    }

    values.forEach(value => this._addValue(value));
  }
  /**
   * Manages complete values, pushing a completed row into the stream once all
   * values have been received.
   *
   * @private
   *
   * @param {*} value The complete value.
   */
  private _addValue(value: Value): void {
    const values = this._values;

    values.push(value);

    if (values.length !== this._fields.length) {
      return;
    }

    this._values = [];

    const row: Row = this._createRow(values);

    if (this._options.json) {
      this.push(row.toJSON(this._options.jsonOptions));
      return;
    }

    this.push(row);
  }
  /**
   * Converts an array of values into a row.
   *
   * @private
   *
   * @param {Array.<*>} values The row values.
   * @returns {Row}
   */
  private _createRow(values: Value[]): Row {
    const fields = values.map((value, index) => {
      const {name, type} = this._fields[index];
      return {name, value: codec.decode(value, type!)};
    });

    Object.defineProperty(fields, 'toJSON', {
      value: (options?: JSONOptions): Json => {
        return codec.convertFieldsToJson(fields, options);
      }
    });

    return fields as Row;
  }
  /**
   * Attempts to merge chunked values together.
   *
   * @static
   * @private
   *
   * @param {object} type The value type.
   * @param {*} head The head of the combined value.
   * @param {*} tail The tail of the combined value.
   * @returns {Array.<*>}
   */
  // tslint:disable-next-line no-any
  static merge(type: s.Type, head: Value, tail: Value): Value[] {
    if (type.code === s.TypeCode.ARRAY || type.code === s.TypeCode.STRUCT) {
      return [PartialResultStream.mergeLists(type, head, tail)];
    }

    if (is.string(head) && is.string(tail)) {
      return [head + tail];
    }

    return [head, tail];
  }
  /**
   * Attempts to merge chunked lists together.
   *
   * @static
   * @private
   *
   * @param {object} type The list type.
   * @param {Array.<*>} head The beginning of the list.
   * @param {Array.<*>} tail The end of the list.
   * @returns {Array.<*>}
   */
  static mergeLists(type: s.Type, head: Value[], tail: Value[]): Value[] {
    let listType: s.Type;

    if (type.code === 'ARRAY') {
      listType = type.arrayElementType!;
    } else {
      listType = type.structType!.fields[head.length - 1].type!;
    }

    const merged =
        PartialResultStream.merge(listType, head.pop(), tail.shift());

    return [...head, ...merged, ...tail];
  }
}

/**
 * Rows returned from queries may be chunked, requiring them to be stitched
 * together. This function returns a stream that will properly assemble these
 * rows, as well as retry after an error. Rows are only emitted if they hit a
 * "checkpoint", which is when a `resumeToken` is returned from the API. Without
 * that token, it's unsafe for the query to be retried, as we wouldn't want to
 * emit the same data multiple times.
 *
 * @private
 *
 * @param {RequestFunction} requestFn The function that makes an API request. It
 *     will receive one argument, `resumeToken`, which should be used however is
 *     necessary to send to the API for additional requests.
 * @param {RowOptions} [options] Options for formatting rows.
 * @returns {PartialResultStream}
 */
export function partialResultStream(
    requestFn: RequestFunction, options?: RowOptions): PartialResultStream {
  let lastResumeToken: ResumeToken;

  // mergeStream allows multiple streams to be connected into one. This is good;
  // if we need to retry a request and pipe more data to the user's stream.
  const requestsStream = mergeStream();
  const userStream = streamEvents(new PartialResultStream(options));
  const batchAndSplitOnTokenStream = checkpointStream.obj({
    maxQueued: 10,
    isCheckpointFn: (row: s.PartialResultSet): boolean => {
      return is.defined(row.resumeToken);
    }
  });

  const makeRequest = (): void => {
    requestsStream.add(requestFn(lastResumeToken));
  };

  const retry = (err: Error): void => {
    if (!lastResumeToken) {
      // We won't retry the request, so this will flush any rows the
      // checkpoint stream has queued. After that, we will destroy the
      // user's stream with the same error.
      setImmediate(() => batchAndSplitOnTokenStream.destroy(err));
      return;
    }

    // We're going to retry from where we left off.
    // Empty queued rows on the checkpoint stream (will not emit them to user).
    batchAndSplitOnTokenStream.reset();
    makeRequest();
  };

  userStream.once('reading', makeRequest);
  eventsIntercept.patch(requestsStream);

  // need types for events-intercept
  // tslint:disable-next-line no-any
  (requestsStream as any).intercept('error', retry);

  return requestsStream
      .pipe(batchAndSplitOnTokenStream)
      // If we get this error, the checkpoint stream has flushed any rows
      // it had queued. We can now destroy the user's stream, as our retry
      // attempts are over.
      .on('error', (err: Error) => userStream.destroy(err))
      .on('checkpoint',
          (row: s.PartialResultSet) => {
            lastResumeToken = row.resumeToken;
          })
      .pipe(userStream);
}
