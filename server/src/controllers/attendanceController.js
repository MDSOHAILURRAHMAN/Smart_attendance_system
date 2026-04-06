import { Attendance } from "../models/Attendance.js";
import { User } from "../models/User.js";
import { toAttendanceCsv } from "../utils/csv.js";
import { streamAttendancePdf } from "../utils/pdf.js";

const FACE_MATCH_THRESHOLD = 0.55;

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeRegisterNumber = (value = "") => String(value).trim().toLowerCase();

const isSameRegisterNumber = (a, b) => normalizeRegisterNumber(a) === normalizeRegisterNumber(b);

const findStudentByRegisterNumber = async (registerNumber, select = null) => {
  const normalized = String(registerNumber || "").trim();
  if (!normalized) return null;

  const exactMatchRegex = new RegExp(`^${escapeRegExp(normalized)}$`, "i");
  let query = User.findOne({ role: "student", registerNumber: exactMatchRegex });

  if (select) {
    query = query.select(select);
  }

  return query.exec();
};

const parseDescriptor = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value.map(Number);

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number) : null;
  } catch (_error) {
    return null;
  }
};

const euclideanDistance = (a, b) => {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
};

const verifyFaceMatch = (storedFaceData, liveDescriptor, threshold = FACE_MATCH_THRESHOLD) => {
  const stored = parseDescriptor(storedFaceData);
  const live = parseDescriptor(liveDescriptor);

  if (!stored || !live) {
    return { matched: false, distance: null };
  }

  const distance = euclideanDistance(stored, live);
  return { matched: distance <= threshold, distance };
};

const getTodayUTC = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const emitAttendance = (req, attendance) => {
  const io = req.app.get("io");
  io.emit("attendance-marked", {
    registerNumber: attendance.registerNumber,
    status: attendance.status,
    faceVerified: attendance.faceVerified,
    timestamp: attendance.createdAt
  });
};

const markPresentForStudent = async (req, student, options = {}) => {
  const { faceVerified = true } = options;
  const today = getTodayUTC();
  const exists = await Attendance.findOne({ registerNumber: student.registerNumber, date: today });

  if (exists) {
    return { alreadyMarked: true, attendance: exists };
  }

  const attendance = await Attendance.create({
    registerNumber: student.registerNumber,
    date: today,
    status: "Present",
    faceVerified
  });

  emitAttendance(req, attendance);

  return { alreadyMarked: false, attendance };
};

const findBestStudentFromFace = async (liveDescriptor) => {
  const live = parseDescriptor(liveDescriptor);
  if (!live) {
    return { matched: false, reason: "Invalid face descriptor" };
  }

  const students = await User.find({ role: "student", faceData: { $exists: true, $ne: "" } }).select(
    "name registerNumber faceData"
  );

  if (students.length === 0) {
    return { matched: false, reason: "No enrolled student face data found" };
  }

  let bestStudent = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const student of students) {
    const stored = parseDescriptor(student.faceData);
    if (!stored) continue;

    const distance = euclideanDistance(stored, live);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestStudent = student;
    }
  }

  if (!bestStudent || bestDistance > FACE_MATCH_THRESHOLD) {
    return { matched: false, reason: "Face not recognized", distance: bestDistance };
  }

  return {
    matched: true,
    student: bestStudent,
    distance: bestDistance,
    threshold: FACE_MATCH_THRESHOLD
  };
};

export const verifyStudent = async (req, res) => {
  try {
    const { registerNumber } = req.body;

    if (!registerNumber) {
      return res.status(400).json({ message: "registerNumber is required" });
    }

    const student = await findStudentByRegisterNumber(registerNumber, "name registerNumber role faceData");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      verified: true,
      student: {
        name: student.name,
        registerNumber: student.registerNumber,
        role: student.role,
        hasFaceData: Boolean(student.faceData)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Verification failed" });
  }
};

export const faceVerify = async (req, res) => {
  try {
    const { registerNumber, liveDescriptor } = req.body;

    if (!registerNumber || !liveDescriptor) {
      return res.status(400).json({ message: "registerNumber and liveDescriptor are required" });
    }

    const student = await findStudentByRegisterNumber(registerNumber);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { matched, distance } = verifyFaceMatch(student.faceData, liveDescriptor);

    return res.json({
      matched,
      distance,
      threshold: FACE_MATCH_THRESHOLD,
      message: matched ? "Face verified" : "Face verification failed"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Face verification failed" });
  }
};

export const faceIdentifyAndMark = async (req, res) => {
  try {
    const { liveDescriptor } = req.body;

    if (!liveDescriptor) {
      return res.status(400).json({ message: "liveDescriptor is required" });
    }

    const result = await findBestStudentFromFace(liveDescriptor);
    if (!result.matched) {
      return res.status(404).json({
        matched: false,
        requireRegisterNumber: true,
        message: "Face not matched. Please enter register number as fallback."
      });
    }

    const { student } = result;
    const markResult = await markPresentForStudent(req, student, { faceVerified: true });

    if (markResult.alreadyMarked) {
      return res.status(409).json({
        status: "Already Marked",
        mode: "face-only",
        student: {
          name: student.name,
          registerNumber: student.registerNumber
        },
        message: "Attendance already marked for today"
      });
    }

    return res.status(201).json({
      status: "Verified",
      mode: "face-only",
      student: {
        name: student.name,
        registerNumber: student.registerNumber
      },
      distance: result.distance,
      attendance: markResult.attendance
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Face identification failed" });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { registerNumber, liveDescriptor } = req.body;

    if (!registerNumber) {
      return res.status(400).json({ message: "registerNumber is required" });
    }

    if (req.user?.role === "student" && !isSameRegisterNumber(req.user.registerNumber, registerNumber)) {
      return res.status(403).json({ message: "Students can only mark their own attendance" });
    }

    const student = await findStudentByRegisterNumber(registerNumber);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let faceVerified = false;
    if (liveDescriptor) {
      const faceResult = verifyFaceMatch(student.faceData, liveDescriptor);
      if (!faceResult.matched) {
        return res.status(401).json({
          status: "Failed",
          faceVerified: false,
          distance: faceResult.distance,
          message: "Face and register number mismatch"
        });
      }

      faceVerified = true;
    }

    const markResult = await markPresentForStudent(req, student, { faceVerified });

    if (markResult.alreadyMarked) {
      return res.status(409).json({
        status: "Already Marked",
        message: "Attendance already marked for today"
      });
    }

    return res.status(201).json({
      status: "Verified",
      mode: faceVerified ? "hybrid" : "manual-register",
      attendance: markResult.attendance
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to mark attendance" });
  }
};

export const attendanceReport = async (req, res) => {
  try {
    const { from, to, format } = req.query;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    toDate.setUTCHours(23, 59, 59, 999);

    const data = await Attendance.find({
      date: {
        $gte: fromDate,
        $lte: toDate
      }
    }).sort({ date: -1, registerNumber: 1 });

    if (format === "csv") {
      const csv = toAttendanceCsv(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=attendance-report.csv");
      return res.status(200).send(csv);
    }

    if (format === "pdf") {
      streamAttendancePdf(res, data);
      return;
    }

    const presentCount = data.filter((record) => record.status === "Present").length;
    const absentCount = data.filter((record) => record.status === "Absent").length;

    return res.json({
      summary: {
        total: data.length,
        presentCount,
        absentCount
      },
      records: data
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch report" });
  }
};

export const myAttendance = async (req, res) => {
  try {
    const registerNumber = req.user.registerNumber;

    if (!registerNumber) {
      return res.status(400).json({ message: "Student register number not found" });
    }

    const records = await Attendance.find({ registerNumber }).sort({ date: -1 }).limit(60);
    const presentCount = records.filter((record) => record.status === "Present").length;
    const absentCount = records.filter((record) => record.status === "Absent").length;

    return res.json({
      student: {
        name: req.user.name,
        registerNumber: req.user.registerNumber
      },
      summary: {
        total: records.length,
        presentCount,
        absentCount
      },
      records
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch student attendance" });
  }
};

export const listStudents = async (_req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email registerNumber createdAt")
      .sort({ registerNumber: 1 });

    const registerNumbers = students.map((student) => student.registerNumber).filter(Boolean);
    const attendance = await Attendance.find({
      registerNumber: { $in: registerNumbers }
    }).sort({ date: -1 });

    const summaryMap = new Map();
    attendance.forEach((record) => {
      if (!summaryMap.has(record.registerNumber)) {
        summaryMap.set(record.registerNumber, {
          total: 0,
          present: 0,
          absent: 0,
          lastMarkedAt: record.createdAt
        });
      }

      const summary = summaryMap.get(record.registerNumber);
      summary.total += 1;
      if (record.status === "Present") summary.present += 1;
      if (record.status === "Absent") summary.absent += 1;
    });

    const data = students.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      registerNumber: student.registerNumber,
      joinedAt: student.createdAt,
      attendance: summaryMap.get(student.registerNumber) || {
        total: 0,
        present: 0,
        absent: 0,
        lastMarkedAt: null
      }
    }));

    return res.json({ total: data.length, students: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch students" });
  }
};
