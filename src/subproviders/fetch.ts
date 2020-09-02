const fetch = require('cross-fetch')
const retry = require('async/retry')
const waterfall = require('async/waterfall')
const asyncify = require('async/asyncify')
const JsonRpcError = require('json-rpc-error')
const promiseToCallback = require('promise-to-callback')
import Subprovider from './subprovider'

const RETRIABLE_ERRORS = [
  // ignore server overload errors
  'Gateway timeout',
  'ETIMEDOUT',
  // ignore server sent html error pages
  // or truncated json responses
  'SyntaxError',
]

const METHOODS = [
  'fluree_dbs', // REQUEST  returns all the dbs in the transactor group
  'fluree_new-db', // REQUEST  create a new database in the transactor group
  'fluree_snapshot', // REQUEST  create a LOCAL snapshot of a particular ledger
  'fluree_list-snapshots', // REQUEST  lists all LOCAL snapshot for a particular ledger
  'fluree_export', // REQUEST  exports LOCAL an existing ledger into either xml or ttl
  'fluree_delete-db', // REQUEST  delete ledger
  'fluree_add-server', // REQUEST  attempts to dynamically add server to the network
  'fluree_remove-server', // REQUEST  attempts to dynamically remove a server from the network
  'fluree_query', // QUERY    submitting single query in FlureeQL
  'fluree_multi-query', // QUERY    submitting multiple query in FlureeQL
  'fluree_block', // QUERY    submitting block query in FlureeQL
  'fluree_history', // QUERY    submitting history query in FlureeQL
  'fluree_graphql_query', // QUERY    submitting history query in FlureeQL
  'fluree_sparql_query', // QUERY    submitting history query in FlureeQL
  'fluree_query-with', // QUERY    submitting query with existing database flakes
  'fluree_transact', // TX       submitting transaction in FlureeQL
  'fluree_graphql_tx', // REQUEST  submitting history query in FlureeQL
  'fluree_reindex', // REQUEST  reindexes the specified ledger
  'fluree_gen-flakes', // REQUEST  list of flakes that would be added to a ledger if a given transaction is issued
  'fluree_test-transact-with', // REQUEST  Given a valid set of flakes that could be added to the database at a given point in time and a transaction, returns the flakes that would be added to a ledger if a given transaction is issued.
  'fluree_block-range-with-txn', // REQUEST  block stats, as well as flakes and transactions for the specified block(s)
  'fluree_health', // REQUEST  server is ready or not
  'fluree_ledger-stats', // REQUEST  provides stats about the requested ledger
]

export default class FetchSubprovider extends Subprovider {
  rpcUrl: string
  database: string
  constructor(opts: any) {
    super()
    this.rpcUrl = opts.rpcUrl
    this.database = opts.database
  }
  public handleRequest(payload: any, next: Function, end: Function) {
    const self = this
    const reqParams: any = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload['params']['body']),
    }
    if (payload['params']['X-Fluree-Date']) {
      reqParams.headers['X-Fluree-Date'] = payload['params']['X-Fluree-Date']
    }
    if (payload['params']['Digest']) {
      reqParams.headers['Digest'] = payload['params']['Digest']
    }
    if (payload['params']['Signature']) {
      reqParams.headers['Signature'] = payload['params']['Signature']
    }

    retry(
      {
        times: 5,
        interval: 1000,
        errorFilter: isErrorRetriable,
      },
      (cb: Function) => self.submitRequest(reqParams, payload['method'], cb),
      (err: Error, result: any) => {
        // ends on retriable error
        if (err && isErrorRetriable(err)) {
          const errMsg = `FetchSubprovider - cannot complete request. All retries exhausted.\nOriginal Error:\n${err.toString()}\n\n`
          const retriesExhaustedErr = new Error(errMsg)
          return end(retriesExhaustedErr)
        }
        // otherwise continue normally
        return end(err, result)
      },
    )
  }

  private submitRequest(reqParams: any, method: string, cb: Function) {
    const self = this
    const targetUrl = self.rpcUrl
    const targetDatabase = self.database + '/'

    let uri = targetUrl + 'fdb/'
    switch (method) {
      case 'fluree_dbs': // REQUEST  returns all the dbs in the transactor group
        uri = uri + 'dbs'
        break
      case 'fluree_new-db': // REQUEST  create a new database in the transactor group
        uri = uri + 'new-db'
        break
      case 'fluree_snapshot': // REQUEST  create a LOCAL snapshot of a particular ledger
        uri = uri + targetDatabase + 'snapshot'
        break
      case 'fluree_health': // REQUEST  server is ready or not
        uri = uri + 'health'
        break
      default:
        return cb(new JsonRpcError.MethodNotFound())
    }

    promiseToCallback(fetch(uri, reqParams))((err: Error, res: any) => {
      if (err) return cb(err)
      // continue parsing result
      waterfall(
        [
          checkForHttpErrors,
          // buffer body
          (cb: Function) => promiseToCallback(res.text())(cb),
          // parse body
          asyncify((rawBody: string) => JSON.parse(rawBody)),
          parseResponse,
        ],
        cb,
      )

      function checkForHttpErrors(cb: Function) {
        // check for errors
        switch (res.status) {
          case 404:
            return cb(new JsonRpcError.MethodNotFound())

          case 418:
            return cb(createRatelimitError())

          case 503:
          case 504:
            return cb(createTimeoutError())

          default:
            return cb()
        }
      }

      function parseResponse(body: any, cb: Function) {
        // check for error code
        if (res.status !== 200) {
          return cb(new JsonRpcError.InternalError(body))
        }
        // check for rpc error
        if (body.error) return cb(new JsonRpcError.InternalError(body.error))

        // return successful result
        cb(null, body)
      }
    })
  }
}
function isErrorRetriable(err: Error) {
  const errMsg = err.toString()
  return RETRIABLE_ERRORS.some(phrase => errMsg.includes(phrase))
}

function createRatelimitError() {
  let msg = `Request is being rate limited.`
  const err = new Error(msg)
  return new JsonRpcError.InternalError(err)
}

function createTimeoutError() {
  let msg = `Gateway timeout. The request took too long to process. `
  msg += `This can happen when querying logs over too wide a block range.`
  const err = new Error(msg)
  return new JsonRpcError.InternalError(err)
}
