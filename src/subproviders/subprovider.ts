import CreatePayload from '../util/create-payload'

// this is the base class for a subprovider -- mostly helpers
export default class SubProvider {
  engine: any
  currentBlock: any
  constructor() {}
  public setEngine(engine: any) {
    if (this.engine) return
    this.engine = engine
    engine.on('block', (block: any) => (this.currentBlock = block))

    engine.on('start', () => this.start())

    engine.on('stop', () => this.stop())
  }

  public handleRequest(payload: Object, next: any, end: any) {
    throw new Error('Subproviders should override `handleRequest`.')
  }

  public emitPayload(payload: Object, cb: any) {
    this.engine.sendAsync(CreatePayload(payload), cb)
  }

  // dummies for overriding

  public stop() {}

  public start() {}
}
