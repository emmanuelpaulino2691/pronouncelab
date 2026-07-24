import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { AdminIcon, Alert, Button, ButtonLink, Card, LoadingSkeleton, PageHeader, SectionHeader, StatusBadge } from "../ui";
import { formatRelativeDate } from "../utils/format";
import { futureWorkspaceSections, getWorkspaceHeading, getWorkspaceRole } from "../workspace";
import { loadAdminDashboard } from "./adminDashboardService";
import type { AdminDashboardData } from "./dashboardTypes";

const statItems = [
  ["totalCourses", "Courses", "courses"],
  ["draftCourses", "Draft courses", "edit"],
  ["publishedCourses", "Published", "check"],
  ["totalUnits", "Units", "book"],
  ["totalLessons", "Lessons", "practice"],
  ["totalActivities", "Activities", "activity"],
] as const;

function AdminDashboardPage() {
  const permissions = useAdminPermissions();
  const { canEditDrafts, canPublish } = permissions;
  const role = getWorkspaceRole(permissions);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const activeRequest = useRef(0);

  function retry() {
    const requestId = ++activeRequest.current;
    setIsLoading(true);
    setHasError(false);
    void loadAdminDashboard()
      .then((next) => { if (activeRequest.current === requestId) setData(next); })
      .catch(() => { if (activeRequest.current === requestId) { setData(null); setHasError(true); } })
      .finally(() => { if (activeRequest.current === requestId) setIsLoading(false); });
  }

  useEffect(() => {
    let active = true;
    const requestId = ++activeRequest.current;
    void loadAdminDashboard()
      .then((next) => { if (active && activeRequest.current === requestId) setData(next); })
      .catch(() => { if (active && activeRequest.current === requestId) { setData(null); setHasError(true); } })
      .finally(() => { if (active && activeRequest.current === requestId) setIsLoading(false); });
    return () => { active = false; activeRequest.current += 1; };
  }, []);

  return (
    <section className="mx-auto max-w-7xl space-y-9">
      <PageHeader
        eyebrow={role === "administrator" ? "Platform Admin" : "Teacher Workspace"}
        title={getWorkspaceHeading(role)}
        description={role === "publisher" ? "Review published-ready courses and keep the learner experience consistent." : "Build structured English learning experiences, keep every draft organized, and prepare lessons for publication."}
        actions={<>
          {canEditDrafts && <ButtonLink to="/admin/courses?create=1" icon="plus">Create course</ButtonLink>}
          <ButtonLink to="/admin/courses" variant="secondary">{role === "administrator" ? "All Courses" : "My Courses"}</ButtonLink>
        </>}
      />

      {!canEditDrafts && (
        <Alert tone="info">
          You have view-only access to the content catalog{canPublish ? " and publishing workflows" : ""}. Draft editing controls stay hidden.
        </Alert>
      )}
      {hasError && <Alert tone="error" action={<Button variant="secondary" onClick={retry}>Try again</Button>}>Dashboard data could not be loaded. Your content remains safe.</Alert>}

      <section aria-labelledby="statistics-heading">
        <SectionHeader title={role === "administrator" ? "Platform overview" : "My Courses at a glance"} description="Live totals for content visible to your account through database access policies." />
        <h2 id="statistics-heading" className="sr-only">Statistics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {statItems.map(([key, label, icon]) => (
            <Card key={key} className="p-5">
              {isLoading ? <><LoadingSkeleton className="h-10 w-10" /><LoadingSkeleton className="mt-5 h-8 w-16" /><LoadingSkeleton className="mt-2 h-4 w-24" /></> : (
                <><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><AdminIcon name={icon} className="h-5 w-5" /></span>
                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{data?.stats[key] ?? 0}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{label}</p></>
              )}
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section>
          <SectionHeader title="Recent courses" description="Pick up where the content team left off." action={<ButtonLink to="/admin/courses" variant="ghost">View all</ButtonLink>} />
          <Card className="mt-4 overflow-hidden">
            {isLoading ? <div className="space-y-5 p-5">{[1, 2, 3].map((item) => <LoadingSkeleton key={item} className="h-16" />)}</div> :
              data?.recentCourses.length ? <ul className="divide-y divide-slate-200">
                {data.recentCourses.map((course) => <li key={course.id}>
                  <Link to={`/admin/courses/${course.id}`} className="admin-focus flex items-center gap-4 p-5 transition hover:bg-slate-50">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl">{course.emoji || "📘"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-slate-950">{course.title}</strong><StatusBadge status={course.status} /></span>
                      <span className="mt-1 block text-xs text-slate-500">{course.unitCount} {course.unitCount === 1 ? "unit" : "units"} · Updated {formatRelativeDate(course.updatedAt)}</span>
                    </span>
                    <AdminIcon name="chevron-right" className="h-5 w-5 text-slate-400" />
                  </Link>
                </li>)}
              </ul> : <div className="p-10 text-center text-sm text-slate-600">No courses are visible yet.</div>}
          </Card>
        </section>

        <div className="space-y-6">
          <section>
            <SectionHeader title="Needs attention" description="Draft structures that may need another authoring pass." />
            <Card className="mt-4 divide-y divide-slate-200">
              {[
                ["Courses without units", data?.attention.draftCoursesWithoutUnits ?? 0],
                ["Units without lessons", data?.attention.draftUnitsWithoutLessons ?? 0],
                ["Lessons without activities", data?.attention.draftLessonsWithoutContent ?? 0],
              ].map(([label, count]) => <div key={label} className="flex items-center justify-between px-5 py-4"><span className="text-sm text-slate-600">{label}</span>{isLoading ? <LoadingSkeleton className="h-6 w-8" /> : <span className={`text-sm font-bold ${count ? "text-amber-700" : "text-emerald-700"}`}>{count}</span>}</div>)}
            </Card>
          </section>
          <section>
            <SectionHeader title="Quick actions" />
            <Card className="mt-4 grid gap-2 p-3">
              {canEditDrafts && <ButtonLink to="/admin/courses?create=1" icon="plus">Create course</ButtonLink>}
              <ButtonLink to="/admin/courses" variant="secondary" icon="courses">Manage courses</ButtonLink>
              {data?.recentStudio && <ButtonLink to={`/admin/courses/${data.recentStudio.courseId}/units/${data.recentStudio.unitId}/lessons/${data.recentStudio.lessonId}/studio`} variant="secondary" icon="sparkle">Continue {data.recentStudio.lessonTitle}</ButtonLink>}
            </Card>
          </section>
        </div>
      </div>

      <section aria-labelledby="workspace-heading">
        <SectionHeader title="Teacher workspace" description="My Courses is available now. Other workspace areas are planned for a future phase." />
        <div id="workspace-heading" className="mt-4 grid gap-4 sm:grid-cols-3">
          {futureWorkspaceSections.map((section) => <Card key={section} className="flex items-center justify-between gap-4 p-5 opacity-75">
            <div><h2 className="font-semibold text-slate-900">{section}</h2><p className="mt-1 text-sm text-slate-600">{section} are coming in the next development phase.</p></div>
            <span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">Coming later</span>
          </Card>)}
        </div>
      </section>
    </section>
  );
}

export default AdminDashboardPage;
