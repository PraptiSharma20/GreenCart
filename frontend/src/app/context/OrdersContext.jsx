import React, { useEffect, useMemo, useState, useCallback } from "react";
import { OrdersContext } from "./orders";
import { api } from "../../lib/api";
import { useAuth } from "./auth";

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const data = await api.orders.getUserOrders();
          setOrders(data);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        }
      };
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const addOrder = useCallback(async (orderData) => {
    try {
      const newOrder = await api.orders.create(orderData);
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (error) {
      console.error("Failed to add order:", error);
      throw error;
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.orders.getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, [user]);

  const removeOrder = useCallback((orderId) => {
    const id = String(orderId);
    setOrders((prev) => prev.filter((o) => String(o._id || o.id) !== id));
  }, []);

  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const updatedOrder = await api.orders.updateStatus(id, status);
      setOrders((prev) => prev.map(o => (o._id || o.id) === id ? updatedOrder : o));
      return updatedOrder;
    } catch (error) {
      console.error("Failed to update order status:", error);
      throw error;
    }
  }, []);

  const acceptOrder = useCallback(async (id) => {
    try {
      const updatedOrder = await api.orders.updateStatus(id, 'accepted');
      setOrders((prev) => prev.map(o => (o._id || o.id) === id ? updatedOrder : o));
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  }, []);

  const cancelOrder = useCallback(async (id, payload) => {
    const updatedOrder = await api.orders.cancel(id, payload);
    setOrders((prev) => prev.map(o => (o._id || o.id) === id ? updatedOrder : o));
    return updatedOrder;
  }, []);

  const returnOrder = useCallback(async (id, payload) => {
    const updatedOrder = await api.orders.return(id, payload);
    setOrders((prev) => prev.map(o => (o._id || o.id) === id ? updatedOrder : o));
    return updatedOrder;
  }, []);

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrderStatus,
      acceptOrder,
      refreshOrders,
      removeOrder,
      cancelOrder,
      returnOrder,
    }),
    [orders, addOrder, updateOrderStatus, acceptOrder, refreshOrders, removeOrder, cancelOrder, returnOrder]
  );
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

// Only export provider component here to satisfy react-refresh rules
