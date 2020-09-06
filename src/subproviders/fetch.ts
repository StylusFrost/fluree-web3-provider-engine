const fetch = require('cross-fetch')
const retry = require('async/retry')
const waterfall = require('async/waterfall')
const asyncify = require('async/asyncify')
const JsonRpcError = require('json-rpc-error')
const promiseToCallback = require('promise-to-callback')
import Subprovider from './subprovider'
import Request from 'flureejs-request'
import Query from 'flureejs-query'
import Transaction from 'flureejs-tx'

const RETRIABLE_ERRORS = [
  // ignore server overload errors
  'Gateway timeout',
  'ETIMEDOUT',
  // ignore server sent html error pages
  // or truncated json responses
  'SyntaxError',
]

const METHOODS = [
  //TODO 'fluree_add_server', // REQUEST  attempts to dynamically add server to the network
  //TODO 'fluree_remove_server', // REQUEST  attempts to dynamically remove a server from the network
  //TODO 'fluree_query_with', // QUERY    submitting query with existing database flakes
  //TODO 'fluree_test_transact_with', // REQUEST  Given a valid set of flakes that could be added to the database at a given point in time and a transaction, returns the flakes that would be added to a ledger if a given transaction is issued.
  //TODO 'fluree_storage', // REQUEST   returns all key_value pairs of a certain type
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
    switch (payload['method']) {
      case 'fluree_sendTransaction':
        var rawTx = payload.params[0]
        var tx = new Transaction(rawTx)
        const fluree_tx_method = tx.type.toString()

        const body = {
          cmd: tx
            .cmd()
            .toString()
            .replace('fluree_sign_transact', 'tx'),
          sig: tx.signature().toString('hex'),
        }
        const txParams: any = {
          method: 'POST',
          headers: {
            Content_Type: 'application/json',
          },
          body: JSON.stringify(body),
        }

        retry(
          {
            times: 5,
            interval: 1000,
            errorFilter: isErrorRetriable,
          },
          (cb: Function) => self.submitRequest(txParams, fluree_tx_method, cb),
          (err: Error, result: any) => {
            // ends on retriable error
            if (err && isErrorRetriable(err)) {
              const errMsg = `FetchSubprovider _ cannot complete request. All retries exhausted.\nOriginal Error:\n${err.toString()}\n\n`
              const retriesExhaustedErr = new Error(errMsg)
              return end(retriesExhaustedErr)
            }
            // otherwise continue normally
            return end(err, result)
          },
        )
        return
      case 'fluree_sendQuery':
        var rawQuery = payload.params[0]
        var query = new Query(rawQuery)
        const queryParams: any = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Content_Type: 'application/json',
          },
          body: query.param.toString(),
        }

        queryParams.headers['X-Fluree-Date'] = query.formattedDate.toString()
        queryParams.headers['Digest'] = query.digest().toString()
        queryParams.headers['Signature'] = query.signature().toString()

        const fluree_query_method = query.type.toString()

        retry(
          {
            times: 5,
            interval: 1000,
            errorFilter: isErrorRetriable,
          },
          (cb: Function) => self.submitRequest(queryParams, fluree_query_method, cb),
          (err: Error, result: any) => {
            // ends on retriable error
            if (err && isErrorRetriable(err)) {
              const errMsg = `FetchSubprovider _ cannot complete request. All retries exhausted.\nOriginal Error:\n${err.toString()}\n\n`
              const retriesExhaustedErr = new Error(errMsg)
              return end(retriesExhaustedErr)
            }
            // otherwise continue normally
            return end(err, result)
          },
        )
        return
      case 'fluree_sendRequest':
        var rawRequest = payload.params[0]
        var request = new Request(rawRequest)
        const reqParams: any = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Content_Type: 'application/json',
          },
          body: request.param.toString(),
        }

        reqParams.headers['X-Fluree-Date'] = request.formattedDate.toString()
        reqParams.headers['Digest'] = request.digest().toString()
        reqParams.headers['Signature'] = request.signature().toString()

        const fluree_request_method = request.type.toString()

        retry(
          {
            times: 5,
            interval: 1000,
            errorFilter: isErrorRetriable,
          },
          (cb: Function) => self.submitRequest(reqParams, fluree_request_method, cb),
          (err: Error, result: any) => {
            // ends on retriable error
            if (err && isErrorRetriable(err)) {
              const errMsg = `FetchSubprovider _ cannot complete request. All retries exhausted.\nOriginal Error:\n${err.toString()}\n\n`
              const retriesExhaustedErr = new Error(errMsg)
              return end(retriesExhaustedErr)
            }
            // otherwise continue normally
            return end(err, result)
          },
        )
        return
      default:
        next()
        return
    }
  }

  private submitRequest(reqParams: any, method: string, cb: Function) {
    const self = this
    const targetUrl = self.rpcUrl
    const targetDatabase = self.database + '/'

    let uri = targetUrl + 'fdb/'
    switch (method) {
      case 'fluree_dbs': // REQUEST  unsigned returns all the dbs in the transactor group
        uri = uri + 'dbs'
        break
      case 'fluree_sign_dbs': // REQUEST  signed returns all the dbs in the transactor group
        uri = uri + 'dbs'
        break
      case 'fluree_new_db': // REQUEST  unsigned create a new database in the transactor group
        uri = uri + 'new-db'
        break
      case 'fluree_sign_new_db': // REQUEST  signed create a new database in the transactor group
        uri = uri + 'new-db'
        break
      case 'fluree_sign_snapshot': // REQUEST  signed create a LOCAL snapshot of a particular ledger
        uri = uri + targetDatabase + 'snapshot'
        break
      case 'fluree_sign_list_snapshots': // REQUEST  signed lists all LOCAL snapshot for a particular ledger
        uri = uri + targetDatabase + 'list-snapshots'
        break
      case 'fluree_sign_export': // REQUEST  signed exports LOCAL an existing ledger into either xml or ttl
        uri = uri + targetDatabase + 'export'
        break
      case 'fluree_health': // REQUEST unsigned server is ready or not
        uri = uri + 'health'
        break
      case 'fluree_sign_health': // REQUEST signed server is ready or not
        uri = uri + 'health'
        break
      case 'fluree_sign_delete_db': // REQUEST signed delete ledger
        uri = uri + 'delete-db'
        break
      case 'fluree_sign_query': // QUERY submitting signed single query in FlureeQL
        uri = uri + targetDatabase + 'query'
        break
      case 'fluree_sign_multi_query': // QUERY  submitting signed multiple query in FlureeQL
        uri = uri + targetDatabase + 'multi-query'
        break
      case 'fluree_sign_block_query': // QUERY   submitting signed block query in FlureeQL
        uri = uri + targetDatabase + 'block'
        break
      case 'fluree_sign_history_query': // QUERY    submitting signed history query in FlureeQL
        uri = uri + targetDatabase + 'history'
        break
      case 'fluree_sign_graphql_query': // QUERY    submitting signed graphql query in FlureeQL
        uri = uri + targetDatabase + 'graphql'
        break
      case 'fluree_sign_sparql_query': // QUERY   submitting signed sparql query in FlureeQL
        uri = uri + targetDatabase + 'sparql'
        break
      case 'fluree_sign_transact': // TX     submitting signed transaction in FlureeQL
        uri = uri + targetDatabase + 'command'
        break
      case 'fluree_sign_graphql_transact': // REQUEST  submitting signed graphql transaction in FlureeQL
        uri = uri + targetDatabase + 'graphql'
        break
      case 'fluree_reindex': // REQUEST unsigned reindexes the specified ledger
        uri = uri + targetDatabase + 'reindex'
        break
      case 'fluree_sign_reindex': // REQUEST signed reindexes the specified ledger
        uri = uri + targetDatabase + 'reindex'
        break
      case 'fluree_sign_gen_flakes': // REQUEST  signed list of flakes that would be added to a ledger if a given transaction is issued
        uri = uri + targetDatabase + 'gen-flakes'
        break
      case 'fluree_sign_block_range_with_txn': // REQUEST signed block stats, as well as flakes and transactions for the specified block(s)
        uri = uri + targetDatabase + 'block-range-with-txn'
        break
      case 'fluree_ledger_stats': // REQUEST  unsigned provides stats about the requested ledger
        uri = uri + targetDatabase + 'ledger-stats'
        break
      case 'fluree_sign_ledger_stats': // REQUEST  signed provides stats about the requested ledger
        uri = uri + targetDatabase + 'ledger-stats'
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
