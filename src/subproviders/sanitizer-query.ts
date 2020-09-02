/* Sanitization Subprovider
 * Removes irregular keys
 */
const isHexPrefixed = require('is-hex-prefixed')
import Subprovider from './subprovider'

// we use this to clean any custom params from the QueryParams
const permitted = ['from', 'param', 'type', 'host', 'db', 'auth', 'formattedDate']

export default class SanitizerSubproviderQuery extends Subprovider {
  constructor() {
    super()
  }
  public handleRequest(payload: any, next: Function, end: Function) {
    var queryParams = payload.params[0]

    if (typeof queryParams === 'object' && !Array.isArray(queryParams)) {
      var sanitized = cloneQueryParams(queryParams)
      payload.params[0] = sanitized
    }

    next()
  }
}
function cloneQueryParams(QueryParams: any) {
  var sanitized = permitted.reduce(function(copy: any, permitted: string) {
    if (permitted in QueryParams) {
      if (Array.isArray(QueryParams[permitted])) {
        copy[permitted] = QueryParams[permitted].map(function(item: string) {
          return sanitize(item)
        })
      } else {
        copy[permitted] = sanitize(QueryParams[permitted])
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
