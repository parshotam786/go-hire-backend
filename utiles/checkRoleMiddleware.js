const roles = require("../models/roles");

const checkRole = () => {
  return async (req, res, next) => {
    try {
      const allRoles = await roles.find();
      const validRoles = allRoles.map((role) => role.name);
      console.log({ validRoles });

      const userRole = req.body.role;
      if (!validRoles.includes(userRole)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or unauthorized role" });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        details: error.message,
      });
    }
  };
};

module.exports = checkRole;
