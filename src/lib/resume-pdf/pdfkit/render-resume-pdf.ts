import PDFDocument from "pdfkit";

import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getPdfLayout, type PdfLayout } from "@/lib/resume-pdf/pdfkit/layouts";

function contentWidth(doc: InstanceType<typeof PDFDocument>, layout: PdfLayout): number {
  return doc.page.width - layout.pageMargin * 2;
}

function pageBottom(doc: InstanceType<typeof PDFDocument>, layout: PdfLayout): number {
  return doc.page.height - layout.pageMargin;
}

function ensureSpace(
  doc: InstanceType<typeof PDFDocument>,
  layout: PdfLayout,
  minHeight: number,
): void {
  if (doc.y + minHeight > pageBottom(doc, layout)) {
    doc.addPage();
    doc.y = layout.pageMargin;
  }
}

function writeSectionTitle(
  doc: InstanceType<typeof PDFDocument>,
  layout: PdfLayout,
  title: string,
): void {
  ensureSpace(doc, layout, 24);
  doc
    .font("Helvetica-Bold")
    .fontSize(layout.sectionTitleSize)
    .fillColor("#333333")
    .text(title.toUpperCase(), layout.pageMargin, doc.y, {
      width: contentWidth(doc, layout),
    });
  doc.moveDown(0.3);
  doc
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .moveTo(layout.pageMargin, doc.y)
    .lineTo(doc.page.width - layout.pageMargin, doc.y)
    .stroke();
  doc.moveDown(0.6);
  doc.fillColor("#000000");
}

function writeParagraph(
  doc: InstanceType<typeof PDFDocument>,
  layout: PdfLayout,
  text: string,
): void {
  if (!text.trim()) return;
  ensureSpace(doc, layout, 40);
  doc.font("Helvetica").fontSize(layout.bodySize).fillColor("#1a1a1a");
  doc.text(text, layout.pageMargin, doc.y, {
    width: contentWidth(doc, layout),
    align: "left",
    lineGap: 2,
  });
  doc.moveDown(layout.paragraphGap / layout.bodySize);
}

function writeBullets(
  doc: InstanceType<typeof PDFDocument>,
  layout: PdfLayout,
  items: string[],
): void {
  for (const item of items) {
    ensureSpace(doc, layout, 20);
    const bullet = `• ${item}`;
    doc.font("Helvetica").fontSize(layout.bodySize).fillColor("#1a1a1a");
    doc.text(bullet, layout.pageMargin + layout.bulletIndent, doc.y, {
      width: contentWidth(doc, layout) - layout.bulletIndent,
      align: "left",
    });
    doc.moveDown(0.2);
  }
}

function renderHeader(
  doc: InstanceType<typeof PDFDocument>,
  layout: PdfLayout,
  docData: ResumePreviewDocument,
): void {
  const w = contentWidth(doc, layout);
  const name = docData.identity.fullName.trim() || "Your name";
  const headline = docData.identity.headline.trim();
  const contact = docData.contact.lines.map((l) => l.value).filter(Boolean).join(" · ");

  if (layout.headerStyle === "centered") {
    doc.y = layout.pageMargin;
    doc
      .font("Helvetica-Bold")
      .fontSize(layout.nameSize)
      .fillColor("#0a0a0a")
      .text(name, layout.pageMargin, doc.y, { width: w, align: "center" });
    doc.moveDown(0.4);
    if (headline) {
      doc
        .font("Helvetica")
        .fontSize(layout.headlineSize)
        .fillColor("#333333")
        .text(headline, layout.pageMargin, doc.y, { width: w, align: "center" });
      doc.moveDown(0.35);
    }
    if (contact) {
      doc
        .font("Helvetica")
        .fontSize(layout.smallSize)
        .fillColor("#444444")
        .text(contact, layout.pageMargin, doc.y, { width: w, align: "center" });
      doc.moveDown(0.5);
    }
    doc.moveDown(layout.sectionGap / layout.bodySize);
    return;
  }

  if (layout.headerStyle === "split") {
    const leftW = w * 0.58;
    const rightW = w * 0.38;
    const rightX = layout.pageMargin + leftW + 12;
    const startY = layout.pageMargin;

    doc.font("Helvetica-Bold").fontSize(layout.nameSize).fillColor("#0a0a0a");
    doc.text(name, layout.pageMargin, startY, { width: leftW, align: "left" });
    let leftY = doc.y;
    if (headline) {
      doc
        .font("Helvetica")
        .fontSize(layout.headlineSize)
        .fillColor("#333333")
        .text(headline, layout.pageMargin, doc.y + 4, { width: leftW, align: "left" });
      leftY = doc.y;
    }

    if (contact) {
      doc
        .font("Helvetica")
        .fontSize(layout.smallSize)
        .fillColor("#444444")
        .text(contact, rightX, startY, { width: rightW, align: "right" });
    }
    doc.y = leftY + layout.sectionGap;
    return;
  }

  /* compact */
  doc.y = layout.pageMargin;
  doc.font("Helvetica-Bold").fontSize(layout.nameSize).fillColor("#0a0a0a");
  doc.text(name, layout.pageMargin, doc.y, { width: w, align: "left" });
  doc.moveDown(0.2);
  if (headline) {
    doc
      .font("Helvetica")
      .fontSize(layout.headlineSize)
      .fillColor("#333333")
      .text(headline, layout.pageMargin, doc.y, { width: w, align: "left" });
    doc.moveDown(0.15);
  }
  if (contact) {
    doc
      .font("Helvetica")
      .fontSize(layout.smallSize)
      .fillColor("#444444")
      .text(contact, layout.pageMargin, doc.y, { width: w, align: "left" });
    doc.moveDown(0.35);
  }
  doc.moveDown(layout.sectionGap / layout.bodySize);
}

function renderBody(
  doc: InstanceType<typeof PDFDocument>,
  layout: PdfLayout,
  docData: ResumePreviewDocument,
): void {
  if (docData.summary?.trim()) {
    writeSectionTitle(doc, layout, "Summary");
    writeParagraph(doc, layout, docData.summary.trim());
    doc.moveDown(0.3);
  }

  const hasExp = docData.experience.some(
    (e) => e.title || e.company || e.highlights.length,
  );
  if (hasExp) {
    writeSectionTitle(doc, layout, "Experience");
    for (const ex of docData.experience) {
      if (!ex.title && !ex.company && ex.highlights.length === 0) continue;
      ensureSpace(doc, layout, 48);
      const titleLine = [ex.title || "Role", ex.company ? `— ${ex.company}` : ""]
        .filter(Boolean)
        .join(" ");
      const meta = [ex.location, ex.dateRange].filter(Boolean).join(" · ");
      doc.font("Helvetica-Bold").fontSize(layout.bodySize).fillColor("#0a0a0a");
      doc.text(titleLine, layout.pageMargin, doc.y, { width: contentWidth(doc, layout) });
      doc.moveDown(0.15);
      if (meta) {
        doc
          .font("Helvetica")
          .fontSize(layout.smallSize)
          .fillColor("#555555")
          .text(meta, layout.pageMargin, doc.y, { width: contentWidth(doc, layout) });
        doc.moveDown(0.2);
      }
      if (ex.highlights.length) {
        writeBullets(doc, layout, ex.highlights);
      }
      doc.moveDown(0.4);
    }
  }

  const hasEdu = docData.education.some((e) => e.school || e.degreeLine !== "Education");
  if (hasEdu) {
    writeSectionTitle(doc, layout, "Education");
    for (const ed of docData.education) {
      if (!ed.school && ed.degreeLine === "Education") continue;
      ensureSpace(doc, layout, 30);
      const line = [ed.degreeLine, ed.school].filter(Boolean).join(" — ");
      doc
        .font("Helvetica-Bold")
        .fontSize(layout.bodySize)
        .fillColor("#0a0a0a")
        .text(line, layout.pageMargin, doc.y, { width: contentWidth(doc, layout) });
      doc.moveDown(0.1);
      if (ed.dateRange) {
        doc
          .font("Helvetica")
          .fontSize(layout.smallSize)
          .fillColor("#555555")
          .text(ed.dateRange, layout.pageMargin, doc.y, { width: contentWidth(doc, layout) });
        doc.moveDown(0.15);
      }
      if (ed.details?.trim()) {
        doc.font("Helvetica").fontSize(layout.bodySize).fillColor("#1a1a1a");
        doc.text(ed.details.trim(), layout.pageMargin, doc.y, {
          width: contentWidth(doc, layout),
        });
        doc.moveDown(0.2);
      }
    }
    doc.moveDown(0.2);
  }

  if (docData.skills.length) {
    writeSectionTitle(doc, layout, "Skills");
    writeParagraph(doc, layout, docData.skills.join(" · "));
  }

  const hasCert = docData.certifications.some((c) => c.name || c.issuer);
  if (hasCert) {
    writeSectionTitle(doc, layout, "Certifications");
    for (const c of docData.certifications) {
      if (!c.name && !c.issuer) continue;
      ensureSpace(doc, layout, 20);
      const parts = [c.name, c.issuer, c.dateLine].filter(Boolean);
      doc
        .font("Helvetica")
        .fontSize(layout.bodySize)
        .fillColor("#1a1a1a")
        .text(parts.join(" — "), layout.pageMargin, doc.y, {
          width: contentWidth(doc, layout),
        });
      doc.moveDown(0.15);
    }
    doc.moveDown(0.2);
  }

  const hasProj = docData.projects.some((p) => p.name || p.description);
  if (hasProj) {
    writeSectionTitle(doc, layout, "Projects");
    for (const p of docData.projects) {
      if (!p.name && !p.description) continue;
      ensureSpace(doc, layout, 36);
      doc
        .font("Helvetica-Bold")
        .fontSize(layout.bodySize)
        .fillColor("#0a0a0a")
        .text(p.name || "Project", layout.pageMargin, doc.y, {
          width: contentWidth(doc, layout),
        });
      doc.moveDown(0.1);
      if (p.url) {
        doc
          .font("Helvetica")
          .fontSize(layout.smallSize)
          .fillColor("#444444")
          .text(p.url, layout.pageMargin, doc.y, { width: contentWidth(doc, layout) });
        doc.moveDown(0.1);
      }
      if (p.description) {
        doc.font("Helvetica").fontSize(layout.bodySize).fillColor("#1a1a1a");
        doc.text(p.description, layout.pageMargin, doc.y, {
          width: contentWidth(doc, layout),
        });
        doc.moveDown(0.15);
      }
    }
  }

  if (docData.additional?.trim()) {
    writeSectionTitle(doc, layout, "Additional");
    writeParagraph(doc, layout, docData.additional.trim());
  }
}

/**
 * Renders a print-oriented PDF matching the selected template’s density and layout family.
 */
export function renderResumePdfBuffer(
  docData: ResumePreviewDocument,
  templateSlug: TemplateSlug,
): Promise<Buffer> {
  const layout = getPdfLayout(templateSlug);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdf = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: docData.identity.fullName.trim() || "Resume",
        Author: docData.identity.fullName.trim() || "Resume",
        Creator: "AI Resume Builder",
      },
    });

    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    renderHeader(pdf, layout, docData);
    renderBody(pdf, layout, docData);

    pdf.end();
  });
}
