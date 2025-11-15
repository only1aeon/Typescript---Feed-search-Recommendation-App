import { FaissIndex } from "./faissService";
import { Reranker } from "./rerankService";
import { encodeTexts } from "./embeddingService";
import { tokenPresentProbability } from "./asrService";
import { AppDataSource } from "../config/database";
import { Video } from "../entities/Video";
import { Segment } from "../entities/Segment";
import { Embedding } from "../entities/Embedding";

interface SearchResult {
  video: Video;
  score: number;
  bestSegment: Segment | null;
}

export class SearchService {
  private faissIndex: FaissIndex;
  private reranker: Reranker;

  constructor(faissIndex: FaissIndex, reranker: Reranker) {
    this.faissIndex = faissIndex;
    this.reranker = reranker;
  }

  /** Search by query text, combining semantic + ASR + rerank */
  async search(query: string, k = 12): Promise<SearchResult[]> {
    // Step 1: Embed query
    const [queryVec] = await encodeTexts([query]);

    // Step 2: FAISS dense recall (top 50 candidates)
    const faissRes = this.faissIndex.search(queryVec, 50);
    // faissRes.labels contains embedding IDs (e.g. video IDs)
    // faissRes.distances contains similarity scores

    // Fetch videos and embeddings from DB by IDs
    const embRepo = AppDataSource.getRepository(Embedding);
    const videoRepo = AppDataSource.getRepository(Video);
    const segmentRepo = AppDataSource.getRepository(Segment);

    const candidates: {
      video: Video;
      embedding: Embedding;
      baseScore: number;
      bestSegment: Segment | null;
    }[] = [];

    for (let i = 0; i < faissRes.labels.length; i++) {
      const embId = faissRes.labels[i];
      const baseScore = faissRes.distances[i];

      const embedding = await embRepo.findOneBy({ id: embId });
      if (!embedding) continue;

      // We expect embedding.ownerType === "video"
      const video = await videoRepo.findOne({
        where: { id: embedding.ownerId },
        relations: ["segments"],
      });
      if (!video) continue;

      // Step 3: Lexical ASR recall: find best segment matching query tokens
      let bestSegment: Segment | null = null;
      let bestTokenProb = 0;

      const queryTokens = query.toLowerCase().split(/\s+/);

      for (const seg of video.segments) {
        // Aggregate probability query tokens appear in segment ASR lattice
        const probSum = queryTokens.reduce((acc, token) => {
          return acc + tokenPresentProbability(token, seg);
        }, 0);
        if (probSum > bestTokenProb) {
          bestTokenProb = probSum;
          bestSegment = seg;
        }
      }

      candidates.push({ video, embedding, baseScore, bestSegment });
    }

    // Step 4: Rerank candidates combining all signals
    const userVec = queryVec; // For demo, user vector = query vector
    const scoredCandidates = [];
    for (const c of candidates) {
      const rerankScore = await this.reranker.scoreVideo(
        userVec,
        query,
        Buffer.from(c.embedding.vector).buffer as unknown as Float32Array,
        c.bestSegment?.transcript || "",
        c.baseScore
      );
      scoredCandidates.push({ video: c.video, score: rerankScore, bestSegment: c.bestSegment });
    }

    // Step 5: Diversify top-k
    const diversified = this.reranker.diversify(
      scoredCandidates.map((c) => ({
        videoId: c.video.id,
        baseScore: c.score,
        embedding: Buffer.from(
          candidates.find((cand) => cand.video.id === c.video.id)!.embedding.vector
        ).buffer as unknown as Float32Array,
        bestSegmentText: c.bestSegment?.transcript || "",
        bm25Score: 0,
      })),
      k
    );

    // Map diversified IDs back to video objects and scores
    return diversified.map((item) => {
      const sc = scoredCandidates.find((c) => c.video.id === item.videoId)!;
      return { video: sc.video, score: sc.score, bestSegment: sc.bestSegment };
    });
  }
}
