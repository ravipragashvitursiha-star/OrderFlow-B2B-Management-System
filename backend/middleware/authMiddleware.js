const jwt = require("jsonwebtoken");

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

const authenticateToken = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token required."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            user_id: decoded.user_id,
            role: decoded.role.toLowerCase()
        };

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }
};


// =====================================
// ADMIN AUTHORIZATION
// =====================================

const authorizeAdmin = (req, res, next) => {

    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin only."
        });
    }

    next();
};


// =====================================
// CUSTOMER AUTHORIZATION
// =====================================

const authorizeCustomer = (req, res, next) => {

    if (!req.user || req.user.role !== "customer") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Customer only."
        });
    }

    next();
};


module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeCustomer
};