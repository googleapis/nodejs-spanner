/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import * as assert from 'assert';
import {EventEmitter} from 'events';
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import {util} from '@google-cloud/common-grpc';
import * as pfy from '@google-cloud/promisify';
import {Instance} from '../src';
import { PreciseDate } from '@google-cloud/precise-date';
import * as bu from '../src/backup';
import { Backup } from '../src/backup';

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Backup') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'getState',
      'getExpireTime',
      'exists'
    ]);
  },
});

class FakeGrpcServiceObject extends EventEmitter {
  calledWith_: IArguments;
  constructor() {
    super();
    this.calledWith_ = arguments;
  }
}

// tslint:disable-next-line no-any
const fakeCodec: any = {
  encode: util.noop,
  Int() {},
  Float() {},
  SpannerDate() {},
};

describe('Backup', () => {
  const sandbox = sinon.createSandbox();

  // tslint:disable-next-line variable-name
  let Backup: typeof bu.Backup;

  const INSTANCE = ({
    request: util.noop,
    requestStream: util.noop,
    formattedName_: 'instance-name',
    databases_: new Map(),
  } as {}) as Instance;

  const BACKUP_NAME = 'backup-name';
  const DATABASE_NAME = 'database-name';
  const DATABASE_FORMATTED_NAME =
    INSTANCE.formattedName_ + '/databases/' + DATABASE_NAME;
  const BACKUP_FORMATTED_NAME =
    INSTANCE.formattedName_ + '/backups/' + BACKUP_NAME;
  const BACKUP_EXPIRE_TIME = new PreciseDate(1977, 1, 9);

  let backup: bu.Backup;

  before(() => {
    Backup = proxyquire('../src/backup.js', {
      '@google-cloud/common-grpc': {
        ServiceObject: FakeGrpcServiceObject,
      },
      '@google-cloud/promisify': fakePfy,
    }).Backup;
  });

  beforeEach(() => {
    fakeCodec.encode = util.noop;
    backup = new Backup(INSTANCE, BACKUP_NAME, DATABASE_FORMATTED_NAME, BACKUP_EXPIRE_TIME);
  });

  afterEach(() => sandbox.restore());

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });
  });

  describe('create', () => {
    const INSTANCE_NAME = 'instance-name';
    const BACKUP_NAME = 'backup-name';

    it('should make the correct request', async () => {
      const QUERY = {};
      const ORIGINAL_QUERY = extend({}, QUERY);
      const expectedReqOpts = extend({}, QUERY, {
        parent: INSTANCE_NAME,
        backupId: BACKUP_NAME,
        backup: {
          name: BACKUP_FORMATTED_NAME,
          database: DATABASE_FORMATTED_NAME,
          expireTime: BACKUP_EXPIRE_TIME.toStruct()
        }
      });

      backup.request = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'createBackup');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, QUERY);
        assert.deepStrictEqual(QUERY, ORIGINAL_QUERY);
      };

      await backup.create();
    });

    describe('error', () => {
      const REQUEST_RESPONSE_ARGS = [new Error('Error.'), null, {}];

      beforeEach(() => {
        backup.request = (config, callback: Function) => {
          callback.apply(null, REQUEST_RESPONSE_ARGS);
        };
      });

      it('should execute callback with original arguments', done => {
        backup.create((...args) => {
          assert.deepStrictEqual(args, REQUEST_RESPONSE_ARGS);
          done();
        });
      });
    });
  });
});
