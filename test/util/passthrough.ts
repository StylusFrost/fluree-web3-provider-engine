import FixtureProvider from '../../src/subproviders/fixture'

//
// handles no methods, skips all requests
// mostly useless
//
export default class PassthroughProvider extends FixtureProvider {
  constructor() {
    super({})
  }
}
