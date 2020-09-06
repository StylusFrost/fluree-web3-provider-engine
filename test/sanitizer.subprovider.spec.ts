import assert = require('assert')
import ProviderEngine from '../src/index'
import injectMetrics from './util/inject-metrics'
import SanitizerSubproviderTx from '../src/subproviders/sanitizer-tx'
import SanitizerSubproviderQuery from '../src/subproviders/sanitizer-query'
import SanitizerSubproviderRequest from '../src/subproviders/sanitizer-request'
import { RandomId } from '../src/util/random-id'
import createPayload from '../src/util/create-payload'
import FixtureProvider from '../src/subproviders/fixture'
const url = require('url')

const rpcUrl = 'http://localhost:8080/'
const rdnDatabase = RandomId()
const database = 'testnet/' + rdnDatabase
const authID = Buffer.from(
  '5466477641644b48326e526456347a503479427a346b4a325239577a59484465324556',
  'hex',
)

describe('Sanitizer', () => {
  it('Sanitizer removes unknown keys from tx and generate necesary keys', function(done) {
    const engine = new ProviderEngine()

    const providerA = new injectMetrics(new SanitizerSubproviderTx({ rpcUrl, database }))
    engine.addProvider(providerA)

    const checkSanitizer = new FixtureProvider({
      fluree_sign_transact: (req: any, next: Function, end: Function) => {
        if (req.method !== 'fluree_sign_transact') return next()
        assert.equal(
          req['params'][0].type,
          '0x' + Buffer.from('fluree_sign_transact').toString('hex'),
        )
        assert.equal(
          req['params'][0].host,
          '0x' + Buffer.from(url.parse(rpcUrl, true).host).toString('hex'),
        )
        assert.equal(req['params'][0].db, '0x' + Buffer.from(database).toString('hex'))
        assert.equal(req['params'][0].from, '0x' + authID.toString('hex'))
        assert.equal(
          req['params'][0].tx,
          '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
        )
        assert.ok(req['params'][0].expire)
        assert.ok(!req['params'][0].foo)
        assert.ok(!req['params'][0].formattedDate)
        assert.ok(!req['params'][0].topics)
        assert.ok(!req['params'][0].param)
        end(null, { baz: 'bam' })
      },
    })
    engine.addProvider(checkSanitizer)

    engine.start()
    const payload = {
      method: 'fluree_sign_transact',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          foo: 'bar',
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          param: '0x6869207468657265',
          type: '7175657279',
          formattedDate: 'FECHA',
          topics: [null, '0X0A', '0x03'],
        },
      ],
    }
    engine.sendAsync(createPayload(payload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')
      engine.stop()
      done()
    })
  })

  it('Sanitizer removes unknown keys from request and generate necesary keys', function(done) {
    const engine = new ProviderEngine()

    const providerA = new injectMetrics(new SanitizerSubproviderRequest({ rpcUrl, database }))
    engine.addProvider(providerA)

    const checkSanitizer = new FixtureProvider({
      fluree_sign_delete_db: (req: any, next: Function, end: Function) => {
        if (req.method !== 'fluree_sign_delete_db') return next()
        assert.equal(
          req['params'][0].type,
          '0x' + Buffer.from('fluree_sign_delete_db').toString('hex'),
        )
        assert.equal(
          req['params'][0].host,
          '0x' + Buffer.from(url.parse(rpcUrl, true).host).toString('hex'),
        )
        assert.equal(req['params'][0].db, '0x' + Buffer.from(database).toString('hex'))
        assert.equal(req['params'][0].param, '0x6869207468657265')
        assert.equal(req['params'][0].from, '0x' + authID.toString('hex'))
        assert.ok(req['params'][0].formattedDate)
        assert.ok(!req['params'][0].tx)
        assert.ok(!req['params'][0].foo)
        assert.ok(!req['params'][0].topics)
        end(null, { baz: 'bam' })
      },
    })
    engine.addProvider(checkSanitizer)

    engine.start()
    const payload = {
      method: 'fluree_sign_delete_db',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          foo: 'bar',
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          param: '0x6869207468657265',
          type: '7175657279',
          formattedDate: 'FECHA',
          topics: [null, '0X0A', '0x03'],
        },
      ],
    }
    engine.sendAsync(createPayload(payload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      engine.stop()
      done()
    })
  })
  it('Sanitizer removes unknown keys from query and generate necesary keys', function(done) {
    const engine = new ProviderEngine()

    const providerA = new injectMetrics(new SanitizerSubproviderQuery({ rpcUrl, database }))
    engine.addProvider(providerA)

    const checkSanitizer = new FixtureProvider({
      fluree_sign_query: (req: any, next: Function, end: Function) => {
        if (req.method !== 'fluree_sign_query') return next()
        assert.equal(req['params'][0].type, '0x' + Buffer.from('fluree_sign_query').toString('hex'))
        assert.equal(
          req['params'][0].host,
          '0x' + Buffer.from(url.parse(rpcUrl, true).host).toString('hex'),
        )
        assert.equal(req['params'][0].db, '0x' + Buffer.from(database).toString('hex'))
        assert.equal(req['params'][0].param, '0x6869207468657265')
        assert.equal(req['params'][0].from, '0x' + authID.toString('hex'))
        assert.ok(req['params'][0].formattedDate)
        assert.ok(!req['params'][0].tx)
        assert.ok(!req['params'][0].foo)
        assert.ok(!req['params'][0].topics)

        end(null, { baz: 'bam' })
      },
    })
    engine.addProvider(checkSanitizer)

    engine.start()
    const payload = {
      method: 'fluree_sign_query',
      params: [
        {
          from: '0x' + authID.toString('hex'),
          foo: 'bar',
          tx:
            '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
          param: '0x6869207468657265',
          type: '7175657279',
          formattedDate: 'FECHA',
          topics: [null, '0X0A', '0x03'],
        },
      ],
    }
    engine.sendAsync(createPayload(payload), function(err: Error, response: any) {
      assert.ifError(err)
      assert.ok(response, 'has response')

      engine.stop()
      done()
    })
  })
})
