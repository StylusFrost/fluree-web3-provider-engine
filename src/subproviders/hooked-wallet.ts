/*
 * Emulate 'fluree_accounts'
 * 'fluree_sendTransaction'
 * 'fluree_sendRequest'
 * 'fluree_sendQuery'
 *
 * The four callbacks a user needs to implement are:
 * - getAccounts()        -- array of authIDs supported
 * - signTransaction(tx)  -- sign a raw transaction object
 * - signRequest(request) -- sign a raw request object
 * - signQuery(query)     -- sign a raw query object
 */

const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const extend = require('xtend')
const Semaphore = require('semaphore')
import Subprovider from './subprovider'

export default class HookedWalletSubprovider extends Subprovider {
  // handles the following RPC methods:
  //   fluree_accounts
  //   fluree_sendTransaction
  //   fluree_sendRequest
  //   fluree_sendQuery
  //   fluree_signTransaction
  //   fluree_signRequest
  //   fluree_signQuery
  //
  // Tx Signature Flow
  //
  // handleRequest: fluree_sendTransaction
  //   validateTransaction (basic validity check)
  //     validateSender (checks that sender is in accounts)
  //   processTransaction (sign tx and submit to database)
  //     approveTransaction (UI approval hook)
  //     checkApproval
  //     finalizeAndSubmitTx (tx signing)
  //       nonceLock.take (bottle neck to ensure atomic nonce)
  //         fillInTxExtras (set nonce, etc)
  //         signTransaction (perform the signature)
  //         publishTransaction (publish signed tx to database)
  //
  // Query Signature Flow
  //
  // handleRequest: fluree_sendQuery
  //   validateQuery (basic validity check)
  //     validateSender (checks that sender is in accounts)
  //   processQuery (sign query and submit to database)
  //     approveQuery (UI approval hook)
  //     checkApproval
  //     finalizeAndSubmitQuery (query signing)
  //         signQuery (perform the signature)
  //         publishQuery (publish signed query to database)
  //
  // Request Signature Flow
  //
  // handleRequest: fluree_sendRequest
  //   validateRequest (basic validity check)
  //     validateSender (checks that sender is in accounts)
  //   processRequest (sign request and submit to database)
  //     approveRequest (UI approval hook)
  //     checkApproval
  //     finalizeAndSubmitRequest (Request signing)
  //         signRequest (perform the signature)
  //         publishRequest (publish signed Request to database)
  //

  nonceLock: any
  approveTransaction: any
  approveQuery: any
  approveRequest: any
  signTransaction: any
  signQuery: any
  signRequest: any

  constructor(opts?: any) {
    super()
    // control flow
    this.nonceLock = Semaphore(1)
    // data lookup
    if (opts.getAccounts) this.getAccounts = opts.getAccounts
    // high level override
    if (opts.processTransaction) this.processTransaction = opts.processTransaction
    if (opts.processQuery) this.processQuery = opts.processQuery
    if (opts.processRequest) this.processRequest = opts.processRequest
    // approval hooks
    this.approveTransaction = opts.approveTransaction || this.autoApproveTx
    this.approveQuery = opts.approveQuery || this.autoApproveQuery
    this.approveRequest = opts.approveRequest || this.autoApproveRequest
    // actually perform the signature
    if (opts.signTransaction)
      this.signTransaction = opts.signTransaction || mustProvideInConstructor('signTransaction')
    if (opts.signQuery) this.signQuery = opts.signQuery || mustProvideInConstructor('signQuery')
    if (opts.signRequest)
      this.signRequest = opts.signRequest || mustProvideInConstructor('signRequest')
    // publish to database
    if (opts.publishTransaction) this.publishTransaction = opts.publishTransaction
    if (opts.publishRequest) this.publishRequest = opts.publishRequest
    if (opts.publishQuery) this.publishQuery = opts.publishQuery
  }

  handleRequest(payload: any, next: Function, end: Function) {
    // switch statement is not block scoped
    // sp we cant repeat var declarations
    let txParams: any, requestParams: any, queryParams: any

    switch (payload['method']) {
      case 'fluree_accounts':
        // process normally
        this.getAccounts(function(err: Error, accounts: Array<Buffer>) {
          if (err) return end(err)
          end(null, accounts)
        })
        return
      case 'fluree_sign_transact':
        txParams = payload.params[0]
        waterfall(
          [
            (cb: Function) => this.validateTransaction(txParams, cb),
            (cb: Function) => this.processTransaction(txParams, cb),
          ],
          end,
        )
        return
      case 'fluree_sign_delete_db':
      case 'fluree_sign_health':
      case 'fluree_sign_dbs':
      case 'fluree_sign_new_db':
      case 'fluree_sign_delete_db':
      case 'fluree_sign_snapshot':
      case 'fluree_sign_list_snapshots':
      case 'fluree_sign_export':
      case 'fluree_sign_reindex':
      case 'fluree_sign_gen_flakes':
      case 'fluree_sign_block_range_with_txn':
      case 'fluree_sign_ledger_stats':
        requestParams = payload.params[0]
        waterfall(
          [
            (cb: Function) => this.validateRequest(requestParams, cb),
            (cb: Function) => this.processRequest(requestParams, cb),
          ],
          end,
        )
        return
      case 'fluree_sign_query':
      case 'fluree_sign_multi_query':
      case 'fluree_sign_block_query':
      case 'fluree_sign_history_query':
      case 'fluree_sign_graphql_query':
      case 'fluree_sign_sparql_query':
        queryParams = payload.params[0]
        waterfall(
          [
            (cb: Function) => this.validateQuery(queryParams, cb),
            (cb: Function) => this.processQuery(queryParams, cb),
          ],
          end,
        )
        return

      case 'fluree_signTransaction':
        txParams = payload.params[0]
        waterfall(
          [
            (cb: Function) => this.validateTransaction(txParams, cb),
            (cb: Function) => this.processSignTransaction(txParams, cb),
          ],
          end,
        )
        return

      case 'fluree_signRequest':
        requestParams = payload.params[0]
        waterfall(
          [
            (cb: Function) => this.validateRequest(requestParams, cb),
            (cb: Function) => this.processSignRequest(requestParams, cb),
          ],
          end,
        )
        return

      case 'fluree_signQuery':
        queryParams = payload.params[0]
        waterfall(
          [
            (cb: Function) => this.validateQuery(queryParams, cb),
            (cb: Function) => this.processSignQuery(queryParams, cb),
          ],
          end,
        )
        return
      default:
        next()
        return
    }
  }

  //
  // data lookup
  //

  public getAccounts(cb: Function) {
    cb(null, [])
  }

  //
  // "process" high level flow
  //

  public processTransaction(txParams: any, cb: Function) {
    waterfall(
      [
        (cb: Function) => this.approveTransaction(txParams, cb),
        (didApprove: boolean, cb: Function) => this.checkApproval('transaction', didApprove, cb),
        (cb: Function) => this.finalizeAndSubmitTx(txParams, cb),
      ],
      cb,
    )
  }
  public processQuery(queryParams: any, cb: Function) {
    waterfall(
      [
        (cb: Function) => this.approveQuery(queryParams, cb),
        (didApprove: boolean, cb: Function) => this.checkApproval('query', didApprove, cb),
        (cb: Function) => this.finalizeAndSubmitQuery(queryParams, cb),
      ],
      cb,
    )
  }
  public processRequest(requestParams: any, cb: Function) {
    waterfall(
      [
        (cb: Function) => this.approveRequest(requestParams, cb),
        (didApprove: boolean, cb: Function) => this.checkApproval('request', didApprove, cb),
        (cb: Function) => this.finalizeAndSubmitRequest(requestParams, cb),
      ],
      cb,
    )
  }

  public processSignTransaction(txParams: any, cb: Function) {
    waterfall(
      [
        (cb: Function) => this.approveTransaction(txParams, cb),
        (didApprove: boolean, cb: Function) => this.checkApproval('transaction', didApprove, cb),
        (cb: Function) => this.finalizeTx(txParams, cb),
      ],
      cb,
    )
  }
  public processSignRequest(requestParams: any, cb: Function) {
    waterfall(
      [
        (cb: Function) => this.approveRequest(requestParams, cb),
        (didApprove: boolean, cb: Function) => this.checkApproval('request', didApprove, cb),
        (cb: Function) => this.finalizeRequest(requestParams, cb),
      ],
      cb,
    )
  }
  public processSignQuery(queryParams: any, cb: Function) {
    waterfall(
      [
        (cb: Function) => this.approveQuery(queryParams, cb),
        (didApprove: boolean, cb: Function) => this.checkApproval('query', didApprove, cb),
        (cb: Function) => this.finalizeQuery(queryParams, cb),
      ],
      cb,
    )
  }

  //
  // approval
  //

  public autoApproveTx(txParams: any, cb: Function) {
    cb(null, true)
  }
  public autoApproveRequest(requestParams: any, cb: Function) {
    cb(null, true)
  }
  public autoApproveQuery(queryParams: any, cb: Function) {
    cb(null, true)
  }

  public checkApproval(type: string, didApprove: boolean, cb: Function) {
    cb(didApprove ? null : new Error('User denied ' + type + ' signature.'))
  }

  //
  // validation
  //

  public validateTransaction(txParams: any, cb: Function) {
    // shortcut: undefined sender is invalid
    if (txParams.from === undefined)
      return cb(new Error(`Undefined authID - from authID required to sign transaction.`))
    this.validateSender(txParams.from, function(err: Error, senderIsValid: Boolean) {
      if (err) return cb(err)
      if (!senderIsValid)
        return cb(
          new Error(
            `Unknown authID - unable to sign transaction for this authID: "${txParams.from}"`,
          ),
        )
      cb()
    })
  }
  public validateRequest(requestParams: any, cb: Function) {
    // shortcut: undefined sender is invalid
    if (requestParams.from === undefined)
      return cb(new Error(`Undefined authID - from authID required to sign request.`))
    this.validateSender(requestParams.from, function(err: Error, senderIsValid: Boolean) {
      if (err) return cb(err)
      if (!senderIsValid)
        return cb(
          new Error(
            `Unknown authID - unable to sign request for this authID: "${requestParams.from}"`,
          ),
        )
      cb()
    })
  }
  public validateQuery(queryParams: any, cb: Function) {
    // shortcut: undefined sender is invalid
    if (queryParams.from === undefined)
      return cb(new Error(`Undefined authID - from authID required to sign transaction.`))
    this.validateSender(queryParams.from, function(err: Error, senderIsValid: Boolean) {
      if (err) return cb(err)
      if (!senderIsValid)
        return cb(
          new Error(
            `Unknown authID - unable to sign transaction for this authID: "${queryParams.from}"`,
          ),
        )
      cb()
    })
  }

  public validateSender(senderAuthID: string, cb: Function) {
    // shortcut: undefined sender is invalid
    if (!senderAuthID) return cb(null, false)
    this.getAccounts(function(err: Error, accounts: Array<Buffer>) {
      if (err) return cb(err)
      //const senderIsValid = accounts.indexOf(Buffer.from(senderauthID,'hex')) !== -1
      const senderIsValid =
        accounts.map(authID => '0x' + authID.toString('hex')).indexOf(senderAuthID) !== -1
      cb(null, senderIsValid)
    })
  }

  //
  // helpers
  //

  public finalizeAndSubmitTx(txParams: any, cb: Function) {
    const self = this
    // can only allow one tx to pass through this flow at a time
    // so we can atomically consume a nonce
    self.nonceLock.take(function() {
      waterfall(
        [
          self.fillInTxExtras.bind(self, txParams),
          self.signTransaction.bind(self),
          self.publishTransaction.bind(self),
        ],
        function(err: Error, tx: any) {
          self.nonceLock.leave()
          if (err) return cb(err)
          cb(null, tx)
        },
      )
    })
  }
  public finalizeAndSubmitQuery(queryParams: any, cb: Function) {
    const self = this
    waterfall(
      [
        self.fillInQueryExtras.bind(self, queryParams),
        self.signQuery.bind(self),
        self.publishQuery.bind(self),
      ],
      function(err: Error, tx: any) {
        if (err) return cb(err)
        cb(null, tx)
      },
    )
  }
  public finalizeAndSubmitRequest(requestParams: any, cb: Function) {
    const self = this
    waterfall(
      [
        self.fillInRequestExtras.bind(self, requestParams),
        self.signRequest.bind(self),
        self.publishRequest.bind(self),
      ],
      function(err: Error, tx: any) {
        if (err) return cb(err)
        cb(null, tx)
      },
    )
  }

  public finalizeTx(txParams: any, cb: Function) {
    const self = this
    // can only allow one tx to pass through this flow at a time
    // so we can atomically consume a nonce
    this.nonceLock.take(function() {
      waterfall(
        [self.fillInTxExtras.bind(self, txParams), self.signTransaction.bind(self)],
        function(err: Error, signedTx: any) {
          self.nonceLock.leave()
          if (err) return cb(err)
          cb(null, { raw: signedTx, tx: txParams })
        },
      )
    })
  }
  public finalizeQuery(queryParams: any, cb: Function) {
    waterfall([this.signQuery.bind(this)], function(err: Error, signedQuery: any) {
      if (err) return cb(err)
      cb(null, { raw: signedQuery, query: queryParams })
    })
  }
  public finalizeRequest(requestParams: any, cb: Function) {
    waterfall([this.signRequest.bind(this)], function(err: Error, signedRequest: any) {
      if (err) return cb(err)
      cb(null, { raw: signedRequest, request: requestParams })
    })
  }

  public publishTransaction(tx: any, cb: Function) {
    this.emitPayload(
      {
        method: 'fluree_sendTransaction',
        params: [tx.raw],
      },
      function(err: Error, res: any) {
        if (err) return cb(err)
        cb(null, res.result)
      },
    )
  }
  public publishRequest(request: any, cb: Function) {
    this.emitPayload(
      {
        method: 'fluree_sendRequest',
        params: [request.raw],
      },
      function(err: Error, res: any) {
        if (err) return cb(err)
        cb(null, res.result)
      },
    )
  }
  public publishQuery(rawQuery: any, cb: Function) {
    this.emitPayload(
      {
        method: 'fluree_sendQuery',
        params: [rawQuery.raw],
      },
      function(err: Error, res: any) {
        if (err) return cb(err)
        cb(null, res.result)
      },
    )
  }

  public fillInTxExtras(txParams: any, cb: Function) {
    const authID = txParams.from

    const tasks: any = {}

    if (txParams.nonce === undefined) {
      tasks['nonce'] = this.emitPayload.bind(this, {
        method: 'fluree_getTransactionCount',
        params: [authID, 'pending'],
      })
    }

    parallel(tasks, function(err: Error, taskResults: any) {
      if (err) return cb(err)

      const result: any = {}
      if (taskResults['nonce']) result['nonce'] = taskResults['nonce']['result']

      cb(null, extend(txParams, result))
    })
  }
  public fillInRequestExtras(requestParams: any, cb: Function) {
    const authID = requestParams.from
    const tasks: any = {}
    parallel(tasks, function(err: Error, taskResults: any) {
      if (err) return cb(err)
      const result: any = {}
      cb(null, extend(requestParams, result))
    })
  }
  public fillInQueryExtras(queryParams: any, cb: Function) {
    const authID = queryParams.from
    const tasks: any = {}
    parallel(tasks, function(err: Error, taskResults: any) {
      if (err) return cb(err)
      const result: any = {}
      cb(null, extend(queryParams, result))
    })
  }
}

// util

function mustProvideInConstructor(methodName: string) {
  return function(params: any, cb: Function) {
    cb(
      new Error(
        'ProviderEngine - HookedWalletSubprovider - Must provide "' +
          methodName +
          '" fn in constructor options',
      ),
    )
  }
}
