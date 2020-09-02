const extend = require('xtend')
import FixtureProvider from './fixture.js'
const version = require('../package.json').version

export default class DefaultFixtures extends FixtureProvider {
  constructor(opts?: any) {
    opts = opts || {}
    var responses = extend(
      {
        web3_clientVersion: 'ProviderEngine/v' + version + '/javascript',
        /*net_listening: true,
        eth_hashrate: '0x00', // TODO: No se para que valen ahora mismo
        eth_mining: false,*/
      },
      opts,
    )
    super(responses)
  }
}
