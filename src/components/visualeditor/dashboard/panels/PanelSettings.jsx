import React from "react";
import { Action, MetricGrid, Note, Row, RowList, Section } from "../dashboardUi";

const DEVICES = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Phone" },
];

/**
 * How the editor behaves for this project. These are real switches, not decorations:
 * the device is applied to the canvas the moment it is changed, and the check runs on
 * every new artifact when it is on. They are kept in this browser, per project, so a
 * second tab on another project is unaffected.
 */
export default function PanelSettings({ ctx }) {
  const { projectName, engine, settings, tabs, setDevice } = ctx;
  const { settings: current, loaded, save, reset } = settings;

  // The device is the canvas's own: choosing one here moves the preview immediately,
  // and the choice is remembered for this project.
  const chooseDevice = (device) => {
    save({ device });
    setDevice?.(device);
  };

  return (
    <Section
      title="Settings"
      note={`${projectName} · how this editor behaves for this project, on this machine.`}
      actions={<Action label="RESET TO DEFAULTS" onClick={reset} />}
    >
      <div className="ve-fields">
        <label className="ve-field">
          <span>Device the canvas opens in</span>
          <select value={current.device} onChange={(e) => chooseDevice(e.target.value)}>
            {DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ve-check">
          <input type="checkbox" checked={Boolean(current.autoVerify)} onChange={(e) => save({ autoVerify: e.target.checked })} />
          <span>Run the test agent after every new artifact reaches the canvas</span>
        </label>
      </div>

      <MetricGrid
        items={[
          { label: "PROJECT", value: projectName, note: "the name every record here carries" },
          { label: "ARTIFACT", value: engine.previewHtml ? engine.previewHtml.length.toLocaleString() : "—", note: "characters on the canvas" },
          { label: "OPEN TABS", value: (tabs || []).length || 1, note: "projects open in this editor" },
          { label: "SETTINGS", value: loaded ? "loaded" : "…", note: "stored in this browser" },
        ]}
      />

      <RowList>
        <Row name="Where these live" detail="In this browser, under this project's name. Clearing them changes nothing about the artifact or the records." />
        <Row name="The app's own settings" detail="Visibility, domains, users and security headers are app-wide and live on the app dashboard." />
      </RowList>

      <Note>
        The device applies immediately to the preview beside this panel. The check after each build runs the same test
        agent as the toolbar's TEST button, and records its result the same way.
      </Note>
    </Section>
  );
}