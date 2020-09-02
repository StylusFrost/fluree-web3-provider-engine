import { EventEmitter } from 'events'

export default class Stoplight extends EventEmitter {
  private isLocked: boolean
  constructor() {
    super()
    this.isLocked = true
  }

  public go() {
    this.isLocked = false
    this.emit('unlock')
  }

  stop() {
    this.isLocked = true
    this.emit('lock')
  }

  await(fn: any) {
    if (this.isLocked) {
      this.once('unlock', fn)
    } else {
      setTimeout(fn, 0)
    }
  }
}
