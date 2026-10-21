import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { Panel } from "@/components/admin/adminUi";

// The palette. Everything here is draggable onto the canvas, and everything here is
// a step the runner actually implements — presets are invoke_function steps with a
// real backend function already chosen, which is how social, funnels and task work
// are linked into one automation.
export default function StepLibrary({ entries }) {
  const groups = entries.reduce((acc, entry) => {
    acc[entry.group] = acc[entry.group] || [];
    acc[entry.group].push(entry);
    return acc;
  }, {});

  return (
    <Panel kicker="STEP LIBRARY" title="Drag a step into the flow">
      <Droppable droppableId="library" isDropDisabled>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {Object.entries(groups).map(([group, rows]) => (
              <div key={group} style={{ marginBottom: 14 }}>
                <p className="cp-fine">{group.toUpperCase()}</p>
                {rows.map((entry, index) => (
                  <Draggable key={entry.id} draggableId={entry.id} index={index}>
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className="cp-admin-inline-field"
                        style={{
                          ...drag.draggableProps.style,
                          alignItems: "center",
                          padding: "6px 0",
                          borderTop: "1px solid hsl(var(--border) / 0.4)",
                          cursor: "grab",
                        }}
                      >
                        <GripVertical size={13} className="text-muted-foreground" />
                        <span style={{ flex: 1, fontSize: 13 }}>{entry.label}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </Panel>
  );
}