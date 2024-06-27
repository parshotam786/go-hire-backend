const CheckPermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Get user ID from request or session
      const userId = req.user.id; // Assuming user ID is stored in req.user

      // Fetch user role from MongoDB based on user ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user has required role
      if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // If user has required role, proceed to next middleware
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

module.exports = CheckPermission;
