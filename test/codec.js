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
var Buffer = require('safe-buffer').Buffer;
var extend = require('extend');
var proxyquire = require('proxyquire');
var util = require('@google-cloud/common').util;

function FakeGrpcService() {}

describe('codec', function() {
  var codecCached;
  var codec;

  before(function() {
    codec = proxyquire('../src/codec.js', {
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
    });
    codecCached = extend({}, codec);
  });

  beforeEach(function() {
    extend(codec, codecCached);
    FakeGrpcService.encodeValue_ = util.noop;
    FakeGrpcService.decodeValue_ = util.noop;
  });

  describe('SpannerDate', function() {
    it('should choke on multiple arguments', function() {
      var expectedErrorMessage = [
        'The spanner.date function accepts a Date object or a',
        "single argument parseable by Date's constructor.",
      ].join(' ');

      assert.throws(function() {
        new codec.SpannerDate(2012, 3, 21);
      }, new RegExp(expectedErrorMessage));
    });

    it('should create an instance from a string', function() {
      var spannerDate = new codec.SpannerDate('08-20-1969');
      assert.strictEqual(spannerDate.value, '1969-08-20');
    });

    it('should create an instance from a Date object', function() {
      var date = new Date();
      var spannerDate = new codec.SpannerDate(date);
      assert.strictEqual(spannerDate.value, date.toJSON().replace(/T.+/, ''));
    });
  });

  describe('Float', function() {
    it('should store the value', function() {
      var value = 8;
      var float = new codec.Float(value);

      assert.strictEqual(float.value, value);
    });

    it('should return as a float', function() {
      var value = '8.2';
      var float = new codec.Float(value);

      assert.strictEqual(float.valueOf(), parseFloat(value));
      assert.strictEqual(float + 2, parseFloat(value) + 2);
    });
  });

  describe('Int', function() {
    it('should stringify the value', function() {
      var value = 8;
      var int = new codec.Int(value);

      assert.strictEqual(int.value, '8');
    });

    it('should return as a number', function() {
      var value = 8;
      var int = new codec.Int(value);

      assert.strictEqual(int.valueOf(), 8);
      assert.strictEqual(int + 2, 10);
    });

    it('should throw if number is out of bounds', function() {
      var value = '9223372036854775807';
      var int = new codec.Int(value);

      assert.throws(function() {
        int.valueOf();
      }, new RegExp('Integer ' + value + ' is out of bounds.'));
    });
  });

  describe('Struct', function() {
    var generateToJSONFromRow_;

    before(function() {
      generateToJSONFromRow_ = codec.generateToJSONFromRow;
    });

    afterEach(function() {
      codec.generateToJSONFromRow = generateToJSONFromRow_;
    });

    describe('initialization', function() {
      it('should create an array', function() {
        var struct = new codec.Struct();

        assert(Array.isArray(struct));
      });

      it('should set the type', function() {
        var struct = new codec.Struct();
        var type = struct[codec.TYPE];

        assert.strictEqual(codec.Struct.TYPE, 'struct');
        assert.strictEqual(type, codec.Struct.TYPE);
      });

      it('should create a toJSON property', function() {
        var fakeJSON = {};
        var cachedStruct;

        codec.generateToJSONFromRow = function(struct) {
          cachedStruct = struct;
          return fakeJSON;
        };

        var struct = new codec.Struct();

        assert.strictEqual(struct, cachedStruct);
        assert.strictEqual(struct.toJSON, fakeJSON);
      });
    });

    describe('fromJSON', function() {
      it('should capture the key value pairs', function() {
        var json = {a: 'b', c: 'd'};
        var struct = codec.Struct.fromJSON(json);

        assert.deepEqual(struct, [
          {name: 'a', value: 'b'},
          {name: 'c', value: 'd'},
        ]);
      });
    });

    describe('isStruct', function() {
      it('should return true for structs', function() {
        var struct = new codec.Struct();
        var isStruct = codec.Struct.isStruct(struct);

        assert.strictEqual(isStruct, true);
      });

      it('should return false for arrays', function() {
        var isStruct = codec.Struct.isStruct([]);

        assert.strictEqual(isStruct, false);
      });

      it('should return false for falsey values', function() {
        var isStruct = codec.Struct.isStruct(null);

        assert.strictEqual(isStruct, false);
      });
    });
  });

  describe('generateToJSONFromRow', function() {
    var ROW = [
      {
        name: 'name',
        value: 'value',
      },
    ];

    var toJSON;

    beforeEach(function() {
      toJSON = codec.generateToJSONFromRow(ROW);
    });

    it('should return a function', function() {
      assert.strictEqual(typeof toJSON, 'function');
    });

    it('should not require options', function() {
      assert.doesNotThrow(function() {
        toJSON();
      });
    });

    it('should return serialized rows', function() {
      assert.deepEqual(toJSON(), {
        name: 'value',
      });
    });

    it('should not return nameless values', function() {
      var row = [
        {
          value: 'value',
        },
      ];

      var toJSON = codec.generateToJSONFromRow(row);
      assert.deepEqual(toJSON(), {});
    });

    it('should not wrap numbers by default', function() {
      var row = [
        {
          name: 'Number',
          value: new codec.Int(3),
        },
      ];

      var toJSON = codec.generateToJSONFromRow(row);
      assert.strictEqual(typeof toJSON().Number, 'number');
      assert.strictEqual(toJSON().Number, 3);
    });

    it('should wrap numbers with option', function() {
      var int = new codec.Int(3);

      var row = [
        {
          name: 'Number',
          value: int,
        },
      ];

      var toJSON = codec.generateToJSONFromRow(row);
      var value = toJSON({wrapNumbers: true}).Number;

      assert(value instanceof codec.Int);
      assert.deepEqual(value, int);
    });

    it('should throw an error if number is out of bounds', function() {
      var int = new codec.Int('9223372036854775807');

      var row = [
        {
          name: 'Number',
          value: int,
        },
      ];

      var toJSON = codec.generateToJSONFromRow(row);

      assert.throws(function() {
        toJSON();
      }, new RegExp('Serializing column "Number" encountered an error'));
    });
  });

  describe('decode', function() {
    // Does not require any special decoding.
    var BYPASS_FIELD = {
      type: {
        code: 'not-real-code',
      },
    };

    beforeEach(function() {
      FakeGrpcService.decodeValue_ = function(value) {
        return value;
      };
    });

    it('should return the same value if not a special type', function() {
      var value = {};

      var decoded = codec.decode(value, BYPASS_FIELD);
      assert.strictEqual(decoded, value);
    });

    it('should return null values as null', function() {
      FakeGrpcService.decodeValue_ = function() {
        return null;
      };

      var decoded = codec.decode(null, BYPASS_FIELD);
      assert.strictEqual(decoded, null);
    });

    it('should decode BYTES', function() {
      var value = Buffer.from('bytes value');

      var decoded = codec.decode(value.toString('base64'), {
        type: {
          code: 'BYTES',
        },
      });

      assert.deepEqual(decoded, Buffer.from(value, 'base64'));
    });

    it('should decode FLOAT64', function() {
      var value = 'Infinity';

      var decoded = codec.decode(value, {
        type: {
          code: 'FLOAT64',
        },
      });

      assert(decoded instanceof codec.Float);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode INT64', function() {
      var value = '64';

      var decoded = codec.decode(value, {
        type: {
          code: 'INT64',
        },
      });

      assert(decoded instanceof codec.Int);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode TIMESTAMP', function() {
      var value = new Date();

      var decoded = codec.decode(value.toJSON(), {
        type: {
          code: 'TIMESTAMP',
        },
      });

      assert.deepEqual(decoded, value);
    });

    it('should decode DATE', function() {
      var value = new Date();

      var decoded = codec.decode(value.toJSON(), {
        type: {
          code: 'DATE',
        },
      });

      assert.deepEqual(decoded, value);
    });

    it('should decode ARRAY and inner members', function() {
      var value = ['1'];

      var decoded = codec.decode(value, {
        type: {
          code: 'ARRAY',
          arrayElementType: {
            code: 'INT64',
          },
        },
      });

      assert(decoded[0] instanceof codec.Int);
    });

    it('should decode STRUCT and inner members', function() {
      var value = {
        fieldName: '1',
      };

      var int = {int: true};
      codec.Int = function(value_) {
        assert.strictEqual(value_, value.fieldName);
        return int;
      };

      var decoded = codec.decode(value, {
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

      assert.deepEqual(decoded, [
        {
          name: 'fieldName',
          value: int,
        },
      ]);
    });
  });

  describe('encode', function() {
    beforeEach(function() {
      FakeGrpcService.encodeValue_ = function(value) {
        return value;
      };
    });

    it('should return the value from the common encoder', function() {
      var value = {};
      var defaultEncodedValue = {};

      FakeGrpcService.encodeValue_ = function(value_) {
        assert.strictEqual(value_, value);
        return defaultEncodedValue;
      };

      var encoded = codec.encode(value);
      assert.strictEqual(encoded, defaultEncodedValue);
    });

    it('should encode BYTES', function() {
      var value = Buffer.from('bytes value');

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString('base64'));
    });

    it('should encode structs', function() {
      var value = codec.Struct.fromJSON({a: 'b', c: 'd'});
      var encoded = codec.encode(value);

      assert.deepEqual(encoded, ['b', 'd']);
    });

    it('should stringify Infinity', function() {
      var value = Infinity;

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should stringify -Infinity', function() {
      var value = -Infinity;

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should stringify NaN', function() {
      var value = NaN;

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should stringify INT64', function() {
      var value = 5;

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toString());
    });

    it('should encode ARRAY and inner members', function() {
      var value = [5];

      var encoded = codec.encode(value);

      assert.deepEqual(encoded, [
        value.toString(), // (tests that it is stringified)
      ]);
    });

    it('should encode TIMESTAMP', function() {
      var value = new Date();

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toJSON());
    });

    it('should encode DATE', function() {
      var value = new codec.SpannerDate();

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, value.value);
    });

    it('should encode INT64', function() {
      var value = new codec.Int(10);

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, '10');
    });

    it('should encode FLOAT64', function() {
      var value = new codec.Float(10);

      var encoded = codec.encode(value);

      assert.strictEqual(encoded, 10);
    });

    it('should encode each key in a dictionary-like object', function() {
      var obj = {
        f: new codec.Float(10),
        i: new codec.Int(10),
      };
      var encoded = codec.encode(obj);
      assert.deepEqual(encoded, {f: 10, i: '10'});
    });

    it('should only encode public properties of objects', function() {
      var obj = {
        hasOwnProperty: function(key) {
          // jshint ignore:line
          return key === 'public';
        },
        _private: new codec.Int(10),
        public: new codec.Int(10),
      };
      var encoded = codec.encode(obj);
      assert.deepEqual(encoded._private, obj._private);
      assert.deepEqual(encoded.public, 10);
    });
  });

  describe('getType', function() {
    it('should determine if the value is a boolean', function() {
      assert.strictEqual(codec.getType(true), 'bool');
    });

    it('should determine if the value is a float', function() {
      assert.strictEqual(codec.getType(NaN), 'float64');
      assert.strictEqual(codec.getType(Infinity), 'float64');
      assert.strictEqual(codec.getType(-Infinity), 'float64');
      assert.strictEqual(codec.getType(2.2), 'float64');
      assert.strictEqual(codec.getType(new codec.Float(1.1)), 'float64');
    });

    it('should determine if the value is an int', function() {
      assert.strictEqual(codec.getType(1234), 'int64');
      assert.strictEqual(codec.getType(new codec.Int(1)), 'int64');
    });

    it('should determine if the value is a string', function() {
      assert.strictEqual(codec.getType('abc'), 'string');
    });

    it('should determine if the value is bytes', function() {
      assert.strictEqual(codec.getType(Buffer.from('abc')), 'bytes');
    });

    it('should determine if the value is a timestamp', function() {
      assert.strictEqual(codec.getType(new Date()), 'timestamp');
    });

    it('should determine if the value is a date', function() {
      assert.strictEqual(codec.getType(new codec.SpannerDate()), 'date');
    });

    it('should determine if the value is a struct', function() {
      var struct = codec.Struct.fromJSON({a: 'b'});
      var type = codec.getType(struct);

      assert.deepEqual(type, {
        type: 'struct',
        fields: [
          {
            name: 'a',
            type: 'string',
          },
        ],
      });
    });

    it('should attempt to determine arrays and their values', function() {
      assert.deepEqual(codec.getType([Infinity]), {
        type: 'array',
        child: 'float64',
      });
    });

    it('should return unspecified for unknown values', function() {
      assert.strictEqual(codec.getType(null), 'unspecified');

      assert.deepEqual(codec.getType([null]), {
        type: 'array',
        child: 'unspecified',
      });
    });
  });

  describe('TYPES', function() {
    it('should export types', function() {
      assert.deepEqual(codec.TYPES, [
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
      ]);
    });
  });

  describe('encodeQuery', function() {
    var createTypeObject_;

    var QUERY = {
      sql: 'SELECT * FROM table',
      a: 'b',
      c: 'd',
    };

    before(function() {
      createTypeObject_ = codec.createTypeObject;
    });

    afterEach(function() {
      codec.createTypeObject = createTypeObject_;
    });

    it('should return the query', function() {
      var fakeQuery = {
        a: 'b',
        c: 'd',
      };

      var encodedQuery = codec.encodeQuery(fakeQuery);

      assert.deepStrictEqual(fakeQuery, encodedQuery);
    });

    it('should clone the query', function() {
      var fakeQuery = {
        a: 'b',
      };

      var encodedQuery = codec.encodeQuery(fakeQuery);
      assert.notStrictEqual(fakeQuery, encodedQuery);

      delete encodedQuery.a;
      assert.strictEqual(fakeQuery.a, 'b');
    });

    it('should encode query parameters', function() {
      var fakeQuery = {
        sql: QUERY,
        params: {
          test: 'value',
        },
      };

      var encodedValue = {};

      codec.encode = function(field) {
        assert.strictEqual(field, fakeQuery.params.test);
        return encodedValue;
      };

      var encodedQuery = codec.encodeQuery(fakeQuery);
      assert.strictEqual(encodedQuery.params.fields.test, encodedValue);
    });

    it('should attempt to guess the parameter types', function() {
      var params = {
        unspecified: null,
        bool: true,
        int64: 1234,
        float64: 2.2,
        timestamp: new Date(),
        date: new codec.SpannerDate(),
        string: 'abc',
        bytes: Buffer.from('abc'),
      };

      var types = Object.keys(params);

      var fakeQuery = {
        sql: QUERY,
        params: params,
      };

      var getTypeCallCount = 0;

      codec.getType = function(field) {
        var type = types[getTypeCallCount++];

        assert.strictEqual(params[type], field);
        return type;
      };

      var encodedQuery = codec.encodeQuery(fakeQuery);

      assert.deepEqual(encodedQuery.paramTypes, {
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

    it('should not overwrite existing type definitions', function() {
      var fakeQuery = {
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

    it('should create type objects', function() {
      var fakeQuery = {
        types: {
          test: 'string',
        },
      };

      var fakeTypeObject = {};

      codec.createTypeObject = function(type) {
        assert.strictEqual(type, 'string');
        return fakeTypeObject;
      };

      var query = codec.encodeQuery(fakeQuery);

      assert.deepEqual(query.paramTypes, {test: fakeTypeObject});
    });

    it('should delete the type map from the request options', function() {
      var fakeQuery = {
        params: {
          test: 'abc',
        },
        types: {
          test: 'string',
        },
      };

      var encodedQuery = codec.encodeQuery(fakeQuery);
      assert.strictEqual(encodedQuery.types, undefined);
    });
  });

  describe('encodeRead', function() {
    describe('query.keys', function() {
      it('should encode and map input to keySet', function() {
        var query = {
          keys: ['key', ['composite', 'key']],
        };

        var encodedValue = {};
        var numEncodeRequests = 0;

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

        var expectedKeys = [
          {
            values: [encodedValue],
          },
          {
            values: [encodedValue, encodedValue],
          },
        ];

        var encoded = codec.encodeRead(query);
        assert.deepStrictEqual(encoded.keySet.keys, expectedKeys);
      });

      it('should accept just a key', function() {
        var query = 'key';

        var encodedValue = {};
        codec.encode = function(key) {
          assert.strictEqual(key, query);
          return encodedValue;
        };

        var encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.keySet.keys[0].values[0], encodedValue);
      });

      it('should accept just an array of keys', function() {
        var query = ['key'];

        var encodedValue = {};
        codec.encode = function(key) {
          assert.strictEqual(key, query[0]);
          return encodedValue;
        };

        var encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.keySet.keys[0].values[0], encodedValue);
      });

      it('should arrify query.keys', function() {
        var query = {
          keys: 'key',
        };

        var encodedValue = {};
        codec.encode = function(key) {
          assert.strictEqual(key, query.keys);
          return encodedValue;
        };

        var encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.keySet.keys[0].values[0], encodedValue);
      });

      it('should remove keys property from request object', function() {
        var query = {
          keys: ['key'],
        };

        var encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.keys, undefined);
      });
    });

    describe('query.ranges', function() {
      it('should encode/map the inputs', function() {
        var query = {
          ranges: [
            {
              startOpen: 'key',
              endClosed: ['composite', 'key'],
            },
          ],
        };

        var encodedValue = {};
        var numEncodeRequests = 0;

        codec.encode = function(key) {
          var keys = ['key', 'composite', 'key'];

          assert.strictEqual(key, keys[numEncodeRequests++]);
          return encodedValue;
        };

        var expectedRanges = [
          {
            startOpen: {
              values: [encodedValue],
            },
            endClosed: {
              values: [encodedValue, encodedValue],
            },
          },
        ];

        var encoded = codec.encodeRead(query);

        assert.strictEqual(numEncodeRequests, 3);
        assert.deepStrictEqual(encoded.keySet.ranges, expectedRanges);
      });

      it('should arrify query.ranges', function() {
        var query = {
          ranges: [
            {
              startOpen: 'start',
              endClosed: 'end',
            },
          ],
        };

        var encodedValue = {};
        var numEncodeRequests = 0;

        codec.encode = function(key) {
          assert.strictEqual(key, ['start', 'end'][numEncodeRequests++]);
          return encodedValue;
        };

        var expectedRanges = [
          {
            startOpen: {
              values: [encodedValue],
            },
            endClosed: {
              values: [encodedValue],
            },
          },
        ];

        var encoded = codec.encodeRead(query);

        assert.strictEqual(numEncodeRequests, 2);
        assert.deepStrictEqual(encoded.keySet.ranges, expectedRanges);
      });

      it('should remove the ranges property from the query', function() {
        var query = {
          ranges: [
            {
              startOpen: 'start',
              endClosed: 'end',
            },
          ],
        };

        var encoded = codec.encodeRead(query);

        assert.strictEqual(encoded.ranges, undefined);
      });
    });
  });

  describe('createTypeObject', function() {
    var TYPES = [
      'unspecified',
      'bool',
      'int64',
      'float64',
      'timestamp',
      'date',
      'string',
      'bytes',
    ];

    it('should convert the type to its int value', function() {
      TYPES.forEach(function(typeName, i) {
        var type = codec.createTypeObject(typeName);

        assert.deepEqual(type, {code: i});
      });
    });

    it('should default to unspecified for unknown types', function() {
      var type = codec.createTypeObject('unicorn');

      assert.deepEqual(type, {code: 0});
    });

    it('should set the arrayElementType', function() {
      var type = codec.createTypeObject({
        type: 'array',
        child: 'bool',
      });

      assert.deepEqual(type, {
        code: 8,
        arrayElementType: {
          code: 1,
        },
      });
    });

    it('should set the struct fields', function() {
      var type = codec.createTypeObject({
        type: 'struct',
        fields: [
          {name: 'boolKey', type: 'bool'},
          {name: 'intKey', type: 'int64'},
        ],
      });

      assert.deepEqual(type, {
        code: 9,
        structType: {
          fields: [
            {
              name: 'boolKey',
              type: {
                code: 1,
              },
            },
            {
              name: 'intKey',
              type: {
                code: 2,
              },
            },
          ],
        },
      });
    });

    it('should handle nested structs', function() {
      var type = codec.createTypeObject({
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

      assert.deepEqual(type, {
        code: 9,
        structType: {
          fields: [
            {
              name: 'nestedStruct',
              type: {
                code: 9,
                structType: {
                  fields: [
                    {
                      name: 'boolKey',
                      type: {code: 1},
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
