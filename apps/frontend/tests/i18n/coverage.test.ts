import en from "../../src/i18n/locales/en/common.json";
import de from "../../src/i18n/locales/de/common.json";
import { describe, expect, it } from "vitest";

type TranslationRecord = Record<string, unknown>;

const flattenKeys = (input: TranslationRecord, prefix = ""): string[] => {
  return Object.entries(input).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as TranslationRecord, path);
    }
    return path;
  });
};

describe("i18n coverage", () => {
  it("keeps German translations aligned with English", () => {
    const enKeys = new Set(flattenKeys(en as TranslationRecord));
    const deKeys = new Set(flattenKeys(de as TranslationRecord));
    expect(deKeys).toEqual(enKeys);
  });
});
