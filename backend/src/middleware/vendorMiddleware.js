import User from "../models/User.js";

const vendorMiddleware = async (req, res, next) => {
  if (!req.user || req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied. Vendor account required." });
  }
  try {
    const dbUser = await User.findById(req.user.id).select(
      "vendorStatus isSuspended role"
    );
    if (!dbUser) {
      return res.status(403).json({ message: "User not found" });
    }
    if (dbUser.isSuspended || dbUser.vendorStatus === "suspended") {
      return res.status(403).json({
        message: "Your vendor account is suspended. Contact support.",
      });
    }
    if (dbUser.vendorStatus === "pending") {
      return res.status(403).json({
        message: "Your vendor account is pending admin approval.",
      });
    }
    if (dbUser.vendorStatus === "rejected") {
      return res.status(403).json({
        message: "Your vendor application was not approved.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default vendorMiddleware;
