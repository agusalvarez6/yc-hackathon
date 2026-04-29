"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Sparkles, Type, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ingestRfp } from "@/app/actions/rfp";
import { cn } from "@/lib/utils";

type Mode = "text" | "pdf";

export function IngestForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (mode === "text") {
      if (!text.trim()) {
        setError("Paste the RFP text before submitting.");
        return;
      }
    } else {
      if (!file) {
        setError("Pick a PDF before submitting.");
        return;
      }
      if (file.type && file.type !== "application/pdf") {
        setError("That file isn't a PDF.");
        return;
      }
    }

    startTransition(async () => {
      const res =
        mode === "text"
          ? await ingestRfp({ mode: "text", text })
          : await ingestRfp({ mode: "pdf", file: file! });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/rfp/${res.data.slug}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div
        role="tablist"
        className="inline-flex items-center gap-1 rounded-full border bg-muted/50 p-1"
      >
        <ModeTab
          active={mode === "text"}
          onClick={() => setMode("text")}
          icon={<Type className="h-3.5 w-3.5" />}
          label="Paste text"
        />
        <ModeTab
          active={mode === "pdf"}
          onClick={() => setMode("pdf")}
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Upload PDF"
        />
      </div>

      {mode === "text" ? (
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
      ) : (
        <div className="space-y-2">
          <Label htmlFor="rfp-file">RFP PDF</Label>
          <label
            htmlFor="rfp-file"
            className={cn(
              "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 px-6 py-10 text-center transition-colors",
              "hover:border-foreground/40 hover:bg-muted/50",
              pending && "pointer-events-none opacity-60",
              file && "border-foreground/40 bg-muted/40",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
              {file ? (
                <FileText className="h-5 w-5 text-foreground" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {file ? (
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {(file.size / 1024).toFixed(0)} KB · click to replace
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Drop a PDF or click to browse</div>
                <div className="text-[11px] text-muted-foreground">
                  We extract text and route requirements automatically.
                </div>
              </div>
            )}
            <input
              id="rfp-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={pending}
              onChange={(e) => {
                setError(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
          </label>
        </div>
      )}

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

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
