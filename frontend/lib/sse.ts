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
      onEvent(JSON.parse(msg.data) as AgentEvent);
    } catch {
      /* ignore malformed frames */
    }
  };
  if (onError) es.onerror = onError;
  return () => es.close();
}
