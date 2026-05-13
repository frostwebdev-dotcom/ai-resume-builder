import { describe, expect, it } from "vitest";

import { getPdfLayout } from "./layouts";

describe("getPdfLayout font mapping", () => {
  it("uses Helvetica for launch sans-serif themes", () => {
    const layout = getPdfLayout("professional-ats");
    expect(layout.fonts.regular).toBe("Helvetica");
    expect(layout.fonts.bold).toBe("Helvetica-Bold");
    expect(layout.fonts.italic).toBe("Helvetica-Oblique");
  });

  it("propagates header + section style from each launch theme", () => {
    const ats = getPdfLayout("professional-ats");
    expect(ats.headerStyle).toBe("compact");
    expect(ats.sectionTitleStyle).toBe("underline");
    expect(ats.layoutFamily).toBe("classic");
    expect(ats.showAvatar).toBe(false);

    const modern = getPdfLayout("modern-professional");
    expect(modern.headerStyle).toBe("split");
    expect(modern.sectionTitleStyle).toBe("accent-rule");

    const tech = getPdfLayout("technical-clean");
    expect(tech.headerStyle).toBe("compact");
    expect(tech.sectionTitleStyle).toBe("rule");
  });
});
