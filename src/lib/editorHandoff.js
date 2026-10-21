// Hands a finished artifact from the prompt system to the Visual Editor, which
// runs in its own route and tab. One key, read once: the editor takes what was
// staged and clears it, so a later reload never resurrects a stale artifact.
const KEY = "visual-x:editor-handoff";

// The read is cached for the lifetime of the page: React may call a state
// initialiser twice, and the second call must still see what the first consumed.
let cached = null;
let read = false;

export function stageEditorHandoff({ html, prompt, mode = "prompt", note = "" }) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ html: html || "", prompt: prompt || "", mode, note, at: Date.now() }));
  } catch {
    // a blocked session store only costs the handoff, never the work
  }
}

export function takeEditorHandoff() {
  if (read) return cached;
  read = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      window.sessionStorage.removeItem(KEY);
      cached = JSON.parse(raw);
    }
  } catch {
    cached = null;
  }
  return cached;
}