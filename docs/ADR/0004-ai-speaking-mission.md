# ADR 0004: External AI Speaking Mission as a Distinct Activity

- **Status:** Accepted; hardened by Sprint 34
- **Date:** 2026-07-17

## Context

Learners benefit from conversational pronunciation practice, but native AI voice integration adds credentials, billing, audio privacy, provider coupling, and assessment-validity concerns. The challenge also has a richer structure than a single pronunciation item.

## Decision

Model `ai_speaking_mission` as a distinct lesson activity with structured mission configuration. Generate a deterministic plain-text prompt for ChatGPT or Gemini. Parse a stable human-readable result pasted back by the learner. Keep result confirmation local and make no native API call.

Sprint 34 makes activity identity part of the learner mission projection, requires dedicated atomic creation, validates the complete configuration at the database boundary, uses an optimistic-concurrency save RPC, and blocks publication when a mission row is missing or invalid.

## Consequences

- The product delivers useful AI-guided practice without storing audio or AI keys.
- Teachers author data, not opaque generated prompts.
- The workflow is transparent and provider-external.
- Result quality and scores are non-authoritative.
- Clipboard and parser UX become important.
- Mission publication and multi-editor integrity depend on migration 009 being applied through the normal reviewed deployment workflow.
- Result persistence remains intentionally deferred; see [AI Speaking Mission](../AI_SPEAKING_MISSION.md#known-limitations).

## Alternatives considered

- **Pronunciation subtype:** underrepresents the distinct workflow and future result model.
- **Native provider API:** better continuity but premature security, cost, and privacy obligations.
- **Store only prompt text:** difficult to validate, edit, localize, or evolve.
- **JSON result:** machine-friendly but less reliable for learner copy/inspection in the MVP.

## Future implications

A future journal can persist confirmed structured results after learner identity and consent exist. Native AI may later be added behind a provider abstraction, but must not silently change the meaning of historical format versions.
