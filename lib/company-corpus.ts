import "server-only";

import fs from "node:fs";
import path from "node:path";

export interface CompanyCorpusDocument {
  documentId: string;
  content: string;
}

const dir = path.join(process.cwd(), "data/documents");

const corpus: CompanyCorpusDocument[] = fs
  .readdirSync(dir)
  .filter((name) => name.endsWith(".md"))
  .sort()
  .map((name) => ({
    documentId: name.replace(/\.md$/, ""),
    content: fs.readFileSync(path.join(dir, name), "utf8"),
  }));

export function loadCompanyCorpus(): CompanyCorpusDocument[] {
  return corpus;
}
