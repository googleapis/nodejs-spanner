<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Cloud Spanner: Node.js Samples

[![Open in Cloud Shell][shell_img]][shell_link]

[Cloud Spanner](https://cloud.google.com/spanner/docs/) is a fully managed, mission-critical, relational database service that offers transactional consistency at global scale, schemas, SQL (ANSI 2011 with extensions), and automatic, synchronous replication for high availability.

## Table of Contents

* [Before you begin](#before-you-begin)
* [Samples](#samples)
  * [Schema](#schema)
  * [CRUD](#crud)
  * [Indexing](#indexing)
  * [Transactions](#transactions)

## Before you begin

Before running the samples, make sure you've followed the steps in the
[Before you begin section](../README.md#before-you-begin) of the client
library's README.

## Samples

### Schema

View the [source code][schema_0_code].

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/schema.js,samples/README.md)

__Usage:__ `node schema.js --help`

```
schema.js <command>

Commands:
  schema.js createDatabase <instanceName> <databaseName>        Creates an example database with two tables in a Cloud
  <projectId>                                                   Spanner instance.
  schema.js addColumn <instanceName> <databaseName>             Adds an example MarketingBudget column to an example
  <projectId>                                                   Cloud Spanner table.
  schema.js queryNewColumn <instanceName> <databaseName>        Executes a read-only SQL query against an example Cloud
  <projectId>                                                   Spanner table with an additional column
                                                                (MarketingBudget) added by addColumn.

Options:
  --version  Show version number                                                                               [boolean]
  --help     Show help                                                                                         [boolean]

Examples:
  node schema.js createDatabase "my-instance" "my-database" "my-project-id"
  node schema.js addColumn "my-instance" "my-database" "my-project-id"
  node schema.js queryNewColumn "my-instance" "my-database" "my-project-id"

For more information, see https://cloud.google.com/spanner/docs
```

[schema_0_docs]: https://cloud.google.com/spanner/docs
[schema_0_code]: schema.js

### CRUD

View the [source code][crud_1_code].

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/crud.js,samples/README.md)

__Usage:__ `node crud.js --help`

```
crud.js <command>

Commands:
  crud.js update <instanceName> <databaseName> <projectId>      Modifies existing rows of data in an example Cloud
                                                                Spanner table.
  crud.js query <instanceName> <databaseName> <projectId>       Executes a read-only SQL query against an example Cloud
                                                                Spanner table.
  crud.js insert <instanceName> <databaseName> <projectId>      Inserts new rows of data into an example Cloud Spanner
                                                                table.
  crud.js read <instanceName> <databaseName> <projectId>        Reads data in an example Cloud Spanner table.
  crud.js read-stale <instanceName> <databaseName> <projectId>  Reads stale data in an example Cloud Spanner table.

Options:
  --version  Show version number                                                                               [boolean]
  --help     Show help                                                                                         [boolean]

Examples:
  node crud.js update "my-instance" "my-database" "my-project-id"
  node crud.js query "my-instance" "my-database" "my-project-id"
  node crud.js insert "my-instance" "my-database" "my-project-id"
  node crud.js read "my-instance" "my-database" "my-project-id"
  node crud.js read-stale "my-instance" "my-database" "my-project-id"

For more information, see https://cloud.google.com/spanner/docs
```

[crud_1_docs]: https://cloud.google.com/spanner/docs
[crud_1_code]: crud.js

### Indexing

View the [source code][indexing_2_code].

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/indexing.js,samples/README.md)

__Usage:__ `node indexing.js --help`

```
indexing.js <command>

Commands:
  indexing.js createIndex <instanceName> <databaseName>         Creates a new index in an example Cloud Spanner table.
  <projectId>
  indexing.js createStoringIndex <instanceName> <databaseName>  Creates a new value-storing index in an example Cloud
  <projectId>                                                   Spanner table.
  indexing.js queryIndex <instanceName> <databaseName>          Executes a read-only SQL query against an example Cloud
  <projectId>                                                   Spanner table using an existing index.
                                                                Returns results with titles between a start title
                                                                (default: 'Ardvark') and an end title (default: 'Goo').
  indexing.js readIndex <instanceName> <databaseName>           Reads data from an example Cloud Spanner table using an
  <projectId>                                                   existing index.
  indexing.js readStoringIndex <instanceName> <databaseName>    Reads data from an example Cloud Spanner table using an
  <projectId>                                                   existing storing index.

Options:
  --version  Show version number                                                                               [boolean]
  --help     Show help                                                                                         [boolean]

Examples:
  node indexing.js createIndex "my-instance" "my-database" "my-project-id"
  node indexing.js createStoringIndex "my-instance" "my-database" "my-project-id"
  node indexing.js queryIndex "my-instance" "my-database" "my-project-id"
  node indexing.js readIndex "my-instance" "my-database" "my-project-id"
  node indexing.js readStoringIndex "my-instance" "my-database" "my-project-id"

For more information, see https://cloud.google.com/spanner/docs
```

[indexing_2_docs]: https://cloud.google.com/spanner/docs
[indexing_2_code]: indexing.js

### Transactions

View the [source code][transaction_3_code].

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/transaction.js,samples/README.md)

__Usage:__ `node transaction.js --help`

```
transaction.js <command>

Commands:
  transaction.js readOnly <instanceName> <databaseName>         Execute a read-only transaction on an example Cloud
  <projectId>                                                   Spanner table.
  transaction.js readWrite <instanceName> <databaseName>        Execute a read-write transaction on an example Cloud
  <projectId>                                                   Spanner table.

Options:
  --version  Show version number                                                                               [boolean]
  --help     Show help                                                                                         [boolean]

Examples:
  node transaction.js readOnly "my-instance" "my-database" "my-project-id"
  node transaction.js readWrite "my-instance" "my-database" "my-project-id"

For more information, see https://cloud.google.com/spanner/docs
```

[transaction_3_docs]: https://cloud.google.com/spanner/docs
[transaction_3_code]: transaction.js

[shell_img]: //gstatic.com/cloudssh/images/open-btn.png
[shell_link]: https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/README.md
