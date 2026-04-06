import AttendanceScanner from "../components/AttendanceScanner";
import { useAuth } from "../context/AuthContext";

const AttendancePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <section className="surface fade-rise">
        <p className="soft-label">Attendance Station</p>
        <h1 className="section-title mt-2">Attendance Verification</h1>
        <p className="mt-3 text-slate-600">
          Direct face scan is enabled. If face is not recognized, use register number fallback for hybrid verification.
        </p>
        {!user && (
          <p className="mt-4 rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800">
            Quick mode is active: students can mark attendance without login.
          </p>
        )}
      </section>

      <AttendanceScanner defaultRegisterNumber={user?.role === "student" ? user.registerNumber || "" : ""} />
    </div>
  );
};

export default AttendancePage;
