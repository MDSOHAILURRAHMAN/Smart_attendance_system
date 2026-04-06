import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { extractDescriptor, loadFaceModels } from "../utils/face";

const initialState = {
  name: "",
  email: "",
  password: "",
  role: "student",
  registerNumber: ""
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [navigate, user]);

  const needsFaceCapture = useMemo(() => isSignup && form.role === "student", [form.role, isSignup]);

  useEffect(() => {
    const start = async () => {
      if (!needsFaceCapture) return;

      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    start().catch((e) => setError(e.message || "Unable to open camera"));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null;
    };
  }, [needsFaceCapture]);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const captureFace = async () => {
    const descriptor = await extractDescriptor(videoRef.current);
    if (!descriptor) {
      setError("Face not detected. Keep face centered and try again.");
      return;
    }

    setFaceDescriptor(descriptor);
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        await register({
          ...form,
          faceData: form.role === "student" && faceDescriptor ? JSON.stringify(faceDescriptor) : ""
        });
      } else {
        await login({ email: form.email, password: form.password });
      }

      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
      <section className="grid w-full gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="surface-strong fade-rise">
          <p className="soft-label text-brand-100">Hybrid identity layer</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight lg:text-5xl">Smart attendance, built for classrooms</h1>
          <p className="mt-4 max-w-xl text-brand-100">
            Combine register number verification with facial matching for faster, more reliable attendance.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-50">Verification Mode</p>
              <p className="mt-2 text-lg font-bold">Register + Face</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-50">Daily Policy</p>
              <p className="mt-2 text-lg font-bold">One mark per day</p>
            </div>
          </div>

          <Link to="/attendance" className="btn-ghost mt-7 w-full sm:w-auto">
            Open Quick Attendance
          </Link>
        </div>

        <div className="surface fade-rise">
          <div className="mb-5 flex rounded-2xl bg-slate-100 p-1.5">
            <button
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
                !isSignup ? "bg-white text-slate-900 shadow-soft" : "text-slate-500"
              }`}
              onClick={() => setIsSignup(false)}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
                isSignup ? "bg-white text-slate-900 shadow-soft" : "text-slate-500"
              }`}
              onClick={() => setIsSignup(true)}
            >
              Signup
            </button>
          </div>

          <h2 className="section-title text-2xl">{isSignup ? "Create account" : "Welcome back"}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup ? "Register once. Students can mark attendance later without login." : "Sign in to access dashboard and reports."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {isSignup && (
              <input className="input" name="name" placeholder="Full Name" value={form.name} onChange={onChange} required />
            )}

            <input className="input" name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} required />
            <input
              className="input"
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
            />

            {isSignup && (
              <>
                <select className="input" name="role" value={form.role} onChange={onChange}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>

                {form.role === "student" && (
                  <input
                    className="input"
                    name="registerNumber"
                    placeholder="Register Number"
                    value={form.registerNumber}
                    onChange={onChange}
                    required
                  />
                )}
              </>
            )}

            {needsFaceCapture && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-sm font-bold text-slate-700">Capture face template</p>
                <video ref={videoRef} autoPlay muted playsInline className="mt-2 h-44 w-full rounded-xl bg-slate-900 object-cover" />
                <button type="button" onClick={captureFace} className="btn-muted mt-3 w-full">
                  {faceDescriptor ? "Face captured successfully" : "Capture Face"}
                </button>
              </div>
            )}

            {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

            <button disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
