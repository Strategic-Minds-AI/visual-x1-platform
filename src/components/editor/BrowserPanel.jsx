import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, ExternalLink, Send, FileSearch } from "lucide-react";

export default function BrowserPanel({ onSendToChat }) {
  const [url, setUrl] = useState("");
  const [frameUrl, setFrameUrl] = useState("");
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalize = (raw) => (/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);

  const open = () => {
    if (!url.trim()) return;
    setError("");
    setFrameUrl(normalize(url));
  };

  const read = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setPage(null);
    try {
      const res = await base44.functions.invoke("fetchWebPage", { url: normalize(url) });
      if (res.data?.error) setError(res.data.error);
      else setPage(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not read that page.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-3 flex items-center gap-2 shrink-0">
        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && open()}
          placeholder="example.com"
          className="h-9 text-sm"
        />
        <Button size="sm" variant="outline" onClick={open} disabled={!url.trim()}>Open</Button>
        <Button size="sm" variant="outline" onClick={read} disabled={!url.trim() || loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileSearch className="w-3.5 h-3.5 mr-1" />} Read page
        </Button>
        {frameUrl && (
          <Button size="icon" variant="ghost" asChild title="Open in a new tab">
            <a href={frameUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0">
          {frameUrl ? (
            <iframe
              src={frameUrl}
              title="Web browser"
              className="w-full h-full border-0 bg-card"
              sandbox="allow-scripts allow-forms allow-popups"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Globe className="w-10 h-10 opacity-30" />
              <p className="text-sm">Enter a URL to open it here</p>
              <p className="text-xs max-w-sm text-center px-6">Some sites refuse to render inside another page. If one comes up blank, use Read page or open it in a new tab.</p>
            </div>
          )}
        </div>

        {(page || loading || error) && (
          <div className="w-2/5 min-w-[240px] border-l border-border flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
              <span className="text-xs font-medium">Page reader</span>
              {page?.status ? <Badge variant="outline" className="text-xs">HTTP {page.status}</Badge> : null}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {loading && <p className="text-xs text-muted-foreground">Fetching and extracting…</p>}
              {error && <p className="text-xs text-rose-600">{error}</p>}
              {page && (
                <>
                  <div>
                    <p className="text-sm font-medium leading-snug">{page.title || "Untitled page"}</p>
                    {page.description && <p className="text-xs text-muted-foreground mt-1">{page.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{page.headings?.length || 0} headings</Badge>
                    <Badge variant="outline" className="text-xs">{page.links?.length || 0} links</Badge>
                    <Badge variant="outline" className="text-xs">{Math.round((page.html_length || 0) / 1024)} KB</Badge>
                  </div>
                  {page.headings?.length ? (
                    <div>
                      <p className="text-xs font-medium mb-1">Structure</p>
                      <ul className="space-y-0.5">
                        {page.headings.slice(0, 18).map((h, i) => (
                          <li key={i} className="text-xs text-muted-foreground truncate">
                            <span className="text-muted-foreground/60 mr-1">{h.tag}</span>{h.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {page.text && (
                    <div>
                      <p className="text-xs font-medium mb-1">Text</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-56 overflow-hidden">{page.text.slice(0, 2500)}</p>
                    </div>
                  )}
                  {onSendToChat && page.text && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        onSendToChat(
                          `Reference page: ${page.final_url || url}\nTitle: ${page.title}\nHeadings: ${(page.headings || []).map((h) => h.text).slice(0, 12).join(" | ")}\nText: ${page.text.slice(0, 3000)}`
                        )
                      }
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Send to composer
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}