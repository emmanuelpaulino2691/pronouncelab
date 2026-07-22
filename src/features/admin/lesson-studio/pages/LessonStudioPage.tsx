import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";

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
  activityTypeLabels,
  activityTypes,
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
  LoadingSkeleton,
  PageHeader,
  Select,
} from "../../ui";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function errorMessage(error: unknown) {
  void error;
  return "Lesson Studio could not complete this request. Refresh the page and try again.";
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
  >(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );
  const [saved, setSaved] = useState("All changes saved");
  const [newType, setNewType] =
    useState<ActivityType>("theory");

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
          setSelectedId(
            result.nextActivities[0]?.id ?? null
          );
        },
        (reason: unknown) => {
          if (
            active.current &&
            request === mutation.current
          ) {
            setError(errorMessage(reason));
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
  }, [courseId, lessonId, unitId]);

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
        setSaved("All changes saved");
      }
    } catch (reason) {
      if (
        active.current &&
        request === mutation.current
      ) {
        setError(errorMessage(reason));
        setSaved("Save failed");
      }
    } finally {
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
        description={version ? `Version ${version.versionNumber} · ${saved}` : "No lesson version exists yet."}
        breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course.title, to: `/admin/courses/${courseId}` }, { label: unit.title, to: `/admin/courses/${courseId}/units/${unitId}` }, { label: lesson.title }]}
        meta={<Badge tone={(version?.status ?? lesson.status) === "draft" ? "draft" : "success"}>{version?.status ?? lesson.status}</Badge>}
        actions={<><ButtonLink icon="arrow-left" variant="secondary" to={`/admin/courses/${courseId}/units/${unitId}`}>Back to lessons</ButtonLink><Button type="button" disabled title="Student preview is coming later" variant="secondary">Preview · Coming later</Button></>}
      />

      {!editable && version && <div className="mt-4"><Alert tone="info"><strong>Read-only studio.</strong> This lesson is sealed or your role does not include draft editing.</Alert></div>}
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!version && canEditDrafts && lesson.status === "draft" ? (
        <div className="mt-6 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-8 text-center">
          <h2 className="font-semibold text-blue-950">
            Start authoring this lesson
          </h2>
          <Button isLoading={busy} icon="sparkle"
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
            Create draft version
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2"><AdminIcon name="activity" className="h-5 w-5 text-blue-600" /><h2 className="font-semibold text-slate-950">Activities</h2></div>
            {editable && (
              <div className="mt-4 flex gap-2">
                <Select
                  value={newType}
                  disabled={busy}
                  onChange={(event) =>
                    setNewType(
                      event.target.value as ActivityType
                    )
                  }
                  className="min-w-0 flex-1"
                >
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {activityTypeLabels[type]}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  disabled={busy || !version}
                  onClick={() => {
                    if (!version) return;
                    void run(
                      () =>
                        createActivity(
                          version.id,
                          newType,
                          `New ${activityTypeLabels[
                            newType
                          ].toLowerCase()} activity`
                        ),
                      (created) => {
                        setActivities((current) => [
                          ...current,
                          created,
                        ]);
                        setSelectedId(created.id);
                      }
                    );
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
            {activities.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No activities yet.
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
                      onClick={() =>
                        setSelectedId(activity.id)
                      }
                      className="w-full text-left"
                    >
                      <span className="text-xs font-semibold uppercase text-blue-600">
                        {index + 1} ·{" "}
                        {activityTypeLabels[activity.type]}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-slate-900">
                        {activity.title}
                      </span>
                    </button>
                    {editable && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy || index === 0}
                          onClick={() => move(activity.id, -1)}
                          className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={
                            busy ||
                            index === activities.length - 1
                          }
                          onClick={() => move(activity.id, 1)}
                          className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                        >
                          Down
                        </button>
                        <button
                          type="button"
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
                                setActivities((current) => [
                                  ...current,
                                  created,
                                ]);
                                setSelectedId(created.id);
                              }
                            );
                          }}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          disabled={busy || !version}
                          onClick={() => {
                            if (
                              !version ||
                              !window.confirm(
                                `Delete "${activity.title}"?`
                              )
                            )
                              return;
                            void run(
                              () =>
                                deleteActivity(
                                  activity.id,
                                  version.id
                                ),
                              () => {
                                const remaining =
                                  activities.filter(
                                    (item) =>
                                      item.id !== activity.id
                                  );
                                setActivities(remaining);
                                setSelectedId(
                                  remaining[0]?.id ?? null
                                );
                              }
                            );
                          }}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
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

          <main className="min-w-0">
            {selected && version ? (
              <ActivityEditor
                key={selected.id}
                activity={selected}
                editable={editable}
                busy={busy}
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
            ) : (
              <Card className="border-dashed p-12 text-center"><AdminIcon name="sparkle" className="mx-auto h-8 w-8 text-blue-500" /><p className="mt-3 text-sm text-slate-500">Select or add an activity to begin.</p></Card>
            )}
          </main>
        </div>
      )}
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
