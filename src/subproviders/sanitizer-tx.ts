/* Sanitization Subprovider
 * Removes irregular keys
 * Create other keys
 */

const isHexPrefixed = require('is-hex-prefixed')
import Subprovider from './subprovider'
const url = require('url')
const extend = require('extend')

// we use this to clean any custom params from the TransactionParams
const permitted = ['from', 'tx', 'auth', 'fuel']
// and create others
const create = ['type', 'host', 'db', 'expire']

export default class SanitizerSubproviderTransaction extends Subprovider {
  rpcUrl: string
  database: string
  constructor(opts?: any) {
    super()
    if (!opts['rpcUrl']) throw new Error('SanitizerSubproviderTransaction - no rpcUrl specified')
    if (!opts['database'])
      throw new Error('SanitizerSubproviderTransaction - no database specified')
    this.rpcUrl = opts.rpcUrl
    this.database = opts.database
  }

  public handleRequest(payload: any, next: Function, end: Function) {
    const self = this
    switch (payload['method']) {
      case 'fluree_sign_transact':
        const txParams = payload.params[0]
        if (typeof txParams === 'object' && !Array.isArray(txParams)) {
          var sanitized = self.cloneTransactionParams(txParams)
          var created = self.createTransactionParams(sanitized, payload['method'])
          payload.params[0] = created
        }
        next()
        return
      default:
        next()
        return
    }
  }

  private cloneTransactionParams(TransactionParams: any) {
    const self = this
    var sanitized = permitted.reduce(function(copy: any, permitted: string) {
      if (permitted in TransactionParams) {
        if (Array.isArray(TransactionParams[permitted])) {
          copy[permitted] = TransactionParams[permitted].map(function(item: string) {
            return self.sanitize(item)
          })
        } else {
          copy[permitted] = self.sanitize(TransactionParams[permitted])
        }
      }
      return copy
    }, {})

    return sanitized
  }
  private createTransactionParams(TransactionParams: any, method: string) {
    const self = this
    var created = extend(
      create.reduce(function(copy: any, create: string) {
        switch (create) {
          case 'db':
            copy[create] =
              '0x' +
              Buffer.from(self.database)
                .toString('hex')
                .toLowerCase()
            break
          case 'host':
            const q = url.parse(self.rpcUrl, true)
            copy[create] =
              '0x' +
              Buffer.from(q.host)
                .toString('hex')
                .toLowerCase()
            break
          case 'type':
            copy[create] =
              '0x' +
              Buffer.from(method)
                .toString('hex')
                .toLowerCase()
            break
          case 'expire':
            var hexExpire = (Date.now() + 10000).toString(16)
            if (hexExpire.length % 2) hexExpire = '0' + hexExpire
            copy[create] = '0x' + hexExpire.toLowerCase()
            break
          default:
        }
        return copy
      }, {}),
      TransactionParams,
    )
    return created
  }

  private sanitize(value: any) {
    if (typeof value === 'string') {
      if (!isHexPrefixed(value)) return '0x' + value.toLowerCase()
      else return value
    } else {
      return value
    }
  }
}
