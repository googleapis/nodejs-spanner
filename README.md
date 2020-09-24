[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Cloud Spanner: Node.js Client](https://github.com/googleapis/nodejs-spanner)

[![release level](https://img.shields.io/badge/release%20level-general%20availability%20%28GA%29-brightgreen.svg?style=flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/@google-cloud/spanner.svg)](https://www.npmjs.org/package/@google-cloud/spanner)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/nodejs-spanner/master.svg?style=flat)](https://codecov.io/gh/googleapis/nodejs-spanner)




[Cloud Spanner](https://cloud.google.com/spanner/docs/) is a fully managed, mission-critical, relational database service that
offers transactional consistency at global scale, schemas, SQL (ANSI 2011 with extensions),
and automatic, synchronous replication for high availability.


A comprehensive list of changes in each version may be found in
[the CHANGELOG](https://github.com/googleapis/nodejs-spanner/blob/master/CHANGELOG.md).

* [Cloud Spanner Node.js Client API Reference][client-docs]
* [Cloud Spanner Documentation][product-docs]
* [github.com/googleapis/nodejs-spanner](https://github.com/googleapis/nodejs-spanner)

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

1.  [Select or create a Cloud Platform project][projects].
1.  [Enable billing for your project][billing].
1.  [Enable the Cloud Spanner API][enable_api].
1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

### Installing the client library

```bash
npm install @google-cloud/spanner
```


### Using the client library

```javascript
// Imports the Google Cloud client library
const {Spanner} = require('@google-cloud/spanner');

// Creates a client
const spanner = new Spanner({projectId});

// Gets a reference to a Cloud Spanner instance and database
const instance = spanner.instance(instanceId);
const database = instance.database(databaseId);

// The query to execute
const query = {
  sql: 'SELECT 1',
};

// Execute a simple SQL statement
const [rows] = await database.run(query);
console.log(`Query: ${rows.length} found.`);
rows.forEach(row => console.log(row));

```



## Samples

Samples are in the [`samples/`](https://github.com/googleapis/nodejs-spanner/tree/master/samples) directory. The samples' `README.md`
has instructions for running the samples.

| Sample                      | Source Code                       | Try it |
| --------------------------- | --------------------------------- | ------ |
| Backups-cancel | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-cancel.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-cancel.js,samples/README.md) |
| Backups-create | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-create.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-create.js,samples/README.md) |
| Backups-delete | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-delete.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-delete.js,samples/README.md) |
| Backups-get-database-operations | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-get-database-operations.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-get-database-operations.js,samples/README.md) |
| Backups-get-operations | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-get-operations.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-get-operations.js,samples/README.md) |
| Backups-get | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-get.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-get.js,samples/README.md) |
| Backups-restore | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-restore.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-restore.js,samples/README.md) |
| Backups-update | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups-update.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-update.js,samples/README.md) |
| Backups | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/backups.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups.js,samples/README.md) |
| Batch | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/batch.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/batch.js,samples/README.md) |
| CRUD | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/crud.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/crud.js,samples/README.md) |
| Datatypes | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/datatypes.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/datatypes.js,samples/README.md) |
| DML | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/dml.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/dml.js,samples/README.md) |
| Indexing | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/indexing.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/indexing.js,samples/README.md) |
| Instance | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/instance.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/instance.js,samples/README.md) |
| Numeric-add-column | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/numeric-add-column.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/numeric-add-column.js,samples/README.md) |
| Numeric-query-parameter | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/numeric-query-parameter.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/numeric-query-parameter.js,samples/README.md) |
| Numeric-update-data | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/numeric-update-data.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/numeric-update-data.js,samples/README.md) |
| Queryoptions | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/queryoptions.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/queryoptions.js,samples/README.md) |
| Quickstart | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/quickstart.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/quickstart.js,samples/README.md) |
| Schema | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/schema.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/schema.js,samples/README.md) |
| Struct | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/struct.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/struct.js,samples/README.md) |
| Timestamp | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/timestamp.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/timestamp.js,samples/README.md) |
| Transaction | [source code](https://github.com/googleapis/nodejs-spanner/blob/master/samples/transaction.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/transaction.js,samples/README.md) |



The [Cloud Spanner Node.js Client API Reference][client-docs] documentation
also contains samples.

## Supported Node.js Versions

Our client libraries follow the [Node.js release schedule](https://nodejs.org/en/about/releases/).
Libraries are compatible with all current _active_ and _maintenance_ versions of
Node.js.

Client libraries targetting some end-of-life versions of Node.js are available, and
can be installed via npm [dist-tags](https://docs.npmjs.com/cli/dist-tag).
The dist-tags follow the naming convention `legacy-(version)`.

_Legacy Node.js versions are supported as a best effort:_

* Legacy versions will not be tested in continuous integration.
* Some security patches may not be able to be backported.
* Dependencies will not be kept up-to-date, and features will not be backported.

#### Legacy tags available

* `legacy-8`: install client libraries from this dist-tag for versions
  compatible with Node.js 8.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).


This library is considered to be **General Availability (GA)**. This means it
is stable; the code surface will not change in backwards-incompatible ways
unless absolutely necessary (e.g. because of critical security issues) or with
an extensive deprecation period. Issues and requests against **GA** libraries
are addressed with the highest priority.





More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/nodejs-spanner/blob/master/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/nodejs-spanner/blob/master/LICENSE)

[client-docs]: https://googleapis.dev/nodejs/spanner/latest
[product-docs]: https://cloud.google.com/spanner/docs/
[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing
[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid=spanner.googleapis.com
[auth]: https://cloud.google.com/docs/authentication/getting-started
