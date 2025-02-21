import crypto from 'crypto';

interface Block {
  index: number;
  timestamp: number;
  vote: {
    candidateId: number;
    electionId: number;
    voterHash: string;
  };
  previousHash: string;
  hash: string;
}

type BlockWithoutHash = Omit<Block, "hash"> & { hash?: string };

export class Blockchain {
  private chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  private createGenesisBlock(): Block {
    const block: BlockWithoutHash = {
      index: 0,
      timestamp: Date.now(),
      vote: {
        candidateId: 0,
        electionId: 0,
        voterHash: "genesis",
      },
      previousHash: "0",
    };
    block.hash = this.calculateHash(block);
    return block as Block;
  }

  private calculateHash(block: BlockWithoutHash): string {
    const data = block.index + block.timestamp + JSON.stringify(block.vote) + block.previousHash;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  addBlock(vote: { candidateId: number; electionId: number; voterHash: string }): Block {
    const previousBlock = this.chain[this.chain.length - 1];
    const block: BlockWithoutHash = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      vote,
      previousHash: previousBlock.hash,
    };
    block.hash = this.calculateHash(block);
    const newBlock = block as Block;
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      const blockWithoutHash: BlockWithoutHash = {
        ...currentBlock,
        hash: undefined,
      };

      if (currentBlock.hash !== this.calculateHash(blockWithoutHash)) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getVotes(electionId: number): Block[] {
    return this.chain.filter(block => block.vote.electionId === electionId);
  }
}

export const blockchain = new Blockchain();