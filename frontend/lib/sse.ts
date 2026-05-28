// Minimal typed SSE subscription helper.

import { API_BASE } from "./api";

export function subscribe<T>(
  path: string,
  onMessage: (data: T) => void,
  onError?: (e: Event) => void,
): () => void {
  const es = new EventSource(`${API_BASE}${path}`);
  es.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data) as T);
    } catch {
      /* ignore malformed frames */
    }
  };
  if (onError) es.onerror = onError;
  return () => es.close();
}

/** Open the three per-session streams; returns a single teardown function. */
export function subscribeSession(
  session: string,
  handlers: {
    onSensor: (e: unknown) => void;
    onCV: (e: unknown) => void;
    onAgent: (e: unknown) => void;
  },
): () => void {
  const closers = [
    subscribe(`/stream/sensors?session=${session}`, handlers.onSensor),
    subscribe(`/stream/cv?session=${session}`, handlers.onCV),
    subscribe(`/stream/agent?session=${session}`, handlers.onAgent),
  ];
  return () => closers.forEach((c) => c());
}
