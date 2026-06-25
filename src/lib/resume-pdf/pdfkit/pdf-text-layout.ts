import type PDFDocument from "pdfkit";

type Pdf = InstanceType<typeof PDFDocument>;

export type TitleRowParams = {
  x: number;
  width: number;
  startY: number;
  title: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  dateText?: string;
  dateWidth?: number;
  dateFont?: string;
  dateSize?: number;
  dateColor?: string;
  /** Space below the title/date row before the next block. */
  gapAfter?: number;
};

/**
 * Renders a bold title with an optional right-aligned date on the same row.
 * Returns the Y coordinate for the next block (avoids overlap when the title wraps).
 */
export function writeTitleRow(pdf: Pdf, params: TitleRowParams): number {
  const dateText = params.dateText?.trim() ?? "";
  const dateWidth = dateText ? (params.dateWidth ?? 140) : 0;
  const titleWidth = params.width - (dateText ? dateWidth + 8 : 0);
  const gapAfter = params.gapAfter ?? 2;

  pdf.font(params.titleFont).fontSize(params.titleSize).fillColor(params.titleColor);
  const titleHeight = pdf.heightOfString(params.title, { width: titleWidth });

  let dateHeight = 0;
  if (dateText) {
    pdf
      .font(params.dateFont ?? params.titleFont)
      .fontSize(params.dateSize ?? params.titleSize)
      .fillColor(params.dateColor ?? params.titleColor);
    dateHeight = pdf.heightOfString(dateText, { width: dateWidth });
  }

  const blockHeight = Math.max(titleHeight, dateHeight);

  pdf.font(params.titleFont).fontSize(params.titleSize).fillColor(params.titleColor);
  pdf.text(params.title, params.x, params.startY, { width: titleWidth });

  if (dateText) {
    pdf
      .font(params.dateFont ?? params.titleFont)
      .fontSize(params.dateSize ?? params.titleSize)
      .fillColor(params.dateColor ?? params.titleColor)
      .text(dateText, params.x + params.width - dateWidth, params.startY + 1, {
        width: dateWidth,
        align: "right",
      });
  }

  return params.startY + blockHeight + gapAfter;
}

export type BulletItemParams = {
  x: number;
  width: number;
  startY: number;
  text: string;
  fonts: { regular: string; bold: string };
  bodySize: number;
  bulletIndent: number;
  accent: string;
  bodyColor: string;
  bodyAlign: "left" | "center" | "justify";
  bodyLineGap: number;
  gapAfter?: number;
};

/**
 * Renders a bullet line and returns Y for the next item.
 * Measures wrapped height before drawing so multi-line bullets do not overlap.
 */
export function writeBulletItem(pdf: Pdf, params: BulletItemParams): number {
  const trimmed = params.text.trim();
  if (!trimmed) return params.startY;

  const indent = params.bulletIndent;
  const xBullet = params.x + 2;
  const xText = params.x + indent;
  const textWidth = params.width - indent;
  const gapAfter = params.gapAfter ?? Math.max(2, params.bodySize * 0.2);

  pdf.font(params.fonts.regular).fontSize(params.bodySize);
  const textHeight = pdf.heightOfString(trimmed, {
    width: textWidth,
    align: params.bodyAlign,
    lineGap: params.bodyLineGap,
  });

  pdf.font(params.fonts.bold).fontSize(params.bodySize).fillColor(params.accent);
  pdf.text("•", xBullet, params.startY, { width: indent, lineGap: 2 });

  pdf.font(params.fonts.regular).fontSize(params.bodySize).fillColor(params.bodyColor);
  pdf.text(trimmed, xText, params.startY, {
    width: textWidth,
    align: params.bodyAlign,
    lineGap: params.bodyLineGap,
  });

  return params.startY + textHeight + gapAfter;
}

export type BodyTextParams = {
  x: number;
  width: number;
  startY: number;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  align?: "left" | "center" | "right" | "justify";
  lineGap?: number;
  gapAfter?: number;
};

/** Renders body copy at a fixed Y and returns the next Y (with lineGap support). */
export function writeBodyText(pdf: Pdf, params: BodyTextParams): number {
  const trimmed = params.text.trim();
  if (!trimmed) return params.startY;

  const lineGap = params.lineGap ?? 0;
  const gapAfter = params.gapAfter ?? 0;

  pdf.font(params.font).fontSize(params.fontSize).fillColor(params.color);
  const height = pdf.heightOfString(trimmed, {
    width: params.width,
    align: params.align ?? "left",
    lineGap,
  });

  pdf.text(trimmed, params.x, params.startY, {
    width: params.width,
    align: params.align ?? "left",
    lineGap,
  });

  return params.startY + height + gapAfter;
}
