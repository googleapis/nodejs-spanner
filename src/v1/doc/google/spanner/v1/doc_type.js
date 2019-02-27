// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * `Type` indicates the type of a Cloud Spanner value, as might be stored in a
 * table cell or returned from an SQL query.
 *
 * @property {number} code
 *   Required. The TypeCode for this type.
 *
 *   The number should be among the values of [TypeCode]{@link google.spanner.v1.TypeCode}
 *
 * @property {Object} arrayElementType
 *   If code ==
 *   ARRAY, then `array_element_type` is the
 *   type of the array elements.
 *
 *   This object should have the same structure as [Type]{@link google.spanner.v1.Type}
 *
 * @property {Object} structType
 *   If code ==
 *   STRUCT, then `struct_type` provides
 *   type information for the struct's fields.
 *
 *   This object should have the same structure as [StructType]{@link google.spanner.v1.StructType}
 *
 * @typedef Type
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.Type definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/type.proto}
 */
const Type = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * `StructType` defines the fields of a
 * STRUCT type.
 *
 * @property {Object[]} fields
 *   The list of fields that make up this struct. Order is
 *   significant, because values of this struct type are represented as
 *   lists, where the order of field values matches the order of
 *   fields in the StructType. In turn, the
 *   order of fields matches the order of columns in a read request, or the
 *   order of fields in the `SELECT` clause of a query.
 *
 *   This object should have the same structure as [Field]{@link google.spanner.v1.Field}
 *
 * @typedef StructType
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.StructType definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/type.proto}
 */
const StructType = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * Message representing a single field of a struct.
   *
   * @property {string} name
   *   The name of the field. For reads, this is the column name. For
   *   SQL queries, it is the column alias (e.g., `"Word"` in the
   *   query `"SELECT 'hello' AS Word"`), or the column name (e.g.,
   *   `"ColName"` in the query `"SELECT ColName FROM Table"`). Some
   *   columns might have an empty name (e.g., !"SELECT
   *   UPPER(ColName)"`). Note that a query result can contain
   *   multiple fields with the same name.
   *
   * @property {Object} type
   *   The type of the field.
   *
   *   This object should have the same structure as [Type]{@link google.spanner.v1.Type}
   *
   * @typedef Field
   * @memberof google.spanner.v1
   * @see [google.spanner.v1.StructType.Field definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/type.proto}
   */
  Field: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  }
};

/**
 * `TypeCode` is used as part of Type to
 * indicate the type of a Cloud Spanner value.
 *
 * Each legal value of a type can be encoded to or decoded from a JSON
 * value, using the encodings described below. All Cloud Spanner values can
 * be `null`, regardless of type; `null`s are always encoded as a JSON
 * `null`.
 *
 * @enum {number}
 * @memberof google.spanner.v1
 */
const TypeCode = {

  /**
   * Not specified.
   */
  TYPE_CODE_UNSPECIFIED: 0,

  /**
   * Encoded as JSON `true` or `false`.
   */
  BOOL: 1,

  /**
   * Encoded as `string`, in decimal format.
   */
  INT64: 2,

  /**
   * Encoded as `number`, or the strings `"NaN"`, `"Infinity"`, or
   * `"-Infinity"`.
   */
  FLOAT64: 3,

  /**
   * Encoded as `string` in RFC 3339 timestamp format. The time zone
   * must be present, and must be `"Z"`.
   *
   * If the schema has the column option
   * `allow_commit_timestamp=true`, the placeholder string
   * `"spanner.commit_timestamp()"` can be used to instruct the system
   * to insert the commit timestamp associated with the transaction
   * commit.
   */
  TIMESTAMP: 4,

  /**
   * Encoded as `string` in RFC 3339 date format.
   */
  DATE: 5,

  /**
   * Encoded as `string`.
   */
  STRING: 6,

  /**
   * Encoded as a base64-encoded `string`, as described in RFC 4648,
   * section 4.
   */
  BYTES: 7,

  /**
   * Encoded as `list`, where the list elements are represented
   * according to
   * array_element_type.
   */
  ARRAY: 8,

  /**
   * Encoded as `list`, where list element `i` is represented according
   * to [struct_type.fields[i]][google.spanner.v1.StructType.fields].
   */
  STRUCT: 9
};