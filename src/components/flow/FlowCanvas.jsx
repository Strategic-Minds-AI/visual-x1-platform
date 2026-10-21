import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Trash2 } from "lucide-react";
import { Empty } from "@/components/admin/adminUi";
import { stepTypeById } from "@/data/flowCatalog";

// The flow itself, in order. Steps run top to bottom exactly as they are drawn, so
// order on this canvas is order of execution.
export default function FlowCanvas({ steps, selectedId, onSelect, onRemove }) {
  return (
    <Droppable droppableId="canvas">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{ minHeight: 140, border: "1px dashed hsl(var(--border))", borderRadius: 14, padding: 10 }}
        >
          {steps.length === 0 && (
            <Empty>Drag a step in from the library. The first step runs first, and the log follows this order.</Empty>
          )}

          {steps.map((step, index) => {
            const spec = stepTypeById(step.type);
            return (
              <Draggable key={step.id} draggableId={step.id} index={index}>
                {(drag) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    onClick={() => onSelect(step.id)}
                    className={`cp-admin-inline-field ${selectedId === step.id ? "x1-active-glow" : ""}`}
                    style={{
                      ...drag.draggableProps.style,
                      alignItems: "center",
                      padding: "8px 10px",
                      marginBottom: 6,
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border) / 0.7)",
                      cursor: "pointer",
                    }}
                  >
                    <span {...drag.dragHandleProps} style={{ cursor: "grab" }}>
                      <GripVertical size={13} className="text-muted-foreground" />
                    </span>
                    <span className="cp-fine" style={{ minWidth: 18 }}>{index + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13 }}>{step.label || spec?.label || step.type}</span>
                      <p className="cp-fine">{step.config?.function_name || step.type} · on failure: {step.on_fail || "stop"}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove step"
                      className="cp-text-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(step.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}