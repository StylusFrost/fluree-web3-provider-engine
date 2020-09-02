/* Sanitization Subprovider
 * Removes irregular keys
 */
const isHexPrefixed = require('is-hex-prefixed')
import Subprovider from './subprovider'

// we use this to clean any custom params from the RequestParams
const permitted = ['from', 'param', 'type', 'host', 'db', 'formattedDate', 'auth']

export default class SanitizerSubproviderRequest extends Subprovider {
  constructor() {
    super()
  }
  public handleRequest(payload: any, next: Function, end: Function) {
    const requestParams = payload.params[0]

    if (typeof requestParams === 'object' && !Array.isArray(requestParams)) {
      var sanitized = cloneRequestParams(requestParams)
      payload.params[0] = sanitized
    }

    next()
  }
}
function cloneRequestParams(RequestParams: any) {
  var sanitized = permitted.reduce(function(copy: any, permitted: string) {
    if (permitted in RequestParams) {
      if (Array.isArray(RequestParams[permitted])) {
        copy[permitted] = RequestParams[permitted].map(function(item: string) {
          return sanitize(item)
        })
      } else {
        copy[permitted] = sanitize(RequestParams[permitted])
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
