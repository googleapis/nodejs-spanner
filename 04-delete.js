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
  await deleteTable()
  console.log("deleteTable done");
}

init()

async function deleteTable() {
  return new Promise((resolve, reject) => {
    table.delete((err, operation) => {
      if (!err) {
        operation.promise().then(resolve);
      } else {
        reject(err)
      }
    })
  })
}

