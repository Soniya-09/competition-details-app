let offsetMs = 0;

export function syncServerClock(serverTimeIso, requestStartedAt, responseReceivedAt) {
  const serverMs = Date.parse(serverTimeIso);
  if (Number.isNaN(serverMs)) return;
  const midpoint = (requestStartedAt + responseReceivedAt) / 2; // compensate for latency
  offsetMs = serverMs - midpoint;
}

export const serverNow = () => Date.now() + offsetMs;
