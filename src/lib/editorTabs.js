/**
 * The editor's tab store: one tab per visual project.
 *
 * Each tab carries the page it was left on — the thread, the artifact, the canvas
 * view and the device — so selecting a tab brings that page back instead of
 * starting over. The tabs are kept in localStorage so a reload returns to the work
 * in progress.
 */
const KEY = "x1.editor.tabs.v1";

export const DEFAULT_TITLE = "New project";

export function makeTab(title = DEFAULT_TITLE) {
  return {
    id: `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    snapshot: null,
  };
}

export function loadTabs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.tabs)) return null;
    const tabs = parsed.tabs.filter((tab) => tab && typeof tab.id === "string");
    if (tabs.length === 0) return null;
    const activeId = tabs.some((tab) => tab.id === parsed.activeId) ? parsed.activeId : tabs[0].id;
    return { tabs, activeId };
  } catch {
    return null;
  }
}

export function saveTabs(tabs, activeId) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ tabs, activeId }));
  } catch {
    // A store that has filled up (a very large artifact) must never stop the
    // editor working; the tabs simply stop surviving a reload.
  }
}