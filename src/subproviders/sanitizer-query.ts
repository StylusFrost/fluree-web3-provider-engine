/* Sanitization Subprovider
 * Removes irregular keys
 * Create other keys
 */

const isHexPrefixed = require('is-hex-prefixed')
import Subprovider from './subprovider'
import { getRFC1123DateTime } from '../util/rfc-1123-datetime'
const url = require('url')
const extend = require('extend')

// we use this to clean any custom params from the QueryParams
const permitted = ['from', 'param', 'auth']
// and create others
const create = ['type', 'host', 'db', 'formattedDate']

export default class SanitizerSubproviderQuery extends Subprovider {
  rpcUrl: string
  database: string
  constructor(opts?: any) {
    super()
    if (!opts['rpcUrl']) throw new Error('SanitizerSubproviderQuery - no rpcUrl specified')
    if (!opts['database']) throw new Error('SanitizerSubproviderQuery - no database specified')
    this.rpcUrl = opts.rpcUrl
    this.database = opts.database
  }

  public handleRequest(payload: any, next: Function, end: Function) {
    const self = this
    switch (payload['method']) {
      case 'fluree_sign_query':
      case 'fluree_sign_multi_query':
      case 'fluree_sign_block_query':
      case 'fluree_sign_history_query':
      case 'fluree_sign_graphql_query':
      case 'fluree_sign_sparql_query':
        const queryParams = payload.params[0]
        if (typeof queryParams === 'object' && !Array.isArray(queryParams)) {
          var sanitized = self.cloneQueryParams(queryParams)
          var created = self.createQueryParams(sanitized, payload['method'])
          payload.params[0] = created
        }
        next()
        return
      default:
        next()
        return
    }
  }

  private cloneQueryParams(QueryParams: any) {
    const self = this
    var sanitized = permitted.reduce(function(copy: any, permitted: string) {
      if (permitted in QueryParams) {
        if (Array.isArray(QueryParams[permitted])) {
          copy[permitted] = QueryParams[permitted].map(function(item: string) {
            return self.sanitize(item)
          })
        } else {
          copy[permitted] = self.sanitize(QueryParams[permitted])
        }
      }
      return copy
    }, {})

    return sanitized
  }
  private createQueryParams(QueryParams: any, method: string) {
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
      QueryParams,
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
