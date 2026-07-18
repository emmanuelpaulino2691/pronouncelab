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
