import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import MyLearningPage from "./pages/MyLearningPage";
import AuthPage from "./pages/AuthPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <CoursesPage /> },
          { path: "courses/:courseId", element: <CourseDetailPage /> },
          { path: "my-learning", element: <MyLearningPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <AuthPage />,
  },
]);
