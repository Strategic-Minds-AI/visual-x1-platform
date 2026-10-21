import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const component=readFileSync('src/components/visualeditor/SandboxOpsDrawer.jsx','utf8');
const workspace=readFileSync('src/components/visualeditor/VisualEditorWorkspace.jsx','utf8');
const style=readFileSync('src/styles/x1-sandbox-ops.css','utf8');
const bridge=readFileSync('base44/functions/x1Bridge/entry.ts','utf8');
test('sandbox wired into existing editor, not a second app',()=>{
 assert.match(workspace, /SandboxOpsDrawer/);
 assert.match(workspace, /x1-ops-launch/);
 assert.match(component,/base44\.functions\.invoke\("x1Bridge"/);
 assert.match(component,/role="dialog"/);
 assert.match(component,/onClose/);
 assert.match(style,/@media\(max-width:780px\)/);
});
test('status classifications cannot imply independent QA',()=>{
 assert.match(component,/Transport only/);
 assert.match(component,/independent Guardian validation/);
 assert.match(component,/Awaiting task-specific receipt/);
 assert.match(component,/not an end-to-end QA receipt|not established/i);
});
test('bridge is fixed endpoint and admin-only, with server-side secret',()=>{
 assert.match(bridge,/user\.role !== 'admin'/);
 assert.match(bridge,/Deno\.env\.get\('X1_VISUALX_READ_TOKEN'\)/);
 assert.doesNotMatch(bridge,/payload\.url|payload\.origin/);
 assert.ok(!component.includes('11434/api'));
});
