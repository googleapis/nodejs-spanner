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

import {util} from '@google-cloud/common-grpc';
import * as assert from 'assert';
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import {codec} from '../src/codec';
import * as rb from '../src/row-builder';
import {SpannerClient as s} from '../src/v1';

class FakeGrpcService {
  static decodeValue_(value) {}
}

describe('RowBuilder', () => {
  // tslint:disable-next-line variable-name
  let RowBuilder: typeof rb.RowBuilder;
  // tslint:disable-next-line variable-name
  let RowBuilderCached: typeof rb.RowBuilder;
  let rowBuilder: rb.RowBuilder;

  const sandbox = sinon.createSandbox();
  const FIELDS = [{}, {}];

  before(() => {
    RowBuilder = proxyquire('../src/row-builder.js', {
                   '@google-cloud/common-grpc': {
                     Service: FakeGrpcService,
                   },
                   './codec.js': {codec},
                 }).RowBuilder;
    RowBuilderCached = extend({}, RowBuilder);
  });

  beforeEach(() => {
    FakeGrpcService.decodeValue_ = util.noop;
    extend(RowBuilder, RowBuilderCached);
    rowBuilder = new RowBuilder(FIELDS);
  });

  afterEach(() => sandbox.restore());

  describe('acceptance tests', () => {
    const TESTS =
        require('../../test/data/streaming-read-acceptance-test.json').tests;

    TESTS.forEach(test => {
      it('should pass acceptance test: ' + test.name, () => {
        const fields = JSON.parse(test.chunks[0]).metadata.rowType.fields;
        const chunkJson = JSON.parse('[' + test.chunks.join() + ']');
        const builder = new RowBuilder(fields);
        builder.addRow(chunkJson);
        builder.build();

        assert.deepStrictEqual(builder.rows, test.result.value);
      });
    });
  });

  describe('instantiation', () => {
    it('should localize fields', () => {
      assert.strictEqual(rowBuilder.fields, FIELDS);
    });

    it('should correctly initialize a chunks array', () => {
      assert.deepStrictEqual(rowBuilder.chunks, []);
    });

    it('should correctly initialize a rows array', () => {
      assert.deepStrictEqual(rowBuilder.rows, [[]]);
    });

    it('should return the last row when accessing currentRow', () => {
      const rows = [{}, {}];

      rowBuilder.rows.push(rows[0]);
      assert.strictEqual(rowBuilder.currentRow, rows[0]);

      rowBuilder.rows.push(rows[1]);
      assert.strictEqual(rowBuilder.currentRow, rows[1]);
    });
  });

  describe('getValue', () => {
    it('should do nothing to plain values', () => {
      const value = 'hi';

      assert.strictEqual(RowBuilder.getValue(value), value);
    });

    it('should decode using GrpcService module', () => {
      const value = {
        kind: 'stringValue',
      };

      const expectedValue = {};

      FakeGrpcService.decodeValue_ = () => {
        return expectedValue;
      };

      assert.strictEqual(RowBuilder.getValue(value), expectedValue);
    });

    it('should return value from arrays', () => {
      const value = {
        kind: 'listValue',
        listValue: {
          values: [],
        },
      };

      const expectedValue = {};

      FakeGrpcService.decodeValue_ = () => {
        return {
          values: expectedValue,
        };
      };

      assert.strictEqual(RowBuilder.getValue(value), expectedValue);
    });

    it('should only return the values property from objects', () => {
      const value = [];

      Object.defineProperty(value, 'values', {
        get() {
          return () => {};
        },
      });

      FakeGrpcService.decodeValue_ = () => {
        return value;
      };

      assert.strictEqual(RowBuilder.getValue(value), value);
    });

    it('should accept null values', () => {
      const value = null;

      assert.strictEqual(RowBuilder.getValue(value), value);
    });
  });

  describe('merge', () => {
    it('should merge arrays', () => {
      const type = {
        code: 'ARRAY',
        arrayElementType: {
          code: 'FLOAT64',  // so we break out of the fn w/o more processing
        },
      };

      const head = [1, 2];

      const tail = [3, 4];

      const merged = RowBuilder.merge(type, head, tail);
      assert.deepStrictEqual(merged, [[1, 2, 3, 4]]);
    });

    it('should merge structs', () => {
      const type = {
        code: 'STRUCT',
        structType: {
          fields: [
            {},
            {
              type: {
                code:
                    'FLOAT64',  // so we break out of the fn w/o more processing
              },
            },
          ],
        },
      };

      const head = [1, 2];

      const tail = [3, 4];

      const merged = RowBuilder.merge(type, head, tail);
      assert.deepStrictEqual(merged, [[1, 2, 3, 4]]);
    });

    it('should merge numbers', () => {
      const type = {
        code: 'mergable-type',  // any value but float64/array/struct
      };

      const head = 1;
      const tail = 2;

      const merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], 3);
    });

    it('should merge strings', () => {
      const type = {
        code: 'mergable-type',  // any value but float64/array/struct
      };

      const head = 'a';
      const tail = 'b';

      const merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], 'ab');
    });

    it('should not merge null head values', () => {
      const type = {
        code: 'mergable-type',  // any value but float64/array/struct
      };

      const head = null;
      const tail = 2;

      const merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], head);
      assert.strictEqual(merged[1], tail);
    });

    it('should not merge null tail values', () => {
      const type = {
        code: 'mergable-type',  // any value but float64/array/struct
      };

      const head = 1;
      const tail = null;

      const merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], head);
      assert.strictEqual(merged[1], tail);
    });

    it('should not merge floats', () => {
      const type = {
        code: 'FLOAT64',  // any value but float64/array/struct
      };

      const head = 1;
      const tail = 2;

      const merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], head);
      assert.strictEqual(merged[1], tail);
    });

    it('should filter out empty strings', () => {
      const type = {
        code: 'mergable-type',  // any value but float64/array/struct
      };

      const head = '';
      const tail = 'string';

      const merged = RowBuilder.merge(type, head, tail);
      assert.strictEqual(merged[0], tail);
    });
  });

  describe('addRow', () => {
    it('should combine row with chunks', () => {
      rowBuilder.chunks = [];

      const row = {};
      rowBuilder.addRow(row);

      assert.deepStrictEqual(rowBuilder.chunks, [row]);
    });
  });

  describe('append', () => {
    const ROWS = [[{}, {}], [{}, {}]];

    const ROW_1 = ROWS[0];
    const ROW_2 = ROWS[1];

    beforeEach(() => {
      rowBuilder.fields = [{}, {}];  // matches the # of objects in a row

      rowBuilder.rows = [
        ROW_1,  // row 1 is complete
      ];
    });

    it('should create a new row if the last row is complete', () => {
      rowBuilder.append(ROW_2[0]);
      rowBuilder.append(ROW_2[1]);

      assert.strictEqual(rowBuilder.rows[0][0], ROW_1[0]);
      assert.strictEqual(rowBuilder.rows[0][1], ROW_1[1]);

      assert.strictEqual(rowBuilder.rows[1][0], ROW_2[0]);
      assert.strictEqual(rowBuilder.rows[1][1], ROW_2[1]);
    });

    it('should push a value into the current row if incomplete', () => {
      assert.strictEqual(rowBuilder.rows[0][0], ROW_1[0]);
      assert.strictEqual(rowBuilder.rows[0][1], ROW_1[1]);

      assert.strictEqual(rowBuilder.rows[1], undefined);

      rowBuilder.append(ROW_2[0]);

      assert.strictEqual(rowBuilder.rows[1][0], ROW_2[0]);
    });
  });

  describe('build', () => {
    beforeEach(() => {
      rowBuilder.chunks = [
        {
          values: [{}],
        },
      ];
    });

    it('should append values from a chunk', done => {
      rowBuilder.append = function(value) {
        assert.strictEqual(this, rowBuilder);
        assert.strictEqual(value, rowBuilder.chunks[0].values[0]);
        done();
      };

      rowBuilder.build();
    });

    it('should merge chunked values', () => {
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

      const expectedHead = rowBuilder.chunks[0].values[0];
      const expectedTail = rowBuilder.chunks[1].values[0];

      const mergedValues = [
        {
          merged: true,
        },
      ];

      RowBuilder.merge = (type, head, tail) => {
        assert.strictEqual(type, rowBuilder.fields[1].type);
        assert.strictEqual(head, expectedHead);
        assert.strictEqual(tail, expectedTail);
        return mergedValues;
      };

      rowBuilder.build();

      assert.strictEqual(mergedValues[0], rowBuilder.rows[1][1]);
    });

    it('should remove chunks', () => {
      rowBuilder.build();
      assert.deepStrictEqual(rowBuilder.chunks, []);
    });
  });

  describe('flush', () => {
    const ROWS: Array<Array<{}>> = [[]];

    for (let i = 0; i < FIELDS.length; i++) {
      ROWS[0].push({});
    }

    beforeEach(() => {
      rowBuilder.rows = ROWS;
    });

    it('should return rows', () => {
      const expectedRows = rowBuilder.rows;
      assert.deepStrictEqual(rowBuilder.flush(), expectedRows);
    });

    it('should reset rows', () => {
      rowBuilder.flush();
      assert.deepStrictEqual(rowBuilder.rows, [[]]);
    });

    it('should retain a partial row', () => {
      const partialRow = [{partial: true}];
      rowBuilder.rows = rowBuilder.rows.concat(partialRow);

      assert.deepStrictEqual(rowBuilder.flush(), ROWS);
      assert.deepStrictEqual(rowBuilder.rows, partialRow);
    });
  });

  describe('toJSON', () => {
    const ROWS = [[{}]];

    beforeEach(() => {
      rowBuilder.fields = [
        {
          name: 'fieldName',
          type: {},
        },
      ];
    });

    it('should format the values', () => {
      const value = ROWS[0][0];
      const type = rowBuilder.fields[0].type;

      const formattedValue = {
        formatted: true,
      };

      sinon.stub(codec, 'decode').withArgs(value, type).returns(formattedValue);

      const rows = rowBuilder.toJSON(ROWS);
      const row = rows[0];

      assert.deepStrictEqual(row, [
        {
          name: 'fieldName',
          value: formattedValue,
        },
      ]);

      assert.deepStrictEqual(row.toJSON(), {
        fieldName: formattedValue,
      });
    });

    describe('Row#toJSON', () => {
      let FORMATTED_ROW;

      beforeEach(() => {
        FORMATTED_ROW = rowBuilder.toJSON(ROWS)[0];
      });

      it('should assign a toJSON method', () => {
        const fakeJson = {};
        const fakeOptions = {wrapNumbers: false};

        sandbox.stub(codec, 'convertFieldsToJson')
            .withArgs(FORMATTED_ROW, fakeOptions)
            .returns(fakeJson);

        const json = FORMATTED_ROW.toJSON(fakeOptions);
        assert.strictEqual(json, fakeJson);
      });

      it('should not include toJSON when iterated', () => {
        for (const keyVal in FORMATTED_ROW) {
          if (keyVal === 'toJSON') {
            throw new Error('toJSON should not be iterated.');
          }
        }
      });
    });
  });
});
