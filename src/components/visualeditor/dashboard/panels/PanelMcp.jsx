import React from "react";
import { Copy, Note, Row, RowList, Section } from "../dashboardUi";

// The app's MCP server, as its own configuration declares it: OAuth access, and the
// custom tools the configuration names. The endpoint is resolved from the address this
// editor is being used on, never written down by hand.
const TOOLS = [
  { name: "sync_google_tasks", detail: "Two-way sync between the app's todos and the connected Google Tasks account." },
  { name: "orchestrate_agents", detail: "Assigns open jobs on the job board to available agents." },
  { name: "chat_with_agent", detail: "Sends a message to a named agent and returns its answer." },
  { name: "qa_feedback_loop", detail: "Turns audit findings into prompt refinements for the next run." },
  { name: "score_benchmark", detail: "Scores a project against a benchmark on the 100-point scorecard." },
  { name: "trigger_post_deployment_qa", detail: "Runs the post-deployment checks after a release goes live." },
];

const CLIENTS = [
  { name: "Claude", path: "Profile → Settings → Connectors → Add custom connector, paste the address, Add." },
  { name: "ChatGPT", path: "Apps → enable Developer mode → Create app, paste the address, Create, then enable it in the composer." },
  { name: "Cursor", path: "Customize → MCPs → New MCP Server, add an entry whose url is this address, then toggle it on." },
  { name: "Custom", path: "Add it as a streamable HTTP MCP server; a name and the address are all most clients need." },
];

/** Pointing an AI client at this app, and what it may then do. */
export default function PanelMcp() {
  const endpoint = typeof window === "undefined" ? "/api/mcp" : new URL("/api/mcp", window.location.origin).toString();

  return (
    <Section
      title="MCP"
      note="This app's own MCP server, which lets an AI client read its data and call its tools as the signed-in user."
      actions={<Copy text={endpoint} label="COPY ADDRESS" />}
    >
      <RowList>
        <Row name="Server address" detail={endpoint} meta="resolved from this app's own address" />
        <Row name="Access" detail="Sign in required · OAuth. The client opens this app's consent page, the person signs in and approves, and the client then acts only as them." meta="oauth" />
        <Row name="Entities and agents" detail="Every collection and agent this app has is exposed automatically, unless it is switched off on the app dashboard's MCP page." meta="exposure is opt-out" />
      </RowList>

      <RowList>
        {TOOLS.map((t) => (
          <Row key={t.name} name={t.name} detail={t.detail} meta="custom tool" />
        ))}
      </RowList>

      <RowList>
        {CLIENTS.map((c) => (
          <Row key={c.name} name={c.name} detail={c.path} meta="how to connect" />
        ))}
      </RowList>

      <Note>
        The server answers on the published app: publish or republish to make a change live. Adding an entity or an agent
        widens the surface, and each connected client then has to authorize again — the app dashboard's MCP page shows the
        address ready to copy and lets individual tools be switched off.
      </Note>
    </Section>
  );
}