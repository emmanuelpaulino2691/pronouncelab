# ADR 0003: Use RPCs for Atomic and Lifecycle-Sensitive Writes

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

Browser clients cannot make several independent PostgREST requests atomic. Activity creation may require subtype rows, reorder touches many positions, quiz saves replace options, and publication must validate a hierarchy after acquiring a transaction gate.

## Decision

Use narrow Postgres RPCs for compound creation, exact-order reordering, duplication, quiz compound writes, draft-version creation, and publication. Keep simple one-row draft metadata updates as parent-scoped RLS writes with exact-row confirmation.

Security-definer RPCs use `search_path = ''`, qualified objects, internal authorization, deterministic lock ordering, and narrow execution grants.

## Consequences

- Multi-row operations commit or roll back together.
- Database invariants do not depend on browser timing.
- Reorder avoids transient duplicate positions.
- RPC signatures become application contracts and require coordinated grants/types/callers.
- SQL execution testing is important; a static dry run is insufficient.

## Alternatives considered

- **Multiple browser updates:** partial failure and concurrency hazards.
- **Service-role browser credentials:** unacceptable privilege exposure.
- **Backend API for every write:** possible later, but unnecessary for current Supabase architecture.

## Future implications

Complex new authoring actions should start by asking whether they are one atomic domain operation. If so, extend the RPC layer without creating broad bypasses. Native backend services may call the same database contracts.
