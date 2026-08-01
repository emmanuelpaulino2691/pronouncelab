# Design System

## Contents

- [Principles](#principles)
- [Tokens](#tokens)
- [Admin UI components](#admin-ui-components)
- [Patterns](#patterns)
- [Admin and student surfaces](#admin-and-student-surfaces)
- [Responsive behavior](#responsive-behavior)
- [Accessibility](#accessibility)

## Principles

PronounceLab should feel modern, academic, trustworthy, energetic, and suitable for adults. Visual hierarchy supports learning and authoring; decoration remains restrained.

- Use tokens instead of scattered arbitrary colors.
- Prefer clear surfaces, generous spacing, and readable line lengths.
- Show status and permission through text as well as color.
- Make loading, empty, error, read-only, and populated states explicit.
- Preserve familiar focus and browser semantics.

## Tokens

`src/index.css` defines the active visual token layer and shared Tailwind-compatible styles. It covers:

- primary blue and dark navy;
- page and card/surface backgrounds;
- primary/secondary text and borders;
- success, warning, danger, and information;
- radii, shadows, spacing, and transitions.

Use the existing CSS custom properties or established utility combinations. Do not introduce isolated hex palettes inside feature components.

Typography uses the application’s existing system stack. Avoid adding a font dependency without approval.

## Admin UI components

Canonical reusable components are exported from `src/features/admin/ui/index.ts`.

| Module | Components |
| --- | --- |
| `Button.tsx` | Button and icon-button patterns, variants, loading/disabled states |
| `Surface.tsx` | Card, StatCard, Badge, StatusIndicator, Alert, EmptyState, LoadingSkeleton, Avatar |
| `Page.tsx` | PageHeader, SectionHeader, Breadcrumbs |
| `Form.tsx` | FormField, TextInput, TextArea, Select |
| `AdminIcon.tsx` | Lightweight in-repository icon set |

Components are typed and use semantic elements. Prefer these over duplicating page-specific buttons, cards, badges, and form styles.

Not every suggested primitive exists: there is no general-purpose modal, tabs, tooltip, or dropdown component. Existing confirmation interactions use the current project pattern; do not document an absent component as available.

## Patterns

### Page hierarchy

Use a `PageHeader` for title/context/actions, `Breadcrumbs` for nested hierarchy, then cards or sections. The primary action appears once and respects permissions.

### Status

Use `Badge`/`StatusIndicator` with readable status text. Draft is editable only when both role and parent lifecycle allow it. Published, unpublished, and archived surfaces show a locked/read-only state.

### Forms

- every input has a label;
- required text is trimmed and whitespace-only values rejected;
- field errors sit near the control;
- Save is explicit for authoring;
- loading disables duplicate submission;
- success comes only from authoritative returned data.

### Feedback

Use skeletons for initial loads, `Alert` for actionable errors/read-only context, and `EmptyState` with permission-aware actions. Do not show sensitive raw database errors.

## Admin and student surfaces

Admin uses the newer tokenized component layer and a responsive sidebar/drawer. The sidebar includes product identity, Dashboard/Courses navigation, user email, derived permission label, and logout.

The Lesson Player uses focused learner-specific shell components and existing shared activity cards. AI Mission preview deliberately reuses the learner card in Studio. The broader legacy learner UI has not been fully migrated to admin primitives.

## Responsive behavior

- Desktop admin uses a fixed navigation region and flexible main content.
- Mobile admin navigation is dismissible by selection, overlay, and Escape.
- Forms stack; actions wrap rather than overflow.
- Data-heavy layouts become cards or safe horizontal regions.
- Lesson navigation uses a compact mobile header and sticky/tap-friendly controls.
- Long titles, IPA, and pasted text wrap.

Test wide desktop, laptop, tablet, and narrow mobile whenever layout changes.

## Accessibility

- Preserve visible `:focus-visible` states.
- Use semantic buttons and links; icon-only actions need accessible names.
- Do not encode meaning through color alone.
- Maintain contrast against surface tokens.
- Associate labels/errors with controls.
- Announce copy, save, auth, transition, and parse status where practical.
- Respect `prefers-reduced-motion`.
- Do not render pasted AI content as HTML.
## Teacher workspace states

Role-aware workspace navigation uses the existing visual system: clear active links, muted disabled future sections, readable role badges, and responsive cards. Future areas must communicate “Coming later” without behaving like links or presenting fabricated data. Primary actions remain reachable at narrow widths.

Course workspaces use the same card, tab, status, and action patterns as the dashboard. Overview is intentionally information-only where the current data contract does not provide counts; Curriculum remains the focused authoring surface.

## Classroom design direction

Learn block cards expose consistent Duplicate, Delete, Collapse, Move Up, and Move Down actions. Media blocks show explicit configured/missing states rather than empty placeholders. Destructive actions use confirmation only when content exists.

## Student Preview chrome

Preview uses a compact persistent banner with a clear Student Preview label and an Exit Preview action. Published previews are identified as published previews; draft indicators must only be shown when a real draft source is selected. The banner remains responsive and does not introduce learner editing controls.

Future classroom screens should reuse the existing workspace shell, cards, tabs, status badges, and empty-state language. Unavailable classroom areas must say that they are coming later and must not render fake counts, members, assignments, or progress. Join-code and enrollment controls will require explicit accessible states and security explanations when implemented.

The UI foundation provides reusable `ClassCard`, `ClassStatusBadge`, `EmptyClassesState`, `CreateClassForm`, and `ClassWorkspaceLayout` patterns. Production pages receive backend data only when classroom contracts exist; the current My Classes page intentionally renders an empty state.
## Learn block interaction

Learn block cards expose a dedicated drag handle plus visible Move Up and Move Down fallbacks. Controls use block-specific accessible names, minimum touch-friendly heights, disabled boundary states, focus restoration, and a polite reorder announcement. Populated destructive actions use the shared accessible confirmation dialog.

Collapsed cards retain the block type, first meaningful content or media filename, and incomplete-state warning. Collapse All and Expand All support long lessons without persisting personal presentation state.

Student Preview device controls are an accessible pressed-button group. Desktop uses the available width, Tablet is constrained to approximately 768 px, and Phone to approximately 390 px; the toolbar remains full-width and usable.

Constrained preview widths also force the matching learner layout. Phone and Tablet replace the fixed outline sidebar with a labeled activity selector so the activity card retains the full available width. The Lesson Studio workspace toolbar consistently exposes Editor only, Split preview, Collapse All, and Expand All. Section actions are disabled with an accessible explanation when the selected editor has no registered collapsible sections. Activity-level collapse is separate from section/block collapse and reports its state with `aria-expanded`.

Internal editor sections use the shared collapsible-section surface. Each header names the section, exposes a keyboard-operable toggle with `aria-expanded` and `aria-controls`, and replaces expanded content with a concise status and visible validation warning. Collapse All and Expand All keep focus on the initiating workspace button and announce the affected section count through an `aria-live` region. Section content stays mounted while hidden to preserve unsaved form state.

Media Library filters wrap into a responsive toolbar, use semantic tabs, and preserve supported query state in the URL. Media cards identify their kind and metadata without relying on color, resolve previews independently, and keep one failed preview local. The shared Media Picker uses the standard focus-trapping/restoring Dialog and remains usable at phone width. Unsupported destructive actions are disabled or omitted; direct-upload controls remain visually and behaviorally distinct.
