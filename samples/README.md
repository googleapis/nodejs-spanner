[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Cloud Spanner: Node.js Samples](https://github.com/googleapis/nodejs-spanner)

[![Open in Cloud Shell][shell_img]][shell_link]

[Cloud Spanner](https://cloud.google.com/spanner/docs/) is a fully managed, mission-critical, relational database service that
offers transactional consistency at global scale, schemas, SQL (ANSI 2011 with extensions),
and automatic, synchronous replication for high availability.

## Table of Contents

* [Before you begin](#before-you-begin)
* [Samples](#samples)
  * [Backups-cancel](#backups-cancel)
  * [Copies a source backup](#copies-a-source-backup)
  * [Backups-create-with-encryption-key](#backups-create-with-encryption-key)
  * [Backups-create](#backups-create)
  * [Backups-delete](#backups-delete)
  * [Backups-get-database-operations](#backups-get-database-operations)
  * [Backups-get-operations](#backups-get-operations)
  * [Backups-get](#backups-get)
  * [Backups-restore-with-encryption-key](#backups-restore-with-encryption-key)
  * [Backups-restore](#backups-restore)
  * [Backups-update](#backups-update)
  * [Backups](#backups)
  * [Batch](#batch)
  * [CRUD](#crud)
  * [Creates a new database with a specific default leader](#creates-a-new-database-with-a-specific-default-leader)
  * [Database-create-with-encryption-key](#database-create-with-encryption-key)
  * [Database-create-with-version-retention-period](#database-create-with-version-retention-period)
  * [Gets the schema definition of an existing database](#gets-the-schema-definition-of-an-existing-database)
  * [Gets the default leader option of an existing database](#gets-the-default-leader-option-of-an-existing-database)
  * [Updates the default leader of an existing database](#updates-the-default-leader-of-an-existing-database)
  * [Datatypes](#datatypes)
  * [DML](#dml)
  * [Get-commit-stats](#get-commit-stats)
  * [Gets the instance config metadata for the configuration nam6](#gets-the-instance-config-metadata-for-the-configuration-nam6)
  * [Creates a new value-storing index](#creates-a-new-value-storing-index)
  * [Creates a new index](#creates-a-new-index)
  * [Executes a read-only SQL query using an existing index.](#executes-a-read-only-sql-query-using-an-existing-index.)
  * [Reads data using an existing storing index.](#reads-data-using-an-existing-storing-index.)
  * [Read data using an existing index.](#read-data-using-an-existing-index.)
  * [Indexing](#indexing)
  * [Instance-with-processing-units](#instance-with-processing-units)
  * [Instance](#instance)
  * [Json-add-column](#json-add-column)
  * [Json-query-parameter](#json-query-parameter)
  * [Json-update-data](#json-update-data)
  * [Lists all databases on the selected instance](#lists-all-databases-on-the-selected-instance)
  * [Lists all the available instance configs for the selected project.](#lists-all-the-available-instance-configs-for-the-selected-project.)
  * [Numeric-add-column](#numeric-add-column)
  * [Numeric-query-parameter](#numeric-query-parameter)
  * [Numeric-update-data](#numeric-update-data)
  * [Showcase the rules for case-sensitivity and case folding for a Spanner PostgreSQL database.](#showcase-the-rules-for-case-sensitivity-and-case-folding-for-a-spanner-postgresql-database.)
  * [Creates a PostgreSQL Database.](#creates-a-postgresql-database.)
  * [Use cast operator to cast from one data type to another in a Spanner PostgreSQL database.](#use-cast-operator-to-cast-from-one-data-type-to-another-in-a-spanner-postgresql-database.)
  * [Execute a batch of DML statements on a Spanner PostgreSQL database.](#execute-a-batch-of-dml-statements-on-a-spanner-postgresql-database.)
  * [Execute a Partitioned DML on a Spanner PostgreSQL database.](#execute-a-partitioned-dml-on-a-spanner-postgresql-database.)
  * [Execute a DML statement with parameters on a Spanner PostgreSQL database.](#execute-a-dml-statement-with-parameters-on-a-spanner-postgresql-database.)
  * [Calls a server side function on a Spanner PostgreSQL database.](#calls-a-server-side-function-on-a-spanner-postgresql-database.)
  * [Created interleaved table hierarchy using PostgreSQL dialect.](#created-interleaved-table-hierarchy-using-postgresql-dialect.)
  * [Showcase how to work with the PostgreSQL NUMERIC/DECIMAL data type on a Spanner PostgreSQL database.](#showcase-how-to-work-with-the-postgresql-numeric/decimal-data-type-on-a-spanner-postgresql-database.)
  * [Showcases how a Spanner PostgreSQL database orders null values in a query.](#showcases-how-a-spanner-postgresql-database-orders-null-values-in-a-query.)
  * [Execute a query with parameters on a Spanner PostgreSQL database.](#execute-a-query-with-parameters-on-a-spanner-postgresql-database.)
  * [Query the information schema metadata in a Spanner PostgreSQL database.](#query-the-information-schema-metadata-in-a-spanner-postgresql-database.)
  * [Queryoptions](#queryoptions)
  * [Quickstart](#quickstart)
  * [Sets a request tag for a single query](#sets-a-request-tag-for-a-single-query)
  * [Rpc-priority](#rpc-priority)
  * [Schema](#schema)
  * [Struct](#struct)
  * [Timestamp](#timestamp)
  * [Executes a read/write transaction with transaction and request tags](#executes-a-read/write-transaction-with-transaction-and-request-tags)
  * [Transaction](#transaction)

## Before you begin

Before running the samples, make sure you've followed the steps outlined in
[Using the client library](https://github.com/googleapis/nodejs-spanner#using-the-client-library).

`cd samples`

`npm install`

`cd ..`

## Samples



### Backups-cancel

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-cancel.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-cancel.js,samples/README.md)

__Usage:__


`node samples/backups-cancel.js`


-----




### Copies a source backup

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-copy.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-copy.js,samples/README.md)

__Usage:__


`node spannerCopyBackup <INSTANCE_ID> <COPY_BACKUP_ID> <SOURCE_BACKUP_ID> <PROJECT_ID>`


-----




### Backups-create-with-encryption-key

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-create-with-encryption-key.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-create-with-encryption-key.js,samples/README.md)

__Usage:__


`node samples/backups-create-with-encryption-key.js`


-----




### Backups-create

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-create.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-create.js,samples/README.md)

__Usage:__


`node samples/backups-create.js`


-----




### Backups-delete

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-delete.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-delete.js,samples/README.md)

__Usage:__


`node samples/backups-delete.js`


-----




### Backups-get-database-operations

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-get-database-operations.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-get-database-operations.js,samples/README.md)

__Usage:__


`node samples/backups-get-database-operations.js`


-----




### Backups-get-operations

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-get-operations.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-get-operations.js,samples/README.md)

__Usage:__


`node samples/backups-get-operations.js`


-----




### Backups-get

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-get.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-get.js,samples/README.md)

__Usage:__


`node samples/backups-get.js`


-----




### Backups-restore-with-encryption-key

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-restore-with-encryption-key.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-restore-with-encryption-key.js,samples/README.md)

__Usage:__


`node samples/backups-restore-with-encryption-key.js`


-----




### Backups-restore

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-restore.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-restore.js,samples/README.md)

__Usage:__


`node samples/backups-restore.js`


-----




### Backups-update

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups-update.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups-update.js,samples/README.md)

__Usage:__


`node samples/backups-update.js`


-----




### Backups

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/backups.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/backups.js,samples/README.md)

__Usage:__


`node samples/backups.js`


-----




### Batch

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/batch.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/batch.js,samples/README.md)

__Usage:__


`node samples/batch.js`


-----




### CRUD

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/crud.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/crud.js,samples/README.md)

__Usage:__


`node samples/crud.js`


-----




### Creates a new database with a specific default leader

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/database-create-with-default-leader.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/database-create-with-default-leader.js,samples/README.md)

__Usage:__


`node database-create-with-default-leader.js <INSTANCE_ID> <DATABASE_ID> <DEFAULT_LEADER> <PROJECT_ID>`


-----




### Database-create-with-encryption-key

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/database-create-with-encryption-key.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/database-create-with-encryption-key.js,samples/README.md)

__Usage:__


`node samples/database-create-with-encryption-key.js`


-----




### Database-create-with-version-retention-period

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/database-create-with-version-retention-period.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/database-create-with-version-retention-period.js,samples/README.md)

__Usage:__


`node samples/database-create-with-version-retention-period.js`


-----




### Gets the schema definition of an existing database

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/database-get-ddl.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/database-get-ddl.js,samples/README.md)

__Usage:__


`node database-get-ddl.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Gets the default leader option of an existing database

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/database-get-default-leader.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/database-get-default-leader.js,samples/README.md)

__Usage:__


`node database-get-default-leader.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Updates the default leader of an existing database

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/database-update-default-leader.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/database-update-default-leader.js,samples/README.md)

__Usage:__


`node database-update-default-leader.js <INSTANCE_ID> <DATABASE_ID> <DEFAULT_LEADER> <PROJECT_ID>`


-----




### Datatypes

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/datatypes.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/datatypes.js,samples/README.md)

__Usage:__


`node samples/datatypes.js`


-----




### DML

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/dml.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/dml.js,samples/README.md)

__Usage:__


`node samples/dml.js`


-----




### Get-commit-stats

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/get-commit-stats.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/get-commit-stats.js,samples/README.md)

__Usage:__


`node samples/get-commit-stats.js`


-----




### Gets the instance config metadata for the configuration nam6

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/get-instance-config.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/get-instance-config.js,samples/README.md)

__Usage:__


`node get-instance-config.js <PROJECT_ID>`


-----




### Creates a new value-storing index

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/index-create-storing.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/index-create-storing.js,samples/README.md)

__Usage:__


`node createStoringIndex <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Creates a new index

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/index-create.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/index-create.js,samples/README.md)

__Usage:__


`node createIndex <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Executes a read-only SQL query using an existing index.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/index-query-data.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/index-query-data.js,samples/README.md)

__Usage:__


`node queryDataWithIndex <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID> <START_TITLE> <END_TITLE>`


-----




### Reads data using an existing storing index.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/index-read-data-with-storing.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/index-read-data-with-storing.js,samples/README.md)

__Usage:__


`node readDataWithStoringIndex <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Read data using an existing index.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/index-read-data.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/index-read-data.js,samples/README.md)

__Usage:__


`node readDataWithIndex <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Indexing

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/indexing.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/indexing.js,samples/README.md)

__Usage:__


`node samples/indexing.js`


-----




### Instance-with-processing-units

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/instance-with-processing-units.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/instance-with-processing-units.js,samples/README.md)

__Usage:__


`node samples/instance-with-processing-units.js`


-----




### Instance

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/instance.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/instance.js,samples/README.md)

__Usage:__


`node samples/instance.js`


-----




### Json-add-column

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/json-add-column.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/json-add-column.js,samples/README.md)

__Usage:__


`node samples/json-add-column.js`


-----




### Json-query-parameter

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/json-query-parameter.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/json-query-parameter.js,samples/README.md)

__Usage:__


`node samples/json-query-parameter.js`


-----




### Json-update-data

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/json-update-data.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/json-update-data.js,samples/README.md)

__Usage:__


`node samples/json-update-data.js`


-----




### Lists all databases on the selected instance

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/list-databases.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/list-databases.js,samples/README.md)

__Usage:__


`node list-databases.js <INSTANCE_ID> <PROJECT_ID>`


-----




### Lists all the available instance configs for the selected project.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/list-instance-configs.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/list-instance-configs.js,samples/README.md)

__Usage:__


`node list-instance-configs.js <PROJECT_ID>`


-----




### Numeric-add-column

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/numeric-add-column.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/numeric-add-column.js,samples/README.md)

__Usage:__


`node samples/numeric-add-column.js`


-----




### Numeric-query-parameter

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/numeric-query-parameter.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/numeric-query-parameter.js,samples/README.md)

__Usage:__


`node samples/numeric-query-parameter.js`


-----




### Numeric-update-data

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/numeric-update-data.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/numeric-update-data.js,samples/README.md)

__Usage:__


`node samples/numeric-update-data.js`


-----




### Showcase the rules for case-sensitivity and case folding for a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-case-sensitivity.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-case-sensitivity.js,samples/README.md)

__Usage:__


`node pg-case-sensitivity.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Creates a PostgreSQL Database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-database-create.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-database-create.js,samples/README.md)

__Usage:__


`node pg-database-create.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Use cast operator to cast from one data type to another in a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-datatypes-casting.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-datatypes-casting.js,samples/README.md)

__Usage:__


`node pg-datatypes-casting.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Execute a batch of DML statements on a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-dml-batch.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-dml-batch.js,samples/README.md)

__Usage:__


`node pg-dml-batch.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Execute a Partitioned DML on a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-dml-partitioned.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-dml-partitioned.js,samples/README.md)

__Usage:__


`node pg-dml-partitioned.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Execute a DML statement with parameters on a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-dml-with-parameter.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-dml-with-parameter.js,samples/README.md)

__Usage:__


`node pg-dml-with-parameter.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Calls a server side function on a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-functions.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-functions.js,samples/README.md)

__Usage:__


`node pg-functions.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Create interleaved table hierarchy using PostgreSQL dialect.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-interleaving.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-interleaving.js,samples/README.md)

__Usage:__


`node pg-interleaving.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Showcase how to work with the PostgreSQL NUMERIC/DECIMAL data type on a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-numeric-data-type.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-numeric-data-type.js,samples/README.md)

__Usage:__


`node ppg-numeric-data-type.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Showcases how a Spanner PostgreSQL database orders null values in a query.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-ordering-nulls.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-ordering-nulls.js,samples/README.md)

__Usage:__


`node pg-ordering-nulls.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Execute a query with parameters on a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-query-parameter.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-query-parameter.js,samples/README.md)

__Usage:__


`node pg-query-parameter.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Query the information schema metadata in a Spanner PostgreSQL database.

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/pg-schema-information.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/pg-schema-information.js,samples/README.md)

__Usage:__


`node pg-schema-information.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Queryoptions

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/queryoptions.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/queryoptions.js,samples/README.md)

__Usage:__


`node samples/queryoptions.js`


-----




### Quickstart

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/quickstart.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/quickstart.js,samples/README.md)

__Usage:__


`node samples/quickstart.js`


-----




### Sets a request tag for a single query

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/request-tag.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/request-tag.js,samples/README.md)

__Usage:__


`node request-tag.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Rpc-priority

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/rpc-priority.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/rpc-priority.js,samples/README.md)

__Usage:__


`node samples/rpc-priority.js`


-----




### Schema

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/schema.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/schema.js,samples/README.md)

__Usage:__


`node samples/schema.js`


-----




### Struct

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/struct.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/struct.js,samples/README.md)

__Usage:__


`node samples/struct.js`


-----




### Timestamp

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/timestamp.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/timestamp.js,samples/README.md)

__Usage:__


`node samples/timestamp.js`


-----




### Executes a read/write transaction with transaction and request tags

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/transaction-tag.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/transaction-tag.js,samples/README.md)

__Usage:__


`node transaction-tag.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>`


-----




### Transaction

View the [source code](https://github.com/googleapis/nodejs-spanner/blob/main/samples/transaction.js).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/transaction.js,samples/README.md)

__Usage:__


`node samples/transaction.js`






[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[shell_link]: https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/googleapis/nodejs-spanner&page=editor&open_in_editor=samples/README.md
[product-docs]: https://cloud.google.com/spanner/docs/
