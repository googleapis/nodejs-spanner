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

import {codec, JSONOptions, RowJSON} from './codec';
import {SpannerClient as s} from './v1';

/**
 * @callback RequestFunction
 * @param {string} [resumeToken] The token used to resume getting results.
 * @returns {Stream}
 */
interface RequestFunction {
  (resumeToken?: string): Readable;
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
 */
export class Row extends Array {
  /**
   * @hideconstructor
   *
   * @param {Array.<Object>} fields The field info for this row.
   * @param {Array.<*>} values The row values.
   */
  constructor(fields: s.Field[], values: p.IValue[]) {
    super();

    values.forEach((value, index) => {
      const field = fields[index];

      this.push({name: field.name, value: codec.decode(value, field)});
    });
  }
  /**
   * Converts the Row object into a pojo (plain old JavaScript object).
   *
   * @param {JSONOptions} [options] JSON options.
   * @returns {object}
   */
  toJSON(options?: JSONOptions): RowJSON {
    return codec.generateToJSONFromRow(this)(options);
  }
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
export class PartialResultStream extends Transform {
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
    // If we have a chunk to merge, merge the values now.
    if (this._pendingValue) {
      const currentColumn = this._values.length % this._fields.length;
      const merged = PartialResultStream.merge(
          this._fields[currentColumn].type!, this._pendingValue,
          chunk.values.shift());

      chunk.values = [...merged, ...chunk.values];
      delete this._pendingValue;
    }

    // If the chunk is chunked, store the last value for merging with the next
    // chunk to be processed.
    if (chunk.chunkedValue) {
      this._pendingValue = chunk.values.pop();
    }

    chunk.values.map(PartialResultStream.getValue)
        .forEach(value => this._addValue(value));
  }
  /**
   * Manages complete values, pushing a completed row into the stream once all
   * values have been received.
   *
   * @private
   *
   * @param {*} value The complete value.
   */
  private _addValue(value: p.IValue): void {
    const values = this._values;

    values.push(value);

    if (values.length !== this._fields.length) {
      return;
    }

    this._values = [];

    let row: Row|RowJSON = new Row(this._fields, values);

    if (this._options.json) {
      row = row.toJSON(this._options.jsonOptions);
    }

    this.push(row);
  }
  /**
   * Checks to see if two values of the same type are mergeable.
   *
   * @static
   * @private
   *
   * @param {object} type The value type object.
   * @param {*} a The first value.
   * @param {*} b The second value.
   * @returns {boolean}
   */
  static isMergeable({code}: s.Type, a: p.IValue, b: p.IValue): boolean {
    return code !== 'FLOAT64' && !is.null(a) && !is.null(b);
  }
  /**
   * Attempts to unpack a value from a response.
   *
   * @static
   * @private
   *
   * @param {*} data The response data.
   * @returns {*} The unpacked value.
   */
  static getValue(data) {
    let value = data;

    if (data && data.kind) {
      value = Service.decodeValue_(data);
    }
    if (is.object(value) && value.values) {
      value = value.values;
    }

    return value;
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
  static merge(type: s.Type, head, tail): any[] {
    head = PartialResultStream.getValue(head);
    tail = PartialResultStream.getValue(tail);

    if (type.code === 'ARRAY') {
      const t = type.arrayElementType!;
      const merged = PartialResultStream.merge(t, head.pop(), tail.shift());

      return [[...head, ...merged, ...tail]];
    }

    if (type.code === 'STRUCT') {
      const t = type.structType!.fields[head.length - 1].type!;
      const merged = PartialResultStream.merge(t, head.pop(), tail.shift());

      return [[...head, ...merged, ...tail]];
    }

    if (PartialResultStream.isMergeable(type, head, tail)) {
      return [head + tail];
    }

    return [head, tail];
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
  let lastResumeToken;

  // mergeStream allows multiple streams to be connected into one. This is good;
  // if we need to retry a request and pipe more data to the user's stream.
  const requestsStream = mergeStream();
  const userStream = streamEvents(new PartialResultStream(options));
  const batchAndSplitOnTokenStream = checkpointStream.obj({
    maxQueued: 10,
    isCheckpointFn(row: s.PartialResultSet) {
      return is.defined(row.resumeToken);
    }
  });

  const makeRequest = () => {
    requestsStream.add(requestFn(lastResumeToken));
  };

  const retry = (err: Error) => {
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
