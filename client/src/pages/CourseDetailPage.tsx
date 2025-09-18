import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "../lib/axios/axios";
import { API_ROUTES } from "../lib/api";
import type {
  ApiResponse,
  Course,
  Lesson,
  LessonDiscussion,
  StudentNote,
  DiscussionType,
} from "../types/api";
import { useAuth } from "../hooks/useAuth";

const fetchCourse = async (courseId: string) => {
  const response = await api.get<ApiResponse<{ course: Course }>>(API_ROUTES.COURSES.DETAIL(courseId));
  return response.data.data.course;
};

const fetchLessonNotes = async (lessonId: string) => {
  const response = await api.get<ApiResponse<{ notes: StudentNote[] }>>(API_ROUTES.COURSES.NOTES(lessonId));
  return response.data.data.notes;
};

const fetchLessonDiscussions = async (lessonId: string) => {
  const response = await api.get<ApiResponse<{ discussions: LessonDiscussion[] }>>(API_ROUTES.COURSES.DISCUSSIONS(lessonId));
  return response.data.data.discussions;
};

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const {
    data: course,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId as string),
    enabled: Boolean(courseId),
  });

  useEffect(() => {
    if (!course) return;
    if (!selectedModuleId || !course.modules.some((module) => module.id === selectedModuleId)) {
      const firstModule = course.modules[0];
      setSelectedModuleId(firstModule ? firstModule.id : null);
      setSelectedLessonId(firstModule && firstModule.lessons[0] ? firstModule.lessons[0].id : null);
    }
  }, [course, selectedModuleId]);

  useEffect(() => {
    if (!course || !selectedModuleId) return;
    const module = course.modules.find((item) => item.id === selectedModuleId);
    if (!module) {
      setSelectedLessonId(null);
      return;
    }
    if (!selectedLessonId || !module.lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(module.lessons[0] ? module.lessons[0].id : null);
    }
  }, [course, selectedModuleId, selectedLessonId]);

  const selectedModule = useMemo(
    () => course?.modules.find((module) => module.id === selectedModuleId) ?? null,
    [course, selectedModuleId]
  );

  const selectedLesson = useMemo(
    () => selectedModule?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [selectedModule, selectedLessonId]
  );

  const isStudentSubscribed = useMemo(() => {
    if (!course || !user || user.role !== "STUDENT") return false;
    return course.subscriptions.some((subscription) => subscription.studentId === user.id);
  }, [course, user]);

  const canAccessLesson = useMemo(() => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return isStudentSubscribed;
  }, [user, isStudentSubscribed]);

  const { data: notes = [] } = useQuery({
    queryKey: ["lesson", selectedLessonId, "notes"],
    queryFn: () => fetchLessonNotes(selectedLessonId as string),
    enabled: Boolean(selectedLessonId) && user?.role === "STUDENT" && canAccessLesson,
  });

  const { data: discussions = [] } = useQuery({
    queryKey: ["lesson", selectedLessonId, "discussions"],
    queryFn: () => fetchLessonDiscussions(selectedLessonId as string),
    enabled: Boolean(selectedLessonId) && canAccessLesson,
  });

  const moduleMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string; order: number }) => {
      const response = await api.post<ApiResponse<{ module: { id: string } }>>(
        API_ROUTES.COURSES.MODULES(courseId as string),
        payload
      );
      return response.data.data.module;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    }
  });

  const lessonMutation = useMutation({
    mutationFn: async (payload: {
      moduleId: string;
      title: string;
      videoUrl: string;
      content?: string;
      materialUrl?: string;
      note?: string;
      order: number;
      duration?: number;
    }) => {
      await api.post<ApiResponse<{ lesson: Lesson }>>(
        API_ROUTES.COURSES.LESSONS(payload.moduleId),
        {
          title: payload.title,
          videoUrl: payload.videoUrl,
          content: payload.content,
          materialUrl: payload.materialUrl,
          note: payload.note,
          order: payload.order,
          duration: payload.duration,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    }
  });

  const quizMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string; questions: unknown }) => {
      await api.post<ApiResponse<{ quiz: unknown }>>(
        API_ROUTES.COURSES.QUIZZES(courseId as string),
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setQuizError(null);
    },
    onError: () => {
      setQuizError("Failed to create quiz. Please review the input format.");
    }
  });

  const noteMutation = useMutation({
    mutationFn: async (payload: { lessonId: string; title?: string; content: string; timestamp?: number }) => {
      await api.post<ApiResponse<{ note: StudentNote }>>(
        API_ROUTES.COURSES.NOTES(payload.lessonId),
        payload
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.lessonId, "notes"] });
    }
  });

  const discussionMutation = useMutation({
    mutationFn: async (payload: { lessonId: string; type: DiscussionType; content: string }) => {
      await api.post<ApiResponse<{ discussion: LessonDiscussion }>>(
        API_ROUTES.COURSES.DISCUSSIONS(payload.lessonId),
        payload
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.lessonId, "discussions"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async (payload: { discussionId: string; lessonId: string; content: string }) => {
      await api.post<ApiResponse<{ reply: unknown }>>(
        API_ROUTES.COURSES.DISCUSSION_REPLY(payload.discussionId),
        { content: payload.content }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.lessonId, "discussions"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    }
  });

  const handleCreateModule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseId) return;
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || undefined;
    const orderValue = Number(formData.get("order") ?? 0);
    moduleMutation.mutate({ title, description, order: Number.isNaN(orderValue) ? 0 : orderValue });
    event.currentTarget.reset();
  };

  const handleCreateLesson = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedModuleId) return;
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const videoUrl = String(formData.get("videoUrl") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim() || undefined;
    const materialUrl = String(formData.get("materialUrl") ?? "").trim() || undefined;
    const instructorNote = String(formData.get("note") ?? "").trim() || undefined;
    const orderValue = Number(formData.get("order") ?? 0);
    const durationValue = Number(formData.get("duration") ?? 0);
    lessonMutation.mutate({
      moduleId: selectedModuleId,
      title,
      videoUrl,
      content,
      materialUrl,
      note: instructorNote,
      order: Number.isNaN(orderValue) ? 0 : orderValue,
      duration: Number.isNaN(durationValue) ? undefined : durationValue,
    });
    event.currentTarget.reset();
  };

  const handleCreateQuiz = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseId) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || undefined;
    const rawQuestions = String(formData.get("questions") ?? "").trim();

    try {
      const questions = rawQuestions
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [question, optionsRaw, answer] = line.split("|").map((part) => part.trim());
          if (!question || !optionsRaw || !answer) {
            throw new Error("Invalid question format");
          }
          const options = optionsRaw
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean);
          if (options.length < 2) {
            throw new Error("Each question requires at least two options");
          }
          return { question, options, answer };
        });
      quizMutation.mutate({ title, description, questions });
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      setQuizError("Each line must follow the format: question | option A, option B | correct answer");
    }
  };

  const handleCreateNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLessonId) return;

    const formData = new FormData(event.currentTarget);
    const content = String(formData.get("content") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim() || undefined;
    const timestampValue = String(formData.get("timestamp") ?? "").trim();
    const timestamp = timestampValue ? Number(timestampValue) : undefined;

    noteMutation.mutate({ lessonId: selectedLessonId, content, title, timestamp });
    event.currentTarget.reset();
  };

  const handleCreateDiscussion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLessonId) return;

    const formData = new FormData(event.currentTarget);
    const type = (formData.get("type") as DiscussionType) ?? "COMMENT";
    const content = String(formData.get("content") ?? "").trim();

    discussionMutation.mutate({ lessonId: selectedLessonId, type, content });
    event.currentTarget.reset();
  };

  const handleReply = (event: FormEvent<HTMLFormElement>, discussionId: string) => {
    event.preventDefault();
    if (!selectedLessonId) return;
    const formData = new FormData(event.currentTarget);
    const content = String(formData.get("content") ?? "").trim();
    replyMutation.mutate({ discussionId, lessonId: selectedLessonId, content });
    event.currentTarget.reset();
  };

  if (isLoading || isFetching) {
    return <p className="text-slate-500">Loading course details...</p>;
  }

  if (!course) {
    return <p className="text-slate-500">Course not found.</p>;
  }

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">{course.title}</h2>
            <p className="text-sm text-slate-600">{course.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{course.modules.length} modules</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{course.quizzes.length} quizzes</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">Instructor: {course.creator.name}</span>
              {course.level && <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">{course.level}</span>}
            </div>
          </div>
          {user?.role === "STUDENT" && !isStudentSubscribed && (
            <div className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Subscribe from the course catalog to access all lessons.
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Course structure</h3>
            <div className="mt-4 space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="rounded-lg border border-slate-200">
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-4 py-3 text-left ${
                      selectedModuleId === module.id ? "bg-indigo-50" : "bg-white"
                    }`}
                    onClick={() => setSelectedModuleId(module.id)}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{module.title}</p>
                      {module.description && (
                        <p className="text-xs text-slate-500">{module.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{module.lessons.length} lessons</span>
                  </button>
                  {selectedModuleId === module.id && (
                    <div className="border-t border-slate-200">
                      {module.lessons.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">No lessons yet.</p>
                      ) : (
                        <ul className="divide-y divide-slate-200">
                          {module.lessons.map((lesson) => (
                            <li key={lesson.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
                                  selectedLessonId === lesson.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                                }`}
                              >
                                <span>{lesson.title}</span>
                                {lesson.duration ? (
                                  <span className="text-xs text-slate-500">{lesson.duration} min</span>
                                ) : null}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
                <h4 className="text-base font-semibold text-slate-900">Add module</h4>
                <form className="mt-3 space-y-3" onSubmit={handleCreateModule}>
                  <input
                    name="title"
                    placeholder="Module title"
                    required
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <textarea
                    name="description"
                    placeholder="Module description"
                    rows={2}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={course.modules.length}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Order"
                  />
                  <button
                    type="submit"
                    disabled={moduleMutation.isPending}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {moduleMutation.isPending ? "Saving..." : "Create module"}
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
                <h4 className="text-base font-semibold text-slate-900">Add lesson to selected module</h4>
                {selectedModule ? (
                  <form className="mt-3 space-y-3" onSubmit={handleCreateLesson}>
                    <input
                      name="title"
                      placeholder="Lesson title"
                      required
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      name="videoUrl"
                      placeholder="Video URL"
                      required
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <textarea
                      name="content"
                      placeholder="Lesson summary"
                      rows={2}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      name="materialUrl"
                      placeholder="Materials download link"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <textarea
                      name="note"
                      placeholder="Instructor notes"
                      rows={2}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        name="order"
                        type="number"
                        min={0}
                        defaultValue={selectedModule.lessons.length}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="Order"
                      />
                      <input
                        name="duration"
                        type="number"
                        min={0}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="Duration (minutes)"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={lessonMutation.isPending}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {lessonMutation.isPending ? "Saving..." : "Create lesson"}
                    </button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Select a module first.</p>
                )}
              </div>

              <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
                <h4 className="text-base font-semibold text-slate-900">Create quiz</h4>
                {quizError && <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{quizError}</p>}
                <form className="space-y-3" onSubmit={handleCreateQuiz}>
                  <input
                    name="title"
                    placeholder="Quiz title"
                    required
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <textarea
                    name="description"
                    placeholder="Quiz description"
                    rows={2}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <textarea
                    name="questions"
                    placeholder="One question per line: Question | Option A, Option B | Correct answer"
                    rows={4}
                    required
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={quizMutation.isPending}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {quizMutation.isPending ? "Saving..." : "Create quiz"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          {selectedLesson ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{selectedLesson.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Module: {selectedModule?.title}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div>
                    <p className="font-medium text-slate-700">Watch the lecture</p>
                    <a
                      href={selectedLesson.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {selectedLesson.videoUrl}
                    </a>
                  </div>
                  {selectedLesson.content && (
                    <div>
                      <p className="font-medium text-slate-700">Overview</p>
                      <p>{selectedLesson.content}</p>
                    </div>
                  )}
                  {selectedLesson.materialUrl && (
                    <div>
                      <p className="font-medium text-slate-700">Materials</p>
                      <a
                        href={selectedLesson.materialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Download resources
                      </a>
                    </div>
                  )}
                  {selectedLesson.note && (
                    <div className="rounded-md bg-indigo-50 p-3 text-sm text-indigo-800">
                      {selectedLesson.note}
                    </div>
                  )}
                </div>
              </div>

              {canAccessLesson && user?.role === "STUDENT" && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-slate-900">Your notes</h4>
                  <form className="mt-3 space-y-3" onSubmit={handleCreateNote}>
                    <input
                      name="title"
                      placeholder="Note title (optional)"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <textarea
                      name="content"
                      placeholder="Capture your ideas or questions"
                      rows={3}
                      required
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      name="timestamp"
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="Timestamp (minutes)"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={noteMutation.isPending}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {noteMutation.isPending ? "Saving..." : "Save note"}
                    </button>
                  </form>
                  <div className="mt-4 space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-sm text-slate-500">No notes yet. Capture your learning highlights.</p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="rounded-md border border-slate-200 p-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{new Date(note.updatedAt).toLocaleString()}</span>
                            {note.timestamp !== null && note.timestamp !== undefined && (
                              <span>{note.timestamp} min</span>
                            )}
                          </div>
                          {note.title && <p className="mt-1 text-sm font-medium text-slate-700">{note.title}</p>}
                          <p className="text-sm text-slate-600">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="text-base font-semibold text-slate-900">Community discussions</h4>
                {canAccessLesson ? (
                  <>
                    <form className="mt-3 space-y-3" onSubmit={handleCreateDiscussion}>
                      <select
                        name="type"
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="COMMENT">Comment</option>
                        <option value="QUESTION">Question</option>
                      </select>
                      <textarea
                        name="content"
                        placeholder="Share feedback or ask a question"
                        rows={3}
                        required
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={discussionMutation.isPending}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                      >
                        {discussionMutation.isPending ? "Posting..." : "Post"}
                      </button>
                    </form>
                    <div className="mt-4 space-y-4">
                      {discussions.length === 0 ? (
                        <p className="text-sm text-slate-500">No discussions yet. Be the first to start the conversation.</p>
                      ) : (
                        discussions.map((discussion) => (
                          <div key={discussion.id} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="font-medium text-slate-700">{discussion.author.name}</span>
                              <span>{new Date(discussion.createdAt).toLocaleString()}</span>
                            </div>
                            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                              {discussion.type === "QUESTION" ? "Question" : "Comment"}
                            </span>
                            <p className="mt-2 text-sm text-slate-700">{discussion.content}</p>
                            <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                              {discussion.replies.map((reply) => (
                                <div key={reply.id} className="rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                                  <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span className="font-medium text-slate-600">{reply.author.name}</span>
                                    <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="mt-1">{reply.content}</p>
                                </div>
                              ))}
                              {canAccessLesson && (
                                <form onSubmit={(event) => handleReply(event, discussion.id)} className="space-y-2">
                                  <textarea
                                    name="content"
                                    rows={2}
                                    required
                                    placeholder="Write a reply"
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    disabled={replyMutation.isPending}
                                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                                  >
                                    {replyMutation.isPending ? "Replying..." : "Reply"}
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Subscribe to access community discussions.</p>
                )}
              </div>

              {course.quizzes.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-slate-900">Course quizzes</h4>
                  <ul className="mt-3 space-y-3">
                    {course.quizzes.map((quiz) => (
                      <li key={quiz.id} className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-700">{quiz.title}</p>
                        {quiz.description && <p className="text-xs text-slate-500">{quiz.description}</p>}
                        <p className="text-xs text-slate-500">{quiz.questions.length} questions</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-500">
              Select a lesson to begin.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CourseDetailPage;
