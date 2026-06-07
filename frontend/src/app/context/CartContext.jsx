import React, { useCallback, useMemo, useState, useEffect } from "react";
import { CartContext } from "./cart";
import { api } from "../../lib/api";
import { useAuth } from "./auth";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  // Fetch cart on mount or user change
  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const data = await api.cart.get();
          // Assuming backend returns cart with items populated or just items array
          setItems(data.items || []);
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        }
      };
      fetchCart();
    } else {
      setItems([]); // Clear cart on logout
    }
  }, [user]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (user) {
      try {
        const data = await api.cart.addItem(product.id || product._id, quantity);
        setItems(data.items);
      } catch (error) {
        console.error("Failed to add to cart:", error);
      }
    } else {
      // Fallback to local state if not logged in (optional, but requested for full integration)
      setItems((prev) => {
        const existing = prev.find((i) => (i.id || i._id) === (product.id || product._id));
        if (existing) {
          return prev.map((i) =>
            (i.id || i._id) === (product.id || product._id)
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...product, quantity }];
      });
    }
  }, [user]);

  const updateQuantity = useCallback(async (id, qty) => {
    const safeQty = Math.max(1, qty);
    if (user) {
      try {
        const data = await api.cart.updateItem(id, safeQty);
        setItems(data.items);
      } catch (error) {
        console.error("Failed to update cart:", error);
      }
    } else {
      setItems((prev) =>
        prev
          .map((i) =>
            (i.id || i._id) === id ? { ...i, quantity: safeQty } : i
          )
          .filter((i) => i.quantity > 0)
      );
    }
  }, [user]);

  const removeFromCart = useCallback(async (id) => {
    if (user) {
      try {
        const data = await api.cart.removeItem(id);
        setItems(data.items);
      } catch (error) {
        console.error("Failed to remove from cart:", error);
      }
    } else {
      setItems((prev) => prev.filter((i) => (i.id || i._id) !== id));
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    if (user) {
      try {
        await api.cart.clear();
      } catch (error) {
        console.error("Failed to clear cart:", error);
      }
    }
    setItems([]);
  }, [user]);

  const getTotal = useCallback(
    () => items.reduce((sum, i) => {
      const price = i.product?.price || i.price || 0;
      return sum + price * i.quantity;
    }, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, getTotal }),
    [items, addToCart, updateQuantity, removeFromCart, clearCart, getTotal]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

// Only export the provider component to satisfy react-refresh lint rules
