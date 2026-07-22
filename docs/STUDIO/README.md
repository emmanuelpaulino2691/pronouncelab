# Studio Handbook

## Version

1.0

## Status

Foundational guidance for the PronounceLab Studio Handbook.

## Last Updated

July 22, 2026

## Purpose

The Studio Handbook provides a shared reference for the product and editorial decisions that guide PronounceLab content creation. It gives contributors a consistent basis for discussing quality, resolving questions, and recording decisions related to the Studio.

This handbook defines why the guidance exists and how it should be maintained. It does not describe the technical operation of the Content Studio.

## Scope

The handbook covers principles, standards, and decision guidance for work carried out through the PronounceLab Studio. It may address curriculum intent, editorial quality, learner clarity, authoring consistency, review expectations, and product judgment.

Technical architecture, database behavior, security controls, development workflow, and implemented product behavior remain in the canonical project documentation.

## Goal

The goal is to help contributors make coherent decisions that support PronounceLab's promise: **Improve your English every day.** The handbook should reduce ambiguity without replacing professional judgment or creating unsupported product claims.

## Design Philosophy

The Studio Handbook favors guidance that is clear, practical, adult-friendly, and grounded in the learning experience. It supports structured daily practice, truthful feedback, and deliberate teaching sequences. Guidance should remain concise enough to use during real authoring and review work.

The handbook distinguishes established decisions from proposals. It does not present future ideas as implemented behavior.

## Handbook Principles

- Put learner understanding and useful speaking practice first.
- Preserve PronounceLab's teaching philosophy and professional tone.
- Prefer explicit, reusable guidance over informal convention.
- Keep claims accurate and proportionate to the product's current capabilities.
- Respect accessibility, inclusion, and the needs of adult English learners.
- Record important decisions with their context and rationale.
- Link to canonical project documentation instead of duplicating it.

## Relationship with the Project Documentation

The Studio Handbook complements the technical and product knowledge base under `docs/`. It does not replace or override canonical documentation.

- [Project Context](../PROJECT_CONTEXT.md) defines the vision, audience, scope, and current product boundary.
- [Product](../PRODUCT.md) describes the implemented product model and user journeys.
- [Architecture](../ARCHITECTURE.md) describes the application structure and system boundaries.
- [Database](../DATABASE.md) defines the content model, security boundaries, and lifecycle invariants.
- [Lesson System](../LESSON_SYSTEM.md) documents lesson and activity behavior.
- [Design System](../DESIGN_SYSTEM.md) defines interface principles and established UI conventions.

If handbook guidance conflicts with an implemented contract or canonical technical document, contributors should resolve the conflict before relying on the guidance.

## Handbook Structure

This file is the entry point and charter for the Studio Handbook. Additional handbook documents should each cover one clearly named area, state their purpose, and link to the relevant canonical documentation.

The structure should grow only when a durable need exists. New pages should avoid repeating guidance that already has an authoritative home elsewhere in the repository.

## Decision Process

Studio decisions should begin with the learner problem, the teaching objective, and the current product boundary. Contributors should review relevant handbook guidance and canonical documentation, identify constraints, and choose the smallest decision that produces a clear and consistent outcome.

Decisions with lasting product, editorial, or architectural consequences should be documented in the appropriate canonical location. Important architectural decisions belong in an ADR. Unresolved or proposed work should be labelled **Future** or **Not implemented**.

## Product Decisions

The handbook may explain product decisions that shape authoring standards and content quality. It should describe the intent and reasoning behind those decisions without inventing implementation details or redefining system behavior.

The current separation between static learner content and Supabase-authored Studio content must remain explicit. Handbook guidance must not imply that a Studio edit changes learner lessons unless the canonical project documentation confirms that behavior.

## Audience

The primary audience is anyone who creates, reviews, approves, designs, or maintains PronounceLab content through the Studio. This includes educators, editors, publishers, product contributors, designers, developers, and AI assistants working in the repository.

Readers are expected to use the handbook alongside the canonical project documentation relevant to their work.

## Living Document

The Studio Handbook is a living document. It should evolve when PronounceLab's validated practices, product boundaries, or decision needs change. Updates should remain reviewable, concise, and consistent with implemented behavior.

Outdated guidance should be corrected or clearly superseded. Changes that affect documented contracts should update the relevant canonical documentation in the same change.

## License

This handbook is part of the PronounceLab repository and is subject to the same ownership and licensing terms as the project. It does not grant a separate license.