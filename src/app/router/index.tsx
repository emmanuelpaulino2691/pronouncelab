/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import AdminRoute from "../../features/admin/routing/AdminRoute";

const DashboardPage = lazy(() => import("../../features/dashboard/DashboardPage"));
const CoursesPage = lazy(() => import("../../features/courses/CoursesPage"));
const UnitsPage = lazy(() => import("../../features/units/UnitsPage"));
const LessonsPage = lazy(() => import("../../features/lessons/LessonsPage"));
const LessonPage = lazy(() => import("../../features/lesson/LessonPage"));
const LoginPage = lazy(() => import("../../features/auth/LoginPage"));
const AdminLayout = lazy(() => import("../../features/admin/layouts/AdminLayout"));
const AdminDashboardPage = lazy(() => import("../../features/admin/dashboard/AdminDashboardPage"));
const AdminCoursesPage = lazy(() => import("../../features/admin/courses/AdminCoursesPage"));
const AdminCourseUnitsPage = lazy(() => import("../../features/admin/units/AdminCourseUnitsPage"));
const AdminUnitLessonsPage = lazy(() => import("../../features/admin/lessons/AdminUnitLessonsPage"));
const LessonStudioPage = lazy(() => import("../../features/admin/lesson-studio/pages/LessonStudioPage"));

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div role="status" className="grid min-h-64 place-items-center text-sm font-medium text-slate-500">Loading PronounceLab…</div>}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LazyRoute><DashboardPage /></LazyRoute>,
  },
  {
    path: "/login",
    element: <LazyRoute><LoginPage /></LazyRoute>,
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <LazyRoute><AdminLayout /></LazyRoute>,
        children: [
          {
            index: true,
            element: <LazyRoute><AdminDashboardPage /></LazyRoute>,
          },
          {
            path: "courses",
            element: <LazyRoute><AdminCoursesPage /></LazyRoute>,
          },
          {
            path: "courses/:courseId",
            element: <LazyRoute><AdminCourseUnitsPage /></LazyRoute>,
          },
          {
            path: "courses/:courseId/units/:unitId",
            element: <LazyRoute><AdminUnitLessonsPage /></LazyRoute>,
          },
          {
            path: "courses/:courseId/units/:unitId/lessons/:lessonId/studio",
            element: <LazyRoute><LessonStudioPage /></LazyRoute>,
          },
        ],
      },
    ],
  },
  {
    path: "/courses",
    element: <LazyRoute><CoursesPage /></LazyRoute>,
  },
  {
    path: "/courses/:courseId",
    element: <LazyRoute><UnitsPage /></LazyRoute>,
  },
  {
    path: "/units/:unitId",
    element: <LazyRoute><LessonsPage /></LazyRoute>,
  },
  {
    path: "/lessons/:lessonId",
    element: <LazyRoute><LessonPage /></LazyRoute>,
  },
]);
