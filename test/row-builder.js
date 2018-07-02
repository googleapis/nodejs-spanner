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

var assert = require('assert');
var extend = require('extend');
var proxyquire = require('proxyquire');
var util = require('@google-cloud/common-grpc').util;

var codec = require('../src/codec');

var decodeOverride;
var generateToJSONFromRowOverride;
var fakeCodec = {
  decode: function() {
    return (decodeOverride || codec.decode).apply(null, arguments);
  },
  generateToJSONFromRow: function() {
    return (generateToJSONFromRowOverride || codec.generateToJSONFromRow).apply(
      null,
      arguments
    );
  },
};

function FakeGrpcService() {}

describe('RowBuilder', function() {
  var RowBuilder;
  var RowBuilderCached;
  var rowBuilder;

  var FIELDS = [{}, {}];

  before(function() {
    RowBuilder = proxyquire('../src/row-builder.js', {
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
      './codec.js': fakeCodec,
    });

    RowBuilderCached = extend({}, RowBuilder);
  });

  beforeEach(function() {
    FakeGrpcService.decodeValue_ = util.noop;
    decodeOverride = null;
    generateToJSONFromRowOverride = null;
    extend(RowBuilder, RowBuilderCached);
    rowBuilder = new RowBuilder(FIELDS);
  });

  describe('acceptance tests', function() {
    var TESTS = require('./data/streaming-read-acceptance-test.json').tests;

    TESTS.forEach(function(test) {
      it('should pass acceptance test: ' + test.name, function() {
        var fields = JSON.parse(test.chunks[0]).metadata.rowType.fields;
        var chunkJson = JSON.parse('[' + test.chunks.join() + ']');
        var builder = new RowBuilder(fields);
        builder.addRow(chunkJson);
        builder.build();

        assert.deepEqual(builder.rows, test.result.value);
      });
    });
  });

  describe('instantiation', function() {
    it('should localize fields', function() {
      assert.strictEqual(rowBuilder.fields, FIELDS);
    });

    it('should correctly initialize a chunks array', function() {
      assert.deepEqual(rowBuilder.chunks, []);
    });

    it('should correctly initialize a rows array', function() {
      assert.deepEqual(rowBuilder.rows, [[]]);
    });

    it('should return the last row when accessing currentRow', function() {
      var rows = [{}, {}];

      rowBuilder.rows.push(rows[0]);
      assert.strictEqual(rowBuilder.currentRow, rows[0]);

      rowBuilder.rows.push(rows[1]);
      assert.strictEqual(rowBuilder.currentRow, rows[1]);
    });
  });

  describe('getValue', function() {
    it('should do nothing to plain values', function() {
      var value = 'hi';

      assert.strictEqual(RowBuilder.getValue(value), value);
    });

    it('should decode using GrpcService module', function() {
      var value = {
        kind: 'stringValue',
      };

      var expectedValue = {};

      FakeGrpcService.decodeValue_ = function() {
        return expectedValue;
      };

      assert.strictEqual(RowBuilder.getValue(value), expectedValue);
    });

    it('should return value from arrays', function() {
      var value = {
        kind: 'listValue',
        listValue: {
          values: [],
        },
      };

      var expectedValue = {};

      FakeGrpcService.decodeValue_ = function() {
        return {
          values: expectedValue,
        };
      };

      assert.strictEqual(RowBuilder.getValue(value), expectedValue);
    });

    it('should accept null values', function() {
      var value = null;

      assert.strictEqual(RowBuilder.getValue(value), value);
    });
  });

  describe('formatValue', function() {
    it('should iterate an array', function() {
      var field = {
        code: 'ARRAY',
        arrayElementType: 'type',
      };

      var value = [{}];
      var decodedValue = {};

      decodeOverride = function(value_, field_) {
        assert.strictEqual(value_, value[0]);
        assert.strictEqual(field_, field.arrayElementType);
        return decodedValue;
      };

      var formattedValue = RowBuilder.formatValue(field, value);
      assert.deepStrictEqual(formattedValue, [decodedValue]);
    });

    it('should return null if value is NULL_VALUE', function() {
      var field = {
        code: 'ARRAY',
        arrayElementType: 'type',
      };

      var value = 'NULL_VALUE';

      var formattedValue = RowBuilder.formatValue(field, value);
      assert.strictEqual(formattedValue, null);
    });

    it('should return decoded value if not an array or struct', function() {
      var field = {
        code: 'NOT_STRUCT_OR_ARRAY',
      };

      var value = [{}];
      var decodedValue = {};

      decodeOverride = function(value_, field_) {
        assert.strictEqual(value_, value);
        assert.strictEqual(field_, field);
        return decodedValue;
      };

      var formattedValue = RowBuilder.formatValue(field, value);
      assert.strictEqual(formattedValue, decodedValue);
    });

    it('should iterate a struct', function() {
      var field = {
        code: 'STRUCT',
        structType: {
          fields: [
            {
              name: 'fieldName',
              type: 'NOT_STRUCT_OR_ARRAY', // so it returns original value
            },
          ],
        },
      };

      var value = [{}];
      var decodedValue = {};

      decodeOverride = function(value_, field_) {
        assert.strictEqual(value_, value[0]);
        assert.strictEqual(field_, field.structType.fields[0]);
        return decodedValue;
      };

      var formattedValue = RowBuilder.formatValue(field, value);
      assert.deepStrictEqual(formattedValue, {
        fieldName: decodedValue,
      });
    });
  });

  describe('merge', function() {
    it('should merge arrays', function() {
      var type = {
        code: 'ARRAY',
        arrayElementType: {
          code: 'FLOAT64', // so we break out of the fn w/o more processing
        },
      };

      var head = [1, 2];

      var tail = [3, 4];

      var merged = RowBuilder.merge(type, head, tail);
      assert.deepEqual(merged, [[1, 2, 3, 4]]);
    });

    it('should merge structs', function() {
      var type = {
        code: 'STRUCT',
        structType: {
          fields: [
            {},
            {
              type: {
                code: 'FLOAT64', // so we break out of the fn w/o more processing
              },
            },
          ],
        },
      };

      var head = [1, 2];

      var tail = [3, 4];

      var merged = RowBuilder.merge(type, head, tail);
      assert.deepEqual(merged, [[1, 2, 3, 4]]);
    });

    it('should merge numbers', function() {
      var type = {
        code: 'mergable-type', // any value but float64/array/struct
      };

      var head = 1;
      var tail = 2;

      var merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], 3);
    });

    it('should merge strings', function() {
      var type = {
        code: 'mergable-type', // any value but float64/array/struct
      };

      var head = 'a';
      var tail = 'b';

      var merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], 'ab');
    });

    it('should not merge null head values', function() {
      var type = {
        code: 'mergable-type', // any value but float64/array/struct
      };

      var head = null;
      var tail = 2;

      var merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], head);
      assert.strictEqual(merged[1], tail);
    });

    it('should not merge null tail values', function() {
      var type = {
        code: 'mergable-type', // any value but float64/array/struct
      };

      var head = 1;
      var tail = null;

      var merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], head);
      assert.strictEqual(merged[1], tail);
    });

    it('should not merge floats', function() {
      var type = {
        code: 'FLOAT64', // any value but float64/array/struct
      };

      var head = 1;
      var tail = 2;

      var merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], head);
      assert.strictEqual(merged[1], tail);
    });

    it('should filter out empty strings', function() {
      var type = {
        code: 'mergable-type', // any value but float64/array/struct
      };

      var head = '';
      var tail = 'string';

      var merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], tail);
    });
  });

  describe('addRow', function() {
    it('should combine row with chunks', function() {
      rowBuilder.chunks = [];

      var row = {};
      rowBuilder.addRow(row);

      assert.deepStrictEqual(rowBuilder.chunks, [row]);
    });
  });

  describe('append', function() {
    var ROWS = [[{}, {}], [{}, {}]];

    var ROW_1 = ROWS[0];
    var ROW_2 = ROWS[1];

    beforeEach(function() {
      rowBuilder.fields = [{}, {}]; // matches the # of objects in a row

      rowBuilder.rows = [
        ROW_1, // row 1 is complete
      ];
    });

    it('should create a new row if the last row is complete', function() {
      rowBuilder.append(ROW_2[0]);
      rowBuilder.append(ROW_2[1]);

      assert.strictEqual(rowBuilder.rows[0][0], ROW_1[0]);
      assert.strictEqual(rowBuilder.rows[0][1], ROW_1[1]);

      assert.strictEqual(rowBuilder.rows[1][0], ROW_2[0]);
      assert.strictEqual(rowBuilder.rows[1][1], ROW_2[1]);
    });

    it('should push a value into the current row if incomplete', function() {
      assert.strictEqual(rowBuilder.rows[0][0], ROW_1[0]);
      assert.strictEqual(rowBuilder.rows[0][1], ROW_1[1]);

      assert.strictEqual(rowBuilder.rows[1], undefined);

      rowBuilder.append(ROW_2[0]);

      assert.strictEqual(rowBuilder.rows[1][0], ROW_2[0]);
    });
  });

  describe('build', function() {
    beforeEach(function() {
      rowBuilder.chunks = [
        {
          values: [{}],
        },
      ];
    });

    it('should append values from a chunk', function(done) {
      rowBuilder.append = function(value) {
        assert.strictEqual(this, rowBuilder);
        assert.strictEqual(value, rowBuilder.chunks[0].values[0]);
        done();
      };

      rowBuilder.build();
    });

    it('should merge chunked values', function() {
      rowBuilder.rows = [[{}, {}], [{}]];

      rowBuilder.fields = [
        // length matches the # of values in a row
        {},
        {
          type: {},
        },
      ];

      rowBuilder.chunks = [
        {
          chunkedValue: true,
          values: [{}],
        },
        {
          values: [{}],
        },
      ];

      var expectedHead = rowBuilder.chunks[0].values[0];
      var expectedTail = rowBuilder.chunks[1].values[0];

      var mergedValues = [
        {
          merged: true,
        },
      ];

      RowBuilder.merge = function(type, head, tail) {
        assert.strictEqual(type, rowBuilder.fields[1].type);
        assert.strictEqual(head, expectedHead);
        assert.strictEqual(tail, expectedTail);
        return mergedValues;
      };

      rowBuilder.build();

      assert.strictEqual(mergedValues[0], rowBuilder.rows[1][1]);
    });

    it('should remove chunks', function() {
      rowBuilder.build();
      assert.deepStrictEqual(rowBuilder.chunks, []);
    });
  });

  describe('flush', function() {
    var ROWS = [[]];

    for (var i = 0; i < FIELDS.length; i++) {
      ROWS[0].push({});
    }

    beforeEach(function() {
      rowBuilder.rows = ROWS;
    });

    it('should return rows', function() {
      var expectedRows = rowBuilder.rows;
      assert.deepStrictEqual(rowBuilder.flush(), expectedRows);
    });

    it('should reset rows', function() {
      rowBuilder.flush();
      assert.deepEqual(rowBuilder.rows, [[]]);
    });

    it('should retain a partial row', function() {
      var partialRow = [{partial: true}];
      rowBuilder.rows = rowBuilder.rows.concat(partialRow);

      assert.deepStrictEqual(rowBuilder.flush(), ROWS);
      assert.deepStrictEqual(rowBuilder.rows, partialRow);
    });
  });

  describe('toJSON', function() {
    var ROWS = [[{}]];

    beforeEach(function() {
      rowBuilder.fields = [
        {
          name: 'fieldName',
          type: {},
        },
      ];
    });

    it('should format the values', function() {
      var formattedValue = {
        formatted: true,
      };

      RowBuilder.formatValue = function(field, value) {
        assert.strictEqual(field, rowBuilder.fields[0]);
        assert.strictEqual(value, ROWS[0][0]);
        return formattedValue;
      };

      var rows = rowBuilder.toJSON(ROWS);
      var row = rows[0];

      assert.deepEqual(row, [
        {
          name: 'fieldName',
          value: formattedValue,
        },
      ]);

      assert.deepEqual(row.toJSON(), {
        fieldName: formattedValue,
      });
    });

    describe('toJSON', function() {
      var toJSONOverride = function() {};
      var FORMATTED_ROW;

      beforeEach(function() {
        generateToJSONFromRowOverride = function() {
          return toJSONOverride;
        };

        var formattedValue = {};

        RowBuilder.formatValue = function() {
          return formattedValue;
        };

        rowBuilder.rows = [[{}]];

        FORMATTED_ROW = rowBuilder.toJSON(ROWS)[0];
      });

      it('should assign a toJSON method', function() {
        assert.strictEqual(FORMATTED_ROW.toJSON, toJSONOverride);
      });

      it('should not include toJSON when iterated', function() {
        for (var keyVal in FORMATTED_ROW) {
          if (keyVal === 'toJSON') {
            throw new Error('toJSON should not be iterated.');
          }
        }
      });
    });
  });
});
