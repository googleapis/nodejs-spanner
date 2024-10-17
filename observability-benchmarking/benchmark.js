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

'use strict';

const {MutationSet, Spanner} = require('@google-cloud/spanner');

async function main(projectId, instanceId, databaseId) {
  const spanner = new Spanner({
    projectId: projectId,
    observabilityOptions: {
      enableExtendedTracing: true,
    },
  });

  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const runners = [
    databaseWriteAtLeastOnce,
    dqlSelect1,
    dqlSelectWithSyntaxError,
    dmlDeleteThenInsert,
    dmlWithDuplicates,
    databasBatcheCreateSessions,
    databasGetSessions,
    databaseRun,
    databaseRunWithSyntaxError,
    databaseRunWithDelete,
    databaseRunWithDeleteFromNonExistentTable,
  ]; 

  console.log('Running benchmarks!');
  const withSyntaxErrors = [false];

  const latencies = new Map();
  for (const fn of runners) {
    const method = fn.name;
    console.log(method);
    for (const withSyntaxError of withSyntaxErrors) {
      const latencyL = [];
      let i = 0;
      for (i = 0; i < 100; i++) {
        const startTime = process.hrtime.bigint();
        try {
          await fn(database);
        } catch (e) {
        } finally {
          latencyL.push(process.hrtime.bigint() - startTime);
        }
      }

      latencyL.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });

      if (withSyntaxError) {
        processLatencies(method +' withSyntaxError', latencyL);
      } else {
        processLatencies(method, latencyL);
      }
    }
  }
}

function processLatencies(method, latencyL) {
  const n = latencyL.length;
  const p50 = humanize(latencyL[Math.floor(n * 0.5)]);
  const p75 = humanize(latencyL[Math.floor(n * 0.75)]);
  const p95 = humanize(latencyL[Math.floor(n * 0.95)]);
  const p99 = humanize(latencyL[Math.floor(n * 0.99)]);
  console.log(
    `\tp50: ${p50}\n\tp75: ${p75}\n\tp95: ${p95}\n\tp99: ${p99}\n`
  );
}

const units = ['ns', 'us', 'ms', 's'];

function humanize(ns) {
  let value = ns;
  for (const unit of units) {
    if (value < 1000) {
        return `${value} ${unit}`;
    }
    value = value/1000n;
  }
  
  return `${value} ${units[units.length-1]}`;
}

async function dqlSelect1(database) {
  const [snapshot] = await database.getSnapshot();
  const [rows] = await snapshot.run('SELECT 1');
  await snapshot.end();
}

async function dqlSelectWithSyntaxError(database) {
  const [snapshot] = await database.getSnapshot();
  try {
    const [rows] = await snapshot.run('SELECT 1');
  } finally {
    await snapshot.end();
  }
}

async function dmlDeleteThenInsert(database) {
  await database.runTransactionAsync(async tx => {
    const [updateCount1] = await tx.runUpdate('DELETE FROM Singers WHERE 1=1');
    const [updateCount2] = await tx.runUpdate(
      "INSERT INTO Singers(SingerId, firstName) VALUES(1, 'DTB')"
    );
    await tx.commit();
  });
}

async function dmlWithDuplicates(database) {
  return await database.runTransactionAsync(async tx => {
    try {
    const [updateCount1] = await tx.runUpdate(
      "INSERT INTO Singers(SingerId, firstName) VALUES(1, 'DTB')"
    );
    const [updateCount2] = await tx.runUpdate(
      "INSERT INTO Singers(SingerId, firstName) VALUES(1, 'DTB')"
    );
    } catch(e) {
    } finally {
      await tx.end();
    }
  });
}

async function databasBatcheCreateSessions(database) {
  return await database.batchCreateSessions(10);
}

async function databasGetSessions(database) {
  return await database.getSessions();
}

async function databaseRun(database) {
  return await database.run('SELECT 1');
}

async function databaseRunWithSyntaxError(database) {
  return await database.run('SELECT 10 p');
}

async function databaseRunWithDelete(database) {
  return await database.run('DELETE FROM Singers WHERE 1=1');
}

async function databaseRunWithDeleteFromNonExistentTable(database) {
  return await database.run('DELETE FROM NonExistent WHERE 1=1');
}

async function databaseWriteAtLeastOnce(database) {
  const mutations = new MutationSet();
  mutations.upsert('Singers', {
   SingerId: 1,
   FirstName: 'Scarlet',
   LastName: 'Terry',
  });
  mutations.upsert('Singers', {
   SingerId: 2,
   FirstName: 'Marc',
   LastName: 'Richards',
  });

  const [response, err] = await database.writeAtLeastOnce(mutations, {});
} 

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
