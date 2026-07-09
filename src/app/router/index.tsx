import { createBrowserRouter } from "react-router-dom";

import DashboardPage from "../../features/dashboard/DashboardPage";
import LoginPage from "../../features/auth/LoginPage";
import CoursesPage from "../../features/courses/CoursesPage";
import UnitsPage from "../../features/units/UnitsPage";
import LessonsPage from "../../features/lessons/LessonsPage";
import LessonPage from "../../features/lesson/LessonPage";
import TheoryPage from "../../features/activities/theory/TheoryPage";

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
  {
    path: "/theory/:lessonId",
    element: <TheoryPage />,
  },
]);