const EMBEDDING_SERVICE_URL =
  process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${EMBEDDING_SERVICE_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Embedding service error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding;
}
