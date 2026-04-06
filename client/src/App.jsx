import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AttendancePage from "./pages/AttendancePage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";

const AppLayout = ({ children }) => (
  <div className="app-shell">
    <div className="app-glow" />
    <Navbar />
    <main className="relative mx-auto max-w-6xl px-4 py-6">{children}</main>
  </div>
);

function App() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user && !["/", "/attendance"].includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <AppLayout>
            <AttendancePage />
          </AppLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "teacher"]}>
            <AppLayout>
              <ReportPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

export default App;
