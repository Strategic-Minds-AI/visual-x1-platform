import React from "react";
import { Copy, Note, Row, RowList, Section } from "../dashboardUi";

// The endpoints this editor actually calls, with the payload each one reads. These are
// the real function names and the real keys, taken from the editor's own code, so a call
// written from this page runs.
const ENDPOINTS = [
  {
    name: "autonomyChat",
    purpose: "The chat side of the editor: an agent that can read records and call the pipelines.",
    call: `await base44.functions.invoke("autonomyChat", {\n  message: "Add a pricing section to the artifact",\n  max_steps: 8,\n  history: [{ role: "user", content: "…" }]\n});`,
  },
  {
    name: "renderPreview",
    purpose: "Turns a request into a complete HTML document.",
    call: `const { data } = await base44.functions.invoke("renderPreview", {\n  prompt: "A landing page for a plumbing company in Miami",\n  context: "optional earlier step's output"\n});\n// data.html is the document`,
  },
  {
    name: "testArtifact",
    purpose: "Runs the measured probes and the test agent over a document.",
    call: `await base44.functions.invoke("testArtifact", {\n  html: "<!doctype html>…",\n  name: "Landing page",\n  project_id: "my-project"\n});`,
  },
  {
    name: "judgePageContent",
    purpose: "Scores the copy for SEO, GEO and AEO, with findings and fixes.",
    call: `await base44.functions.invoke("judgePageContent", {\n  content: "the page's visible words",\n  target_keyword: "emergency plumber miami"\n});`,
  },
  {
    name: "independentValidation",
    purpose: "A separate pass over the rendered document, scored and decided.",
    call: `await base44.functions.invoke("independentValidation", {\n  html: "<!doctype html>…",\n  brief: "what the page was asked to be"\n});`,
  },
  {
    name: "ingestClone",
    purpose: "Captures a source into this project: measured, specified, ready to render.",
    call: `await base44.functions.invoke("ingestClone", {\n  name: "Competitor home page",\n  source_type: "url",\n  url: "https://example.com"\n});`,
  },
  {
    name: "githubRepo",
    purpose: "The connected GitHub account: its repositories, and reading them.",
    call: `await base44.functions.invoke("githubRepo", { action: "list_repos" });\nawait base44.functions.invoke("githubRepo", { action: "status" });`,
  },
  {
    name: "vercelConsole",
    purpose: "The connected Vercel account: projects, deployments, domains and rollbacks.",
    call: `await base44.functions.invoke("vercelConsole", { action: "status" });\nawait base44.functions.invoke("vercelConsole", { action: "list_projects" });\nawait base44.functions.invoke("vercelConsole", { action: "domains", project_id: "prj_…" });\nawait base44.functions.invoke("vercelConsole", { action: "deploy", project_id: "prj_…", ref: "main" });\nawait base44.functions.invoke("vercelConsole", { action: "rollback", project_id: "prj_…" });`,
  },
  {
    name: "securityAudit",
    purpose: "The app-level access scan the Security panel runs.",
    call: `await base44.functions.invoke("securityAudit", {});`,
  },
  {
    name: "projectConsole",
    purpose: "The facts only the server can answer: connections, secret presence, and project mail.",
    call: `await base44.functions.invoke("projectConsole", { action: "status" });\nawait base44.functions.invoke("projectConsole", {\n  action: "send_email",\n  to_email: "an-app-user@company.com",\n  subject: "This week's build",\n  body: "The artifact is live."\n});`,
  },
];

/**
 * The editor's own API surface. Every snippet here is a real call with the real payload
 * keys, so it can be lifted straight into a client. The app's API keys, its OpenAPI
 * document and its SDK details are on the app dashboard, under API.
 */
export default function PanelApi({ ctx }) {
  const { projectName } = ctx;
  return (
    <Section
      title="API"
      note={`${projectName} · the endpoints behind this editor, with the payload each one reads.`}
      actions={<Copy text={ENDPOINTS.map((e) => `${e.name} — ${e.purpose}\n${e.call}`).join("\n\n")} label="COPY FOR LLM" />}
    >
      <RowList>
        {ENDPOINTS.map((e) => (
          <Row key={e.name} name={e.name} detail={e.purpose}>
            <Copy text={e.call} />
          </Row>
        ))}
      </RowList>

      <RowList>
        <Row name="App keys and API docs" detail="The app's own access tokens, its OpenAPI document and its SDK details are on the app dashboard, under API." />
        <Row name="MCP" detail="The same capabilities exposed to AI clients, described in the MCP section of this dashboard." />
      </RowList>

      <Note>
        Calls go through the app's own SDK, which carries the signed-in operator's permissions: a function that needs an
        admin, or a connection the operator has not authorized, answers with that rather than acting as someone else.
      </Note>
    </Section>
  );
}