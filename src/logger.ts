/*!
 * Copyright 2022 Google Inc. All Rights Reserved.
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

import {Database} from './database';
import winston = require('winston');
const {LoggingWinston} = require('@google-cloud/logging-winston');
const loggingWinston = new LoggingWinston();

export class DatabaseLogger {
  static loggerMap: Map<Database, winston.Logger>;
  logger: winston.Logger;
  constructor(database: Database, transports?: []) {
    if (!DatabaseLogger.loggerMap) {
      DatabaseLogger.loggerMap = new Map<Database, winston.Logger>();
    }
    if (transports) {
      this.logger = winston.createLogger({
        transports: transports,
      });
    } else {
      this.logger = winston.createLogger({
        transports: [loggingWinston],
      });
    }
    DatabaseLogger.loggerMap.set(database, this.logger);
  }
}
