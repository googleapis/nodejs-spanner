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

const lessComparator = (a, b) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/*
 * runBenchmarks runs each of the functions in runners ${nRuns} times
 * each time collecting RAM usage and time spent and then produces
 * a map of functionNames to the percentiles of RAM usage and time spent.
 */
export async function runBenchmarks(runners: Function[], done: Function) {
  const nRuns = 10000;
  const nWarmups = Math.round(nRuns / 8);
  const benchmarkValues = {_totalRuns: nRuns, _warmRuns: nWarmups};

  let k = 0;
  for (k = 0; k < runners.length; k++) {
    const fn = runners[k];
    const functionName = fn.name;
    const timeSpentL: bigint[] = [];
    const ramL: number[] = [];
    let i = 0;

    // Warm up runs to ensure stable behavior.
    for (i = 0; i < nWarmups; i++) {
      const value = await fn();
    }

    for (i = 0; i < nRuns; i++) {
      const startTime: bigint = process.hrtime.bigint();
      const startHeapUsedBytes: number = process.memoryUsage().heapUsed;
      const value = await fn();
      timeSpentL.push(process.hrtime.bigint() - startTime);
      ramL.push(process.memoryUsage().heapUsed - startHeapUsedBytes);
    }

    timeSpentL.sort(lessComparator);
    ramL.sort(lessComparator);

    benchmarkValues[functionName] = {
      ram: percentiles(functionName, ramL, 'bytes'),
      timeSpent: percentiles(functionName, timeSpentL, 'time'),
    };
  }

  done(benchmarkValues);
}

function percentiles(method, sortedValues, kind) {
  const n = sortedValues.length;
  const p50 = sortedValues[Math.floor(n * 0.5)];
  const p75 = sortedValues[Math.floor(n * 0.75)];
  const p90 = sortedValues[Math.floor(n * 0.9)];
  const p95 = sortedValues[Math.floor(n * 0.95)];
  const p99 = sortedValues[Math.floor(n * 0.99)];

  return {
    p50: p50,
    p75: p75,
    p90: p90,
    p95: p95,
    p99: p99,
    p50_s: humanize(p50, kind),
    p75_s: humanize(p75, kind),
    p90_s: humanize(p90, kind),
    p95_s: humanize(p95, kind),
    p99_s: humanize(p99, kind),
  };
}

function humanize(values, kind) {
  let converterFn = humanizeTime;
  if (kind === 'bytes') {
    converterFn = humanizeBytes;
  }
  return converterFn(values);
}

const secondUnits = ['ns', 'µs', 'ms', 's'];
interface unitDivisor {
  unit: string;
  divisor: number;
}
const pastSecondUnits: unitDivisor[] = [
  {unit: 'min', divisor: 60},
  {unit: 'hr', divisor: 60},
  {unit: 'day', divisor: 24},
  {unit: 'week', divisor: 7},
  {unit: 'month', divisor: 30},
];
function humanizeTime(ns) {
  const sign: number = ns < 0 ? -1 : +1;
  let value = Math.abs(Number(ns));
  for (const unit of secondUnits) {
    if (value < 1000) {
      return `${(sign * value).toFixed(3)}${unit}`;
    }
    value /= 1000;
  }

  let i = 0;
  for (i = 0; i < pastSecondUnits.length; i++) {
    const unitPlusValue = pastSecondUnits[i];
    const unitName = unitPlusValue.unit;
    const divisor = unitPlusValue.divisor;
    if (value < divisor) {
      return `${sign * value}${unitName}`;
    }
    value = value / divisor;
  }
  return `${(sign * value).toFixed(3)}${pastSecondUnits[pastSecondUnits.length - 1][0]}`;
}

const bytesUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'ExB'];
function humanizeBytes(b) {
  const sign: number = b < 0 ? -1 : +1;
  let value = Math.abs(b);
  for (const unit of bytesUnits) {
    if (value < 1024) {
      return `${(sign * value).toFixed(3)}${unit}`;
    }
    value = value / 1024;
  }

  return `${(sign * value).toFixed(3)}${bytesUnits[bytesUnits.length - 1]}`;
}
export {humanizeTime, humanizeBytes};
