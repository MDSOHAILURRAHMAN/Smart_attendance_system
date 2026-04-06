import express from "express";
import {
  attendanceReport,
  listStudents,
  markAttendance,
  myAttendance
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/roles.js";

const router = express.Router();

// Public marking enabled for hybrid scan kiosk flow.
router.post("/mark-attendance", markAttendance);

router.get("/attendance/report", protect, authorize("admin", "teacher"), attendanceReport);
router.get("/attendance/my", protect, authorize("student"), myAttendance);
router.get("/students", protect, authorize("admin", "teacher"), listStudents);

export default router;
