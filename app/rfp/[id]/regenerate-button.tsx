"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProposalAction } from "@/app/actions/proposal";

export function RegenerateButton({
  rfpId,
  hasProposal,
}: {
  rfpId: string;
  hasProposal: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await generateProposalAction({ rfpId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button onClick={onClick} disabled={pending} size="sm">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {hasProposal ? "Regenerate proposal" : "Generate proposal"}
          </>
        )}
      </Button>
    </div>
  );
}
