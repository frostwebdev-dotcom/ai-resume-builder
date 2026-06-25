import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { describe, expect, it } from "vitest";

import { writeBulletItem, writeTitleRow } from "./pdf-text-layout";

function createPdf(): InstanceType<typeof PDFDocument> {
  return new PDFDocument({ size: "A4", margin: 0 });
}

describe("pdf-text-layout", () => {
  it("advances Y past a wrapped title row with a right-aligned date", () => {
    const pdf = createPdf();
    const startY = 100;
    const width = 400;
    const longTitle =
      "BASc, Computer Engineering, Software systems — University of Waterloo";
    const dateText = "2012 – 2016";

    const nextY = writeTitleRow(pdf, {
      x: 50,
      width,
      startY,
      title: longTitle,
      titleFont: "Helvetica-Bold",
      titleSize: 11,
      titleColor: "#000000",
      dateText,
      dateWidth: 140,
      dateFont: "Helvetica",
      dateSize: 9,
      dateColor: "#555555",
    });

    expect(nextY).toBeGreaterThan(startY + 11 + 2);
  });

  it("advances Y for multi-line bullet text", () => {
    const pdf = createPdf();
    const startY = 200;
    const width = 400;
    const bullet =
      "Led a cross-functional product initiative with measurable usability outcomes across web and mobile.";

    const nextY = writeBulletItem(pdf, {
      x: 50,
      width,
      startY,
      text: bullet,
      fonts: { regular: "Helvetica", bold: "Helvetica-Bold" },
      bodySize: 10,
      bulletIndent: 14,
      accent: "#2563eb",
      bodyColor: "#1a1a1a",
      bodyAlign: "left",
      bodyLineGap: 2,
    });

    expect(nextY).toBeGreaterThan(startY + 10);
  });

  it("keeps experience block below a wrapped education row", () => {
    const pdf = createPdf();
    const x = 50;
    const width = 400;
    let y = 80;

    y = writeTitleRow(pdf, {
      x,
      width,
      startY: y,
      title: "BASc, Computer Engineering, Software systems — University of Waterloo",
      titleFont: "Helvetica-Bold",
      titleSize: 11,
      titleColor: "#000000",
      dateText: "2012 – 2016",
      dateWidth: 140,
      dateFont: "Helvetica",
      dateSize: 9,
      dateColor: "#555555",
      gapAfter: 6,
    });

    const experienceStartY = y + 24;
    y = writeTitleRow(pdf, {
      x,
      width,
      startY: experienceStartY,
      title: "Senior software engineer — Northline Systems",
      titleFont: "Helvetica-Bold",
      titleSize: 11,
      titleColor: "#000000",
      dateText: "Jan 2021 – Present",
      dateWidth: 150,
      dateFont: "Helvetica",
      dateSize: 9,
      dateColor: "#555555",
    });

    expect(y).toBeGreaterThan(experienceStartY + 11);
  });
});
