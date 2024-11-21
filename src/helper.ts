/**
 * Copyright 2024 Google LLC
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

import {grpc} from 'google-gax';
/**
 * Checks whether the given error is a 'Database not found' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is a 'Database not found' error, and otherwise false.
 */
export function isDatabaseNotFoundError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.NOT_FOUND &&
    error.message.includes('Database not found')
  );
}

/**
 * Checks whether the given error is an 'Instance not found' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is an 'Instance not found' error, and otherwise false.
 */
export function isInstanceNotFoundError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.NOT_FOUND &&
    error.message.includes('Instance not found')
  );
}

/**
 * Checks whether the given error is a 'Could not load the default credentials' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is a 'Could not load the default credentials' error, and otherwise false.
 */
export function isDefaultCredentialsNotSetError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.message.includes('Could not load the default credentials')
  );
}

/**
 * Checks whether the given error is an 'Unable to detect a Project Id in the current environment' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is an 'Unable to detect a Project Id in the current environment' error, and otherwise false.
 */
export function isProjectIdNotSetInEnvironmentError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.message.includes(
      'Unable to detect a Project Id in the current environment'
    )
  );
}

/**
 * Checks whether the given error is a 'Create session permission' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is a 'Create session permission' error, and otherwise false.
 */
export function isCreateSessionPermissionError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.PERMISSION_DENIED &&
    error.message.includes('spanner.sessions.create')
  );
}
