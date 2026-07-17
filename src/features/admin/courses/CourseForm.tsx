import {
  useState,
  type FormEvent,
} from "react";

import type {
  AdminCourse,
  CourseInput,
} from "./adminCourseService";

type CourseFormProps = {
  course: AdminCourse | null;
  nextPosition: number;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (input: CourseInput) => void;
};

const emptyInput: CourseInput = {
  slug: "",
  title: "",
  description: "",
  level: "",
  emoji: "",
  position: 0,
};

function CourseForm({
  course,
  nextPosition,
  isSaving,
  onCancel,
  onSubmit,
}: CourseFormProps) {
  const [input, setInput] =
    useState<CourseInput>(() =>
      course
        ? {
            slug: course.slug,
            title: course.title,
            description: course.description,
            level: course.level,
            emoji: course.emoji,
            position: course.position,
          }
        : {
            ...emptyInput,
            position: nextPosition,
          }
    );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    onSubmit({
      ...input,
      slug: input.slug.trim(),
      title: input.title.trim(),
      description: input.description.trim(),
      level: input.level.trim(),
      emoji: input.emoji.trim(),
    });
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-form-title"
        className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              {course ? "Edit draft" : "New course"}
            </p>
            <h2
              id="course-form-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {course
                ? `Edit ${course.title}`
                : "Create a course"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close course form"
            className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ×
          </button>
        </div>

        <form
          className="mt-7 grid gap-5 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <label className="text-sm font-semibold text-slate-700">
            Title
            <input
              required
              autoFocus
              value={input.title}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className={fieldClass}
              placeholder="English Pronunciation"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Slug
            <input
              required
              value={input.slug}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  slug: event.target.value,
                }))
              }
              className={fieldClass}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Use lowercase letters, numbers, and single hyphens."
              placeholder="english-pronunciation"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Level
            <input
              value={input.level}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  level: event.target.value,
                }))
              }
              className={fieldClass}
              placeholder="Beginner"
            />
          </label>

          <div className="grid grid-cols-[1fr_2fr] gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Emoji
              <input
                value={input.emoji}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    emoji: event.target.value,
                  }))
                }
                className={fieldClass}
                maxLength={8}
                placeholder="🎙️"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Position
              <input
                required
                type="number"
                min={0}
                value={input.position}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    position: Number(
                      event.target.value
                    ),
                  }))
                }
                className={fieldClass}
              />
            </label>
          </div>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              value={input.description}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={`${fieldClass} min-h-28 resize-y`}
              placeholder="What learners will achieve in this course."
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving…"
                : course
                  ? "Save changes"
                  : "Create draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CourseForm;
