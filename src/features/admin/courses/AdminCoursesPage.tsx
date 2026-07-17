import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import CourseForm from "./CourseForm";
import {
  createAdminCourse,
  deleteDraftCourse,
  listAdminCourses,
  updateAdminCourse,
  type AdminCourse,
  type CourseInput,
} from "./adminCourseService";
import { useAdminPermissions } from "../permissions/useAdminPermissions";

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | {
      mode: "edit";
      course: AdminCourse;
    };

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function AdminCoursesPage() {
  const { canEditDrafts } =
    useAdminPermissions();
  const [courses, setCourses] = useState<
    AdminCourse[]
  >([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [deletingCourseId, setDeletingCourseId] =
    useState<number | null>(null);
  const [formState, setFormState] =
    useState<FormState>({
      mode: "closed",
    });
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setCourses(await listAdminCourses());
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    void listAdminCourses()
      .then((loadedCourses) => {
        if (isActive) {
          setCourses(loadedCourses);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            getErrorMessage(error)
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const nextPosition = useMemo(
    () =>
      courses.length === 0
        ? 0
        : Math.max(
            ...courses.map(
              (course) => course.position
            )
          ) + 1,
    [courses]
  );

  async function handleSave(input: CourseInput) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (formState.mode === "edit") {
        const updatedCourse =
          await updateAdminCourse(
            formState.course.id,
            input
          );

        setCourses((current) =>
          current
            .map((course) =>
              course.id === updatedCourse.id
                ? updatedCourse
                : course
            )
            .sort(
              (first, second) =>
                first.position - second.position
            )
        );
      } else {
        const createdCourse =
          await createAdminCourse(input);
        setCourses((current) =>
          [...current, createdCourse].sort(
            (first, second) =>
              first.position - second.position
          )
        );
      }

      setFormState({ mode: "closed" });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(
    course: AdminCourse
  ) {
    if (
      !window.confirm(
        `Delete the draft course “${course.title}”? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingCourseId(course.id);
    setErrorMessage(null);

    try {
      await deleteDraftCourse(course.id);
      setCourses((current) =>
        current.filter(
          (item) => item.id !== course.id
        )
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingCourseId(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Content
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Courses
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Create and maintain the course catalog.
            Published content remains sealed.
          </p>
        </div>

        {canEditDrafts ? (
          <button
            type="button"
            onClick={() =>
              setFormState({ mode: "create" })
            }
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Create course
          </button>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
            View-only course access
          </p>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => void loadCourses()}
            className="font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p
            role="status"
            className="px-6 py-16 text-center text-slate-500"
          >
            Loading courses…
          </p>
        ) : courses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No courses yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Create the first draft course to get
              started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Course
                  </th>
                  <th className="px-4 py-4">
                    Level
                  </th>
                  <th className="px-4 py-4">
                    Position
                  </th>
                  <th className="px-4 py-4">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {courses.map((course) => {
                  const isDraft =
                    course.status === "draft";

                  return (
                    <tr
                      key={course.id}
                      className="align-top"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl"
                            aria-hidden="true"
                          >
                            {course.emoji || "📘"}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {course.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              /{course.slug}
                            </p>
                            {course.description && (
                              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm text-slate-600">
                        {course.level || "—"}
                      </td>
                      <td className="px-4 py-5 text-sm text-slate-600">
                        {course.position}
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                            isDraft
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800",
                          ].join(" ")}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/courses/${course.id}`}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            Manage
                          </Link>
                          {isDraft &&
                          canEditDrafts && (
                            <>
                            <button
                              type="button"
                              onClick={() =>
                                setFormState({
                                  mode: "edit",
                                  course,
                                })
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={
                                deletingCourseId ===
                                course.id
                              }
                              onClick={() =>
                                void handleDelete(
                                  course
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingCourseId ===
                              course.id
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formState.mode !== "closed" && (
        <CourseForm
          course={
            formState.mode === "edit"
              ? formState.course
              : null
          }
          nextPosition={nextPosition}
          isSaving={isSaving}
          onCancel={() =>
            setFormState({ mode: "closed" })
          }
          onSubmit={(input) =>
            void handleSave(input)
          }
        />
      )}
    </section>
  );
}

export default AdminCoursesPage;
