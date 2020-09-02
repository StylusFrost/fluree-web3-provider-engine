import assert = require('assert')
import ProviderEngine from '../src/index'
import FixtureProvider from '../src/subproviders/fixture'
import SanitizerSubproviderTx from '../src/subproviders/sanitizer-tx'
import SanitizerSubproviderQuery from '../src/subproviders/sanitizer-query'
import SanitizerSubproviderRequest from '../src/subproviders/sanitizer-request'
const extend = require('xtend')

describe('Sanitizer', () => {
  it('Sanitizer removes unknown keys from tx', function(done) {
    var engine = new ProviderEngine()

    var sanitizer = new SanitizerSubproviderTx()
    engine.addProvider(sanitizer)

    // test sanitization
    var checkSanitizer = new FixtureProvider({
      test_unsanitized: (payload: any, next: Function, end: Function) => {
        if (payload.method !== 'test_unsanitized') return next()
        const firstParam = payload.params[0]
        assert.equal(firstParam && !firstParam.foo, true)
        assert.equal(
          firstParam.tx,
          '0x5b7b225f6964223a225f636f6c6c656374696f6e247365616c222c226e616d65223a227365616c222c22646f63223a224120636f6c6c656374696f6e20746f20686f6c642074686520696e666f726d6174696f6e206f6620746865207365616c73227d5d',
        )
        assert.equal(!firstParam.formattedDate, true)
        assert.equal(!firstParam.param, true)
        end(null, { baz: 'bam' })
      },
    })
    engine.addProvider(checkSanitizer)
    engine.start()

    var payload = {
      method: 'test_unsanitized',
      params: [
        {
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
    engine.sendAsync(payload, function(err: Error, response: any) {
      engine.stop()
      assert.equal(!err, true)
      assert.equal(response.result.baz, 'bam', 'result was received correctly')
      done()
    })
  })

  it('Sanitizer removes unknown keys from request', function(done) {
    var engine = new ProviderEngine()

    var sanitizer = new SanitizerSubproviderRequest()
    engine.addProvider(sanitizer)

    // test sanitization
    var checkSanitizer = new FixtureProvider({
      test_unsanitized: (payload: any, next: Function, end: Function) => {
        if (payload.method !== 'test_unsanitized') return next()
        const firstParam = payload.params[0]
        assert.equal(firstParam && !firstParam.foo, true)
        assert.equal(!firstParam.tx, true)
        assert.equal(!firstParam.formattedDate, false)
        assert.equal(firstParam.param, '0x6869207468657265')
        end(null, { baz: 'bam' })
      },
    })
    engine.addProvider(checkSanitizer)
    engine.start()

    var payload = {
      method: 'test_unsanitized',
      params: [
        {
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
    engine.sendAsync(payload, function(err: Error, response: any) {
      engine.stop()
      assert.equal(!err, true)
      assert.equal(response.result.baz, 'bam', 'result was received correctly')
      done()
    })
  })
  it('Sanitizer removes unknown keys from query', function(done) {
    var engine = new ProviderEngine()

    var sanitizer = new SanitizerSubproviderQuery()
    engine.addProvider(sanitizer)

    // test sanitization
    var checkSanitizer = new FixtureProvider({
      test_unsanitized: (payload: any, next: Function, end: Function) => {
        if (payload.method !== 'test_unsanitized') return next()
        const firstParam = payload.params[0]
        assert.equal(firstParam && !firstParam.foo, true)
        assert.equal(!firstParam.tx, true)
        assert.equal(!firstParam.formattedDate, false)
        assert.equal(firstParam.param, '0x6869207468657265')
        end(null, { baz: 'bam' })
      },
    })
    engine.addProvider(checkSanitizer)
    engine.start()

    var payload = {
      method: 'test_unsanitized',
      params: [
        {
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
    engine.sendAsync(payload, function(err: Error, response: any) {
      engine.stop()
      assert.equal(!err, true)
      assert.equal(response.result.baz, 'bam', 'result was received correctly')
      done()
    })
  })
})
