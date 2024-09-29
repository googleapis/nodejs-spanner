/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
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

/* eslint-disable prefer-rest-params */

import * as assert from 'assert';
import {before, beforeEach, afterEach, describe, it} from 'mocha';
import {ApiError} from '@google-cloud/common';
import {grpc} from 'google-gax';
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';
import * as pfy from '@google-cloud/promisify';
import * as sinon from 'sinon';
import snakeCase = require('lodash.snakecase');
import {Duplex} from 'stream';

import * as inst from '../src/instance';
import {Spanner, Database, RequestConfig} from '../src';
import arrify = require('arrify');
import {SessionPoolOptions} from '../src/session-pool';
import {Backup} from '../src/backup';
import {PreciseDate} from '@google-cloud/precise-date';
import {CLOUD_RESOURCE_HEADER} from '../src/common';
const {
  AlwaysOnSampler,
  NodeTracerProvider,
  InMemorySpanExporter,
} = require('@opentelemetry/sdk-trace-node');
const {SpanStatusCode} = require('@opentelemetry/api');
// eslint-disable-next-line n/no-extraneous-require
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {SEMATTRS_DB_STATEMENT} = require('@opentelemetry/semantic-conventions');

const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Instance') {
      return;
    }
    assert.deepStrictEqual(options.exclude, ['database', 'backup']);
  },
});

class FakeDatabase {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeGrpcServiceObject {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeBackup {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

describe('Instance', () => {
  // tslint:disable-next-line variable-name
  let Instance: typeof inst.Instance;
  let instance: inst.Instance;

  const sandbox = sinon.createSandbox();

  const traceExporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();

  const provider = new NodeTracerProvider({
    sampler: sampler,
    exporter: traceExporter,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

  afterEach(() => {
    traceExporter.reset();
    sandbox.restore();
  });

  const SPANNER = {
    request: () => {},
    requestStream: () => {},
    projectId: 'project-id',
    instances_: new Map(),
    projectFormattedName_: 'projects/project-id',
  } as {} as Spanner;

  const NAME = 'instance-name';

  before(() => {
    Instance = proxyquire('../src/instance.js', {
      './common-grpc/service-object': {
        GrpcServiceObject: FakeGrpcServiceObject,
      },
      '@google-cloud/promisify': fakePfy,
      './database.js': {Database: FakeDatabase},
      './backup.js': {Backup: FakeBackup},
    }).Instance;
  });

  const OPERATION = {};
  const API_RESPONSE = {};

  const DB_NAME = 'database-name';
  const PATH = 'projects/project-id/databases/' + DB_NAME;

  const OPTIONS = {
    a: 'b',
  } as inst.CreateDatabaseOptions;
  const ORIGINAL_OPTIONS = extend({}, OPTIONS);

  beforeEach(() => {
    instance = new Instance(SPANNER, NAME);
    instance.observabilityConfig = {tracerProvider: provider};
  });

  describe('createDatabase', () => {
    beforeEach(() => {
      instance.request = (config, callback) => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'createDatabase');
        assert.deepStrictEqual(config.reqOpts, {
          parent: instance.formattedName_,
          createStatement: 'CREATE DATABASE `' + NAME + '`',
        });
        assert.strictEqual(config.gaxOpts, undefined);
        assert.deepStrictEqual(config.headers, instance.resourceHeader_);
        if (callback && typeof callback === 'function') {
          return callback(null, OPERATION, API_RESPONSE);
        } else {
          return Promise.resolve([OPERATION, API_RESPONSE]);
        }
      };
    });

    it('enableExtendedTracing=false', () => {
      instance.createDatabase(NAME, (err, operation, resp) => {
        assert.ifError(err);
        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
        });

        const expectedSpanNames = ['CloudSpanner.Database.createDatabase'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const wantSql = undefined;
        assert.strictEqual(
          spans[0].attributes[SEMATTRS_DB_STATEMENT],
          wantSql,
          `Mismatched DB_STATEMENT value:\n\tGot:  ${spans[0].attributes[SEMATTRS_DB_STATEMENT]}\n\tWant: ${wantSql}`
        );
      });
    });

    it('enableExtendedTracing=true', () => {
      instance.observabilityConfig = {
        tracerProvider: provider,
        enableExtendedTracing: true,
      };
      instance.createDatabase(NAME, (err, operation, resp) => {
        assert.ifError(err);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
        });

        const expectedSpanNames = ['CloudSpanner.Database.createDatabase'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const wantSql = 'CREATE DATABASE `' + NAME + '`';
        assert.strictEqual(
          spans[0].attributes[SEMATTRS_DB_STATEMENT],
          wantSql,
          `Mismatched DB_STATEMENT value:\n\tGot:  ${spans[0].attributes[SEMATTRS_DB_STATEMENT]}\n\tWant: ${wantSql}`
        );
      });
    });

    describe('error', () => {
      const ERROR = new Error('custom error');
      const API_RESPONSE = {};

      beforeEach(() => {
        instance.request = (config, callback: Function) => {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', done => {
        instance.createDatabase(NAME, OPTIONS, (err, db, op, resp) => {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(op, null);
          assert.strictEqual(resp, API_RESPONSE);

          traceExporter.forceFlush();
          const spans = traceExporter.getFinishedSpans();
          assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');

          // Sort the spans by duration.
          spans.sort((spanA, spanB) => {
            spanA.duration < spanB.duration;
          });

          const actualEventNames: string[] = [];
          const actualSpanNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = ['CloudSpanner.Database.createDatabase'];
          assert.deepStrictEqual(
            actualSpanNames,
            expectedSpanNames,
            `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
          );

          // Ensure that the span actually produced an error that was recorded.
          const firstSpan = spans[0];
          assert.strictEqual(
            SpanStatusCode.ERROR,
            firstSpan.status.code,
            'Expected an ERROR span status'
          );
          assert.strictEqual(
            'Error: custom error',
            firstSpan.status.message,
            'Mismatched span status message'
          );

          // We don't expect events.
          const expectedEventNames = [];
          assert.deepStrictEqual(
            actualEventNames,
            expectedEventNames,
            `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
          );

          done();
        });
      });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      instance.parent = SPANNER;
    });

    it('with no error', done => {
      instance.request = (config, callback: Function) => {
        callback(null);
      };

      instance.delete(err => {
        assert.ifError(err);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.delete'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        // Ensure that the span actually produced an error that was recorded.
        const firstSpan = spans[0];
        assert.strictEqual(
          SpanStatusCode.UNSET,
          firstSpan.status.code,
          'Expected an UNSET span status'
        );
        assert.strictEqual(
          undefined,
          firstSpan.status.message,
          'Unexpected span status message'
        );

        // We don't expect events.
        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    /*
    it('with error', done => {
      const ERROR = new Error('delete error');
      instance.request = (config, callback: Function) => {
        console.log('delete done');
        callback(ERROR, [{}]);
      };

      instance.delete(err => {
        console.log('in here');

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');
        console.log('gotFinishedSpans');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.delete'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        // Ensure that the span actually produced an error that was recorded.
        const firstSpan = spans[0];
        assert.strictEqual(
          SpanStatusCode.ERROR,
          firstSpan.status.code,
          'Expected an ERROR span status'
        );
        assert.strictEqual(
          'Error: custom error',
          firstSpan.status.message,
          'Mismatched span status message'
        );

        // We don't expect events.
        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        console.log('cest fini');
        done();
      });
    });
   */
  });

  describe('exists', () => {
    afterEach(() => sandbox.restore());

    it('on gRPC error', done => {
      const error = {code: 3, message: 'failed here'};

      sandbox
        .stub(instance, 'getMetadata')
        .callsFake(
          (
            opts_:
              | inst.GetInstanceMetadataOptions
              | inst.GetInstanceMetadataCallback,
            cb
          ) => {
            cb = typeof opts_ === 'function' ? opts_ : cb;
            cb(error as grpc.ServiceError);
          }
        );

      instance.exists((err, exists) => {
        assert.strictEqual(err, error);
        assert.strictEqual(exists, null);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');
        console.log('gotFinishedSpans');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.exists'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        // Ensure that the span actually produced an error that was recorded.
        const firstSpan = spans[0];
        assert.strictEqual(
          SpanStatusCode.ERROR,
          firstSpan.status.code,
          'Expected an ERROR span status'
        );
        assert.strictEqual(
          'Error: custom error',
          firstSpan.status.message,
          'Mismatched span status message'
        );

        // We don't expect events.
        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    it('with no error', done => {
      sandbox
        .stub(instance, 'getMetadata')
        .callsFake(
          (
            opts_:
              | inst.GetInstanceMetadataOptions
              | inst.GetInstanceMetadataCallback,
            cb
          ) => {
            cb = typeof opts_ === 'function' ? opts_ : cb;
            cb(null);
          }
        );

      instance.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, true);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');
        console.log('gotFinishedSpans');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.exists'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        // Ensure that the span actually produced an error that was recorded.
        const firstSpan = spans[0];
        assert.strictEqual(
          SpanStatusCode.UNSET,
          firstSpan.status.code,
          'Unexpected span status'
        );
        assert.strictEqual(
          undefined,
          firstSpan.status.message,
          'Mismatched span status message'
        );

        // We don't expect events.
        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    it('with `not found error`', done => {
      const error = {code: 5, message: 'not found'};

      sandbox
        .stub(instance, 'getMetadata')
        .callsFake(
          (
            opts_:
              | inst.GetInstanceMetadataOptions
              | inst.GetInstanceMetadataCallback,
            callback
          ) => {
            callback = typeof opts_ === 'function' ? opts_ : callback;

            callback(error as grpc.ServiceError);
          }
        );

      instance.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, false);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');
        console.log('gotFinishedSpans');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.exists'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        // Ensure that the span actually produced an error that was recorded.
        const firstSpan = spans[0];
        assert.strictEqual(
          SpanStatusCode.ERROR,
          firstSpan.status.code,
          'Expected an ERROR span status'
        );
        assert.strictEqual(
          'Error: custom error',
          firstSpan.status.message,
          'Mismatched span status message'
        );

        // We don't expect events.
        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });
  });

  describe('get', () => {
    describe('autoCreate on non-existence', () => {
      const error = new ApiError('Error.') as grpc.ServiceError;
      error.code = 5;

      const OPTIONS = {
        autoCreate: true,
      };

      const OPERATION = {
        listeners: {},
        on(eventName, callback) {
          OPERATION.listeners[eventName] = callback;
          return OPERATION;
        },
      };

      beforeEach(() => {
        OPERATION.listeners = {};

        sandbox
          .stub(instance, 'getMetadata')
          .callsFake((opts_: {}, callback) => callback!(error));

        instance.create = (options, callback) => {
          callback(null, null, OPERATION);
        };
      });

      it('should accept and pass createInstanceRequest options to create', done => {
        const config = 'config';
        const nodes = 1;
        const displayName = 'displayName';
        const labels = {label: 'mayLabael'};

        instance.create = (options, callback) => {
          assert.strictEqual(options.fieldNames, undefined);
          assert.strictEqual(options.autoCreate, undefined);
          assert.deepStrictEqual(options, {config, nodes, displayName, labels});
          callback(null, null, OPERATION);
        };
        instance.get(
          {
            autoCreate: true,
            config,
            nodes,
            displayName,
            labels,
            fieldNames: 'labels',
          },
          (err, instance) => {
            assert.ifError(err);

            traceExporter.forceFlush();
            const spans = traceExporter.getFinishedSpans();
            assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');
            console.log('gotFinishedSpans');

            // Sort the spans by duration.
            spans.sort((spanA, spanB) => {
              spanA.duration < spanB.duration;
            });

            const actualEventNames: string[] = [];
            const actualSpanNames: string[] = [];
            spans.forEach(span => {
              actualSpanNames.push(span.name);
              span.events.forEach(event => {
                actualEventNames.push(event.name);
              });
            });

            const expectedSpanNames = ['CloudSpanner.Database.exists'];
            assert.deepStrictEqual(
              actualSpanNames,
              expectedSpanNames,
              `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
            );

            // Ensure that the span actually produced an error that was recorded.
            const firstSpan = spans[0];
            assert.strictEqual(
              SpanStatusCode.ERROR,
              firstSpan.status.code,
              'Expected an ERROR span status'
            );
            assert.strictEqual(
              'Error: custom error',
              firstSpan.status.message,
              'Mismatched span status message'
            );

            // We don't expect events.
            const expectedEventNames = [];
            assert.deepStrictEqual(
              actualEventNames,
              expectedEventNames,
              `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
            );

            done();
          }
        );
      });

      it('error on create failed', done => {
        const error = new Error('Error.');

        instance.create = (options, callback) => {
          callback(error);
        };

        instance.get(OPTIONS, err => {
          assert.strictEqual(err, error);

          // TODO: fill me in.
          done();
        });
      });

      it('operation error', done => {
        const error = new Error('Error.');

        setImmediate(() => {
          OPERATION.listeners['error'](error);
        });

        instance.get(OPTIONS, err => {
          assert.strictEqual(err, error);
          // TODO: fill me in.
          done();
        });
      });

      it('execute callback if opereation succeeded', done => {
        const metadata = {};

        setImmediate(() => {
          OPERATION.listeners['complete'](metadata);
        });

        instance.get(OPTIONS, (err, instance_, apiResponse) => {
          assert.ifError(err);
          assert.strictEqual(instance_, instance);
          assert.strictEqual(instance.metadata, metadata);
          assert.strictEqual(metadata, apiResponse);
          // TODO: fill me in.
          done();
        });
      });
    });

    it('no auto create without error code 5', done => {
      const error = new Error('Error.') as grpc.ServiceError;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code = 'NOT-5';

      const options = {
        autoCreate: true,
      };

      sandbox
        .stub(instance, 'getMetadata')
        .callsFake((opts_: {}, callback) => callback!(error));

      instance.create = () => {
        throw new Error('Should not create.');
      };

      instance.get(options, err => {
        assert.strictEqual(err, error);
        // TODO: fill me in.
        done();
      });
    });

    it('not auto create unless requested', done => {
      const error = new ApiError('Error.') as grpc.ServiceError;
      error.code = 5;

      sandbox
        .stub(instance, 'getMetadata')
        .callsFake((opts_: {}, callback) => callback!(error));

      instance.create = () => {
        throw new Error('Should not create.');
      };

      instance.get(err => {
        assert.strictEqual(err, error);
        // TODO: fill me in.
        done();
      });
    });

    it('error from getMetadata', done => {
      const error = new Error('Error.') as grpc.ServiceError;

      sandbox
        .stub(instance, 'getMetadata')
        .callsFake((opts_: {}, callback) => callback!(error));

      instance.get(err => {
        assert.strictEqual(err, error);
        // TODO: fill me in.
        done();
      });
    });
  });

  describe('getDatabases', () => {
    const pageSize = 3;
    const OPTIONS = {
      pageSize,
      gaxOptions: {autoPaginate: false},
    } as inst.GetDatabasesOptions;
    const ORIGINAL_OPTIONS = extend({}, OPTIONS);

    it('with no error', done => {
      const expectedReqOpts = extend({}, OPTIONS, {
        parent: instance.formattedName_,
      });
      delete expectedReqOpts.gaxOptions;

      instance.request = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'listDatabases');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, OPTIONS);
        assert.deepStrictEqual(OPTIONS, ORIGINAL_OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, OPTIONS.gaxOptions);
        assert.deepStrictEqual(config.headers, instance.resourceHeader_);

        // TODO: fill me in.
        done();
      };

      instance.getDatabases(OPTIONS, assert.ifError);
    });

    it('with error', () => {
      const REQUEST_RESPONSE_ARGS = [new Error('Error.'), null, null, {}];

      instance.request = (config, callback: Function) => {
        callback(...REQUEST_RESPONSE_ARGS);
      };

      instance.getDatabases(OPTIONS, (...args) => {
        assert.deepStrictEqual(args, REQUEST_RESPONSE_ARGS);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 spans expected');
        console.log('gotFinishedSpans');

        // Sort the spans by duration.
        spans.sort((spanA, spanB) => {
          spanA.duration < spanB.duration;
        });

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.exists'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        // Ensure that the span actually produced an error that was recorded.
        const firstSpan = spans[0];
        assert.strictEqual(
          SpanStatusCode.ERROR,
          firstSpan.status.code,
          'Expected an ERROR span status'
        );
        assert.strictEqual(
          'Error: custom error',
          firstSpan.status.message,
          'Mismatched span status message'
        );

        // We don't expect events.
        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    describe('with no error', () => {
      const DATABASES = [
        {
          name: 'database-name',
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const REQUEST_RESPONSE_ARGS: any = [null, DATABASES, null, {}];

      instance.request = (config, callback) => {
        callback(...REQUEST_RESPONSE_ARGS);
      };

      const fakeDatabaseInstance = {};

      instance.database = (name, options) => {
        assert.strictEqual(name, DATABASES[0].name);
        assert.strictEqual((options as SessionPoolOptions).min, 0);
        return fakeDatabaseInstance as Database;
      };

      instance.getDatabases(OPTIONS, (...args) => {
        assert.ifError(args[0]);
        assert.strictEqual(args[0], REQUEST_RESPONSE_ARGS[0]);
        const database = args[1]!.pop();
        assert.strictEqual(database, fakeDatabaseInstance);
        assert.strictEqual(database!.metadata, REQUEST_RESPONSE_ARGS[1][0]);
        assert.strictEqual(args[2], REQUEST_RESPONSE_ARGS[2]);
        assert.strictEqual(args[3], REQUEST_RESPONSE_ARGS[3]);

        // TODO: fill me in.
        done();
      });
    });
  });

  describe('getDatabasesStream', () => {
    const OPTIONS = {
      gaxOptions: {autoPaginate: false},
    } as inst.GetDatabasesOptions;
    const returnValue = {} as Duplex;

    it('with no error', () => {
      const expectedReqOpts = extend({}, OPTIONS, {
        parent: instance.formattedName_,
      });
      delete expectedReqOpts.gaxOptions;

      instance.requestStream = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'listDatabasesStream');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, OPTIONS.gaxOptions);
        assert.deepStrictEqual(config.headers, instance.resourceHeader_);

        return returnValue;
      };

      const returnedValue = instance.getDatabasesStream(OPTIONS);
      assert.strictEqual(returnedValue, returnValue);
    });
  });

  describe('getMetadata', () => {
    it('with no error', () => {
      const requestReturnValue = {};

      function callback() {}

      instance.request = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'getInstance');
        assert.deepStrictEqual(config.reqOpts, {
          name: instance.formattedName_,
        });
        assert.strictEqual(config.gaxOpts, undefined);
        assert.deepStrictEqual(config.headers, instance.resourceHeader_);
        return requestReturnValue;
      };

      const returnValue = instance.getMetadata(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('callback with error', done => {
      const error = new Error('Error');
      instance.request = (config, callback) => {
        callback(error);
      };
      instance.getMetadata(err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should update metadata', done => {
      const metadata = {};
      instance.request = (config, callback) => {
        callback(null, metadata);
      };
      instance.getMetadata(() => {
        assert.strictEqual(instance.metadata, metadata);
        done();
      });
    });
  });

  describe('setMetadata', () => {
    const METADATA = {
      needsToBeSnakeCased: true,
    } as inst.IInstance;
    const ORIGINAL_METADATA = extend({}, METADATA);

    it('should make and return the request', () => {
      const requestReturnValue = {};

      function callback() {}

      instance.request = (config, callback_) => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'updateInstance');

        const expectedReqOpts = extend({}, METADATA, {
          name: instance.formattedName_,
        });

        assert.deepStrictEqual(config.reqOpts.instance, expectedReqOpts);
        assert.deepStrictEqual(config.reqOpts.fieldMask, {
          paths: ['needs_to_be_snake_cased'],
        });

        assert.deepStrictEqual(METADATA, ORIGINAL_METADATA);
        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, instance.resourceHeader_);

        assert.strictEqual(callback_, callback);

        return requestReturnValue;
      };

      const returnValue = instance.setMetadata(METADATA, callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should accept gaxOptions', done => {
      const gaxOptions = {};
      instance.request = config => {
        assert.strictEqual(config.gaxOpts, gaxOptions);
        done();
      };
      instance.setMetadata(METADATA, gaxOptions, assert.ifError);
    });

    it('should not require a callback', () => {
      assert.doesNotThrow(() => {
        instance.setMetadata(METADATA);
      });
    });
  });

  describe('getBackupsStream', () => {
    const OPTIONS = {
      gaxOptions: {autoPaginate: false},
    } as inst.GetDatabasesOptions;
    const returnValue = {} as Duplex;

    it('should make and return the correct gax API call', () => {
      const expectedReqOpts = extend({}, OPTIONS, {
        parent: instance.formattedName_,
      });
      delete expectedReqOpts.gaxOptions;

      instance.requestStream = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'listBackupsStream');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, OPTIONS.gaxOptions);
        assert.deepStrictEqual(config.headers, instance.resourceHeader_);

        return returnValue;
      };

      const returnedValue = instance.getBackupsStream(OPTIONS);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const expectedGaxOpts = {timeout: 1000};
      const options = {gaxOptions};
      const expectedReqOpts = extend(
        {},
        {
          parent: instance.formattedName_,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );

      instance.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);

        return returnValue;
      };

      const returnedValue = instance.getBackupsStream(options);
      assert.strictEqual(returnedValue, returnValue);
    });
  });
});
