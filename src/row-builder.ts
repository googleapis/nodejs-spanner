/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import {codec} from './codec';
import {Service} from '@google-cloud/common-grpc';
import * as is from 'is';

/*!
 * Combine row chunks from multiple `PartialResultSet` API response objects.
 *
 * @private
 * @class
 */
class RowBuilder {
  fields;
  chunks;
  rows;
  currentRow;
  pendingChunk;
  constructor(fields) {
    this.fields = fields;
    this.chunks = [];
    this.rows = [[]];
    Object.defineProperty(this, 'currentRow', {
      get() {
        return this.rows[this.rows.length - 1];
      },
    });
  }
  /**
   * Add a PartialResultSet response object to the pending rows.
   *
   * @param {array} row Row values
   */
  addRow(row) {
    this.chunks = this.chunks.concat(row);
  }
  /**
   * Appends element to row.
   *
   * @param {*} value Row value
   */
  append(value) {
    if (this.currentRow.length === this.fields.length) {
      this.rows.push([]);
    }
    this.currentRow.push(value);
  }
  /**
   * Process chunks.
   */
  build() {
    this.chunks.forEach(chunk => {
      // If we have a chunk to merge, merge the values now.
      if (this.pendingChunk) {
        const currentColumn = this.currentRow.length % this.fields.length;
        const merged = RowBuilder.merge(
            this.fields[currentColumn].type, this.pendingChunk,
            chunk.values.shift());
        chunk.values = merged.concat(chunk.values);
        delete this.pendingChunk;
      }
      // If the chunk is chunked, store the last value for merging with the next
      // chunk to be processed.
      if (chunk.chunkedValue) {
        this.pendingChunk = chunk.values.pop();
      }
      chunk.values.map(RowBuilder.getValue).forEach(this.append.bind(this));
    });
    // As chunks are now in rows, remove them.
    this.chunks.length = 0;
  }
  /**
   * Flush already complete rows.
   *
   * @returns {array}
   */
  flush() {
    const rowsToReturn = this.rows;
    if (!is.empty(this.rows[0]) &&
        this.currentRow.length !== this.fields.length) {
      // Don't return the partial row. Hold onto it for the next iteration.
      this.rows = this.rows.splice(-1);
    } else {
      this.rows = [[]];
    }
    return rowsToReturn;
  }
  /**
   * Transforms values into JSON format.
   *
   * @param {array[]} rows Rows to convert to JSON.
   * @returns {object[]}
   */
  toJSON(rows) {
    return rows.map(values => {
      const formattedRow = values.map((value, index) => {
        const field = this.fields[index];
        return {
          name: field.name,
          value: codec.decode(value, field.type),
        };
      });
      Object.defineProperty(formattedRow, 'toJSON', {
        enumerable: false,
        value: options => codec.convertFieldsToJson(formattedRow, options),
      });
      return formattedRow;
    });
  }
  /**
   * Extracts value from chunk.
   *
   * @param {object} obj Row value object.
   * @returns {*}
   */
  static getValue(obj) {
    let value = obj;
    if (obj && obj.kind) {
      // tslint:disable-next-line no-any
      value = (Service as any).decodeValue_(obj);
    }
    if (is.object(value) && value.values) {
      value = value.values;
    }
    return value;
  }
  /**
   * Merge chunk values.
   *
   * @param {object} type Field type
   * @param {object} head Field value
   * @param {object} tail Field value
   * @return {array}
   */
  static merge(type, head, tail) {
    const code = type.code;
    head = RowBuilder.getValue(head);
    tail = RowBuilder.getValue(tail);
    const isMergeable = !is.null(head) && !is.null(tail) && code !== 'FLOAT64';
    const merged: Array<{}> = [];
    let mergedItems;
    if (code === 'ARRAY') {
      const arrayType = type.arrayElementType;
      mergedItems = RowBuilder.merge(arrayType, head.pop(), tail.shift());
      merged.push(head.concat(mergedItems).concat(tail));
    } else if (code === 'STRUCT') {
      const structType = type.structType.fields[head.length - 1].type;
      mergedItems = RowBuilder.merge(structType, head.pop(), tail.shift());
      merged.push(head.concat(mergedItems).concat(tail));
    } else if (isMergeable) {
      merged.push(head + tail);
    } else {
      merged.push(head, tail);
    }
    // Filter out empty strings.
    return merged.filter(value => {
      return !is.string(value) || (value as string).length;
    });
  }
}

export {RowBuilder};
