# Sprint 35 Accessibility and Responsive Audit

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Code audit complete; manual browser verification required |
| Last Updated | July 22, 2026 |

## Purpose

This document records the accessibility and responsive audit for the Studio flows delivered during Sprint 35. It covers code-level findings, completed remediations, and the manual checks that remain necessary because the project does not include a component-testing or browser-automation environment.

The audit does not change Studio routes, permissions, services, content contracts, or authoring workflows.

## Flows Reviewed

- Opening, completing, cancelling, and closing the Course form.
- Selecting a course emoji and editing or resetting the course address.
- Opening and closing the mobile navigation.
- Following breadcrumbs and named hierarchy return actions.
- Opening New Lesson, choosing Blank Lesson, returning to the chooser, and protecting unsaved work.
- Opening Add Activity, reviewing every current activity type, retrying a failed creation, and creating an activity.
- Selecting, moving, duplicating, and deleting existing activities.
- Opening the current specialist activity editors.
- Reviewing loading, error, empty, save, compatibility, and view-only states.
- Using dialogs and page actions at narrow mobile, large mobile, tablet, and desktop widths.

## Issues Found and Remediations

### Forms

- Form hints and validation messages had visible labels but were not consistently connected to their controls. Stable hint and error identifiers are now provided, and the Sprint 35 course and hierarchy controls use `aria-describedby` for the active message.
- Required fields used a visual asterisk without an equivalent spoken explanation. Required labels now include screen-reader text, while optional description and level labels are explicit.
- Inline validation messages now retain alert semantics, and invalid title and course-address fields continue to expose `aria-invalid`.

### Dialogs and Focus

- Shared dialogs already move focus inside, contain Tab and Shift+Tab, restore previous focus, lock background scrolling, and prevent Escape or backdrop closing during protected operations.
- Dialog close controls now include the dialog title in their accessible name and use a larger target.
- Dialogs expose a busy state while closing is prevented by an active submission.
- Lesson choice and Activity Picker actions provide explicit initial-focus targets. Course and hierarchy forms continue to focus the title field.

### Selection and Compatibility States

- Emoji selection previously depended mainly on border and background color. It now includes `aria-pressed`, a spoken selected label, and a visible checkmark.
- Activity Picker selection now includes a visible **Selected** badge in addition to border treatment.
- Lesson Studio activity selection now includes `aria-pressed` and visible **Selected activity** text.
- Practice remains visibly and semantically unavailable for new creation while explaining that existing Practice activities can still be edited.
- The disabled Lesson from Template choice remains labelled **Coming later** and is associated with its explanatory text.

### Activity Ordering

- Up, Down, Duplicate, and Delete controls now include the activity title in their accessible names.
- Ordering controls retain correct first-item and last-item disabled states.
- These controls now have visible focus treatment, clearer spacing, and larger touch targets.
- Ordering remains fully available without drag-and-drop, and the existing button retains focus when its activity moves within the list.

### Responsive Layout

- The emoji grid now uses five columns at the narrowest width before expanding, preventing its minimum-size options from overflowing the dialog content area.
- Lesson choice and activity cards retain their existing single-column mobile layout and responsive multi-column layouts.
- Long dialog content continues to use the shared maximum viewport height and internal scrolling.
- Activity list actions wrap with additional spacing rather than forcing horizontal overflow.
- Existing course-address wrapping, breadcrumb wrapping, stacked page actions, and Lesson Studio desktop-to-mobile panel stacking were retained.

### Motion and Touch

- The mobile sidebar transition now respects reduced-motion preferences.
- The navigation trigger, sidebar close control, dialog close control, emoji options, lesson choice, activity choices, and activity actions have practical keyboard and touch targets.
- No workflow depends on animation, and no decorative motion was added.

## Keyboard Checklist

The following checks must be completed manually in a supported desktop browser:

- [ ] Open the Course form from the Dashboard, Courses header, Courses empty state, and Edit action.
- [ ] Confirm initial focus enters each dialog and Shift+Tab wraps to the final enabled control.
- [ ] Select every emoji with Tab and Space or Enter, and confirm the selected indication is understandable without color.
- [ ] Edit the title and course address, activate **Use title**, and submit with Enter.
- [ ] Close unchanged forms with Escape and confirm changed forms request confirmation.
- [ ] Open the mobile navigation, follow both destinations, close with Escape, and confirm focus returns to the menu trigger.
- [ ] Follow every breadcrumb and named Back action without browser-history dependence.
- [ ] Open New Lesson, choose Blank Lesson, return to the choices, and confirm unsaved-change protection.
- [ ] Open Add Activity, traverse all cards, confirm Practice and template controls remain disabled, and close with Escape.
- [ ] During activity creation, confirm Escape and backdrop clicks do not close the picker.
- [ ] Move the first, middle, and last activities with Up and Down and confirm focus stays on the activated control.
- [ ] Open Theory, Listening, Pronunciation, Quiz, Practice, and AI Speaking Mission editors using only the keyboard.

## Screen-Reader Checklist

Complete at least one pass with NVDA or another supported Windows screen reader:

- [ ] Confirm each dialog announces its title and description once.
- [ ] Confirm close buttons announce the relevant dialog title.
- [ ] Confirm breadcrumb navigation and the current page are announced correctly.
- [ ] Confirm required and optional form fields, hints, validation errors, and invalid states are understandable.
- [ ] Confirm Saving, Saved, Save failed, loading, and creation-error states are announced without excessive repetition.
- [ ] Confirm selected emoji, selected activity type, and selected Lesson Studio activity states are announced.
- [ ] Confirm disabled template and Practice explanations are discoverable and do not sound actionable.
- [ ] Confirm view-only explanations and lifecycle badges are understandable without relying on color.
- [ ] Confirm activity ordering buttons announce both the action and activity title.

## Responsive Viewport Checklist

Test with browser zoom at 100% and 200%, plus the following representative widths:

| Viewport | Checks |
| --- | --- |
| 320 × 568 | Dialog containment, five-column emoji grid, wrapped breadcrumbs, stacked actions, card text, and on-screen keyboard clearance. |
| 390 × 844 | Mobile navigation, lesson choices, activity cards, URL preview wrapping, and reachable dialog footer actions. |
| 768 × 1024 | Tablet dialog scrolling, course field grouping, two-column cards, page-header actions, and Lesson Studio panel stacking. |
| 1280 × 800 | Desktop sidebar, hierarchy context, three-column activity picker, sticky activity list, and editor focus movement. |

At every width, verify that long course, unit, lesson, and activity titles wrap without hiding actions or creating horizontal page scrolling.

## Known Limitations

- Focus containment, restoration timing, and successful activity-creation focus movement require browser verification. Static checks cannot prove the order of browser focus and React effect cleanup during dialog transitions.
- Screen-reader announcement order varies by browser and assistive technology and must be tested manually.
- On-screen mobile keyboard behavior and dynamic viewport resizing require physical-device or browser-device testing.
- The repository has no component-testing dependency, automated accessibility runner, or end-to-end browser suite. None was added during this audit.
- Drag-and-drop is intentionally unavailable. Activity ordering remains accessible through Up and Down controls.

## Conclusion

The code-level issues identified during the Sprint 35 audit have been remediated without changing product behavior or architecture. The remaining checks are interaction and rendering checks that require real browsers, assistive technology, viewport resizing, and mobile keyboard conditions before Sprint 35 receives final accessibility sign-off.
