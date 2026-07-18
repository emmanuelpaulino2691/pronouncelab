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
import { Alert, Badge, Button, ButtonLink, Card, EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from "../ui";
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
      <div role="status" className="space-y-5 py-8">
        <LoadingSkeleton className="h-10 w-64" />
        <LoadingSkeleton className="h-28" />
        <LoadingSkeleton className="h-28" />
        <span className="sr-only">Loading course hierarchy…</span>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Course curriculum"
        title={`${course?.emoji || "📘"} ${course?.title ?? "Course"}`}
        description={course?.description || "Manage the ordered units in this course."}
        breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course?.title ?? "Course" }]}
        meta={course ? <StatusBadge status={course.status} /> : undefined}
        actions={canEditDrafts && course?.status === "draft" ? <Button icon="plus" onClick={() => setFormState({ mode: "create" })}>Create unit</Button> : undefined}
      />
      {(!canEditDrafts || course?.status !== "draft") && <div className="mt-5"><Alert>{course?.status === "draft" ? "Your role has view-only access to draft units." : "This course is sealed. Its unit curriculum is read only."}</Alert></div>}

      {errorMessage && (
        <div className="mt-6"><Alert tone="error" action={<Button variant="secondary" onClick={() => void loadHierarchy()}>Try again</Button>}>{errorMessage}</Alert></div>
      )}

      <div className="mt-8 grid gap-4">
        {units.length === 0 ? (
          <EmptyState title="No units yet" description="Add the first draft unit to begin shaping this curriculum." action={canEditDrafts && course?.status === "draft" ? <Button icon="plus" onClick={() => setFormState({ mode: "create" })}>Create unit</Button> : undefined} />
        ) : (
          units.map((unit) => {
            const isDraft =
              unit.status === "draft";

            return (
              <Card
                key={unit.id}
                className="p-5 transition hover:border-blue-200 sm:p-6"
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
                      <Badge tone={isDraft ? "draft" : "success"}>{unit.status}</Badge>
                    </div>
                    {unit.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {unit.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ButtonLink to={`/admin/courses/${courseId}/units/${unit.id}`}>
                      Manage lessons
                    </ButtonLink>
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
              </Card>
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
