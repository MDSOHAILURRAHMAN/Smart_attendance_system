import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-bold transition ${
    isActive
      ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-soft"
      : "text-slate-600 hover:bg-white hover:text-slate-900"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to={user ? "/dashboard" : "/"} className="group inline-flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft transition group-hover:animate-floaty" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">Smart Attendance</span>
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/attendance" className={navClass}>
              Attendance
            </NavLink>
            {(user.role === "admin" || user.role === "teacher") && (
              <NavLink to="/reports" className={navClass}>
                Reports
              </NavLink>
            )}
            <button onClick={handleLogout} className="btn-muted ml-1">
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navClass}>
              Login
            </NavLink>
            <NavLink to="/attendance" className={navClass}>
              Quick Attendance
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
