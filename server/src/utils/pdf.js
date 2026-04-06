import PDFDocument from "pdfkit";

export const streamAttendancePdf = (res, attendance) => {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.pdf");

  doc.pipe(res);
  doc.fontSize(18).text("Attendance Report", { underline: true });
  doc.moveDown();

  attendance.forEach((item, index) => {
    doc
      .fontSize(11)
      .text(
        `${index + 1}. Register: ${item.registerNumber} | Date: ${new Date(item.date)
          .toISOString()
          .slice(0, 10)} | Status: ${item.status} | Face Verified: ${item.faceVerified ? "Yes" : "No"}`
      );
  });

  doc.end();
};
