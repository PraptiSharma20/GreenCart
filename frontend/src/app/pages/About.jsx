import React, { useEffect, useState, useMemo } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/language";
import { useAuth } from "../context/auth";
import {
  Leaf,
  ShieldCheck,
  Heart,
  Store,
  Users,
  Sprout,
  Truck,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1464226184884-fa7b0d85d931?q=80&w=1920&auto=format&fit=crop";

function formatCount(value) {
  if (value >= 10000) return `${Math.floor(value / 1000)}k+`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  return `${value}`;
}

function useCountUp(target, enabled, duration = 1000) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    let frame;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, duration]);

  return display;
}

function StatCard({ icon: Icon, value, label, suffix = "", loading, accent }) {
  const accents = {
    green: "from-green-500/20 to-emerald-600/10 text-green-600 dark:text-green-400",
    blue: "from-blue-500/20 to-cyan-600/10 text-blue-600 dark:text-blue-400",
    purple: "from-purple-500/20 to-violet-600/10 text-purple-600 dark:text-purple-400",
    amber: "from-amber-500/20 to-orange-600/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card className="relative overflow-hidden border-none bg-white dark:bg-gray-800 p-6 md:p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
      <div className="relative z-10">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[accent]}`}
        >
          <Icon className="h-7 w-7" />
        </div>
        {loading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
        ) : (
          <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tabular-nums">
            {value}
            {suffix}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
      </div>
    </Card>
  );
}

export function About() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const showShopCta = !isVendor && !isAdmin;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.about.getStats();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const farms = useCountUp(stats?.vendorsCount ?? 0, !loading);
  const customers = useCountUp(stats?.customersCount ?? 0, !loading);
  const organic = useCountUp(stats?.organicPercent ?? 0, !loading);
  const delivered = useCountUp(stats?.deliveredOrders ?? 0, !loading);

  const statCards = useMemo(
    () => [
      {
        icon: Store,
        value: formatCount(farms),
        label: t("about_stats_farms"),
        accent: "green",
      },
      {
        icon: Users,
        value: formatCount(customers),
        label: t("about_stats_customers"),
        accent: "blue",
      },
      {
        icon: Sprout,
        value: `${organic}%`,
        label: t("about_stats_organic"),
        accent: "purple",
      },
      {
        icon: Truck,
        value: delivered > 0 ? formatCount(delivered) : `${stats?.freshAvailabilityPercent ?? 0}%`,
        label:
          delivered > 0 ? t("about_stats_delivery") : t("about_stats_products"),
        accent: "amber",
      },
    ],
    [farms, customers, organic, delivered, stats, t]
  );

  const goToShop = () => {
    navigate("/");
    setTimeout(
      () => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const values = [
    {
      icon: Leaf,
      title: t("about_values_sustainable"),
      desc: t("about_values_sustainable_desc"),
      color: "green",
    },
    {
      icon: ShieldCheck,
      title: t("about_values_quality"),
      desc: t("about_values_quality_desc"),
      color: "blue",
    },
    {
      icon: Heart,
      title: t("about_values_community"),
      desc: t("about_values_community_desc"),
      color: "red",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[520px] md:min-h-[580px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          role="img"
          aria-label="Fresh farm landscape"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-green-950/75 to-green-900/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,197,94,0.25),_transparent_50%)]" />

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 border border-green-400/30 px-4 py-1.5 text-sm font-medium text-green-100 mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-green-300" />
              {t("about_stats_live")}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
              {t("about_hero_title")}
            </h1>
            <p className="text-lg md:text-xl text-green-50/90 mb-10 leading-relaxed max-w-xl">
              {isVendor ? t("about_hero_sub_vendor") : t("about_hero_sub")}
            </p>
            {showShopCta && (
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-400 text-white px-10 py-6 text-lg rounded-full shadow-lg shadow-green-900/40 transition-all hover:scale-105 hover:shadow-xl gap-2"
                onClick={goToShop}
              >
                {t("shop_now")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
            {isVendor && (
              <Button
                size="lg"
                variant="outline"
                className="border-green-300/60 bg-white/10 text-white hover:bg-white/20 px-10 py-6 text-lg rounded-full gap-2 backdrop-blur-sm"
                onClick={() => navigate("/vendor/dashboard")}
              >
                {t("dashboard")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-900 transition-colors -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <StatCard key={i} {...stat} loading={loading} />
            ))}
          </div>
          {!loading && stats && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
              {stats.productsCount} {t("about_stats_products").toLowerCase()}
              {stats.averageRating > 0 && ` · ${stats.averageRating}★ avg rating`}
            </p>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {t("about_values_title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">
              &ldquo;The secret of health for both mind and body is not to mourn for the past,
              but to live the present moment wisely and earnestly.&rdquo;
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((item, index) => (
              <Card
                key={index}
                className="p-8 border-none bg-white dark:bg-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                    item.color === "green"
                      ? "bg-green-100 dark:bg-green-900/40"
                      : item.color === "blue"
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : "bg-red-100 dark:bg-red-900/40"
                  }`}
                >
                  <item.icon
                    className={`h-8 w-8 ${
                      item.color === "green"
                        ? "text-green-600 dark:text-green-400"
                        : item.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
                alt={t("about_founder_name")}
                className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-green-300 text-sm font-semibold uppercase tracking-wider">
                  {t("about_founder_role")}
                </p>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                {t("about_founder_title")}
              </h2>
              <h3 className="text-2xl font-black text-green-600 dark:text-green-400 mb-6">
                {t("about_founder_name")}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-green-500 pl-6">
                {t("about_founder_quote")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — contact only (no duplicate shop button) */}
      <section className="py-20 bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 dark:from-green-900 dark:via-green-800 dark:to-emerald-950">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("about_cta_title")}
          </h2>
          <p className="text-green-100/90 text-lg mb-8">{t("about_cta_sub")}</p>
          <Button
            size="lg"
            className="bg-white text-green-700 hover:bg-green-50 dark:bg-gray-100 dark:text-green-800 border-none px-10 py-6 text-lg font-bold rounded-full shadow-xl gap-2"
            onClick={() => navigate("/contact")}
          >
            {t("about_cta_button")}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
