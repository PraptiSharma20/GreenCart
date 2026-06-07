import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, User, Globe, Package, LayoutDashboard, LogOut, Moon, Sun, Heart, Loader2 } from "lucide-react";
import { useLang } from "../context/language";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/auth";
import { languages } from "../i18n/languages";
import { useCart } from "../context/cart";
import { api } from "../../lib/api";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { toast } from "sonner";

export function Header() {
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [query, setQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [langQuery, setLangQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we are on the cart page or orders page
  const isCartPage = location.pathname === '/cart';
  const isOrdersPage = location.pathname === '/orders';

  const wishlistCount = (() => {
    const wishlist = user?.wishlist;
    if (!Array.isArray(wishlist)) return 0;
    const validIds = Array.from(
      new Set(
        wishlist
          .filter(Boolean)
          .map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object') return item._id || item.id;
            return undefined;
          })
          .filter(Boolean)
      )
    );
    return validIds.length;
  })();

  const handleLogout = async () => {
    setLoggingOut(true);
    // Add a small artificial delay for better UX "feeling" of logging out
    await new Promise(resolve => setTimeout(resolve, 800));
    logout();
    setLoggingOut(false);
    toast.success(t("logout_success") || "Successfully logged out. See you soon!");
    navigate("/login");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.getAll();
        setAllProducts(data);
      } catch (error) {
        console.error("Failed to fetch products for search:", error);
      }
    };
    fetchProducts();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return allProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);
  }, [query, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/");
    const el = document.getElementById("products-grid");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const currentLanguage = languages.find(l => l.code === lang)?.name || lang.toUpperCase();

  return (
    <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300 sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold shadow-sm">
            GC
          </div>
          <span className="hidden sm:inline text-2xl font-bold text-green-700 dark:text-green-500">{t("app_name")}</span>
        </Link>
        {user?.role !== "vendor" && !isCartPage && !isOrdersPage && (
          <form onSubmit={handleSearch} className="relative flex-1 px-0 sm:px-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 transition-colors">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full bg-transparent outline-none dark:text-white dark:placeholder-gray-400"
              />
            </div>
            {results.length > 0 && (
              <div className="absolute left-4 right-4 top-12 z-50 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg transition-colors">
                {results.map((r) => (
                  <button
                    key={r._id || r.id}
                    type="button"
                    onClick={() => {
                      navigate(`/product/${r._id || r.id}`);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <span>{r.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">₹{r.price}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        )}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-full border border-gray-200 dark:border-gray-600 transition-colors duration-300">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`p-1.5 rounded-full transition-all duration-300 ${
                theme === 'light' 
                  ? 'bg-white text-amber-500 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Light Mode"
            >
              <Sun size={18} />
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`p-1.5 rounded-full transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-600 text-blue-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Dark Mode"
            >
              <Moon size={18} />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm min-w-[100px] dark:text-gray-200 transition-colors"
            >
              <Globe className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span>{currentLanguage}</span>
            </button>
            {langOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 p-2 shadow-xl transition-colors">
              <div className="max-h-60 overflow-auto">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      lang === l.code ? "bg-gray-100 dark:bg-gray-600 text-green-700 dark:text-green-400 font-semibold" : "dark:text-gray-300"
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{l.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>

          <Link to="/orders" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <Package className="h-5 w-5" />
            <span className="hidden lg:inline">{t("orders")}</span>
          </Link>
          {user?.role !== "vendor" && user?.role !== "admin" && (
            <Link to="/wishlist" className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}
          {user?.role === "vendor" ? (
            <Link to="/vendor/dashboard" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden lg:inline">{t("dashboard")}</span>
            </Link>
          ) : user?.role === "admin" ? (
            <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden lg:inline">{t("dashboard")}</span>
            </Link>
          ) : (
            <Link to="/cart" className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-500 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">{t("cart")}</span>
              {items.length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs font-semibold text-white">
                  {items.length}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">{t("logout")}</span>
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm">
              <User className="h-5 w-5" />
              <span className="font-medium">{t("sign_in")}</span>
            </Link>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={`${t("logout_confirm_title") || "Log Out?"}`}
        message={`${t("logout_confirm_msg_prefix") || "Are you sure you want to log out,"} ${user?.name}? ${t("logout_confirm_msg_suffix") || "We'll miss you!"}`}
        icon="✨"
        confirmText={loggingOut ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("logging_out") || "Logging out..."}
          </span>
        ) : (t("logout") || "Log Out")}
        cancelText={t("cancel")}
        variant="danger"
      />
    </header>
  );
}
