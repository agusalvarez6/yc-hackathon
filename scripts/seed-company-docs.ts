import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

import documentsJson from "../data/documents.json";

interface CompanyDocument {
  id: string;
  tag: string;
  owner: string;
}

const CHUNK_SIZE = 4000;
const OVERLAP = 400;
const EMBED_BATCH = 100;
const EMBED_DIMS = 1536;

function chunkText(text: string): string[] {
  const out: string[] = [];
  if (text.length <= CHUNK_SIZE) {
    out.push(text);
    return out;
  }
  for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
    out.push(text.slice(i, i + CHUNK_SIZE));
    if (i + CHUNK_SIZE >= text.length) break;
  }
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  const apiKey = process.env.TOKEN_ROUTER_API_KEY;
  const baseURL = process.env.TOKEN_ROUTER_BASE_URL;
  if (!apiKey || !baseURL) {
    throw new Error(
      "TOKEN_ROUTER_API_KEY and TOKEN_ROUTER_BASE_URL must be set",
    );
  }

  const supabase = createClient(url, serviceKey);
  const ai = new OpenAI({ apiKey, baseURL });

  const docs = (documentsJson.documents as CompanyDocument[]) ?? [];
  const docsDir = path.join(process.cwd(), "data/documents");

  let totalChunks = 0;

  for (const doc of docs) {
    const filePath = path.join(docsDir, `${doc.id}.md`);
    const text = await fs.readFile(filePath, "utf8");
    const chunks = chunkText(text);

    const del = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", doc.id);
    if (del.error) throw new Error(`delete ${doc.id}: ${del.error.message}`);

    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const res = await ai.embeddings.create({
        model: "gemini-embedding-2",
        input: batch,
        dimensions: EMBED_DIMS,
      });
      for (const d of res.data) {
        vectors.push(d.embedding as unknown as number[]);
      }
    }

    const rows = chunks.map((content, i) => ({
      document_id: doc.id,
      tag: doc.tag,
      owner_id: doc.owner,
      page: 1,
      chunk_index: i,
      content,
      embedding: vectors[i],
    }));

    const ins = await supabase.from("document_chunks").insert(rows);
    if (ins.error) throw new Error(`insert ${doc.id}: ${ins.error.message}`);

    totalChunks += rows.length;
    console.log(`seeded ${doc.id}: ${rows.length} chunks`);
  }

  console.log(`done. total chunks inserted: ${totalChunks}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
