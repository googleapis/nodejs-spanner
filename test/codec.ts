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

import * as assert from 'assert';
import {before, beforeEach, afterEach, describe, it} from 'mocha';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import {Big} from 'big.js';
import {PreciseDate} from '@google-cloud/precise-date';
import {GrpcService} from '../src/common-grpc/service';
import {google} from '../protos/protos';

describe('codec', () => {
  let codec;

  const sandbox = sinon.createSandbox();

  before(() => {
    codec = proxyquire('../src/codec.js', {
      './common-grpc/service': {GrpcService},
    }).codec;
  });

  beforeEach(() => {
    sandbox.stub(GrpcService, 'encodeValue_').callsFake(value => value);
    sandbox.stub(GrpcService, 'decodeValue_').callsFake(value => value);
  });

  afterEach(() => sandbox.restore());

  describe('SpannerDate', () => {
    describe('instantiation', () => {
      it('should accept date strings', () => {
        const date = new codec.SpannerDate('3-22-1986');
        const json = date.toJSON();

        assert.strictEqual(json, '1986-03-22');
      });

      it('should accept dates before 1000AD', () => {
        const date = new codec.SpannerDate('2-25-985');
        const json = date.toJSON();

        assert.strictEqual(json, '0985-02-25');
      });

      it('should default to the current local date', () => {
        const date = new codec.SpannerDate();
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();
        const expected = new codec.SpannerDate(year, month, day);

        assert.deepStrictEqual(date, expected);
      });

      it('should interpret ISO date strings as local time', () => {
        const date = new codec.SpannerDate('1986-03-22');
        const json = date.toJSON();

        assert.strictEqual(json, '1986-03-22');
      });

      it('should accept y/m/d number values', () => {
        const date = new codec.SpannerDate(1986, 2, 22);
        const json = date.toJSON();

        assert.strictEqual(json, '1986-03-22');
      });

      it('should accept year zero in y/m/d number values', () => {
        const d = new codec.SpannerDate(null!);
        const date = new codec.SpannerDate(0, 2, 22);
        const json = date.toJSON();

        assert.ok(d);
        assert.strictEqual(json, '1900-03-22');
      });

      it('should truncate additional date fields', () => {
        const truncated = new codec.SpannerDate(1986, 2, 22, 4, 8, 10);
        const expected = new codec.SpannerDate(1986, 2, 22);

        assert.deepStrictEqual(truncated, expected);
      });
    });

    describe('toJSON', () => {
      let date: Date;

      beforeEach(() => {
        date = new codec.SpannerDate();
        sandbox.stub(date, 'getFullYear').returns(1999);
        sandbox.stub(date, 'getMonth').returns(11);
        sandbox.stub(date, 'getDate').returns(31);
      });

      it('should return the spanner date string', () => {
        const json = date.toJSON();
        assert.strictEqual(json, '1999-12-31');
      });

      it('should pad single digit months', () => {
        (date.getMonth as sinon.SinonStub).returns(8);
        const json = date.toJSON();
        assert.strictEqual(json, '1999-09-31');
      });

      it('should pad single digit dates', () => {
        (date.getDate as sinon.SinonStub).returns(3);
        const json = date.toJSON();
        assert.strictEqual(json, '1999-12-03');
      });

      it('should pad single digit years', () => {
        (date.getFullYear as sinon.SinonStub).returns(5);
        const json = date.toJSON();
        assert.strictEqual(json, '0005-12-31');
      });

      it('should pad double digit years', () => {
        (date.getFullYear as sinon.SinonStub).returns(52);
        const json = date.toJSON();
        assert.strictEqual(json, '0052-12-31');
      });

      it('should pad triple digit years', () => {
        (date.getFullYear as sinon.SinonStub).returns(954);
        const json = date.toJSON();
        assert.strictEqual(json, '0954-12-31');
      });
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

  describe('Numeric', () => {
    it('should store value as a string', () => {
      const value = '8.01911';
      const numeric = new codec.Numeric(value);

      assert.strictEqual(numeric.value, '8.01911');
    });

    it('should return as a Big', () => {
      const value = '8.01911';
      const numeric = new codec.Numeric(value);

      const expected = new Big(value);
      assert.ok(numeric.valueOf().eq(expected));
    });

    it('toJSON', () => {
      const value = '8.01911';
      const numeric = new codec.Numeric(value);

      assert.strictEqual(numeric.toJSON(), value);
    });
  });

  describe('PGNumeric', () => {
    it('should store value as a string', () => {
      const value = '8.01911';
      const pgNumeric = new codec.PGNumeric(value);

      assert.strictEqual(pgNumeric.value, '8.01911');
    });

    it('should store NaN value as a string', () => {
      const value = 'NaN';
      const pgNumeric = new codec.PGNumeric(value);

      assert.strictEqual(pgNumeric.value, 'NaN');
    });

    it('should return as a Big', () => {
      const value = '8.01911';
      const pgNumeric = new codec.PGNumeric(value);

      const expected = new Big(value);
      assert.ok(pgNumeric.valueOf().eq(expected));
    });

    it('should throw an error when trying to return NaN as a Big', () => {
      const value = 'NaN';
      const pgNumeric = new codec.PGNumeric(value);

      assert.throws(() => {
        pgNumeric.valueOf();
      }, new RegExp('NaN cannot be converted to a numeric value'));
    });

    it('toJSON', () => {
      const value = '8.01911';
      const pgNumeric = new codec.PGNumeric(value);

      assert.strictEqual(pgNumeric.toJSON(), value);
    });
  });

  describe('Struct', () => {
    describe('toJSON', () => {
      it('should covert the struct to JSON', () => {
        const struct = new codec.Struct();
        const options = {};
        const fakeJson = {};

        (sandbox.stub(codec, 'convertFieldsToJson') as sinon.SinonStub)
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
        const expected = [
          {name: 'a', value: 'b'},
          {name: 'c', value: 'd'},
        ];
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

    it('should not return nameless values by default', () => {
      const row = [
        {
          value: 'value',
        },
      ];

      const json = codec.convertFieldsToJson(row);
      assert.deepStrictEqual(json, {});
    });

    it('should return nameless values when requested', () => {
      const row = [
        {
          value: 'value',
        },
      ];

      const json = codec.convertFieldsToJson(row, {includeNameless: true});
      assert.deepStrictEqual(json, {_0: 'value'});
    });

    describe('structs', () => {
      it('should not wrap structs by default', () => {
        const options = {
          wrapNumbers: false,
          wrapStructs: false,
          includeNameless: false,
        };
        const fakeStructJson = {};

        const struct = new codec.Struct();
        const stub = sandbox.stub(struct, 'toJSON').returns(fakeStructJson);

        const row = [{name: 'Struct', value: struct}];

        const json = codec.convertFieldsToJson(row, options);

        assert.strictEqual(json.Struct, fakeStructJson);
        assert.deepStrictEqual(stub.lastCall.args[0], options);
      });

      it('should wrap structs with option', () => {
        const value = 3.3;

        const expectedStruct = codec.Struct.fromJSON({Number: value});
        const struct = codec.Struct.fromJSON({Number: new codec.Float(value)});

        const row = [{name: 'Struct', value: struct}];

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
      (GrpcService.decodeValue_ as sinon.SinonStub).returns(null);
      const decoded = codec.decode(null, BYPASS_FIELD);
      assert.strictEqual(decoded, null);
    });

    it('should decode BYTES', () => {
      const expected = Buffer.from('bytes value');
      const encoded = expected.toString('base64');

      const decoded = codec.decode(encoded, {
        code: google.spanner.v1.TypeCode.BYTES,
      });

      assert.deepStrictEqual(decoded, expected);
    });

    it('should decode FLOAT64', () => {
      const value = 'Infinity';

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.FLOAT64,
      });

      assert(decoded instanceof codec.Float);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode INT64', () => {
      const value = '64';

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.INT64,
      });

      assert(decoded instanceof codec.Int);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode NUMERIC', () => {
      const value = '8.01911';

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.NUMERIC,
      });

      assert(decoded instanceof codec.Numeric);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode PG NUMERIC', () => {
      const value = '8.01911';

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.NUMERIC,
        typeAnnotation: google.spanner.v1.TypeAnnotationCode.PG_NUMERIC,
      });

      assert(decoded instanceof codec.PGNumeric);
      assert.strictEqual(decoded.value, value);
    });

    it('should decode JSON', () => {
      const value = '{"result":true, "count":42}';
      const expected = JSON.parse(value);

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.JSON,
      });

      assert.deepStrictEqual(decoded, expected);
    });

    it('should decode complex JSON string to object', () => {
      const value =
        '{"boolKey":true,"numberKey":3.14,"stringKey":"test","objectKey":{"innerKey":"inner-value"}}';
      const expected = {
        boolKey: true,
        numberKey: 3.14,
        stringKey: 'test',
        objectKey: {innerKey: 'inner-value'},
      };

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.JSON,
      });

      assert.deepStrictEqual(decoded, expected);
    });

    it('should decode TIMESTAMP', () => {
      const value = new Date();
      const expected = new PreciseDate(value.getTime());
      const decoded = codec.decode(value.toJSON(), {
        code: google.spanner.v1.TypeCode.TIMESTAMP,
      });

      assert.deepStrictEqual(decoded, expected);
    });

    it('should decode DATE', () => {
      const value = new Date();
      const expected = new codec.SpannerDate(value.toISOString());
      const decoded = codec.decode(value.toJSON(), {
        code: google.spanner.v1.TypeCode.DATE,
      });

      assert.deepStrictEqual(decoded, expected);
    });

    it('should decode ARRAY and inner members', () => {
      const value = ['1'];

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.ARRAY,
        arrayElementType: {
          code: google.spanner.v1.TypeCode.INT64,
        },
      });

      assert(decoded[0] instanceof codec.Int);
    });

    it('should decode STRUCT and inner members', () => {
      const value = {
        fieldName: '1',
      };

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.STRUCT,
        structType: {
          fields: [
            {
              name: 'fieldName',
              type: {
                code: google.spanner.v1.TypeCode.INT64,
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
      const defaultEncodedValue = '{}';

      (GrpcService.encodeValue_ as sinon.SinonStub)
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

    it('should stringify NUMERIC', () => {
      const value = new codec.Numeric('8.01911');

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.value);
    });

    it('should stringify PG NUMERIC', () => {
      const value = new codec.PGNumeric('8.01911');

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.value);
    });

    it('should encode ARRAY and inner members', () => {
      const value = [5];

      const encoded = codec.encode(value);

      assert.deepStrictEqual(encoded, [
        value.toString(), // (tests that it is stringified)
      ]);
    });

    it('should encode TIMESTAMP', () => {
      const value = new PreciseDate();

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toJSON());
    });

    it('should encode DATE', () => {
      const value = new codec.SpannerDate();

      const encoded = codec.encode(value);

      assert.strictEqual(encoded, value.toJSON());
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

    it('should encode JSON', () => {
      const expected = '{"result":true,"count":42}';
      const value = JSON.parse('{"result": true, "count": 42}');

      const encoded = codec.encode(value);

      assert.deepStrictEqual(encoded, expected);
    });

    it('should encode complex object as JSON', () => {
      const value = {
        boolKey: true,
        numberKey: 3.14,
        stringKey: 'test',
        objectKey: {innerKey: 'inner-value'},
      };

      const encoded = codec.encode(value);

      assert.deepStrictEqual(
        encoded,
        '{"boolKey":true,"numberKey":3.14,"stringKey":"test","objectKey":{"innerKey":"inner-value"}}'
      );
    });

    it('should encode deeply-nested object as JSON', () => {
      // Cloud Spanner accepts a nesting level in a JSON string of at most 100.
      // This test ensures that the encoder is able to encode such an object to
      // a JSON string.
      const nesting = 100;
      const value = JSON.parse(
        '{"k": '.repeat(nesting).concat('"v"').concat('}'.repeat(nesting))
      );

      const encoded = codec.encode(value);

      assert.deepStrictEqual(
        encoded,
        '{"k":'.repeat(nesting).concat('"v"').concat('}'.repeat(nesting))
      );
    });

    it('should decode deeply-nested object as JSON', () => {
      // Cloud Spanner accepts a nesting level in a JSON string of at most 100.
      // This test ensures that the decoder is able to decode such a string.
      const nesting = 100;
      const value = '{"k": '
        .repeat(nesting)
        .concat('"v"')
        .concat('}'.repeat(nesting));

      const decoded = codec.decode(value, {
        code: google.spanner.v1.TypeCode.JSON,
      });

      assert.deepStrictEqual(
        decoded,
        JSON.parse(
          '{"k":'.repeat(nesting).concat('"v"').concat('}'.repeat(nesting))
        )
      );
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
      assert.deepStrictEqual(codec.getType(new codec.Float(1.1)), {
        type: 'float64',
      });
    });

    it('should determine if the value is an int', () => {
      assert.deepStrictEqual(codec.getType(1234), {type: 'int64'});
      assert.deepStrictEqual(codec.getType(new codec.Int(1)), {type: 'int64'});
    });

    it('should determine if the value is numeric', () => {
      assert.deepStrictEqual(codec.getType(new codec.Numeric('8.01911')), {
        type: 'numeric',
      });
    });

    it('should determine if the value is a string', () => {
      assert.deepStrictEqual(codec.getType('abc'), {type: 'string'});
    });

    it('should determine if the value is bytes', () => {
      assert.deepStrictEqual(codec.getType(Buffer.from('abc')), {
        type: 'bytes',
      });
    });

    it('should determine if the value is json', () => {
      assert.deepStrictEqual(codec.getType({key: 'value'}), {
        type: 'json',
      });
    });

    it('should determine if the value is a date', () => {
      assert.deepStrictEqual(codec.getType(new codec.SpannerDate()), {
        type: 'date',
      });
    });

    it('should determine if the value is a timestamp', () => {
      assert.deepStrictEqual(codec.getType(new PreciseDate()), {
        type: 'timestamp',
      });
    });

    it('should accept a plain date object as a timestamp', () => {
      assert.deepStrictEqual(codec.getType(new Date()), {type: 'timestamp'});
    });

    it('should determine if the value is a struct', () => {
      const struct = codec.Struct.fromJSON({a: 'b'});
      const type = codec.getType(struct);

      assert.deepStrictEqual(type, {
        type: 'struct',
        fields: [{name: 'a', type: 'string'}],
      });
    });

    it('should attempt to determine arrays and their values', () => {
      assert.deepStrictEqual(codec.getType([Infinity]), {
        type: 'array',
        child: {
          type: 'float64',
        },
      });
    });

    it('should return unspecified for unknown values', () => {
      assert.deepStrictEqual(codec.getType(null), {type: 'unspecified'});

      assert.deepStrictEqual(codec.getType([null]), {
        type: 'array',
        child: {
          type: 'unspecified',
        },
      });
    });

    it('should determine if the value is a PGNumeric', () => {
      assert.deepStrictEqual(codec.getType(new codec.PGNumeric('7248')), {
        type: 'pgNumeric',
      });
    });
  });

  describe('convertToListValue', () => {
    beforeEach(() => {
      sandbox.stub(codec, 'encode').callsFake(value => {
        return {stringValue: value};
      });
    });

    it('should map values to encoded versions', () => {
      const actual = ['hi', 'bye'];
      const expected = {
        values: [{stringValue: 'hi'}, {stringValue: 'bye'}],
      };

      const converted = codec.convertToListValue(actual);
      assert.deepStrictEqual(converted, expected);
    });

    it('should convert a single value to a list value', () => {
      const actual = 'hi';
      const expected = {
        values: [{stringValue: 'hi'}],
      };

      const converted = codec.convertToListValue(actual);
      assert.deepStrictEqual(converted, expected);
    });
  });

  describe('convertMsToProtoTimestamp', () => {
    it('should convert ms to google.protobuf.Timestamp', () => {
      const ms = 5000.00001;
      const expected = {
        nanos: 10,
        seconds: 5,
      };

      const converted = codec.convertMsToProtoTimestamp(ms);
      assert.deepStrictEqual(converted, expected);
    });
  });

  describe('convertProtoTimestampToDate', () => {
    it('should convert google.protobuf.Timestamp to Date', () => {
      const timestamp = {nanos: 10, seconds: 5};

      const expected = new Date(5000.00001);
      const converted = codec.convertProtoTimestampToDate(timestamp);

      assert.deepStrictEqual(converted, expected);
    });
  });

  describe('createTypeObject', () => {
    it('should convert strings to the corresponding type', () => {
      const typeMap = {
        unspecified: {
          code: google.spanner.v1.TypeCode[
            google.spanner.v1.TypeCode.TYPE_CODE_UNSPECIFIED
          ],
        },
        bool: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.BOOL],
        },
        int64: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.INT64],
        },
        float64: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.FLOAT64],
        },
        timestamp: {
          code: google.spanner.v1.TypeCode[
            google.spanner.v1.TypeCode.TIMESTAMP
          ],
        },
        date: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.DATE],
        },
        string: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.STRING],
        },
        bytes: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.BYTES],
        },
        array: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.ARRAY],
          arrayElementType: {
            code: google.spanner.v1.TypeCode[
              google.spanner.v1.TypeCode.TYPE_CODE_UNSPECIFIED
            ],
          },
        },
        struct: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.STRUCT],
          structType: {fields: []},
        },
      };

      Object.keys(typeMap).forEach(key => {
        const type = codec.createTypeObject(key);
        assert.deepStrictEqual(type, typeMap[key]);
      });
    });

    it('should default to unspecified for unknown types', () => {
      const type = codec.createTypeObject('unicorn');

      assert.deepStrictEqual(type, {
        code: google.spanner.v1.TypeCode[
          google.spanner.v1.TypeCode.TYPE_CODE_UNSPECIFIED
        ],
      });
    });

    it('should set the arrayElementType', () => {
      const type = codec.createTypeObject({
        type: 'array',
        child: 'bool',
      });

      assert.deepStrictEqual(type, {
        code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.ARRAY],
        arrayElementType: {
          code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.BOOL],
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
        code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.STRUCT],
        structType: {
          fields: [
            {
              name: 'boolKey',
              type: {
                code: google.spanner.v1.TypeCode[
                  google.spanner.v1.TypeCode.BOOL
                ],
              },
            },
            {
              name: 'intKey',
              type: {
                code: google.spanner.v1.TypeCode[
                  google.spanner.v1.TypeCode.INT64
                ],
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
        code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.STRUCT],
        structType: {
          fields: [
            {
              name: 'nestedStruct',
              type: {
                code: google.spanner.v1.TypeCode[
                  google.spanner.v1.TypeCode.STRUCT
                ],
                structType: {
                  fields: [
                    {
                      name: 'boolKey',
                      type: {
                        code: google.spanner.v1.TypeCode[
                          google.spanner.v1.TypeCode.BOOL
                        ],
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
    it('should set code and typeAnnotation for pgNumeric string', () => {
      const type = codec.createTypeObject('pgNumeric');

      assert.deepStrictEqual(type, {
        code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.NUMERIC],
        typeAnnotation: google.spanner.v1.TypeAnnotationCode.PG_NUMERIC,
      });
    });

    it('should set code and typeAnnotation for pgNumeric friendlyType object', () => {
      const type = codec.createTypeObject({type: 'pgNumeric'});

      assert.deepStrictEqual(type, {
        code: google.spanner.v1.TypeCode[google.spanner.v1.TypeCode.NUMERIC],
        typeAnnotation: google.spanner.v1.TypeAnnotationCode.PG_NUMERIC,
      });
    });
  });
});
