import "server-only";

import { ai } from "./client";

const BATCH_SIZE = 100;

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await ai.embeddings.create({
      model: "gemini-embedding-2",
      input: batch,
      dimensions: 1536,
    });
    for (const d of res.data) {
      out.push(d.embedding as unknown as number[]);
    }
  }
  return out;
}
