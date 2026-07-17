import {
  Navigate,
  createBrowserRouter,
} from "react-router-dom";

import AdminCoursesPage from "../../features/admin/courses/AdminCoursesPage";
import AdminLayout from "../../features/admin/layouts/AdminLayout";
import AdminRoute from "../../features/admin/routing/AdminRoute";
import DashboardPage from "../../features/dashboard/DashboardPage";
import LoginPage from "../../features/auth/LoginPage";
import CoursesPage from "../../features/courses/CoursesPage";
import UnitsPage from "../../features/units/UnitsPage";
import LessonsPage from "../../features/lessons/LessonsPage";
import LessonPage from "../../features/lesson/LessonPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: (
              <Navigate
                to="courses"
                replace
              />
            ),
          },
          {
            path: "courses",
            element: <AdminCoursesPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/courses",
    element: <CoursesPage />,
  },
  {
    path: "/courses/:courseId",
    element: <UnitsPage />,
  },
  {
    path: "/units/:unitId",
    element: <LessonsPage />,
  },
  {
    path: "/lessons/:lessonId",
    element: <LessonPage />,
  },
]);
