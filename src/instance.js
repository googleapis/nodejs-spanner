/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const arrify = require('arrify');
const common = require('@google-cloud/common-grpc');
const {paginator} = require('@google-cloud/paginator');
const {promisifyAll} = require('@google-cloud/promisify');
const extend = require('extend');
const is = require('is');
const snakeCase = require('lodash.snakecase');
const util = require('util');

const Database = require('./database');

/**
 * The {@link Instance} class represents a [Cloud Spanner instance](https://cloud.google.com/spanner/docs/instances).
 *
 * Create an `Instance` object to interact with a Cloud Spanner instance.
 *
 * @class
 *
 * @param {Spanner} spanner {@link Spanner} instance.
 * @param {string} name Name of the instance.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 * const instance = spanner.instance('my-instance');
 */
function Instance(spanner, name) {
  const self = this;

  this.formattedName_ = Instance.formatName_(spanner.projectId, name);
  this.request = spanner.request.bind(spanner);
  this.requestStream = spanner.requestStream.bind(spanner);

  const methods = {
    /**
     * Create an instance.
     *
     * Wrapper around {@link v1.InstanceAdminClient#createInstance}.
     *
     * @see {@link v1.InstanceAdminClient#createInstance}
     * @see [CreateInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.CreateInstance)
     *
     * @method Instance#create
     * @param {CreateInstanceRequest} config Configuration object.
     * @param {CreateInstanceCallback} [callback] Callback function.
     * @returns {Promise<CreateInstanceResponse>}
     *
     * @example
     * const Spanner = require('@google-cloud/spanner');
     * const spanner = new Spanner();
     *
     * const instance = spanner.instance('my-instance');
     *
     * instance.create(function(err, instance, operation, apiResponse) {
     *   if (err) {
     *     // Error handling omitted.
     *   }
     *
     *   operation
     *     .on('error', function(err) {})
     *     .on('complete', function() {
     *       // Instance created successfully.
     *     });
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instance.create()
     *   .then(function(data) {
     *     const operation = data[0];
     *     const apiResponse = data[1];
     *
     *     return operation.promise();
     *   })
     *   .then(function() {
     *     // Instance created successfully.
     *   });
     */
    create: true,

    /**
     * @typedef {array} InstanceExistsResponse
     * @property {boolean} 0 Whether the {@link Instance} exists.
     */
    /**
     * @callback InstanceExistsCallback
     * @param {?Error} err Request error, if any.
     * @param {boolean} exists Whether the {@link Instance} exists.
     */
    /**
     * Check if an instance exists.
     *
     * @method Instance#exists
     * @param {InstanceExistsCallback} [callback] Callback function.
     * @returns {Promise<InstanceExistsResponse>}
     *
     * @example
     * const Spanner = require('@google-cloud/spanner');
     * const spanner = new Spanner();
     *
     * const instance = spanner.instance('my-instance');
     *
     * instance.exists(function(err, exists) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instance.exists().then(function(data) {
     *   const exists = data[0];
     * });
     */
    exists: true,
  };

  common.ServiceObject.call(this, {
    parent: spanner,
    /**
     * @name Instance#id
     * @type {string}
     */
    id: name,
    methods: methods,
    createMethod: function(_, options, callback) {
      spanner.createInstance(self.formattedName_, options, callback);
    },
  });

  this.databases_ = new Map();
}

util.inherits(Instance, common.ServiceObject);

/**
 * Format the instance name to include the project ID.
 *
 * @private
 *
 * @param {string} projectId The project ID.
 * @param {string} name The instance name.
 *
 * @example
 * Instance.formatName_('grape-spaceship-123', 'my-instance');
 * // 'projects/grape-spaceship-123/instances/my-instance'
 */
Instance.formatName_ = function(projectId, name) {
  if (name.indexOf('/') > -1) {
    return name;
  }

  const instanceName = name.split('/').pop();

  return 'projects/' + projectId + '/instances/' + instanceName;
};

/**
 * Config for the new database.
 *
 * @typedef {object} CreateDatabaseRequest
 * @property {SessionPoolOptions} [poolOptions]
 * @property {SessionPoolCtor} [poolCtor]
 */
/**
 * @typedef {array} CreateDatabaseResponse
 * @property {Database} 0 The new {@link Database}.
 * @property {Operation} 1 An {@link Operation} object that can be used to check
 *     the status of the request.
 * @property {object} 2 The full API response.
 */
/**
 * @callback CreateDatabaseCallback
 * @param {?Error} err Request error, if any.
 * @param {Database} database The new {@link Database}.
 * @param {Operation} operation An {@link Operation} object that can be used to
 *     check the status of the request.
 * @param {object} apiResponse The full API response.
 */
/**
 * Create a database in this instance.
 *
 * Wrapper around {@link v1.DatabaseAdminClient#createDatabase}.
 *
 * @see {@link v1.DatabaseAdminClient#createDatabase}
 * @see [CreateDatabase API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.CreateDatabase)
 *
 * @throws {Error} If a name is not provided.
 *
 * @param {name} name The name of the database to create.
 * @param {CreateDatabaseRequest} [options] Configuration object.
 * @param {CreateDatabaseCallback} [callback] Callback function.
 * @returns {Promise<CreateDatabaseResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * function callback(err, database, operation, apiResponse) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   operation
 *     .on('error', function(err) {})
 *     .on('complete', function() {
 *       // Database created successfully.
 *     });
 * }
 *
 * instance.createDatabase('new-database-name', callback);
 *
 * //-
 * // Set the schema for the database.
 * //-
 * instance.createDatabase('new-database-name', {
 *   schema:
 *     'CREATE TABLE Singers (' +
 *     '  SingerId STRING(1024) NOT NULL,' +
 *     '  Name STRING(1024),' +
 *     ') PRIMARY KEY(SingerId)'
 * }, callback);

 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instance.createDatabase('new-database-name')
 *   .then(function(data) {
 *     const database = data[0];
 *     const operation = data[1];
 *     return operation.promise();
 *   })
 *   .then(function() {
 *     // Database created successfully.
 *   });
 *
 * @example <caption>include:samples/schema.js</caption>
 * region_tag:spanner_create_database
 * Full example:
 */
Instance.prototype.createDatabase = function(name, options, callback) {
  const self = this;

  if (!name) {
    throw new Error('A name is required to create a database.');
  }

  if (is.function(options)) {
    callback = options;
    options = {};
  }

  options = options || {};

  const poolOptions = options.poolOptions;
  delete options.poolOptions;

  const poolCtor = options.poolCtor;
  delete options.poolCtor;

  const reqOpts = extend(
    {
      parent: this.formattedName_,
      createStatement: 'CREATE DATABASE `' + name.split('/').pop() + '`',
    },
    options
  );

  if (reqOpts.schema) {
    reqOpts.extraStatements = arrify(reqOpts.schema);
    delete reqOpts.schema;
  }

  this.request(
    {
      client: 'DatabaseAdminClient',
      method: 'createDatabase',
      reqOpts: reqOpts,
    },
    function(err, operation, resp) {
      if (err) {
        callback(err, null, null, resp);
        return;
      }

      const database = self.database(name, poolOptions || poolCtor);
      callback(null, database, operation, resp);
    }
  );
};

/**
 * Get a reference to a Database object.
 *
 * @throws {Error} If a name is not provided.
 *
 * @param {string} name The name of the instance.
 * @param {SessionPoolOptions|SessionPoolCtor} [poolOptions] Session pool
 *     configuration options.
 * @return {Database} A Database object.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 */
Instance.prototype.database = function(name, poolOptions) {
  if (!name) {
    throw new Error('A name is required to access a Database object.');
  }

  const key = name.split('/').pop();

  if (!this.databases_.has(key)) {
    this.databases_.set(key, new Database(this, name, poolOptions));
  }

  return this.databases_.get(key);
};

/**
 * @typedef {array} DeleteInstanceResponse
 * @property {object} 0 The full API response.
 */
/**
 * @callback DeleteInstanceCallback
 * @param {?Error} err Request error, if any.
 * @param {object} apiResponse The full API response.
 */
/**
 * Delete the instance.
 *
 * Wrapper around {@link v1.InstanceAdminClient#deleteInstance}.
 *
 * @see {@link v1.InstanceAdminClient#deleteInstance}
 * @see [DeleteInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstance)
 *
 * @param {DeleteInstanceCallback} [callback] Callback function.
 * @returns {Promise<DeleteInstanceResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * instance.delete(function(err, apiResponse) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   // Instance was deleted successfully.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instance.delete().then(function(data) {
 *   const apiResponse = data[0];
 * });
 */
Instance.prototype.delete = function(callback) {
  const self = this;

  const reqOpts = {
    name: this.formattedName_,
  };

  Promise.all(
    Array.from(this.databases_.values()).map(function(database) {
      return database.close();
    })
  )
    .catch(common.util.noop)
    .then(function() {
      self.databases_.clear();

      self.request(
        {
          client: 'InstanceAdminClient',
          method: 'deleteInstance',
          reqOpts: reqOpts,
        },
        function(err, resp) {
          if (!err) {
            self.parent.instances_.delete(self.id);
          }

          callback(err, resp);
        }
      );
    });
};

/**
 * @typedef {array} GetInstanceResponse
 * @property {Instance} 0 The {@link Instance}.
 * @property {object} 1 The full API response.
 */
/**
 * @callback GetInstanceCallback
 * @param {?Error} err Request error, if any.
 * @param {Instance} instance The {@link Instance}.
 * @param {object} apiResponse The full API response.
 */
/**
 * Get an instance if it exists.
 *
 * You may optionally use this to "get or create" an object by providing an
 * object with `autoCreate` set to `true`. Any extra configuration that is
 * normally required for the `create` method must be contained within this
 * object as well.
 *
 * @param {options} [options] Configuration object.
 * @param {boolean} [options.autoCreate=false] Automatically create the
 *     object if it does not exist.
 * @param {GetInstanceCallback} [callback] Callback function.
 * @returns {Promise<GetInstanceResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * instance.get(function(err, instance, apiResponse) {
 *   // `instance.metadata` has been populated.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instance.get().then(function(data) {
 *   const instance = data[0];
 *   const apiResponse = data[0];
 * });
 */
Instance.prototype.get = function(options, callback) {
  const self = this;

  if (is.fn(options)) {
    callback = options;
    options = {};
  }

  this.getMetadata(function(err, metadata) {
    if (err) {
      if (err.code === 5 && options.autoCreate) {
        self.create(options, function(err, database, operation) {
          if (err) {
            callback(err);
            return;
          }

          operation.on('error', callback).on('complete', function(metadata) {
            self.metadata = metadata;
            callback(null, self, metadata);
          });
        });
        return;
      }

      callback(err);
      return;
    }

    callback(null, self, metadata);
  });
};

/**
 * Query object for listing databases.
 *
 * @typedef {object} GetDatabasesRequest
 * @property {boolean} [autoPaginate=true] Have pagination handled
 *     automatically.
 * @property {number} [maxApiCalls] Maximum number of API calls to make.
 * @property {number} [maxResults] Maximum number of items to return.
 * @property {number} [pageSize] Maximum number of results per page.
 * @property {string} [pageToken] A previously-returned page token
 *     representing part of the larger set of results to view.
 */
/**
 * @typedef {array} GetDatabasesResponse
 * @property {Database[]} 0 Array of {@link Database} instances.
 * @property {object} 1 The full API response.
 */
/**
 * @callback GetDatabasesCallback
 * @param {?Error} err Request error, if any.
 * @param {Database[]} databases Array of {@link Database} instances.
 * @param {object} apiResponse The full API response.
 */
/**
 * Get a list of databases.
 *
 * Wrapper around {@link v1.DatabaseAdminClient#listDatabases}.
 *
 * @see {@link v1.DatabaseAdminClient#listDatabases}
 * @see [ListDatabases API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases)
 *
 * @param {GetDatabasesRequest} [query] Query object for listing databases.
 * @param {GetDatabasesCallback} [callback] Callback function.
 * @returns {Promise<GetDatabasesResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * instance.getDatabases(function(err, databases) {
 *   // `databases` is an array of `Database` objects.
 * });
 *
 * //-
 * // To control how many API requests are made and page through the results
 * // manually, set `autoPaginate` to `false`.
 * //-
 * function callback(err, databases, nextQuery, apiResponse) {
 *   if (nextQuery) {
 *     // More results exist.
 *     instance.getDatabases(nextQuery, callback);
 *   }
 * }
 *
 * instance.getDatabases({
 *   autoPaginate: false
 * }, callback);
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instance.getDatabases().then(function(data) {
 *   const databases = data[0];
 * });
 */
Instance.prototype.getDatabases = function(query, callback) {
  const self = this;

  if (is.fn(query)) {
    callback = query;
    query = {};
  }

  const reqOpts = extend({}, query, {
    parent: this.formattedName_,
  });

  this.request(
    {
      client: 'DatabaseAdminClient',
      method: 'listDatabases',
      reqOpts: reqOpts,
      gaxOpts: query,
    },
    function(err, databases) {
      if (databases) {
        arguments[1] = databases.map(function(database) {
          const databaseInstance = self.database(database.name);
          databaseInstance.metadata = database;
          return databaseInstance;
        });
      }

      callback.apply(null, arguments);
    }
  );
};

/**
 * Get a list of databases as a readable object stream.
 *
 * Wrapper around {@link v1.DatabaseAdminClient#listDatabases}.
 *
 * @see {@link v1.DatabaseAdminClient#listDatabases}
 * @see [ListDatabases API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases)
 *
 * @method Spanner#getDatabasesStream
 * @param {GetDatabasesRequest} [query] Query object for listing databases.
 * @returns {ReadableStream} A readable stream that emits {@link Database}
 *     instances.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * instance.getDatabasesStream()
 *   .on('error', console.error)
 *   .on('data', function(database) {
 *     // `database` is a `Database` object.
 *   })
 *   .on('end', function() {
 *     // All databases retrieved.
 *   });
 *
 * //-
 * // If you anticipate many results, you can end a stream early to prevent
 * // unnecessary processing and API requests.
 * //-
 * instance.getDatabasesStream()
 *   .on('data', function(database) {
 *     this.end();
 *   });
 */
Instance.prototype.getDatabasesStream = paginator.streamify('getDatabases');

/**
 * @typedef {array} GetInstanceMetadataResponse
 * @property {object} 0 The {@link Instance} metadata.
 * @property {object} 1 The full API response.
 */
/**
 * @callback GetInstanceMetadataCallback
 * @param {?Error} err Request error, if any.
 * @param {object} metadata The {@link Instance} metadata.
 * @param {object} apiResponse The full API response.
 */
/**
 * Get the instance's metadata.
 *
 * Wrapper around {@link v1.InstanceAdminClient#getInstance}.
 *
 * @see {@link v1.InstanceAdminClient#getInstance}
 * @see [GetInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.GetInstance)
 *
 * @param {GetInstanceMetadataCallback} [callback] Callback function.
 * @returns {Promise<GetInstanceMetadataResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * instance.getMetadata(function(err, metadata, apiResponse) {});
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instance.getMetadata().then(function(data) {
 *   const metadata = data[0];
 *   const apiResponse = data[1];
 * });
 */
Instance.prototype.getMetadata = function(callback) {
  const reqOpts = {
    name: this.formattedName_,
  };

  return this.request(
    {
      client: 'InstanceAdminClient',
      method: 'getInstance',
      reqOpts: reqOpts,
    },
    callback
  );
};

/**
 * Update the metadata for this instance. Note that this method follows PATCH
 * semantics, so previously-configured settings will persist.
 *
 * Wrapper around {@link v1.InstanceAdminClient#updateInstance}.
 *
 * @see {@link v1.InstanceAdminClient#updateInstance}
 * @see [UpdateInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.UpdateInstance)
 *
 * @param {object<string, *>} metadata The metadata you wish to set.
 * @param {LongRunningOperationCallback} [callback] Callback function.
 * @returns {Promise<LongRunningOperationResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 *
 * const metadata = {
 *   displayName: 'My Instance'
 * };
 *
 * instance.setMetadata(metadata, function(err, operation, apiResponse) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   operation
 *     .on('error', function(err) {})
 *     .on('complete', function() {
 *       // Metadata updated successfully.
 *     });
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instance.setMetadata(metadata).then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
Instance.prototype.setMetadata = function(metadata, callback) {
  const reqOpts = {
    instance: extend(
      {
        name: this.formattedName_,
      },
      metadata
    ),
    fieldMask: {
      paths: Object.keys(metadata).map(snakeCase),
    },
  };

  return this.request(
    {
      client: 'InstanceAdminClient',
      method: 'updateInstance',
      reqOpts: reqOpts,
    },
    callback
  );
};

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Instance, {
  exclude: ['database'],
});

/**
 * Reference to the {@link Instance} class.
 * @name module:@google-cloud/spanner.Instance
 * @see Instance
 */
module.exports = Instance;
