const { sql } = require("../config/database");

// ==================================
// GET ALL PRODUCTS
// ==================================

const getAllProducts = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                product_id,
                product_name,
                category,
                price,
                stock_quantity,
                created_at
            FROM Products
            ORDER BY product_id DESC
        `;

        res.status(200).json({
            success: true,
            products: result.recordset
        });

    } catch (error) {
        console.error("Get Products Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};


// ==================================
// GET SINGLE PRODUCT
// ==================================

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql.query`
            SELECT *
            FROM Products
            WHERE product_id = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product: result.recordset[0]
        });

    } catch (error) {
        console.error("Get Product Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};


// ==================================
// ADD NEW PRODUCT
// ==================================

const addProduct = async (req, res) => {
    try {
        const {
            product_name,
            category,
            price,
            stock_quantity
        } = req.body;

        if (
            !product_name ||
            price === undefined ||
            stock_quantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Product name, price and stock quantity are required"
            });
        }

        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(stock_quantity)) ||
            Number(stock_quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid price or stock quantity"
            });
        }

        const result = await sql.query`
            INSERT INTO Products
            (
                product_name,
                category,
                price,
                stock_quantity,
                created_at
            )
            OUTPUT INSERTED.*
            VALUES
            (
                ${product_name},
                ${category || null},
                ${Number(price)},
                ${Number(stock_quantity)},
                GETDATE()
            )
        `;

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: result.recordset[0]
        });

    } catch (error) {
        console.error("Add Product Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add product"
        });
    }
};


// ==================================
// UPDATE PRODUCT
// ==================================

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            product_name,
            category,
            price,
            stock_quantity
        } = req.body;

        if (
            !product_name ||
            price === undefined ||
            stock_quantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All required product fields must be provided"
            });
        }

        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(stock_quantity)) ||
            Number(stock_quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid price or stock quantity"
            });
        }

        const result = await sql.query`
            UPDATE Products
            SET
                product_name = ${product_name},
                category = ${category || null},
                price = ${Number(price)},
                stock_quantity = ${Number(stock_quantity)}
            OUTPUT INSERTED.*
            WHERE product_id = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: result.recordset[0]
        });

    } catch (error) {
        console.error("Update Product Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};


// ==================================
// DELETE PRODUCT
// ==================================

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql.query`
            DELETE FROM Products
            OUTPUT DELETED.*
            WHERE product_id = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete Product Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
};
// ==================================
// UPDATE PRODUCT STOCK
// ==================================

const updateProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity } = req.body;

        if (
            stock_quantity === undefined ||
            stock_quantity === "" ||
            !Number.isInteger(Number(stock_quantity)) ||
            Number(stock_quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid stock quantity is required"
            });
        }

        const result = await sql.query`
            UPDATE Products
            SET stock_quantity = ${Number(stock_quantity)}
            OUTPUT INSERTED.*
            WHERE product_id = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            product: result.recordset[0]
        });

    } catch (error) {
        console.error("Update Stock Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update stock"
        });
    }
};

// ==================================
// EXPORT FUNCTIONS
// ==================================

module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock
};