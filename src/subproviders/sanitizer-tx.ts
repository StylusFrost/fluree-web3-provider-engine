/* Sanitization Subprovider
 * Removes irregular keys
 */
const isHexPrefixed = require('is-hex-prefixed')
import Subprovider from './subprovider'

// we use this to clean any custom params from the txParams
const permitted = ['from', 'type', 'db', 'tx', 'auth', 'fuel', 'nonce', 'expire']

export default class SanitizerSubproviderTx extends Subprovider {
  constructor() {
    super()
  }
  public handleRequest(payload: any, next: Function, end: Function) {
    var txParams = payload.params[0]

    if (typeof txParams === 'object' && !Array.isArray(txParams)) {
      var sanitized = cloneTxParams(txParams)
      payload.params[0] = sanitized
    }

    next()
  }
}
function cloneTxParams(txParams: any) {
  var sanitized = permitted.reduce(function(copy: any, permitted: string) {
    if (permitted in txParams) {
      if (Array.isArray(txParams[permitted])) {
        copy[permitted] = txParams[permitted].map(function(item: string) {
          return sanitize(item)
        })
      } else {
        copy[permitted] = sanitize(txParams[permitted])
      }
    }
    return copy
  }, {})

  return sanitized
}

function sanitize(value: any) {
  if (typeof value === 'string') {
    if (!isHexPrefixed(value)) return '0x' + value.toLowerCase()
    else return value
  } else {
    return value
  }
}
