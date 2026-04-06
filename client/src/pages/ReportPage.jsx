import { useEffect, useState } from "react";
import api from "../api";

const ReportPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const query = new URLSearchParams();
      if (from) query.append("from", from);
      if (to) query.append("to", to);

      const { data } = await api.get(`/attendance/report?${query.toString()}`);
      setRecords(data.records || []);
      setSummary(data.summary || null);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load report");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const download = async (format) => {
    const query = new URLSearchParams();
    if (from) query.append("from", from);
    if (to) query.append("to", to);
    query.append("format", format);

    const response = await api.get(`/attendance/report?${query.toString()}`, {
      responseType: "blob"
    });

    const blob = new Blob([response.data]);
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = format === "csv" ? "attendance-report.csv" : "attendance-report.pdf";
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-5">
      <section className="surface fade-rise">
        <p className="soft-label">Faculty Tools</p>
        <h1 className="section-title mt-2">Attendance Reports</h1>
        <p className="mt-2 text-slate-600">Filter by date range and export as CSV or PDF.</p>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="btn-primary" onClick={loadData}>
            Apply Filters
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-muted" onClick={() => download("csv")}>
              Export CSV
            </button>
            <button className="btn-muted" onClick={() => download("pdf")}>
              Export PDF
            </button>
          </div>
        </div>

        {summary && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="kpi-card">
              <p className="soft-label">Total Records</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.total}</p>
            </div>
            <div className="kpi-card">
              <p className="soft-label">Present</p>
              <p className="mt-2 text-2xl font-extrabold text-brand-700">{summary.presentCount}</p>
            </div>
            <div className="kpi-card">
              <p className="soft-label">Absent</p>
              <p className="mt-2 text-2xl font-extrabold text-red-600">{summary.absentCount}</p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </section>

      <section className="surface fade-rise overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Register Number</th>
                <th>Date</th>
                <th>Status</th>
                <th>Face Verified</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{record.registerNumber}</td>
                  <td>{new Date(record.date).toISOString().slice(0, 10)}</td>
                  <td>
                    <span className={`status-pill ${record.status === "Present" ? "bg-brand-100 text-brand-900" : "bg-red-100 text-red-700"}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.faceVerified ? "Yes" : "No"}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td className="text-slate-500" colSpan={4}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReportPage;
