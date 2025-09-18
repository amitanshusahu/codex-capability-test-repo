import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios/axios";
import { API_ROUTES } from "../lib/api";
import type { ApiResponse, Module, Quiz } from "../types/api";
import { useAuth } from "../hooks/useAuth";

interface CourseSummary {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  quizzes: Quiz[];
}

interface SubscriptionWithCourse {
  id: string;
  course: CourseSummary;
}

const fetchSubscriptions = async () => {
  const response = await api.get<ApiResponse<{ subscriptions: SubscriptionWithCourse[] }>>(API_ROUTES.COURSES.SUBSCRIPTIONS);
  return response.data.data.subscriptions;
};

const MyLearningPage = () => {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["courses", "subscriptions"],
    queryFn: fetchSubscriptions,
    enabled: user?.role === "STUDENT",
  });

  if (user?.role !== "STUDENT") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Only students can subscribe to courses.
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading your enrolled courses...</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">My learning path</h2>
        <p className="text-sm text-slate-500">Continue where you left off or review completed lessons.</p>
      </div>
      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          You are not enrolled in any course yet. Browse the catalog to start learning.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {subscriptions.map((subscription) => (
            <article key={subscription.id} className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">{subscription.course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3">{subscription.course.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{subscription.course.modules.length} modules</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{subscription.course.quizzes.length} quizzes</span>
                </div>
              </div>
              <div className="mt-4">
                <Link to={`/courses/${subscription.course.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Resume course
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyLearningPage;
