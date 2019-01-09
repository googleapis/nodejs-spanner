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

import * as assert from 'assert';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import {Service} from '@google-cloud/common-grpc';

import {SpannerClient as s} from '../src/v1';

describe('codec', () => {
  let codec;

  const sandbox = sinon.createSandbox();

  before(() => {
    codec = proxyquire('../src/codec.js', {
              '@google-cloud/common-grpc': {Service},
            }).codec;
  });

  beforeEach(() => {
    sandbox.stub(Service, 'encodeValue_').callsFake(value => value);
    sandbox.stub(Service, 'decodeValue_').callsFake(value => value);
  });

  afterEach(() => sandbox.restore());

  describe('SpannerDate', () => {
    it('should choke on multiple arguments', () => {
      const expectedErrorMessage = [
        'The spanner.date function accepts a Date object or a',
        'single argument parseable by Date\'s constructor.',
      ].join(' ');

      assert.throws(() => {
        const x = new codec.SpannerDate(2012, 3, 21);
      }, new RegExp(expectedErrorMessage));
    });

    it('should create an instance from a string', () => {
      const spannerDate = new codec.SpannerDate('08-20-1969');
      assert.strictEqual(spannerDate.value, '1969-08-20');
    });

    it('should create an instance from a Date object', () => {
      const date = new Date();
      const spannerDate = new codec.SpannerDate(date);
      assert.strictEqual(spannerDate.value, date.toJSON().replace(/T.+/, ''));
    });
  });

  describe('Float', () => {
    it('should store the value', () => {
      const value = 8;
      const float = new codec.Float(value);

      assert.strictEqual(float.value, value);
    });

    it('should return as a float', () => {
      const value = '8.2';
      const float = new codec.Float(value);

      assert.strictEqual(float.valueOf(), Number(value));
      assert.strictEqual(float + 2, Number(value) + 2);
    });
  });

  describe('Int', () => {
    it('should stringify the value', () => {
      const value = 8;
      const int = new codec.Int(value);

      assert.strictEqual(int.value, '8');
    });

    it('should return as a number', () => {
      const value = 8;
      const int = new codec.Int(value);

      assert.strictEqual(int.valueOf(), 8);
      assert.strictEqual(int + 2, 10);
    });

    it('should throw if number is out of bounds', () => {
      const value = '9223372036854775807';
      const int = new codec.Int(value);

      assert.throws(() => {
        int.valueOf();
      }, new RegExp('Integer ' + value + ' is out of bounds.'));
    });
  });

  describe('Struct', () => {
    describe('toJSON', () => {
      it('should covert the struct to JSON', () => {
        const struct = new codec.Struct();
        const options = {};
        const fakeJson = {};

        const stub = sandbox.stub(codec, 'convertFieldsToJson')
                         .withArgs(struct, options)
                         .returns(fakeJson);

        assert.strictEqual(struct.toJSON(options), fakeJson);
      });
    });

    describe('fromArray', () => {
      it('should wrap the array in a struct', () => {
        const fields = [{name: 'name', value: 'value'}];
        const struct = codec.Struct.fromArray(fields);

        assert(struct instanceof codec.Struct);

        fields.forEach((field, i) => {
          assert.strictEqual(struct[i], field);
        });
      });
    });

    describe('fromJSON', () => {
      it('should covert json to a struct', () => {
        const json = {a: 'b', c: 'd'};
        const expected = [{name: 'a', value: 'b'}, {name: 'c', value: 'd'}];
        const struct = codec.Struct.fromJSON(json);

        assert(struct instanceof codec.Struct);

        expected.forEach((field, i) => {
          assert.deepStrictEqual(struct[i], field);
        });
      });
    });
  });

  describe('convertFieldsToJson', () => {
    const ROW = [
      {
        name: 'name',
        value: 'value',
      },
    ];

    it('should not require options', () => {
      assert.doesNotThrow(() => codec.convertFieldsToJson(ROW));
    });

    it('should return serialized rows', () => {
      const json = codec.convertFieldsToJson(ROW);

      assert.deepStrictEqual(json, {name: 'value'});
    });

    it('should not return nameless values', () => {
      const row = [
        {
          value: 'value',
        },
      ];

      const json = codec.convertFieldsToJson(row);
      assert.deepStrictEqual(json, {});
    });

    describe('structs', () => {
      it('should not wrap structs by default', () => {
        const options = {wrapNumbers: false, wrapStructs: false};
        const fakeStructJson = {};

        const struct = new codec.Struct();
        const stub = sandbox.stub(struct, 'toJSON').returns(fakeStructJson);

        const row = [
          {name: 'Struct', value: struct},
        ];

        const json = codec.convertFieldsToJson(row, options);

        assert.strictEqual(json.Struct, fakeStructJson);
        assert.deepStrictEqual(stub.lastCall.args[0], options);
      });

      it('should wrap structs with option', () => {
        const value = 3.3;

        const expectedStruct = codec.Struct.fromJSON({Number: value});
        const struct = codec.Struct.fromJSON({Number: new codec.Float(value)});

        const row = [
          {name: 'Struct', value: struct},
        ];

        const json = codec.convertFieldsToJson(row, {wrapStructs: true});
        assert.deepStrictEqual(json.Struct, expectedStruct);
      });
    });

    describe('numbers', () => {
      it('should not wrap numbers by default', () => {
        const row = [
          {
            name: 'Number',
            value: new codec.Int(3),
          },
        ];

        const json = codec.convertFieldsToJson(row);
        assert.strictEqual(typeof json.Number, 'number');
        assert.strictEqual(json.Number, 3);
      });

      it('should wrap numbers with option', () => {
        const int = new codec.Int(3);

        const row = [
          {
            name: 'Number',
            value: int,
          },
        ];

        const json = codec.convertFieldsToJson(row, {wrapNumbers: true});

        assert(json.Number instanceof codec.Int);
        assert.deepStrictEqual(json.Number, int);
      });

      it('should throw an error if number is out of bounds', () => {
        const int = new codec.Int('9223372036854775807');

        const row = [
          {
            name: 'Number',
            value: int,
          },
        ];

        assert.throws(() => {
          codec.convertFieldsToJson(row);
        }, new RegExp('Serializing column "Number" encountered an error'));
      });
    });

    describe('arrays', () => {
      it('should not wrap numbers by default', () => {
        const value = 3;

        const row = [
          {
            name: 'List',
            value: [new codec.Int(value)],
          },
        ];

        const json = codec.convertFieldsToJson(row);
        assert.deepStrictEqual(json.List, [value]);
      });

      it('should wrap numbers with option', () => {
        const value = new codec.Int(3);

        const row = [{name: 'List', value: [value]}];

        const json = codec.convertFieldsToJson(row, {wrapNumbers: true});
        assert.deepStrictEqual(json.List, [value]);
      });

      it('should not wrap structs by default', () => {
        const struct = new codec.Struct();
        const expectedStruct = {a: 'b', c: 'd'};

        sandbox.stub(struct, 'toJSON').returns(expectedStruct);

        const row = [{name: 'List', value: [struct]}];

        const json = codec.convertFieldsToJson(row);
        assert.deepStrictEqual(json.List, [expectedStruct]);
      });

      it('should wrap structs with option', () => {
        const expectedStruct = codec.Struct.fromJSON({a: 'b', c: 'd'});

        const row = [{name: 'List', value: [expectedStruct]}];

        const json = codec.convertFieldsToJson(row, {wrapStructs: true});
        assert.deepStrictEqual(json.List, [expectedStruct]);
      });
    });
  });

  describe('decode', () => {
    // Does not require any special decoding.
    const BYPASS_FIELD = {
      code: 'not-real-code',
    };

    it('should return the same value if not a special type', () => {
      const value = {};

      const decoded = codec.decode(value, BYPASS_FIELD);
      assert.strictEqual(decoded, value);
    });

    it('should return null values as null', () => {
      (Service.decodeValue_ as sinon.SinonStub).returns(null);
      const decoded = codec.decode(null, BYPASS_FIELD);
      assert.strictEqual(decoded, null);
    });

    it('should decode BYTES', () => {
      const expected = Buffer.from('bytes value');
      const encoded = expected.toString('base64');

      const decoded = codec.decode(encoded, {
        code: s.TypeCode.BYTES,
      });

      assert.deepStrictEqual(decoded, expected);
    });

    it('should decode FLOAT64', () => {
      const value = 'Infinity';

      const decoded = codec.decode(value, {
        code: s.TypeCode.FLOAT64,
      });

      assert(decoded instanceof codec.Float);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode INT64', () => {
      const value = '64';

      const decoded = codec.decode(value, {
        code: s.TypeCode.INT64,
      });

      assert(decoded instanceof codec.Int);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode TIMESTAMP', () => {
      const value = new Date();

      const decoded = codec.decode(value.toJSON(), {
        code: s.TypeCode.TIMESTAMP,
      });

      assert.deepStrictEqual(decoded, value);
    });

    it('should decode DATE', () => {
      const value = new Date();

      const decoded = codec.decode(value.toJSON(), {
        code: s.TypeCode.DATE,
      });

      assert.deepStrictEqual(decoded, value);
    });

    it('should decode ARRAY and inner members', () => {
      const value = ['1'];

      const decoded = codec.decode(value, {
        code: s.TypeCode.ARRAY,
        arrayElementType: {
          code: s.TypeCode.INT64,
        },
      });

      assert(decoded[0] instanceof codec.Int);
    });

    it('should decode STRUCT and inner members', () => {
      const value = {
        fieldName: '1',
      };

      const decoded = codec.decode(value, {
        code: s.TypeCode.STRUCT,
        structType: {
          fields: [
            {
              name: 'fieldName',
              type: {
                code: s.TypeCode.INT64,
              },
            },
          ],
        },
      });

      const expectedStruct = new codec.Struct({
        name: 'fieldName',
        value: new codec.Int(value.fieldName),
      });

      assert(decoded instanceof codec.Struct);
      assert.deepStrictEqual(decoded, expectedStruct);
    });
  });

  describe('encode', () => {
    it('should return the value from the common encoder', () => {
      const value = {};
      const defaultEncodedValue = {};

      (Service.encodeValue_ as sinon.SinonStub)
          .withArgs(value)
          .returns(defaultEncodedValue);

      const encoded = codec.encode(value);
      assert.strictEqual(encoded, defaultEncodedValue);
    });

    it('should encode BYTES', () => {
      const value = Buffer.from('bytes value');

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString('base64'));
    });

    it('should encode structs', () => {
      const value = codec.Struct.fromJSON({a: 'b', c: 'd'});
      const encoded = codec.encode(value);
      assert.deepStrictEqual(encoded, ['b', 'd']);
    });

    it('should stringify Infinity', () => {
      const value = Infinity;
      const encoded = codec.encode(value);
      assert.strictEqual(encoded, value.toString());
    });

    it('should stringify -Infinity', () => {
      const value = -Infinity;

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should stringify NaN', () => {
      const value = NaN;

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should stringify INT64', () => {
      const value = 5;

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should encode ARRAY and inner members', () => {
      const value = [5];

      const encoded = codec.encode(value);

      assert.deepStrictEqual(encoded, [
        value.toString(),  // (tests that it is stringified)
      ]);
    });

    it('should encode TIMESTAMP', () => {
      const value = new Date();

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toJSON());
    });

    it('should encode DATE', () => {
      const value = new codec.SpannerDate();

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.value);
    });

    it('should encode INT64', () => {
      const value = new codec.Int(10);

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, '10');
    });

    it('should encode FLOAT64', () => {
      const value = new codec.Float(10);

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, 10);
    });
  });

  describe('getType', () => {
    it('should determine if the value is a boolean', () => {
      assert.deepStrictEqual(codec.getType(true), {type: 'bool'});
    });

    it('should determine if the value is a float', () => {
      assert.deepStrictEqual(codec.getType(NaN), {type: 'float64'});
      assert.deepStrictEqual(codec.getType(Infinity), {type: 'float64'});
      assert.deepStrictEqual(codec.getType(-Infinity), {type: 'float64'});
      assert.deepStrictEqual(codec.getType(2.2), {type: 'float64'});
      assert.deepStrictEqual(
          codec.getType(new codec.Float(1.1)), {type: 'float64'});
    });

    it('should determine if the value is an int', () => {
      assert.deepStrictEqual(codec.getType(1234), {type: 'int64'});
      assert.deepStrictEqual(codec.getType(new codec.Int(1)), {type: 'int64'});
    });

    it('should determine if the value is a string', () => {
      assert.deepStrictEqual(codec.getType('abc'), {type: 'string'});
    });

    it('should determine if the value is bytes', () => {
      assert.deepStrictEqual(
          codec.getType(Buffer.from('abc')), {type: 'bytes'});
    });

    it('should determine if the value is a timestamp', () => {
      assert.deepStrictEqual(codec.getType(new Date()), {type: 'timestamp'});
    });

    it('should determine if the value is a date', () => {
      assert.deepStrictEqual(
          codec.getType(new codec.SpannerDate()), {type: 'date'});
    });

    it('should determine if the value is a struct', () => {
      const struct = codec.Struct.fromJSON({a: 'b'});
      const type = codec.getType(struct);

      assert.deepStrictEqual(type, {
        type: 'struct',
        fields: [
          {name: 'a', type: 'string'},
        ]
      });
    });

    it('should attempt to determine arrays and their values', () => {
      assert.deepStrictEqual(codec.getType([Infinity]), {
        type: 'array',
        child: {
          type: 'float64',
        }
      });
    });

    it('should return unspecified for unknown values', () => {
      assert.deepStrictEqual(codec.getType(null), {type: 'unspecified'});

      assert.deepStrictEqual(codec.getType([null]), {
        type: 'array',
        child: {
          type: 'unspecified',
        }
      });
    });
  });

  describe('encodeQuery', () => {
    const SQL = 'SELECT * FROM table';
    const QUERY = {
      sql: SQL,
    };

    it('should return the query', () => {
      const encodedQuery = codec.encodeQuery(QUERY);

      assert.deepStrictEqual(QUERY, encodedQuery);
    });

    it('should clone the query', () => {
      const encodedQuery = codec.encodeQuery(QUERY);
      assert.notStrictEqual(QUERY, encodedQuery);

      delete encodedQuery.sql;
      assert.strictEqual(QUERY.sql, SQL);
    });

    it('should encode query parameters', () => {
      const encodedValue = {};
      const fakeQuery = Object.assign({}, QUERY, {params: {test: 'value'}});

      sandbox.stub(codec, 'encode')
          .withArgs(fakeQuery.params.test)
          .returns(encodedValue);

      const encodedQuery = codec.encodeQuery(fakeQuery);
      assert.strictEqual(encodedQuery.params.fields.test, encodedValue);
    });

    it('should attempt to guess the parameter types', () => {
      const params = {
        unspecified: null,
        bool: true,
        int64: 1234,
        float64: 2.2,
        timestamp: new Date(),
        date: new codec.SpannerDate(),
        string: 'abc',
        bytes: Buffer.from('abc'),
      };

      const fakeQuery = Object.assign({}, QUERY, {params});
      const encodedQuery = codec.encodeQuery(fakeQuery);

      assert.deepStrictEqual(encodedQuery.paramTypes, {
        unspecified: {
          code: s.TypeCode.TYPE_CODE_UNSPECIFIED,
        },
        bool: {
          code: s.TypeCode.BOOL,
        },
        int64: {
          code: s.TypeCode.INT64,
        },
        float64: {
          code: s.TypeCode.FLOAT64,
        },
        timestamp: {
          code: s.TypeCode.TIMESTAMP,
        },
        date: {
          code: s.TypeCode.DATE,
        },
        string: {
          code: s.TypeCode.STRING,
        },
        bytes: {
          code: s.TypeCode.BYTES,
        },
      });
    });

    it('should not overwrite existing type definitions', () => {
      const fakeQuery = Object.assign({}, QUERY, {
        params: {
          test: 123,
        },
        types: {
          test: 'string',
        },
      });

      sandbox.stub(codec, 'getType').throws();

      const query = codec.encodeQuery(fakeQuery);

      assert.deepStrictEqual(
          query.paramTypes, {test: {code: s.TypeCode.STRING}});
    });

    it('should delete the type map from the request options', () => {
      const fakeQuery = {
        params: {
          test: 'abc',
        },
        types: {
          test: 'string',
        },
      };

      const encodedQuery = codec.encodeQuery(fakeQuery);
      assert.strictEqual(encodedQuery.types, undefined);
    });
  });

  describe('encodeRead', () => {
    it('should return all keys if ranges/keys are absent', () => {
      const encoded = codec.encodeRead({});

      assert.deepStrictEqual(encoded, {keySet: {all: true}});
    });

    describe('query.keys', () => {
      it('should encode and map input to keySet', () => {
        const keyMap = {key: {}, composite: {}, key2: {}};

        const query = {
          keys: [
            'key', ['composite', 'key2'],  // composite key
          ],
        };

        const stub = sandbox.stub(codec, 'encode');

        Object.keys(keyMap).forEach(key => {
          stub.withArgs(key).returns(keyMap[key]);
        });

        const expectedKeys = [
          {
            values: [keyMap.key],
          },
          {
            values: [keyMap.composite, keyMap.key2],
          },
        ];

        const encoded = codec.encodeRead(query);
        assert.deepStrictEqual(encoded.keySet.keys, expectedKeys);
      });

      it('should arrify query.keys', () => {
        const query = {keys: 'key'};
        const encodedValue = {};

        sandbox.stub(codec, 'encode')
            .withArgs(query.keys)
            .returns(encodedValue);

        const encoded = codec.encodeRead(query);
        assert.strictEqual(encoded.keySet.keys[0].values[0], encodedValue);
      });

      it('should remove keys property from request object', () => {
        const query = {
          keys: ['key'],
        };

        const encoded = codec.encodeRead(query);
        assert.strictEqual(encoded.keys, undefined);
      });
    });

    describe('query.ranges', () => {
      it('should encode/map the inputs', () => {
        const keyMap = {key: {}, composite: {}, key2: {}};

        const query = {
          ranges: [
            {
              startOpen: 'key',
              endClosed: ['composite', 'key2'],
            },
          ],
        };

        const stub = sandbox.stub(codec, 'encode');

        Object.keys(keyMap).forEach(key => {
          stub.withArgs(key).returns(keyMap[key]);
        });

        const expectedRanges = [
          {
            startOpen: {
              values: [keyMap.key],
            },
            endClosed: {
              values: [keyMap.composite, keyMap.key2],
            },
          },
        ];

        const encoded = codec.encodeRead(query);
        assert.deepStrictEqual(encoded.keySet.ranges, expectedRanges);
      });

      it('should arrify query.ranges', () => {
        const keyMap = {start: {}, end: {}};

        const query = {
          ranges: [
            {
              startOpen: 'start',
              endClosed: 'end',
            },
          ],
        };

        const stub = sandbox.stub(codec, 'encode');

        Object.keys(keyMap).forEach(key => {
          stub.withArgs(key).returns(keyMap[key]);
        });

        const expectedRanges = [
          {
            startOpen: {
              values: [keyMap.start],
            },
            endClosed: {
              values: [keyMap.end],
            },
          },
        ];

        const encoded = codec.encodeRead(query);
        assert.deepStrictEqual(encoded.keySet.ranges, expectedRanges);
      });

      it('should remove the ranges property from the query', () => {
        const query = {
          ranges: [
            {
              startOpen: 'start',
              endClosed: 'end',
            },
          ],
        };

        const encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.ranges, undefined);
      });
    });
  });

  describe('createTypeObject', () => {
    it('should convert strings to the corresponding type', () => {
      const typeMap = {
        unspecified: {
          code: s.TypeCode.TYPE_CODE_UNSPECIFIED,
        },
        bool: {
          code: s.TypeCode.BOOL,
        },
        int64: {
          code: s.TypeCode.INT64,
        },
        float64: {
          code: s.TypeCode.FLOAT64,
        },
        timestamp: {
          code: s.TypeCode.TIMESTAMP,
        },
        date: {
          code: s.TypeCode.DATE,
        },
        string: {
          code: s.TypeCode.STRING,
        },
        bytes: {
          code: s.TypeCode.BYTES,
        },
        array: {
          code: s.TypeCode.ARRAY,
          arrayElementType: {
            code: s.TypeCode.TYPE_CODE_UNSPECIFIED,
          }
        },
        struct: {
          code: s.TypeCode.STRUCT,
          structType: {fields: []},
        }
      };

      Object.keys(typeMap).forEach(key => {
        const type = codec.createTypeObject(key);
        assert.deepStrictEqual(type, typeMap[key]);
      });
    });

    it('should default to unspecified for unknown types', () => {
      const type = codec.createTypeObject('unicorn');

      assert.deepStrictEqual(type, {
        code: s.TypeCode.TYPE_CODE_UNSPECIFIED,
      });
    });

    it('should set the arrayElementType', () => {
      const type = codec.createTypeObject({
        type: 'array',
        child: 'bool',
      });

      assert.deepStrictEqual(type, {
        code: s.TypeCode.ARRAY,
        arrayElementType: {
          code: s.TypeCode.BOOL,
        },
      });
    });

    it('should set the struct fields', () => {
      const type = codec.createTypeObject({
        type: 'struct',
        fields: [
          {name: 'boolKey', type: 'bool'},
          {name: 'intKey', type: 'int64'},
        ],
      });

      assert.deepStrictEqual(type, {
        code: s.TypeCode.STRUCT,
        structType: {
          fields: [
            {
              name: 'boolKey',
              type: {
                code: s.TypeCode.BOOL,
              },
            },
            {
              name: 'intKey',
              type: {
                code: s.TypeCode.INT64,
              },
            },
          ],
        },
      });
    });

    it('should handle nested structs', () => {
      const type = codec.createTypeObject({
        type: 'struct',
        fields: [
          {
            name: 'nestedStruct',
            type: 'struct',
            fields: [
              {
                type: 'bool',
                name: 'boolKey',
              },
            ],
          },
        ],
      });

      assert.deepStrictEqual(type, {
        code: s.TypeCode.STRUCT,
        structType: {
          fields: [
            {
              name: 'nestedStruct',
              type: {
                code: s.TypeCode.STRUCT,
                structType: {
                  fields: [
                    {
                      name: 'boolKey',
                      type: {
                        code: s.TypeCode.BOOL,
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      });
    });
  });
});
