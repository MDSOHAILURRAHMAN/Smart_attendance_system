import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [totalPresent, setTotalPresent] = useState(0);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [myRecords, setMyRecords] = useState([]);

  const dateRange = useMemo(() => {
    const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    return from.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (user.role !== "admin" && user.role !== "teacher") return;

    const loadFacultyData = async () => {
      const [{ data: reportData }, { data: studentsData }] = await Promise.all([
        api.get(`/attendance/report?from=${dateRange}`),
        api.get("/students")
      ]);

      const grouped = reportData.records.reduce((acc, item) => {
        const key = new Date(item.date).toISOString().slice(0, 10);
        acc[key] = (acc[key] || 0) + (item.status === "Present" ? 1 : 0);
        return acc;
      }, {});

      const points = Object.entries(grouped).map(([date, present]) => ({ date, present }));
      setChartData(points);
      setTotalPresent(reportData.summary.presentCount || 0);
      setStudents(studentsData.students || []);
    };

    loadFacultyData().catch(() => undefined);
  }, [dateRange, user.role]);

  useEffect(() => {
    if (user.role !== "student") return;

    const loadStudentData = async () => {
      const { data } = await api.get("/attendance/my");
      setMyRecords(data.records || []);
      setTotalPresent(data.summary?.presentCount || 0);
    };

    loadStudentData().catch(() => undefined);
  }, [user.role]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
    socket.on("attendance-marked", (payload) => {
      setEvents((prev) => [payload, ...prev].slice(0, 8));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <section className="surface fade-rise flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="soft-label">{user.role} panel</p>
          <h1 className="section-title mt-2 text-3xl">Welcome, {user.name}</h1>
          <p className="mt-3 text-slate-600">
            {user.role === "student"
              ? "Track your own attendance history and mark attendance quickly."
              : "Monitor all students and attendance activity in real time."}
          </p>
        </div>
        <Link to="/attendance" className="btn-primary">
          Open Attendance Page
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="kpi-card fade-rise">
          <p className="soft-label">Role</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 capitalize">{user.role}</p>
        </article>
        <article className="kpi-card fade-rise">
          <p className="soft-label">Register Number</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{user.registerNumber || "N/A"}</p>
        </article>
        <article className="kpi-card fade-rise">
          <p className="soft-label">Present Count</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalPresent}</p>
        </article>
      </section>

      {(user.role === "admin" || user.role === "teacher") && (
        <>
          <section className="surface fade-rise">
            <h2 className="section-title text-xl">Attendance Trend</h2>
            <div className="mt-4 h-72 rounded-2xl border border-slate-100 bg-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stroke="#047857" fillOpacity={1} fill="url(#colorPresent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="surface fade-rise overflow-x-auto">
            <h2 className="section-title text-xl">All Students</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Register</th>
                    <th>Present</th>
                    <th>Total</th>
                    <th>Last Marked</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.registerNumber}</td>
                      <td>{student.attendance.present}</td>
                      <td>{student.attendance.total}</td>
                      <td>{student.attendance.lastMarkedAt ? new Date(student.attendance.lastMarkedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td className="text-slate-500" colSpan={6}>
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {user.role === "student" && (
        <section className="surface fade-rise overflow-x-auto">
          <h2 className="section-title text-xl">My Attendance</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Face Verified</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toISOString().slice(0, 10)}</td>
                    <td>{record.status}</td>
                    <td>{record.faceVerified ? "Yes" : "No"}</td>
                  </tr>
                ))}
                {myRecords.length === 0 && (
                  <tr>
                    <td className="text-slate-500" colSpan={3}>
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="surface fade-rise">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title text-xl">Live Attendance Feed</h2>
          <span className="status-pill bg-accent-100 text-amber-700">Real-time</span>
        </div>
        <div className="space-y-2">
          {events.length === 0 && <p className="text-slate-500">No live updates yet.</p>}
          {events.map((event, index) => (
            <div key={`${event.registerNumber}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <span className="font-bold text-slate-900">{event.registerNumber}</span>
              <span className="text-slate-600"> marked {event.status} at {new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
