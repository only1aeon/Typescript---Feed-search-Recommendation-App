# Live Social Backend

A robust TypeScript backend for a live-social e-commerce and social media app featuring:

- Semantic search with FAISS vector index
- ASR lattice lexical recall
- Transformer-based cross-encoder reranking
- Personalized feed recommendations
- PostgreSQL + TypeORM ORM
- Express API server
- Docker containerization

---

## Setup

### Requirements

- Node.js 20+
- PostgreSQL database
- Docker (optional, for containerized deployment)
- Hugging Face API key for embeddings (optional but recommended)
- Cross-encoder API endpoint (can be a Hugging Face endpoint or custom model server)

### Environment Variables

Create a `.env` file in the project root with:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=live_social_app
HF_API_KEY=your_huggingface_api_key_here
CROSS_ENCODER_API=http://localhost:8000/cross-encoder
PORT=3000
```

## Install Dependencies

`npm install`

## Run Development Server

`npm run dev`

## Build and Run Production Server

`npm run build`

`npm start`

## Run with Docker

`docker build -t live-social-backend .`

`docker run -p 3000:3000 --env-file .env live-social-backend`

## API Endpoints

`GET /api/search?q=your+query&k=12` — Search videos semantically and lexically

`GET /api/feed?userId=1&k=12` — Get personalized feed recommendations

## Notes

- FAISS index must be populated with video embeddings for search and feed to work effectively.
- ASR lattice data should be extracted and stored in Segment entities for lexical recall.
- Cross-encoder API should accept JSON with { inputs: [[query, segmentText]] } and return relevance scores.
- The embedding service currently uses Hugging Face API; you can replace with a local transformer model for performance.
