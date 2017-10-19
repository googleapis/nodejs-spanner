<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Cloud Spanner: Node.js Client

[![release level](https://img.shields.io/badge/release%20level-beta-yellow.svg?style&#x3D;flat)](https://cloud.google.com/terms/launch-stages)
[![CircleCI](https://img.shields.io/circleci/project/github/googleapis/nodejs-spanner.svg?style=flat)](https://circleci.com/gh/googleapis/nodejs-spanner)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/github/googleapis/nodejs-spanner?branch=master&svg=true)](https://ci.appveyor.com/project/googleapis/nodejs-spanner)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/nodejs-spanner/master.svg?style=flat)](https://codecov.io/gh/googleapis/nodejs-spanner)

> Node.js idiomatic client for [Cloud Spanner][product-docs].

[Cloud Spanner](https://cloud.google.com/spanner/docs/) is a fully managed, mission-critical, relational database service that offers transactional consistency at global scale, schemas, SQL (ANSI 2011 with extensions), and automatic, synchronous replication for high availability.

* [Cloud Spanner Node.js Client API Reference][client-docs]
* [Cloud Spanner Documentation][product-docs]

Read more about the client libraries for Cloud APIs, including the older
Google APIs Client Libraries, in [Client Libraries Explained][explained].

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

**Table of contents:**

* [Quickstart](#quickstart)
  * [Before you begin](#before-you-begin)
  * [Installing the client library](#installing-the-client-library)
  * [Using the client library](#using-the-client-library)
* [Samples](#samples)
* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)

## Quickstart

### Before you begin

1.  Select or create a Cloud Platform project.

    [Go to the projects page][projects]

1.  Enable billing for your project.

    [Enable billing][billing]

1.  Enable the Cloud Spanner API.

    [Enable the API][enable_api]

1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing
[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid=spanner.googleapis.com
[auth]: https://cloud.google.com/docs/authentication/getting-started

### Installing the client library

    npm install --save @google-cloud/spanner

### Using the client library

```javascript
// Imports the Google Cloud client library
const Spanner = require('@google-cloud/spanner');

// Your Google Cloud Platform project ID
const projectId = 'YOUR_PROJECT_ID';

// Instantiates a client
const spanner = Spanner({
  projectId: projectId
});

// Your Cloud Spanner instance ID
const instanceId = 'my-instance';

// Your Cloud Spanner database ID
const databaseId = 'my-database';

// Gets a reference to a Cloud Spanner instance and database
const instance = spanner.instance(instanceId);
const database = instance.database(databaseId);

// The query to execute
const query = {
  sql: 'SELECT 1'
};

// Execute a simple SQL statement
database.run(query)
  .then((results) => {
    const rows = results[0];

    rows.forEach((row) => console.log(row));
  });
```

## Samples

Samples are in the [`samples/`](https://github.com/googleapis/nodejs-spanner/blob/master/samples) directory. The samples' `README.md`
has instructions for running the samples.

| Sample                      | Source Code                       |
| --------------------------- | --------------------------------- |
| Schema | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/schema.js) |
| CRUD | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/crud.js) |
| Indexing | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/indexing.js) |
| Transactions | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/transaction.js) |

The [Cloud Spanner Node.js Client API Reference][client-docs] documentation
also contains samples.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

This library is considered to be in **beta**. This means it is expected to be
mostly stable while we work toward a general availability release; however,
complete stability is not guaranteed. We will address issues and requests
against beta libraries with a high priority.

More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](.github/CONTRIBUTING.md).

## License

Apache Version 2.0

See [LICENSE](LICENSE)

[client-docs]: https://cloud.google.com/nodejs/docs/reference/spanner/latest/
[product-docs]: https://cloud.google.com/spanner/docs/
