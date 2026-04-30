import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const STORAGE_KEY = "disclaimerAccepted";

const DISCLAIMER_TEXT = `This application provides financial data, risk indicators, and informational content only.

It does NOT provide:
- Investment advice
- Recommendations to buy or sell securities
- Financial, legal, or tax advice

All information is:
- Provided "as is"
- May be incomplete, delayed, or inaccurate
- Derived from third-party and automated systems

You are solely responsible for:
- Your investment decisions
- Any financial losses incurred

By using this application, you agree:
- The creators are not liable for any losses
- This tool is for informational and research purposes only

Use at your own risk.`;

/**
 * Patches the global `fetch` to include `x-disclaimer-accepted: true` on
 * every subsequent request so the API server lets them through.
 */
function patchFetchWithDisclaimerHeader() {
  const origFetch = window.fetch;
  window.fetch = (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("x-disclaimer-accepted", "true");
    return origFetch(input, { ...init, headers });
  };
}

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY) === "true";
    if (!accepted) {
      setOpen(true);
    } else {
      // Already accepted in a previous session — patch fetch immediately
      patchFetchWithDisclaimerHeader();
    }
  }, []);

  async function handleAccept() {
    try {
      await fetch("/api/accept-disclaimer", { method: "POST" });
    } catch {
      // Non-critical — proceed even if the log request fails
    }

    localStorage.setItem(STORAGE_KEY, "true");
    patchFetchWithDisclaimerHeader();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-lg"
        // Prevent closing by clicking the overlay or pressing Escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide the default close button
        aria-describedby="disclaimer-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            ⚠️ Important Disclaimer
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-72 rounded-md border p-4">
          <p
            id="disclaimer-description"
            className="whitespace-pre-line text-sm text-muted-foreground"
          >
            {DISCLAIMER_TEXT}
          </p>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            I Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
