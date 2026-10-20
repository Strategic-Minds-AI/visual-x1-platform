import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useEditorTabs from "@/hooks/useEditorTabs";
import EditorTabStrip from "@/components/visualeditor/EditorTabStrip";
import EditorPane from "@/components/visualeditor/EditorPane";
import { DEFAULT_TITLE } from "@/lib/editorTabs";
import "@/styles/x1-visual-editor.css";

/**
 * The Visual Editor, as a section of the operator console: a browser-style strip of
 * tabs over the builder's own layout — one header bar, then the rail, the composer
 * column and a full-bleed artifact canvas, with a single pane and bottom tabs on a
 * handset.
 *
 * Each tab is a page of this editor, connected to it the way a browser's tabs are
 * connected to the pages they hold: selecting a tab pulls up the page that tab was
 * left on, and a new tab opens a second visual project beside the first without
 * disturbing it. The pane is keyed on the tab id, so it mounts with that tab's own
 * state and writes every change back into the tab. Behind it all is this app's own
 * backend — the autonomy agent for conversation, the render pipeline for builds, the
 * prompt system's convert/simulate/chain — and the prompt system is the composer
 * column's second mode, so a module and the canvas it produces share one workspace.
 */
export default function VisualEditorWorkspace({ rail, railOpen = false }) {
  const tabs = useEditorTabs();

  // The live project names a tab the operator has not named by working in it yet;
  // every tab after that carries its own name, so two projects never share one.
  const [liveProject, setLiveProject] = useState(DEFAULT_TITLE);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Project.list({ sort: "-created_date", limit: 1 });
        const record = (res.items || [])[0];
        if (record) setLiveProject(record.title || record.name || DEFAULT_TITLE);
      } catch {
        // the editor works without a project record
      }
    })();
  }, []);

  const projectName = tabs.active.title === DEFAULT_TITLE ? liveProject : tabs.active.title;

  return (
    <div className="ve-section">
      <section className="cp-portal-panel ve-shell">
        <EditorTabStrip
          tabs={tabs.tabs}
          activeId={tabs.active.id}
          onSelect={tabs.selectTab}
          onClose={tabs.closeTab}
        />

        <EditorPane
          key={tabs.active.id}
          initial={tabs.active.snapshot}
          onSnapshot={tabs.saveSnapshot}
          onName={tabs.nameTab}
          projectName={projectName}
          tabs={tabs.tabs}
          onSelectTab={tabs.selectTab}
          onNewProject={tabs.openTab}
          rail={rail}
          railOpen={railOpen}
        />
      </section>
    </div>
  );
}