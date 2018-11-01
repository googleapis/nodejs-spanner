/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const proxyquire = require(`proxyquire`).noPreserveCache();
const sinon = require(`sinon`);
const assert = require(`assert`);
const tools = require(`@google-cloud/nodejs-repo-tools`);

describe('QuickStart', () => {
  before(() => tools.stubConsole);
  after(() => tools.restoreConsole);

  it(`should query a table`, async () => {
    const databaseMock = {
      run: async _query => {
        assert.deepStrictEqual(_query, {
          sql: `SELECT 1`,
        });

        await new Promise(r => setTimeout(r, 200));
        assert.deepStrictEqual(console.log.getCall(0).args, [`test`]);
        return [['test']];
      },
    };
    const instanceMock = {
      database: sinon.stub().returns(databaseMock),
    };
    const spannerMock = {
      instance: sinon.stub().returns(instanceMock),
    };

    proxyquire(`../quickstart`, {
      '@google-cloud/spanner': {
        Spanner: sinon.stub().returns(spannerMock),
      },
    });

    assert.deepStrictEqual(spannerMock.instance.getCall(0).args, [
      `my-instance`,
    ]);
    assert.deepStrictEqual(instanceMock.database.getCall(0).args, [
      `my-database`,
    ]);
  });
});
