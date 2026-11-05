const express = require("express");
const router = express.Router();

const {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock
} = require("../controllers/productController");

const {
    authenticateToken,
    authorizeAdmin
} = require("../middleware/authMiddleware");

// GET ALL PRODUCTS
router.get("/", getAllProducts);

// GET SINGLE PRODUCT
router.get("/:id", getProductById);

// ADD PRODUCT - ADMIN ONLY
router.post(
    "/",
    authenticateToken,
    authorizeAdmin,
    addProduct
);

// EDIT PRODUCT - ADMIN ONLY
router.put(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    updateProduct
);

// UPDATE STOCK - ADMIN ONLY
router.patch(
    "/:id/stock",
    authenticateToken,
    authorizeAdmin,
    updateProductStock
);

// DELETE PRODUCT - ADMIN ONLY
router.delete(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    deleteProduct
);

module.exports = router;