import assert = require('assert')
import ProviderEngine from '../src/index'
import PassthroughProvider from './util/passthrough'
import FixtureProvider from '../src/subproviders/fixture'
//import TestBlockProvider from './util/block'
import createPayload from '../src/util/create-payload'
import injectMetrics from './util/inject-metrics'

describe('fallthrough test', () => {
  it('fallthrough', function(done) {
    // handle nothing
    var providerA = new injectMetrics(new PassthroughProvider())
    // handle "test_rpc"
    var providerB = new injectMetrics(
      new FixtureProvider({
        test_rpc: true,
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)

    engine.start()
    engine.sendAsync(createPayload({ method: 'test_rpc' }), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(providerA.getWitnessed('test_rpc').length, 1, 'providerA did see "test_rpc"')
      assert.equal(
        providerA.getHandled('test_rpc').length,
        0,
        'providerA did NOT handle "test_rpc"',
      )

      assert.equal(providerB.getWitnessed('test_rpc').length, 1, 'providerB did see "test_rpc"')
      assert.equal(providerB.getHandled('test_rpc').length, 1, 'providerB did handle "test_rpc"')
      engine.stop()
      done()
    })
  })
})

describe('Provider add and remove', () => {
  it('add provider at index', function() {
    var providerA = new PassthroughProvider()
    var providerB = new PassthroughProvider()
    var providerC = new PassthroughProvider()
    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC, 1)

    assert.deepEqual(engine.providers, [providerA, providerC, providerB])
  })

  it('remove provider', function() {
    var providerA = new PassthroughProvider()
    var providerB = new PassthroughProvider()
    var providerC = new PassthroughProvider()
    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)
    engine.removeProvider(providerB)
    assert.deepEqual(engine.providers, [providerA, providerC])
  })
})
