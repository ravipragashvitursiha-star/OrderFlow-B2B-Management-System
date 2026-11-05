const express = require("express");

const router = express.Router();

const {
    getDashboardAnalytics
} = require("../controllers/dashboardController");

const {
    authenticateToken,
    authorizeAdmin
} = require("../middleware/authMiddleware");

router.get(
    "/analytics",
    authenticateToken,
    authorizeAdmin,
    getDashboardAnalytics
);

module.exports = router;