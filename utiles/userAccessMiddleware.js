const jwt = require("jsonwebtoken");
const venderModel = require("../models/venderModel");

const authenticateUser = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    // req.user = await venderModel.findById(decoded?._id);
    const checkUser = await venderModel.findById(decoded?._id);
    console.log(checkUser);
    req.user = checkUser?.vendor === null ? checkUser?._id : checkUser?.vendor;
    req.role = checkUser?.role;
    req.subUser =
      checkUser?.vendor != null ? checkUser?._id : checkUser?.vendor;

    const result =
      checkUser?.vendor === null ? checkUser?._id : checkUser?.vendor;
    console.log("ddddd", result);

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error.response && error.response.status === 401) {
      return res.status(403).json({ message: "Token expired or invalid" });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

module.exports = {
  authenticateUser,
};

// const jwt = require("jsonwebtoken");
// const venderModel = require("../models/venderModel");

// const authenticateUser = async (req, res, next) => {
//   // Extract token from the authorization header
//   const token = req.headers["authorization"]?.split(" ")[1]; // Assuming the format is "Bearer <token>"

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   try {
//     // Verify the token
//     const decoded = jwt.verify(token, "your_jwt_secret");

//     const user = await venderModel.findById(decoded?._id); // Attach user data to the request object
//     req.user = user?.role == "Editor" ? { ...user, id: user?.vendor } : user;

//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({ message: "Invalid token" });
//     } else if (error.response && error.response.status === 401) {
//       return res.status(403).json({ message: "Token expired or invalid" });
//     } else {
//       return res.status(500).json({ message: "Internal Server Error" });
//     }
//   }
// };

// module.exports = {
//   authenticateUser,
// };
