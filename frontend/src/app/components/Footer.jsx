import React from "react";
import { useLang } from "../context/language";
import { Facebook, Instagram, Twitter, Github } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Footer() {
  const { t } = useLang();
  const navigate = useNavigate();
  const gotoCategory = (category) => {
    navigate(`/?category=${encodeURIComponent(category)}`);
    setTimeout(() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  return (
    <footer className="border-t bg-gradient-to-br from-green-800 via-green-700 to-emerald-900 text-white relative overflow-hidden max-w-[100vw]">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute top-0 left-0 h-48 w-48 -translate-x-1/4 -translate-y-1/4 rounded-full bg-green-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-500/10 blur-3xl" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h4 className="mb-4 text-2xl font-extrabold tracking-tight">{t("app_name")}</h4>
            <p className="text-sm opacity-90 leading-relaxed">
              {t("footer_tagline")}
            </p>
          </div>
          <div>
            <h5 className="mb-4 font-bold text-lg border-b border-white/20 pb-2 inline-block">{t("footer_shop")}</h5>
            <ul className="space-y-3 text-sm opacity-95">
              <li><button onClick={() => gotoCategory('All Products')} className="hover:text-green-200 transition-colors">{t("category_all")}</button></li>
              <li><Link to="/offers" className="hover:text-green-200 transition-colors">{t("offers_coupons")}</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 font-bold text-lg border-b border-white/20 pb-2 inline-block">{t("footer_company")}</h5>
            <ul className="space-y-3 text-sm opacity-95">
              <li><Link to="/about" className="hover:text-green-200 transition-colors">{t("about")}</Link></li>
              <li><Link to="/contact" className="hover:text-green-200 transition-colors">{t("contact")}</Link></li>
              <li><Link to="/privacy" className="hover:text-green-200 transition-colors">{t("privacy")}</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 font-bold text-lg border-b border-white/20 pb-2 inline-block">{t("footer_follow")}</h5>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook" 
                className="rounded-full bg-white/10 p-3 hover:bg-green-600 transition-all duration-300 hover:scale-110"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram" 
                className="rounded-full bg-white/10 p-3 hover:bg-green-600 transition-all duration-300 hover:scale-110"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter" 
                className="rounded-full bg-white/10 p-3 hover:bg-green-600 transition-all duration-300 hover:scale-110"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Github" 
                className="rounded-full bg-white/10 p-3 hover:bg-green-600 transition-all duration-300 hover:scale-110"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
            <p className="text-center text-sm opacity-80 md:text-left">
              © {new Date().getFullYear()} {t("app_name")}. {t("rights_reserved")}
            </p>

            <div className="flex flex-col items-center justify-center gap-1.5 text-center font-footer">
              <span className="footer-credit-powered text-xs font-semibold uppercase tracking-[0.2em] text-white/85 md:text-sm">
                {t("footer_powered_by")}
              </span>
              <span className="footer-credit-float" aria-label="Prapti Sharma">
                <span className="footer-credit-name text-lg md:text-xl">
                  Prapti Sharma
                </span>
              </span>
            </div>

            <div className="flex justify-center gap-6 text-xs opacity-70 md:justify-end">
              <Link to="/privacy" className="hover:text-green-200 transition-colors">{t("privacy_link")}</Link>
              <Link to="/terms" className="hover:text-green-200 transition-colors">{t("terms_link")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
