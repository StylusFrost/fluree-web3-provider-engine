import { RandomId } from './random-id'
const extend = require('xtend')

export default function CreatePayload(data: Object) {
  return extend(
    {
      // defaults
      id: RandomId(),
      jsonrpc: '2.0',
      params: [],
      // user-specified
    },
    data,
  )
}
