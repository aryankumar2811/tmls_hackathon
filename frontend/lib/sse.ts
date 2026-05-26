// Tiny SSE client helper for subscribing to backend streams.
// TODO (Tue): error handling, reconnect, typed events per stream.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function subscribe<T>(
  path: string,
  onMessage: (data: T) => void,
): () => void {
  const es = new EventSource(`${API_BASE}${path}`);
  es.onmessage = (e) => onMessage(JSON.parse(e.data) as T);
  return () => es.close();
}
