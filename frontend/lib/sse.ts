// Subscribe to the per-session agent event stream.

import { API_BASE } from "./api";
import type { AgentEvent } from "./types";

export function subscribeAgentStream(
  session: string,
  onEvent: (e: AgentEvent) => void,
  onError?: (e: Event) => void,
): () => void {
  const es = new EventSource(`${API_BASE}/stream/agent?session=${encodeURIComponent(session)}`);
  es.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data) as AgentEvent;
      // "end" is a sentinel — close before the browser auto-reconnects
      if ((event as { type: string }).type === "end") {
        es.close();
        return;
      }
      onEvent(event);
    } catch {
      /* ignore malformed frames */
    }
  };
  if (onError) es.onerror = onError;
  return () => es.close();
}
