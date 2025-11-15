import axios from "axios";

interface Candidate {
  videoId: number;
  baseScore: number;
  embedding: Float32Array;
  bestSegmentText: string;
  bm25Score: number;
}

export class Reranker {
  private crossEncoderUrl: string;

  constructor(crossEncoderUrl: string) {
    this.crossEncoderUrl = crossEncoderUrl;
  }

  /** Call cross-encoder API to score (query, segment) pair */
  async segmentScore(query: string, segmentText: string): Promise<number> {
    if (!segmentText) return 0;
    try {
      const response = await axios.post(this.crossEncoderUrl, {
        inputs: [[query, segmentText]],
      });
      return response.data[0] || 0;
    } catch (e) {
      // fallback score
      return 0;
    }
  }

  /** Score a candidate video */
  async scoreVideo(
    userVec: Float32Array,
    query: string,
    videoVec: Float32Array,
    bestSegmentText: string,
    bm25Score = 0,
    weights = { alpha: 1, beta: 1, delta: 1, gamma: 1, exactBoost: 3 }
  ): Promise<number> {
    const crossS = await this.segmentScore(query, bestSegmentText);
    // cosine sim helper
    const dot = (a: Float32Array, b: Float32Array) => {
      let s = 0;
      for (let i = 0; i < a.length; i++) s += a[i] * b[i];
      return s;
    };
    const norm = (v: Float32Array) => Math.sqrt(dot(v, v)) + 1e-9;
    const cosineSim = dot(userVec, videoVec) / (norm(userVec) * norm(videoVec));

    // query-video semantic sim
    const qvSim = dot(videoVec, videoVec) / (norm(videoVec) * norm(videoVec)); // self-sim = 1 but placeholder

    const exact = bm25Score > 0 ? 1 : 0;

    return (
      weights.alpha * crossS +
      weights.beta * cosineSim +
      weights.delta * qvSim +
      weights.gamma * bm25Score +
      weights.exactBoost * exact
    );
  }

  /** Diversify top-k candidates */
  diversify(candidates: Candidate[], k = 12, diversityPenalty = 0.7): Candidate[] {
    const selected: Candidate[] = [];
    while (selected.length < k && candidates.length > 0) {
      const penalized = candidates.map((item) => {
        let penalty = 0;
        for (const s of selected) {
          // cosine sim between embeddings
          const dot = (a: Float32Array, b: Float32Array) => {
            let s = 0;
            for (let i = 0; i < a.length; i++) s += a[i] * b[i];
            return s;
          };
          const norm = (v: Float32Array) => Math.sqrt(dot(v, v)) + 1e-9;
          const sim = dot(s.embedding, item.embedding) / (norm(s.embedding) * norm(item.embedding));
          if (sim > penalty) penalty = sim;
        }
        return { candidate: item, score: item.baseScore - diversityPenalty * penalty };
      });
      penalized.sort((a, b) => b.score - a.score);
      selected.push(penalized[0].candidate);
      candidates = candidates.filter((c) => c !== penalized[0].candidate);
    }
    return selected;
  }
    }
