# Sprint 35 Release Checklist

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Browser verification required |
| Last Updated | July 22, 2026 |

## Purpose

This checklist records the manual browser verification required after the Sprint 35 release-blocker fixes. Automated build, lint, and unit tests do not replace these end-to-end checks against the configured development environment.

Do not mark an item complete unless the behavior has been observed in a browser with the relevant role and content state.

## Previous Blocker Evidence

The previous browser test showed that selecting **Delete** for a course, unit, lesson, or activity produced no matching Network request. The native confirmation branch stopped the frontend flow before the page handler invoked its delete service. The checks below must be repeated with the shared confirmation dialog; none are considered passed by this code change alone.

## Delete Request Retest

Repeat this sequence separately for a draft course, unit, lesson, and activity:

- [ ] Open browser developer tools and clear the Network log.
- [ ] Filter Network requests by `delete`.
- [ ] Select the entity's **Delete** control.
- [ ] Confirm that the shared confirmation dialog names the current entity.
- [ ] Choose **Delete** in the confirmation dialog.
- [ ] Confirm exactly one corresponding `delete_draft_*` RPC request appears.
- [ ] Confirm the RPC response has a successful 2xx status.
- [ ] Confirm the item disappears immediately without refreshing.
- [ ] Repeat with a forced request failure and confirm the dialog permits one retry with the same entity.

## Editor and Administrator Checks

### Unit Creation

- [ ] Open a draft course and choose **Create unit**.
- [ ] Enter a title and create the unit.
- [ ] Confirm **Saving…** clears after the request completes.
- [ ] Confirm the dialog closes without an unsaved-changes warning.
- [ ] Confirm the returned unit appears immediately in curriculum order without refreshing.
- [ ] Attempt a rapid second submission and confirm only one unit is created.

### Lesson Creation

- [ ] Open a draft unit and choose **Create lesson**.
- [ ] Choose **Blank Lesson**, enter a title, and create the lesson.
- [ ] Confirm **Saving…** clears and the dialog closes after success.
- [ ] Confirm the lesson is added without refreshing.
- [ ] Confirm navigation occurs exactly once to the returned lesson’s existing Studio route.
- [ ] Confirm Lesson Studio does not create a lesson draft until **Start lesson draft** is chosen.
- [ ] Attempt a rapid second submission and confirm only one lesson is created.

### Unit and Lesson Deletion

- [ ] Delete a draft unit after confirming the named destructive action.
- [ ] Confirm the unit disappears immediately without refreshing.
- [ ] Confirm the delete pending state clears.
- [ ] Delete a draft lesson after confirming the named destructive action.
- [ ] Confirm the lesson disappears immediately without refreshing.
- [ ] Confirm the delete pending state clears.
- [ ] Cancel each confirmation once and confirm no delete request is made.

### Activity Deletion

- [ ] Delete a non-selected editable activity and confirm the current selection does not change.
- [ ] Delete the selected editable activity and confirm a valid remaining activity becomes selected.
- [ ] Delete the final activity and confirm the empty activity state appears.
- [ ] Confirm each deleted activity disappears without refreshing.
- [ ] Confirm a rapid repeated click does not issue a duplicate delete.

### Activity Duplication

- [ ] Confirm every editable activity displays a clearly labelled **Duplicate** action.
- [ ] Duplicate Learn, Listening, Pronunciation, Quiz, and AI Speaking Mission activities where representative content exists.
- [ ] Confirm the existing duplication service is called once for each action.
- [ ] Confirm the returned copy appears immediately in its returned order without refreshing.
- [ ] Confirm the copy becomes selected and editor focus moves predictably.
- [ ] Confirm the stored activity type and supported specialist content are preserved.
- [ ] Confirm rapid repeated activation creates only one copy.

### Learn Presentation

- [ ] Open Add Activity and confirm the teacher-facing card says **Learn**.
- [ ] Create Learn and confirm the stored activity value remains `theory` in diagnostic tooling.
- [ ] Confirm the activity list and settings use **Learn** rather than Theory.
- [ ] Confirm the existing Learn editor opens and its implementation contracts remain unchanged.

## Failure and Retry Checks

Use a safe local failure method, such as temporarily disabling network access before submitting. Do not alter production data or permissions for this check.

- [ ] Fail unit creation and confirm pending clears, entered values remain, and retry succeeds once.
- [ ] Fail lesson creation and confirm pending clears, entered values remain, and retry succeeds once.
- [ ] Fail unit deletion and confirm the unit remains, the pending state clears, and the error is visible.
- [ ] Fail lesson deletion and confirm the lesson remains, the pending state clears, and the error is visible.
- [ ] Fail activity deletion and confirm the activity remains selected or available and retry is possible.
- [ ] Fail activity duplication and confirm the original remains unchanged, pending clears, and retry is possible.
- [ ] Confirm no raw backend, SQL, RPC, or stack details appear in teacher-facing errors.

## Publisher and Sealed-Content Checks

- [ ] Sign in as a publisher and confirm unit and lesson create, edit, delete, and duplicate controls are unavailable.
- [ ] Confirm Add Activity is unavailable for a publisher.
- [ ] Open published, archived, or otherwise sealed hierarchy content and confirm destructive and creation actions remain unavailable.
- [ ] Confirm view-only explanations remain visible and do not imply that permissions can be bypassed.

## Regression Checks

- [ ] Existing Practice activities open, remain editable where supported, reorder, duplicate, and delete under current permissions.
- [ ] Existing Quiz activities open, edit, reorder, duplicate, and delete.
- [ ] Up and Down ordering remains keyboard accessible after duplication and deletion.
- [ ] AI Speaking Mission remains lazy-loaded and continues using the external copy-and-paste workflow.
- [ ] Course, unit, lesson, and Lesson Studio route paths remain unchanged.
- [ ] No learner-facing content behavior changes during these admin checks.

## Sign-Off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Editor workflow reviewer |  |  | Pending |
| Publisher workflow reviewer |  |  | Pending |
| Release reviewer |  |  | Pending |
