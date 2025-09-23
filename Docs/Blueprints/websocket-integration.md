# WebSocket Integration Blueprint

## 1. Overview
The WebSocket router (`src/api/websocket-router.ts`) delivers real-time graph and file system events to connected clients, integrating with Redis pub-sub for ephemeral session handoffs (e.g., multi-agent notifications). Integration coverage now exercises connection concurrency, subscription state introspection, and broadcast fan-out across multiple clients. To keep the channel useful for IDEs and background agents we need to tighten the protocol contract and address replay semantics surfaced while hardening the tests.

## 2. Current Gaps
- **Replay ambiguity**: `handleSubscription` immediately replays the last cached event per type. The replay uses the exact same envelope as live updates (no `isReplay`, sequence, or timestamp delta), so consumers cannot distinguish historical payloads from fresh broadcasts. In the new broadcast test this surfaced as stale `entity_created` events being treated as the target notification.
- **Inconsistent envelopes**: Subscription acknowledgements populate both a top-level `event` field (via `@ts-ignore`) and `data.event`. Other messages (errors, list responses) embed payloads under `data` without top-level mirroring. Client implementations must special-case each message type.
- **No general broadcast surface**: The router now exposes `broadcastCustomEvent` for arbitrary fan-out, but we still need to document the API, harden authentication, and wire it through higher-level services so callers don’t have to reach into the router directly.
- **Health routes only expose counts**: `/ws/health` reports counts but not subscription metadata (filters, replay timestamps). Troubleshooting noisy subscriptions or replay storms still requires manual instrumentation.
- **Limited subscription introspection**: Filters are now normalized and stored per subscription so the router can enforce path/type semantics, but we still lack an operator view of the active filters. Neither `/ws/health` nor any admin endpoint surfaces which paths/extensions are hot, making it hard to reason about noisy clients.

## 3. Proposed Enhancements
1. Add a stable envelope that includes a monotonic `sequenceId`, original `emittedAt`, and an `isReplay` flag. Allow subscribers to opt out of warm replays when they intend to handle only future events. Integrate Redis pub-sub for session events (e.g., multi-agent handoffs: subscribe to `session:{id}` for real-time changes).
2. Normalize message schemas so every response contains `{ type, id?, data }` and avoid sprinkling top-level protocol extensions. Provide TypeScript types for the wire contract and export them for client SDKs.
3. Introduce a server-side broadcast API (e.g., `broadcastCustomEvent` exposed through the gateway or a privileged websocket message) that forwards arbitrary event types. Gate it behind authentication/role checks. Use for session pub-sub (e.g., 'modified cluster' notifications).
4. Extend `/ws/health` (or a new `/ws/subscriptions`) to list active subscriptions with event type, filter, and last activity/replay metadata. Now that filters are normalized server-side we can safely expose aggregates (e.g., watched directories, change-type counts) to audit replay pressure and diagnose stuck clients.

## 4. Open Questions
- Should replay behaviour vary per event type (e.g., graph changes replay, file changes skip)?
- Do we need per-connection backpressure metrics to defend against slow clients before exposing general broadcasts?
- What authentication model should govern custom broadcast access (API key scopes vs. internal service tokens)?
