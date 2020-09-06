import { EventEmitter } from 'events'
import Stoplight from './util/stoplight'
const eachSeries = require('async/eachSeries')
const map = require('async/map')

export default class Web3ProviderEngine extends EventEmitter {
  opts: any
  running: boolean = false
  ready: Stoplight
  providers: any[]
  constructor(opts?: any) {
    super()
    this.setMaxListeners(30)
    // parse options
    this.opts = opts || {}
    this.ready = new Stoplight()
    this.providers = []
  }
  public start() {
    // trigger start
    this.ready.go()
    // update state
    this.running = true
    // signal that we started
    this.emit('start')
  }

  public stop() {
    // update state
    this.running = false
    // signal that we stopped
    this.emit('stop')
  }

  public isRunning() {
    return this.running
  }

  public addProvider(source: any, index?: number) {
    if (typeof index === 'number') {
      this.providers.splice(index, 0, source)
    } else {
      this.providers.push(source)
    }
    source.setEngine(this)
  }

  public removeProvider(source: any) {
    const index = this.providers.indexOf(source)
    if (index < 0) throw new Error('Provider not found.')
    this.providers.splice(index, 1)
  }

  public send() {
    throw new Error('Web3ProviderEngine does not support synchronous requests.')
  }

  public sendAsync(payload: Object, cb: any) {
    this.ready.await(() => {
      if (Array.isArray(payload)) {
        // handle batch
        map(payload, this.handleAsync.bind(this), cb)
      } else {
        // handle single
        this.handleAsync(payload, cb)
      }
    })
  }

  // private
  private handleAsync(payload: any, finished: any) {
    const self = this
    let currentProvider = -1

    const stack: any = []

    next()

    function next(after?: any) {
      currentProvider += 1
      stack.unshift(after)

      // Bubbled down as far as we could go, and the request wasn't
      // handled. Return an error.
      if (currentProvider >= self.providers.length) {
        end(
          new Error(
            `Request for method "${payload['method']}" not handled by any subprovider. Please check your subprovider configuration to ensure this method is handled.`,
          ),
        )
      } else {
        try {
          const provider = self.providers[currentProvider]
          provider.handleRequest(payload, next, end)
        } catch (e) {
          end(e)
        }
      }
    }

    function end(_error: Error, _result?: Object) {
      const error = _error
      const result = _result

      eachSeries(
        stack,
        function(fn: any, callback: any) {
          if (fn) {
            fn(error, result, callback)
          } else {
            callback()
          }
        },
        () => {
          const resultObj: any = {
            id: payload['id'],
            jsonrpc: payload['jsonrpc'],
            result: result,
          }

          if (error != null) {
            resultObj['error'] = {
              message: error.stack || error.message || error,
              code: -32000,
            }
            // respond with both error formats
            finished(error, resultObj)
          } else {
            finished(null, resultObj)
          }
        },
      )
    }
  }
}
