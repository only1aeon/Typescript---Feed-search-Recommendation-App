import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Video } from "../entities/Video";
import { Embedding } from "../entities/Embedding";
import { FaissIndex } from "./faissService";
import { Reranker } from "./rerankService";
import { encodeTexts } from "./embeddingService";

export class FeedService {
  private faissIndex: FaissIndex;
  private reranker: Reranker;

  constructor(faissIndex: FaissIndex, reranker: Reranker) {
    this.faissIndex = faissIndex;
    this.reranker = reranker;
  }

  /** Generate a personalized feed for a user */
  async getPersonalizedFeed(userId: number, k = 12): Promise<Video[]> {
    const userRepo = AppDataSource.getRepository(User);
    const embRepo = AppDataSource.getRepository(Embedding);
    const videoRepo = AppDataSource.getRepository(Video);

    // Step 1: Load user and user embedding vector
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) throw new Error("User not found");

    const userEmbedding = await embRepo.findOneBy({ ownerType: "user", ownerId: userId });
    if (!userEmbedding) {
      // Fallback: create embedding from user profile info or default
      // For demo, encode username as embedding
      const embeddings = await encodeTexts([user.username]);
      // You’d save embedding here for reuse in production
      return [];
    }

    // Step 2: Retrieve candidate videos from FAISS index (top 100)
    const faissRes = this.faissIndex.search(
      Buffer.from(userEmbedding.vector).buffer as unknown as Float32Array,
      100
    );

    // Step 3: Fetch video and embedding data
    const candidates: { video: Video; embedding: Embedding }[] = [];
    for (const embId of faissRes.labels) {
      const embedding = await embRepo.findOneBy({ id: embId });
      if (!embedding) continue;
      const video = await videoRepo.findOneBy({ id: embedding.ownerId });
      if (!video) continue;
      candidates.push({ video, embedding });
    }

    // Step 4: Score and diversify results with reranker
    const scoredCandidates = [];
    for (const c of candidates) {
      // For demo, userVec = userEmbedding vector
      const score = await this.reranker.scoreVideo(
        Buffer.from(userEmbedding.vector).buffer as unknown as Float32Array,
        "",
        Buffer.from(c.embedding.vector).buffer as unknown as Float32Array,
        "",
        0
      );
      scoredCandidates.push({ video: c.video, score, embedding: c.embedding });
    }

    const diversified = this.reranker.diversify(
      scoredCandidates.map((c) => ({
        videoId: c.video.id,
        baseScore: c.score,
        embedding: Buffer.from(c.embedding.vector).buffer as unknown as Float32Array,
        bestSegmentText: "",
        bm25Score: 0,
      })),
      k
    );

    // Map back to videos
    return diversified.map((item) => candidates.find((c) => c.video.id === item.videoId)!.video);
  }
}
