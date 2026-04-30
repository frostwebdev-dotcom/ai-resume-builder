import PDFDocument from "pdfkit";

import { APP_NAME } from "@/lib/constants";
import {
  isProfileDescriptionEmpty,
  profileHtmlToPlainText,
} from "@/lib/profile-description-html";
import type { ResumeContactLine, ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getPdfLayout, type PdfLayout } from "@/lib/resume-pdf/pdfkit/layouts";
import { renderSidebarPdf } from "@/lib/resume-pdf/pdfkit/render-sidebar-pdf";

type Pdf = InstanceType<typeof PDFDocument>;

const BODY_COLOR = "#1a1a1a";
const META_COLOR = "#555555";
const FAINT_COLOR = "#6b7280";
const NAME_COLOR = "#0a0a0a";
const BANNER_TEXT_COLOR = "#ffffff";
const BANNER_META_COLOR = "#e5e7eb";

function contentWidth(doc: Pdf, layout: PdfLayout): number {
  return doc.page.width - layout.pageMargin * 2;
}

function pageBottom(doc: Pdf, layout: PdfLayout): number {
  return doc.page.height - layout.pageMargin;
}

function ensureSpace(doc: Pdf, layout: PdfLayout, minHeight: number): void {
  if (doc.y + minHeight > pageBottom(doc, layout)) {
    doc.addPage();
    doc.y = layout.pageMargin;
  }
}

/** User-requested page break before a body section (ignored if that section does not render). */
function applyHardPageBreak(
  doc: Pdf,
  layout: PdfLayout,
  breaks: ResumePreviewDocument["pageBreakBefore"],
  key: keyof NonNullable<typeof breaks>,
  willRender: boolean,
): void {
  if (!willRender || !breaks?.[key]) return;
  doc.addPage();
  doc.y = layout.pageMargin;
  doc.x = layout.pageMargin;
}

function normaliseUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `mailto:${s}`;
  if (/^\+?[\d][\d\s().-]{5,}$/.test(s)) return `tel:${s.replace(/\s+/g, "")}`;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(s)) return `https://${s}`;
  return null;
}

function formatContactLabel(line: ResumeContactLine): string {
  return line.value.trim();
}

function writeSectionTitle(doc: Pdf, layout: PdfLayout, title: string): void {
  ensureSpace(doc, layout, 26);
  doc
    .font(layout.fonts.bold)
    .fontSize(layout.sectionTitleSize)
    .fillColor(layout.accentStrong)
    .text(title.toUpperCase(), layout.pageMargin, doc.y, {
      width: contentWidth(doc, layout),
      characterSpacing: 1.1,
    });
  doc.moveDown(0.3);

  if (layout.sectionTitleStyle === "accent-rule") {
    const y = doc.y;
    doc
      .strokeColor(layout.accent)
      .lineWidth(1.2)
      .moveTo(layout.pageMargin, y)
      .lineTo(layout.pageMargin + 28, y)
      .stroke();
    doc
      .strokeColor("#d1d5db")
      .lineWidth(0.5)
      .moveTo(layout.pageMargin + 30, y)
      .lineTo(doc.page.width - layout.pageMargin, y)
      .stroke();
  } else if (layout.sectionTitleStyle === "rule") {
    doc
      .strokeColor(layout.accent)
      .lineWidth(0.6)
      .moveTo(layout.pageMargin, doc.y)
      .lineTo(doc.page.width - layout.pageMargin, doc.y)
      .stroke();
  } else {
    doc
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .moveTo(layout.pageMargin, doc.y)
      .lineTo(doc.page.width - layout.pageMargin, doc.y)
      .stroke();
  }

  doc.moveDown(0.55);
  doc.fillColor(BODY_COLOR);
}

function writeParagraph(doc: Pdf, layout: PdfLayout, text: string): void {
  if (!text.trim()) return;
  ensureSpace(doc, layout, 40);
  doc.font(layout.fonts.regular).fontSize(layout.bodySize).fillColor(BODY_COLOR);
  doc.text(text, layout.pageMargin, doc.y, {
    width: contentWidth(doc, layout),
    align: layout.bodyAlign,
    lineGap: layout.bodyLineGap,
  });
  doc.moveDown(layout.paragraphGap / layout.bodySize);
}

function writeBullets(doc: Pdf, layout: PdfLayout, items: string[]): void {
  for (const item of items) {
    if (!item.trim()) continue;
    ensureSpace(doc, layout, layout.bodySize + 8);
    const indent = layout.bulletIndent;
    const xBullet = layout.pageMargin + 2;
    const xText = layout.pageMargin + indent;
    const textWidth = contentWidth(doc, layout) - indent;
    const startY = doc.y;

    doc.font(layout.fonts.bold).fontSize(layout.bodySize).fillColor(layout.accent);
    doc.text("•", xBullet, startY, { width: indent, lineGap: 2 });

    doc.font(layout.fonts.regular).fontSize(layout.bodySize).fillColor(BODY_COLOR);
    doc.text(item.trim(), xText, startY, {
      width: textWidth,
      align: layout.bodyAlign,
      lineGap: layout.bodyLineGap,
    });
    doc.moveDown(0.15);
  }
}

function renderContactLine(
  doc: Pdf,
  layout: PdfLayout,
  lines: ResumeContactLine[],
  x: number,
  y: number,
  width: number,
  align: "left" | "right" | "center",
  color: string = META_COLOR,
): number {
  const parts = lines.map(formatContactLabel).filter(Boolean);
  if (parts.length === 0) return y;

  const sep = "  ·  ";
  const combined = parts.join(sep);
  doc.font(layout.fonts.regular).fontSize(layout.smallSize).fillColor(color);
  doc.text(combined, x, y, { width, align, lineGap: 1 });
  return doc.y;
}

function renderHeaderBanner(
  doc: Pdf,
  layout: PdfLayout,
  docData: ResumePreviewDocument,
  avatarPng: Buffer | null,
): void {
  const name = docData.identity.fullName.trim() || "Your name";
  const headline = docData.identity.headline.trim();
  const lines = docData.contact.lines.filter((l) => l.value.trim());
  const w = contentWidth(doc, layout);

  const bannerTopPad = 22;
  const bannerBottomPad = 18;
  const hasAvatar = Boolean(avatarPng) && layout.showAvatar;
  const avatarSize = hasAvatar ? 66 : 0;
  const avatarGap = hasAvatar ? 14 : 0;
  const textX = layout.pageMargin + avatarSize + avatarGap;
  const textW = w - avatarSize - avatarGap;

  const personalRows = docData.personalOptionalLines.filter((l) => l.value.trim()).length;
  const approxLines = (headline ? 1 : 0) + (lines.length ? 1 : 0) + personalRows;
  const bannerHeight = Math.max(
    bannerTopPad + layout.nameSize + approxLines * (layout.smallSize + 6) + bannerBottomPad,
    hasAvatar ? bannerTopPad + avatarSize + bannerBottomPad : 0,
  );

  doc.save();
  doc.rect(0, 0, doc.page.width, bannerHeight).fill(layout.accentStrong);
  doc.restore();

  if (hasAvatar && avatarPng) {
    const cx = layout.pageMargin + avatarSize / 2;
    const cy = bannerTopPad + avatarSize / 2;
    doc.save();
    doc.circle(cx, cy, avatarSize / 2).clip();
    doc.image(avatarPng, cx - avatarSize / 2, cy - avatarSize / 2, {
      width: avatarSize,
      height: avatarSize,
    });
    doc.restore();
    doc
      .save()
      .lineWidth(1.2)
      .strokeColor("#ffffff")
      .circle(cx, cy, avatarSize / 2)
      .stroke()
      .restore();
  }

  doc
    .font(layout.fonts.bold)
    .fontSize(layout.nameSize)
    .fillColor(BANNER_TEXT_COLOR)
    .text(name, textX, bannerTopPad + (hasAvatar ? 6 : 0), {
      width: textW,
      align: "left",
      characterSpacing: 0.4,
    });

  let cursor = doc.y;
  if (headline) {
    doc
      .font(layout.fonts.regular)
      .fontSize(layout.headlineSize)
      .fillColor(BANNER_META_COLOR)
      .text(headline, textX, cursor + 2, { width: textW, align: "left" });
    cursor = doc.y;
  }
  if (lines.length) {
    cursor = renderContactLine(
      doc,
      layout,
      lines,
      textX,
      cursor + 4,
      textW,
      "left",
      BANNER_META_COLOR,
    );
  }

  const po = docData.personalOptionalLines.filter((l) => l.value.trim());
  if (po.length) {
    doc.font(layout.fonts.regular).fontSize(layout.smallSize - 0.5).fillColor(BANNER_META_COLOR);
    for (const line of po) {
      const text = line.label?.trim()
        ? `${line.label.trim()}: ${line.value.trim()}`
        : line.value.trim();
      doc.text(text, textX, cursor + 4, { width: textW, align: "left", lineGap: 1 });
      cursor = doc.y;
    }
  }

  const ruleY = Math.max(cursor + 6, bannerTopPad + avatarSize + 6);
  doc
    .strokeColor(layout.accent)
    .lineWidth(2)
    .moveTo(layout.pageMargin, ruleY)
    .lineTo(layout.pageMargin + 60, ruleY)
    .stroke();

  doc.y = Math.max(bannerHeight, ruleY + 6) + 10;
}

function renderHeader(
  doc: Pdf,
  layout: PdfLayout,
  docData: ResumePreviewDocument,
  avatarPng: Buffer | null,
): void {
  const w = contentWidth(doc, layout);
  const name = docData.identity.fullName.trim() || "Your name";
  const headline = docData.identity.headline.trim();
  const lines = docData.contact.lines.filter((l) => l.value.trim());

  if (layout.headerStyle === "banner") {
    renderHeaderBanner(doc, layout, docData, avatarPng);
    return;
  }

  doc.y = layout.pageMargin;

  if (layout.headerStyle === "centered") {
    doc
      .font(layout.fonts.bold)
      .fontSize(layout.nameSize)
      .fillColor(NAME_COLOR)
      .text(name, layout.pageMargin, doc.y, {
        width: w,
        align: "center",
        characterSpacing: 0.8,
      });
    doc.moveDown(0.35);

    if (headline) {
      doc
        .font(layout.fonts.regular)
        .fontSize(layout.headlineSize)
        .fillColor(layout.accentStrong)
        .text(headline, layout.pageMargin, doc.y, { width: w, align: "center" });
      doc.moveDown(0.4);
    }

    if (lines.length) {
      renderContactLine(doc, layout, lines, layout.pageMargin, doc.y, w, "center");
      doc.moveDown(0.4);
    }

    const poCenter = docData.personalOptionalLines.filter((l) => l.value.trim());
    if (poCenter.length) {
      doc.font(layout.fonts.regular).fontSize(layout.smallSize - 0.5).fillColor(META_COLOR);
      for (const line of poCenter) {
        const text = line.label?.trim()
          ? `${line.label.trim()}: ${line.value.trim()}`
          : line.value.trim();
        doc.text(text, layout.pageMargin, doc.y, { width: w, align: "center", lineGap: 1 });
        doc.moveDown(0.12);
      }
      doc.moveDown(0.25);
    }

    const y = doc.y;
    doc
      .strokeColor(layout.accent)
      .lineWidth(0.8)
      .moveTo(layout.pageMargin + w * 0.35, y)
      .lineTo(layout.pageMargin + w * 0.65, y)
      .stroke();
    doc.moveDown(0.6);
    return;
  }

  if (layout.headerStyle === "split") {
    const leftW = w * 0.62;
    const rightW = w * 0.34;
    const rightX = layout.pageMargin + w - rightW;
    const startY = layout.pageMargin;

    doc.font(layout.fonts.bold).fontSize(layout.nameSize).fillColor(NAME_COLOR);
    doc.text(name, layout.pageMargin, startY, {
      width: leftW,
      align: "left",
      characterSpacing: 0.4,
    });
    let leftEnd = doc.y;

    if (headline) {
      doc
        .font(layout.fonts.regular)
        .fontSize(layout.headlineSize)
        .fillColor(layout.accentStrong)
        .text(headline, layout.pageMargin, doc.y + 2, { width: leftW, align: "left" });
      leftEnd = doc.y;
    }

    let rightBottom = startY;
    if (lines.length) {
      rightBottom = renderContactLine(
        doc,
        layout,
        lines,
        rightX,
        startY,
        rightW,
        "right",
        META_COLOR,
      );
    }

    let splitRightEnd = rightBottom;
    const poSplit = docData.personalOptionalLines.filter((l) => l.value.trim());
    if (poSplit.length) {
      doc.font(layout.fonts.regular).fontSize(layout.smallSize - 0.5).fillColor(META_COLOR);
      let cy = rightBottom + 4;
      for (const line of poSplit) {
        const text = line.label?.trim()
          ? `${line.label.trim()}: ${line.value.trim()}`
          : line.value.trim();
        doc.text(text, rightX, cy, { width: rightW, align: "right", lineGap: 1 });
        cy = doc.y + 2;
      }
      splitRightEnd = cy;
    }

    const y = Math.max(leftEnd, splitRightEnd) + 6;
    doc
      .strokeColor(layout.accent)
      .lineWidth(1.5)
      .moveTo(layout.pageMargin, y)
      .lineTo(layout.pageMargin + 42, y)
      .stroke();
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(0.6)
      .moveTo(layout.pageMargin + 46, y)
      .lineTo(layout.pageMargin + w, y)
      .stroke();

    doc.y = y + 10;
    return;
  }

  /* compact */
  doc.font(layout.fonts.bold).fontSize(layout.nameSize).fillColor(NAME_COLOR);
  doc.text(name, layout.pageMargin, doc.y, { width: w, align: "left" });
  doc.moveDown(0.2);
  if (headline) {
    doc
      .font(layout.fonts.regular)
      .fontSize(layout.headlineSize)
      .fillColor(layout.accentStrong)
      .text(headline, layout.pageMargin, doc.y, { width: w, align: "left" });
    doc.moveDown(0.2);
  }
  if (lines.length) {
    renderContactLine(doc, layout, lines, layout.pageMargin, doc.y, w, "left");
    doc.moveDown(0.35);
  }
  const poCompact = docData.personalOptionalLines.filter((l) => l.value.trim());
  if (poCompact.length) {
    doc.font(layout.fonts.regular).fontSize(layout.smallSize - 0.5).fillColor(META_COLOR);
    for (const line of poCompact) {
      const text = line.label?.trim()
        ? `${line.label.trim()}: ${line.value.trim()}`
        : line.value.trim();
      doc.text(text, layout.pageMargin, doc.y, { width: w, align: "left", lineGap: 1 });
      doc.moveDown(0.12);
    }
    doc.moveDown(0.2);
  }
  const y = doc.y;
  doc
    .strokeColor(layout.accent)
    .lineWidth(0.7)
    .moveTo(layout.pageMargin, y)
    .lineTo(layout.pageMargin + w, y)
    .stroke();
  doc.moveDown(0.55);
}

function renderBody(doc: Pdf, layout: PdfLayout, docData: ResumePreviewDocument): void {
  const pb = docData.pageBreakBefore;

  if (docData.summary && !isProfileDescriptionEmpty(docData.summary)) {
    applyHardPageBreak(doc, layout, pb, "summary", true);
    writeSectionTitle(doc, layout, "Summary");
    writeParagraph(doc, layout, profileHtmlToPlainText(docData.summary));
    doc.moveDown(0.25);
  }

  const hasEdu = docData.education.some(
    (e) => e.school || e.degreeLine !== "Education" || e.dateRange,
  );
  if (hasEdu) {
    applyHardPageBreak(doc, layout, pb, "education", true);
    writeSectionTitle(doc, layout, "Education");
    for (const ed of docData.education) {
      if (!ed.school && ed.degreeLine === "Education" && !ed.dateRange) continue;
      ensureSpace(doc, layout, layout.bodySize * 2 + 6);

      const w = contentWidth(doc, layout);
      const startY = doc.y;
      const line = [ed.degreeLine, ed.school].filter(Boolean).join(" — ");
      const dateText = ed.dateRange?.trim() ?? "";
      const dateWidth = dateText ? 140 : 0;
      const titleWidth = w - (dateText ? dateWidth + 8 : 0);

      doc
        .font(layout.fonts.bold)
        .fontSize(layout.bodySize + 0.5)
        .fillColor(NAME_COLOR)
        .text(line, layout.pageMargin, startY, { width: titleWidth });

      if (dateText) {
        doc
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize)
          .fillColor(META_COLOR)
          .text(dateText, layout.pageMargin + w - dateWidth, startY + 1, {
            width: dateWidth,
            align: "right",
          });
      }

      doc.y = Math.max(doc.y, startY + layout.bodySize + 2);

      if (ed.details?.trim()) {
        doc.font(layout.fonts.regular).fontSize(layout.bodySize).fillColor(BODY_COLOR);
        doc.text(ed.details.trim(), layout.pageMargin, doc.y, { width: w });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.15);
    }
  }

  const hasExp = docData.experience.some(
    (e) => e.title || e.company || e.highlights.length,
  );
  if (hasExp) {
    applyHardPageBreak(doc, layout, pb, "experience", true);
    writeSectionTitle(doc, layout, "Experience");
    for (const ex of docData.experience) {
      if (!ex.title && !ex.company && ex.highlights.length === 0) continue;
      ensureSpace(doc, layout, layout.bodySize * 3 + 10);

      const w = contentWidth(doc, layout);
      const startY = doc.y;

      const titleLine = [ex.title || "Role", ex.company ? `— ${ex.company}` : ""]
        .filter(Boolean)
        .join(" ");

      doc.font(layout.fonts.bold).fontSize(layout.bodySize + 0.5).fillColor(NAME_COLOR);
      const dateText = ex.dateRange?.trim() ?? "";
      const dateWidth = dateText ? 150 : 0;
      const titleWidth = w - (dateText ? dateWidth + 8 : 0);
      doc.text(titleLine, layout.pageMargin, startY, { width: titleWidth });

      if (dateText) {
        doc
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize)
          .fillColor(META_COLOR)
          .text(dateText, layout.pageMargin + w - dateWidth, startY + 1, {
            width: dateWidth,
            align: "right",
          });
      }

      doc.y = Math.max(doc.y, startY + layout.bodySize + 2);

      if (ex.location?.trim()) {
        doc
          .font(layout.fonts.italic)
          .fontSize(layout.smallSize)
          .fillColor(FAINT_COLOR)
          .text(ex.location, layout.pageMargin, doc.y, { width: w });
        doc.moveDown(0.15);
      }

      if (ex.highlights.length) {
        writeBullets(doc, layout, ex.highlights);
      }
      doc.moveDown(layout.entryGap / layout.bodySize);
    }
  }

  if (docData.skills.length) {
    applyHardPageBreak(doc, layout, pb, "skills", true);
    writeSectionTitle(doc, layout, "Skills");
    writeParagraph(doc, layout, docData.skills.join("  ·  "));
  }

  for (const s of docData.supplementarySections) {
    if (!s.body.trim()) continue;
    applyHardPageBreak(doc, layout, pb, s.id, true);
    writeSectionTitle(doc, layout, s.title);
    writeParagraph(doc, layout, s.body.trim());
  }

  const hasCert = docData.certifications.some((c) => c.name || c.issuer);
  if (hasCert) {
    applyHardPageBreak(doc, layout, pb, "certifications", true);
    writeSectionTitle(doc, layout, "Certifications");
    for (const c of docData.certifications) {
      if (!c.name && !c.issuer) continue;
      ensureSpace(doc, layout, 18);
      const left = [c.name, c.issuer].filter(Boolean).join(" — ");
      const w = contentWidth(doc, layout);
      const startY = doc.y;
      const dateText = c.dateLine?.trim() ?? "";
      const dateWidth = dateText ? 130 : 0;
      const titleWidth = w - (dateText ? dateWidth + 8 : 0);
      doc
        .font(layout.fonts.regular)
        .fontSize(layout.bodySize)
        .fillColor(BODY_COLOR)
        .text(left, layout.pageMargin, startY, { width: titleWidth });
      if (dateText) {
        doc
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize)
          .fillColor(META_COLOR)
          .text(dateText, layout.pageMargin + w - dateWidth, startY + 1, {
            width: dateWidth,
            align: "right",
          });
      }
      doc.y = Math.max(doc.y, startY + layout.bodySize + 1);
    }
    doc.moveDown(0.2);
  }

  const hasProj = docData.projects.some((p) => p.name || p.description);
  if (hasProj) {
    applyHardPageBreak(doc, layout, pb, "projects", true);
    writeSectionTitle(doc, layout, "Projects");
    for (const p of docData.projects) {
      if (!p.name && !p.description) continue;
      ensureSpace(doc, layout, layout.bodySize * 3 + 6);

      const w = contentWidth(doc, layout);
      doc
        .font(layout.fonts.bold)
        .fontSize(layout.bodySize + 0.5)
        .fillColor(NAME_COLOR)
        .text(p.name || "Project", layout.pageMargin, doc.y, { width: w });
      doc.moveDown(0.1);

      if (p.url) {
        const href = normaliseUrl(p.url);
        doc.font(layout.fonts.regular).fontSize(layout.smallSize);
        if (href) {
          doc
            .fillColor(layout.accent)
            .text(p.url, layout.pageMargin, doc.y, { width: w, link: href });
        } else {
          doc.fillColor(META_COLOR).text(p.url, layout.pageMargin, doc.y, { width: w });
        }
        doc.moveDown(0.15);
      }

      if (p.description?.trim()) {
        doc
          .font(layout.fonts.regular)
          .fontSize(layout.bodySize)
          .fillColor(BODY_COLOR)
          .text(p.description.trim(), layout.pageMargin, doc.y, { width: w });
        doc.moveDown(0.15);
      }

      if (p.technologies?.trim()) {
        doc
          .font(layout.fonts.italic)
          .fontSize(layout.smallSize)
          .fillColor(FAINT_COLOR)
          .text(`Stack: ${p.technologies.trim()}`, layout.pageMargin, doc.y, { width: w });
        doc.moveDown(0.2);
      }
      doc.moveDown(layout.entryGap / (layout.bodySize * 2));
    }
  }

  if (docData.additional?.trim()) {
    applyHardPageBreak(doc, layout, pb, "additional", true);
    writeSectionTitle(doc, layout, "Additional");
    writeParagraph(doc, layout, docData.additional.trim());
  }
}

/**
 * Renders a print-oriented PDF matching the selected template's density
 * and layout family. Output is A4.
 *
 * - Classic family: single-column, ATS-linear.
 * - Sidebar family: two-column page 1 (rail + main), overflow pages go
 *   full-width for long histories (still linear text stream).
 * - Photo-banner family: classic layout with an embedded avatar in the
 *   banner header (reading order unaffected).
 */
export function renderResumePdfBuffer(
  docData: ResumePreviewDocument,
  templateSlug: TemplateSlug,
  resumeStyle?: ResumeStyleV1 | null,
  avatarPng?: Buffer | null,
): Promise<Buffer> {
  const layout = getPdfLayout(templateSlug, resumeStyle);
  const useAvatar = layout.showAvatar ? avatarPng ?? null : null;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdf = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: docData.identity.fullName.trim() || "Resume",
        Author: docData.identity.fullName.trim() || "Resume",
        Creator: APP_NAME,
        Subject: docData.identity.headline.trim() || "Resume",
      },
    });

    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    try {
      if (layout.layoutFamily === "sidebar") {
        renderSidebarPdf(pdf, layout, docData, useAvatar);
      } else {
        renderHeader(pdf, layout, docData, useAvatar);
        renderBody(pdf, layout, docData);
      }
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    pdf.end();
  });
}
