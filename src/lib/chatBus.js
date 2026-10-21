// A very small bus so the architecture checklist can hand a command to the chat
// dock — the checklist does not know where the dock is, and the dock does not know
// what the checklist is. One subscribe, one dispatch.
const listeners = new Set();

export function onChatCommand(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function sendChatCommand(command) {
  listeners.forEach((handler) => {
    try {
      handler(command);
    } catch {
      /* a broken listener must not stop the others */
    }
  });
}

export const commandForItem = (item) => ({
  prompt: item.command_prompt || `Implement the architecture item "${item.title}": ${item.requirement}`,
  autoSend: true,
  source: item.key,
  label: item.title,
});