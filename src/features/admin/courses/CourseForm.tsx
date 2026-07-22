import {
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Alert,
  Button,
  Dialog,
  FormField,
  StatusBadge,
  TextArea,
  TextInput,
  shouldProceedWithClose,
} from "../ui";
import type { AdminCourse, CourseInput } from "./adminCourseService";
import { EmojiSelector } from "./EmojiSelector";
import {
  areCourseInputsEqual,
  createCourseSlugState,
  resetSlugToTitle,
  setManualSlug,
  updateSlugForTitle,
} from "./courseFormState";
import { buildCourseUrlPreview } from "./courseFormUtils";

type CourseFormProps = {
  course: AdminCourse | null;
  nextPosition: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (input: CourseInput) => void;
};

const fallbackEmoji = "📘";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getInitialInput(course: AdminCourse | null, nextPosition: number): CourseInput {
  return course
    ? {
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
        emoji: course.emoji,
        position: course.position,
      }
    : {
        slug: "",
        title: "",
        description: "",
        level: "",
        emoji: fallbackEmoji,
        position: nextPosition,
      };
}

function CourseForm({
  course,
  nextPosition,
  isSaving,
  errorMessage,
  onCancel,
  onSubmit,
}: CourseFormProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [initialInput] = useState(() => getInitialInput(course, nextPosition));
  const [input, setInput] = useState(initialInput);
  const [slugState, setSlugState] = useState(() =>
    createCourseSlugState(initialInput.slug, Boolean(course))
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [touched, setTouched] = useState({ title: false, slug: false });

  const titleError = input.title.trim() ? "" : "Add a course title.";
  const slugError = !input.slug.trim()
    ? "Add a course address."
    : slugPattern.test(input.slug.trim())
      ? ""
      : "Use lowercase letters, numbers, and single hyphens only.";
  const showTitleError = Boolean((attemptedSubmit || touched.title) && titleError);
  const showSlugError = Boolean((attemptedSubmit || touched.slug) && slugError);
  const hasUnsavedChanges = !areCourseInputsEqual(input, initialInput);

  function requestClose() {
    if (
      shouldProceedWithClose(
        { hasUnsavedChanges },
        () => window.confirm("Discard your unsaved course changes?")
      )
    ) {
      onCancel();
    }
  }

  function handleTitleChange(title: string) {
    const nextSlugState = updateSlugForTitle(slugState, title);
    setSlugState(nextSlugState);
    setInput((current) => ({ ...current, title, slug: nextSlugState.slug }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    if (isSaving || titleError || slugError) return;

    onSubmit({
      ...input,
      slug: input.slug.trim(),
      title: input.title.trim(),
      description: input.description.trim(),
      level: input.level.trim(),
      emoji: input.emoji.trim(),
    });
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={requestClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button type="submit" form={formId} isLoading={isSaving} disabled={isSaving}>
        {isSaving ? "Saving…" : course ? "Save course changes" : "Create draft course"}
      </Button>
    </>
  );

  return (
    <Dialog
      isOpen
      onClose={requestClose}
      preventClose={isSaving}
      initialFocusRef={titleRef}
      title={course ? `Edit ${course.title}` : "Create a course"}
      description="Set the course identity, learning details, and address. You can continue building the curriculum after saving."
      footer={footer}
      className="max-w-3xl"
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-7">
        {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

        <section aria-labelledby={`${formId}-identity`}>
          <div className="mb-4">
            <h3 id={`${formId}-identity`} className="text-base font-bold text-slate-950">
              Course identity
            </h3>
            <p className="mt-1 text-sm text-slate-600">Give teachers and learners a clear way to recognize the course.</p>
          </div>
          <div className="space-y-5">
            <FormField
              label="Course title"
              htmlFor={`${formId}-title`}
              required
              hint="Use a short, specific title that describes the learning focus."
              error={showTitleError ? titleError : undefined}
            >
              <TextInput
                ref={titleRef}
                id={`${formId}-title`}
                required
                value={input.title}
                onBlur={() => setTouched((current) => ({ ...current, title: true }))}
                onChange={(event) => handleTitleChange(event.target.value)}
                aria-invalid={showTitleError}
                aria-describedby={`${formId}-title-${showTitleError ? "error" : "hint"}`}
                placeholder="English Pronunciation"
              />
            </FormField>
            <EmojiSelector
              value={input.emoji}
              onChange={(emoji) => setInput((current) => ({ ...current, emoji }))}
              disabled={isSaving}
            />
          </div>
        </section>

        <section className="border-t border-slate-200 pt-6" aria-labelledby={`${formId}-details`}>
          <div className="mb-4">
            <h3 id={`${formId}-details`} className="text-base font-bold text-slate-950">Course details</h3>
            <p className="mt-1 text-sm text-slate-600">Describe the learning experience and its intended level.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Description (optional)" htmlFor={`${formId}-description`} hint="Explain what learners will understand or practise.">
              <TextArea
                id={`${formId}-description`}
                aria-describedby={`${formId}-description-hint`}
                value={input.description}
                onChange={(event) => setInput((current) => ({ ...current, description: event.target.value }))}
                placeholder="What learners will achieve in this course."
              />
            </FormField>
            <FormField label="Level (optional)" htmlFor={`${formId}-level`} hint="For example: Beginner, Intermediate, or All levels.">
              <TextInput
                id={`${formId}-level`}
                aria-describedby={`${formId}-level-hint`}
                value={input.level}
                onChange={(event) => setInput((current) => ({ ...current, level: event.target.value }))}
                placeholder="Beginner"
              />
            </FormField>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-6" aria-labelledby={`${formId}-address`}>
          <div className="mb-4">
            <h3 id={`${formId}-address`} className="text-base font-bold text-slate-950">Course address</h3>
            <p className="mt-1 text-sm text-slate-600">Choose the readable path that will identify this course.</p>
          </div>
          <FormField
            label="Course address"
            htmlFor={`${formId}-slug`}
            required
            hint="Use lowercase letters, numbers, and hyphens."
            error={showSlugError ? slugError : undefined}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextInput
                id={`${formId}-slug`}
                required
                value={input.slug}
                onBlur={() => setTouched((current) => ({ ...current, slug: true }))}
                onChange={(event) => {
                  const next = setManualSlug(event.target.value);
                  setSlugState(next);
                  setInput((current) => ({ ...current, slug: next.slug }));
                }}
                aria-invalid={showSlugError}
                aria-describedby={`${formId}-slug-${showSlugError ? "error" : "hint"}`}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="english-pronunciation"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  const next = resetSlugToTitle(input.title);
                  setSlugState(next);
                  setInput((current) => ({ ...current, slug: next.slug }));
                }}
              >
                Use title
              </Button>
            </div>
          </FormField>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address preview</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-800">
              {buildCourseUrlPreview(input.slug)}
            </p>
            <p className="mt-1 text-xs text-slate-500">This preview does not publish the course.</p>
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 border-t border-slate-200 pt-6" aria-label="Course status">
          <div>
            <p className="text-sm font-semibold text-slate-800">Status</p>
            <p className="mt-1 text-xs text-slate-500">Publishing is managed separately from saving course details.</p>
          </div>
          <StatusBadge status={course?.status ?? "draft"} />
        </section>
      </form>
    </Dialog>
  );
}

export default CourseForm;
