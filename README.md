# Smart Attendance System (Full-Stack)

Hybrid attendance mechanism using **Register Number + Face Recognition**.

## Tech Stack
- Frontend: React.js + Vite + Tailwind CSS
- Backend: Node.js + Express.js + Socket.io
- Database: MongoDB Atlas + Mongoose
- Auth: JWT + Role-based access (Admin/Teacher/Student)
- Face Recognition: face-api.js (frontend descriptor + backend match)

## Access Rules
- Attendance marking is available publicly at `/attendance` (no login required for daily mark).
- Login/signup is required for account onboarding and dashboards.
- Faculty (`admin`/`teacher`) can view all student details and full reports.
- Students can only view their own attendance (`/api/attendance/my`).

## Folder Structure
```text
smart_attendance_system/
  client/
    public/
      models/                  # face-api model files
    src/
      components/
        AttendanceScanner.jsx
        Navbar.jsx
        ProtectedRoute.jsx
      context/
        AuthContext.jsx
      pages/
        AuthPage.jsx
        DashboardPage.jsx
        AttendancePage.jsx
        ReportPage.jsx
      utils/
        face.js
      api.js
      App.jsx
      main.jsx
      index.css
    .env.example
    package.json
    tailwind.config.js
    postcss.config.js
    vite.config.js
  server/
    src/
      config/db.js
      models/User.js
      models/Attendance.js
      middleware/auth.js
      middleware/roles.js
      controllers/authController.js
      controllers/attendanceController.js
      routes/authRoutes.js
      routes/verifyRoutes.js
      routes/attendanceRoutes.js
      utils/csv.js
      utils/pdf.js
      index.js
    .env.example
    package.json
```

## Backend API Endpoints
### Public
- `POST /api/verify-student`
- `POST /api/face-verify`
- `POST /api/face-identify`
- `POST /api/mark-attendance`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Faculty (`admin`/`teacher`)
- `GET /api/students`
- `GET /api/attendance/report?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/attendance/report?format=csv`
- `GET /api/attendance/report?format=pdf`

### Student
- `GET /api/attendance/my`

## Mongoose Schemas
### User
```js
{
  name: String,
  email: String,
  password: String,
  registerNumber: String,
  role: "admin" | "teacher" | "student",
  faceData: String
}
```

### Attendance
```js
{
  registerNumber: String,
  date: Date,
  status: "Present" | "Absent",
  faceVerified: Boolean
}
```

## Setup
### Backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Face-API Model Files
Place these in `client/public/models`:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`
