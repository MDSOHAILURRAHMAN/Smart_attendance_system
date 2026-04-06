import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    registerNumber: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present"
    },
    faceVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

attendanceSchema.index({ registerNumber: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
