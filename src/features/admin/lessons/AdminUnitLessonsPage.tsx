import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import HierarchyItemForm, {
  type HierarchyItemInput,
} from "../components/HierarchyItemForm";
import {
  getAdminCourse,
  type AdminCourse,
} from "../courses/adminCourseService";
import { useAdminPermissions } from "../permissions/useAdminPermissions";
import {
  getAdminUnit,
  type AdminUnit,
} from "../units/adminUnitService";
import {
  createAdminLesson,
  deleteDraftLesson,
  listAdminLessons,
  updateAdminLesson,
  type AdminLesson,
} from "./adminLessonService";

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; lesson: AdminLesson };

type LoadedHierarchy = {
  course: AdminCourse;
  unit: AdminUnit;
  lessons: AdminLesson[];
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

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

async function getHierarchy(
  courseId: number,
  unitId: number
): Promise<LoadedHierarchy> {
  const [course, unit] = await Promise.all([
    getAdminCourse(courseId),
    getAdminUnit(unitId, courseId),
  ]);
  const lessons = await listAdminLessons(unit.id);

  return { course, unit, lessons };
}

type UnitLessonsContentProps = {
  courseId: number;
  unitId: number;
};

function UnitLessonsContent({
  courseId,
  unitId,
}: UnitLessonsContentProps) {
  const { canEditDrafts } =
    useAdminPermissions();
  const isActiveRef = useRef(true);
  const [course, setCourse] =
    useState<AdminCourse | null>(null);
  const [unit, setUnit] =
    useState<AdminUnit | null>(null);
  const [lessons, setLessons] = useState<
    AdminLesson[]
  >([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [
    deletingLessonId,
    setDeletingLessonId,
  ] = useState<number | null>(null);
  const [formState, setFormState] =
    useState<FormState>({ mode: "closed" });
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const applyHierarchy = useCallback(
    (hierarchy: LoadedHierarchy) => {
      setCourse(hierarchy.course);
      setUnit(hierarchy.unit);
      setLessons(hierarchy.lessons);
    },
    []
  );

  const loadHierarchy = useCallback(async () => {
    setIsLoading(true);
    setCourse(null);
    setUnit(null);
    setLessons([]);
    setFormState({ mode: "closed" });
    setErrorMessage(null);

    try {
      const hierarchy = await getHierarchy(
        courseId,
        unitId
      );
      if (isActiveRef.current) {
        applyHierarchy(hierarchy);
      }
    } catch (error) {
      if (isActiveRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyHierarchy, courseId, unitId]);

  useEffect(() => {
    let isActive = true;

    void getHierarchy(courseId, unitId)
      .then((hierarchy) => {
        if (isActive) {
          applyHierarchy(hierarchy);
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
      isActiveRef.current = false;
    };
  }, [applyHierarchy, courseId, unitId]);

  const nextPosition = useMemo(
    () =>
      lessons.length === 0
        ? 0
        : Math.max(
            ...lessons.map(
              (lesson) => lesson.position
            )
          ) + 1,
    [lessons]
  );

  async function handleSave(
    input: HierarchyItemInput
  ) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (formState.mode === "edit") {
        const updatedLesson =
          await updateAdminLesson(
            formState.lesson.id,
            unitId,
            input
          );
        if (
          isActiveRef.current &&
          updatedLesson.unitId === unitId
        ) {
          setLessons((current) =>
            current
              .map((lesson) =>
                lesson.id === updatedLesson.id
                  ? updatedLesson
                  : lesson
              )
              .sort(
                (first, second) =>
                  first.position -
                  second.position
              )
          );
        }
      } else {
        const createdLesson =
          await createAdminLesson(
            unitId,
            input
          );
        if (
          isActiveRef.current &&
          createdLesson.unitId === unitId
        ) {
          setLessons((current) =>
            [...current, createdLesson].sort(
              (first, second) =>
                first.position -
                second.position
            )
          );
        }
      }

      if (isActiveRef.current) {
        setFormState({ mode: "closed" });
      }
    } catch (error) {
      if (isActiveRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isActiveRef.current) {
        setIsSaving(false);
      }
    }
  }

  async function handleDelete(
    lesson: AdminLesson
  ) {
    if (
      !window.confirm(
        `Delete the draft lesson "${lesson.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingLessonId(lesson.id);
    setErrorMessage(null);

    try {
      await deleteDraftLesson(
        lesson.id,
        unitId
      );
      if (isActiveRef.current) {
        setLessons((current) =>
          current.filter(
            (item) => item.id !== lesson.id
          )
        );
      }
    } catch (error) {
      if (isActiveRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isActiveRef.current) {
        setDeletingLessonId(null);
      }
    }
  }

  if (isLoading) {
    return (
      <p
        role="status"
        className="py-16 text-center text-slate-500"
      >
        Loading unit hierarchy…
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <Link
          to="/admin/courses"
          className="font-medium text-blue-700 hover:underline"
        >
          Courses
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/admin/courses/${courseId}`}
          className="font-medium text-blue-700 hover:underline"
        >
          {course?.title ?? "Course"}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{unit?.title ?? "Unit"}</span>
      </nav>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Course → Units → Lessons
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {unit?.title ?? "Unit"}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {unit?.description ||
              "Manage the lessons in this unit."}
          </p>
        </div>

        {canEditDrafts &&
        course?.status === "draft" &&
        unit?.status === "draft" ? (
          <button
            type="button"
            onClick={() =>
              setFormState({ mode: "create" })
            }
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Create lesson
          </button>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
            {course?.status === "draft" &&
            unit?.status === "draft"
              ? "View-only lesson access"
              : "Parent hierarchy is sealed; lessons are read only"}
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
            onClick={() => void loadHierarchy()}
            className="font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {lessons.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No lessons yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add the first draft lesson to this unit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Lesson
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
                {lessons.map((lesson) => {
                  const isDraft =
                    lesson.status === "draft";

                  return (
                    <tr key={lesson.id}>
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            {lesson.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-5 text-sm text-slate-600">
                        {lesson.position}
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                            isDraft
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800",
                          ].join(" ")}
                        >
                          {lesson.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/courses/${courseId}/units/${unitId}/lessons/${lesson.id}/studio`}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            Studio
                          </Link>
                        {isDraft &&
                        canEditDrafts &&
                        course?.status === "draft" &&
                        unit?.status === "draft" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setFormState({
                                  mode: "edit",
                                  lesson,
                                })
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={
                                deletingLessonId ===
                                lesson.id
                              }
                              onClick={() =>
                                void handleDelete(
                                  lesson
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingLessonId ===
                              lesson.id
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </>
                        ) : (
                          <span className="self-center text-sm text-slate-400">
                            View only
                          </span>
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
        <HierarchyItemForm
          itemType="lesson"
          item={
            formState.mode === "edit"
              ? formState.lesson
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

function AdminUnitLessonsPage() {
  const {
    courseId: courseIdParam,
    unitId: unitIdParam,
  } = useParams();
  const courseId = parseId(courseIdParam);
  const unitId = parseId(unitIdParam);

  if (!courseId || !unitId) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">
          Invalid hierarchy
        </h1>
        <p className="mt-3 text-slate-600">
          The course or unit URL is not valid.
        </p>
        <Link
          to="/admin/courses"
          className="mt-6 inline-flex font-semibold text-blue-700 hover:underline"
        >
          Return to courses
        </Link>
      </section>
    );
  }

  return (
    <UnitLessonsContent
      key={`${courseId}:${unitId}`}
      courseId={courseId}
      unitId={unitId}
    />
  );
}

export default AdminUnitLessonsPage;
