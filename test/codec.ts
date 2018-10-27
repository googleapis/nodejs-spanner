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
const extend = require('extend');
const proxyquire = require('proxyquire');
const {util} = require('@google-cloud/common-grpc');

const FakeGrpcService: any = class {};

describe('codec', () => {
  let codecCached;
  let codec;

  const TYPES = [
    'unspecified',
    'bool',
    'int64',
    'float64',
    'timestamp',
    'date',
    'string',
    'bytes',
    'array',
    'struct',
  ];

  before(() => {
    codec = proxyquire('../src/codec.js', {
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
    });
    codecCached = extend({}, codec);
  });

  beforeEach(() => {
    extend(codec, codecCached);
    FakeGrpcService.encodeValue_ = util.noop;
    FakeGrpcService.decodeValue_ = util.noop;
  });

  describe('SpannerDate', () => {
    it('should choke on multiple arguments', () => {
      const expectedErrorMessage = [
        'The spanner.date function accepts a Date object or a',
        "single argument parseable by Date's constructor.",
      ].join(' ');

      assert.throws(() => {
        new codec.SpannerDate(2012, 3, 21);
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

      assert.strictEqual(float.valueOf(), parseFloat(value));
      assert.strictEqual(float + 2, parseFloat(value) + 2);
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
    let generateToJSONFromRow_;

    before(() => {
      generateToJSONFromRow_ = codec.generateToJSONFromRow;
    });

    afterEach(() => {
      codec.generateToJSONFromRow = generateToJSONFromRow_;
    });

    describe('initialization', () => {
      it('should create an array', () => {
        const struct = new codec.Struct();

        assert(Array.isArray(struct));
      });

      it('should set the type', () => {
        const struct = new codec.Struct();
        const type = struct[codec.TYPE];

        assert.strictEqual(codec.Struct.TYPE, 'struct');
        assert.strictEqual(type, codec.Struct.TYPE);
      });

      it('should create a toJSON property', () => {
        const fakeJSON = {};
        let cachedStruct;

        codec.generateToJSONFromRow = function(struct) {
          cachedStruct = struct;
          return fakeJSON;
        };

        const struct = new codec.Struct();

        assert.strictEqual(struct, cachedStruct);
        assert.strictEqual(struct.toJSON, fakeJSON);
      });
    });

    describe('fromJSON', () => {
      it('should capture the key value pairs', () => {
        const json = {a: 'b', c: 'd'};
        const struct = codec.Struct.fromJSON(json);

        const expected = new codec.Struct();
        expected.push.apply(expected, [
          {name: 'a', value: 'b'},
          {name: 'c', value: 'd'},
        ]);
        assert.deepStrictEqual(struct, expected);
      });
    });

    describe('fromArray', () => {
      it('should convert array to struct array', () => {
        const arr = [{name: 'a', value: 1}, {name: 'b', value: 2}];
        const struct = codec.Struct.fromArray(arr);

        const expectedStruct = new codec.Struct();
        expectedStruct.push.apply(expectedStruct, arr);

        assert(codec.Struct.isStruct(struct));
        assert.deepStrictEqual(struct, expectedStruct);
      });
    });

    describe('isStruct', () => {
      it('should return true for structs', () => {
        const struct = new codec.Struct();
        const isStruct = codec.Struct.isStruct(struct);

        assert.strictEqual(isStruct, true);
      });

      it('should return false for arrays', () => {
        const isStruct = codec.Struct.isStruct([]);

        assert.strictEqual(isStruct, false);
      });

      it('should return false for falsey values', () => {
        const isStruct = codec.Struct.isStruct(null);

        assert.strictEqual(isStruct, false);
      });
    });
  });

  describe('generateToJSONFromRow', () => {
    const ROW = [
      {
        name: 'name',
        value: 'value',
      },
    ];

    let toJSON;

    beforeEach(() => {
      toJSON = codec.generateToJSONFromRow(ROW);
    });

    it('should return a function', () => {
      assert.strictEqual(typeof toJSON, 'function');
    });

    it('should not require options', () => {
      assert.doesNotThrow(() => {
        toJSON();
      });
    });

    it('should return serialized rows', () => {
      assert.deepStrictEqual(toJSON(), {
        name: 'value',
      });
    });

    it('should not return nameless values', () => {
      const row = [
        {
          value: 'value',
        },
      ];

      const toJSON = codec.generateToJSONFromRow(row);
      assert.deepStrictEqual(toJSON(), {});
    });

    it('should not wrap numbers by default', () => {
      const row = [
        {
          name: 'Number',
          value: new codec.Int(3),
        },
      ];

      const toJSON = codec.generateToJSONFromRow(row);
      assert.strictEqual(typeof toJSON().Number, 'number');
      assert.strictEqual(toJSON().Number, 3);
    });

    it('should wrap numbers with option', () => {
      const int = new codec.Int(3);

      const row = [
        {
          name: 'Number',
          value: int,
        },
      ];

      const toJSON = codec.generateToJSONFromRow(row);
      const value = toJSON({wrapNumbers: true}).Number;

      assert(value instanceof codec.Int);
      assert.deepStrictEqual(value, int);
    });

    it('should throw an error if number is out of bounds', () => {
      const int = new codec.Int('9223372036854775807');

      const row = [
        {
          name: 'Number',
          value: int,
        },
      ];

      const toJSON = codec.generateToJSONFromRow(row);

      assert.throws(() => {
        toJSON();
      }, new RegExp('Serializing column "Number" encountered an error'));
    });
  });

  describe('decode', () => {
    // Does not require any special decoding.
    const BYPASS_FIELD = {
      type: {
        code: 'not-real-code',
      },
    };

    beforeEach(() => {
      FakeGrpcService.decodeValue_ = function(value) {
        return value;
      };
    });

    it('should return the same value if not a special type', () => {
      const value = {};

      const decoded = codec.decode(value, BYPASS_FIELD);
      assert.strictEqual(decoded, value);
    });

    it('should return null values as null', () => {
      FakeGrpcService.decodeValue_ = function() {
        return null;
      };

      const decoded = codec.decode(null, BYPASS_FIELD);
      assert.strictEqual(decoded, null);
    });

    it('should decode BYTES', () => {
      const value = Buffer.from('bytes value');

      const decoded = codec.decode(value.toString('base64'), {
        type: {
          code: 'BYTES',
        },
      });

      assert.deepStrictEqual(decoded, Buffer.from(value as any, 'base64'));
    });

    it('should decode FLOAT64', () => {
      const value = 'Infinity';

      const decoded = codec.decode(value, {
        type: {
          code: 'FLOAT64',
        },
      });

      assert(decoded instanceof codec.Float);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode INT64', () => {
      const value = '64';

      const decoded = codec.decode(value, {
        type: {
          code: 'INT64',
        },
      });

      assert(decoded instanceof codec.Int);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode TIMESTAMP', () => {
      const value = new Date();

      const decoded = codec.decode(value.toJSON(), {
        type: {
          code: 'TIMESTAMP',
        },
      });

      assert.deepStrictEqual(decoded, value);
    });

    it('should decode DATE', () => {
      const value = new Date();

      const decoded = codec.decode(value.toJSON(), {
        type: {
          code: 'DATE',
        },
      });

      assert.deepStrictEqual(decoded, value);
    });

    it('should decode ARRAY and inner members', () => {
      const value = ['1'];

      const decoded = codec.decode(value, {
        type: {
          code: 'ARRAY',
          arrayElementType: {
            code: 'INT64',
          },
        },
      });

      assert(decoded[0] instanceof codec.Int);
    });

    it('should decode STRUCT and inner members', () => {
      const value = {
        fieldName: '1',
      };

      const int = {int: true};
      codec.Int = function(value_) {
        assert.strictEqual(value_, value.fieldName);
        return int;
      };

      const decoded = codec.decode(value, {
        type: {
          code: 'STRUCT',
          structType: {
            fields: [
              {
                name: 'fieldName',
                type: {
                  code: 'INT64',
                },
              },
            ],
          },
        },
      });
      assert(codec.Struct.isStruct(decoded));

      const expectedStruct = new codec.Struct();
      expectedStruct.push.apply(expectedStruct, [
        {
          name: 'fieldName',
          value: int,
        },
      ]);

      assert.deepStrictEqual(decoded, expectedStruct);
    });
  });

  describe('encode', () => {
    beforeEach(() => {
      FakeGrpcService.encodeValue_ = function(value) {
        return value;
      };
    });

    it('should return the value from the common encoder', () => {
      const value = {};
      const defaultEncodedValue = {};

      FakeGrpcService.encodeValue_ = function(value_) {
        assert.strictEqual(value_, value);
        return defaultEncodedValue;
      };

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
        value.toString(), // (tests that it is stringified)
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

    it('should encode each key in a dictionary-like object', () => {
      const obj = {
        f: new codec.Float(10),
        i: new codec.Int(10),
      };
      const encoded = codec.encode(obj);
      assert.deepStrictEqual(encoded, {f: 10, i: '10'});
    });

    it('should only encode public properties of objects', () => {
      const obj = {
        hasOwnProperty: function(key) {
          // jshint ignore:line
          return key === 'public';
        },
        _private: new codec.Int(10),
        public: new codec.Int(10),
      };
      const encoded = codec.encode(obj);
      assert.deepStrictEqual(encoded._private, obj._private);
      assert.deepStrictEqual(encoded.public, '10');
    });
  });

  describe('getType', () => {
    it('should determine if the value is a boolean', () => {
      assert.strictEqual(codec.getType(true), 'bool');
    });

    it('should determine if the value is a float', () => {
      assert.strictEqual(codec.getType(NaN), 'float64');
      assert.strictEqual(codec.getType(Infinity), 'float64');
      assert.strictEqual(codec.getType(-Infinity), 'float64');
      assert.strictEqual(codec.getType(2.2), 'float64');
      assert.strictEqual(codec.getType(new codec.Float(1.1)), 'float64');
    });

    it('should determine if the value is an int', () => {
      assert.strictEqual(codec.getType(1234), 'int64');
      assert.strictEqual(codec.getType(new codec.Int(1)), 'int64');
    });

    it('should determine if the value is a string', () => {
      assert.strictEqual(codec.getType('abc'), 'string');
    });

    it('should determine if the value is bytes', () => {
      assert.strictEqual(codec.getType(Buffer.from('abc')), 'bytes');
    });

    it('should determine if the value is a timestamp', () => {
      assert.strictEqual(codec.getType(new Date()), 'timestamp');
    });

    it('should determine if the value is a date', () => {
      assert.strictEqual(codec.getType(new codec.SpannerDate()), 'date');
    });

    it('should determine if the value is a struct', () => {
      const struct = codec.Struct.fromJSON({a: 'b'});
      const type = codec.getType(struct);

      assert.deepStrictEqual(type, {
        type: 'struct',
        fields: [
          {
            name: 'a',
            type: 'string',
          },
        ],
      });
    });

    it('should attempt to determine arrays and their values', () => {
      assert.deepStrictEqual(codec.getType([Infinity]), {
        type: 'array',
        child: 'float64',
      });
    });

    it('should return unspecified for unknown values', () => {
      assert.strictEqual(codec.getType(null), 'unspecified');

      assert.deepStrictEqual(codec.getType([null]), {
        type: 'array',
        child: 'unspecified',
      });
    });
  });

  describe('TYPES', () => {
    it('should export types', () => {
      assert.deepStrictEqual(codec.TYPES, TYPES);
    });
  });

  describe('encodeQuery', () => {
    let createTypeObject_;

    const QUERY = {
      sql: 'SELECT * FROM table',
      a: 'b',
      c: 'd',
    };

    before(() => {
      createTypeObject_ = codec.createTypeObject;
    });

    afterEach(() => {
      codec.createTypeObject = createTypeObject_;
    });

    it('should return the query', () => {
      const fakeQuery = {
        a: 'b',
        c: 'd',
      };

      const encodedQuery = codec.encodeQuery(fakeQuery);

      assert.deepStrictEqual(fakeQuery, encodedQuery);
    });

    it('should clone the query', () => {
      const fakeQuery = {
        a: 'b',
      };

      const encodedQuery = codec.encodeQuery(fakeQuery);
      assert.notStrictEqual(fakeQuery, encodedQuery);

      delete encodedQuery.a;
      assert.strictEqual(fakeQuery.a, 'b');
    });

    it('should encode query parameters', () => {
      const fakeQuery = {
        sql: QUERY,
        params: {
          test: 'value',
        },
      };

      const encodedValue = {};

      codec.encode = function(field) {
        assert.strictEqual(field, fakeQuery.params.test);
        return encodedValue;
      };

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

      const types = Object.keys(params);

      const fakeQuery = {
        sql: QUERY,
        params: params,
      };

      let getTypeCallCount = 0;

      codec.getType = function(field) {
        const type = types[getTypeCallCount++];

        assert.strictEqual(params[type], field);
        return type;
      };

      const encodedQuery = codec.encodeQuery(fakeQuery);

      assert.deepStrictEqual(encodedQuery.paramTypes, {
        unspecified: {
          code: 0,
        },
        bool: {
          code: 1,
        },
        int64: {
          code: 2,
        },
        float64: {
          code: 3,
        },
        timestamp: {
          code: 4,
        },
        date: {
          code: 5,
        },
        string: {
          code: 6,
        },
        bytes: {
          code: 7,
        },
      });
    });

    it('should not overwrite existing type definitions', () => {
      const fakeQuery = {
        params: {
          test: 123,
        },
        types: {
          test: 'string',
        },
      };

      codec.getType = function() {
        throw new Error('Should not be called');
      };

      codec.encodeQuery(fakeQuery);
    });

    it('should create type objects', () => {
      const fakeQuery = {
        types: {
          test: 'string',
        },
      };

      const fakeTypeObject = {};

      codec.createTypeObject = function(type) {
        assert.strictEqual(type, 'string');
        return fakeTypeObject;
      };

      const query = codec.encodeQuery(fakeQuery);

      assert.deepStrictEqual(query.paramTypes, {test: fakeTypeObject});
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
    describe('query.keys', () => {
      it('should encode and map input to keySet', () => {
        const query = {
          keys: ['key', ['composite', 'key']],
        };

        const encodedValue = {};
        let numEncodeRequests = 0;

        codec.encode = function(key) {
          numEncodeRequests++;

          switch (numEncodeRequests) {
            case 1: {
              assert.strictEqual(key, query.keys[0]);
              break;
            }
            case 2: {
              assert.strictEqual(key, query.keys[1][0]);
              break;
            }
            case 3: {
              assert.strictEqual(key, query.keys[1][1]);
              break;
            }
          }

          return encodedValue;
        };

        const expectedKeys = [
          {
            values: [encodedValue],
          },
          {
            values: [encodedValue, encodedValue],
          },
        ];

        const encoded = codec.encodeRead(query);
        assert.deepStrictEqual(encoded.keySet.keys, expectedKeys);
      });

      it('should accept just a key', () => {
        const query = 'key';

        const encodedValue = {};
        codec.encode = function(key) {
          assert.strictEqual(key, query);
          return encodedValue;
        };

        const encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.keySet.keys[0].values[0], encodedValue);
      });

      it('should accept just an array of keys', () => {
        const query = ['key'];

        const encodedValue = {};
        codec.encode = function(key) {
          assert.strictEqual(key, query[0]);
          return encodedValue;
        };

        const encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.keySet.keys[0].values[0], encodedValue);
      });

      it('should arrify query.keys', () => {
        const query = {
          keys: 'key',
        };

        const encodedValue = {};
        codec.encode = function(key) {
          assert.strictEqual(key, query.keys);
          return encodedValue;
        };

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
        const query = {
          ranges: [
            {
              startOpen: 'key',
              endClosed: ['composite', 'key'],
            },
          ],
        };

        const encodedValue = {};
        let numEncodeRequests = 0;

        codec.encode = function(key) {
          const keys = ['key', 'composite', 'key'];

          assert.strictEqual(key, keys[numEncodeRequests++]);
          return encodedValue;
        };

        const expectedRanges = [
          {
            startOpen: {
              values: [encodedValue],
            },
            endClosed: {
              values: [encodedValue, encodedValue],
            },
          },
        ];

        const encoded = codec.encodeRead(query);

        assert.strictEqual(numEncodeRequests, 3);
        assert.deepStrictEqual(encoded.keySet.ranges, expectedRanges);
      });

      it('should arrify query.ranges', () => {
        const query = {
          ranges: [
            {
              startOpen: 'start',
              endClosed: 'end',
            },
          ],
        };

        const encodedValue = {};
        let numEncodeRequests = 0;

        codec.encode = function(key) {
          assert.strictEqual(key, ['start', 'end'][numEncodeRequests++]);
          return encodedValue;
        };

        const expectedRanges = [
          {
            startOpen: {
              values: [encodedValue],
            },
            endClosed: {
              values: [encodedValue],
            },
          },
        ];

        const encoded = codec.encodeRead(query);

        assert.strictEqual(numEncodeRequests, 2);
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
    it('should convert the type to its int value', () => {
      TYPES.forEach((typeName, i) => {
        const type = codec.createTypeObject(typeName);

        assert.deepStrictEqual(type.code, i);
      });
    });

    it('should default to unspecified for unknown types', () => {
      const type = codec.createTypeObject('unicorn');

      assert.deepStrictEqual(type, {code: TYPES.indexOf('unspecified')});
    });

    it('should set the arrayElementType', () => {
      const type = codec.createTypeObject({
        type: 'array',
        child: 'bool',
      });

      assert.deepStrictEqual(type, {
        code: TYPES.indexOf('array'),
        arrayElementType: {
          code: TYPES.indexOf('bool'),
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
        code: TYPES.indexOf('struct'),
        structType: {
          fields: [
            {
              name: 'boolKey',
              type: {
                code: TYPES.indexOf('bool'),
              },
            },
            {
              name: 'intKey',
              type: {
                code: TYPES.indexOf('int64'),
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
            type: {
              type: 'struct',
              fields: [
                {
                  type: 'bool',
                  name: 'boolKey',
                },
              ],
            },
          },
        ],
      });

      assert.deepStrictEqual(type, {
        code: TYPES.indexOf('struct'),
        structType: {
          fields: [
            {
              name: 'nestedStruct',
              type: {
                code: TYPES.indexOf('struct'),
                structType: {
                  fields: [
                    {
                      name: 'boolKey',
                      type: {code: TYPES.indexOf('bool')},
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
