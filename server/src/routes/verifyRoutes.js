import express from "express";
import { faceIdentifyAndMark, faceVerify, verifyStudent } from "../controllers/attendanceController.js";

const router = express.Router();

// Public access so students can mark attendance without login.
router.post("/verify-student", verifyStudent);
router.post("/face-verify", faceVerify);
router.post("/face-identify", faceIdentifyAndMark);

export default router;
