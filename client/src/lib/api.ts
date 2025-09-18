const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_PREFIX = "/api/v1";

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_PREFIX}/auth/login`,
    SIGNUP: `${API_PREFIX}/auth/signup`,
    ME: `${API_PREFIX}/auth/me`,
  },
  COURSES: {
    ROOT: `${API_PREFIX}/courses`,
    DETAIL: (courseId: string) => `${API_PREFIX}/courses/${courseId}`,
    MODULES: (courseId: string) => `${API_PREFIX}/courses/${courseId}/modules`,
    LESSONS: (moduleId: string) => `${API_PREFIX}/courses/modules/${moduleId}/lessons`,
    QUIZZES: (courseId: string) => `${API_PREFIX}/courses/${courseId}/quizzes`,
    SUBSCRIBE: (courseId: string) => `${API_PREFIX}/courses/${courseId}/subscribe`,
    DISCUSSIONS: (lessonId: string) => `${API_PREFIX}/courses/lessons/${lessonId}/discussions`,
    DISCUSSION_REPLY: (discussionId: string) => `${API_PREFIX}/courses/discussions/${discussionId}/replies`,
    NOTES: (lessonId: string) => `${API_PREFIX}/courses/lessons/${lessonId}/notes`,
    NOTE_DETAIL: (noteId: string) => `${API_PREFIX}/courses/notes/${noteId}`,
    SUBSCRIPTIONS: `${API_PREFIX}/courses/me/subscriptions`,
  }
} as const;

export const localKey = {
  token: "course-app-token",
  user: "course-app-user",
};

export { API_BASE_URL };
