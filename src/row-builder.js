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

const codec = require('./codec.js');
const commonGrpc = require('@google-cloud/common-grpc');
const is = require('is');

/*!
 * Combine row chunks from multiple `PartialResultSet` API response objects.
 *
 * @private
 * @class
 */
function RowBuilder(fields) {
  this.fields = fields;
  this.chunks = [];
  this.rows = [[]];

  Object.defineProperty(this, 'currentRow', {
    get: function() {
      return this.rows[this.rows.length - 1];
    },
  });
}

/**
 * Extracts value from chunk.
 */
RowBuilder.getValue = function(obj) {
  let value = obj;

  if (obj && obj.kind) {
    value = commonGrpc.Service.decodeValue_(obj);
  }

  if (value && value.values) {
    value = value.values;
  }

  return value;
};

/**
 * Format a value into the expected structure, e.g. turn struct values into an
 * object.
 */
RowBuilder.formatValue = function(field, value) {
  if (value === 'NULL_VALUE') {
    return null;
  }

  if (field.code === 'ARRAY') {
    return value.map(function(value) {
      return RowBuilder.formatValue(field.arrayElementType, value);
    });
  }

  if (field.code !== 'STRUCT') {
    return codec.decode(value, field);
  }

  return field.structType.fields.reduce(function(struct, field, index) {
    struct[field.name] = RowBuilder.formatValue(field, value[index]);
    return struct;
  }, {});
};

/**
 * Merge chunk values.
 */
RowBuilder.merge = function(type, head, tail) {
  const code = type.code;

  head = RowBuilder.getValue(head);
  tail = RowBuilder.getValue(tail);

  const isMergeable = !is.nil(head) && !is.nil(tail) && code !== 'FLOAT64';
  const merged = [];
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
  return merged.filter(function(value) {
    return !is.string(value) || value.length;
  });
};

/**
 * Add a PartialResultSet response object to the pending rows.
 */
RowBuilder.prototype.addRow = function(row) {
  this.chunks = this.chunks.concat(row);
};

/**
 * Appends element to row.
 */
RowBuilder.prototype.append = function(value) {
  if (this.currentRow.length === this.fields.length) {
    this.rows.push([]);
  }
  this.currentRow.push(value);
};

/**
 * Process chunks.
 */
RowBuilder.prototype.build = function() {
  const self = this;

  this.chunks.forEach(function(chunk) {
    // If we have a chunk to merge, merge the values now.
    if (self.pendingChunk) {
      const currentColumn = self.currentRow.length % self.fields.length;
      const merged = RowBuilder.merge(
        self.fields[currentColumn].type,
        self.pendingChunk,
        chunk.values.shift()
      );
      chunk.values = merged.concat(chunk.values);
      delete self.pendingChunk;
    }

    // If the chunk is chunked, store the last value for merging with the next
    // chunk to be processed.
    if (chunk.chunkedValue) {
      self.pendingChunk = chunk.values.pop();
    }

    chunk.values.map(RowBuilder.getValue).forEach(self.append.bind(self));
  });

  // As chunks are now in rows, remove them.
  this.chunks.length = 0;
};

/**
 * Flush already complete rows.
 */
RowBuilder.prototype.flush = function() {
  const rowsToReturn = this.rows;

  if (
    !is.empty(this.rows[0]) &&
    this.currentRow.length !== this.fields.length
  ) {
    // Don't return the partial row. Hold onto it for the next iteration.
    this.rows = this.rows.splice(-1);
  } else {
    this.rows = [[]];
  }

  return rowsToReturn;
};

/**
 * Transforms values into JSON format.
 */
RowBuilder.prototype.toJSON = function(rows) {
  return rows.map(values => {
    const formattedRow = values.map((value, index) => {
      let field = this.fields[index];

      return {
        name: field.name,
        value: RowBuilder.formatValue(field, value),
      };
    });

    Object.defineProperty(formattedRow, 'toJSON', {
      enumerable: false,
      value: codec.generateToJSONFromRow(formattedRow),
    });

    return formattedRow;
  });
};

module.exports = RowBuilder;
