import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export default function TrackingSnippet({ measurementId }) {
  const [copied, setCopied] = useState(false);
  if (!measurementId) return null;

  const snippet = [
    "<!-- Google Analytics -->",
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>`,
    "<script>",
    "  window.dataLayer = window.dataLayer || [];",
    "  function gtag(){dataLayer.push(arguments);}",
    "  gtag('js', new Date());",
    `  gtag('config', '${measurementId}');`,
    "</script>",
  ].join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="outline" className="h-6 px-2" onClick={copy} title="Copy the Google Analytics tag for this variation">
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      <span className="text-xs">{copied ? "Copied" : "GA snippet"}</span>
    </Button>
  );
}