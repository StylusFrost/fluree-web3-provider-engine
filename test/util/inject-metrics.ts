export default class injectSubproviderMetrics {
  payloadsWitnessed: any
  payloadsHandled: any
  constructor(subprovider: any) {
    subprovider.getWitnessed = this.getWitnessed.bind(subprovider)
    subprovider.getHandled = this.getHandled.bind(subprovider)
    subprovider.clearMetrics = () => {
      subprovider.payloadsWitnessed = {}
      subprovider.payloadsHandled = {}
    }

    subprovider.clearMetrics()

    var _super = subprovider.handleRequest.bind(subprovider)
    subprovider.handleRequest = this.handleRequest.bind(subprovider, _super)

    return subprovider
  }

  public handleRequest(_super: any, payload: any, next: any, end: any) {
    const self = this
    // mark payload witnessed
    var witnessed = self.getWitnessed(payload['method'])
    witnessed.push(payload)
    // continue
    _super(payload, next, function(err: Error, result: any) {
      // mark payload handled
      var handled = self.getHandled(payload['method'])
      handled.push(payload)
      // continue
      end(err, result)
    })
  }

  getWitnessed(method: string) {
    const self = this
    var witnessed = (self.payloadsWitnessed[method] = self.payloadsWitnessed[method] || [])
    return witnessed
  }

  getHandled(method: string) {
    const self = this
    var witnessed = (self.payloadsHandled[method] = self.payloadsHandled[method] || [])
    return witnessed
  }
}
