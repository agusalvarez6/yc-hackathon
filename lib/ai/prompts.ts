import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

const dir = path.join(process.cwd(), "lib/ai/prompts");

export async function loadPrompt(
  name: "rfp-detail" | "match" | "proposal",
): Promise<string> {
  return fs.readFile(path.join(dir, `${name}.md`), "utf8");
}
