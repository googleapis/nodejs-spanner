/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const checkpointStream = require('checkpoint-stream');
const eventsIntercept = require('events-intercept');
const extend = require('extend');
const is = require('is');
const mergeStream = require('merge-stream');
const {split} = require('split-array-stream');
const streamEvents = require('stream-events');
const through = require('through2');

const RowBuilder = require('./row-builder');

/**
 * Rows returned from queries may be chunked, requiring them to be stitched
 * together. This function returns a stream that will properly assemble these
 * rows, as well as retry after an error. Rows are only emitted if they hit a
 * "checkpoint", which is when a `resumeToken` is returned from the API. Without
 * that token, it's unsafe for the query to be retried, as we wouldn't want to
 * emit the same data multiple times.
 *
 * @private
 *
 * @class
 * @param {function} requestFn The function that makes an API request. It will
 *     receive one argument, `resumeToken`, which should be used however is
 *     necessary to send to the API for additional requests.
 * @param {object} options Request options
 */
function partialResultStream(requestFn, options) {
  let lastResumeToken;
  let activeRequestStream;

  options = extend({toJSON: false}, options);

  // mergeStream allows multiple streams to be connected into one. This is good
  // if we need to retry a request and pipe more data to the user's stream.
  const requestsStream = mergeStream();
  eventsIntercept.patch(requestsStream);

  function makeRequest() {
    activeRequestStream = requestFn(lastResumeToken);
    requestsStream.add(activeRequestStream);
  }

  const batchAndSplitOnTokenStream = checkpointStream.obj({
    maxQueued: 10,
    isCheckpointFn: function(row) {
      return is.defined(row.resumeToken);
    },
  });

  let builder;

  const userStream = streamEvents(
    through.obj(function(row, _, next) {
      if (is.empty(row.values)) {
        next();
        return;
      }

      // Use RowBuilder to construct and return complete, formatted rows.
      if (!builder) {
        builder = new RowBuilder(row.metadata.rowType.fields);
      }

      builder.addRow(row);

      // Build the chunks to rows.
      builder.build();

      let formattedRows = builder.toJSON(builder.flush());

      if (options.json) {
        formattedRows = formattedRows.map(x => x.toJSON(options.jsonOptions));
      }

      split(formattedRows, userStream).then(() => next());
    })
  );

  userStream.abort = function() {
    if (activeRequestStream) {
      activeRequestStream.abort();
    }
  };

  userStream.once('reading', makeRequest);

  return requestsStream
    .intercept('error', function(err) {
      if (lastResumeToken) {
        // We're going to retry from where we left off.
        // Empty queued rows on the checkpoint stream (will not emit them to
        // user).
        batchAndSplitOnTokenStream.reset();
        makeRequest();
        return;
      }

      setImmediate(function() {
        // We won't retry the request, so this will flush any rows the
        // checkpoint stream has queued. After that, we will destroy the user's
        // stream with the same error.
        batchAndSplitOnTokenStream.destroy(err);
      });
    })
    .pipe(batchAndSplitOnTokenStream)
    .on('error', function(err) {
      // If we get this error, the checkpoint stream has flushed any rows it had
      // queued. We can now destroy the user's stream, as our retry attempts are
      // over.
      userStream.destroy(err);
    })
    .on('checkpoint', function(row) {
      lastResumeToken = row.resumeToken;
    })
    .pipe(userStream);
}

module.exports = partialResultStream;
