import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";

import HierarchyItemForm, {
  type HierarchyItemInput,
} from "../components/HierarchyItemForm";
import {
  getAdminCourse,
  duplicateDraftCourse,
  isMissingCoursePublicationRpcError,
  publishAdminCourse,
  type AdminCourse,
} from "../courses/adminCourseService";
import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { ContentOperationDialog, PublicationStatusBadge, QuickActionsMenu, UnavailableOperationDialog } from "../content-operations";
import { Alert, Button, ButtonLink, Card, ConfirmDeleteDialog, EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from "../ui";
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
import { buildStudentPreviewUrl } from "../preview/previewNavigation";
import { publicationFunctionErrorMessage } from "../lesson-studio/publicationErrors";
import { canCreateDraftUnit, canEditDraftUnit } from "../hierarchyAuthoring";

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
  const { canEditDrafts, canPublish, canViewAllCourses } =
    useAdminPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "curriculum" ? "curriculum" : "overview";
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
  const [duplicateUnit, setDuplicateUnit] = useState<AdminUnit | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState("");
  const [unavailableOperation, setUnavailableOperation] = useState<string | null>(null);
  const [draggedUnitId, setDraggedUnitId] = useState<number | null>(null);
  const [dropUnitId, setDropUnitId] = useState<number | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(
    createDeleteConfirmationState<AdminUnit>
  );
  const [formState, setFormState] =
    useState<FormState>({ mode: "closed" });
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] =
    useState<string | null>(null);
  const [workspaceActionMessage, setWorkspaceActionMessage] = useState<string | null>(null);
  const [workspaceActionPending, setWorkspaceActionPending] = useState(false);

  function selectTab(tab: "overview" | "curriculum") {
    setSearchParams(tab === "overview" ? {} : { tab });
  }

  async function handleWorkspacePublish() {
    if (!course || workspaceActionPending) return;
    setWorkspaceActionPending(true);
    setWorkspaceActionMessage(null);
    try {
      const result = await publishAdminCourse(course.id);
      setWorkspaceActionMessage(result.ok ? "Course published successfully." : `Course cannot be published. ${result.errors.length} issue${result.errors.length === 1 ? "" : "s"} need attention.`);
      if (result.ok) await loadHierarchy();
    } catch (error) {
      setWorkspaceActionMessage(isMissingCoursePublicationRpcError(error) ? "Course publishing is unavailable until the publication service is deployed." : await publicationFunctionErrorMessage(error));
    } finally {
      setWorkspaceActionPending(false);
    }
  }

  async function handleWorkspaceDuplicate() {
    if (!course || workspaceActionPending) return;
    setWorkspaceActionPending(true);
    setWorkspaceActionMessage(null);
    try {
      const duplicated = await duplicateDraftCourse(course.id);
      navigate(`/admin/courses/${duplicated.id}`);
    } catch {
      setWorkspaceActionMessage("The course could not be duplicated. Try again.");
    } finally {
      setWorkspaceActionPending(false);
    }
  }

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
  const canCreateUnit = canCreateDraftUnit(canEditDrafts, course?.status ?? null);

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
        eyebrow="Course Workspace"
        title={`${course?.emoji || "📘"} ${course?.title ?? "Course"} curriculum`}
        description={course?.description || "Manage this course and its learning content."}
        breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course?.title ?? "Course" }]}
        meta={course ? <StatusBadge status={course.status} /> : undefined}
        actions={<><ButtonLink icon="arrow-left" variant="secondary" to="/admin/courses">Back to courses</ButtonLink><ButtonLink variant="secondary" to={buildStudentPreviewUrl({ courseId, returnTo: `${location.pathname}${location.search}` })}>Preview as Student</ButtonLink>{activeTab !== "curriculum" && <ButtonLink variant="secondary" to="?tab=curriculum">Open curriculum</ButtonLink>}{canPublish && course?.status !== "archived" && <Button type="button" isLoading={workspaceActionPending} onClick={() => void handleWorkspacePublish()}>{course?.status === "published" ? "Publish updates" : "Publish Course"}</Button>}{canEditDrafts && course?.status === "draft" && <Button type="button" variant="secondary" isLoading={workspaceActionPending} onClick={() => void handleWorkspaceDuplicate()}>Duplicate Course</Button>}{activeTab === "curriculum" && canCreateUnit && <Button icon="plus" onClick={() => { setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create unit</Button>}</>}
      />
      {workspaceActionMessage && <div className="mt-5"><Alert tone={workspaceActionMessage.startsWith("Course published") ? "info" : "error"}>{workspaceActionMessage}</Alert></div>}
      <nav aria-label="Course workspace" className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200">
        <button type="button" onClick={() => selectTab("overview")} aria-current={activeTab === "overview" ? "page" : undefined} className={`admin-focus whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === "overview" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>Overview</button>
        <button type="button" onClick={() => selectTab("curriculum")} aria-current={activeTab === "curriculum" ? "page" : undefined} className={`admin-focus whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === "curriculum" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>Curriculum</button>
      </nav>
      {activeTab === "overview" && <div className="mt-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p><p className="mt-2 font-semibold text-slate-900">{canViewAllCourses ? "Platform course" : "My course"}</p></Card>
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p><div className="mt-2"><StatusBadge status={course?.status ?? "draft"} /></div></Card>
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units</p><p className="mt-2 text-2xl font-bold text-slate-900">{units.length}</p></Card>
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</p><p className="mt-2 font-semibold text-slate-900">{course ? new Date(course.updatedAt).toLocaleDateString() : "—"}</p></Card>
        </div>
        <Card className="p-6"><h2 className="text-lg font-bold text-slate-950">Course details</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt><dd className="mt-1 text-sm text-slate-700">{course?.description || "No description has been added yet."}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course address</dt><dd className="mt-1 break-all text-sm text-slate-700">{course?.slug || "—"}</dd></div></dl></Card>
        <section><h2 className="text-lg font-bold text-slate-950">Future course areas</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><Card className="p-5"><h3 className="font-semibold text-slate-900">Classes</h3><p className="mt-2 text-sm text-slate-600">This course can be assigned to classes once the Classroom module is available.</p></Card><Card className="p-5"><h3 className="font-semibold text-slate-900">Students</h3><p className="mt-2 text-sm text-slate-600">Student enrollment will appear here.</p></Card><Card className="p-5"><h3 className="font-semibold text-slate-900">Assignments</h3><p className="mt-2 text-sm text-slate-600">Assignments will become available after the Classroom module.</p></Card><Card className="p-5"><h3 className="font-semibold text-slate-900">Analytics</h3><p className="mt-2 text-sm text-slate-600">Course analytics will appear after students begin using this course.</p></Card></div></section>
      </div>}
      {activeTab === "curriculum" && <>
      {!canEditDrafts && <div className="mt-5"><Alert>You can view this curriculum, but your role does not allow authoring draft units.</Alert></div>}
      {canEditDrafts && course?.status === "published" && <div className="mt-5"><Alert><strong>Published course.</strong> Published units remain read-only. You can append new draft units; learners will not see them until you publish course updates.</Alert></div>}

      {errorMessage && (
        <div className="mt-6"><Alert tone="error" action={<Button variant="secondary" onClick={() => void loadHierarchy()}>Try again</Button>}>{errorMessage}</Alert></div>
      )}

      <div className="mt-8 grid gap-4">
        {units.length === 0 ? (
          <EmptyState title="No units yet" description={canCreateUnit ? "Create the first draft unit to begin shaping this curriculum." : "This course does not contain any units to view."} action={canCreateUnit ? <Button icon="plus" onClick={() => { setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create unit</Button> : undefined} />
        ) : (
          units.map((unit) => {
            const isDraft =
              unit.status === "draft";

            return (
              <Card
                key={unit.id}
                draggable={canEditDraftUnit(canEditDrafts, unit.status)}
                onDragStart={() => setDraggedUnitId(unit.id)}
                onDragOver={(event) => { event.preventDefault(); setDropUnitId(unit.id); }}
                onDragEnd={() => { setDraggedUnitId(null); setDropUnitId(null); }}
                onDrop={(event) => { event.preventDefault(); if (draggedUnitId !== null && draggedUnitId !== unit.id) { setReorderAnnouncement("Unit order was not changed because persistent reordering is unavailable."); setUnavailableOperation("Reorder units"); } setDraggedUnitId(null); setDropUnitId(null); }}
                className={`p-5 transition hover:border-blue-200 sm:p-6 ${dropUnitId === unit.id && draggedUnitId !== unit.id ? "border-t-4 border-t-blue-500" : ""}`}
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
                      <PublicationStatusBadge status={unit.status} />
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
                    {isDraft && canEditDraftUnit(canEditDrafts, unit.status) && (
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
                          <QuickActionsMenu label={`More actions for unit ${unit.title}`} actions={[
                            { label: "Rename", onSelect: () => { setFormErrorMessage(null); setFormState({ mode: "edit", unit }); } },
                            { label: "Duplicate", onSelect: () => { setDuplicateTitle(`${unit.title} copy`); setDuplicateUnit(unit); } },
                            { label: "Move up", disabled: unit === units[0], explanation: "This unit is already first.", onSelect: () => setUnavailableOperation("Reorder units") },
                            { label: "Move down", disabled: unit === units.at(-1), explanation: "This unit is already last.", onSelect: () => setUnavailableOperation("Reorder units") },
                            { label: "Archive", disabled: true, explanation: "Archiving is planned for a future release.", onSelect: () => undefined },
                            { label: "Delete", danger: true, onSelect: () => { setErrorMessage(null); setDeleteConfirmation(openDeleteConfirmation(unit)); } },
                          ]} />
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
      <p className="sr-only" aria-live="polite">{reorderAnnouncement}</p>

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
          appendPosition={formState.mode === "create"}
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
      <ContentOperationDialog open={duplicateUnit !== null} title="Duplicate unit" description="Review the source unit and choose a destination title." valid={duplicateTitle.trim().length > 0} onClose={() => setDuplicateUnit(null)} actionLabel="Duplicate unit">
        {duplicateUnit && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">{duplicateUnit.title}</p><p className="mt-1 text-sm text-slate-600">Its lessons and draft content will be included.</p></div>}
        <label className="block text-sm font-semibold text-slate-800">Destination title<input value={duplicateTitle} onChange={(event) => setDuplicateTitle(event.target.value)} className="admin-focus mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      </ContentOperationDialog>
      <UnavailableOperationDialog open={unavailableOperation !== null} operation={unavailableOperation ?? "Operation"} onClose={() => setUnavailableOperation(null)} />
      </>}
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
