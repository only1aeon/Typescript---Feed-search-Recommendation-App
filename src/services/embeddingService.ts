import * as tf from "@tensorflow/tfjs-node";
import axios from "axios";

let model: tf.GraphModel | null = null;

export async function loadModel() {
  if (!model) {
    // Assume a saved model locally or remotely
    // For demo, fallback to API call below
    // model = await tf.loadGraphModel("file://path_to_model/model.json");
  }
  return model;
}

/**
 * Encode texts to dense vectors (512 dims)
 * If no local model, fallback to HF API (or mock)
 */
export async function encodeTexts(texts: string[]): Promise<Float32Array[]> {
  // Mock embedding using external API (replace with your own HF or OpenAI embedding service)
  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2",
      { inputs: texts },
      {
        headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
      }
    );
    return res.data.embeddings as Float32Array[];
  } catch (e) {
    // fallback: simple random embeddings (for demo only)
    return texts.map(() => {
      const arr = new Float32Array(512);
      for (let i = 0; i < 512; i++) arr[i] = Math.random() - 0.5;
      return arr;
    });
  }
}
