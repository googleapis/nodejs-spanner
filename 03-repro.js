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
  async.times(NUM_ATTEMPTS, runQueryBatches, err => {
    if (err) throw err
    console.log('Query was successful')
  })

  function runQueryBatches(_, callback) {
    async.times(NUM_ATTEMPTS, runQuery, callback)
  }

  function runQuery(_, callback) {
    const query = {
      sql: 'SELECT `root`.`account_created_on` as `field0`, `root`.`Short_Text` as `field1`, `root`.`Short_Text1` as `field2`, `root`.`account_CID` as `field3`, `root`.`recordId` as `recordId` FROM `accountsfenster` AS root LIMIT ' + NUM_ROWS_TO_INSERT_AND_QUERY,
      json: true,
    }

    let numRowsReceived = 0

    database.runStream(query)
      .on('error', callback)
      .on('data', () => numRowsReceived++)
      .on('end', () => {
        assert.strictEqual(numRowsReceived, NUM_ROWS_TO_INSERT_AND_QUERY)
        callback()
      })
  }
}

init()

