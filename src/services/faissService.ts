import Faiss from "faiss-node";
import { Float32Array } from "buffer";

export class FaissIndex {
  private index: any;
  private dim: number;

  constructor(dim: number) {
    this.dim = dim;
    this.index = new Faiss.IndexFlatIP(dim);
  }

  add(embeddings: Float32Array[]) {
    const vectors = Buffer.concat(embeddings.map(v => Buffer.from(v.buffer)));
    this.index.add(embeddings.length, vectors);
  }

  search(query: Float32Array, k: number) {
    const { labels, distances } = this.index.search(query, k);
    return { labels, distances };
  }
}
