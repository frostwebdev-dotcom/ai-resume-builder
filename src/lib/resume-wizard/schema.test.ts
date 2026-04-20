import { describe, expect, it } from "vitest";

import { personalDetailsSchema } from "@/lib/resume-wizard/schema";

const base = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "",
  location: "",
  linkedIn: "",
  website: "",
};

function validate(patch: Partial<typeof base>) {
  return personalDetailsSchema.safeParse({ ...base, ...patch });
}

describe("personalDetailsSchema — URL forgiveness", () => {
  describe("LinkedIn", () => {
    it("accepts empty input", () => {
      expect(validate({ linkedIn: "" }).success).toBe(true);
    });

    it("accepts full canonical URL", () => {
      expect(
        validate({ linkedIn: "https://www.linkedin.com/in/ada" }).success,
      ).toBe(true);
    });

    it("accepts URL without scheme", () => {
      expect(validate({ linkedIn: "www.linkedin.com/in/ada" }).success).toBe(true);
      expect(validate({ linkedIn: "linkedin.com/in/ada" }).success).toBe(true);
    });

    it("accepts regional LinkedIn subdomains", () => {
      expect(
        validate({ linkedIn: "https://uk.linkedin.com/in/ada" }).success,
      ).toBe(true);
      expect(validate({ linkedIn: "de.linkedin.com/in/ada" }).success).toBe(true);
    });

    it("rejects non-LinkedIn domains", () => {
      expect(validate({ linkedIn: "https://example.com/in/ada" }).success).toBe(
        false,
      );
    });

    it("rejects domain without a profile path", () => {
      expect(validate({ linkedIn: "linkedin.com" }).success).toBe(false);
    });

    it("rejects lookalike strings", () => {
      expect(validate({ linkedIn: "notaurl" }).success).toBe(false);
    });
  });

  describe("Website", () => {
    it("accepts empty input", () => {
      expect(validate({ website: "" }).success).toBe(true);
    });

    it("accepts bare domain without scheme", () => {
      expect(validate({ website: "example.com" }).success).toBe(true);
      expect(validate({ website: "www.example.com" }).success).toBe(true);
    });

    it("accepts full URLs", () => {
      expect(validate({ website: "https://example.com/path" }).success).toBe(true);
      expect(validate({ website: "http://example.com" }).success).toBe(true);
    });

    it("rejects inputs without a TLD", () => {
      expect(validate({ website: "notaurl" }).success).toBe(false);
      expect(validate({ website: "localhost" }).success).toBe(false);
    });

    it("rejects non-http schemes", () => {
      expect(validate({ website: "javascript:alert(1)" }).success).toBe(false);
      expect(validate({ website: "ftp://example.com" }).success).toBe(false);
    });
  });
});
