import React, { useEffect, useMemo, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** The request a template turns into, from the template's own stored fields. */
function requestFrom(template) {
  return [
    `Build a ${template.industry ? `${template.industry} ` : ""}page using the “${template.name}” template.`,
    template.keywords ? `Target keywords: ${template.keywords}.` : "",
    template.funnel_type ? `The funnel is ${template.funnel_type.replace(/_/g, " ")}.` : "",
    template.url_pattern ? `The URL pattern is ${template.url_pattern}.` : "",
    template.notes || ""
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The template library: the layouts this system already holds, read from the
 * template records themselves. Using one loads a request built from that template
 * into the composer, which is where every build starts.
 */
export default function EditorTemplateMenu({ onUse }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || templates) return;
    (async () => {
      try {
        const page = await base44.entities.SEOTemplate.filter({ is_active: true }, { sort: "-created_date", limit: 60 });
        setTemplates(page.items || []);
      } catch {
        setError("The template library could not be read.");
        setTemplates([]);
      }
    })();
  }, [open, templates]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = templates || [];
    if (!term) return all;
    return all.filter((t) => `${t.name} ${t.industry} ${t.keywords}`.toLowerCase().includes(term));
  }, [templates, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="ve-pill" title="The layout templates this system holds">
          <Layers size={14} />
          <span className="ve-pill-label">TEMPLATES</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="ve-pop-panel">
        <div className="ve-pop-head">
          <span className="ve-pop-kicker">TEMPLATE LIBRARY</span>
        </div>

        <input
          className="ve-pop-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates by name, industry or keyword…"
          aria-label="Search templates"
        />

        <div className="ve-pop-list">
          {templates === null ? (
            <p className="ve-pop-note">
              <Loader2 size={11} className="animate-spin" /> Reading the library…
            </p>
          ) : error ? (
            <p className="ve-pop-error">{error}</p>
          ) : !visible.length ? (
            <p className="ve-pop-note">No template matched. Add layouts in the Template Engine module and they appear here.</p>
          ) : (
            visible.map((template) => (
              <div key={template.id} className="ve-pop-item">
                <span className="ve-pop-name">
                  {template.name}
                  <small>{[template.industry, template.keywords, template.funnel_type?.replace(/_/g, " ")].filter(Boolean).join(" · ")}</small>
                </span>
                <button
                  type="button"
                  className="ve-pop-action"
                  onClick={() => {
                    onUse(requestFrom(template));
                    setOpen(false);
                  }}
                  title="Load this template's request into the composer"
                >
                  USE
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}