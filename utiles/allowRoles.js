// Middleware function to check role
function allowedRoles(allowedRoles) {
    return function(req, res, next) {
        const userRole = req.user.role; // Assuming role is stored in req.user

        if (allowedRoles.includes(userRole)) {
            next(); // User has required role, so continue to next middleware or route handler
        } else {
            res.status(403).json({ message: "You do not have permission to access this route" }); // User does not have required role
        }
    };
}


module.exports=allowedRoles