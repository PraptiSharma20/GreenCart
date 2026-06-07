/** Product management routes — vendor owns their items; admin can manage all */
const vendorOrAdminMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === "vendor" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Vendor or Admin only." });
  }
};

export default vendorOrAdminMiddleware;
