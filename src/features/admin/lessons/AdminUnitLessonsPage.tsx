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
  getAdminUnit,
  listAdminUnits,
  type AdminUnit,
} from "../units/adminUnitService";
import {
  createAdminLesson,
  deleteDraftLesson,
  duplicateDraftLesson,
  listAdminLessons,
  updateAdminLesson,
  type AdminLesson,
} from "./adminLessonService";
import LessonCreationDialog from "./LessonCreationDialog";
import { canStartLessonCreation } from "./lessonCreationState";
import { buildStudentPreviewUrl } from "../preview/previewNavigation";
import { canCreateDraftLesson, canEditDraftLesson } from "../hierarchyAuthoring";

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; lesson: AdminLesson };

type LoadedHierarchy = {
  course: AdminCourse;
  unit: AdminUnit;
  units: AdminUnit[];
  lessons: AdminLesson[];
};

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
  const [course, unit, units] = await Promise.all([
    getAdminCourse(courseId),
    getAdminUnit(unitId, courseId),
    listAdminUnits(courseId),
  ]);
  const lessons = await listAdminLessons(unit.id);

  return { course, unit, units, lessons };
}

type UnitLessonsContentProps = {
  courseId: number;
  unitId: number;
};

function UnitLessonsContent({
  courseId,
  unitId,
}: UnitLessonsContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { canEditDrafts } =
    useAdminPermissions();
  const isActiveRef = useRef(true);
  const saveInFlightRef = useRef(false);
  const deleteInFlightRef = useRef(false);
  const duplicateInFlightRef = useRef(false);
  const creationCompletedRef = useRef(false);
  const [course, setCourse] =
    useState<AdminCourse | null>(null);
  const [unit, setUnit] =
    useState<AdminUnit | null>(null);
  const [courseUnits, setCourseUnits] = useState<AdminUnit[]>([]);
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
  const [, setDuplicatingLessonId] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(
    createDeleteConfirmationState<AdminLesson>
  );
  const [formState, setFormState] =
    useState<FormState>({ mode: "closed" });
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] =
    useState<string | null>(null);
  const [lessonOperation, setLessonOperation] = useState<{ kind: "copy" | "move"; lesson: AdminLesson } | null>(null);
  const [destinationUnitId, setDestinationUnitId] = useState(0);
  const [operationTitle, setOperationTitle] = useState("");
  const [operationPosition, setOperationPosition] = useState(1);
  const [unavailableOperation, setUnavailableOperation] = useState<string | null>(null);
  const [draggedLessonId, setDraggedLessonId] = useState<number | null>(null);
  const [dropLessonId, setDropLessonId] = useState<number | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");

  const applyHierarchy = useCallback(
    (hierarchy: LoadedHierarchy) => {
      setCourse(hierarchy.course);
      setUnit(hierarchy.unit);
      setCourseUnits(hierarchy.units);
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
    } catch {
      if (isActiveRef.current) {
        setErrorMessage("We couldn’t load these lessons. Try again.");
      }
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyHierarchy, courseId, unitId]);

  useEffect(() => {
    isActiveRef.current = true;
    let isActive = true;

    void getHierarchy(courseId, unitId)
      .then((hierarchy) => {
        if (isActive) {
          applyHierarchy(hierarchy);
        }
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("We couldn’t load these lessons. Try again.");
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
  const canCreateLesson = canCreateDraftLesson(
    canEditDrafts,
    course?.status ?? null,
    unit?.status ?? null
  );

  async function handleSave(
    input: HierarchyItemInput
  ) {
    if (formState.mode === "closed" || saveInFlightRef.current) return;
    if (
      formState.mode === "create" &&
      !canStartLessonCreation(isSaving, creationCompletedRef.current)
    ) return;

    saveInFlightRef.current = true;
    setIsSaving(true);
    setFormErrorMessage(null);

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
          creationCompletedRef.current = true;
          setLessons((current) =>
            [...current, createdLesson].sort(
              (first, second) =>
                first.position -
                second.position
            )
          );
          setFormState({ mode: "closed" });
          navigate(
            `/admin/courses/${courseId}/units/${unitId}/lessons/${createdLesson.id}/studio`
          );
          return;
        }
      }

      if (isActiveRef.current) {
        setFormState({ mode: "closed" });
      }
    } catch (error) {
      if (isActiveRef.current) {
        void error;
        setFormErrorMessage(
          "The lesson could not be saved. Your changes are still here. Please try again."
        );
      }
    } finally {
      saveInFlightRef.current = false;
      if (isActiveRef.current) {
        setIsSaving(false);
      }
    }
  }

  async function handleDelete(
    lesson: AdminLesson
  ) {
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    setDeleteConfirmation((current) => beginDeleteConfirmation(current));
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
        setDeleteConfirmation(completeDeleteConfirmation());
      }
    } catch {
      if (isActiveRef.current) {
        setErrorMessage("The lesson could not be deleted. It is still available. Try again.");
        setDeleteConfirmation((current) => failDeleteConfirmation(current));
      }
    } finally {
      deleteInFlightRef.current = false;
      if (isActiveRef.current) {
        setDeletingLessonId(null);
      }
    }
  }

  async function handleDuplicate(lesson: AdminLesson) {
    if (duplicateInFlightRef.current) return;
    duplicateInFlightRef.current = true;
    setDuplicatingLessonId(lesson.id);
    setErrorMessage(null);
    try {
      const duplicated = await duplicateDraftLesson(lesson.id, unitId);
      if (isActiveRef.current) {
        setLessons((current) => [...current, duplicated].sort((a, b) => a.position - b.position));
        navigate(`/admin/courses/${courseId}/units/${unitId}/lessons/${duplicated.id}/studio`);
      }
    } catch {
      if (isActiveRef.current) setErrorMessage("The lesson could not be duplicated. Nothing was changed. Try again.");
    } finally {
      duplicateInFlightRef.current = false;
      if (isActiveRef.current) setDuplicatingLessonId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl" aria-busy="true">
        <PageHeader
          title="Loading lessons"
          description="Preparing the unit and its lessons."
          breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: "Loading lessons" }]}
          actions={<ButtonLink icon="arrow-left" variant="secondary" to={`/admin/courses/${courseId}`}>Back to curriculum</ButtonLink>}
        />
        <div role="status" className="mt-8 space-y-5">
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
          <span className="sr-only">Loading unit lessons…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Unit lessons"
        title={`${unit?.title ?? "Unit"} lessons`}
        description={unit?.description || "Manage the ordered lessons and open the authoring studio."}
        breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course?.title ?? "Course", to: `/admin/courses/${courseId}` }, { label: unit?.title ?? "Unit" }]}
        meta={unit ? <StatusBadge status={unit.status} /> : undefined}
        actions={<><ButtonLink icon="arrow-left" variant="secondary" to={`/admin/courses/${courseId}`}>Back to curriculum</ButtonLink>{canCreateLesson && <Button icon="plus" onClick={() => { creationCompletedRef.current = false; setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create lesson</Button>}</>}
      />
      {!canEditDrafts && <div className="mt-5"><Alert>You can view these lessons, but your role does not allow authoring drafts.</Alert></div>}
      {canEditDrafts && unit?.status === "published" && <div className="mt-5"><Alert><strong>Published unit.</strong> Published lessons remain read-only. You can append new draft lessons; learners will not see them until you publish updates.</Alert></div>}

      {errorMessage && (
        <div className="mt-6"><Alert tone="error" action={<Button variant="secondary" onClick={() => void loadHierarchy()}>Try again</Button>}>{errorMessage}</Alert></div>
      )}

      <Card className="mt-8 overflow-hidden">
        {lessons.length === 0 ? (
          <EmptyState title="No lessons yet" description={canCreateLesson ? "Create the first draft lesson to begin authoring this unit." : "This unit does not contain any lessons to view."} action={canCreateLesson ? <Button icon="plus" onClick={() => { creationCompletedRef.current = false; setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create lesson</Button> : undefined} />
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
                    <tr key={lesson.id} draggable={canEditDraftLesson(canEditDrafts, lesson.status, lesson.currentPublishedVersionId)} onDragStart={() => setDraggedLessonId(lesson.id)} onDragOver={(event) => { event.preventDefault(); setDropLessonId(lesson.id); }} onDragEnd={() => { setDraggedLessonId(null); setDropLessonId(null); }} onDrop={(event) => { event.preventDefault(); if (draggedLessonId !== null && draggedLessonId !== lesson.id) { setReorderAnnouncement("Lesson order was not changed because persistent reordering is unavailable."); setUnavailableOperation("Reorder lessons"); } setDraggedLessonId(null); setDropLessonId(null); }} className={dropLessonId === lesson.id && draggedLessonId !== lesson.id ? "border-t-4 border-t-blue-500" : ""}>
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
                        <PublicationStatusBadge status={lesson.status} currentPublishedVersionId={lesson.currentPublishedVersionId} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <ButtonLink icon="sparkle" to={`/admin/courses/${courseId}/units/${unitId}/lessons/${lesson.id}/studio`}>Open Studio</ButtonLink>
                          <ButtonLink variant="secondary" to={buildStudentPreviewUrl({ courseId, lessonId: lesson.id, returnTo: `${location.pathname}${location.search}` })}>Preview as Student</ButtonLink>
                        {isDraft && canEditDraftLesson(
                          canEditDrafts,
                          lesson.status,
                          lesson.currentPublishedVersionId
                        ) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setFormErrorMessage(null);
                                setFormState({
                                  mode: "edit",
                                  lesson,
                                });
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                              Edit
                            </button>
                            <QuickActionsMenu label={`More actions for lesson ${lesson.title}`} actions={[
                              { label: "Rename", onSelect: () => { setFormErrorMessage(null); setFormState({ mode: "edit", lesson }); } },
                              { label: "Duplicate", onSelect: () => void handleDuplicate(lesson) },
                              { label: "Copy", onSelect: () => { setLessonOperation({ kind: "copy", lesson }); setOperationTitle(`${lesson.title} copy`); setDestinationUnitId(courseUnits.find((item) => item.id !== unitId)?.id ?? 0); } },
                              { label: "Move", onSelect: () => { setLessonOperation({ kind: "move", lesson }); setDestinationUnitId(courseUnits.find((item) => item.id !== unitId)?.id ?? 0); setOperationPosition(1); } },
                              { label: "Move up", disabled: lesson === lessons[0], explanation: "This lesson is already first.", onSelect: () => setUnavailableOperation("Reorder lessons") },
                              { label: "Move down", disabled: lesson === lessons.at(-1), explanation: "This lesson is already last.", onSelect: () => setUnavailableOperation("Reorder lessons") },
                              { label: "Archive", disabled: true, explanation: "Archiving is planned for a future release.", onSelect: () => undefined },
                              { label: "Delete", danger: true, onSelect: () => { setErrorMessage(null); setDeleteConfirmation(openDeleteConfirmation(lesson)); } },
                            ]} />
                            <button
                              type="button"
                              disabled={
                                deletingLessonId ===
                                lesson.id
                              }
                              onClick={() =>
                                { setErrorMessage(null); setDeleteConfirmation(openDeleteConfirmation(lesson)); }
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
      </Card>
      <p className="sr-only" aria-live="polite">{reorderAnnouncement}</p>

      {formState.mode === "create" && (
        <LessonCreationDialog
          nextPosition={nextPosition}
          isSaving={isSaving}
          errorMessage={formErrorMessage}
          onClose={() => {
            setFormErrorMessage(null);
            setFormState({ mode: "closed" });
          }}
          onSubmit={(input) => void handleSave(input)}
        />
      )}

      {formState.mode === "edit" && (
        <HierarchyItemForm
          itemType="lesson"
          item={formState.lesson}
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
        title="Delete lesson"
        description={deleteConfirmation.target ? `Delete “${deleteConfirmation.target.title}” and its draft content?` : ""}
        isDeleting={deleteConfirmation.pending}
        errorMessage={deleteConfirmation.target ? errorMessage : null}
        onCancel={() => setDeleteConfirmation((current) => cancelDeleteConfirmation(current))}
        onConfirm={() => { if (deleteConfirmation.target) void handleDelete(deleteConfirmation.target); }}
      />
      <ContentOperationDialog open={lessonOperation !== null} title={lessonOperation?.kind === "move" ? "Move lesson" : "Copy lesson"} description={lessonOperation?.kind === "move" ? "Choose the destination unit and new order position." : "Choose the destination unit and optional new title."} valid={destinationUnitId > 0 && destinationUnitId !== unitId && (lessonOperation?.kind !== "copy" || operationTitle.trim().length > 0)} onClose={() => setLessonOperation(null)} actionLabel={lessonOperation?.kind === "move" ? "Move lesson" : "Copy lesson"}>
        {lessonOperation && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Current unit</p><p className="mt-1 font-semibold text-slate-900">{unit?.title}</p><p className="mt-2 text-sm text-slate-600">{lessonOperation.lesson.title}</p></div>}
        <label className="block text-sm font-semibold text-slate-800">Destination unit<select value={destinationUnitId} onChange={(event) => setDestinationUnitId(Number(event.target.value))} className="admin-focus mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value={0}>Select a different unit</option>{courseUnits.filter((item) => item.id !== unitId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        {lessonOperation?.kind === "copy" ? <label className="block text-sm font-semibold text-slate-800">New lesson title<input value={operationTitle} onChange={(event) => setOperationTitle(event.target.value)} className="admin-focus mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label> : <label className="block text-sm font-semibold text-slate-800">New order position<input type="number" min={1} value={operationPosition} onChange={(event) => setOperationPosition(Math.max(1, Number(event.target.value)))} className="admin-focus mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>}
      </ContentOperationDialog>
      <UnavailableOperationDialog open={unavailableOperation !== null} operation={unavailableOperation ?? "Operation"} onClose={() => setUnavailableOperation(null)} />
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
