import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth";
import { api } from "../../lib/api";

const normalizeWishlist = (items = []) => {
  if (!Array.isArray(items)) return [];
  return Array.from(
    new Set(
      items
        .filter(Boolean)
        .map(item => {
          if (typeof item === "string") return item;
          if (typeof item === "object") return item._id || item.id;
          return undefined;
        })
        .filter(Boolean)
    )
  );
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("gc_token");
    const raw = localStorage.getItem("gc_user");
    if (!raw || !token) return null;

    try {
      const parsedUser = JSON.parse(raw);
      parsedUser.wishlist = normalizeWishlist(parsedUser.wishlist || []);
      return parsedUser;
    } catch (e) {
      console.error("AuthContext.jsx - Failed to parse user from localStorage:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user");
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("gc_token");
    if (!token) {
      logout();
      return;
    }

    try {
      const data = await api.auth.getProfile();
      const normalizedUser = {
        ...data,
        wishlist: normalizeWishlist(data.wishlist || [])
      };
      setUser(normalizedUser);
    } catch (error) {
      console.error("Fetch profile error:", error);
      const msg = String(error?.message || "").toLowerCase();
      if (msg.includes("token invalid") || msg.includes("not authorized") || msg.includes("unauthorized")) {
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("gc_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("gc_user");
      localStorage.removeItem("gc_token");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user?._id, fetchProfile]);

  useEffect(() => {
    const onAuthExpired = () => logout();
    window.addEventListener("gc:auth-expired", onAuthExpired);
    return () => window.removeEventListener("gc:auth-expired", onAuthExpired);
  }, [logout]);

  const register = useCallback(async (name, email, password, role) => {
    setLoading(true);
    try {
      const data = await api.auth.register({ name, email, password, role });
      const normalizedUser = {
        ...data.user,
        wishlist: normalizeWishlist(data.user.wishlist || [])
      };
      setUser(normalizedUser);
      localStorage.setItem("gc_token", data.token);
      return normalizedUser;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      const normalizedUser = {
        ...data.user,
        wishlist: normalizeWishlist(data.user.wishlist || [])
      };
      setUser(normalizedUser);
      localStorage.setItem("gc_token", data.token);
      return normalizedUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleWishlist = useCallback(async (productId) => {
    try {
      const data = await api.auth.toggleWishlist(productId);
      const wishlistIds = normalizeWishlist(data.wishlist);
      setUser(prev => prev ? { ...prev, wishlist: wishlistIds } : null);
      return wishlistIds;
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      throw error;
    }
  }, []);

  const syncWishlist = useCallback((products = []) => {
    const wishlistIds = normalizeWishlist(
      products.map((product) => (product?._id || product?.id))
    );
    setUser(prev => prev ? { ...prev, wishlist: wishlistIds } : null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const data = await api.auth.updateProfile(profileData);
      setUser(prev => prev ? { ...prev, ...data } : null);
      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }, []);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout, register, loading, toggleWishlist, syncWishlist, updateProfile, fetchProfile }),
    [user, isAuthenticated, login, logout, register, loading, toggleWishlist, syncWishlist, updateProfile, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
