import "reflect-metadata";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes";
import { AppDataSource } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use("/api", router);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
  }
}

startServer();
