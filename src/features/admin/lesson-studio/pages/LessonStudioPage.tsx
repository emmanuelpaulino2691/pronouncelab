import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBlocker, useParams, useSearchParams } from "react-router-dom";

import { getAdminCourse } from "../../courses/adminCourseService";
import {
  getAdminLesson,
  type AdminLesson,
} from "../../lessons/adminLessonService";
import { useAdminPermissions } from "../../permissions/useAdminPermissions";
import {
  getAdminUnit,
  type AdminUnit,
} from "../../units/adminUnitService";
import ActivityEditor from "../editors/ActivityEditor";
import ActivityPicker from "../components/ActivityPicker";
import { getActivityPresentation } from "../activityCatalog";
import { removeActivityAndSelectNearest } from "../activityDeletionState";
import { canDiscardDirtyEditor, reconcileSelectedActivityId, shouldWarnBeforeUnload } from "../studioSelectionState";
import {
  beginDeleteConfirmation,
  cancelDeleteConfirmation,
  completeDeleteConfirmation,
  createDeleteConfirmationState,
  failDeleteConfirmation,
  openDeleteConfirmation,
} from "../../ui/deleteConfirmationState";
import {
  createActivity,
  createDraftVersion,
  deleteActivity,
  duplicateActivity,
  listActivities,
  loadLessonVersion,
  reorderActivities,
  updateActivity,
} from "../services/lessonStudioService";
import {
  type ActivityType,
  type LessonActivity,
  type LessonVersion,
} from "../types";
import type { AdminCourse } from "../../courses/adminCourseService";
import {
  AdminIcon,
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDeleteDialog,
  LoadingSkeleton,
  PageHeader,
} from "../../ui";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

type Props = {
  courseId: number;
  unitId: number;
  lessonId: number;
};

function Studio({
  courseId,
  unitId,
  lessonId,
}: Props) {
  const { canEditDrafts } =
    useAdminPermissions();
  const active = useRef(true);
  const mutation = useRef(0);
  const activityCreationRef = useRef(false);
  const mutationInFlightRef = useRef(false);
  const editorRef = useRef<HTMLElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [course, setCourse] =
    useState<AdminCourse | null>(null);
  const [unit, setUnit] =
    useState<AdminUnit | null>(null);
  const [lesson, setLesson] =
    useState<AdminLesson | null>(null);
  const [version, setVersion] =
    useState<LessonVersion | null>(null);
  const [activities, setActivities] = useState<
    LessonActivity[]
  >([]);
  const [selectedId, setSelectedId] = useState<
    number | null
  >(() => parseId(searchParams.get("activity") ?? undefined));
  const selectedIdRef = useRef(selectedId);
  const [editorDirty, setEditorDirty] = useState(false);
  const editorDirtyRef = useRef(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );
  const [saved, setSaved] = useState("Saved");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(
    createDeleteConfirmationState<LessonActivity>
  );

  const selectActivity = useCallback((activityId: number | null, discardDirty = true) => {
    selectedIdRef.current = activityId;
    setSelectedId(activityId);
    if (discardDirty) {
      editorDirtyRef.current = false;
      setEditorDirty(false);
    }
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (activityId === null) next.delete("activity");
      else next.set("activity", String(activityId));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  function requestActivitySelection(activityId: number) {
    if (activityId === selectedIdRef.current) return;
    if (!canDiscardDirtyEditor(editorDirty, () => window.confirm("Discard unsaved changes and open another activity?"))) return;
    selectActivity(activityId);
  }

  function reportEditorDirty(dirty: boolean) {
    editorDirtyRef.current = dirty;
    setEditorDirty(dirty);
  }

  const navigationBlocker = useBlocker(({ currentLocation, nextLocation }) =>
    editorDirtyRef.current &&
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search)
  );

  useEffect(() => {
    if (navigationBlocker.state !== "blocked") return;
    if (window.confirm("Discard unsaved changes and leave this activity?")) {
      editorDirtyRef.current = false;
      navigationBlocker.proceed();
    } else {
      navigationBlocker.reset();
    }
  }, [navigationBlocker]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!shouldWarnBeforeUnload(editorDirty)) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editorDirty]);

  useEffect(() => {
    active.current = true;
    const request = ++mutation.current;

    void Promise.all([
      getAdminCourse(courseId),
      getAdminUnit(unitId, courseId),
      getAdminLesson(lessonId, unitId),
    ])
      .then(async ([nextCourse, nextUnit, nextLesson]) => {
        const nextVersion =
          await loadLessonVersion(lessonId);
        const nextActivities = nextVersion
          ? await listActivities(nextVersion.id)
          : [];
        return {
          nextCourse,
          nextUnit,
          nextLesson,
          nextVersion,
          nextActivities,
        };
      })
      .then(
        (result) => {
          if (
            !active.current ||
            request !== mutation.current
          )
            return;
          setCourse(result.nextCourse);
          setUnit(result.nextUnit);
          setLesson(result.nextLesson);
          setVersion(result.nextVersion);
          setActivities(result.nextActivities);
          selectActivity(reconcileSelectedActivityId(selectedIdRef.current, result.nextActivities), false);
        },
        (reason: unknown) => {
          if (
            active.current &&
            request === mutation.current
          ) {
            void reason;
            setError("We couldn’t load Lesson Studio. Try again.");
          }
        }
      )
      .finally(() => {
        if (
          active.current &&
          request === mutation.current
        ) {
          setLoading(false);
        }
      });

    return () => {
      active.current = false;
      mutation.current += 1;
    };
  }, [courseId, lessonId, selectActivity, unitId]);

  const selected = useMemo(
    () =>
      activities.find(
        (activity) => activity.id === selectedId
      ) ?? null,
    [activities, selectedId]
  );
  const editable =
    canEditDrafts &&
    course?.status === "draft" &&
    unit?.status === "draft" &&
    lesson?.status === "draft" &&
    version?.status === "draft";

  async function run<T>(
    action: () => Promise<T>,
    apply: (value: T) => void
  ) {
    if (mutationInFlightRef.current) return false;
    mutationInFlightRef.current = true;
    const request = mutation.current;
    setBusy(true);
    setSaved("Saving…");
    setError(null);
    try {
      const value = await action();
      if (
        active.current &&
        request === mutation.current
      ) {
        apply(value);
        setSaved("Saved");
        return true;
      }
      return false;
    } catch (reason) {
      if (
        active.current &&
        request === mutation.current
      ) {
        void reason;
        setError("The action could not be completed. Your content is unchanged. Try again.");
        setSaved("Save failed");
      }
      return false;
    } finally {
      mutationInFlightRef.current = false;
      if (
        active.current &&
        request === mutation.current
      ) {
        setBusy(false);
      }
    }
  }

  async function refreshActivities(
    versionId: number
  ) {
    const rows = await listActivities(versionId);
    return rows;
  }

  function move(activityId: number, offset: -1 | 1) {
    if (!version || busy || !editable) return;
    const index = activities.findIndex(
      (activity) => activity.id === activityId
    );
    const target = index + offset;
    if (index < 0 || target < 0 || target >= activities.length)
      return;
    const ids = activities.map((item) => item.id);
    [ids[index], ids[target]] = [
      ids[target],
      ids[index],
    ];
    void run(
      async () => {
        await reorderActivities(version.id, ids);
        return refreshActivities(version.id);
      },
      setActivities
    );
  }

  async function handleCreateActivity(type: ActivityType) {
    if (!version || !editable || busy || activityCreationRef.current) {
      throw new Error("Activity creation is not currently available.");
    }

    activityCreationRef.current = true;
    const request = mutation.current;
    const presentation = getActivityPresentation(type);
    setBusy(true);
    setSaved("Saving…");
    setError(null);
    try {
      const created = await createActivity(
        version.id,
        type,
        `New ${presentation.title.toLowerCase()} activity`
      );
      if (!active.current || request !== mutation.current) return;

      setActivities((current) => [...current, created]);
      selectActivity(created.id);
      setSaved("Saved");
      setIsPickerOpen(false);
      window.requestAnimationFrame(() => editorRef.current?.focus());
    } catch (reason) {
      if (active.current && request === mutation.current) {
        setSaved("Save failed");
      }
      throw reason;
    } finally {
      activityCreationRef.current = false;
      if (active.current && request === mutation.current) setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-[1500px]" aria-busy="true">
        <PageHeader
          title="Loading Lesson Studio"
          description="Preparing the lesson and its activities."
          breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: "Loading Lesson Studio" }]}
          actions={<ButtonLink icon="arrow-left" variant="secondary" to={`/admin/courses/${courseId}/units/${unitId}`}>Back to lessons</ButtonLink>}
        />
        <div role="status" className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <LoadingSkeleton className="h-72" />
          <LoadingSkeleton className="h-96" />
          <span className="sr-only">Loading Lesson Studio…</span>
        </div>
      </section>
    );
  }

  if (!course || !unit || !lesson) {
    return (
      <section className="mx-auto max-w-[1500px]">
        <PageHeader
          title="Lesson Studio unavailable"
          description="The requested lesson could not be prepared."
          breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: "Lesson Studio unavailable" }]}
          actions={<ButtonLink icon="arrow-left" variant="secondary" to={`/admin/courses/${courseId}/units/${unitId}`}>Back to lessons</ButtonLink>}
        />
        <div className="mt-6"><Alert tone="error">{error ?? "The lesson may be unavailable or outside your access."}</Alert></div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Lesson Studio"
        title={`${lesson.title} Studio`}
        description={version ? `Version ${version.versionNumber} · ${saved}` : "This lesson has not been started yet."}
        breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course.title, to: `/admin/courses/${courseId}` }, { label: unit.title, to: `/admin/courses/${courseId}/units/${unitId}` }, { label: lesson.title }]}
        meta={<Badge tone={(version?.status ?? lesson.status) === "draft" ? "draft" : "success"}>{version?.status ?? lesson.status}</Badge>}
        actions={<><ButtonLink icon="arrow-left" variant="secondary" to={`/admin/courses/${courseId}/units/${unitId}`}>Back to lessons</ButtonLink><Button type="button" disabled title="Student preview is not available yet" variant="secondary">Preview · Coming later</Button></>}
      />
      <span role="status" aria-live="polite" className="sr-only">{saved}</span>

      {!editable && version && <div className="mt-4"><Alert tone="info"><strong>View-only lesson.</strong> You can review this lesson, but editing is unavailable because the lesson is no longer an editable draft or your role does not allow changes.</Alert></div>}
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!version ? (
        <div className="mt-6 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-8 text-center">
          <h2 className="font-semibold text-blue-950">
            {canEditDrafts && course.status === "draft" && unit.status === "draft" && lesson.status === "draft" ? "Start authoring this lesson" : "No lesson draft to view"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-blue-900">
            {canEditDrafts && course.status === "draft" && unit.status === "draft" && lesson.status === "draft" ? "Start the lesson draft before adding activities." : "A lesson draft has not been started, and editing is unavailable for this lesson."}
          </p>
          {canEditDrafts && course.status === "draft" && unit.status === "draft" && lesson.status === "draft" && <Button isLoading={busy} icon="sparkle"
            onClick={() =>
              void run(
                () =>
                  createDraftVersion(
                    lessonId,
                    unitId
                  ),
                (created) => setVersion(created)
              )
            }
            className="mt-4"
          >
            {busy ? "Saving…" : "Start lesson draft"}
          </Button>}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2"><AdminIcon name="activity" className="h-5 w-5 text-blue-600" /><h2 className="font-semibold text-slate-950">Activities</h2></div>
            {editable && (
              <Button
                type="button"
                icon="plus"
                className="mt-4 w-full"
                disabled={busy || !version}
                onClick={() => setIsPickerOpen(true)}
              >
                Add Activity
              </Button>
            )}
            {activities.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                {editable ? "No activities yet. Choose Add Activity to begin the learning sequence." : "This lesson does not contain any activities to view."}
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {activities.map((activity, index) => (
                  <li
                    key={activity.id}
                    className={[
                      "rounded-xl border p-3 transition",
                      selectedId === activity.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-pressed={selectedId === activity.id}
                      onClick={() => requestActivitySelection(activity.id)}
                      className="admin-focus min-h-11 w-full rounded-lg text-left"
                    >
                      <span className="text-xs font-semibold uppercase text-blue-600">
                        {index + 1} ·{" "}
                        {getActivityPresentation(activity.type).title}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-slate-900">
                        {activity.title}
                      </span>
                      {selectedId === activity.id && <span className="mt-1 block text-xs font-semibold text-blue-800">Selected activity</span>}
                    </button>
                    {editable && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label={`Move ${activity.title} up`}
                          disabled={busy || index === 0}
                          onClick={() => move(activity.id, -1)}
                          className="admin-focus min-h-10 rounded-lg border px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${activity.title} down`}
                          disabled={
                            busy ||
                            index === activities.length - 1
                          }
                          onClick={() => move(activity.id, 1)}
                          className="admin-focus min-h-10 rounded-lg border px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          aria-label={`Duplicate ${activity.title}`}
                          disabled={busy || !version}
                          onClick={() => {
                            if (!version) return;
                            void run(
                              () =>
                                duplicateActivity(
                                  activity.id,
                                  version.id,
                                  activity.type
                                ),
                              (created) => {
                                setActivities((current) =>
                                  [...current, created].sort(
                                    (first, second) => first.position - second.position
                                  )
                                );
                                selectActivity(created.id);
                                window.requestAnimationFrame(() => editorRef.current?.focus());
                              }
                            );
                          }}
                          className="admin-focus min-h-10 rounded-lg border px-3 py-2 text-xs"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${activity.title}`}
                          disabled={busy || !version}
                          onClick={() => {
                            setError(null);
                            setDeleteConfirmation(openDeleteConfirmation(activity));
                          }}
                          className="admin-focus min-h-10 rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </aside>

          <main ref={editorRef} tabIndex={-1} aria-label="Activity editor" className="admin-focus min-w-0 rounded-2xl">
            {selected && version ? (
              <div className="space-y-4">
              {editorDirty && editable && <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-medium text-amber-900">Unsaved changes</p><Button type="button" variant="secondary" onClick={() => { if (window.confirm("Discard the unsaved changes in this activity?")) { reportEditorDirty(false); setEditorRevision((value) => value + 1); } }}>Discard changes</Button></div>}
              <ActivityEditor
                key={`${selected.id}:${editorRevision}`}
                activity={selected}
                editable={editable}
                busy={busy}
                onDirtyChange={reportEditorDirty}
                onSaveMetadata={async (input) => {
                  await run(
                    () =>
                      updateActivity(
                        selected.id,
                        version.id,
                        input
                      ),
                    (updated) =>
                      setActivities((current) =>
                        current.map((item) =>
                          item.id === updated.id
                            ? updated
                            : item
                        )
                      )
                  );
                }}
              />
              </div>
            ) : (
              <Card className="border-dashed p-12 text-center"><AdminIcon name="sparkle" className="mx-auto h-8 w-8 text-blue-500" /><p className="mt-3 text-sm text-slate-500">Select or add an activity to begin.</p></Card>
            )}
          </main>
        </div>
      )}

      {isPickerOpen && editable && version && (
        <ActivityPicker
          onClose={() => setIsPickerOpen(false)}
          onCreate={handleCreateActivity}
        />
      )}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmation.target !== null}
        title="Delete activity"
        description={deleteConfirmation.target ? `Delete “${deleteConfirmation.target.title}” from this lesson draft?` : ""}
        isDeleting={deleteConfirmation.pending}
        errorMessage={deleteConfirmation.target ? error : null}
        onCancel={() => setDeleteConfirmation((current) => cancelDeleteConfirmation(current))}
        onConfirm={() => {
          const activity = deleteConfirmation.target;
          if (!activity || !version || deleteConfirmation.pending) return;
          setDeleteConfirmation((current) => beginDeleteConfirmation(current));
          void run(
            () => deleteActivity(activity.id, version.id),
            () => {
              const next = removeActivityAndSelectNearest(
                activities,
                activity.id,
                selectedId
              );
              setActivities(next.activities);
              selectActivity(next.selectedActivityId);
            }
          ).then((succeeded) => {
            setDeleteConfirmation((current) =>
              succeeded
                ? completeDeleteConfirmation()
                : failDeleteConfirmation(current)
            );
          });
        }}
      />
    </section>
  );
}

export default function LessonStudioPage() {
  const params = useParams();
  const courseId = parseId(params.courseId);
  const unitId = parseId(params.unitId);
  const lessonId = parseId(params.lessonId);

  if (!courseId || !unitId || !lessonId) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
        Invalid lesson studio route.
      </p>
    );
  }

  return (
    <Studio
      key={`${courseId}:${unitId}:${lessonId}`}
      courseId={courseId}
      unitId={unitId}
      lessonId={lessonId}
    />
  );
}
