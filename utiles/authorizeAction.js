const venderModel = require("../models/venderModel");

const authorizeAction = (requiredRole, requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user;
      const subUserId = req.subUser;
      const vendorId = ["Seller", "Admin"].includes(req?.role)
        ? userId
        : subUserId;
      const user = await venderModel.findById(vendorId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user's role matches or includes the required permission
      if (!requiredRole.includes(user.role)) {
        if (!user.permissions.includes(requiredPermission)) {
          return res.status(403).json({
            success: false,
            message: `You are not authorized to perform this action.`,
          });
        }
      }

      next();
    } catch (error) {
      res
        .status(500)
        .json({ error: "Authorization error", details: error.message });
    }
  };
};

module.exports = authorizeAction;
