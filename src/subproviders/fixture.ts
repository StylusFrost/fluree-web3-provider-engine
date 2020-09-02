import Subprovider from './subprovider'

export default class FixtureProvider extends Subprovider {
  staticResponses: any
  constructor(staticResponses?: any) {
    super()
    this.staticResponses = staticResponses || {}
  }
  public handleRequest(payload: any, next: any, end: any) {
    var staticResponse = this.staticResponses[payload['method']]
    // async function
    if ('function' === typeof staticResponse) {
      staticResponse(payload, next, end)
      // static response - null is valid response
    } else if (staticResponse !== undefined) {
      // return result asynchronously
      setTimeout(() => end(null, staticResponse), 0)
      // no prepared response - skip
    } else {
      next()
    }
  }
}
