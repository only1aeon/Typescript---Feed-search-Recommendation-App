import express from "express";
import { searchHandler } from "./controllers/searchController";

const router = express.Router();

router.get("/search", searchHandler);

// Add other routes (e.g., feed recommendations) later

export default router;
