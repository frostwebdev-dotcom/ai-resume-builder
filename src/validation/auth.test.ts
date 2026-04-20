import { describe, expect, it } from "vitest";

import { loginSchema, magicLinkSchema, signupSchema } from "@/validation/auth";

describe("magicLinkSchema", () => {
  it("accepts a valid email", () => {
    const result = magicLinkSchema.safeParse({ email: "ada@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("normalizes email casing and whitespace", () => {
    const result = magicLinkSchema.safeParse({ email: "  Ada@Example.COM  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects empty email", () => {
    const result = magicLinkSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = magicLinkSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email property", () => {
    const result = magicLinkSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("is independent of the password-based schemas", () => {
    // magicLinkSchema must not require a password field — the whole point of passwordless.
    const result = magicLinkSchema.safeParse({ email: "ada@example.com" });
    expect(result.success).toBe(true);

    // Sanity: loginSchema/signupSchema still require password.
    expect(loginSchema.safeParse({ email: "ada@example.com" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "ada@example.com" }).success).toBe(false);
  });
});
