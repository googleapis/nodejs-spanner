/**
 * @fileoverview Samples tests work with the same project in Google Cloud and
 * can fail if more than one test job is running at the same time.
 * This script will help CircleCI job wait until all the similar tasks are
 * completed.
 */

const axios = require('axios');
const TIMEOUT = 5000;

function waitForRunningTasks(options) {
  return new Promise(fulfill => {
    axios
      .get(
        `https://circleci.com/api/v1.1/project/github/${options['username']}/${
          options['reponame']
        }`,
        {
          headers: {
            Accept: 'application/json',
          },
          params: {
            'circle-token': options['circleToken'],
          },
        }
      )
      .then(response => {
        let ahead = [];
        let builds = response['data'];
        for (let build of builds) {
          if (
            build['username'] === options['username'] &&
            build['reponame'] === options['reponame'] &&
            build['build_parameters']['CIRCLE_JOB'] === options['job'] &&
            build['build_num'] < options['buildNum'] &&
            build['status'] === 'running'
          ) {
            ahead.push(build['build_num']);
          }
        }

        if (ahead.length === 0) {
          console.log(`No running ${options['job']} builds found.`);
          fulfill();
        } else {
          console.log(
            `Found ${ahead.length} running ${
              options['job']
            } builds: ${ahead.join(', ')}. Waiting...`
          );
          setTimeout(() => {
            waitForRunningTasks(options).then(fulfill);
          }, TIMEOUT);
        }
      });
  });
}

function main() {
  if (process.env['CIRCLECI'] === undefined) {
    console.log('Not in CircleCI, no need to wait. Exiting.');
    return;
  }

  let circleToken = process.env['CIRCLECI_TOKEN'];
  if (circleToken === undefined) {
    console.log(
      'You need to define CIRCLECI_TOKEN environment variable to enable waiting for jobs. Exiting.'
    );
    return;
  }

  let username = process.env['CIRCLE_PROJECT_USERNAME'];
  let reponame = process.env['CIRCLE_PROJECT_REPONAME'];
  let job = process.env['CIRCLE_JOB'];
  let buildNum = Number.parseInt(process.env['CIRCLE_BUILD_NUM']);

  waitForRunningTasks({username, reponame, job, buildNum, circleToken}).then(
    () => {
      console.log('Wait complete, starting tests.');
    }
  );
}

main();
