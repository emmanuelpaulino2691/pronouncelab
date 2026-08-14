/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { routeModuleLoaders } from "./routeModules";

const AdminRoute = lazy(routeModuleLoaders.adminRoute);
const DashboardPage = lazy(routeModuleLoaders.dashboard);
const CoursesPage = lazy(routeModuleLoaders.courses);
const UnitsPage = lazy(routeModuleLoaders.units);
const LessonsPage = lazy(routeModuleLoaders.lessons);
const LessonPage = lazy(routeModuleLoaders.lesson);
const LoginPage = lazy(routeModuleLoaders.login);
const AdminLayout = lazy(routeModuleLoaders.adminLayout);
const AdminDashboardPage = lazy(routeModuleLoaders.adminDashboard);
const AdminCoursesPage = lazy(routeModuleLoaders.adminCourses);
const AdminCourseUnitsPage = lazy(routeModuleLoaders.courseWorkspace);
const AdminUnitLessonsPage = lazy(routeModuleLoaders.unitLessons);
const LessonStudioPage = lazy(routeModuleLoaders.lessonStudio);
const AdminClassesPage = lazy(routeModuleLoaders.classes);
const CreateClassForm = lazy(routeModuleLoaders.createClass);
const ClassWorkspaceLayout = lazy(routeModuleLoaders.classWorkspace);
const LearnerClassesPage = lazy(routeModuleLoaders.learnerClasses);
const ReleaseCoursePage = lazy(routeModuleLoaders.releaseCourse);
const ReleaseLessonPage = lazy(routeModuleLoaders.releaseLesson);
const StudentPreviewCoursePage = lazy(routeModuleLoaders.previewCourse);
const StudentPreviewLessonPage = lazy(routeModuleLoaders.previewLesson);
const AdminMediaLibraryPage = lazy(routeModuleLoaders.mediaLibrary);

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
    element: <LazyRoute><AdminRoute /></LazyRoute>,
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
          {
            path: "classes",
            element: <LazyRoute><AdminClassesPage /></LazyRoute>,
          },
          {
            path: "media",
            element: <LazyRoute><AdminMediaLibraryPage /></LazyRoute>,
          },
          {
            path: "classes/new",
            element: <LazyRoute><CreateClassForm /></LazyRoute>,
          },
          {
            path: "classes/:classId",
            element: <LazyRoute><ClassWorkspaceLayout /></LazyRoute>,
          },
          {
            path: "preview/courses/:courseId",
            element: <LazyRoute><StudentPreviewCoursePage /></LazyRoute>,
          },
          {
            path: "preview/courses/:courseId/lessons/:lessonId",
            element: <LazyRoute><StudentPreviewLessonPage /></LazyRoute>,
          },
        ],
      },
    ],
  },
  {
    path: "/releases/:releaseId",
    element: <LazyRoute><ReleaseCoursePage /></LazyRoute>,
  },
  {
    path: "/releases/:releaseId/lessons/:releaseLessonId",
    element: <LazyRoute><ReleaseLessonPage /></LazyRoute>,
  },
  {
    path: "/classes",
    element: <LazyRoute><LearnerClassesPage /></LazyRoute>,
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
