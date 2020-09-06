import ProviderEngine from './index.js'
import DefaultFixture from './subproviders/default-fixture'
import NonceTrackerSubprovider from './subproviders/nonce-tracker.js'
import SanitizingSubproviderTx from './subproviders/sanitizer-tx'
import SanitizingSubproviderQuery from './subproviders/sanitizer-query'
import SanitizingSubproviderRequest from './subproviders/sanitizer-request'
import HookedWalletSubprovider from './subproviders/hooked-wallet'
import FetchSubprovider from './subproviders/fetch'
export default class ZeroClientProvider {
  constructor(opts?: any) {
    const connectionType = getConnectionType(opts)
    const engine = new ProviderEngine(opts.engineParams)
    // static
    const staticSubprovider = new DefaultFixture(opts.static)
    engine.addProvider(staticSubprovider)

    // nonce tracker
    engine.addProvider(new NonceTrackerSubprovider())

    // sanitization
    const sanitizerTx = new SanitizingSubproviderTx()
    engine.addProvider(sanitizerTx)
    const sanitizerQuery = new SanitizingSubproviderQuery()
    engine.addProvider(sanitizerQuery)
    const sanitizerRequest = new SanitizingSubproviderRequest()
    engine.addProvider(sanitizerRequest)

    // cache layer
    // TODO: Entender cómo funciona
    /*const cacheSubprovider = new CacheSubprovider()
        engine.addProvider(cacheSubprovider)*/

    // filters + subscriptions
    // only polyfill if not websockets
    // TODO: Entender cómo funciona
    /*if (connectionType !== 'ws') {
            engine.addProvider(new SubscriptionSubprovider())
            engine.addProvider(new FilterSubprovider())
        }*/

    // inflight cache
    // TODO: Entender cómo funciona
    /*
        const inflightCache = new InflightCacheSubprovider()
        engine.addProvider(inflightCache)
        */

    const idmgmtSubprovider = new HookedWalletSubprovider({
      // accounts
      getAccounts: opts.getAccounts,
      // transactions
      processTransaction: opts.processTransaction,
      approveTransaction: opts.approveTransaction,
      signTransaction: opts.signTransaction,
      publishTransaction: opts.publishTransaction,
      // Queries
      processQuery: opts.processQuery,
      approveQuery: opts.approveQuery,
      signQuery: opts.signQuery,
      publishQuery: opts.publishQuery,
      // Requests
      processRequest: opts.procesRequest,
      approveRequest: opts.approveRequest,
      signRequest: opts.signRequest,
      publishRequest: opts.publishRequest,
    })
    engine.addProvider(idmgmtSubprovider)

    // data source
    const dataSubprovider = opts.dataSubprovider || createDataSubprovider(connectionType, opts)
    engine.addProvider(dataSubprovider)

    // start polling
    if (!opts.stopped) {
      engine.start()
    }
    return engine
  }
}
function createDataSubprovider(connectionType: string | undefined, opts: any = {}) {
  const { rpcUrl, debug } = opts

  // default
  if (!connectionType) {
    return new FetchSubprovider({ rpcUrl, debug })
  }
  // TODO Hacer funcionar por ws
  /*
    if (connectionType === 'ws') {
      return new WebSocketSubprovider({ rpcUrl, debug })
    }*/

  throw new Error(`ProviderEngine - unrecognized connectionType "${connectionType}"`)
}

function getConnectionType(opts: any = {}) {
  const { rpcUrl } = opts
  if (!rpcUrl) return undefined

  const protocol = rpcUrl.split(':')[0].toLowerCase()
  switch (protocol) {
    case 'http':
    case 'https':
      return 'http'
    case 'ws':
    case 'wss':
      return 'ws'
    default:
      throw new Error(`ProviderEngine - unrecognized protocol in "${rpcUrl}"`)
  }
}
