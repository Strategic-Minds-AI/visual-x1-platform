import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { recommend } from "@/components/visualeditor/editorSearch";

/**
 * The bottom bar's search, working as a browser's does: type a word and the
 * recommendations appear over the bar, arrow keys move through them and Enter runs
 * the highlighted one. A request builds on the canvas, a project name jumps to its
 * tab, the agent takes the words into the composer, and the web opens in a new tab.
 */
export default function EditorSearch({ tabs, onBuild, onAsk, onSelectTab }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef(null);
  const results = recommend(query, tabs);

  useEffect(() => {
    const close = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const run = (item) => {
    if (!item) return;
    setOpen(false);
    setQuery("");
    setCursor(0);
    if (item.kind === "build") onBuild(item.value);
    else if (item.kind === "tab") onSelectTab(item.value);
    else if (item.kind === "ask") onAsk(item.value);
    else window.open(`https://www.google.com/search?q=${encodeURIComponent(item.value)}`, "_blank", "noopener");
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setCursor((c) => (c + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => (c - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[cursor]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showing = open && results.length > 0;

  return (
    <div className="ve-search" ref={boxRef}>
      <Search size={14} aria-hidden="true" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Type a word — it recommends what to build, where to go and what to look up…"
        aria-label="Search the editor and the web"
        role="combobox"
        aria-expanded={showing}
        aria-controls="ve-search-results"
        aria-autocomplete="list"
        aria-activedescendant={showing ? `ve-search-option-${cursor}` : undefined}
      />

      {showing && (
        <ul className="ve-search-list" id="ve-search-results" role="listbox">
          {results.map((item, i) => (
            <li
              key={item.id}
              id={`ve-search-option-${i}`}
              role="option"
              aria-selected={i === cursor}
              className={i === cursor ? "selected" : ""}
              onMouseEnter={() => setCursor(i)}
              onClick={() => run(item)}
            >
              <span>{item.label}</span>
              <em>{item.hint}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}