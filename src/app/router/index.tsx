import { createBrowserRouter } from "react-router-dom";

import DashboardPage from "../../features/dashboard/DashboardPage.tsx";
import LoginPage from "../../features/auth/LoginPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);