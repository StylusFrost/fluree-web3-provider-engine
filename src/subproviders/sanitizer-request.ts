/* Sanitization Subprovider
 * Removes irregular keys
 * Create other keys
 */

const isHexPrefixed = require('is-hex-prefixed')
import Subprovider from './subprovider'
const url = require('url')
const extend = require('extend')
import { getRFC1123DateTime } from '../util/rfc-1123-datetime'

// we use this to clean any custom params from the RequestParams
const permitted = ['from', 'param', 'auth']
// and create others
const create = ['type', 'host', 'db', 'formattedDate']

export default class SanitizerSubproviderRequest extends Subprovider {
  rpcUrl: string
  database: string
  constructor(opts?: any) {
    super()
    if (!opts['rpcUrl']) throw new Error('SanitizerSubproviderRequest - no rpcUrl specified')
    if (!opts['database']) throw new Error('SanitizerSubproviderRequest - no database specified')
    this.rpcUrl = opts.rpcUrl
    this.database = opts.database
  }

  public handleRequest(payload: any, next: Function, end: Function) {
    const self = this
    switch (payload['method']) {
      case 'fluree_health':
      case 'fluree_dbs':
      case 'fluree_new_db':
      case 'fluree_reindex':
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
        const requestParams = payload.params[0]
        if (typeof requestParams === 'object' && !Array.isArray(requestParams)) {
          var sanitized = self.cloneRequestParams(requestParams)
          var created = self.createRequestParams(sanitized, payload['method'])
          payload.params[0] = created
        }
        next()
        return
      default:
        next()
        return
    }
  }
  private cloneRequestParams(RequestParams: any) {
    const self = this
    var sanitized = permitted.reduce(function (copy: any, permitted: string) {
      if (permitted in RequestParams) {
        if (Array.isArray(RequestParams[permitted])) {
          copy[permitted] = RequestParams[permitted].map(function (item: string) {
            return self.sanitize(item)
          })
        } else {
          copy[permitted] = self.sanitize(RequestParams[permitted])
        }
      }
      return copy
    }, {})

    return sanitized
  }
  private createRequestParams(RequestParams: any, method: string) {
    const self = this
    var created = extend(
      create.reduce(function (copy: any, create: string) {
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
          case 'formattedDate':
            copy[create] =
              '0x' +
              Buffer.from(getRFC1123DateTime())
                .toString('hex')
                .toLowerCase()
            break
          default:
        }
        return copy
      }, {}),
      RequestParams,
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
