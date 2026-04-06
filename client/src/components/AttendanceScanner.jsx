import { useEffect, useRef, useState } from "react";
import api from "../api";
import { extractDescriptor, loadFaceModels } from "../utils/face";

const AttendanceScanner = ({ defaultRegisterNumber = "" }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [registerNumber, setRegisterNumber] = useState(defaultRegisterNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ label: "", type: "" });
  const [identifiedStudent, setIdentifiedStudent] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    startCamera().catch((error) => {
      setStatus({ label: error.message || "Camera not available", type: "error" });
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const verifyAndMark = async () => {
    setIsLoading(true);
    setIdentifiedStudent(null);
    setStatus({ label: "Scanning face...", type: "info" });

    try {
      const register = registerNumber.trim();
      const liveDescriptor = await extractDescriptor(videoRef.current);

      // Direct face mode requires a detectable face.
      if (!register && !liveDescriptor) {
        setStatus({ label: "No face detected. Keep face centered and retry.", type: "error" });
        return;
      }

      // Direct face mode: register number is optional.
      if (!register) {
        const directResult = await api.post("/face-identify", { liveDescriptor });
        const student = directResult.data?.student || null;

        setIdentifiedStudent(student);
        if (student?.registerNumber) setRegisterNumber(student.registerNumber);

        setStatus({
          label: student
            ? `${directResult.data.status} - ${student.name} (${student.registerNumber})`
            : directResult.data.status || "Verified",
          type: "success"
        });
        return;
      }

      setStatus({ label: "Verifying register number...", type: "info" });
      const verifyResult = await api.post("/verify-student", { registerNumber: register });
      const verifiedStudent = verifyResult.data?.student || null;

      if (verifiedStudent) {
        setIdentifiedStudent(verifiedStudent);
      }

      // Register fallback/manual mode: allow marking even when face is not detected.
      if (!liveDescriptor) {
        setStatus({ label: "No face detected. Marking attendance using register number...", type: "info" });
        const manualResult = await api.post("/mark-attendance", {
          registerNumber: register
        });

        setStatus({
          label: manualResult.data?.status === "Verified"
            ? "Attendance marked using register number fallback"
            : manualResult.data?.status || "Verified",
          type: "success"
        });
        return;
      }

      setStatus({ label: "Matching face with register number...", type: "info" });
      const faceResult = await api.post("/face-verify", {
        registerNumber: register,
        liveDescriptor
      });

      if (!faceResult.data.matched) {
        setStatus({ label: "Face verification failed", type: "error" });
        return;
      }

      const markResult = await api.post("/mark-attendance", {
        registerNumber: register,
        liveDescriptor
      });

      setStatus({ label: markResult.data.status || "Verified", type: "success" });
    } catch (error) {
      const payload = error.response?.data || {};

      if (payload.student) {
        setIdentifiedStudent(payload.student);
        if (payload.student.registerNumber) setRegisterNumber(payload.student.registerNumber);
      }

      if (payload.requireRegisterNumber) {
        setStatus({ label: payload.message || "Face not matched. Enter register number.", type: "info" });
      } else if (payload.status === "Already Marked") {
        setStatus({ label: payload.message || payload.status, type: "info" });
      } else {
        const label = payload.status || payload.message || "Verification failed";
        setStatus({ label, type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const statusClass =
    status.type === "success"
      ? "bg-brand-100 text-brand-900"
      : status.type === "error"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="surface fade-rise">
        <h2 className="section-title">Smart Verification</h2>
        <p className="mt-2 text-sm text-slate-500">
          Leave register number blank for direct face scan. If face does not match or is not detected, enter register number to mark manually.
        </p>

        <label className="mt-5 block text-sm font-bold text-slate-700">Register Number (Optional)</label>
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            value={registerNumber}
            onChange={(e) => setRegisterNumber(e.target.value)}
            placeholder="Leave empty for direct face scan"
          />
          <button
            type="button"
            className="btn-muted shrink-0"
            onClick={() => {
              setRegisterNumber("");
              setIdentifiedStudent(null);
            }}
          >
            Clear
          </button>
        </div>

        <button disabled={isLoading} onClick={verifyAndMark} className="btn-primary mt-4 w-full py-3 text-base">
          {isLoading ? "Processing..." : registerNumber.trim() ? "Verify & Mark (Hybrid)" : "Scan Face & Mark"}
        </button>

        {identifiedStudent && (
          <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Matched student: {identifiedStudent.name} ({identifiedStudent.registerNumber})
          </p>
        )}

        {status.label && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${statusClass}`}>{status.label}</p>}
      </div>

      <div className="surface fade-rise">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Live Camera</h3>
          <span className="status-pill bg-slate-100 text-slate-600">Face Scan</span>
        </div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-900 object-cover lg:h-[21rem]"
        />
      </div>
    </section>
  );
};

export default AttendanceScanner;
