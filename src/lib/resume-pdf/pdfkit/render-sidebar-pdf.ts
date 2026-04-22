import type PDFDocument from "pdfkit";

import {
  isProfileDescriptionEmpty,
  profileHtmlToPlainText,
} from "@/lib/profile-description-html";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { PdfLayout } from "@/lib/resume-pdf/pdfkit/layouts";

type Pdf = InstanceType<typeof PDFDocument>;

const SIDEBAR_TEXT = "#ffffff";
const SIDEBAR_TEXT_DIM = "#e5e7eb";
const BODY_COLOR = "#1a1a1a";
const META_COLOR = "#555555";
const FAINT_COLOR = "#6b7280";
const NAME_COLOR = "#0a0a0a";

/**
 * Proportion of page width consumed by the left rail. Matches the preview's
 * 34% grid column — kept slightly narrower (30%) so that dense contact strings
 * (e.g. long emails) don't force awkward wraps at 72dpi.
 */
const SIDEBAR_RATIO = 0.32;

/**
 * Renders a sidebar-family PDF: a tinted left rail carries identity,
 * contact, skills, certifications (page 1 only); the right column holds
 * summary, experience, education, projects and can span multiple pages.
 *
 * Overflow pages use the full width so long histories remain legible. The
 * reading order is still ATS-linear because the PDF text stream writes the
 * right column's content top-to-bottom after the sidebar.
 */
export function renderSidebarPdf(
  pdf: Pdf,
  layout: PdfLayout,
  doc: ResumePreviewDocument,
  avatarPng: Buffer | null,
): void {
  const pageW = pdf.page.width;
  const pageH = pdf.page.height;
  const sidebarW = Math.round(pageW * SIDEBAR_RATIO);
  const sidebarPad = 18;
  const mainPad = 22;
  const mainX = sidebarW + mainPad;
  const mainW = pageW - sidebarW - mainPad * 2;

  // Left rail tint (extends to end of page — visually consistent with preview).
  pdf.save();
  pdf.rect(0, 0, sidebarW, pageH).fill(layout.accentStrong);
  pdf.restore();

  // ─── Sidebar: avatar / initials
  const railX = sidebarPad;
  const railContentW = sidebarW - sidebarPad * 2;
  let railY = sidebarPad + 4;

  const avatarDiameter = Math.min(96, railContentW - 4);
  const avatarCx = railX + railContentW / 2;
  const avatarCy = railY + avatarDiameter / 2;

  if (avatarPng) {
    pdf.save();
    pdf.circle(avatarCx, avatarCy, avatarDiameter / 2).clip();
    pdf.image(avatarPng, avatarCx - avatarDiameter / 2, avatarCy - avatarDiameter / 2, {
      width: avatarDiameter,
      height: avatarDiameter,
    });
    pdf.restore();
    // Ring around the avatar.
    pdf
      .save()
      .lineWidth(1.5)
      .strokeColor("#ffffff")
      .circle(avatarCx, avatarCy, avatarDiameter / 2)
      .stroke()
      .restore();
  } else {
    pdf
      .save()
      .fillColor("rgba(255,255,255,0.10)")
      .circle(avatarCx, avatarCy, avatarDiameter / 2)
      .fill()
      .restore();
    const initials = initialsOf(doc.identity.fullName);
    if (initials) {
      pdf
        .font(layout.fonts.bold)
        .fontSize(22)
        .fillColor("rgba(255,255,255,0.85)")
        .text(initials, railX, avatarCy - 14, {
          width: railContentW,
          align: "center",
        });
    }
  }

  railY = avatarCy + avatarDiameter / 2 + 14;

  // Name + headline
  pdf
    .font(layout.fonts.bold)
    .fontSize(Math.max(14, layout.nameSize - 6))
    .fillColor(SIDEBAR_TEXT)
    .text(doc.identity.fullName || "Your name", railX, railY, {
      width: railContentW,
      align: "center",
    });
  railY = pdf.y + 4;

  if (doc.identity.headline) {
    pdf
      .font(layout.fonts.regular)
      .fontSize(layout.smallSize)
      .fillColor(SIDEBAR_TEXT_DIM)
      .text(doc.identity.headline, railX, railY, {
        width: railContentW,
        align: "center",
      });
    railY = pdf.y + 8;
  } else {
    railY += 4;
  }

  // Divider
  pdf
    .save()
    .strokeColor(layout.accent)
    .lineWidth(1.5)
    .moveTo(avatarCx - 16, railY)
    .lineTo(avatarCx + 16, railY)
    .stroke()
    .restore();
  railY += 14;

  // ─── Sidebar: contact block
  if (doc.contact.lines.length) {
    railY = drawSidebarHeading(pdf, layout, "Contact", railX, railY, railContentW);
    pdf.font(layout.fonts.regular).fontSize(layout.smallSize - 0.5).fillColor(SIDEBAR_TEXT);
    for (const line of doc.contact.lines) {
      if (!line.value.trim()) continue;
      pdf.text(line.value.trim(), railX, railY, { width: railContentW, lineGap: 1 });
      railY = pdf.y + 2;
    }
    railY += 8;
  }

  // ─── Sidebar: skills
  if (doc.skills.length) {
    railY = drawSidebarHeading(pdf, layout, "Skills", railX, railY, railContentW);
    pdf.font(layout.fonts.regular).fontSize(layout.smallSize - 0.5).fillColor(SIDEBAR_TEXT);
    for (const s of doc.skills) {
      // Bullet dot in accent color.
      pdf
        .save()
        .fillColor(layout.accent)
        .circle(railX + 2, railY + (layout.smallSize - 0.5) * 0.45, 1.1)
        .fill()
        .restore();
      pdf.fillColor(SIDEBAR_TEXT).text(s, railX + 8, railY, {
        width: railContentW - 8,
        lineGap: 1,
      });
      railY = pdf.y + 2;
    }
    railY += 8;
  }

  // ─── Sidebar: certifications
  const certs = doc.certifications.filter((c) => c.name || c.issuer);
  if (certs.length) {
    railY = drawSidebarHeading(pdf, layout, "Certifications", railX, railY, railContentW);
    for (const c of certs) {
      pdf
        .font(layout.fonts.bold)
        .fontSize(layout.smallSize - 0.5)
        .fillColor(SIDEBAR_TEXT)
        .text(c.name || "Certification", railX, railY, { width: railContentW });
      railY = pdf.y + 1;
      if (c.issuer) {
        pdf
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize - 0.5)
          .fillColor(SIDEBAR_TEXT_DIM)
          .text(c.issuer, railX, railY, { width: railContentW });
        railY = pdf.y + 1;
      }
      if (c.dateLine) {
        pdf
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize - 1.5)
          .fillColor("rgba(255,255,255,0.75)")
          .text(c.dateLine, railX, railY, { width: railContentW });
        railY = pdf.y + 1;
      }
      railY += 4;
    }
  }

  // ─── Main column: starts at the top of page 1, uses full width on later pages.
  const mainBottomMargin = 36;
  pdf.x = mainX;
  pdf.y = mainPad;
  // Stash the on-page "left / width" so our writers can reference it. We cannot
  // stretch PDFKit's built-in `page.margins`, so we keep them at zero and drive
  // positioning by absolute coords.
  const state: MainState = {
    left: mainX,
    width: mainW,
    pageBottom: pageH - mainBottomMargin,
    onOverflow: () => {
      // On overflow pages, use the full width (no rail) for long histories.
      state.left = mainPad;
      state.width = pageW - mainPad * 2;
      state.pageBottom = pageH - mainBottomMargin;
      pdf.x = state.left;
      pdf.y = mainPad;
    },
  };

  // `pageAdded` for the initial page fires inside `new PDFDocument()` — before
  // this listener exists — so every event that reaches us is a real overflow.
  pdf.on("pageAdded", () => {
    state.onOverflow();
  });

  drawMain(pdf, layout, doc, state, mainPad);
}

type MainState = {
  left: number;
  width: number;
  pageBottom: number;
  onOverflow: () => void;
};

function applyMainHardPageBreak(
  pdf: Pdf,
  state: MainState,
  mainPad: number,
  breaks: ResumePreviewDocument["pageBreakBefore"],
  key: keyof NonNullable<typeof breaks>,
  willRender: boolean,
): void {
  if (!willRender || !breaks?.[key]) return;
  pdf.addPage();
  pdf.x = state.left;
  pdf.y = mainPad;
}

function drawSidebarHeading(
  pdf: Pdf,
  layout: PdfLayout,
  text: string,
  x: number,
  y: number,
  width: number,
): number {
  pdf
    .font(layout.fonts.bold)
    .fontSize(layout.smallSize - 1)
    .fillColor(SIDEBAR_TEXT_DIM)
    .text(text.toUpperCase(), x, y, {
      width,
      characterSpacing: 1.4,
    });
  const newY = pdf.y + 2;
  pdf
    .save()
    .strokeColor(layout.accent)
    .lineWidth(1)
    .moveTo(x, newY)
    .lineTo(x + 14, newY)
    .stroke()
    .restore();
  return newY + 6;
}

/* ─── Main column renderer (summary / experience / education / projects / additional) ─── */

function ensureMainSpace(pdf: Pdf, state: MainState, minHeight: number): void {
  if (pdf.y + minHeight > state.pageBottom) {
    pdf.addPage();
  }
}

function mainSectionTitle(pdf: Pdf, layout: PdfLayout, state: MainState, title: string): void {
  ensureMainSpace(pdf, state, 28);
  pdf
    .font(layout.fonts.bold)
    .fontSize(layout.sectionTitleSize)
    .fillColor(layout.accentStrong)
    .text(title.toUpperCase(), state.left, pdf.y, {
      width: state.width,
      characterSpacing: 1.1,
    });
  pdf.moveDown(0.3);

  pdf
    .save()
    .strokeColor(layout.accent)
    .lineWidth(1.2)
    .moveTo(state.left, pdf.y)
    .lineTo(state.left + 28, pdf.y)
    .stroke();
  pdf
    .strokeColor("#d1d5db")
    .lineWidth(0.5)
    .moveTo(state.left + 30, pdf.y)
    .lineTo(state.left + state.width, pdf.y)
    .stroke()
    .restore();

  pdf.moveDown(0.55);
  pdf.fillColor(BODY_COLOR);
}

function mainParagraph(pdf: Pdf, layout: PdfLayout, state: MainState, text: string): void {
  if (!text.trim()) return;
  ensureMainSpace(pdf, state, 40);
  pdf.font(layout.fonts.regular).fontSize(layout.bodySize).fillColor(BODY_COLOR);
  pdf.text(text, state.left, pdf.y, {
    width: state.width,
    align: layout.bodyAlign,
    lineGap: layout.bodyLineGap,
  });
  pdf.moveDown(layout.paragraphGap / layout.bodySize);
}

function mainBullets(pdf: Pdf, layout: PdfLayout, state: MainState, items: string[]): void {
  for (const item of items) {
    if (!item.trim()) continue;
    ensureMainSpace(pdf, state, layout.bodySize + 8);
    const indent = layout.bulletIndent;
    const xBullet = state.left + 2;
    const xText = state.left + indent;
    const startY = pdf.y;
    pdf.font(layout.fonts.bold).fontSize(layout.bodySize).fillColor(layout.accent);
    pdf.text("•", xBullet, startY, { width: indent, lineGap: 2 });
    pdf.font(layout.fonts.regular).fontSize(layout.bodySize).fillColor(BODY_COLOR);
    pdf.text(item.trim(), xText, startY, {
      width: state.width - indent,
      align: layout.bodyAlign,
      lineGap: layout.bodyLineGap,
    });
    pdf.moveDown(0.15);
  }
}

function drawMain(
  pdf: Pdf,
  layout: PdfLayout,
  docData: ResumePreviewDocument,
  state: MainState,
  mainPad: number,
): void {
  const pb = docData.pageBreakBefore;

  // Summary
  if (docData.summary && !isProfileDescriptionEmpty(docData.summary)) {
    applyMainHardPageBreak(pdf, state, mainPad, pb, "summary", true);
    mainSectionTitle(pdf, layout, state, "Summary");
    mainParagraph(pdf, layout, state, profileHtmlToPlainText(docData.summary));
    pdf.moveDown(0.25);
  }

  // Experience
  const hasExp = docData.experience.some(
    (e) => e.title || e.company || e.highlights.length,
  );
  if (hasExp) {
    applyMainHardPageBreak(pdf, state, mainPad, pb, "experience", true);
    mainSectionTitle(pdf, layout, state, "Experience");
    for (const ex of docData.experience) {
      if (!ex.title && !ex.company && ex.highlights.length === 0) continue;
      ensureMainSpace(pdf, state, layout.bodySize * 3 + 10);

      const startY = pdf.y;
      const titleLine = [ex.title || "Role", ex.company ? `— ${ex.company}` : ""]
        .filter(Boolean)
        .join(" ");

      const dateText = ex.dateRange?.trim() ?? "";
      const dateWidth = dateText ? 130 : 0;
      const titleWidth = state.width - (dateText ? dateWidth + 8 : 0);

      pdf
        .font(layout.fonts.bold)
        .fontSize(layout.bodySize + 0.5)
        .fillColor(NAME_COLOR)
        .text(titleLine, state.left, startY, { width: titleWidth });

      if (dateText) {
        pdf
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize)
          .fillColor(META_COLOR)
          .text(dateText, state.left + state.width - dateWidth, startY + 1, {
            width: dateWidth,
            align: "right",
          });
      }

      pdf.y = Math.max(pdf.y, startY + layout.bodySize + 2);

      if (ex.location?.trim()) {
        pdf
          .font(layout.fonts.italic)
          .fontSize(layout.smallSize)
          .fillColor(FAINT_COLOR)
          .text(ex.location, state.left, pdf.y, { width: state.width });
        pdf.moveDown(0.15);
      }

      if (ex.highlights.length) {
        mainBullets(pdf, layout, state, ex.highlights);
      }
      pdf.moveDown(layout.entryGap / layout.bodySize);
    }
  }

  // Education
  const hasEdu = docData.education.some(
    (e) => e.school || e.degreeLine !== "Education" || e.dateRange,
  );
  if (hasEdu) {
    applyMainHardPageBreak(pdf, state, mainPad, pb, "education", true);
    mainSectionTitle(pdf, layout, state, "Education");
    for (const ed of docData.education) {
      if (!ed.school && ed.degreeLine === "Education" && !ed.dateRange) continue;
      ensureMainSpace(pdf, state, layout.bodySize * 2 + 6);

      const startY = pdf.y;
      const line = [ed.degreeLine, ed.school].filter(Boolean).join(" — ");
      const dateText = ed.dateRange?.trim() ?? "";
      const dateWidth = dateText ? 120 : 0;
      const titleWidth = state.width - (dateText ? dateWidth + 8 : 0);

      pdf
        .font(layout.fonts.bold)
        .fontSize(layout.bodySize + 0.5)
        .fillColor(NAME_COLOR)
        .text(line, state.left, startY, { width: titleWidth });

      if (dateText) {
        pdf
          .font(layout.fonts.regular)
          .fontSize(layout.smallSize)
          .fillColor(META_COLOR)
          .text(dateText, state.left + state.width - dateWidth, startY + 1, {
            width: dateWidth,
            align: "right",
          });
      }

      pdf.y = Math.max(pdf.y, startY + layout.bodySize + 2);

      if (ed.details?.trim()) {
        pdf.font(layout.fonts.regular).fontSize(layout.bodySize).fillColor(BODY_COLOR);
        pdf.text(ed.details.trim(), state.left, pdf.y, { width: state.width });
        pdf.moveDown(0.2);
      }
      pdf.moveDown(0.15);
    }
  }

  // Projects
  const hasProj = docData.projects.some((p) => p.name || p.description);
  if (hasProj) {
    applyMainHardPageBreak(pdf, state, mainPad, pb, "projects", true);
    mainSectionTitle(pdf, layout, state, "Projects");
    for (const p of docData.projects) {
      if (!p.name && !p.description) continue;
      ensureMainSpace(pdf, state, layout.bodySize * 3 + 6);
      pdf
        .font(layout.fonts.bold)
        .fontSize(layout.bodySize + 0.5)
        .fillColor(NAME_COLOR)
        .text(p.name || "Project", state.left, pdf.y, { width: state.width });
      pdf.moveDown(0.1);

      if (p.description?.trim()) {
        pdf
          .font(layout.fonts.regular)
          .fontSize(layout.bodySize)
          .fillColor(BODY_COLOR)
          .text(p.description.trim(), state.left, pdf.y, { width: state.width });
        pdf.moveDown(0.15);
      }
      if (p.technologies?.trim()) {
        pdf
          .font(layout.fonts.italic)
          .fontSize(layout.smallSize)
          .fillColor(FAINT_COLOR)
          .text(`Stack: ${p.technologies.trim()}`, state.left, pdf.y, { width: state.width });
        pdf.moveDown(0.2);
      }
      pdf.moveDown(layout.entryGap / (layout.bodySize * 2));
    }
  }

  if (docData.additional?.trim()) {
    applyMainHardPageBreak(pdf, state, mainPad, pb, "additional", true);
    mainSectionTitle(pdf, layout, state, "Additional");
    mainParagraph(pdf, layout, state, docData.additional.trim());
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
