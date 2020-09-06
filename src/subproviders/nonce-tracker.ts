import Transaction from 'flureejs-tx'
import Subprovider from './subprovider'
import { blockTagForPayload } from '../util/rpc-cache-utils'
import { bufferToInt } from 'flureejs-utils'

// handles the following RPC methods:
//   fluree_getTransactionCount (pending only) // TODO: Entender
//
// observes the following RPC methods:
//   fluree_sendRawTransaction
//   evm_revert (to clear the nonce cache) // TODO: Entender

export default class NonceTrackerSubprovider extends Subprovider {
  nonceCache: any = {}
  constructor() {
    super()
  }

  public handleRequest(payload: any, next: Function, end: Function) {
    const self = this
    switch (payload['method']) {
      case 'fluree_getTransactionCount':
        var blockTag = blockTagForPayload(payload)
        var authID = payload.params[0]
        var cachedResult = this.nonceCache[authID]
        // only handle requests against the 'pending' blockTag
        if (blockTag === 'pending') {
          // has a result
          if (cachedResult) {
            end(null, cachedResult)
            // fallthrough then populate cache
          } else {
            next(function(err: Error, result: any, cb: Function) {
              if (err) return cb()
              if (self.nonceCache[authID] === undefined) {
                self.nonceCache[authID] = result
              }
              cb()
            })
          }
        } else {
          next()
        }
        return

      case 'fluree_sendTransaction':
        // allow the request to continue normally
        next(function(err: Error, result: any, cb: Function) {
          // only update local nonce if tx was submitted correctly
          if (err) return cb()
          // parse raw tx
          var rawTx = payload.params[0]
          var tx = new Transaction(rawTx)
          // extract authID
          var authID = tx.getSenderAuthID()
          // extract nonce and increment
          var nonce = bufferToInt(tx.nonce)
          nonce++
          // hexify and normalize
          var hexNonce = nonce.toString(16)
          if (hexNonce.length % 2) hexNonce = '0' + hexNonce
          hexNonce = '0x' + hexNonce
          // dont update our record on the nonce until the submit was successful
          // update cache
          self.nonceCache[authID.toString()] = hexNonce
          cb()
        })
        return

      // Clear cache on a testrpc revert
      /* case 'evm_revert':
                this.nonceCache = {}
                next()
                return*/

      default:
        next()
        return
    }
  }
}
