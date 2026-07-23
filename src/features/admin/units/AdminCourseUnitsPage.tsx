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
import { Alert, Badge, Button, ButtonLink, Card, ConfirmDeleteDialog, EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from "../ui";
import {
  beginDeleteConfirmation,
  cancelDeleteConfirmation,
  completeDeleteConfirmation,
  createDeleteConfirmationState,
  failDeleteConfirmation,
  openDeleteConfirmation,
} from "../ui/deleteConfirmationState";
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
  const saveInFlightRef = useRef(false);
  const deleteInFlightRef = useRef(false);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState(
    createDeleteConfirmationState<AdminUnit>
  );
  const [formState, setFormState] =
    useState<FormState>({ mode: "closed" });
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] =
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
    } catch {
      if (isActiveRef.current) {
        setErrorMessage("We couldn’t load this curriculum. Try again.");
      }
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [courseId]);

  useEffect(() => {
    isActiveRef.current = true;
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
      .catch(() => {
        if (isActive) {
          setErrorMessage("We couldn’t load this curriculum. Try again.");
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
    if (formState.mode === "closed" || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setIsSaving(true);
    setFormErrorMessage(null);

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
    } catch {
      if (isActiveRef.current) {
        setFormErrorMessage("The unit could not be saved. Your changes are still here. Try again.");
      }
    } finally {
      saveInFlightRef.current = false;
      if (isActiveRef.current) {
        setIsSaving(false);
      }
    }
  }

  async function handleDelete(unit: AdminUnit) {
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    setDeleteConfirmation((current) => beginDeleteConfirmation(current));
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
        setDeleteConfirmation(completeDeleteConfirmation());
      }
    } catch {
      if (isActiveRef.current) {
        setErrorMessage("The unit could not be deleted. It is still available. Try again.");
        setDeleteConfirmation((current) => failDeleteConfirmation(current));
      }
    } finally {
      deleteInFlightRef.current = false;
      if (isActiveRef.current) {
        setDeletingUnitId(null);
      }
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl" aria-busy="true">
        <PageHeader
          title="Loading curriculum"
          description="Preparing the course and its units."
          breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: "Loading curriculum" }]}
          actions={<ButtonLink icon="arrow-left" variant="secondary" to="/admin/courses">Back to courses</ButtonLink>}
        />
        <div role="status" className="mt-8 space-y-5">
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
          <span className="sr-only">Loading course curriculum…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Course curriculum"
        title={`${course?.emoji || "📘"} ${course?.title ?? "Course"} curriculum`}
        description={course?.description || "Manage the ordered units in this course."}
        breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course?.title ?? "Course" }]}
        meta={course ? <StatusBadge status={course.status} /> : undefined}
        actions={<><ButtonLink icon="arrow-left" variant="secondary" to="/admin/courses">Back to courses</ButtonLink>{canEditDrafts && course?.status === "draft" && <Button icon="plus" onClick={() => { setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create unit</Button>}</>}
      />
      {(!canEditDrafts || course?.status !== "draft") && <div className="mt-5"><Alert>{course?.status === "draft" ? "You can view this curriculum, but your role does not allow editing draft units." : "You can view this curriculum, but editing is unavailable because the course is no longer a draft."}</Alert></div>}

      {errorMessage && (
        <div className="mt-6"><Alert tone="error" action={<Button variant="secondary" onClick={() => void loadHierarchy()}>Try again</Button>}>{errorMessage}</Alert></div>
      )}

      <div className="mt-8 grid gap-4">
        {units.length === 0 ? (
          <EmptyState title="No units yet" description={canEditDrafts && course?.status === "draft" ? "Create the first unit to begin shaping this curriculum." : "This course does not contain any units to view."} action={canEditDrafts && course?.status === "draft" ? <Button icon="plus" onClick={() => { setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create unit</Button> : undefined} />
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
                            onClick={() => {
                              setFormErrorMessage(null);
                              setFormState({
                                mode: "edit",
                                unit,
                              });
                            }}
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
                              { setErrorMessage(null); setDeleteConfirmation(openDeleteConfirmation(unit)); }
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
          errorMessage={formErrorMessage}
          onCancel={() => {
            setFormErrorMessage(null);
            setFormState({ mode: "closed" });
          }}
          onSubmit={(input) =>
            void handleSave(input)
          }
        />
      )}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmation.target !== null}
        title="Delete unit"
        description={deleteConfirmation.target ? `Delete “${deleteConfirmation.target.title}” and its draft lessons?` : ""}
        isDeleting={deleteConfirmation.pending}
        errorMessage={deleteConfirmation.target ? errorMessage : null}
        onCancel={() => setDeleteConfirmation((current) => cancelDeleteConfirmation(current))}
        onConfirm={() => { if (deleteConfirmation.target) void handleDelete(deleteConfirmation.target); }}
      />
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
