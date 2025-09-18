import { AppError } from "@/utils/error/errors";
import { prisma } from "@/utils/prisma";
import { DiscussionType, UserRole } from "@prisma/client";

type CreateCourseInput = {
  title: string;
  description: string;
  thumbnailUrl?: string;
  price?: number;
  level?: string;
  tags?: string[];
};

type CreateModuleInput = {
  title: string;
  description?: string;
  order: number;
};

type CreateLessonInput = {
  title: string;
  videoUrl: string;
  content?: string;
  materialUrl?: string;
  note?: string;
  order: number;
  duration?: number;
};

type CreateQuizInput = {
  title: string;
  description?: string;
  questions: unknown;
};

type CreateDiscussionInput = {
  type: DiscussionType;
  content: string;
};

type CreateNoteInput = {
  title?: string;
  content: string;
  timestamp?: number;
};

const courseInclude = {
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        orderBy: { order: "asc" as const }
      }
    }
  },
  quizzes: true,
};

export const courseService = {
  async createCourse(adminId: string, data: CreateCourseInput) {
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        price: data.price,
        level: data.level,
        tags: data.tags ?? [],
        createdBy: adminId,
      },
      include: courseInclude,
    });

    return course;
  },

  async listCourses() {
    return prisma.course.findMany({
      include: {
        ...courseInclude,
        creator: {
          select: {
            id: true,
            name: true,
          }
        },
        subscriptions: true,
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async getCourseById(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        ...courseInclude,
        creator: {
          select: { id: true, name: true }
        },
        subscriptions: true,
        discussions: {
          include: {
            author: { select: { id: true, name: true } },
            replies: {
              include: { author: { select: { id: true, name: true } } },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return course;
  },

  async createModule(adminId: string, courseId: string, data: CreateModuleInput) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    if (course.createdBy !== adminId) {
      throw new AppError("Only the course creator can add modules", 403);
    }

    const module = await prisma.module.create({
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        courseId,
      },
      include: {
        lessons: true,
      }
    });

    return module;
  },

  async createLesson(adminId: string, moduleId: string, data: CreateLessonInput) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true }
    });

    if (!module) {
      throw new AppError("Module not found", 404);
    }

    if (module.course.createdBy !== adminId) {
      throw new AppError("Only the course creator can add lessons", 403);
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        videoUrl: data.videoUrl,
        content: data.content,
        materialUrl: data.materialUrl,
        note: data.note,
        order: data.order,
        duration: data.duration,
        moduleId,
      }
    });

    return lesson;
  },

  async createQuiz(adminId: string, courseId: string, data: CreateQuizInput) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    if (course.createdBy !== adminId) {
      throw new AppError("Only the course creator can add quizzes", 403);
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        questions: data.questions,
      }
    });

    return quiz;
  },

  async subscribeToCourse(courseId: string, studentId: string) {
    const existingSubscription = await prisma.courseSubscription.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        }
      }
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return prisma.courseSubscription.create({
      data: {
        courseId,
        studentId,
      }
    });
  },

  async getStudentSubscriptions(studentId: string) {
    return prisma.courseSubscription.findMany({
      where: { studentId },
      include: {
        course: {
          include: courseInclude,
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async createDiscussion(userId: string, lessonId: string, payload: CreateDiscussionInput) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: { include: { course: true } }
      }
    });

    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    const courseId = lesson.module.courseId;

    if (lesson.module.course.createdBy !== userId) {
      const subscription = await prisma.courseSubscription.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId
          }
        }
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role === UserRole.STUDENT && !subscription) {
        throw new AppError("Subscribe to the course to participate in discussions", 403);
      }
    }

    return prisma.lessonDiscussion.create({
      data: {
        lessonId,
        courseId,
        authorId: userId,
        content: payload.content,
        type: payload.type,
      },
      include: {
        author: { select: { id: true, name: true } },
        replies: {
          include: { author: { select: { id: true, name: true } } }
        }
      }
    });
  },

  async listDiscussions(lessonId: string) {
    return prisma.lessonDiscussion.findMany({
      where: { lessonId },
      include: {
        author: { select: { id: true, name: true } },
        replies: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async replyToDiscussion(userId: string, discussionId: string, content: string) {
    const discussion = await prisma.lessonDiscussion.findUnique({
      where: { id: discussionId },
      include: {
        course: true,
      }
    });

    if (!discussion) {
      throw new AppError("Discussion not found", 404);
    }

    if (discussion.course.createdBy !== userId) {
      const subscription = await prisma.courseSubscription.findUnique({
        where: {
          courseId_studentId: {
            courseId: discussion.courseId,
            studentId: userId,
          }
        }
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role === UserRole.STUDENT && !subscription) {
        throw new AppError("Subscribe to the course to reply", 403);
      }
    }

    return prisma.lessonDiscussionReply.create({
      data: {
        discussionId,
        authorId: userId,
        content,
      },
      include: {
        author: { select: { id: true, name: true } }
      }
    });
  },

  async createNote(studentId: string, lessonId: string, payload: CreateNoteInput) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
      }
    });

    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    const subscription = await prisma.courseSubscription.findUnique({
      where: {
        courseId_studentId: {
          courseId: lesson.module.courseId,
          studentId,
        }
      }
    });

    if (!subscription) {
      throw new AppError("Subscribe to the course to create notes", 403);
    }

    return prisma.studentNote.create({
      data: {
        lessonId,
        studentId,
        title: payload.title,
        content: payload.content,
        timestamp: payload.timestamp,
      }
    });
  },

  async listNotes(studentId: string, lessonId: string) {
    return prisma.studentNote.findMany({
      where: {
        studentId,
        lessonId,
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async updateNote(studentId: string, noteId: string, payload: CreateNoteInput) {
    const note = await prisma.studentNote.findUnique({ where: { id: noteId } });

    if (!note || note.studentId !== studentId) {
      throw new AppError("Note not found", 404);
    }

    return prisma.studentNote.update({
      where: { id: noteId },
      data: {
        title: payload.title,
        content: payload.content,
        timestamp: payload.timestamp,
      }
    });
  },

  async deleteNote(studentId: string, noteId: string) {
    const note = await prisma.studentNote.findUnique({ where: { id: noteId } });

    if (!note || note.studentId !== studentId) {
      throw new AppError("Note not found", 404);
    }

    await prisma.studentNote.delete({ where: { id: noteId } });
  }
};
