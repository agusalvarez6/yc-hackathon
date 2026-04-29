"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ingestRfp } from "@/app/actions/rfp";

export function IngestForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!text.trim()) {
      setError("Paste the RFP text before submitting.");
      return;
    }
    startTransition(async () => {
      const res = await ingestRfp({ mode: "text", text });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/rfp/${res.data.slug}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rfp-text">RFP text</Label>
        <Textarea
          id="rfp-text"
          name="rfp-text"
          placeholder="Paste the full RFP text here. The agent will extract requirements, score fit, and route open items to owners."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          className="min-h-[320px] font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          Tip: paste the entire document. We&apos;ll truncate noise automatically.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze RFP
            </>
          )}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
