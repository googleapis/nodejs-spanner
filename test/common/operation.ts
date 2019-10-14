/*!
 * Copyright 2016 Google LLC
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

import {util} from '@google-cloud/common';
import * as assert from 'assert';
import {EventEmitter} from 'events';
import * as proxyquire from 'proxyquire';
import {Response} from 'teeny-request';
import * as Sinon from 'sinon';

import * as operationTypes from '../../src/common-grpc/operation';
import {GrpcService, ProtoOpts} from '../../src/common-grpc/service';

const sandbox = Sinon.createSandbox();

let decorateErrorOverride_: Function | null;
class FakeGrpcService {
  static decorateError_() {
    return (decorateErrorOverride_ || util.noop).apply(null, arguments);
  }
}

class FakeGrpcServiceObject extends EventEmitter {
  grpcServiceObjectArguments_: Array<{}>;
  constructor(...args: Array<{}>) {
    super();
    this.grpcServiceObjectArguments_ = args;
  }
  getMetadata = () => {};
}

describe('GrpcOperation', () => {
  const FAKE_SERVICE = {
    Promise,
  };
  const OPERATION_ID = '/a/b/c/d';

  // tslint:disable-next-line:variable-name
  let GrpcOperation: typeof operationTypes.GrpcOperation;
  let grpcOperation: operationTypes.GrpcOperation;

  before(() => {
    GrpcOperation = proxyquire('../../src/common/operation', {
      './service-object': {GrpcServiceObject: FakeGrpcServiceObject},
      './service': {GrpcService: FakeGrpcService},
    }).GrpcOperation;
  });

  beforeEach(() => {
    decorateErrorOverride_ = null;
    grpcOperation = new GrpcOperation(
      FAKE_SERVICE as GrpcService,
      OPERATION_ID
    );
  });

  describe('instantiation', () => {
    const EXPECTED_CONFIG = {
      parent: FAKE_SERVICE,
      id: OPERATION_ID,
      methods: {
        delete: {
          protoOpts: {
            service: 'Operations',
            method: 'deleteOperation',
          },
          reqOpts: {
            name: OPERATION_ID,
          },
        },
        exists: true,
        get: true,
        getMetadata: {
          protoOpts: {
            service: 'Operations',
            method: 'getOperation',
          },
          reqOpts: {
            name: OPERATION_ID,
          },
        },
      },
    };

    it('should pass GrpcServiceObject the correct config', () => {
      const config = ((grpcOperation as {}) as FakeGrpcServiceObject)
        .grpcServiceObjectArguments_![0];
      assert.deepStrictEqual(config, EXPECTED_CONFIG);
    });
  });

  describe('cancel', () => {
    it('should provide the proper request options', done => {
      grpcOperation.id = OPERATION_ID;

      grpcOperation.request = (
        protoOpts: ProtoOpts,
        reqOpts: {name: string},
        callback: Function
      ) => {
        assert.deepStrictEqual(protoOpts, {
          service: 'Operations',
          method: 'cancelOperation',
        });

        assert.strictEqual(reqOpts.name, OPERATION_ID);
        callback(); // done()
      };

      grpcOperation.cancel(done);
    });

    it('should use util.noop if callback is omitted', done => {
      grpcOperation.request = (protoOpts, reqOpts, callback) => {
        assert.strictEqual(callback, util.noop);
        done();
      };
      // tslint:disable-next-line no-any
      (grpcOperation as any).cancel();
    });
  });

  describe('poll_', () => {
    afterEach(() => {
      sandbox.restore();
    });

    it('should call getMetdata', done => {
      sandbox.stub(grpcOperation, 'getMetadata').callsFake(() => {
        done();
      });
      // tslint:disable-next-line no-any
      (grpcOperation as any).poll_().then(util.noop, assert.ifError);
    });

    describe('could not get metadata', () => {
      it('should callback with an error', done => {
        const error = new Error('Error.');
        sandbox.stub(grpcOperation, 'getMetadata').callsFake(callback => {
          callback(error);
        });
        // tslint:disable-next-line no-any
        (grpcOperation as any).poll_().then(
          (r: Response) => {},
          (err: Error) => {
            assert.strictEqual(err, error);
            done();
          }
        );
      });

      it('should callback with the operation error', done => {
        const apiResponse = {
          error: {},
        };
        sandbox.stub(grpcOperation, 'getMetadata').callsFake(callback => {
          callback(null, apiResponse, (apiResponse as {}) as Response);
        });

        const decoratedGrpcStatus = {};

        decorateErrorOverride_ = (status: Error) => {
          assert.strictEqual(status, apiResponse.error);
          return decoratedGrpcStatus;
        };

        // tslint:disable-next-line no-any
        (grpcOperation as any).poll_().then(
          (r: Response) => {},
          (err: Error) => {
            assert.strictEqual(err, decoratedGrpcStatus);
            done();
          }
        );
      });
    });
    describe('operation incomplete', () => {
      const apiResponse = {done: false};

      beforeEach(() => {
        sandbox.stub(grpcOperation, 'getMetadata').callsFake(callback => {
          callback(null, apiResponse);
        });
      });

      it('should callback with no arguments', async () => {
        // tslint:disable-next-line no-any
        return (grpcOperation as any).poll_().then((resp: Response) => {
          assert.strictEqual(resp, undefined);
        }, assert.ifError);
      });
    });

    describe('operation complete', () => {
      const apiResponse = {done: true};

      beforeEach(() => {
        sandbox.stub(grpcOperation, 'getMetadata').callsFake(callback => {
          callback(null, apiResponse);
        });
      });

      it('should emit complete with metadata', async () => {
        // tslint:disable-next-line no-any
        return (grpcOperation as any).poll_().then((resp: Response) => {
          assert.strictEqual(resp, apiResponse);
        }, assert.ifError);
      });
    });
  });
});
