import React from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "ru", name: "Русский" },
  { code: "fr", name: "Français" },
  { code: "ko", name: "한국어" }
];

export default function LanguageSelector(){
  const { i18n } = useTranslation();

  const change = (ev) => {
    const lang = ev.target.value;
    i18n.changeLanguage(lang);
    sessionStorage.setItem("preferred_lang", lang);
  };

  const current = i18n.language || "en";

  return (
    <select className="lang-select" value={current} onChange={change} aria-label="Select language">
      {LANGS.map(l=> <option key={l.code} value={l.code}>{l.name}</option>)}
    </select>
  );
}
