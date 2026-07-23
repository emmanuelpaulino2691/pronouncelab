import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { Alert, Button, ButtonLink, Card, ConfirmDeleteDialog, EmptyState, LoadingSkeleton, PageHeader, Select, StatusBadge, TextInput } from "../ui";
import {
  beginDeleteConfirmation,
  cancelDeleteConfirmation,
  completeDeleteConfirmation,
  createDeleteConfirmationState,
  failDeleteConfirmation,
  openDeleteConfirmation,
} from "../ui/deleteConfirmationState";
import { formatDate } from "../utils/format";
import CourseForm from "./CourseForm";
import { getCourseSaveErrorMessage } from "./courseSaveErrors";
import { shouldRenderCourseForm } from "./courseFormState";
import {
  createAdminCourse, deleteDraftCourse, duplicateDraftCourse, listAdminCourses, updateAdminCourse,
  type AdminCourse, type CourseInput, type CourseStatus,
} from "./adminCourseService";

type FormState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; course: AdminCourse };
type SortMode = "updated" | "title" | "position";

function AdminCoursesPage() {
  const { canEditDrafts } = useAdminPermissions();
  const deleteInFlightRef = useRef(false);
  const duplicateInFlightRef = useRef(false);
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(
    createDeleteConfirmationState<AdminCourse>
  );
  const [formState, setFormState] = useState<FormState>(() => canEditDrafts && searchParams.get("create") === "1" ? { mode: "create" } : { mode: "closed" });
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CourseStatus>("all");
  const [sort, setSort] = useState<SortMode>("updated");

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try { setCourses(await listAdminCourses()); }
    catch { setCourses([]); setErrorMessage("We couldn’t load the courses. Try again."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void listAdminCourses().then((loaded) => { if (active) setCourses(loaded); })
      .catch(() => { if (active) setErrorMessage("We couldn’t load the courses. Try again."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return courses
      .filter((course) => status === "all" || course.status === status)
      .filter((course) => !normalized || `${course.title} ${course.description} ${course.level}`.toLocaleLowerCase().includes(normalized))
      .sort((first, second) => sort === "title"
        ? first.title.localeCompare(second.title)
        : sort === "position"
          ? first.position - second.position
          : Date.parse(second.updatedAt) - Date.parse(first.updatedAt));
  }, [courses, query, sort, status]);

  const nextPosition = useMemo(() => courses.length ? Math.max(...courses.map((course) => course.position)) + 1 : 0, [courses]);

  async function handleSave(input: CourseInput) {
    if (isSaving) return;
    setIsSaving(true);
    setFormErrorMessage(null);
    try {
      if (formState.mode === "edit") {
        const updated = await updateAdminCourse(formState.course.id, input);
        setCourses((current) => current.map((course) => course.id === updated.id ? updated : course));
      } else {
        const created = await createAdminCourse(input);
        setCourses((current) => [...current, created]);
      }
      setFormState({ mode: "closed" });
    } catch (error) { setFormErrorMessage(getCourseSaveErrorMessage(error)); }
    finally { setIsSaving(false); }
  }

  async function handleDelete(course: AdminCourse) {
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    setDeleteConfirmation((current) => beginDeleteConfirmation(current));
    setDeletingCourseId(course.id);
    setErrorMessage(null);
    try { await deleteDraftCourse(course.id); setCourses((current) => current.filter((item) => item.id !== course.id)); setDeleteConfirmation(completeDeleteConfirmation()); }
    catch { setErrorMessage("The course could not be deleted. It is still available. Try again."); setDeleteConfirmation((current) => failDeleteConfirmation(current)); }
    finally { deleteInFlightRef.current = false; setDeletingCourseId(null); }
  }

  async function handleDuplicate(course: AdminCourse) {
    if (duplicateInFlightRef.current) return;
    duplicateInFlightRef.current = true;
    setDuplicatingCourseId(course.id);
    setErrorMessage(null);
    try {
      const duplicated = await duplicateDraftCourse(course.id);
      setCourses((current) => [...current, duplicated]);
    } catch {
      setErrorMessage("The course could not be duplicated. Nothing was changed. Try again.");
    } finally {
      duplicateInFlightRef.current = false;
      setDuplicatingCourseId(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-7">
      <PageHeader
        eyebrow="Curriculum"
        title="Courses"
        breadcrumbs={[{ label: "Courses" }]}
        description="Organize courses, units, and lessons into clear learning experiences."
        actions={canEditDrafts
          ? <Button icon="plus" onClick={() => { setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create course</Button>
          : <span className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">View-only access</span>}
      />
      {!canEditDrafts && <Alert>You can view courses, but your role does not allow creating or editing course drafts.</Alert>}
      {errorMessage && <Alert tone="error" action={<Button variant="secondary" onClick={() => void loadCourses()}>Try again</Button>}>{errorMessage}</Alert>}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(15rem,1fr)_12rem_12rem]">
          <label className="relative"><span className="sr-only">Search courses</span><TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, level, or description…" className="pl-4" /></label>
          <label><span className="sr-only">Filter by status</span><Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></Select></label>
          <label><span className="sr-only">Sort courses</span><Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="updated">Recently updated</option><option value="title">Title A–Z</option><option value="position">Curriculum order</option></Select></label>
        </div>
      </Card>

      {isLoading ? <div role="status" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <Card key={item} className="p-6"><LoadingSkeleton className="h-12 w-12" /><LoadingSkeleton className="mt-5 h-6 w-2/3" /><LoadingSkeleton className="mt-3 h-16" /><LoadingSkeleton className="mt-5 h-10" /></Card>)}<span className="sr-only">Loading courses…</span></div>
        : visibleCourses.length === 0 ? <EmptyState title={courses.length ? "No courses match" : canEditDrafts ? "Build your first course" : "No courses yet"} description={courses.length ? "Try changing the search or status filter." : canEditDrafts ? "Create a course draft and begin organizing units and lessons." : "There are no courses available to view."} action={canEditDrafts && !courses.length ? <Button icon="plus" onClick={() => { setFormErrorMessage(null); setFormState({ mode: "create" }); }}>Create course</Button> : undefined} />
          : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => {
              const editable = canEditDrafts && course.status === "draft";
              return <Card key={course.id} className="group flex min-h-72 flex-col overflow-hidden">
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">{course.emoji || "📘"}</span><StatusBadge status={course.status} /></div>
                  <h2 className="mt-5 text-xl font-bold text-slate-950">{course.title}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{course.level || "All levels"} · Position {course.position}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600" title={course.description}>{course.description || "No description has been added yet."}</p>
                  <p className="mt-auto pt-5 text-xs text-slate-500">Updated {formatDate(course.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50/70 p-4">
                  <ButtonLink to={`/admin/courses/${course.id}`} className="flex-1">Open curriculum</ButtonLink>
                  {editable && <Button variant="secondary" icon="edit" aria-label={`Edit ${course.title}`} onClick={() => { setFormErrorMessage(null); setFormState({ mode: "edit", course }); }}>Edit</Button>}
                  {editable && <Button type="button" variant="secondary" aria-label={`Duplicate ${course.title}`} isLoading={duplicatingCourseId === course.id} disabled={duplicatingCourseId !== null} onClick={() => void handleDuplicate(course)}>Duplicate</Button>}
                  {editable && <Button type="button" variant="danger" icon="delete" aria-label={`Delete ${course.title}`} isLoading={deletingCourseId === course.id} onClick={() => { setErrorMessage(null); setDeleteConfirmation(openDeleteConfirmation(course)); }}>Delete</Button>}
                </div>
              </Card>;
            })}
          </div>}

      {shouldRenderCourseForm(formState.mode !== "closed", isLoading) && <CourseForm course={formState.mode === "edit" ? formState.course : null} nextPosition={nextPosition} isSaving={isSaving} errorMessage={formErrorMessage} onCancel={() => { setFormErrorMessage(null); setFormState({ mode: "closed" }); }} onSubmit={(input) => void handleSave(input)} />}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmation.target !== null}
        title="Delete course"
        description={deleteConfirmation.target ? `Delete “${deleteConfirmation.target.title}” and its draft curriculum?` : ""}
        isDeleting={deleteConfirmation.pending}
        errorMessage={deleteConfirmation.target ? errorMessage : null}
        onCancel={() => setDeleteConfirmation((current) => cancelDeleteConfirmation(current))}
        onConfirm={() => { if (deleteConfirmation.target) void handleDelete(deleteConfirmation.target); }}
      />
    </section>
  );
}

export default AdminCoursesPage;
