import assert = require('assert')
import Transaction from 'flureejs-tx'
import Query from 'flureejs-query'
import { toBuffer } from 'flureejs-utils'
import Request from 'flureejs-request'
import ProviderEngine from '../src/index'
import FixtureProvider from '../src/subproviders/fixture'
import NonceTracker from '../src/subproviders/nonce-tracker'
import HookedWalletProvider from '../src/subproviders/hooked-wallet'
import createPayload from '../src/util/create-payload'
import injectMetrics from './util/inject-metrics'

describe('Sign', () => {
  it('tx', done => {
    const authID = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
      'hex',
    )
    const privateKey = Buffer.from(
      '6a5f415f49986006815ae7887016275aac8ffb239f9a2fa7172300578582b6c2',
      'hex',
    )
    // sign all
    var providerA = new injectMetrics(
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
    var providerB = new injectMetrics(new NonceTracker())
    // handle all bottom requests
    var providerC = new injectMetrics(
      new FixtureProvider({
        fluree_sendRawTransaction: function(payload: any, next: Function, done: Function) {
          var rawTx = payload.params[0].raw
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

    var txPayload = {
      method: 'fluree_sendTransaction',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          type: '0x7478',
          db: '0x61756469747a6f6e652d746573746e65742f7365616c6462',
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          auth: '0x5466386f764864676e445a58724d7a71454c706131787331636664684a696533507761',
          fuel: '0x0f4240',
          expire: '0x017410ddd6e2',
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(txPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      // intial tx
      assert.equal(
        providerA.getWitnessed('fluree_sendTransaction').length,
        1,
        'providerA did see "signTransaction"',
      )
      assert.equal(
        providerA.getHandled('fluree_sendTransaction').length,
        1,
        'providerA did handle "signTransaction"',
      )

      // tx nonce
      assert.equal(
        providerB.getWitnessed('fluree_getTransactionCount').length,
        1,
        'providerB did see "fluree_getTransactionCount"',
      )
      assert.equal(
        providerB.getHandled('fluree_getTransactionCount').length,
        0,
        'providerB did NOT handle "fluree_getTransactionCount"',
      )

      // send raw tx
      assert.equal(
        providerC.getWitnessed('fluree_sendRawTransaction').length,
        1,
        'providerC did see "fluree_sendRawTransaction"',
      )
      assert.equal(
        providerC.getHandled('fluree_sendRawTransaction').length,
        1,
        'providerC did handle "fluree_sendRawTransaction"',
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
    const privateKey = Buffer.from(
      '6a5f415f49986006815ae7887016275aac8ffb239f9a2fa7172300578582b6c2',
      'hex',
    )
    // sign all
    var providerA = new injectMetrics(
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

    // handle all bottom requests
    var providerC = new injectMetrics(
      new FixtureProvider({
        fluree_sendRawRequest: function(payload: any, next: Function, done: Function) {
          var rawRequest = payload.params[0].raw
          var request = new Request(rawRequest)
          done(null, request)
        },
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerC)

    var requestPayload = {
      method: 'fluree_sendRequest',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          param: '0x7b7d',
          type: '0x6c6973742d736e617073686f7473',
          host: '0x6c6f63616c686f7374',
          db: '0x61756469747a6f6e652d746573746e65742f7365616c6462',
          formattedDate: '0x5475652c2031382041756720323032302030393a30323a353420474d54',
          auth: '0x',
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(requestPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      // intial request
      assert.equal(
        providerA.getWitnessed('fluree_sendRequest').length,
        1,
        'providerA did see "signRequest"',
      )
      assert.equal(
        providerA.getHandled('fluree_sendRequest').length,
        1,
        'providerA did handle "signRequest"',
      )

      // send raw request
      assert.equal(
        providerC.getWitnessed('fluree_sendRawRequest').length,
        1,
        'providerC did see "fluree_sendRawRequest"',
      )
      assert.equal(
        providerC.getHandled('fluree_sendRawRequest').length,
        1,
        'providerC did handle "fluree_sendRawRequest"',
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
    const privateKey = Buffer.from(
      '6a5f415f49986006815ae7887016275aac8ffb239f9a2fa7172300578582b6c2',
      'hex',
    )
    // sign all
    var providerA = new injectMetrics(
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

    // handle all bottom requests
    var providerC = new injectMetrics(
      new FixtureProvider({
        fluree_sendRawQuery: function(payload: any, next: Function, done: Function) {
          var rawQuery = payload.params[0].raw
          var query = new Query(rawQuery)
          done(null, query)
        },
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerC)

    var queryPayload = {
      method: 'fluree_sendQuery',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          param: '0x6869207468657265',
          type: '0x7175657279',
          host: '0x6c6f63616c686f7374',
          db: '0x61756469747a6f6e652d746573746e65742f7365616c6462',
          formattedDate: '0x5475652c2031382041756720323032302030393a30323a353420474d54',
          auth: '0x',
        },
      ],
    }

    engine.start()
    engine.sendAsync(createPayload(queryPayload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      // intial request
      assert.equal(
        providerA.getWitnessed('fluree_sendQuery').length,
        1,
        'providerA did see "signQuery"',
      )
      assert.equal(
        providerA.getHandled('fluree_sendQuery').length,
        1,
        'providerA did handle "signQuery"',
      )

      // send raw request
      assert.equal(
        providerC.getWitnessed('fluree_sendRawQuery').length,
        1,
        'providerC did see "fluree_sendRawQuery"',
      )
      assert.equal(
        providerC.getHandled('fluree_sendRawQuery').length,
        1,
        'providerC did handle "fluree_sendRawQuery"',
      )
      engine.stop()

      done()
    })
  })

  it('with no such account', function(done) {
    const authID = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
      'hex',
    )
    const authID2 = Buffer.from(
      '5466477641644b48326e526456347a503479427a346b4a325239577b59484465324111',
      'hex',
    )
    var addressHex = '0x1234362ef32bcd26d3dd18ca749378213625ba0b'
    var otherAddressHex = '0x4321362ef32bcd26d3dd18ca749378213625ba0c'

    // sign all tx's
    var providerA = new injectMetrics(
      new HookedWalletProvider({
        getAccounts: function(cb: Function) {
          cb(null, [authID])
        },
      }),
    )

    // handle nonce requests
    var providerB = new injectMetrics(new NonceTracker())
    // handle all bottom requests
    var providerC = new injectMetrics(
      new FixtureProvider({
        fluree_getTransactionCount: '0x00',
        fluree_sendRawTransaction: function(payload: any, next: Function, done: Function) {
          var rawTx = payload.params[0].raw
          var tx = new Transaction(rawTx)
          done(null, tx)
        },
      }),
    )

    var engine = new ProviderEngine()
    engine.addProvider(providerA)
    engine.addProvider(providerB)
    engine.addProvider(providerC)

    var txPayload = {
      method: 'fluree_sendTransaction',
      params: [
        {
          from: '0x' + authID2.toString('hex'),
          type: '0x7478',
          db: '0x61756469747a6f6e652d746573746e65742f7365616c6462',
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          auth: '0x5466386f764864676e445a58724d7a71454c706131787331636664684a696533507761',
          fuel: '0x0f4240',
          expire: '0x017410ddd6e2',
        },
      ],
    }
    engine.start()
    engine.sendAsync(createPayload(txPayload), function(err: Error, response: any) {
      assert.ok(err, 'did error')
      engine.stop()
      done()
    })
  })
})
