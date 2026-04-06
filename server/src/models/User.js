import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    registerNumber: { type: String, trim: true, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
      default: "student"
    },
    faceData: { type: String, default: "" }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
