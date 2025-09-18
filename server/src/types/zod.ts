import { DiscussionType } from "@prisma/client";
import { z } from "zod";

export const LoginRequest = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequestParams = z.infer<typeof LoginRequest>;

export const SignupRequest = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const CreateCourseRequest = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnailUrl: z.string().url().optional(),
  price: z.number().nonnegative().optional(),
  level: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateModuleRequest = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

export const CreateLessonRequest = z.object({
  title: z.string().min(1, "Title is required"),
  videoUrl: z.string().url("Video URL must be a valid URL"),
  content: z.string().optional(),
  materialUrl: z.string().url("Material URL must be a valid URL").optional(),
  note: z.string().optional(),
  order: z.number().int().min(0),
  duration: z.number().int().min(0).optional(),
});

export const CreateQuizRequest = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      question: z.string().min(1, "Question is required"),
      options: z.array(z.string().min(1)).min(2, "At least two options required"),
      answer: z.string().min(1, "Answer is required"),
    })
  ).min(1, "At least one question is required"),
});

export const CreateDiscussionRequest = z.object({
  type: z.nativeEnum(DiscussionType),
  content: z.string().min(1, "Content is required"),
});

export const ReplyDiscussionRequest = z.object({
  content: z.string().min(1, "Content is required"),
});

export const CreateNoteRequest = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  timestamp: z.number().nonnegative().optional(),
});

export const UpdateNoteRequest = CreateNoteRequest;
