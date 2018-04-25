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

var codec = module.exports;

var arrify = require('arrify');
var Buffer = require('safe-buffer').Buffer;
var commonGrpc = require('@google-cloud/common-grpc');
var extend = require('extend');
var is = require('is');

function SpannerDate(value) {
  if (arguments.length > 1) {
    throw new TypeError(
      [
        'The spanner.date function accepts a Date object or a',
        "single argument parseable by Date's constructor.",
      ].join(' ')
    );
  }

  if (is.undefined(value)) {
    value = new Date();
  }

  this.value = new Date(value).toJSON().replace(/T.+/, '');
}

codec.SpannerDate = SpannerDate;

function Float(value) {
  this.value = value;
}

Float.prototype.valueOf = function() {
  return parseFloat(this.value);
};

codec.Float = Float;

function Int(value) {
  this.value = value.toString();
}

Int.prototype.valueOf = function() {
  var number = Number(this.value);

  if (number > Number.MAX_SAFE_INTEGER) {
    throw new Error('Integer ' + this.value + ' is out of bounds.');
  }

  return number;
};

codec.Int = Int;

var TYPE = Symbol();

codec.TYPE = TYPE;

function Struct() {
  var struct = [];

  struct[TYPE] = Struct.TYPE;

  Object.defineProperty(struct, 'toJSON', {
    enumerable: false,
    value: codec.generateToJSONFromRow(struct),
  });

  return struct;
}

Struct.TYPE = 'struct';

Struct.fromJSON = function(json) {
  var struct = new Struct();

  Object.keys(json || {}).forEach(function(name) {
    var value = json[name];
    struct.push({name, value});
  });

  return struct;
};

Struct.isStruct = function(thing) {
  return !!(thing && thing[TYPE] === Struct.TYPE);
};

module.exports.Struct = Struct;

/**
 * Wherever a row object is returned, it is assigned a "toJSON" function. This
 * function will create that function in a consistent format.
 */
function generateToJSONFromRow(row) {
  return function(options) {
    options = extend(
      {
        wrapNumbers: false,
      },
      options
    );

    return row.reduce(function(serializedRow, keyVal) {
      var name = keyVal.name;
      var value = keyVal.value;

      if (!name) {
        return serializedRow;
      }

      var isNumber = value instanceof Float || value instanceof Int;
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

      serializedRow[name] = value;

      return serializedRow;
    }, {});
  };
}

codec.generateToJSONFromRow = generateToJSONFromRow;

/**
 * Re-decode after the generic gRPC decoding step.
 *
 * @private
 */
function decode(value, field) {
  function decodeValue_(decoded, type) {
    if (is.null(decoded)) {
      return null;
    }

    switch (type.code) {
      case 'BYTES': {
        decoded = Buffer.from(decoded, 'base64');
        break;
      }
      case 'FLOAT64': {
        decoded = new codec.Float(decoded);
        break;
      }
      case 'INT64': {
        decoded = new codec.Int(decoded);
        break;
      }
      case 'TIMESTAMP': // falls through
      case 'DATE': {
        decoded = new Date(decoded);
        break;
      }
      case 'ARRAY': {
        decoded = decoded.map(function(value) {
          return decodeValue_(value, type.arrayElementType);
        });
        break;
      }
      case 'STRUCT': {
        let struct = new Struct();
        let fields = type.structType.fields;

        fields.forEach((field, index) => {
          let name = field.name;
          let value = decoded[name] || decoded[index];

          value = decodeValue_(value, field.type);
          struct.push({name, value});
        });

        decoded = struct;
        break;
      }
    }

    return decoded;
  }

  return decodeValue_(value, field.type);
}

codec.decode = decode;

/**
 * Encode a value in the format the API expects.
 *
 * @private
 */
function encode(value) {
  function preEncode(value) {
    var numberShouldBeStringified =
      (!(value instanceof Float) && is.int(value)) ||
      value instanceof Int ||
      is.infinite(value) ||
      Number.isNaN(value);

    if (is.date(value)) {
      value = value.toJSON();
    } else if (
      value instanceof SpannerDate ||
      value instanceof Float ||
      value instanceof Int
    ) {
      value = value.value;
    } else if (Buffer.isBuffer(value)) {
      value = value.toString('base64');
    } else if (Struct.isStruct(value)) {
      value = value.map(field => preEncode(field.value));
    } else if (is.array(value)) {
      value = value.map(preEncode);
    } else if (is.object(value) && is.fn(value.hasOwnProperty)) {
      for (var prop in value) {
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

  return commonGrpc.Service.encodeValue_(preEncode(value));
}

codec.encode = encode;

/**
 * Get the corresponding Spanner data type.
 *
 * @private
 *
 * @param {*} field - The field value.
 * @return {string}
 *
 * @example
 * Database.getType_(NaN);
 * // 'float64'
 */
function getType(field) {
  if (is.bool(field)) {
    return 'bool';
  }

  var isSpecialNumber =
    is.infinite(field) || (is.number(field) && isNaN(field));

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
    let fields = field.map(({name, value}) => {
      let type = getType(value);
      return {name, type};
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

      if (!is.nil(child)) {
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

codec.getType = getType;

/**
 * A list of available Spanner types. The index of said type in Array aligns
 * with the type code that query params require.
 *
 * @private
 */
var TYPES = [
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

codec.TYPES = TYPES;

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
    let fields = {};

    if (!query.types) {
      query.types = {};
    }

    for (let prop in query.params) {
      let field = query.params[prop];

      if (!query.types[prop]) {
        query.types[prop] = codec.getType(field);
      }

      fields[prop] = codec.encode(field);
    }

    query.params = {fields};
  }

  if (query.types) {
    let formattedTypes = {};

    for (let field in query.types) {
      formattedTypes[field] = codec.createTypeObject(query.types[field]);
    }

    delete query.types;
    query.paramTypes = formattedTypes;
  }

  return query;
}

codec.encodeQuery = encodeQuery;

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

  var encoded = extend({}, query);

  if (query.keys || query.ranges) {
    encoded.keySet = {};
  }

  if (query.keys) {
    encoded.keySet.keys = arrify(query.keys).map(function(key) {
      return {
        values: arrify(key).map(codec.encode),
      };
    });
    delete encoded.keys;
  }

  if (query.ranges) {
    encoded.keySet.ranges = arrify(query.ranges).map(function(rawRange) {
      var range = extend({}, rawRange);

      for (var bound in range) {
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

codec.encodeRead = encodeRead;

/**
 *
 */
function createTypeObject(config = 'unspecified') {
  if (is.string(config)) {
    config = {type: config};
  }

  let type = config.type;
  let code = TYPES.indexOf(type);

  if (code === -1) {
    code = 0; // unspecified
  }

  let typeObject = {code};

  if (type === 'array') {
    typeObject.arrayElementType = createTypeObject(config.child);
  }

  if (type === 'struct') {
    typeObject.structType = {};
    typeObject.structType.fields = arrify(config.fields).map(field => {
      let fieldConfig = is.object(field.type) ? field.type : field;

      return {
        name: field.name,
        type: createTypeObject(fieldConfig),
      };
    });
  }

  return typeObject;
}

codec.createTypeObject = createTypeObject;
