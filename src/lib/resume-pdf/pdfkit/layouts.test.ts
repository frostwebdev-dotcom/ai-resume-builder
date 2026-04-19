import { describe, expect, it } from "vitest";

import { getPdfLayout } from "./layouts";

describe("getPdfLayout font mapping", () => {
  it("uses Helvetica for sans-serif themes", () => {
    const layout = getPdfLayout("athena");
    expect(layout.fonts.regular).toBe("Helvetica");
    expect(layout.fonts.bold).toBe("Helvetica-Bold");
    expect(layout.fonts.italic).toBe("Helvetica-Oblique");
  });

  it("uses Times-Roman for serif themes", () => {
    const layoutH = getPdfLayout("helios");
    expect(layoutH.fonts.regular).toBe("Times-Roman");
    expect(layoutH.fonts.bold).toBe("Times-Bold");
    expect(layoutH.fonts.italic).toBe("Times-Italic");

    const layoutC = getPdfLayout("clio");
    expect(layoutC.fonts.regular).toBe("Times-Roman");
  });

  it("propagates header + section style from theme", () => {
    const onyx = getPdfLayout("onyx");
    expect(onyx.headerStyle).toBe("banner");
    expect(onyx.sectionTitleStyle).toBe("accent-rule");
  });
});
