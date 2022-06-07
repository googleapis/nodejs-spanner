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
import {GrpcService} from './common-grpc/service';
import {PreciseDate} from '@google-cloud/precise-date';
import arrify = require('arrify');
import {Big} from 'big.js';
import * as is from 'is';
import {common as p} from 'protobufjs';
import {google as spannerClient} from '../protos/protos';
import {GoogleError} from 'google-gax';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Value = any;

export interface Field {
  name: string;
  value: Value;
}

export interface Json {
  [field: string]: Value;
}

export interface JSONOptions {
  wrapNumbers?: boolean;
  wrapStructs?: boolean;
  includeNameless?: boolean;
}

// https://github.com/Microsoft/TypeScript/issues/27920
type DateFields = [number, number, number];

/**
 * Date-like object used to represent Cloud Spanner Dates. DATE types represent
 * a logical calendar date, independent of time zone. DATE values do not
 * represent a specific 24-hour period. Rather, a given DATE value represents a
 * different 24-hour period when interpreted in a different time zone. Because
 * of this, all values passed to {@link Spanner.date} will be interpreted as
 * local time.
 *
 * To represent an absolute point in time, use {@link Spanner.timestamp}.
 *
 * @see Spanner.date
 * @see https://cloud.google.com/spanner/docs/data-types#date-type
 *
 * @class
 * @extends Date
 *
 * @param {string|number} [date] String representing the date or number
 *     representing the year. If year is a number between 0 and 99, then year is
 *     assumed to be 1900 + year.
 * @param {number} [month] Number representing the month (0 = January).
 * @param {number} [date] Number representing the date.
 *
 * @example
 * ```
 * Spanner.date('3-3-1933');
 * ```
 */
export class SpannerDate extends Date {
  constructor(dateString?: string);
  constructor(year: number, month: number, date: number);
  constructor(...dateFields: Array<string | number | undefined>) {
    const yearOrDateString = dateFields[0];

    // yearOrDateString could be 0 (number).
    if (yearOrDateString === null || yearOrDateString === undefined) {
      dateFields[0] = new Date().toDateString();
    }

    // JavaScript Date objects will interpret ISO date strings as Zulu time,
    // but by formatting it, we can infer local time.
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(yearOrDateString as string)) {
      const [year, month, date] = (yearOrDateString as string).split(/-|T/);
      dateFields = [`${month}-${date}-${year}`];
    }

    super(...(dateFields.slice(0, 3) as DateFields));
  }
  /**
   * Returns the date in ISO date format.
   * `YYYY-MM-DD`
   *
   * @returns {string}
   */
  toJSON(): string {
    const year = this.getFullYear().toString();
    const month = (this.getMonth() + 1).toString();
    const date = this.getDate().toString();

    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${date.padStart(
      2,
      '0'
    )}`;
  }
}

/**
 * Using an abstract class to simplify checking for wrapped numbers.
 *
 * @private
 */
abstract class WrappedNumber {
  value!: string | number;
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
      throw new GoogleError(`Integer ${this.value} is out of bounds.`);
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
   * @param {JSONOptions} [options] JSON options.
   * @returns {object}
   */
  toJSON(options?: JSONOptions): Json {
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
 * @typedef Numeric
 * @see Spanner.numeric
 */
export class Numeric {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
  valueOf(): Big {
    return new Big(this.value);
  }
  toJSON(): string {
    return this.valueOf().toJSON();
  }
}

/**
 * @typedef PGNumeric
 * @see Spanner.pgNumeric
 */
export class PGNumeric {
  value: string;
  constructor(pgValue: string | number) {
    this.value = pgValue.toString();
  }
  valueOf(): Big {
    if (this.value.toLowerCase() === 'nan') {
      throw new Error(`${this.value} cannot be converted to a numeric value`);
    }
    return new Big(this.value);
  }
  toJSON(): string {
    return this.valueOf().toJSON();
  }
}

/**
 * @typedef PGJsonb
 * @see Spanner.pgJsonb
 */
export class PGJsonb {
  value: object;
  constructor(pgValue: object | string) {
    if (typeof pgValue === 'string') {
      pgValue = JSON.parse(pgValue) as object;
    }
    this.value = pgValue;
  }

  toString(): string {
    return JSON.stringify(this.value);
  }
}

/**
 * @typedef JSONOptions
 * @property {boolean} [wrapNumbers=false] Indicates if the numbers should be
 *     wrapped in Int/Float wrappers.
 * @property {boolean} [wrapStructs=false] Indicates if the structs should be
 *     wrapped in Struct wrapper.
 * @property {boolean} [includeNameless=false] Indicates if nameless columns
 *     should be included in the result. If true, nameless columns will be
 *     assigned the name '_{column_index}'.
 */
/**
 * Wherever a row or struct object is returned, it is assigned a "toJSON"
 * function. This function will generate the JSON for that row.
 *
 * @private
 *
 * @param {array} row The row to generate JSON for.
 * @param {JSONOptions} [options] JSON options.
 * @returns {object}
 */
function convertFieldsToJson(fields: Field[], options?: JSONOptions): Json {
  const json: Json = {};

  const defaultOptions = {
    wrapNumbers: false,
    wrapStructs: false,
    includeNameless: false,
  };

  options = Object.assign(defaultOptions, options);

  let index = 0;
  for (const {name, value} of fields) {
    if (!name && !options.includeNameless) {
      continue;
    }
    const fieldName = name ? name : `_${index}`;

    try {
      json[fieldName] = convertValueToJson(value, options);
    } catch (e) {
      (e as Error).message = [
        `Serializing column "${fieldName}" encountered an error: ${
          (e as Error).message
        }`,
        'Call row.toJSON({ wrapNumbers: true }) to receive a custom type.',
      ].join(' ');
      throw e;
    }
    index++;
  }

  return json;
}

/**
 * Attempts to convert a wrapped or nested value into a native JavaScript type.
 *
 * @private
 *
 * @param {*} value The value to convert.
 * @param {JSONOptions} options JSON options.
 * @return {*}
 */
function convertValueToJson(value: Value, options: JSONOptions): Value {
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
function decode(value: Value, type: spannerClient.spanner.v1.Type): Value {
  if (is.null(value)) {
    return null;
  }

  let decoded = value;
  let fields;

  switch (type.code) {
    case spannerClient.spanner.v1.TypeCode.BYTES:
    case 'BYTES':
      decoded = Buffer.from(decoded, 'base64');
      break;
    case spannerClient.spanner.v1.TypeCode.FLOAT64:
    case 'FLOAT64':
      decoded = new Float(decoded);
      break;
    case spannerClient.spanner.v1.TypeCode.INT64:
    case 'INT64':
      decoded = new Int(decoded);
      break;
    case spannerClient.spanner.v1.TypeCode.NUMERIC:
    case 'NUMERIC':
      if (
        type.typeAnnotation ===
          spannerClient.spanner.v1.TypeAnnotationCode.PG_NUMERIC ||
        type.typeAnnotation === 'PG_NUMERIC'
      ) {
        decoded = new PGNumeric(decoded);
        break;
      }
      decoded = new Numeric(decoded);
      break;
    case spannerClient.spanner.v1.TypeCode.TIMESTAMP:
    case 'TIMESTAMP':
      decoded = new PreciseDate(decoded);
      break;
    case spannerClient.spanner.v1.TypeCode.DATE:
    case 'DATE':
      decoded = new SpannerDate(decoded);
      break;
    case spannerClient.spanner.v1.TypeCode.JSON:
    case 'JSON':
      if (
        type.typeAnnotation ===
          spannerClient.spanner.v1.TypeAnnotationCode.PG_JSONB ||
        type.typeAnnotation === 'PG_JSONB'
      ) {
        decoded = new PGJsonb(decoded);
        break;
      }
      decoded = JSON.parse(decoded);
      break;
    case spannerClient.spanner.v1.TypeCode.ARRAY:
    case 'ARRAY':
      decoded = decoded.map(value => {
        return decode(
          value,
          type.arrayElementType! as spannerClient.spanner.v1.Type
        );
      });
      break;
    case spannerClient.spanner.v1.TypeCode.STRUCT:
    case 'STRUCT':
      fields = type.structType!.fields!.map(({name, type}, index) => {
        const value = decode(
          decoded[name!] || decoded[index],
          type as spannerClient.spanner.v1.Type
        );
        return {name, value};
      });
      decoded = Struct.fromArray(fields as Field[]);
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
function encode(value: Value): p.IValue {
  return GrpcService.encodeValue_(encodeValue(value));
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

  if (value instanceof WrappedNumber) {
    return value.value;
  }

  if (value instanceof Numeric) {
    return value.value;
  }

  if (value instanceof PGNumeric) {
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

  if (value instanceof PGJsonb) {
    return JSON.stringify(value.value);
  }

  if (is.object(value)) {
    return JSON.stringify(value);
  }

  return value;
}

/**
 * Just a map with friendlier names for the types.
 *
 * @private
 * @enum {string}
 */
const TypeCode: {
  [name: string]: keyof typeof spannerClient.spanner.v1.TypeCode;
} = {
  unspecified: 'TYPE_CODE_UNSPECIFIED',
  bool: 'BOOL',
  int64: 'INT64',
  float64: 'FLOAT64',
  numeric: 'NUMERIC',
  pgNumeric: 'NUMERIC',
  timestamp: 'TIMESTAMP',
  date: 'DATE',
  string: 'STRING',
  bytes: 'BYTES',
  json: 'JSON',
  jsonb: 'JSON',
  array: 'ARRAY',
  struct: 'STRUCT',
};

/**
 * Conveniece Type object that simplifies specifying the data type, the array
 * child type and/or struct fields.
 *
 * @private
 */
export interface Type {
  type: string;
  fields?: FieldType[];
  child?: Type;
}

interface FieldType extends Type {
  name: string;
}

/**
 * @typedef {ParamType} StructField
 * @property {string} name The name of the field.
 */
/**
 * @typedef {object} ParamType
 * @property {string} type The param type. Must be one of the following:
 *     - float64
 *     - int64
 *     - numeric
 *     - bool
 *     - string
 *     - bytes
 *     - json
 *     - timestamp
 *     - date
 *     - struct
 *     - array
 * @property {StructField[]} [fields] **For struct types only**. Type
 *     definitions for the individual fields.
 * @property {string|ParamType} [child] **For array types only**. The array
 *     element type.
 */
/**
 * Get the corresponding Spanner data type for the provided value.
 *
 * @private
 *
 * @param {*} value - The value.
 * @returns {object}
 *
 * @example
 * ```
 * codec.getType(NaN);
 * // {type: 'float64'}
 * ```
 */
function getType(value: Value): Type {
  const isSpecialNumber =
    is.infinite(value) || (is.number(value) && isNaN(value));

  if (is.decimal(value) || isSpecialNumber || value instanceof Float) {
    return {type: 'float64'};
  }

  if (is.number(value) || value instanceof Int) {
    return {type: 'int64'};
  }

  if (value instanceof Numeric) {
    return {type: 'numeric'};
  }

  if (value instanceof PGNumeric) {
    return {type: 'pgNumeric'};
  }

  if (value instanceof PGJsonb) {
    return {type: 'pgJsonb'};
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

  if (value instanceof SpannerDate) {
    return {type: 'date'};
  }

  if (is.date(value)) {
    return {type: 'timestamp'};
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

  if (is.object(value)) {
    return {type: 'json'};
  }

  return {type: 'unspecified'};
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
  const values = (arrify(value) as T[]).map(codec.encode);
  return {values};
}

/**
 * Converts milliseconds to google.protobuf.Timestamp
 *
 * @private
 *
 * @param {number} ms The milliseconds to convert.
 * @returns {object}
 */
function convertMsToProtoTimestamp(
  ms: number
): spannerClient.protobuf.ITimestamp {
  const rawSeconds = ms / 1000;
  const seconds = Math.floor(rawSeconds);
  const nanos = Math.round((rawSeconds - seconds) * 1e9);
  return {seconds, nanos};
}

/**
 * Converts google.protobuf.Timestamp to Date object.
 *
 * @private
 *
 * @param {object} timestamp The protobuf timestamp.
 * @returns {Date}
 */
function convertProtoTimestampToDate({
  nanos = 0,
  seconds = 0,
}: p.ITimestamp): Date {
  const ms = Math.floor(nanos) / 1e6;
  const s = Math.floor(seconds as number);
  return new Date(s * 1000 + ms);
}

/**
 * Encodes paramTypes into correct structure.
 *
 * @private
 *
 * @param {object|string} [config='unspecified'] Type config.
 * @return {object}
 */
function createTypeObject(
  friendlyType?: string | Type
): spannerClient.spanner.v1.Type {
  if (!friendlyType) {
    friendlyType = 'unspecified';
  }

  if (typeof friendlyType === 'string') {
    friendlyType = {type: friendlyType} as Type;
  }

  const config: Type = friendlyType as Type;
  const code: keyof typeof spannerClient.spanner.v1.TypeCode =
    TypeCode[config.type] || TypeCode.unspecified;
  const type: spannerClient.spanner.v1.Type = {
    code,
  } as spannerClient.spanner.v1.Type;

  if (code === 'ARRAY') {
    type.arrayElementType = codec.createTypeObject(config.child);
  }

  if (code === 'STRUCT') {
    type.structType = {
      fields: arrify(config.fields!).map(field => {
        return {name: field.name, type: codec.createTypeObject(field)};
      }),
    };
  }

  if (friendlyType.type === 'pgNumeric') {
    type.typeAnnotation =
      spannerClient.spanner.v1.TypeAnnotationCode.PG_NUMERIC;
  } else if (friendlyType.type === 'jsonb') {
    type.typeAnnotation = spannerClient.spanner.v1.TypeAnnotationCode.PG_JSONB;
  }
  return type;
}

export const codec = {
  convertToListValue,
  convertMsToProtoTimestamp,
  convertProtoTimestampToDate,
  createTypeObject,
  SpannerDate,
  Float,
  Int,
  Numeric,
  PGNumeric,
  PGJsonb,
  convertFieldsToJson,
  decode,
  encode,
  getType,
  Struct,
};
