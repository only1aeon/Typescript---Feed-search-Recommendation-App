import { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { SearchService } from "../../services/searchService";
import { FaissIndex } from "../../services/faissService";
import { Reranker } from "../../services/rerankService";

const faissDim = 512; // embedding dimension

// Initialize FAISS index and reranker
const faissIndex = new FaissIndex(faissDim);
const reranker = new Reranker(process.env.CROSS_ENCODER_API || "http://localhost:8000/cross-encoder");

const searchService = new SearchService(faissIndex, reranker);

export async function searchHandler(req: Request, res: Response) {
  const query = req.query.q as string;
  const k = parseInt((req.query.k as string) || "12");

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const results = await searchService.search(query, k);
    return res.json({
      query,
      results: results.map((r) => ({
        videoId: r.video.id,
        title: r.video.title,
        score: r.score,
        bestSegment: r.bestSegment?.transcript || null,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
