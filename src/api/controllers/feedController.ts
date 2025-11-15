import { Request, Response } from "express";
import { FaissIndex } from "../../services/faissService";
import { Reranker } from "../../services/rerankService";
import { FeedService } from "../../services/feedService";

const faissDim = 512;
const faissIndex = new FaissIndex(faissDim);
const reranker = new Reranker(process.env.CROSS_ENCODER_API || "http://localhost:8000/cross-encoder");
const feedService = new FeedService(faissIndex, reranker);

export async function feedHandler(req: Request, res: Response) {
  const userId = parseInt(req.query.userId as string);
  const k = parseInt((req.query.k as string) || "12");

  if (!userId) {
    return res.status(400).json({ error: "Missing or invalid userId" });
  }

  try {
    const feed = await feedService.getPersonalizedFeed(userId, k);
    return res.json({
      userId,
      feed: feed.map((video) => ({
        videoId: video.id,
        title: video.title,
      })),
    });
  } catch (error) {
    console.error("Feed error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
