import { courseService } from "@/services/course.service";
import {
  CreateCourseRequest,
  CreateDiscussionRequest,
  CreateLessonRequest,
  CreateModuleRequest,
  CreateNoteRequest,
  CreateQuizRequest,
  ReplyDiscussionRequest,
  UpdateNoteRequest,
} from "@/types/zod";
import { errorHandler } from "@/utils/error";
import { Request, Response } from "express";

export async function listCoursesController(req: Request, res: Response): Promise<Response> {
  try {
    const courses = await courseService.listCourses();
    return res.status(200).json({ success: true, data: { courses } });
  } catch (error) {
    return errorHandler(error, "Error listing courses", res);
  }
}

export async function getCourseByIdController(req: Request, res: Response): Promise<Response> {
  try {
    const { courseId } = req.params;
    const course = await courseService.getCourseById(courseId);
    return res.status(200).json({ success: true, data: { course } });
  } catch (error) {
    return errorHandler(error, "Error fetching course", res);
  }
}

export async function createCourseController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const payload = CreateCourseRequest.parse(req.body);
    const course = await courseService.createCourse(req.user.id, payload);
    return res.status(201).json({ success: true, message: "Course created", data: { course } });
  } catch (error) {
    return errorHandler(error, "Error creating course", res);
  }
}

export async function createModuleController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = CreateModuleRequest.parse(req.body);
    const { courseId } = req.params;
    const module = await courseService.createModule(req.user.id, courseId, payload);
    return res.status(201).json({ success: true, message: "Module created", data: { module } });
  } catch (error) {
    return errorHandler(error, "Error creating module", res);
  }
}

export async function createLessonController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = CreateLessonRequest.parse(req.body);
    const { moduleId } = req.params;
    const lesson = await courseService.createLesson(req.user.id, moduleId, payload);
    return res.status(201).json({ success: true, message: "Lesson created", data: { lesson } });
  } catch (error) {
    return errorHandler(error, "Error creating lesson", res);
  }
}

export async function createQuizController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = CreateQuizRequest.parse(req.body);
    const { courseId } = req.params;
    const quiz = await courseService.createQuiz(req.user.id, courseId, payload);
    return res.status(201).json({ success: true, message: "Quiz created", data: { quiz } });
  } catch (error) {
    return errorHandler(error, "Error creating quiz", res);
  }
}

export async function subscribeToCourseController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { courseId } = req.params;
    const subscription = await courseService.subscribeToCourse(courseId, req.user.id);
    return res.status(200).json({ success: true, message: "Subscribed", data: { subscription } });
  } catch (error) {
    return errorHandler(error, "Error subscribing to course", res);
  }
}

export async function getStudentSubscriptionsController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const subscriptions = await courseService.getStudentSubscriptions(req.user.id);
    return res.status(200).json({ success: true, data: { subscriptions } });
  } catch (error) {
    return errorHandler(error, "Error fetching subscriptions", res);
  }
}

export async function createDiscussionController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = CreateDiscussionRequest.parse(req.body);
    const { lessonId } = req.params;
    const discussion = await courseService.createDiscussion(req.user.id, lessonId, payload);
    return res.status(201).json({ success: true, message: "Discussion created", data: { discussion } });
  } catch (error) {
    return errorHandler(error, "Error creating discussion", res);
  }
}

export async function listDiscussionsController(req: Request, res: Response): Promise<Response> {
  try {
    const { lessonId } = req.params;
    const discussions = await courseService.listDiscussions(lessonId);
    return res.status(200).json({ success: true, data: { discussions } });
  } catch (error) {
    return errorHandler(error, "Error fetching discussions", res);
  }
}

export async function replyToDiscussionController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = ReplyDiscussionRequest.parse(req.body);
    const { discussionId } = req.params;
    const reply = await courseService.replyToDiscussion(req.user.id, discussionId, payload.content);
    return res.status(201).json({ success: true, message: "Reply added", data: { reply } });
  } catch (error) {
    return errorHandler(error, "Error replying to discussion", res);
  }
}

export async function createNoteController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = CreateNoteRequest.parse(req.body);
    const { lessonId } = req.params;
    const note = await courseService.createNote(req.user.id, lessonId, payload);
    return res.status(201).json({ success: true, message: "Note saved", data: { note } });
  } catch (error) {
    return errorHandler(error, "Error creating note", res);
  }
}

export async function listNotesController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { lessonId } = req.params;
    const notes = await courseService.listNotes(req.user.id, lessonId);
    return res.status(200).json({ success: true, data: { notes } });
  } catch (error) {
    return errorHandler(error, "Error fetching notes", res);
  }
}

export async function updateNoteController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = UpdateNoteRequest.parse(req.body);
    const { noteId } = req.params;
    const note = await courseService.updateNote(req.user.id, noteId, payload);
    return res.status(200).json({ success: true, message: "Note updated", data: { note } });
  } catch (error) {
    return errorHandler(error, "Error updating note", res);
  }
}

export async function deleteNoteController(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { noteId } = req.params;
    await courseService.deleteNote(req.user.id, noteId);
    return res.status(204).send();
  } catch (error) {
    return errorHandler(error, "Error deleting note", res);
  }
}
