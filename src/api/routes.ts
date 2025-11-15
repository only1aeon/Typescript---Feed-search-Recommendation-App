import express from "express";
import { searchHandler } from "./controllers/searchController";
import { feedHandler } from "./controllers/feedController";

const router = express.Router();

router.get("/search", searchHandler);
router.get("/feed", feedHandler);

export default router;
