import * as sinon from 'sinon';
import * as assert from 'assert';
import {grpc} from 'google-gax';
import * as mock from '../mockserver/mockspanner';
import {MockError, SimulatedExecutionTime} from '../mockserver/mockspanner';
import {Database, Instance, Spanner} from '../../src';
import {MetricsTracerFactory} from '../../src/metrics/metrics-tracer-factory';
import {MetricsTracer} from '../../src/metrics/metrics-tracer';

describe('Test metrics with mock server', () => {
  let sandbox: sinon.SinonSandbox;
  const selectSql = 'SELECT NUM, NAME FROM NUMBERS';
  const server = new grpc.Server();
  const spannerMock = mock.createMockSpanner(server);
  let mockMetricsTracer: sinon.SinonStubbedInstance<MetricsTracer>;
  let mockFactory: sinon.SinonStubbedInstance<MetricsTracerFactory>;
  let port: number;
  let spanner: Spanner;
  let instance: Instance;
  let dbCounter = 1;

  function newTestDatabase(): Database {
    return instance.database(`database-${dbCounter++}`, undefined);
  }

  before(async () => {
    sandbox = sinon.createSandbox();
    port = await new Promise((resolve, reject) => {
      server.bindAsync(
        '0.0.0.0:0',
        grpc.ServerCredentials.createInsecure(),
        (err, assignedPort) => {
          if (err) {
            reject(err);
          } else {
            resolve(assignedPort);
          }
        },
      );
    });
    spannerMock.putStatementResult(
      selectSql,
      mock.StatementResult.resultSet(mock.createSimpleResultSet()),
    );
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    MetricsTracerFactory.resetInstance();
    process.env.SPANNER_DISABLE_BUILTIN_METRICS = 'false';
    spanner = new Spanner({
      servicePath: 'localhost',
      port,
      sslCreds: grpc.credentials.createInsecure(),
    });
    instance = spanner.instance('instance');
  });

  after(() => {
    spanner.close();
    server.tryShutdown(() => {});
    delete process.env.SPANNER_EMULATOR_HOST;
    sandbox.restore();
  });

  beforeEach(() => {
    spannerMock.resetRequests();
    spannerMock.removeExecutionTimes();
    // Mock MetricsTracer
    mockMetricsTracer = sandbox.createStubInstance(MetricsTracer);
    mockMetricsTracer.recordAttemptStart = sandbox.stub<[], void>();
    mockMetricsTracer.recordAttemptCompletion = sandbox.stub<
      [status?: number],
      void
    >();
    mockMetricsTracer.extractGfeLatency = sandbox
      .stub()
      .callsFake((header: string) => {
        if (header === 'gfet4t7; dur=90') {
          return 90;
        }
        return null;
      }) as sinon.SinonStub<[string], number | null>;
    mockMetricsTracer.recordGfeLatency = sandbox.stub<
      [latency: number],
      void
    >();
    mockMetricsTracer.recordGfeConnectivityErrorCount = sandbox.stub<
      [],
      void
    >();

    // Mock MetricsTracerFactory
    mockFactory = sandbox.createStubInstance(MetricsTracerFactory);
    mockFactory.getCurrentTracer = sandbox
      .stub()
      .returns(mockMetricsTracer) as sinon.SinonStub<
      [string],
      MetricsTracer | null
    >;
    sandbox.stub(MetricsTracerFactory, 'getInstance').returns(mockFactory);
  });

  it('Retried requests should increase attempt metric counts', done => {
    const database = newTestDatabase();
    const err = {
      message: 'Temporary unavailable',
      code: grpc.status.UNAVAILABLE,
    } as MockError;

    spannerMock.setExecutionTime(
      spannerMock.executeStreamingSql,
      SimulatedExecutionTime.ofError(err),
    );

    database.run(selectSql, (err, rows) => {
      assert.ifError(err);
      assert.strictEqual(rows!.length, 3);
      // Metric Attempts should be recorded 3 times from the interceptor:
      // - 1 for the session
      // - 2 for the retried executeStreamingSql
      assert.strictEqual(mockMetricsTracer.recordAttemptStart.callCount, 3);
      assert.strictEqual(
        mockMetricsTracer.recordAttemptCompletion.callCount,
        3,
      );
      database
        .close()
        .then(() => done())
        .catch(err => done(err));
    });
  });
});
