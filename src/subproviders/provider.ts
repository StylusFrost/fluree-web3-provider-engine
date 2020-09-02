import Subprovider from './subprovider'

// wraps a provider in a subprovider interface

export default class ProviderSubprovider extends Subprovider {
  provider: any
  constructor(provider: any) {
    super()
    if (!provider) throw new Error('ProviderSubprovider - no provider specified')
    if (!provider.sendAsync)
      throw new Error('ProviderSubprovider - specified provider does not have a sendAsync method')
    this.provider = provider
  }
  public handleRequest(payload: any, next: Function, end: Function) {
    this.provider.sendAsync(payload, function(err: Error, response: any) {
      if (err) return end(err)
      if (response.error) return end(new Error(response.error.message))
      end(null, response.result)
    })
  }
}
