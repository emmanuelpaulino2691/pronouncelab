# ADR 0008: Teacher-Owned Classes and Explicit Enrollment

## Status

Accepted and implemented by Sprint 52B.

## Context

A teacher-managed Class is a group of students receiving reusable Course content. Ownership, membership, and publication authority must remain separate concepts.

## Decision

Classes are owned by one teacher and may later support explicit collaborators. Students join through cryptographically random, regenerable join codes. Membership is many-to-many, idempotent, soft-deactivated, and independently revocable. Publishers and legacy editors do not receive classroom permissions by default; administrators have global access.

## Consequences

Teachers manage only their own classes and enrolled members, students see only active memberships, and archived classes reject new enrollment. Future RLS and controlled RPCs must enforce these boundaries; no enrollment behavior is introduced now.
