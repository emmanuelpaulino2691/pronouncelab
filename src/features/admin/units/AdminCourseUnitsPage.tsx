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
  createAdminUnit,
  deleteDraftUnit,
  listAdminUnits,
  updateAdminUnit,
  type AdminUnit,
} from "./adminUnitService";

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; unit: AdminUnit };

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

type CourseUnitsContentProps = {
  courseId: number;
};

function CourseUnitsContent({
  courseId,
}: CourseUnitsContentProps) {
  const { canEditDrafts } =
    useAdminPermissions();
  const isActiveRef = useRef(true);
  const [course, setCourse] =
    useState<AdminCourse | null>(null);
  const [units, setUnits] = useState<
    AdminUnit[]
  >([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [deletingUnitId, setDeletingUnitId] =
    useState<number | null>(null);
  const [formState, setFormState] =
    useState<FormState>({ mode: "closed" });
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadHierarchy = useCallback(async () => {
    setIsLoading(true);
    setCourse(null);
    setUnits([]);
    setFormState({ mode: "closed" });
    setErrorMessage(null);

    try {
      const [loadedCourse, loadedUnits] =
        await Promise.all([
          getAdminCourse(courseId),
          listAdminUnits(courseId),
        ]);
      if (isActiveRef.current) {
        setCourse(loadedCourse);
        setUnits(loadedUnits);
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
  }, [courseId]);

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      getAdminCourse(courseId),
      listAdminUnits(courseId),
    ])
      .then(([loadedCourse, loadedUnits]) => {
        if (isActive) {
          setCourse(loadedCourse);
          setUnits(loadedUnits);
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
  }, [courseId]);

  const nextPosition = useMemo(
    () =>
      units.length === 0
        ? 0
        : Math.max(
            ...units.map((unit) => unit.position)
          ) + 1,
    [units]
  );

  async function handleSave(
    input: HierarchyItemInput
  ) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (formState.mode === "edit") {
        const updatedUnit = await updateAdminUnit(
          formState.unit.id,
          courseId,
          input
        );
        if (
          isActiveRef.current &&
          updatedUnit.courseId === courseId
        ) {
          setUnits((current) =>
            current
              .map((unit) =>
                unit.id === updatedUnit.id
                  ? updatedUnit
                  : unit
              )
              .sort(
                (first, second) =>
                  first.position -
                  second.position
              )
          );
        }
      } else {
        const createdUnit = await createAdminUnit(
          courseId,
          input
        );
        if (
          isActiveRef.current &&
          createdUnit.courseId === courseId
        ) {
          setUnits((current) =>
            [...current, createdUnit].sort(
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

  async function handleDelete(unit: AdminUnit) {
    if (
      !window.confirm(
        `Delete the draft unit "${unit.title}"? This also removes its draft descendants.`
      )
    ) {
      return;
    }

    setDeletingUnitId(unit.id);
    setErrorMessage(null);

    try {
      await deleteDraftUnit(unit.id, courseId);
      if (isActiveRef.current) {
        setUnits((current) =>
          current.filter(
            (item) => item.id !== unit.id
          )
        );
      }
    } catch (error) {
      if (isActiveRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isActiveRef.current) {
        setDeletingUnitId(null);
      }
    }
  }

  if (isLoading) {
    return (
      <p
        role="status"
        className="py-16 text-center text-slate-500"
      >
        Loading course hierarchy…
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
        <span>{course?.title ?? "Course"}</span>
      </nav>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Course → Units
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {course?.emoji} {course?.title ?? "Course"}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {course?.description ||
              "Manage the units in this course."}
          </p>
        </div>

        {canEditDrafts &&
        course?.status === "draft" ? (
          <button
            type="button"
            onClick={() =>
              setFormState({ mode: "create" })
            }
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Create unit
          </button>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
            {course?.status === "draft"
              ? "View-only unit access"
              : "Course is sealed; units are read only"}
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

      <div className="mt-8 grid gap-4">
        {units.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">
              No units yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add the first draft unit to this course.
            </p>
          </div>
        ) : (
          units.map((unit) => {
            const isDraft =
              unit.status === "draft";

            return (
              <article
                key={unit.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-slate-400">
                        {unit.position + 1}
                      </span>
                      <h2 className="text-xl font-bold text-slate-950">
                        {unit.title}
                      </h2>
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                          isDraft
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800",
                        ].join(" ")}
                      >
                        {unit.status}
                      </span>
                    </div>
                    {unit.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {unit.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/courses/${courseId}/units/${unit.id}`}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Manage lessons
                    </Link>
                    {isDraft &&
                      canEditDrafts &&
                      course?.status === "draft" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setFormState({
                                mode: "edit",
                                unit,
                              })
                            }
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={
                              deletingUnitId === unit.id
                            }
                            onClick={() =>
                              void handleDelete(unit)
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingUnitId === unit.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        </>
                      )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {formState.mode !== "closed" && (
        <HierarchyItemForm
          itemType="unit"
          item={
            formState.mode === "edit"
              ? formState.unit
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

function AdminCourseUnitsPage() {
  const { courseId: courseIdParam } = useParams();
  const courseId = parseId(courseIdParam);

  if (!courseId) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">
          Invalid course
        </h1>
        <p className="mt-3 text-slate-600">
          The course URL is not valid.
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
    <CourseUnitsContent
      key={courseId}
      courseId={courseId}
    />
  );
}

export default AdminCourseUnitsPage;
