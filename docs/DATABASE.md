# Database

## Contents

- [Philosophy](#philosophy)
- [Entity model](#entity-model)
- [Entity purposes](#entity-purposes)
- [Roles and RLS](#roles-and-rls)
- [Ownership model](#ownership-model)
- [Versioning and immutability](#versioning-and-immutability)
- [RPC philosophy](#rpc-philosophy)
- [Publication and media](#publication-and-media)
- [Quiz answer security](#quiz-answer-security)
- [Migration map](#migration-map)
- [Migration rules](#migration-rules)
- [Known limitations](#known-limitations)

## Philosophy

Supabase Postgres is the authority for staff content management. Browser UI checks are advisory; constraints, triggers, RLS, grants, and RPC authorization enforce integrity. Multi-row workflows run inside security-definer functions with narrow grants.

Learner delivery, synchronized progress, Classes, enrollments, immutable Releases, and Class assignments are active Supabase-backed contracts. Current-course independent practice and immutable assigned-Release practice use separate progress identities.

`courses.learner_visibility` defaults to `class_only`; migration `202608180001` intentionally migrates every existing Course to that privacy-safe value. The owner/Admin visibility RPC is the only browser mutation path. Public catalog reads include only `public` Courses plus a learner's redeemed `unlisted` Courses; direct current-Lesson delivery and progress RPCs call the same access predicate. Unlisted links store only SHA-256 token digests, require an authenticated non-staff learner to redeem, and can be regenerated or disabled. `learner_independent_course_access` is learner-scoped and never grants Release/Class access. Published content fields remain sealed; only visibility and its audit timestamp are exempted from content immutability.

## Entity model

```mermaid
erDiagram
  AUTH_USERS ||--o| PROFILES : has
  AUTH_USERS ||--o{ USER_ROLES : receives
  COURSES ||--o{ UNITS : contains
  UNITS ||--o{ LESSONS : contains
  LESSONS ||--o{ LESSON_VERSIONS : versions
  LESSON_VERSIONS ||--o{ LESSON_ACTIVITIES : orders
  LESSON_ACTIVITIES ||--o{ THEORY_BLOCKS : contains
  LESSON_ACTIVITIES ||--o{ LISTENING_ITEMS : contains
  LESSON_ACTIVITIES ||--o{ PRONUNCIATION_ITEMS : contains
  LESSON_ACTIVITIES ||--o{ ASSESSMENT_SETS : contains
  LESSON_ACTIVITIES ||--o| AI_SPEAKING_MISSIONS : configures
  ASSESSMENT_SETS ||--o{ QUESTIONS : contains
  QUESTIONS ||--o{ QUESTION_OPTIONS : contains
  MEDIA_ASSETS ||--o{ THEORY_BLOCKS : referenced_by
  MEDIA_ASSETS ||--o{ LISTENING_ITEMS : referenced_by
  MEDIA_ASSETS ||--o{ PRONUNCIATION_ITEMS : referenced_by
  LISTENING_ITEMS ||--o{ ASSESSMENT_SETS : may_contextualize
```

## Entity purposes

| Entity | Purpose and notable invariants |
| --- | --- |
| `profiles` | Optional staff display name keyed to `auth.users` |
| `user_roles` | Many roles per auth user; enum is `teacher`, `editor`, `publisher`, `admin` |
| `courses` | Ordered catalog root with slug, title, level, description, lifecycle |
| `units` | Ordered course children; child creation requires a draft course |
| `lessons` | Ordered unit children; points to the current published lesson version |
| `lesson_versions` | Immutable release boundary; one published version per lesson |
| `lesson_activities` | Ordered typed activity metadata within a version |
| `theory_blocks` | Ordered theory content: heading, paragraph, tip, example, image, audio |
| `listening_items` | Listening title, instructions, optional manual transcript, and managed audio; drafts may omit audio, publication may not |
| `pronunciation_items` | Ordered legacy display-text items or pronunciation-specific Word List / Minimal Pairs blocks; block rows store optional spelling patterns, structured JSONB entries, and optional managed audio |
| `assessment_sets` | Quiz settings tied to an activity; optional listening context must share activity |
| `questions` | Ordered assessment prompts, explanations, and required state |
| `question_options` | Ordered option text and protected correctness flag |
| `media_assets` | Lifecycle metadata bound to Storage objects and verified publication operation |
| `ai_speaking_missions` | One structured JSON configuration per AI activity |

All hierarchy positions are nonnegative and have parent-scoped uniqueness constraints. Parent foreign keys for existing authoring rows are immutable through triggers added in migration 007.

## Roles and RLS

Helper functions centralize authorization:

| Helper | Effective role semantics |
| --- | --- |
| `has_admin_role(role)` | Tests one role for current authenticated user |
| `can_manage_content()` | Teacher, legacy editor, publisher, or administrator |
| `can_edit_drafts()` | Teacher, legacy editor, or administrator; course ownership still applies |
| `can_publish_content()` | Teacher, publisher, or administrator; teacher publication is owner-scoped |
| `can_edit_course(course_id)` | Course owner with teacher/editor capability, or administrator |
| `can_publish_course(course_id)` | Owning teacher, publisher, or administrator |

RLS is enabled on every content and identity table. General policy shape:

- anonymous/authenticated learners may see published catalog/version data where granted;
- content managers may inspect authoring content;
- editors/admins mutate drafts;
- publisher/admin lifecycle changes use controlled rules or RPCs;
- nested inserts validate the draft parent hierarchy;
- archived or published version descendants cannot be inserted, changed, moved, or deleted.

The application does not duplicate role strings across pages; `AdminRoute` calls the helpers and provides typed permission values.

## Ownership model

`courses.owner_user_id` is a non-null foreign key to `auth.users.id`. New
course inserts assign `auth.uid()` in the database, and ownership is immutable.
Course positions are unique within an owner rather than across the entire
platform, allowing independent teacher catalogs to begin at position zero.
The migration backfills a course from its existing editor/administrator
`created_by` value when possible and otherwise uses the earliest existing
administrator. Migration stops instead of creating ownerless content when no
administrator is available.

Ownership is stored only on the course. The database resolves each descendant
through course → unit → lesson → version → activity and the relevant subtype
relationship. Owner-scoped RLS prevents teachers from reading or mutating
another teacher's private hierarchy. The same resolution runs in a trigger for
direct writes and security-definer RPC writes.

Administrators bypass course ownership. Publishers can inspect private
hierarchies and retain global publication authority but cannot author drafts.
Legacy editors keep draft-authoring compatibility for courses they own.
Anonymous and authenticated learners retain access only through published
content rules and learner-safe RPC projections.

The ownership trigger is shared by `courses` and twelve descendant content
tables, but `owner_user_id` exists only on `courses`. Migration
`202608060001` keeps the course as the single ownership authority and replaces
schema-dependent `NEW.owner_user_id` access with JSONB record inspection. This
allows the polymorphic trigger to handle child-table updates safely while still
rejecting every attempted ownership reassignment, including by an
administrator. Descendant writes continue resolving their course through
`content_row_course_id` and then applying owner/administrator authorization.

## Versioning and immutability

The lesson version is the release unit. A transaction-level advisory hierarchy gate serializes publication with all descendant authoring.

Published lesson versions are immutable. The version-drafting RPC creates a
new draft identity and copies activity and specialist rows while preserving
the published version and its media references. Publication archives the prior
published version, activates the new lesson pointer, and keeps the operation
behind the existing validation and hierarchy gate.

The draft-copy transaction uses the same private AI-activity creation marker
as the dedicated AI creation/duplication RPCs. The AI configuration trigger
authorizes against the target draft lesson version and owning course rather
than requiring published course, unit, and lesson metadata to return to draft.
Direct AI activity insertion remains unavailable to browser roles.

`can_edit_lesson_version(version_id)` is the shared mutation gate for draft
content. It requires a draft target version and owner/administrator authority;
the course, unit, and lesson may remain published while learners continue to
use the active published version.

Authoring RPC order is:

```text
authorize
→ acquire hierarchy gate
→ re-read and validate complete draft hierarchy
→ lock child rows in deterministic order
→ mutate
```

Publication follows the same gate-first order. If publication wins, a waiting authoring RPC re-reads the sealed hierarchy and fails. If authoring wins, publication waits until authoring commits or rolls back.

Statement triggers acquire the same gate for direct hierarchy mutations. Row triggers resolve and lock traversed parents and final lesson versions. UPDATE protects old and new paths; parent-immutability triggers additionally reject reparenting.

The trigger functions that enter the private hierarchy and media lock helpers
run as security definers with an empty search path. Their internal gate and lock
functions remain non-executable by `anon` and `authenticated`; this lets an
authorized direct table mutation acquire the transaction gate without exposing
the gate as a callable browser API. RLS and the row-level ownership/draft checks
still decide whether the mutation is allowed.

The protected foreign keys are:

- `lesson_activities.lesson_version_id`
- `theory_blocks.activity_id`
- `listening_items.activity_id`
- `pronunciation_items.activity_id`
- `assessment_sets.activity_id` and nullable `listening_item_id`
- `questions.assessment_set_id`
- `question_options.question_id`

Null-safe comparison prevents an assessment from switching between activity- and listening-backed shapes.

## RPC philosophy

RPCs are used when browser statements cannot safely preserve a domain invariant:

- `create_lesson_draft_version`
- `create_draft_lesson_activity`
- `reorder_draft_lesson_activities`
- `reorder_draft_theory_blocks`
- `create_draft_quiz_question`
- `save_draft_quiz_question` with expected `updated_at`
- `delete_draft_quiz_question` with the expected assessment parent
- `reorder_draft_quiz_questions`
- `duplicate_draft_lesson_activity`
- AI mission create and duplicate functions
- `save_draft_ai_speaking_mission` with expected `updated_at`
- `publish_lesson_version`
- media publication prepare/finalize functions
- published quiz projection functions
- `get_published_learning_catalog`
- `get_published_lesson`

Functions schema-qualify objects, set an empty search path when security-definer, perform internal authorization, revoke `PUBLIC`, and grant only required roles. Reorder functions perform a temporary offset then assign the exact requested permutation transactionally, avoiding transient uniqueness collisions.

## Publication and media

### Lesson versions

`publish_lesson_version(version_id)` is the transactional content-release path.
Lesson Studio reaches it through the `publish-content` Edge Function so draft
media can complete the trusted Storage lifecycle first; the browser never
performs a status or current-version update. The RPC validates course-scoped
publication permission and content completeness, archives the prior current
version, publishes the requested draft, and atomically advances
`lessons.current_published_version_id`. Activating a later version preserves the
lesson row's original `published_at`; the version row records each release's
own timestamp. Direct status promotion is rejected by lifecycle triggers.

### Progressive hierarchy authoring

`create_draft_unit` and `create_draft_lesson` acquire the hierarchy gate,
require owning teacher or administrator authority, and append after the maximum
sibling position without updating published siblings. Lesson creation inserts
draft Version 1 atomically. Draft additions remain editable and deletable even
below published parents. Learner projections still require the complete
published course, unit, lesson, and version chain.

Assessment listening references use a composite foreign key so the listening item belongs to the same activity.

### Media

Storage buckets:

- private drafts: `content-audio-drafts`, `content-image-drafts`;
- public releases: `content-audio`, `content-images`.

Media publication is a two-step trusted workflow coordinated by the
`publish-content` Edge Function:

1. An authenticated publisher/admin calls `prepare_media_publication`. The database locks the media lifecycle, validates the draft object’s owner/MIME/size, and stores a one-time token, source Storage ID/version, requester, and expiry.
2. A trusted backend copies or uploads the destination with bound metadata, streams both physical objects, computes lowercase SHA-256 values, and calls `finalize_media_publication`.
3. Finalization is executable only by `service_role`. It rejects expiry, replay, token/source/destination mismatch, malformed or unequal hashes, and records the prepared manager as `published_by`.

Postgres does **not** read or hash file bytes. Lesson and course publication
first obtain an ownership-checked media plan. The trusted function copies and
hashes draft objects, then finalizes the same `media_assets.id` into its public
bucket before calling the existing publication RPC. The service-role secret is
used only by the deployed function and is never available to browser code.
Media-plan rows whose stable asset is already published are reused as-is and
skip prepare, copy, and finalize. Mixed plans process only draft assets, so a
new lesson version does not duplicate media inherited from its predecessor.

Storage deletion/update triggers protect published objects and referenced content.

## Quiz answer security

The `questions` and `question_options` base tables are manager-only for SELECT. Learners call narrow security-definer functions:

- published questions omit explanation;
- published options omit `is_correct`.

This prevents anonymous and ordinary authenticated learners from retrieving answer keys through direct table reads. Do not broaden these grants when adding learner quiz behavior.

The migration 010 lesson-delivery RPC applies the same boundary to the complete
lesson graph: quiz questions and option text are projected, while explanations
and option correctness are omitted in SQL. Both learner RPCs require a fully
published course, unit, lesson, and current published version. Their execution
is granted explicitly to `anon`, `authenticated`, and `service_role`; internal
projection helpers are not executable by API roles.

AI Speaking Mission configuration is projected through an explicit SQL field
allow-list, so additional authoring JSON properties never cross the learner
delivery boundary. Unsupported requested schema versions return a stable
`unsupported_schema_version` error envelope rather than a partial success
projection.

## Migration map

| Migration | Purpose |
| --- | --- |
| `001_content_schema` | Core enums, tables, indexes, timestamps, initial publication guards |
| `002_content_rls` | Role helpers, grants, and RLS policies |
| `003_content_storage` | Draft/public buckets and Storage policies |
| `004_harden_content_security` | Lifecycle immutability and safe learner quiz projections |
| `005_close_immutability_gaps` | Hierarchy/media gates, validated publication, media finalization |
| `006_enforce_draft_parent_inserts` | Draft-parent requirements for unit/lesson inserts |
| `007_lesson_authoring_rpcs` | Parent immutability and atomic Lesson Studio operations |
| `008_ai_speaking_missions` | AI enum, configuration table, policies, create/duplicate RPCs |
| `009_ai_speaking_mission_hardening` | Complete mission validation, RPC-only activity creation, clock-based optimistic save revisions, publication completeness |
| `010_published_learner_delivery` | Learner-safe published catalog and current lesson RPC projections |
| `202607220005_pronunciation_block_foundation` | Backward-compatible Word List and Minimal Pairs data, controlled block mutations, duplication support, and publication completeness validation |
| `202607220008_interactive_practice_foundation` | Staff-only Interactive Practice authoring data, controlled mutations, RLS, and publication gating; pending deployment |
| `202607230001_add_teacher_role` | Adds the first-class `teacher` staff role in a transaction separate from its first use |
| `202607230002_teacher_ownership_foundation` | Adds course-root ownership, backfill, owner-aware helpers/RLS/RPC protection, and teacher Studio permissions |
| `202608060001_fix_content_ownership_trigger` | Makes the shared ownership trigger safe across child row types without weakening immutable course ownership |
| `202608100001_media_publication_and_draft_versions` | Coordinates verified media publication and copies complete published lesson trees into distinct editable draft versions |
| `202608120001_fix_course_insert_returning_rls` | Keeps a newly inserted owner-teacher course visible to the same statement's `RETURNING` projection |
| `202608120002_fix_authoring_trigger_security` | Restores authenticated draft mutations across the private hierarchy-lock boundary and adds parent-scoped leaf-first quiz-question deletion |
| `202608120003_fix_published_draft_copy` | Allows the trusted published-to-draft copy transaction to reproduce AI activity rows through the private creation marker |
| `202608120004_fix_ai_draft_version_guard` | Authorizes AI configuration mutations through the editable draft version beneath published parent metadata |
| `202608120005_fix_lesson_republication_activation` | Preserves the lesson's first publication timestamp while atomically activating a later published version |
| `202608120006_progressive_course_authoring` | Adds append-only draft Unit/Lesson creation beneath published parents, atomic Lesson Version 1 creation, and progressive draft deletion |
| `202608120007_fix_progressive_append_position` | Makes progressive append-position calculation unambiguous |
| `202608130001_sprint_51b_progression_publication_and_deletes` | Projects Learn audio transcripts, limits course-update validation to draft lesson versions, and permits owner-scoped draft activity deletion beneath published ancestors |
| `202608130002_clarify_draft_unit_publication_blocker` | Identifies an empty new draft Unit precisely in Publish updates feedback |
| `202608130003_owner_scoped_media_deduplication` | Adds verified owner/kind/SHA-256 media identity, atomic registration, and closes direct browser registry inserts |
| `202608130004_scope_media_library_to_owner` | Separates anonymous published delivery from owner/admin Media Library visibility |
| `202608130005_harden_media_owner_mutations` | Restricts draft media updates and deletes to the owner or platform administrator |
| `202608130006_canonical_media_library_presentation` | Adds an RLS-preserving Media Library view that collapses trusted historical fingerprint duplicates without rewriting references |
| `202608130005_harden_media_owner_mutations` | Restricts draft media updates and deletes to the owner or platform admin |

## Migration rules

Never duplicate migration SQL in documentation. Read the effective object across all later replacements.

- Confirm local and remote migration ledgers before deciding whether a migration is editable.
- Applied migrations are immutable; add a forward-only migration.
- Preserve exact signatures in revoke/grant statements.
- Execute from scratch in a disposable Supabase database when possible; a dry run validates ordering, not SQL execution.
- Do not reset the linked remote project.
- Do not run a remote push without explicit authorization.

## Known limitations

- The learner app still defaults to static content; the Supabase provider is
  constructed only through explicit composition and is not used by routes.
- Migration 009 is forward-only and unapplied in this working tree; the linked database does not gain its AI hardening guarantees until an authorized deployment.
- Media finalization requires a trusted backend that is not in this repository.

These are hardening opportunities, not implemented guarantees.
## Course publication lifecycle

## Learner identity and progress

Authenticated users without a row in `user_roles` are learner identities; the role table remains staff-only. `learner_activity_progress` records idempotent completion by stable published activity ID. `learner_lesson_progress` records start, last access/activity, and monotonic completion. Security-definer visit/completion RPCs derive identity from `auth.uid()`, reject staff and anonymous callers, validate the current published Course → Unit → Lesson → Version hierarchy, and derive Lesson completion. Direct browser mutation grants are absent. Learners select only their own rows; teachers receive no visibility; administrators retain platform support visibility. See [ADR 0011](ADR/0011-authenticated-learner-progress.md).

`public.publish_course(bigint)` is the transaction boundary for course-wide publication. It is available only to authenticated users with administrator, publisher, or owner-teacher publication authority. Validation is aggregated before any status, pointer, or archive update. The operation validates the newest draft lesson version when one exists; otherwise it retains the active sealed version without applying newer validators to history. It never republishes archived history. Learner queries therefore observe only the newly activated published hierarchy after a successful transaction.

## Classroom model

`classes` stores one owner, active/archived lifecycle, and a 64-bit random regenerable join code. `class_enrollments` stores one soft-deactivatable relationship per Class/Learner. `class_course_assignments` preserves immutable Release assignment history and enforces at most one active Release per Class/source Course. RLS exposes owned Classes/rosters/assignments to Teachers, own active memberships and assignments to Learners, and platform support access to Admins. Controlled RPCs perform creation, joining, removal, code rotation, Release selection, atomic Release replacement, and assignment-scoped reporting.

## Immutable Course Releases

`course_releases`, `course_release_units`, and `course_release_lessons` form an update/delete-sealed manifest storing exact Lesson-version IDs and structural snapshots. `learner_release_lesson_progress` and `learner_release_activity_progress` are independent from current/public progress. Controlled RPCs enforce authorization, manifest membership, exact activity-version identity, and Release ordering. Learner access normally derives from active enrollment + active Class + active assignment. `course_release_learner_entitlements` remains a server-managed optional non-Class grant seam with no browser write access.

Release eligibility uses the manifest's `(Unit position, Lesson position, Release Lesson id)` ordering. The progress snapshot returns each Lesson's authoritative `available`, `completed`, or `locked` state. Normal learner delivery returns no Lesson/activity payload for locked content; completed Lessons remain deliverable for review. Runtime errors use distinct `PLR01`–`PLR05` SQL states for unavailable Releases, invalid manifest Lessons, progression locks, non-learner identities, and activities outside the pinned Lesson version.

The frontend domain contracts under `src/domain` describe these future records without asserting that they exist in Postgres. Service interfaces document expected authorization and result boundaries; they do not issue requests or create a parallel data access layer.
## Teacher Media Library access

`public.media_assets` remains the single registry for editor uploads and stable lesson references. Media Library lists use the `security_invoker` view `public.media_library_assets`, which preserves base-table RLS and presents one canonical row for matching trusted owner/kind fingerprints. This presentation does not rewrite or delete historical rows. Anonymous delivery can resolve published assets; authenticated teachers see and mutate only their own media, while platform administrators retain global visibility. New registry rows require trusted registration and carry an indexed `content_sha256`. The registration RPC serializes owner/kind/hash races and also recognizes the trusted `source_sha256` already stored on previously published media.

Library selection persists only `media_assets.id`; it does not duplicate `storage.objects` bytes or persist signed URLs. Draft buckets remain private and use signed URLs under the existing Storage SELECT policy. Published audio and image buckets remain intentionally public. Removing media from an activity clears only that foreign-key reference; it does not delete a shared asset. Library-level asset deletion remains unavailable pending an explicit usage-count and orphan-cleanup contract.
## Hierarchy title integrity

Unit and Lesson names are unique in their immediate authoring collection. Unit comparison is scoped by `course_id`; Lesson comparison is scoped by `unit_id`, so the same Lesson title is intentionally valid in different Units. The authoritative unique indexes trim edge whitespace, collapse internal whitespace runs to one ASCII space, and compare case-insensitively. Publication and version creation do not create alternate hierarchy rows and cannot bypass these base-table invariants.

The forward migration performs a read-only conflict preflight before creating either index. It reports parent IDs, normalized titles, and row IDs and never renames existing Teacher content. Draft duplication uses the same normalization when selecting copy suffixes.

## Assignment Release progress continuity

Changing an active Class assignment to another Release is one transaction. The assignment RPC projects completed Lesson rows for active enrolled learners into the new Release by `course_release_lessons.source_lesson_id`. Titles, positions, Units, and Lesson-version IDs are deliberately not compatibility keys: an existing source Lesson remains completed after rename, reorder, movement, or publication of a new version. New source Lessons receive no progress, removed source Lessons are absent from the new manifest, and historical Release progress remains unchanged. Projection is monotonic and idempotent; activity completion is not copied across potentially different Lesson versions.

## Removing published source content

Authoring deletion and historical deletion are separate operations. `remove_authoring_lesson` and `remove_authoring_unit` hard-delete only draft-only rows that have never entered a Release; previously published rows are archived and therefore omitted from later publication manifests. `remove_authoring_course` similarly hard-deletes a wholly draft-only Course or retires a published Course. Retirement forces Class-only visibility, revokes Unlisted links and independent access grants, and prevents further visibility changes, publication, and new assignments.

Release manifests and learner progress are never rewritten by these operations. Existing active Class assignments remain pinned and accessible after source-Course retirement; Teachers must explicitly end those assignments when desired. This preserves an in-progress assigned journey while blocking every new use of the retired source Course.
## Assignment scheduling

`class_course_assignments.available_at` and `due_at` are authoritative UTC
timestamps. `NULL available_at` means available immediately; `due_at` is
optional and must be later than availability (or later than `now()` for an
immediate assignment). `classes.timezone` stores the IANA display timezone.
`can_access_course_release` gates only before availability; due dates do not
revoke authorization. Schedule edits use the owner-checked
`update_class_course_assignment_schedule` RPC and do not create Releases or
delete progress.

## Assignment notifications

Migration `202608210001_assignment_notifications.sql` adds the learner-owned
`learner_notifications` inbox. Its `(learner_user_id, event_key)` uniqueness
contract makes generation idempotent. Assignment creation and later enrollment
use trusted functions for New Assignment events; the timestamped processor
handles Available, Due Soon, and Late events. Only learner read RPCs are
executable by authenticated learners. `pg_cron` invokes the processor every 15
minutes; existing assignment, Release, and progress authorization remains
authoritative.

`202608210002_notification_dismissal_retention.sql` adds `dismissed_at` and
learner-scoped `dismiss_notification`/`clear_read_notifications` RPCs. The
listing RPC excludes dismissed rows and read rows older than 90 days while
retaining all rows for event-key deduplication. Unread rows are never aged out.
