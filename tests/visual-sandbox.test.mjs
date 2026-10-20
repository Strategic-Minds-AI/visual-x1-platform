import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/visualeditor/EditorCanvas.jsx", import.meta.url), "utf8");
const frames = [...source.matchAll(/<iframe\b[\s\S]*?\/>/g)].map((match) => match[0]);

test("every visual preview iframe retains strict opaque-origin sandbox", () => {
  assert.equal(frames.length, 2, "inline and expanded frames must both be checked");
  for (const frame of frames) {
    assert.match(frame, /sandbox="allow-scripts"/);
    assert.match(frame, /srcDoc=\{previewHtml\}/);
    assert.match(frame, /referrerPolicy="no-referrer"/);
    assert.doesNotMatch(frame, /allow-same-origin|allow-popups|allow-top-navigation|allow-forms/);
  }
});

test("expanded preview never opens untrusted HTML in a same-origin Blob tab", () => {
  assert.doesNotMatch(source, /URL\.createObjectURL|window\.open|document\.write|dangerouslySetInnerHTML/);
  assert.match(source, /<dialog\b/);
  assert.match(source, /dialog\.showModal\(\)/);
  assert.match(source, /onClose=\{\(\) => setExpanded\(false\)\}/);
  assert.match(source, /disabled=\{!previewHtml\}/);
});

test("expanded preview cannot inherit live credentials from X1 bridge", () => {
  assert.doesNotMatch(source, /X1_VISUALX_READ_TOKEN|SUPABASE_SERVICE_ROLE_KEY|localStorage|sessionStorage/);
});
