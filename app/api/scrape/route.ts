import { ingestRfp } from "@/app/actions/rfp";

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json body" }, { status: 400 });
  }

  const url = body.url;
  if (!url) {
    return Response.json({ ok: false, error: "missing url" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SOAP-RFP-Scraper/0.1)" },
    });
    if (!res.ok) {
      return Response.json(
        { ok: false, error: `upstream ${res.status}` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch (e) {
    return Response.json(
      { ok: false, error: `fetch failed: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const text = html.slice(0, 200_000);
  const slug = (() => {
    try {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      return segments[segments.length - 1] || `scrape-${Date.now()}`;
    } catch {
      return `scrape-${Date.now()}`;
    }
  })();

  const result = await ingestRfp({ mode: "text", text, slug });
  return Response.json(result);
}
