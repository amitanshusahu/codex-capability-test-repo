import { Router } from "express";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createCourseController,
  createDiscussionController,
  createLessonController,
  createModuleController,
  createNoteController,
  createQuizController,
  deleteNoteController,
  getCourseByIdController,
  getStudentSubscriptionsController,
  listCoursesController,
  listDiscussionsController,
  listNotesController,
  replyToDiscussionController,
  subscribeToCourseController,
  updateNoteController,
} from "@/controllers/course.controller";

const router = Router();

router.get("/", listCoursesController);
router.get("/me/subscriptions", requireAuth, requireRole(UserRole.STUDENT), getStudentSubscriptionsController);

router.post("/", requireAuth, requireRole(UserRole.ADMIN), createCourseController);
router.post("/:courseId/modules", requireAuth, requireRole(UserRole.ADMIN), createModuleController);
router.post("/modules/:moduleId/lessons", requireAuth, requireRole(UserRole.ADMIN), createLessonController);
router.post("/:courseId/quizzes", requireAuth, requireRole(UserRole.ADMIN), createQuizController);

router.post("/:courseId/subscribe", requireAuth, requireRole(UserRole.STUDENT), subscribeToCourseController);

router.get("/lessons/:lessonId/discussions", requireAuth, listDiscussionsController);
router.post("/lessons/:lessonId/discussions", requireAuth, createDiscussionController);
router.post("/discussions/:discussionId/replies", requireAuth, replyToDiscussionController);

router.get("/lessons/:lessonId/notes", requireAuth, listNotesController);
router.post("/lessons/:lessonId/notes", requireAuth, requireRole(UserRole.STUDENT), createNoteController);
router.put("/notes/:noteId", requireAuth, requireRole(UserRole.STUDENT), updateNoteController);
router.delete("/notes/:noteId", requireAuth, requireRole(UserRole.STUDENT), deleteNoteController);

router.get("/:courseId", getCourseByIdController);

export default router;
