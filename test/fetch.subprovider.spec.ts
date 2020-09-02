import assert = require('assert')
import ProviderEngine from '../src/index'
import PassthroughProvider from './util/passthrough'
import FetchSubprovider from '../src/subproviders/fetch'
import createPayload from '../src/util/create-payload'
import injectMetrics from './util/inject-metrics'
import { RandomId } from '../src/util/random-id'
const rpcUrl = 'http://localhost:8080/'
const rdnDatabase = RandomId()
const database = 'testnet/' + rdnDatabase
describe('fetch test', () => {
  it('verify fluree_health', function(done) {
    // handle nothing
    var providerA = new injectMetrics(new PassthroughProvider())

    // Fetch provider
    const providerB = new injectMetrics(new FetchSubprovider({ rpcUrl }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)

    engine.start()
    engine.sendAsync(createPayload({ method: 'fluree_health' }), function(
      err: Error,
      response: any,
    ) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_health').length,
        1,
        'providerA did see "fluree_health"',
      )
      assert.equal(
        providerA.getHandled('fluree_health').length,
        0,
        'providerA did NOT handle "fluree_health"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_health').length,
        1,
        'providerB did see "fluree_health"',
      )
      assert.equal(
        providerB.getHandled('fluree_health').length,
        1,
        'providerB did handle "fluree_health"',
      )

      assert(response['result']['ready'])
      assert(response['result']['utilization'])

      engine.stop()
      done()
    })
  })
  it('verify fluree_dbs', function(done) {
    // handle nothing
    var providerA = new injectMetrics(new PassthroughProvider())

    // Fetch provider
    const providerB = new injectMetrics(new FetchSubprovider({ rpcUrl }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)

    engine.start()
    engine.sendAsync(createPayload({ method: 'fluree_dbs' }), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(providerA.getWitnessed('fluree_dbs').length, 1, 'providerA did see "fluree_dbs"')
      assert.equal(
        providerA.getHandled('fluree_dbs').length,
        0,
        'providerA did NOT handle "fluree_dbs"',
      )
      assert.equal(providerB.getWitnessed('fluree_dbs').length, 1, 'providerB did see "fluree_dbs"')
      assert.equal(
        providerB.getHandled('fluree_dbs').length,
        1,
        'providerB did handle "fluree_dbs"',
      )
      assert(response['result'].length >= 0)

      engine.stop()
      done()
    })
  })
  it('verify fluree_new-db', function(done) {
    // handle nothing
    var providerA = new injectMetrics(new PassthroughProvider())

    // Fetch provider
    const providerB = new injectMetrics(new FetchSubprovider({ rpcUrl }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)

    engine.start()
    const params = { body: { 'db/id': database } }
    engine.sendAsync(createPayload({ method: 'fluree_new-db', params: params }), function(
      err: Error,
      response: any,
    ) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_new-db').length,
        1,
        'providerA did see "fluree_new-db"',
      )
      assert.equal(
        providerA.getHandled('fluree_new-db').length,
        0,
        'providerA did NOT handle "fluree_new-db"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_new-db').length,
        1,
        'providerB did see "fluree_new-db"',
      )
      assert.equal(
        providerB.getHandled('fluree_new-db').length,
        1,
        'providerB did handle "fluree_new-db"',
      )
      assert.ok(response['result'].match(/[0-9A-Fa-f]{4}/g))
      engine.stop()
      done()
    })
  })
  it('verify fluree_snapshot', function(done) {
    // handle nothing
    var providerA = new injectMetrics(new PassthroughProvider())

    // Fetch provider
    const providerB = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)

    engine.start()
    engine.sendAsync(createPayload({ method: 'fluree_snapshot' }), function(
      err: Error,
      response: any,
    ) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_snapshot').length,
        1,
        'providerA did see "fluree_snapshot"',
      )
      assert.equal(
        providerA.getHandled('fluree_snapshot').length,
        0,
        'providerA did NOT handle "fluree_snapshot"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_snapshot').length,
        1,
        'providerB did see "fluree_snapshot"',
      )
      assert.equal(
        providerB.getHandled('fluree_snapshot').length,
        1,
        'providerB did handle "fluree_snapshot"',
      )

      assert.ok(response['result'].includes(database))
      engine.stop()
      done()
    })
  })
})
