const jwt = require("jsonwebtoken")
const Admin = require("../models/adminModel");
const Vender = require("../models/venderModel");

const protect = async (req, res, next) => {
    let token
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
            const decoded = jwt.verify(token, "your_jwt_secret")

            req.user = await Vender.findById(decoded.id).select('-password')

            if (!req.user) {
                return res.status(400).json({ error: "Vendor not found" })
            }

            return next()
        }
        else {
            return res.status(401).json({ error: "Not authorized, no token" })
        }
    } catch (error) {
        return res.status(401).json({ error:"Not authorized" })
    }
}

module.exports = {
    protect
}