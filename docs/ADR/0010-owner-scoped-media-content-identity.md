# ADR 0010: Owner-scoped media content identity

## Status

Accepted locally for Sprint 51C.

## Decision

New media identity is based on the tuple `(uploaded_by, kind, SHA-256(bytes))`,
not filename. The browser uploads to the owner's private draft prefix, then a
trusted Edge Function downloads that exact object, computes SHA-256, and calls
a service-only registration RPC. The RPC serializes equal owner/kind/hash
registrations and returns either a new stable UUID or the existing draft or
published UUID. Duplicate temporary objects are removed immediately.

The database stores the verified upload digest in `content_sha256`. Published
assets created before Sprint 51C can be matched through their existing trusted
`source_sha256`; their rows and historical references are not rewritten.

## Consequences

- Filename changes do not affect logical identity.
- Equal bytes owned by different teachers remain different assets.
- Media Library access and draft mutations are owner-scoped; administrators
  retain platform-wide access.
- Browser roles cannot directly insert `media_assets` or assert trusted hashes.
- Multiple content rows intentionally share one stable media UUID. Removing a
  reference never deletes the asset or its Storage object.
- Historical duplicates remain untouched. Future verified uploads converge on
  one canonical row, preferring an already-published asset when available.
