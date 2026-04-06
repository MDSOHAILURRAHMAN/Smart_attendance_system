import { stringify } from "csv-stringify/sync";

export const toAttendanceCsv = (attendance) => {
  const rows = attendance.map((item) => ({
    registerNumber: item.registerNumber,
    date: new Date(item.date).toISOString().slice(0, 10),
    status: item.status,
    faceVerified: item.faceVerified ? "Yes" : "No"
  }));

  return stringify(rows, {
    header: true,
    columns: ["registerNumber", "date", "status", "faceVerified"]
  });
};
