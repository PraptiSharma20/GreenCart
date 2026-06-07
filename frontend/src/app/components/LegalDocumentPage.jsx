import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useLang } from "../context/language";
import { Loader2, Sparkles, ArrowRight, Users, Store, ShoppingBag } from "lucide-react";

const TRUST_ICONS = [Users, Store, ShoppingBag];

export function formatLegalDate(iso, lang) {
  if (!iso) return "";
  const locale = lang === "hi" ? "hi-IN" : lang === "pa" ? "pa-IN" : "en-IN";
  return new Date(iso).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function LegalDocumentPage({
  prefix,
  heroImage,
  HeroIcon,
  heroAriaLabel,
  sectionCount,
  sectionImages,
  sectionIcons,
  fetchMeta,
  crossLink,
  banner,
  ctaTo = "/contact",
}) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMeta();
        if (!cancelled) setMeta(data);
      } catch {
        if (!cancelled) setMeta(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMeta]);

  const sections = useMemo(
    () =>
      Array.from({ length: sectionCount }, (_, index) => {
        const n = index + 1;
        return {
          step: n,
          id: `section-${n}`,
          title: t(`${prefix}_section${n}_title`),
          desc: t(`${prefix}_section${n}_desc`),
          image: sectionImages[index],
          icon: sectionIcons[index],
        };
      }),
    [sectionCount, prefix, sectionImages, sectionIcons, t]
  );

  const lastUpdatedText = meta?.lastUpdated
    ? `${t(`${prefix}_last_updated_label`)}: ${formatLegalDate(meta.lastUpdated, lang)}`
    : t(`${prefix}_last_updated_label`);

  const trustStats = [
    { icon: TRUST_ICONS[0], value: meta?.customersCount, label: t(`${prefix}_trust_customers`) },
    { icon: TRUST_ICONS[1], value: meta?.vendorsCount, label: t(`${prefix}_trust_vendors`) },
    { icon: TRUST_ICONS[2], value: meta?.ordersCount, label: t(`${prefix}_trust_orders`) },
  ];

  const scrollToSection = (id) => {
    setActiveSection(Number(id.replace("section-", "")));
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <section className="relative min-h-[360px] md:min-h-[420px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${heroImage})` }}
          role="img"
          aria-label={heroAriaLabel}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/85 to-emerald-950/30" />
        <div className="container relative z-10 mx-auto px-4 pb-14 pt-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-green-500/20 border border-green-400/30 rounded-2xl mb-6 backdrop-blur-sm">
              <HeroIcon className="h-9 w-9 text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t(`${prefix}_title`)}
            </h1>
            <p className="text-lg text-green-50/90 mb-4">{t(`${prefix}_hero_sub`)}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-green-300" />
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-green-100 backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {lastUpdatedText}
                  </span>
                  {meta?.version && (
                    <span className="rounded-full bg-white/10 px-4 py-1.5 text-green-100/80 backdrop-blur-sm">
                      {t(`${prefix}_version`)} {meta.version}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl -mt-6 relative z-20 pb-20">
        <Card className="p-8 md:p-10 border-none shadow-xl mb-10 bg-white dark:bg-gray-800">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed border-l-4 border-green-500 pl-6">
            {t(`${prefix}_intro`)}
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {trustStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card
                key={i}
                className="p-5 border-none bg-white dark:bg-gray-800 text-center shadow-md hover:shadow-lg transition-shadow"
              >
                <Icon className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
                ) : (
                  <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                    {stat.value ?? "—"}
                  </p>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          <nav className="hidden lg:block sticky top-24 self-start mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              {t(`${prefix}_toc_title`)}
            </p>
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.step
                        ? "bg-green-600 text-white font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {section.step}. {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-8 min-w-0">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const imageRight = index % 2 === 1;

              return (
                <Card
                  key={section.id}
                  id={section.id}
                  className="overflow-hidden border-none shadow-lg bg-white dark:bg-gray-800 scroll-mt-28"
                >
                  <div
                    className={`grid md:grid-cols-2 gap-0 ${imageRight ? "md:[&>div:first-child]:order-2" : ""}`}
                  >
                    <div className="relative h-52 md:h-auto min-h-[200px]">
                      <img
                        src={section.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-gray-900/65 to-transparent" />
                      <span className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white font-bold shadow-lg">
                        {section.step}
                      </span>
                    </div>
                    <div className="p-7 md:p-9 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          {section.title}
                        </h2>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                        {section.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {crossLink && (
          <Card className="mt-14 p-8 border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                  {t(crossLink.titleKey)}
                </h3>
                <p className="text-blue-800/80 dark:text-blue-200/80 text-sm">
                  {t(crossLink.descKey)}
                </p>
              </div>
              <Link
                to={crossLink.to}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shrink-0"
              >
                {t(crossLink.linkKey)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        )}

        {banner && (
          <div className="mt-10 relative rounded-3xl overflow-hidden min-h-[220px] shadow-2xl">
            <img
              src={banner.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-950/95 via-green-900/75 to-transparent" />
            <div className="relative z-10 flex items-center px-8 md:px-14 py-10 max-w-2xl">
              {banner.Icon && (
                <banner.Icon className="h-11 w-11 text-green-300 shrink-0 mr-5 hidden sm:block" />
              )}
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {t(banner.titleKey)}
                </h3>
                <p className="text-green-100/90 leading-relaxed text-sm md:text-base">
                  {t(banner.descKey)}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mt-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t(`${prefix}_cta_title`)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            {t(`${prefix}_cta_sub`)}
          </p>
          <Button
            size="lg"
            className="rounded-full px-10 gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => navigate(ctaTo)}
          >
            {t(`${prefix}_cta_button`)}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </section>
      </div>
    </div>
  );
}
