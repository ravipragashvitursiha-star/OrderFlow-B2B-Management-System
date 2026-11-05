const express = require("express");

const router = express.Router();

const {
    getAllOrders,
    createOrder,
    updateOrderStatus,
    getOrderItems
} = require("../controllers/orderController");

const {
    authenticateToken,
    authorizeAdmin
} = require("../middleware/authMiddleware");

// GET ORDERS - ADMIN AND CUSTOMER
router.get(
    "/",
    authenticateToken,
    getAllOrders
);

// CREATE ORDER - LOGGED IN USERS
router.post(
    "/",
    authenticateToken,
    createOrder
);

// GET ORDER ITEMS
router.get(
    "/:id/items",
    authenticateToken,
    getOrderItems
);

// UPDATE ORDER STATUS - ADMIN ONLY
router.put(
    "/:id/status",
    authenticateToken,
    authorizeAdmin,
    updateOrderStatus
);

module.exports = router;