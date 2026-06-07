import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Query from "../models/Query.js";
import { logAdminAction } from "../utils/adminLog.js";

const revenueEligibleQuery = {
  status: { $nin: ["Cancelled"] },
  paymentStatus: { $ne: "Failed" },
};

// @desc    Get all admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    
    const users = await User.find({});
    const customers = users.filter(u => u.role === 'customer').length;
    const vendors = users.filter(u => u.role === 'vendor').length;
    const admins = users.filter(u => u.role === 'admin').length;
    
    const revenueOrders = await Order.find(revenueEligibleQuery);
    const totalRevenue = revenueOrders.reduce(
      (acc, order) => acc + (order.totalPrice || 0),
      0
    );

    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const pendingQueries = await Query.countDocuments({ status: "pending" });

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const last7DaysOrders = await Order.find({
      ...revenueEligibleQuery,
      createdAt: { $gte: sevenDaysAgo },
    });
    
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyStats[dateKey] = { 
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: 0, 
        revenue: 0 
      };
    }
    
    last7DaysOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].orders += 1;
        dailyStats[dateKey].revenue += order.totalPrice;
      }
    });
    
    const platformGrowth = Object.values(dailyStats).map((d) => ({
      ...d,
      revenue: Math.round(d.revenue),
    }));

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email")
      .select("status totalPrice paymentMethod createdAt user")
      .lean();

    const statusKeys = [
      "Pending",
      "Accepted",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];
    const orderStatusBreakdown = {};
    for (const key of statusKeys) {
      orderStatusBreakdown[key] = await Order.countDocuments({ status: key });
    }

    const weekRevenue = platformGrowth.reduce((s, d) => s + d.revenue, 0);
    const weekOrders = platformGrowth.reduce((s, d) => s + d.orders, 0);

    res.json({
      usersCount,
      productsCount,
      ordersCount,
      totalRevenue: Math.round(totalRevenue),
      pendingOrders,
      pendingQueries,
      weekRevenue: Math.round(weekRevenue),
      weekOrders,
      userDistribution: { customers, vendors, admins },
      platformGrowth,
      recentOrders: recentOrders.map((o) => ({
        _id: o._id,
        status: o.status,
        totalPrice: o.totalPrice,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        customerName: o.user?.name || "Guest",
        customerEmail: o.user?.email || "",
      })),
      orderStatusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.role = req.body.role || user.role;
      const updatedUser = await user.save();
      await logAdminAction({
        action: "role_changed",
        actor: req.user,
        targetType: "user",
        targetId: user._id,
        details: `${user.email} → ${updatedUser.role}`,
      });
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: "Cannot delete admin user" });
      }
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("items.product", "name image category")
      .populate("items.vendor", "name storeName email phoneNumber")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
