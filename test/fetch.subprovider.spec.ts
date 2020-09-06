import assert = require('assert')
import Request from 'flureejs-request'
import Query from 'flureejs-query'
import Transaction from 'flureejs-tx'
import ProviderEngine from '../src/index'
import FetchSubprovider from '../src/subproviders/fetch'
import HookedWalletProvider from '../src/subproviders/hooked-wallet'
import FixtureProvider from '../src/subproviders/fixture'
import createPayload from '../src/util/create-payload'
import injectMetrics from './util/inject-metrics'
import { RandomId } from '../src/util/random-id'
import SanitizerSubproviderTransaction from '../src/subproviders/sanitizer-tx'
import SanitizerSubproviderQuery from '../src/subproviders/sanitizer-query'
import SanitizerSubproviderRequest from '../src/subproviders/sanitizer-request'
import NonceTracker from '../src/subproviders/nonce-tracker'

const rpcUrl = 'http://localhost:8080/'
const rdnDatabase = RandomId()
const database = 'testnet/' + rdnDatabase

const authID = Buffer.from(
  '5466386f764864676e445a58724d7a71454c706131787331636664684a696533507761',
  'hex',
)
const privateKey = Buffer.from(
  'fe0af041abb1c734f8ab18d5c35385ef1f1c54a7d91fd2a5f9fdd03fcf077600',
  'hex',
)

describe('fetch test with sign', () => {
  it('verify fluree_sign_health ( Sign not necesary fluree_health )', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_health',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from('{}').toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_health').length,
        1,
        'providerA did see "fluree_sign_health"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_health').length,
        0,
        'providerA did NOT handle "fluree_sign_health"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_health').length,
        1,
        'providerB did see "fluree_sign_health"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_health').length,
        1,
        'providerB did handle "fluree_sign_health"',
      )

      assert(response['result']['ready'])
      assert(response['result']['utilization'])

      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_dbs ( Sign not necesary fluree_dbs)', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_dbs',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from('{}').toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_dbs').length,
        1,
        'providerA did see "fluree_sign_dbs"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_dbs').length,
        0,
        'providerA did NOT handle "fluree_sign_dbs"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_dbs').length,
        1,
        'providerB did see "fluree_sign_dbs"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_dbs').length,
        1,
        'providerB did handle "fluree_sign_dbs"',
      )
      assert(response['result'].length >= 0)

      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_new_db ( Sign not necesary fluree_new_db)', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_new_db',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({ 'db/id': database })).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_new_db').length,
        1,
        'providerA did see "fluree_sign_new_db"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_new_db').length,
        0,
        'providerA did NOT handle "fluree_sign_new_db"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_new_db').length,
        1,
        'providerB did see "fluree_sign_new_db"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_new_db').length,
        1,
        'providerB did handle "fluree_sign_new_db"',
      )
      assert.ok(response['result'].match(/[0-9A-Fa-f]{64}/g))
      engine.stop()
      done()
    })
  })
  it('verify sign_fluree_snapshot **** WAIT FOR DATABASE CREATION', function(done) {
    this.timeout(25000)

    setTimeout(() => {
      // handle nothing
      const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

      // sign all
      const providerB = new injectMetrics(
        new HookedWalletProvider({
          getAccounts: function(cb: any) {
            cb(null, [authID])
          },
          signRequest: function(requestParams: any, cb: any) {
            var request = new Request(requestParams)
            request.sign(privateKey)
            cb(null, request)
          },
        }),
      )

      // Fetch provider
      const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

      var engine = new ProviderEngine()
      engine.addProvider(providerA)
      engine.addProvider(providerB)
      engine.addProvider(providerC)

      var requestPayload = {
        method: 'fluree_sign_snapshot',
        params: [
          {
            from: '0x' + authID.toString('hex'),
            auth: '0x' + authID.toString('hex'),
            param: '0x' + Buffer.from('{}').toString('hex'),
          },
        ],
      }

      engine.start()
      engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
        assert.ifError(err)
        assert.ok(response, 'has response')

        assert.equal(
          providerA.getWitnessed('fluree_sign_snapshot').length,
          1,
          'providerA did see "fluree_sign_snapshot"',
        )
        assert.equal(
          providerA.getHandled('fluree_sign_snapshot').length,
          0,
          'providerA did NOT handle "fluree_sign_snapshot"',
        )
        assert.equal(
          providerB.getWitnessed('fluree_sign_snapshot').length,
          1,
          'providerB did see "fluree_sign_snapshot"',
        )
        assert.equal(
          providerB.getHandled('fluree_sign_snapshot').length,
          1,
          'providerB did handle "fluree_sign_snapshot"',
        )

        assert.ok(response['result'].includes(database))
        engine.stop()
        done()
      })
    }, 20000)
  })
  it('verify fluree_sign_list_snapshots', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_list_snapshots',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from('{}').toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_list_snapshots').length,
        1,
        'providerA did see "fluree_sign_list_snapshots"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_list_snapshots').length,
        0,
        'providerA did NOT handle "fluree_sign_list_snapshots"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_list_snapshots').length,
        1,
        'providerB did see "fluree_sign_list_snapshots"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_list_snapshots').length,
        1,
        'providerB did handle "fluree_sign_list_snapshots"',
      )
      assert.ok(response['result'][0].includes(database))
      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_export', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_export',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({ format: 'ttl' })).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_export').length,
        1,
        'providerA did see "fluree_sign_export"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_export').length,
        0,
        'providerA did NOT handle "fluree_sign_export"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_export').length,
        1,
        'providerB did see "fluree_sign_export"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_export').length,
        1,
        'providerB did handle "fluree_sign_export"',
      )
      assert.ok(response['result'].includes(database))
      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_query', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signQuery: function(queryParams: any, cb: any) {
          var query = new Query(queryParams)
          query.sign(privateKey)
          cb(null, query)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param:
            '0x' +
            Buffer.from(
              JSON.stringify({
                select: ['*', { '_role/rules': ['*'] }],
                from: '_role',
                compact: true,
              }),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_query').length,
        1,
        'providerA did see "fluree_sign_query"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_query').length,
        0,
        'providerA did NOT handle "fluree_sign_query"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_query').length,
        1,
        'providerB did see "fluree_sign_query"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_query').length,
        1,
        'providerB did handle "fluree_sign_query"',
      )
      assert.ok(response['result'].length >= 0)
      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_multi_query', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signQuery: function(queryParams: any, cb: any) {
          var query = new Query(queryParams)
          query.sign(privateKey)
          cb(null, query)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_multi_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param:
            '0x' +
            Buffer.from(
              JSON.stringify({
                query1: { select: ['*'], from: '_collection' },
                query2: { select: ['*'], from: '_predicate' },
              }),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_multi_query').length,
        1,
        'providerA did see "fluree_sign_multi_query"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_multi_query').length,
        0,
        'providerA did NOT handle "fluree_sign_multi_query"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_multi_query').length,
        1,
        'providerB did see "fluree_sign_multi_query"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_multi_query').length,
        1,
        'providerB did handle "fluree_sign_multi_query"',
      )
      assert.ok(response['result'].query1)
      assert.ok(response['result'].query2)
      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_block_query', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signQuery: function(queryParams: any, cb: any) {
          var query = new Query(queryParams)
          query.sign(privateKey)
          cb(null, query)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_block_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({ block: 1 })).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_block_query').length,
        1,
        'providerA did see "fluree_sign_block_query"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_block_query').length,
        0,
        'providerA did NOT handle "fluree_sign_block_query"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_block_query').length,
        1,
        'providerB did see "fluree_sign_block_query"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_block_query').length,
        1,
        'providerB did handle "fluree_sign_block_query"',
      )
      assert.ok(response['result'].length >= 1)
      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_history_query ', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signQuery: function(queryParams: any, cb: any) {
          var query = new Query(queryParams)
          query.sign(privateKey)
          cb(null, query)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_history_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param:
            '0x' +
            Buffer.from(
              JSON.stringify({
                history: ['_collection/name', '_setting'],
                block: 1,
              }),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_history_query').length,
        1,
        'providerA did see "fluree_sign_history_query"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_history_query').length,
        0,
        'providerA did NOT handle "fluree_sign_history_query"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_history_query').length,
        1,
        'providerB did see "fluree_sign_history_query"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_history_query').length,
        1,
        'providerB did handle "fluree_sign_history_query"',
      )
      assert(response['result'].length >= 1)
      engine.stop()
      done()
    })
  })
  it('verify fluree_sign_graphql_query', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signQuery: function(queryParams: any, cb: any) {
          var query = new Query(queryParams)
          query.sign(privateKey)
          cb(null, query)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_graphql_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param:
            '0x' +
            Buffer.from(
              JSON.stringify({ query: '{ graph { _auth {    _id,    id  }}}', variables: {} }),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_graphql_query').length,
        1,
        'providerA did see "fluree_sign_graphql_query"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_graphql_query').length,
        0,
        'providerA did NOT handle "fluree_sign_graphql_query"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_graphql_query').length,
        1,
        'providerB did see "fluree_sign_graphql_query"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_graphql_query').length,
        1,
        'providerB did handle "fluree_sign_graphql_query"',
      )
      assert.equal(response['result'].status, 200)
      engine.stop()
      done()
    })
  })

  /*it('verify fluree_sign_sparql_query', function(done) {

 
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function (cb: any) {
          cb(null, [authID])
        },
        signQuery: function (queryParams: any, cb: any) {
          var query = new Query(queryParams)
          query.sign(privateKey)
          cb(null, query)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))



    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

   var requestPayload = {
      method: 'fluree_sign_sparql_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' +Buffer.from('\"SELECT ?username WHERE {?user fd:_user/username ?username;}\"').toString('hex')
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(
      err: Error,
      response: any,
    ) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_sparql_query').length,
        1,
        'providerA did see "fluree_sign_sparql_query"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_sparql_query').length,
        0,
        'providerA did NOT handle "fluree_sign_sparql_query"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_sparql_query').length,
        1,
        'providerB did see "fluree_sign_sparql_query"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_sparql_query').length,
        1,
        'providerB did handle "fluree_sign_sparql_query"',
      )
      assert.equal(response['result'].status,200)
      engine.stop()
      done()
    })
  })*/

  it('verify fluree_sign_transact', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderTransaction({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signTransaction: function(txParams: any, cb: any) {
          var tx = new Transaction(txParams)
          tx.sign(privateKey)
          cb(null, tx)
        },
      }),
    )

    // handle nonce requests
    var providerC = new injectMetrics(new NonceTracker())

    // handle all bottom requests
    var providerD = new injectMetrics(
      new FixtureProvider({
        fluree_getTransactionCount: '0x01',
      }),
    )

    // Fetch provider
    const providerE = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)
    engine.addProvider(providerD)
    engine.addProvider(providerE)

    var requestPayload = {
      method: 'fluree_sign_transact',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          fuel: '0x03E8',
          tx:
            '0x' +
            Buffer.from(
              JSON.stringify([
                {
                  _id: '_user',
                  username: 'jdoe',
                },
              ]),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_transact').length,
        1,
        'providerA did see "fluree_sign_transact"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_transact').length,
        0,
        'providerA did NOT handle "fluree_sign_transact"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_transact').length,
        1,
        'providerB did see "fluree_sign_transact"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_transact').length,
        1,
        'providerB did handle "fluree_sign_transact"',
      )
      assert.equal(
        providerC.getWitnessed('fluree_sendTransaction').length,
        1,
        'providerC did see "fluree_sendTransaction"',
      )
      assert.equal(
        providerC.getHandled('fluree_sendTransaction').length,
        0,
        'providerC did NOT handle "fluree_sendTransaction"',
      )
      assert.equal(
        providerD.getWitnessed('fluree_getTransactionCount').length,
        1,
        'providerD did see "fluree_getTransactionCount"',
      )
      assert.equal(
        providerD.getHandled('fluree_getTransactionCount').length,
        1,
        'providerD did handle "fluree_getTransactionCount"',
      )
      assert(response['result'].match(/[0-9A-Fa-f]{64}/g))
      engine.stop()
      done()
    })
  })

  it('verify fluree_sign_reindex ( Sign not necesary fluree_reindex )', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Query(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_reindex',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from('{}').toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_reindex').length,
        1,
        'providerA did see "fluree_sign_reindex"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_reindex').length,
        0,
        'providerA did NOT handle "fluree_sign_reindex"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_reindex').length,
        1,
        'providerB did see "fluree_sign_reindex"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_reindex').length,
        1,
        'providerB did handle "fluree_sign_reindex"',
      )
      assert(response['result'].block)
      engine.stop()
      done()
    })
  })

  it('verify fluree_sign_gen_flakes', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Query(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_gen_flakes',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param:
            '0x' +
            Buffer.from(
              JSON.stringify([
                {
                  _id: '_user',
                  username: 'user3',
                },
              ]),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_gen_flakes').length,
        1,
        'providerA did see "fluree_sign_gen_flakes"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_gen_flakes').length,
        0,
        'providerA did NOT handle "fluree_sign_gen_flakes"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_gen_flakes').length,
        1,
        'providerB did see "fluree_sign_gen_flakes"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_gen_flakes').length,
        1,
        'providerB did handle "fluree_sign_gen_flakes"',
      )
      assert(response['result'].fuel)
      engine.stop()
      done()
    })
  })

  it('verify fluree_sign_block_range_with_txn', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Query(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_block_range_with_txn',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({ start: 4, end: 5 })).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_block_range_with_txn').length,
        1,
        'providerA did see "fluree_sign_block_range_with_txn"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_block_range_with_txn').length,
        0,
        'providerA did NOT handle "fluree_sign_block_range_with_txn"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_block_range_with_txn').length,
        1,
        'providerB did see "fluree_sign_block_range_with_txn"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_block_range_with_txn').length,
        1,
        'providerB did handle "fluree_sign_block_range_with_txn"',
      )
      assert.equal(response['result'].status, 200)
      engine.stop()
      done()
    })
  })

  it('verify fluree_sign_ledger_stats', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Query(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_ledger_stats',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({})).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_ledger_stats').length,
        1,
        'providerA did see "fluree_sign_ledger_stats"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_ledger_stats').length,
        0,
        'providerA did NOT handle "fluree_sign_ledger_stats"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_ledger_stats').length,
        1,
        'providerB did see "fluree_sign_ledger_stats"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_ledger_stats').length,
        1,
        'providerB did handle "fluree_sign_ledger_stats"',
      )
      assert.equal(response['result'].status, 200)
      engine.stop()
      done()
    })
  })
  it('verify sign_fluree_delete_db', function(done) {
    // handle nothing
    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))

    // sign all
    const providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: any) {
          cb(null, [authID])
        },
        signRequest: function(requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )

    // Fetch provider
    const providerC = new injectMetrics(new FetchSubprovider({ rpcUrl, database }))

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sign_delete_db',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({ 'db/id': database })).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      assert.equal(
        providerA.getWitnessed('fluree_sign_delete_db').length,
        1,
        'providerA did see "fluree_sign_delete_db"',
      )
      assert.equal(
        providerA.getHandled('fluree_sign_delete_db').length,
        0,
        'providerA did NOT handle "fluree_sign_delete_db"',
      )
      assert.equal(
        providerB.getWitnessed('fluree_sign_delete_db').length,
        1,
        'providerB did see "fluree_sign_delete_db"',
      )
      assert.equal(
        providerB.getHandled('fluree_sign_delete_db').length,
        1,
        'providerB did handle "fluree_sign_delete_db"',
      )
      assert.ok(response['result']['deleted'].includes(database))
      engine.stop()
      done()
    })
  })
})
