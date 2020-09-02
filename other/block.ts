const extend = require('xtend')
import FixtureProvider from '../../src/subproviders/fixture'
const ethUtil = require('ethereumjs-util')

//
// handles only `eth_getBlockByNumber` requests
// returns a dummy block
//

export default class TestBlockProvider extends FixtureProvider {
  blockChain: any = {}
  pendingTxs: Array<any> = []
  constructor(methods?: any) {
    super({
      eth_getBlockByNumber: function(payload: any, next: any, end: any) {
        const blockRef = payload.params[0]
        const result = this.getBlockByRef(blockRef)
        // return result asynchronously
        setTimeout(() => end(null, result), 0)
      },
      eth_getLogs: function(payload: any, next: any, end: any) {
        const transactions = this.currentBlock.transactions
        // return result asynchronously
        setTimeout(() => end(null, transactions), 0)
      },
    })
    this.blockChain = {}
    this.pendingTxs = []
    this.nextBlock()
  }

  public getBlockByRef(blockRef: string) {
    const self = this
    if (blockRef === 'latest') {
      return self.currentBlock
    } else {
      // if present, return block at reference
      let block = self.blockChain[blockRef]
      if (block) return block
      // check if we should create the new block
      const blockNum = Number(blockRef)
      if (blockNum > Number(self.currentBlock.number)) return
      // create, store, and return the new block
      block = this.createBlock({ number: blockRef })
      self.blockChain[blockRef] = block
      return block
    }
  }
  public nextBlock(blockParams?: any) {
    const newBlock = this.createBlock(blockParams, this.currentBlock, this.pendingTxs)
    this.pendingTxs = []
    this.currentBlock = newBlock
    this.blockChain[newBlock.number] = newBlock
    return this.currentBlock
  }

  public addTx(txParams: Object) {
    var newTx = extend(
      {
        // defaults
        address: randomHash(),
        topics: [randomHash(), randomHash(), randomHash()],
        data: randomHash(),
        blockNumber: '0xdeadbeef',
        logIndex: '0xdeadbeef',
        blockHash: '0x7c337eac9e3ec7bc99a1d911d326389558c9086afca7480a19698a16e40b2e0a',
        transactionHash: '0xd81da851bd3f4094d52cb86929e2ea3732a60ba7c184b853795fc5710a68b5fa',
        transactionIndex: '0x0',
        // provided
      },
      txParams,
    )
    this.pendingTxs.push(newTx)
    return newTx
  }

  public createBlock(blockParams: Object, prevBlock?: any, txs?: Array<any>) {
    blockParams = blockParams || {}
    txs = txs || []
    var defaultNumber = prevBlock ? this.incrementHex(prevBlock.number) : '0x1'
    var defaultGasLimit = ethUtil.intToHex(4712388)
    return extend(
      {
        // defaults
        number: defaultNumber,
        hash: randomHash(),
        parentHash: prevBlock ? prevBlock.hash : randomHash(),
        nonce: randomHash(),
        mixHash: randomHash(),
        sha3Uncles: randomHash(),
        logsBloom: randomHash(),
        transactionsRoot: randomHash(),
        stateRoot: randomHash(),
        receiptsRoot: randomHash(),
        miner: randomHash(),
        difficulty: randomHash(),
        totalDifficulty: randomHash(),
        size: randomHash(),
        extraData: randomHash(),
        gasLimit: defaultGasLimit,
        gasUsed: randomHash(),
        timestamp: randomHash(),
        transactions: txs,
        // provided
      },
      blockParams,
    )
  }
  public incrementHex(hexString: string) {
    return stripLeadingZeroes(ethUtil.intToHex(Number(hexString) + 1))
  }
}

function randomHash() {
  return ethUtil.bufferToHex(ethUtil.toBuffer(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))
}

function stripLeadingZeroes(hexString: string) {
  let strippedHex = ethUtil.stripHexPrefix(hexString)
  while (strippedHex[0] === '0') {
    strippedHex = strippedHex.substr(1)
  }
  return ethUtil.addHexPrefix(strippedHex)
}
