import assert = require('assert')
import Transaction from 'flureejs-tx'
import Query from 'flureejs-query'
import Request from 'flureejs-request'
import ProviderEngine from '../src/index'
import FixtureProvider from '../src/subproviders/fixture'
import NonceTracker from '../src/subproviders/nonce-tracker'
import HookedWalletProvider from '../src/subproviders/hooked-wallet'
import createPayload from '../src/util/create-payload'
import injectMetrics from './util/inject-metrics'
import SanitizerSubproviderTx from '../src/subproviders/sanitizer-tx'
import SanitizerSubproviderQuery from '../src/subproviders/sanitizer-query'
import SanitizerSubproviderRequest from '../src/subproviders/sanitizer-request'
import { RandomId } from '../src/util/random-id'

const rpcUrl = 'http://localhost:8080/'
const rdnDatabase = RandomId()
const database = 'testnet/' + rdnDatabase

describe('Sign', () => {
  it('tx', done => {
    const authID = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
      'hex',
    )
    const authID2 = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324557',
      'hex',
    )
    const privateKey = Buffer.from(
      '6a5f415f49986006815ae7887016275aac8ffb239f9a2fa7let300578582b6c2',
      'hex',
    )
    var providerA = new SanitizerSubproviderTx({ rpcUrl, database })

    // sign all
    var providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function (cb: any) {
          cb(null, [authID])
        },
        signTransaction: function (txParams: any, cb: any) {
          var tx = new Transaction(txParams)
          tx.sign(privateKey)
          cb(null, tx)
        },
      }))

    // handle nonce requests
    var providerC = new injectMetrics(new NonceTracker())
    // handle all bottom requests
    var providerD = new injectMetrics(
      new FixtureProvider({
        fluree_sendTransaction: function (payload: any, next: Function, done: Function) {
          let rawTx = payload.params[0]
          var tx = new Transaction(rawTx)
          done(null, tx)
        },
        fluree_getTransactionCount: '0x00',
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)
    engine.addProvider(providerD)

    var txPayload = {
      method: 'fluree_sign_transact',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID2.toString('hex'),
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          fuel: '0x0f4240',
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(txPayload), function (err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      // Initial tx
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

      // tx nonce
      assert.equal(
        providerC.getWitnessed('fluree_getTransactionCount').length,
        1,
        'providerC did see "fluree_getTransactionCount"',
      )
      assert.equal(
        providerC.getHandled('fluree_getTransactionCount').length,
        0,
        'providerC did NOT handle "fluree_getTransactionCount"',
      )

      // tx nonce
      assert.equal(
        providerD.getWitnessed('fluree_sendTransaction').length,
        1,
        'providerC did see "fluree_sendTransaction"',
      )
      assert.equal(
        providerD.getHandled('fluree_sendTransaction"').length,
        0,
        'providerC did NOT handle "fluree_sendTransaction""',
      )

      engine.stop()

      done()
    })
  })
  it('request', done => {
    const authID = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
      'hex',
    )
    const authID2 = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324557',
      'hex',
    )
    const privateKey = Buffer.from(
      '6a5f415f49986006815ae7887016275aac8ffb239f9a2fa7let300578582b6c2',
      'hex',
    )
    var providerA = new SanitizerSubproviderRequest({ rpcUrl, database })

    // sign all
    var providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function (cb: any) {
          cb(null, [authID])
        },
        signRequest: function (requestParams: any, cb: any) {
          var request = new Request(requestParams)
          request.sign(privateKey)
          cb(null, request)
        },
      }),
    )
    // handle all bottom requests
    var providerD = new injectMetrics(
      new FixtureProvider({
        fluree_sendRequest: function (payload: any, next: Function, done: Function) {
          let rawRequest = payload.params[0]
          var request = new Request(rawRequest)
          done(null, request)
        },
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerD)
    var requestPayload = {
      method: 'fluree_sign_delete_db',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID2.toString('hex'),
          param: '0x' + Buffer.from(JSON.stringify({ 'db/id': database })).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function (err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      // Initial tx
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

      // Send
      assert.equal(
        providerD.getWitnessed('fluree_sendRequest').length,
        1,
        'providerC did see "fluree_sendRequest"',
      )
      assert.equal(
        providerD.getHandled('fluree_sendRequest"').length,
        0,
        'providerC did NOT handle "fluree_sendRequest""',
      )

      engine.stop()

      done()
    })
  })
  it('query', done => {
    const authID = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
      'hex',
    )
    const authID2 = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324557',
      'hex',
    )
    const privateKey = Buffer.from(
      '6a5f415f49986006815ae7887016275aac8ffb239f9a2fa7let300578582b6c2',
      'hex',
    )
    var providerA = new SanitizerSubproviderQuery({ rpcUrl, database })

    // sign all
    var providerB = new injectMetrics(
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
    // handle all bottom requests
    var providerD = new injectMetrics(
      new FixtureProvider({
        fluree_sendQuery: function (payload: any, next: Function, done: Function) {
          let rawQuery = payload.params[0]
          var query = new Query(rawQuery)
          done(null, query)
        },
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerD)
    var requestPayload = {
      method: 'fluree_sign_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          auth: '0x' + authID2.toString('hex'),
          param:
            '0x' +
            Buffer.from(
              JSON.stringify({
                select: ['*'],
                from: '_auth',
              }),
            ).toString('hex'),
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function (err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      // Initial tx
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

      // Send
      assert.equal(
        providerD.getWitnessed('fluree_sendQuery').length,
        1,
        'providerC did see "fluree_sendQuery"',
      )
      assert.equal(
        providerD.getHandled('fluree_sendQuery"').length,
        0,
        'providerC did NOT handle "fluree_sendQuery""',
      )

      engine.stop()

      done()
    })
  })

  it('with no such account', function (done) {
    const authID = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
      'hex',
    )
    const authID2 = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577let484465324557',
      'hex',
    )

    var providerA = new SanitizerSubproviderTx({ rpcUrl, database })

    // sign all
    var providerB = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function (cb: any) {
          cb(null, [authID])
        },
      })
    )

    // handle nonce requests
    var providerC = new injectMetrics(new NonceTracker())
    // handle all bottom requests
    var providerD = new injectMetrics(
      new FixtureProvider({
        fluree_sendTransaction: function (payload: any, next: Function, done: Function) {
          let rawTx = payload.params[0]
          var tx = new Transaction(rawTx)
          done(null, tx)
        },
        fluree_getTransactionCount: '0x00',
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)
    engine.addProvider(providerD)

    var txPayload = {
      method: 'fluree_sign_transact',
      params: [
        {
          from: '0x' + authID2.toString('hex'),
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          fuel: '0x0f4240',
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(txPayload), function (err: Error, response: any) {
      assert.ok(err, 'did error')
      engine.stop()
      done()
    })
  })
})
