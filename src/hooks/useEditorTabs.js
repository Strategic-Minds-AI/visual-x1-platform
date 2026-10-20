import { useCallback, useEffect, useState } from "react";
import { DEFAULT_TITLE, loadTabs, makeTab, saveTabs } from "@/lib/editorTabs";

const fresh = () => {
  const tab = makeTab();
  return { tabs: [tab], activeId: tab.id };
};

/**
 * The editor's browser-like tabs. The active tab is the page on screen; every
 * other tab holds the page it was left on, so selecting one pulls that page back
 * and a new tab starts another project beside it.
 */
export default function useEditorTabs() {
  const [state, setState] = useState(() => loadTabs() || fresh());
  const active = state.tabs.find((tab) => tab.id === state.activeId) || state.tabs[0];

  // Stored shortly after the last change rather than on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => saveTabs(state.tabs, state.activeId), 300);
    return () => clearTimeout(timer);
  }, [state]);

  const saveSnapshot = useCallback((snapshot) => {
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((tab) => (tab.id === s.activeId ? { ...tab, snapshot } : tab)),
    }));
  }, []);

  // A tab names itself from the first thing the operator asks it to do, the way a
  // browser tab takes the page's title. A tab already named by its operator keeps it.
  const nameTab = useCallback((title) => {
    const name = String(title || "").replace(/\s+/g, " ").trim().slice(0, 34);
    if (!name) return;
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((tab) =>
        tab.id === s.activeId && tab.title === DEFAULT_TITLE ? { ...tab, title: name } : tab
      ),
    }));
  }, []);

  const openTab = useCallback(() => {
    setState((s) => {
      const tab = makeTab();
      return { tabs: [...s.tabs, tab], activeId: tab.id };
    });
  }, []);

  const closeTab = useCallback((id) => {
    setState((s) => {
      const rest = s.tabs.filter((tab) => tab.id !== id);
      // Closing the last tab leaves a fresh one, as a browser does.
      if (rest.length === 0) {
        const tab = makeTab();
        return { tabs: [tab], activeId: tab.id };
      }
      const index = s.tabs.findIndex((tab) => tab.id === id);
      const activeId = s.activeId === id ? rest[Math.min(index, rest.length - 1)].id : s.activeId;
      return { tabs: rest, activeId };
    });
  }, []);

  const selectTab = useCallback((id) => setState((s) => ({ ...s, activeId: id })), []);

  return { tabs: state.tabs, active, openTab, closeTab, selectTab, nameTab, saveSnapshot };
}