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
import * as extend from 'extend';
import * as is from 'is';

export class SpannerDate {
  value;
  constructor(value) {
    if (arguments.length > 1) {
      throw new TypeError([
        'The spanner.date function accepts a Date object or a',
        'single argument parseable by Date\'s constructor.',
      ].join(' '));
    }
    if (is.undefined(value)) {
      value = new Date();
    }
    this.value = new Date(value).toJSON().replace(/T.+/, '');
  }
}

export class Float {
  value;
  constructor(value) {
    this.value = value;
  }
  valueOf() {
    return Number(this.value);
  }
}

export class Int {
  value;
  constructor(value) {
    this.value = value.toString();
  }
  valueOf() {
    const num = Number(this.value);
    if (num > Number.MAX_SAFE_INTEGER) {
      throw new Error('Integer ' + this.value + ' is out of bounds.');
    }
    return num;
  }
}

/**
 * We use this symbol as a means to identify if an array is actually a struct.
 * We need to do this because changing Structs from an object to an array would
 * be a major breaking change.
 *
 * @private
 *
 * @example
 * const struct = [];
 * struct[TYPE] = 'struct';
 */
const TYPE = Symbol();

/**
 * Struct wrapper. This returns an array, but will decorate the array to give it
 * struct characteristics.
 *
 * @private
 *
 * @returns {array}
 */
export class Struct extends Array {
  constructor() {
    super();
    this[TYPE] = Struct.TYPE;
    Object.defineProperty(
        this, 'toJSON',
        {enumerable: false, value: codec.generateToJSONFromRow(this)});
  }

  /**
   * Use this to assign/check the type when dealing with structs.
   *
   * @private
   */
  static TYPE = 'struct';

  /**
   * Converts an array of objects to a struct array.
   *
   * @private
   *
   * @param {object[]} arr Struct array.
   * @return {Struct}
   */
  static fromArray(arr) {
    const struct = new Struct();
    struct.push.apply(struct, arr);
    return struct;
  }

  /**
   * Converts a JSON object to a struct array.
   *
   * @private
   *
   * @param {object} json Struct JSON.
   * @return {Struct}
   */
  static fromJSON(json: {}) {
    const struct = new Struct();
    Object.keys(json || {}).forEach(name => {
      const value = json[name];
      struct.push({name, value});
    });
    return struct;
  }

  /**
   * Checks to see if the provided object is a Struct.
   *
   * @private
   *
   * @param {*} thing The object to check.
   * @returns {boolean}
   */
  static isStruct(thing: {}): thing is Struct {
    return !!(thing && thing[TYPE] === Struct.TYPE);
  }
}

/**
 * Wherever a row object is returned, it is assigned a "toJSON" function. This
 * function will create that function in a consistent format.
 *
 * @param {array} row The row to generate JSON for.
 * @returns {function}
 */
function generateToJSONFromRow(row) {
  return (options) => {
    options = extend(
        {
          wrapNumbers: false,
        },
        options);

    return row.reduce((serializedRow, keyVal) => {
      const name = keyVal.name;
      let value = keyVal.value;

      if (!name) {
        return serializedRow;
      }

      const isNumber = value instanceof Float || value instanceof Int;
      if (!options.wrapNumbers && isNumber) {
        try {
          value = value.valueOf();
        } catch (e) {
          e.message = [
            `Serializing column "${name}" encountered an error: ${e.message}`,
            'Call row.toJSON({ wrapNumbers: true }) to receive a custom type.',
          ].join(' ');
          throw e;
        }
      }
      
      if(value instanceof Date){
        value = value.toString();
      }
      
      serializedRow[name] = value;

      return serializedRow;
    }, {});
  };
}

/**
 * Re-decode after the generic gRPC decoding step.
 *
 * @private
 *
 * @param {*} value Value to decode
 * @param {object[]} field Struct fields
 * @returns {*}
 */
function decode(value, field) {
  function decodeValue_(decoded, type) {
    if (is.null(decoded)) {
      return null;
    }
    switch (type.code) {
      case 'BYTES':
        decoded = Buffer.from(decoded, 'base64');
        break;
      case 'FLOAT64':
        decoded = new codec.Float(decoded);
        break;
      case 'INT64':
        decoded = new codec.Int(decoded);
        break;
      case 'TIMESTAMP':  // falls through
      case 'DATE':
        decoded = new Date(decoded);
        break;
      case 'ARRAY':
        decoded = decoded.map(value => {
          return decodeValue_(value, type.arrayElementType);
        });
        break;
      case 'STRUCT':
        // tslint:disable-next-line no-any
        const struct = new (Struct as any)();
        const fields = type.structType.fields;
        fields.forEach((field, index) => {
          const name = field.name;
          let value = decoded[name] || decoded[index];
          value = decodeValue_(value, field.type);
          struct.push({name, value});
        });
        decoded = struct;
        break;
      default:
        break;
    }

    return decoded;
  }

  return decodeValue_(value, field.type);
}

/**
 * Encode a value in the format the API expects.
 *
 * @private
 *
 * @param {*} value The value to be encoded
 * @returns {*}
 */
function encode(value) {
  function preEncode(value) {
    const numberShouldBeStringified =
        (!(value instanceof Float) && is.integer(value)) ||
        value instanceof Int || is.infinite(value) || Number.isNaN(value);

    if (is.date(value)) {
      value = value.toJSON();
    } else if (
        value instanceof SpannerDate || value instanceof Float ||
        value instanceof Int) {
      value = value.value;
    } else if (Buffer.isBuffer(value)) {
      value = value.toString('base64');
    } else if (Struct.isStruct(value)) {
      value = value.map(field => preEncode(field.value));
    } else if (is.array(value)) {
      value = value.map(preEncode);
    } else if (is.object(value) && is.fn(value.hasOwnProperty)) {
      for (const prop in value) {
        if (value.hasOwnProperty(prop)) {
          value[prop] = preEncode(value[prop]);
        }
      }
    }

    if (numberShouldBeStringified) {
      value = value.toString();
    }

    return value;
  }
  // tslint:disable-next-line no-any
  return (Service as any).encodeValue_(preEncode(value));
}

/**
 * Get the corresponding Spanner data type.
 *
 * @private
 *
 * @param {*} field - The field value.
 * @returns {string}
 *
 * @example
 * Database.getType_(NaN);
 * // 'float64'
 */
function getType(field) {
  if (is.boolean(field)) {
    return 'bool';
  }

  const isSpecialNumber = is.infinite(field) ||
      (is.number(field) && isNaN(field));

  if (is.decimal(field) || isSpecialNumber || field instanceof Float) {
    return 'float64';
  }

  if (is.number(field) || field instanceof Int) {
    return 'int64';
  }

  if (is.string(field)) {
    return 'string';
  }

  if (Buffer.isBuffer(field)) {
    return 'bytes';
  }

  if (is.date(field)) {
    return 'timestamp';
  }

  if (field instanceof SpannerDate) {
    return 'date';
  }

  if (Struct.isStruct(field)) {
    const fields = field.map(field => {
      return {
        name: field.name,
        type: getType(field.value),
      };
    });

    return {
      type: 'struct',
      fields,
    };
  }

  if (is.array(field)) {
    let child;

    for (let i = 0; i < field.length; i++) {
      child = field[i];

      if (!is.null(child)) {
        break;
      }
    }

    return {
      type: 'array',
      child: getType(child),
    };
  }

  return 'unspecified';
}

/**
 * A list of available Spanner types. The index of said type in Array aligns
 * with the type code that query params require.
 *
 * @private
 */
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

/**
 * Encodes a ExecuteSqlRequest object into the correct format.
 *
 * @private
 *
 * @param {object} query The query object.
 * @param {object} [query.params] A map of parameter name to values.
 * @param {object} [query.types] A map of parameter types.
 * @returns {object}
 */
function encodeQuery(query) {
  query = extend({}, query);

  if (query.params) {
    const fields = {};

    if (!query.types) {
      query.types = {};
    }

    // tslint:disable-next-line forin
    for (const prop in query.params) {
      const field = query.params[prop];
      if (!query.types[prop]) {
        query.types[prop] = codec.getType(field);
      }
      fields[prop] = codec.encode(field);
    }

    query.params = {fields};
  }

  if (query.types) {
    const formattedTypes = {};
    // tslint:disable-next-line forin
    for (const field in query.types) {
      formattedTypes[field] = codec.createTypeObject(query.types[field]);
    }
    delete query.types;
    query.paramTypes = formattedTypes;
  }

  return query;
}

/**
 * Encodes a ReadRequest into the correct format.
 *
 * @private
 *
 * @param {object|string|string[]} query The query
 * @returns {object}
 */
function encodeRead(query) {
  if (is.array(query) || is.string(query)) {
    query = {
      keys: query,
    };
  }

  const encoded = extend({}, query);

  if (query.keys || query.ranges) {
    encoded.keySet = {};
  }

  if (query.keys) {
    encoded.keySet.keys = arrify(query.keys).map(key => {
      return {
        values: arrify(key).map(codec.encode),
      };
    });
    delete encoded.keys;
  }

  if (query.ranges) {
    encoded.keySet.ranges = arrify(query.ranges).map(rawRange => {
      const range = extend({}, rawRange);
      // tslint:disable-next-line forin
      for (const bound in range) {
        range[bound] = {
          values: arrify(range[bound]).map(codec.encode),
        };
      }

      return range;
    });
    delete encoded.ranges;
  }

  return encoded;
}

/**
 * Encodes paramTypes into correct structure.
 *
 * @private
 *
 * @param {object|string} [config='unspecified'] Type config.
 * @return {object}
 */
function createTypeObject(config) {
  config = config || 'unspecified';

  if (is.string(config)) {
    config = {type: config};
  }

  const type = config.type;
  let code = TYPES.indexOf(type);

  if (code === -1) {
    code = 0;  // unspecified
  }

  // tslint:disable-next-line no-any
  const typeObject: any = {code};

  if (type === 'array') {
    typeObject.arrayElementType = createTypeObject(config.child);
  }

  if (type === 'struct') {
    typeObject.structType = {};
    typeObject.structType.fields = arrify(config.fields).map(field => {
      const fieldConfig = is.object(field.type) ? field.type : field;

      return {
        name: field.name,
        type: createTypeObject(fieldConfig),
      };
    });
  }

  return typeObject;
}

export const codec = {
  createTypeObject,
  SpannerDate,
  Float,
  Int,
  TYPE,
  generateToJSONFromRow,
  decode,
  encode,
  getType,
  encodeQuery,
  TYPES,
  encodeRead,
  Struct
};
