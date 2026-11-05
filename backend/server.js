const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB, sql } = require("./config/database");

const app = express();

// ==================================
// MIDDLEWARE
// ==================================

app.use(cors());
app.use(express.json());


// ==================================
// ROUTES
// ==================================

// Authentication Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Product Routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

// Order Routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

// Dashboard Analytics Routes
const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);


// ==================================
// HOME ROUTE
// ==================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "OrderFlow B2B Management API is running!"
    });
});


// ==================================
// HEALTH CHECK ROUTE
// ==================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend server is working successfully"
    });
});


// ==================================
// DATABASE TEST ROUTE
// ==================================

app.get("/api/db-test", async (req, res) => {
    try {

        const result = await sql.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);

        res.json({
            success: true,
            message: "Database connected successfully!",
            tables: result.recordset
        });

    } catch (error) {

        console.error("Database Test Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==================================
// START SERVER
// ==================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    try {

        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error("Server startup failed:", error.message);

    }
};

startServer();