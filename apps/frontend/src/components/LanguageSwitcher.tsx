import React from "react";
import { useTranslation } from "react-i18next";

type LanguageOption = {
  code: "en" | "de";
  labelKey: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: "en", labelKey: "language.english" },
  { code: "de", labelKey: "language.german" },
];

const selectStyle: React.CSSProperties = {
  appearance: "none",
  background: "var(--color-surface-glass)",
  border: "1px solid var(--color-border)",
  borderRadius: "999px",
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-sm)",
  padding: "0.35rem 1.75rem 0.35rem 0.85rem",
  cursor: "pointer",
};

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
};

const caretStyle: React.CSSProperties = {
  position: "absolute",
  right: "0.6rem",
  pointerEvents: "none",
  fontSize: "0.75rem",
  color: "var(--color-text-muted)",
};

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const activeLanguage = (i18n.language?.slice(0, 2) || "en") as "en" | "de";

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value);
  };

  return (
    <label style={wrapperStyle} aria-label={t("language.label")}>
      <select value={activeLanguage} onChange={handleChange} style={selectStyle}>
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
      <span aria-hidden="true" style={caretStyle}>
        ?
      </span>
    </label>
  );
};

export default LanguageSwitcher;
