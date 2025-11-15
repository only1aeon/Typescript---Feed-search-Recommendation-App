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
DB_NAME=live_social
HF_API_KEY=your_huggingface_api_key_here
CROSS_ENCODER_API=http://localhost:8000/cross-encoder
PORT=3000
