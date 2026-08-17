# Classroom Architecture and UX

## Status

Design only. Classes, enrollment, assignments, and synchronized classroom progress are not implemented.

## Course and Class

A Course is reusable instructional content: courses contain units, lessons, versions, activities, and specialist content. A Class is a teacher-managed learning group that receives selected published course content. A class never owns or duplicates course content.

The initial relationship model is many-to-many:

- one teacher may own many classes;
- one student may belong to many classes;
- one course may be assigned to many classes;
- one class may receive many courses.

Only the published course state may be assigned. Drafts, archived versions, and private authoring records remain inaccessible to students.

## Recommended course-release strategy

Three future models were considered:

| Option | Strengths | Costs and risks |
| --- | --- | --- |
| Course release entity | Stable, reportable release; explicit rollback; one complete hierarchy reference | Requires a release builder and new publication metadata |
| Assignment snapshot | Precise lesson-version references; incremental adoption | Harder to explain and validate as a complete course; larger assignments |
| Always use current publication | Smallest implementation | Published updates silently change active learning and destabilize reporting |

The recommendation is **Option A: Course release entity**. A release should record the complete set of active published lesson-version references at publication time. `class_course_assignments` should point to a release, not a mutable course status. This gives students stable content, supports explicit updates and rollback, and keeps progress reports tied to a known instructional release. It is a future model; this sprint does not alter the current lesson-version publication system.

## Updating an assigned course

When a teacher republishes a course, an assigned class continues using its current release. The teacher sees **An updated course version is available** with three explicit choices: **Review changes**, **Update class**, or **Keep current version**.

The recommended update rules are:

- completed lessons that still exist remain complete;
- new lessons begin incomplete;
- removed lessons remain in historical reporting but no longer appear as active work;
- reordering changes presentation order, not completion identity;
- replaced activities retain completion only when their stable instructional target is demonstrably unchanged; otherwise they require fresh completion;
- changed assessment requirements require a new attempt or explicit re-completion;
- every progress record carries the release context used when it was completed.

## Class lifecycle and creation

Teachers will eventually create a class with a required name and optional description, academic term, start date, end date, schedule text, and visual identifier. Schedule text is intentionally simple, for example “Monday and Wednesday, 6:00 PM”; calendar integration is out of scope.

The system supplies the owner, creation date, join code, invitation link, and status. The initial lifecycle is **Draft → Active → Archived**. Archived classes reject new enrollment and remain available for historical reporting.

## Enrollment

Phase 1 uses a difficult-to-guess join code and invitation link. Codes can be regenerated, links can be disabled, repeated enrollment is idempotent, and archived classes reject new members. Students must authenticate before joining; they cannot enroll in private classes without a valid invitation. Teachers must not accidentally enroll as students. Removed or suspended members lose class access.

Future options are QR codes derived from invitation links, teacher-added existing students, email invitations, and CSV import.

## Teacher routes and workspace

The future internal route family may remain under `/admin`:

```text
/admin/classes
/admin/classes/new
/admin/classes/:classId
/admin/classes/:classId/students
/admin/classes/:classId/courses
/admin/classes/:classId/assignments
/admin/classes/:classId/progress
```

Visible terminology is **My Classes**, **Create Class**, **Students**, **Courses**, **Assignments**, **Progress**, and **Class Settings**. The My Classes page will support truthful Active, Draft, and Archived filters and class-name search. Cards should show only available values: name, status, counts when supplied by the backend, term, recent activity, and Open Class.

The Class Workspace will eventually contain Overview, Students, Courses, Assignments, Progress, and Settings. No production route or fake class data is introduced by this design sprint.

## Student experience

Future learner routes are `/learn/classes` and `/learn/classes/:classId`. The student home should prioritize My Classes, Continue Learning, current assignments, due dates, and recent teacher activity. A class page may show its name, assigned published courses, assignments, progress, teacher information, and a continue action.

Students never see ownership controls, publishing controls, draft content, other students’ private progress, or teacher-only analytics. The current learner experience remains unchanged because learner identity and synchronized progress are not yet implemented.

## Assignments

An Assignment is a class-specific instruction, not a course assignment. It may target a course, unit, lesson, activity, or future speaking-mission attempt and may contain a title, instructions, class, target, availability dates, completion requirement, and status. Assigning a course determines available content; an assignment adds a teacher-directed task with its own completion rules.

## Progress requirements

Future reporting needs a student, class membership, course assignment, release context, lesson and activity completion, attempt count, applicable score, and last activity timestamp. Today progress is device-local and does not identify a student or class. No classroom schema change is made in this sprint.

## Permission matrix

| Capability | Platform Admin | Teacher | Student | Publisher | Legacy Editor |
| --- | --- | --- | --- | --- | --- |
| Create class | All | Own classes | No | No | No |
| View class | All | Own classes | Enrolled only | No by default | No |
| Edit/archive class | All | Own classes | No | No | No |
| Manage students | All | Own classes | No | No | No |
| Assign courses | All | Own classes | No | No | No |
| Create assignments | All | Own classes | No | No | No |
| View student progress | All | Own classes | Own progress only | No | No |
| Publish course content | All | Own courses | No | Global | Existing rules only |
| Edit course content | All | Own courses | No | No by default | Existing owner-scoped rules |

RLS, not UI labels, will enforce these boundaries.

## Proposed smallest schema

| Table | Purpose and key fields | Integrity and RLS boundary |
| --- | --- | --- |
| `classes` | Owner, name, description, term, dates, schedule text, color, status, join-code state | Owner FK; archive instead of destructive delete; teachers see their own rows, admins all |
| `class_members` | Class, student, membership status, joined/removed timestamps | Unique active class/student pair; students see their own membership, teachers see members of owned classes |
| `course_releases` | Course, release number, publication metadata, complete published lesson-version references | Immutable after creation; generated only by controlled publication workflow |
| `class_course_assignments` | Class, course release, assignment timestamps, active state | Unique active class/release; owner-scoped management |
| `class_join_codes` | Class, hashed code, regeneration and expiry state | Never enumerate to students; only a secure redemption flow may validate a code |
| `assignments` | Class, title, instructions, availability, due date, status | Owned through class; archive rather than rewrite history |
| `assignment_targets` | Assignment and course/unit/lesson/activity target | Exactly one target kind per row; target must belong to assigned release |
| `student_assignment_progress` | Student, assignment, state, completed timestamp, release context | Unique student/assignment; student writes only their own row, teachers read owned-class aggregates |

Physical media remains referenced rather than copied by classroom assignment. Foreign keys should use restrictive behavior for historical records and explicit archive semantics.

## RLS expectations

Teachers can read and modify their own classes, members, assignments, and course assignments, and can read progress for students in those classes. Students can read active memberships and assigned published content and can write only their own progress. Administrators can manage all classroom records. Publishers and legacy editors receive no classroom authority by default. Anonymous users cannot access classroom data; a future join endpoint must be deliberately scoped and rate-limited.

## Deferred implementation

This document intentionally creates no routes, migrations, RPCs, forms, enrollment behavior, statistics, or production placeholders. The next implementation phase should begin with release and membership contracts, then controlled RPCs and RLS, followed by teacher UX and learner class navigation.
