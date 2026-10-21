import React, { useState } from "react";
import { Check, CornerDownRight, Plus } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, StatusPill, Empty, ErrorText } from "@/components/admin/adminUi";
import { LOOP_BLUEPRINT, LOOP_LAYERS } from "@/data/loopBlueprint";
import { sendChatCommand, commandForItem } from "@/lib/chatBus";

// The living checklist. Every item is a piece of the loop; the operator moves it
// along, records the evidence that proves it, and can hand the item's own command
// straight to the chat agent — which is what makes this a page the agent works from
// rather than a diagram.
const STATUSES = ["planned", "building", "live", "verified", "blocked"];

export default function ArchitectureChecklist({ items, onSeed, onUpdate, error }) {
  const [openLayer, setOpenLayer] = useState("observation");
  const [draft, setDraft] = useState({});

  const byLayer = (layer) => items.filter((i) => i.layer === layer);
  const missing = LOOP_BLUEPRINT.length - items.length;

  return (
    <Panel
      kicker="LIVING CHECKLIST"
      title="The loop, item by item"
      aside={
        <div className="cp-admin-actions">
          {missing > 0 && (
            <PrimaryButton onClick={onSeed}>
              <Plus size={13} /> SEED {missing} ITEM{missing === 1 ? "" : "S"}
            </PrimaryButton>
          )}
          <span className="cp-fine">
            {items.filter((i) => i.status === "live" || i.status === "verified").length}/{LOOP_BLUEPRINT.length} live
          </span>
        </div>
      }
    >
      {items.length === 0 && (
        <Empty>
          Nothing checked in yet. Seed the list to lay the {LOOP_BLUEPRINT.length}-item foundation down, then work it
          one item at a time — or command the agent to implement any of them.
        </Empty>
      )}

      <ErrorText>{error}</ErrorText>

      <div className="cp-admin-stack">
        {LOOP_LAYERS.map((layer) => {
          const rows = byLayer(layer.id);
          const live = rows.filter((r) => ["live", "verified"].includes(r.status)).length;
          const open = openLayer === layer.id;
          return (
            <div key={layer.id} className="cp-admin-inline-field" style={{ alignItems: "flex-start" }}>
              <button
                type="button"
                className="cp-text-link"
                onClick={() => setOpenLayer(open ? "" : layer.id)}
                style={{ minWidth: 190, textAlign: "left" }}
              >
                {layer.label.toUpperCase()} · {live}/{rows.length || LOOP_BLUEPRINT.filter((b) => b.layer === layer.id).length}
                <CornerDownRight size={12} />
              </button>
              <div style={{ flex: 1 }}>
                <p className="cp-fine">{layer.hint}</p>

                {open &&
                  (rows.length ? rows : LOOP_BLUEPRINT.filter((b) => b.layer === layer.id)).map((item) => (
                    <div key={item.key} style={{ borderTop: "1px solid hsl(var(--border) / 0.5)", paddingTop: 10, marginTop: 10 }}>
                      <div className="cp-admin-inline-field">
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0 }}>
                            {item.title}{" "}
                            {item.status === "verified" && <Check size={12} className="inline text-primary" />}
                          </h3>
                          <p className="cp-fine">{item.requirement}</p>
                          <p className="cp-fine">
                            Prompt block · {item.prompt_block}
                            {item.owner_agent ? ` · owned by ${item.owner_agent}` : ""}
                          </p>
                        </div>
                        <div className="cp-admin-row-buttons">
                          <StatusPill>{rows.length ? item.status : "not seeded"}</StatusPill>
                          {!rows.length && <span className="cp-fine">seed first</span>}
                        </div>
                      </div>

                      {rows.length > 0 && (
                        <div className="cp-admin-inline-field" style={{ marginTop: 8 }}>
                          <select
                            className="cp-field"
                            value={item.status}
                            onChange={(e) => onUpdate(item, { status: e.target.value })}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <input
                            className="cp-field"
                            style={{ flex: 1 }}
                            placeholder="Evidence that proves it works…"
                            value={draft[item.id] ?? item.evidence ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                          />
                          <div className="cp-admin-row-buttons">
                            <OutlineButton
                              onClick={() => {
                                onUpdate(item, {
                                  evidence: draft[item.id] ?? item.evidence ?? "",
                                  ...(item.status === "planned" || item.status === "building"
                                    ? { status: "live", verified_at: new Date().toISOString() }
                                    : {}),
                                });
                              }}
                            >
                              SAVE EVIDENCE
                            </OutlineButton>
                            <OutlineButton
                              onClick={() => {
                                onUpdate(item, { last_command_at: new Date().toISOString() });
                                sendChatCommand(commandForItem(item));
                              }}
                            >
                              COMMAND AGENT
                            </OutlineButton>
                          </div>
                        </div>
                      )}

                      {item.last_command_at && (
                        <p className="cp-fine">Last commanded from here: {new Date(item.last_command_at).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}