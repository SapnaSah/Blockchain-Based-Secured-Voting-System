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

export class Blockchain {
  private chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  private createGenesisBlock(): Block {
    return {
      index: 0,
      timestamp: Date.now(),
      vote: {
        candidateId: 0,
        electionId: 0,
        voterHash: "genesis",
      },
      previousHash: "0",
      hash: "0",
    };
  }

  private calculateHash(block: Omit<Block, "hash">): string {
    const data = block.index + block.timestamp + JSON.stringify(block.vote) + block.previousHash;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  addBlock(vote: { candidateId: number; electionId: number; voterHash: string }): Block {
    const previousBlock = this.chain[this.chain.length - 1];
    const newBlock: Block = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      vote,
      previousHash: previousBlock.hash,
      hash: '',
    };
    newBlock.hash = this.calculateHash(newBlock);
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== this.calculateHash({ ...currentBlock, hash: '' })) {
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
