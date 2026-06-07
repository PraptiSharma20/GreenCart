import React, { useCallback, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";
import { extendedTranslations, translateOrderStatus, translateRole } from "../i18n/extendedTranslations";
import {
  localizeCategoryLabel,
  localizeProduct,
  localizeProductName,
  localizeVendorName,
} from "../i18n/catalogI18n";
import { LanguageContext } from "./language";

function mergeDict(lang) {
  return {
    ...(translations[lang] || translations.en),
    ...(extendedTranslations[lang] || extendedTranslations.en),
  };
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("gc_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("gc_lang", lang);
    document.documentElement.lang = lang === "hi" ? "hi" : lang === "pa" ? "pa" : "en";
  }, [lang]);

  const dictionaries = useMemo(
    () => ({
      en: mergeDict("en"),
      hi: mergeDict("hi"),
      pa: mergeDict("pa"),
    }),
    []
  );

  const t = useCallback(
    (key) => {
      const dict = dictionaries[lang] || dictionaries.en;
      return dict[key] ?? dictionaries.en[key] ?? key;
    },
    [lang, dictionaries]
  );

  const tStatus = useCallback((status) => translateOrderStatus(status, t), [t]);
  const tRole = useCallback((role) => translateRole(role, t), [t]);

  const tCategory = useCallback(
    (category) => localizeCategoryLabel(category, lang),
    [lang]
  );

  const tProductName = useCallback(
    (name) => localizeProductName(name, lang),
    [lang]
  );

  const tVendorName = useCallback(
    (name) => localizeVendorName(name, lang),
    [lang]
  );

  const localize = useCallback(
    (product) => localizeProduct(product, lang),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, tStatus, tRole, tCategory, tProductName, tVendorName, localize }),
    [lang, t, tStatus, tRole, tCategory, tProductName, tVendorName, localize]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
