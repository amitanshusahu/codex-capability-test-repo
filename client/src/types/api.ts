export type UserRole = "ADMIN" | "STUDENT";
export type DiscussionType = "COMMENT" | "QUESTION";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  content?: string | null;
  materialUrl?: string | null;
  note?: string | null;
  order: number;
  duration?: number | null;
}

export interface Module {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  questions: QuizQuestion[];
}

export interface CourseSubscription {
  id: string;
  studentId: string;
  courseId: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  price?: number | null;
  level?: string | null;
  tags: string[];
  modules: Module[];
  quizzes: Quiz[];
  creator: Pick<ApiUser, "id" | "name">;
  subscriptions: CourseSubscription[];
  discussions?: LessonDiscussion[];
}

export interface LessonDiscussionReply {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<ApiUser, "id" | "name">;
}

export interface LessonDiscussion {
  id: string;
  type: DiscussionType;
  content: string;
  createdAt: string;
  author: Pick<ApiUser, "id" | "name">;
  replies: LessonDiscussionReply[];
}

export interface StudentNote {
  id: string;
  title?: string | null;
  content: string;
  timestamp?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
