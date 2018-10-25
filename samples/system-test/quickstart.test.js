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

const proxyquire = require(`proxyquire`);
const sinon = require(`sinon`);
const assert = require('assert');
const tools = require(`@google-cloud/nodejs-repo-tools`);

describe('QuickStart', () => {
	before(() => {
	  tools.stubConsole;
	});
	afterEach(() => {
	  tools.restoreConsole;
  });

  it(`should query a table`, function(done) {
		this.timeout(15000);
    const databaseMock = {
      run: _query => {
        assert.deepEqual(_query, {
          sql: `SELECT 1`,
        });
        setTimeout(() => {
          try {
            //assert.deepEqual(console.log.getCall(0).args, [`test`]);
            done();
					} catch (err) {
						done(err);
					}
        }, 200);
				return Promise.resolve([['test']]);
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

    assert.deepEqual(spannerMock.instance.getCall(0).args, [`my-instance`]);
    assert.deepEqual(instanceMock.database.getCall(0).args, [`my-database`]);
  });
});
