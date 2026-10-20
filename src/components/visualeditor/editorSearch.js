import { SUGGESTIONS } from "@/components/visualeditor/editorNav";

/**
 * The bottom bar's search recommends as the operator types, the way a browser's
 * address bar does: matching requests the editor can build, the open project tabs
 * it can jump to, the agent it can hand the words to, and the web it can look the
 * words up on. Everything is matched locally, so a recommendation appears on the
 * keystroke rather than after a round trip.
 */
export function recommend(query, tabs = []) {
  const text = query.trim();
  const needle = text.toLowerCase();
  if (needle.length < 2) return [];

  const results = [];

  SUGGESTIONS.filter((suggestion) => suggestion.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((suggestion) => {
      results.push({
        id: `build:${suggestion}`,
        kind: "build",
        value: suggestion,
        label: `Build “${suggestion}”`,
        hint: "canvas",
      });
    });

  tabs
    .filter((tab) => tab.title.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((tab) => {
      results.push({
        id: `tab:${tab.id}`,
        kind: "tab",
        value: tab.id,
        label: `Go to “${tab.title}”`,
        hint: "tab",
      });
    });

  results.push({
    id: "ask",
    kind: "ask",
    value: text,
    label: `Ask the editor agent: “${text}”`,
    hint: "agent",
  });

  results.push({
    id: "web",
    kind: "web",
    value: text,
    label: `Search the web for “${text}”`,
    hint: "new tab",
  });

  return results.slice(0, 7);
}