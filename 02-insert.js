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
  await insertRows()
}

init()

function insertRows() {
  function insertRows(offset, n) {
    const rows = []

    for (var i = 0; i < n; i++) {
      let obj = {
        account_created_on: 'account_created_on',
        Short_Text: 'Short_Text',
        Short_Text1: 'Short_Text1',
        account_CID: 'account_CID',
        recordId: /* i + offset */ Math.round(Date.now() * Math.random())
      };
      rows.push(obj);
    }

    return table.insert(rows)
  }

  const numRowsPerAPICall = 3000
  let numAPICallsRequired = NUM_ROWS_TO_INSERT_AND_QUERY / numRowsPerAPICall

  const apiCallPromises = []
  while (numAPICallsRequired--) apiCallPromises.push(insertRows(numAPICallsRequired * numRowsPerAPICall, numRowsPerAPICall))

  return Promise.all(apiCallPromises)
}
