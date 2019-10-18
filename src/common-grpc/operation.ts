/*!
 * Copyright 2019 Google LLC
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

/*!
 * @module commonGrpc/operation
 */

import {Metadata, ServiceObjectConfig, util} from '@google-cloud/common';
import {Response} from 'teeny-request';

/**
 * @type {module:commonGrpc/service}
 * @private
 */
import {GrpcService} from './service';
/**
 * @type {module:commonGrpc/serviceObject}
 * @private
 */
import {GrpcServiceObject} from './service-object';

export class GrpcOperation extends GrpcServiceObject {
  completeListeners: number;
  hasActiveListeners: boolean;

  /**
   * An Operation object allows you to interact with APIs that take longer to
   * process things.
   *
   * @constructor
   * @alias module:common/grpcOperation
   *
   * @param {module:commonGrpc/service|module:commonGrpc/serviceObject} parent - The
   *     parent object. This should be configured to use the
   * longrunning.operation service.
   * @param {string} name - The operation name.
   */
  constructor(parent: GrpcService | GrpcServiceObject, name: string) {
    const methods = {
      /**
       * Deletes an operation.
       */
      delete: {
        protoOpts: {
          service: 'Operations',
          method: 'deleteOperation',
        },
        reqOpts: {
          name,
        },
      },

      /**
       * Checks to see if an operation exists.
       */
      exists: true,

      /**
       * Retrieves the operation.
       */
      get: true,

      /**
       * Retrieves metadata for the operation.
       */
      getMetadata: {
        protoOpts: {
          service: 'Operations',
          method: 'getOperation',
        },
        reqOpts: {
          name,
        },
      },
    };

    const config = {
      parent,
      id: name,
      methods,
    };

    super((config as {}) as ServiceObjectConfig);
    this.completeListeners = 0;
    this.hasActiveListeners = false;
    this.listenForEvents_();
  }

  /**
   * Cancel the operation.
   *
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this
   *     request.
   * @param {object} callback.apiResponse - The full API response.
   */
  cancel(callback: (err: Error | null, apiResponse?: Response) => void) {
    const protoOpts = {
      service: 'Operations',
      method: 'cancelOperation',
    };

    const reqOpts = {
      // TODO: remove this when upgrading to the latest @google-cloud/common
      name: this.id,
    };

    this.request(protoOpts, reqOpts, callback || util.noop);
  }

  /**
   * Poll for a status update. Execute the callback:
   *
   *   - callback(err): Operation failed
   *   - callback(): Operation incomplete
   *   - callback(null, metadata): Operation complete
   *
   * @private
   *
   * @param {function} callback
   */
  private poll_(): Promise<Metadata | null> {
    return new Promise((resolve, reject) => {
      this.getMetadata((err, resp) => {
        if (err || resp!.error) {
          reject(err || GrpcService.decorateError_(resp!.error));
          return;
        }
        if (!resp!.done) {
          resolve();
          return;
        }
        resolve(resp);
      });
    });
  }

  /**
   * Begin listening for events on the operation. This method keeps track of how
   * many "complete" listeners are registered and removed, making sure polling
   * is handled automatically.
   *
   * As long as there is one active "complete" listener, the connection is open.
   * When there are no more listeners, the polling stops.
   *
   * @private
   */
  protected listenForEvents_() {
    this.on('newListener', (event: string) => {
      if (event === 'complete') {
        this.completeListeners++;
        if (!this.hasActiveListeners) {
          this.hasActiveListeners = true;
          this.startPolling_();
        }
      }
    });

    this.on('removeListener', (event: string) => {
      if (event === 'complete' && --this.completeListeners === 0) {
        this.hasActiveListeners = false;
      }
    });
  }

  /**
   * Poll `getMetadata` to check the operation's status. This runs a loop to
   * ping the API on an interval.
   *
   * Note: This method is automatically called once a "complete" event handler
   * is registered on the operation.
   *
   * @private
   */
  protected async startPolling_() {
    if (!this.hasActiveListeners) {
      return;
    }
    try {
      const metadata = await this.poll_();
      if (!metadata) {
        setTimeout(this.startPolling_.bind(this), 500);
        return;
      }
      this.emit('complete', metadata);
    } catch (err) {
      this.emit('error', err);
    }
  }
}
