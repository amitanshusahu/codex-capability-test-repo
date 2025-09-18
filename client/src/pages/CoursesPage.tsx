import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios/axios";
import { API_ROUTES } from "../lib/api";
import type { ApiResponse, Course } from "../types/api";
import { useAuth } from "../hooks/useAuth";

const fetchCourses = async () => {
  const response = await api.get<ApiResponse<{ courses: Course[] }>>(API_ROUTES.COURSES.ROOT);
  return response.data.data.courses;
};

const CoursesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creationError, setCreationError] = useState<string | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await api.post<ApiResponse<unknown>>(API_ROUTES.COURSES.SUBSCRIBE(courseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      level?: string;
      price?: number;
      thumbnailUrl?: string;
      tags: string[];
    }) => {
      const response = await api.post<ApiResponse<{ course: Course }>>(API_ROUTES.COURSES.ROOT, payload);
      return response.data.data.course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setCreationError(null);
    },
    onError: (error) => {
      console.error(error);
      setCreationError("Failed to create course. Please verify the details and try again.");
    }
  });

  const handleCreateCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.role !== "ADMIN") return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const level = String(formData.get("level") ?? "").trim() || undefined;
    const priceValue = String(formData.get("price") ?? "").trim();
    const price = priceValue ? Number(priceValue) : undefined;
    const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim() || undefined;
    const tagsValue = String(formData.get("tags") ?? "").trim();
    const tags = tagsValue ? tagsValue.split(",").map((tag) => tag.trim()).filter(Boolean) : [];

    createCourseMutation.mutate({ title, description, level, price, thumbnailUrl, tags });
    event.currentTarget.reset();
  };

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) => a.title.localeCompare(b.title)),
    [courses]
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Available courses</h2>
          <p className="text-sm text-slate-500">Browse the latest modules curated by our instructors.</p>
        </div>
        {user?.role === "ADMIN" && (
          <span className="rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">
            Admin mode
          </span>
        )}
      </div>

      {user?.role === "ADMIN" && (
        <section className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Create a new course</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add a new program with modules, lessons, and resources.
          </p>
          {creationError && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{creationError}</p>}
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreateCourse}>
            <div className="space-y-1 md:col-span-1">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Fullstack React Bootcamp"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label htmlFor="level" className="block text-sm font-medium text-slate-700">
                Level
              </label>
              <input
                id="level"
                name="level"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Beginner / Advanced"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Share what students will learn in this course."
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                Price (optional)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="199.99"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-slate-700">
                Thumbnail URL (optional)
              </label>
              <input
                id="thumbnailUrl"
                name="thumbnailUrl"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                name="tags"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="react,typescript,frontend"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createCourseMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {createCourseMutation.isPending ? "Creating course..." : "Create course"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <p className="text-slate-500">Loading courses...</p>
        ) : sortedCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No courses available yet. {user?.role === "ADMIN" ? "Use the form above to create the first one." : "Check back soon."}
          </div>
        ) : (
          sortedCourses.map((course) => {
            const isSubscribed = course.subscriptions.some((sub) => sub.studentId === user?.id);
            return (
              <article key={course.id} className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3">{course.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {course.level && <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">{course.level}</span>}
                    <span className="rounded-full bg-slate-100 px-2 py-1">{course.modules.length} modules</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{course.quizzes.length} quizzes</span>
                  </div>
                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View details
                  </Link>
                  {user?.role === "STUDENT" && (
                    <button
                      type="button"
                      disabled={subscribeMutation.isPending || isSubscribed}
                      onClick={() => subscribeMutation.mutate(course.id)}
                      className="rounded-md border border-indigo-200 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-indigo-300"
                    >
                      {isSubscribed ? "Enrolled" : subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default CoursesPage;
