const assert = require('assert')
const async = require('async')

const Spanner = require('./src')
const spanner = new Spanner()

const instance = spanner.instance('issue-180-instance')
const database = instance.database('issue-180-database')
const table = database.table('accountsfenster')

const NUM_ROWS_TO_INSERT_AND_QUERY = 99000
const NUM_ATTEMPTS = process.argv[2] || 5

async function init() {
  await prepareInstance()
  await prepareDatabase()
  await prepareTable()
}

init()

function prepareInstance() {
  return new Promise((resolve, reject) => {
    instance.create({
      config: 'regional-us-central1',
      nodes: 1,
    }, (err, instance, operation) => {
      if (err) {
        if (err.code === 6) {
          resolve()
        } else {
          reject(err)
        }
      } else {
        operation.promise().then(resolve);
      }
    })
  })
}

function prepareDatabase() {
  return new Promise((resolve, reject) => {
    database.create(err => {
      if (err) {
        if (err.code === 6) {
          resolve()
        } else {
          reject(err)
        }
      } else {
        operation.promise().then(resolve);
      }
    })
  })
}

function prepareTable() {
  const schema = `
    CREATE TABLE accountsfenster (
      recordId STRING(36) NOT NULL,
      account_CID STRING(255),
      account_created_on STRING(1024),
      account_created_on_unixTimestamp FLOAT64,
      account_dashboard_tabs STRING(255),
      account_ok_tabs STRING(255),
      account_summary_content_tabs STRING(255),
      account_to_creator STRING(36),
      account_to_customer_admin STRING(36),
      account_view_tabs STRING(255),
      Address STRING(1024),
      Address1 STRING(1024),
      Address1_city STRING(255),
      Address1_postalcode STRING(255),
      Address1_provinceterritory STRING(255),
      Address_city STRING(255),
      Address_postalcode STRING(255),
      Address_provinceterritory STRING(255),
      current_document_number FLOAT64,
      customer_content_tabs STRING(255),
      Email STRING(255),
      fund_to_account STRING(36),
      FundsTab_AccountSubNavigation STRING(255),
      Number FLOAT64,
      Number1 FLOAT64,
      Number_of_Payments FLOAT64,
      payment_plan_to_account STRING(36),
      Phone_Number STRING(1024),
      Phone_Number1 STRING(1024),
      requested_payment_plan_to_account STRING(36),
      RequestRelationshipCID STRING(255),
      RequestRelationshipContentTab STRING(255),
      Selection_Field___Static STRING(MAX),
      Short_Text STRING(255),
      Short_Text1 STRING(255),
      Short_Text4 STRING(255),
      upload_customer_csv STRING(1024),
      upload_customer_csv_name STRING(255),
      user_to_accounts STRING(36),
    ) PRIMARY KEY (recordId)`

  return new Promise((resolve, reject) => {
    table.create(schema, (err, tableName, operation) => {
      if (err) {
        if (err.code === 6) {
          resolve()
        } else {
          reject(err)
        }
      } else {
        operation.promise().then(resolve);
      }
    })
  })
}

