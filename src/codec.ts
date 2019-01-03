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
import {Service} from '@google-cloud/common-grpc';
import * as arrify from 'arrify';
import {CallOptions} from 'google-gax';
import * as is from 'is';
import {common as p} from 'protobufjs';

import {SpannerClient as s} from './v1';

// tslint:disable-next-line no-any
type Value = any;

interface Field {
  name: string;
  value: Value;
}

interface Json {
  [field: string]: Value;
}

/**
 * @typedef JsonOptions
 * @property {boolean} [wrapNumbers=false] Indicates if the numbers should be
 *     wrapped in Int/Float wrappers.
 * @property {boolean} [wrapStructs=false] Indicates if the structs should be
 *     wrapped in Struct wrapper.
 */
interface JsonOptions {
  wrapNumbers?: boolean;
  wrapStructs?: boolean;
}

/**
 * @typedef SpannerDate
 * @see Spanner.date
 */
export class SpannerDate {
  value: string;
  constructor(value?: string|number|Date) {
    if (arguments.length > 1) {
      throw new TypeError([
        'The spanner.date function accepts a Date object or a',
        'single argument parseable by Date\'s constructor.',
      ].join(' '));
    }
    if (is.undefined(value)) {
      value = new Date();
    }
    this.value = new Date(value!).toJSON().replace(/T.+/, '');
  }
}

/**
 * Using an abstract class to simplify checking for wrapped numbers.
 *
 * @private
 */
abstract class WrappedNumber {
  value!: string|number;
  abstract valueOf(): number;
}

/**
 * @typedef Float
 * @see Spanner.float
 */
export class Float extends WrappedNumber {
  value: number;
  constructor(value: number) {
    super();
    this.value = value;
  }
  valueOf(): number {
    return Number(this.value);
  }
}

/**
 * @typedef Int
 * @see Spanner.int
 */
export class Int extends WrappedNumber {
  value: string;
  constructor(value: string) {
    super();
    this.value = value.toString();
  }
  valueOf(): number {
    const num = Number(this.value);
    if (num > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Integer ${this.value} is out of bounds.`);
    }
    return num;
  }
}

/**
 * @typedef Struct
 * @see Spanner.struct
 */
export class Struct extends Array<Field> {
  /**
   * Converts struct into a pojo (plain old JavaScript object).
   *
   * @param {JsonOptions} [options] JSON options.
   * @returns {object}
   */
  toJSON(options?: JsonOptions): Json {
    return codec.convertFieldsToJson(this, options);
  }
  /**
   * Converts an array of fields to a struct.
   *
   * @private
   *
   * @param {object[]} fields List of struct fields.
   * @return {Struct}
   */
  static fromArray(fields: Field[]): Struct {
    return new Struct(...fields);
  }
  /**
   * Converts a JSON object to a struct.
   *
   * @private
   *
   * @param {object} json Struct JSON.
   * @return {Struct}
   */
  static fromJSON(json: Json): Struct {
    const fields = Object.keys(json || {}).map(name => {
      const value = json[name];
      return {name, value};
    });
    return Struct.fromArray(fields);
  }
}

/**
 * Wherever a row or struct object is returned, it is assigned a "toJSON"
 * function. This function will generate the JSON for that row.
 *
 * @private
 *
 * @param {array} row The row to generate JSON for.
 * @param {JsonOptions} [options] JSON options.
 * @returns {object}
 */
function convertFieldsToJson(fields: Field[], options?: JsonOptions): Json {
  const json: Json = {};

  const defaultOptions = {wrapNumbers: false, wrapStructs: false};

  options = Object.assign(defaultOptions, options);

  for (const {name, value} of fields) {
    if (!name) {
      continue;
    }

    try {
      json[name] = convertValueToJson(value, options);
    } catch (e) {
      e.message = [
        `Serializing column "${name}" encountered an error: ${e.message}`,
        'Call row.toJSON({ wrapNumbers: true }) to receive a custom type.',
      ].join(' ');
      throw e;
    }
  }

  return json;
}

/**
 * Attempts to convert a wrapped or nested value into a native JavaScript type.
 *
 * @private
 *
 * @param {*} value The value to convert.
 * @param {JsonOptions} options JSON options.
 * @return {*}
 */
function convertValueToJson(value: Value, options: JsonOptions): Value {
  if (!options.wrapNumbers && value instanceof WrappedNumber) {
    return value.valueOf();
  }

  if (value instanceof Struct) {
    if (!options.wrapStructs) {
      return value.toJSON(options);
    }

    return value.map(({name, value}) => {
      value = convertValueToJson(value, options);
      return {name, value};
    });
  }

  if (Array.isArray(value)) {
    return value.map(child => convertValueToJson(child, options));
  }

  return value;
}

/**
 * Re-decode after the generic gRPC decoding step.
 *
 * @private
 *
 * @param {*} value Value to decode
 * @param {object[]} type Value type object.
 * @returns {*}
 */
function decode(value: Value, type: s.Type): Value {
  if (is.null(value)) {
    return null;
  }

  let decoded = value;

  switch (type.code) {
    case s.TypeCode.BYTES:
      decoded = Buffer.from(decoded, 'base64');
      break;
    case s.TypeCode.FLOAT64:
      decoded = new Float(decoded);
      break;
    case s.TypeCode.INT64:
      decoded = new Int(decoded);
      break;
    case s.TypeCode.TIMESTAMP:  // falls through
    case s.TypeCode.DATE:
      decoded = new Date(decoded);
      break;
    case s.TypeCode.ARRAY:
      decoded = decoded.map(value => {
        return decode(value, type.arrayElementType!);
      });
      break;
    case s.TypeCode.STRUCT:
      const fields = type.structType!.fields.map(({name, type}, index) => {
        const value = decode(decoded[name] || decoded[index], type!);
        return {name, value};
      });
      decoded = Struct.fromArray(fields);
      break;
    default:
      break;
  }

  return decoded;
}

/**
 * Encode a value in the format the API expects.
 *
 * @private
 *
 * @param {*} value The value to be encoded.
 * @returns {object} google.protobuf.Value
 */
export function encode(value: Value): p.IValue {
  return Service.encodeValue_(encodeValue(value));
}

/**
 * Formats values into expected format of google.protobuf.Value. The actual
 * conversion to a google.protobuf.Value object happens via
 * `Service.encodeValue_`
 *
 * @private
 *
 * @param {*} value The value to be encoded.
 * @returns {*}
 */
function encodeValue(value: Value): Value {
  if (is.number(value) && !is.decimal(value)) {
    return value.toString();
  }

  if (is.date(value)) {
    return value.toJSON();
  }

  if (value instanceof WrappedNumber || value instanceof SpannerDate) {
    return value.value;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (value instanceof Struct) {
    return Array.from(value).map(field => encodeValue(field.value));
  }

  if (is.array(value)) {
    return value.map(encodeValue);
  }

  return value;
}

/**
 * Just a map with friendlier names for the types.
 *
 * @private
 * @enum {string}
 */
enum TypeCode {
  unspecified = s.TypeCode.TYPE_CODE_UNSPECIFIED,
  bool = s.TypeCode.BOOL,
  int64 = s.TypeCode.INT64,
  float64 = s.TypeCode.FLOAT64,
  timestamp = s.TypeCode.TIMESTAMP,
  date = s.TypeCode.DATE,
  string = s.TypeCode.STRING,
  bytes = s.TypeCode.BYTES,
  array = s.TypeCode.ARRAY,
  struct = s.TypeCode.STRUCT
}

/**
 * Conveniece Type object that simplifies specifying the data type, the array
 * child type and/or struct fields.
 *
 * @private
 */
interface Type {
  type: string;
  fields?: FieldType[];
  child?: Type;
}

interface FieldType extends Type {
  name: string;
}

/**
 * Get the corresponding Spanner data type for the provided value.
 *
 * @private
 *
 * @param {*} value - The value.
 * @returns {object}
 *
 * @example
 * codec.getType(NaN);
 * // {type: 'float64'}
 */
function getType(value: Value): Type {
  const isSpecialNumber = is.infinite(value) ||
      (is.number(value) && isNaN(value));

  if (is.decimal(value) || isSpecialNumber || value instanceof Float) {
    return {type: 'float64'};
  }

  if (is.number(value) || value instanceof Int) {
    return {type: 'int64'};
  }

  if (is.boolean(value)) {
    return {type: 'bool'};
  }

  if (is.string(value)) {
    return {type: 'string'};
  }

  if (Buffer.isBuffer(value)) {
    return {type: 'bytes'};
  }

  if (is.date(value)) {
    return {type: 'timestamp'};
  }

  if (value instanceof SpannerDate) {
    return {type: 'date'};
  }

  if (value instanceof Struct) {
    return {
      type: 'struct',
      fields: Array.from(value).map(({name, value}) => {
        return Object.assign({name}, getType(value));
      }),
    };
  }

  if (is.array(value)) {
    let child;

    for (let i = 0; i < value.length; i++) {
      child = value[i];

      if (!is.null(child)) {
        break;
      }
    }

    return {
      type: 'array',
      child: getType(child),
    };
  }

  return {type: 'unspecified'};
}

/**
 * Generic request options.
 *
 * @private
 */
interface RequestOptions {
  json?: boolean;
  jsonOptions?: JsonOptions;
  gaxOptions?: CallOptions;
}

/**
 * ExecuteSql request options. This includes all standard ExecuteSqlRequest
 * options as well as several convenience properties.
 *
 * @see [Query Syntax](https://cloud.google.com/spanner/docs/query-syntax)
 * @see [ExecuteSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteSql)
 *
 * @typedef ExecuteSqlRequest
 * @property {object} [params] A map of parameter names to values.
 * @property {object} [types] A map of parameter names to types. If omitted the
 *     client will attempt to guess for all non-null values.
 * @property {boolean} [json=false] Receive the rows as serialized objects. This
 *     is the equivalent of calling `toJSON()` on each row.
 * @property {JsonOptions} [jsonOptions] Configuration options for the
 *     serialized objects.
 */
export interface ExecuteSqlRequest extends s.ExecuteSqlRequest, RequestOptions {
  params?: {[field: string]: Value};
  types?: {[field: string]: string|Type};
}

/**
 * Encodes a ExecuteSqlRequest object into the correct format.
 *
 * @private
 *
 * @param {ExecuteSqlRequest} query The request object.
 * @returns {object}
 */
function encodeQuery(query: ExecuteSqlRequest): s.ExecuteSqlRequest {
  query = Object.assign({}, query);

  if (query.params) {
    const fields = {};

    if (!query.types) {
      query.types = {};
    }

    const types = query.types!;

    Object.keys(query.params).forEach(param => {
      const value = query.params![param];
      if (!types[param]) {
        types[param] = codec.getType(value);
      }
      fields[param] = codec.encode(value);
    });

    query.params = {fields};
  }

  if (query.types) {
    const paramTypes = {};

    Object.keys(query.types).forEach(param => {
      paramTypes[param] = codec.createTypeObject(query.types![param]);
    });

    query.paramTypes = paramTypes;
    delete query.types;
  }

  if (query.json) {
    delete query.json;
    delete query.jsonOptions;
  }

  if (query.gaxOptions) {
    delete query.gaxOptions;
  }

  return query;
}

/**
 * A KeyRange represents a range of rows in a table or index.
 *
 * A range has a start key and an end key. These keys can be open or closed,
 * indicating if the range includes rows with that key.
 *
 * Keys are represented by an array of strings where the nth value in the list
 * corresponds to the nth component of the table or index primary key.
 *
 * @typedef KeyRange
 * @property {string[]} [startClosed] If the start is closed, then the range
 *     includes all rows whose first key columns exactly match.
 * @property {string[]} [startOpen] If the start is open, then the range
 *     excludes rows whose first key columns exactly match.
 * @property {string[]} [endClosed] If the end is closed, then the range
 *     includes all rows whose first key columns exactly match.
 * @property {string[]} [endOpen] If the end is open, then the range excludes
 *     rows whose first key columns exactly match.
 */
interface KeyRange {
  startClosed?: Value[];
  startOpen?: Value[];
  endClosed?: Value[];
  endOpen?: Value[];
}

/**
 * Read request options. This includes all standard ReadRequest options as well
 * as several convenience properties.
 *
 * @see [StreamingRead API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.StreamingRead)
 * @see [ReadRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest)
 *
 * @typedef ReadRequest
 * @property {string[]} [keys] The primary keys of the rows in this table to be
 *     yielded. If using a composite key, provide an array within this array.
 *     See the example below.
 * @property {KeyRange[]} [ranges] An alternative to the keys property, this can
 *       be used to define a range of keys to be yielded.
 * @property {boolean} [json=false] Receive the rows as serialized objects. This
 *     is the equivalent of calling `toJSON()` on each row.
 * @property {JsonOptions} [jsonOptions] Configuration options for the
 *     serialized objects.
 */
export interface ReadRequest extends s.ReadRequest, RequestOptions {
  keys?: string[];
  ranges?: KeyRange[];
}

/**
 * Encodes a ReadRequest into the correct format.
 *
 * @private
 *
 * @param {ReadRequest} query The query
 * @returns {object}
 */
export function encodeRead(query: ReadRequest): s.ReadRequest {
  query = Object.assign({}, query);

  if (!query.keySet) {
    query.keySet = {};

    if (!query.keys && !query.ranges) {
      query.keySet.all = true;
    }
  }

  if (query.keys) {
    query.keySet.keys = arrify(query.keys).map(convertToListValue);
    delete query.keys;
  }

  if (query.ranges) {
    query.keySet.ranges = arrify(query.ranges).map(keyRange => {
      const range: s.KeyRange = {};

      Object.keys(keyRange).forEach(bound => {
        range[bound] = convertToListValue(keyRange[bound]);
      });

      return range;
    });
    delete query.ranges;
  }

  if (query.json) {
    delete query.json;
    delete query.jsonOptions;
  }

  if (query.gaxOptions) {
    delete query.gaxOptions;
  }

  return query;
}

/**
 * Converts a value to google.protobuf.ListValue
 *
 * @private
 *
 * @param {*} value The value to convert.
 * @returns {object}
 */
function convertToListValue<T>(value: T): p.IListValue {
  const values = arrify(value).map(codec.encode);
  return {values};
}

/**
 * Encodes paramTypes into correct structure.
 *
 * @private
 *
 * @param {object|string} [config='unspecified'] Type config.
 * @return {object}
 */
function createTypeObject(friendlyType?: string|Type): s.Type {
  if (!friendlyType) {
    friendlyType = 'unspecified';
  }

  if (is.string(friendlyType)) {
    friendlyType = {type: friendlyType} as Type;
  }

  const config: Type = (friendlyType as Type);
  const code: s.TypeCode = TypeCode[config.type] || TypeCode.unspecified;
  const type: s.Type = {code};

  if (code === s.TypeCode.ARRAY) {
    type.arrayElementType = codec.createTypeObject(config.child);
  }

  if (code === s.TypeCode.STRUCT) {
    type.structType = {
      fields: arrify(config.fields).map(field => {
        return {name: field.name, type: codec.createTypeObject(field)};
      })
    };
  }

  return type;
}

export const codec = {
  createTypeObject,
  SpannerDate,
  Float,
  Int,
  convertFieldsToJson,
  decode,
  encode,
  getType,
  encodeQuery,
  encodeRead,
  Struct
};
