import { NavLink, Outlet } from "react-router-dom";
import { useAuth, useLogout } from "../../hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-100"
  }`;

const AppLayout = () => {
  const { user, isLoading } = useAuth();
  const logout = useLogout();

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">You need to sign in to access the platform.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold text-indigo-700">CourseSphere</h1>
            <nav className="flex items-center gap-2">
              <NavLink to="/" className={navLinkClass} end>
                Browse Courses
              </NavLink>
              {user.role === "STUDENT" && (
                <NavLink to="/my-learning" className={navLinkClass}>
                  My Learning
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-indigo-200 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
