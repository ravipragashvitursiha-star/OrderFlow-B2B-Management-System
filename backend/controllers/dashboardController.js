const { sql } = require("../config/database");

// ==========================================
// GET DASHBOARD ANALYTICS
// ==========================================

const getDashboardAnalytics = async (req, res) => {
    try {

        // 1. DASHBOARD SUMMARY

        const summaryResult = await sql.query(`
            SELECT
                (SELECT COUNT(*) FROM Products) AS totalProducts,

                (SELECT COUNT(*) FROM Orders) AS totalOrders,

                (SELECT COUNT(*)
                 FROM Orders
                 WHERE status = 'Pending') AS pendingOrders,

                (SELECT ISNULL(SUM(stock_quantity), 0)
                 FROM Products) AS totalStockUnits,

                (SELECT ISNULL(SUM(total_amount), 0)
                 FROM Invoices) AS totalRevenue,

                (SELECT COUNT(*)
                 FROM Invoices) AS totalInvoices
        `);


        // 2. MONTHLY REVENUE - LAST 6 MONTHS

        const revenueResult = await sql.query(`
            SELECT
                YEAR(invoice_date) AS revenueYear,
                MONTH(invoice_date) AS revenueMonth,
                SUM(total_amount) AS monthlyRevenue

            FROM Invoices

            WHERE invoice_date >= DATEADD(
                MONTH,
                -5,
                DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
            )
            AND invoice_date < DATEADD(
                MONTH,
                1,
                DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
            )

            GROUP BY
                YEAR(invoice_date),
                MONTH(invoice_date)

            ORDER BY
                revenueYear,
                revenueMonth
        `);


        // 3. MONTHLY ORDERS - LAST 6 MONTHS

        const ordersResult = await sql.query(`
            SELECT
                YEAR(order_date) AS orderYear,
                MONTH(order_date) AS orderMonth,
                COUNT(*) AS monthlyOrders

            FROM Orders

            WHERE order_date >= DATEADD(
                MONTH,
                -5,
                DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
            )
            AND order_date < DATEADD(
                MONTH,
                1,
                DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
            )

            GROUP BY
                YEAR(order_date),
                MONTH(order_date)

            ORDER BY
                orderYear,
                orderMonth
        `);


        // 4. ORDER STATUS OVERVIEW

        const statusResult = await sql.query(`
            SELECT
                status,
                COUNT(*) AS totalOrders

            FROM Orders

            GROUP BY status
        `);


        // 5. INVENTORY HEALTH

        const inventoryResult = await sql.query(`
            SELECT
                product_id,
                product_name,
                category,
                stock_quantity,

                CASE
                    WHEN stock_quantity = 0 THEN 'Out of Stock'
                    WHEN stock_quantity <= 10 THEN 'Low Stock'
                    ELSE 'In Stock'
                END AS stockStatus

            FROM Products

            WHERE stock_quantity <= 10

            ORDER BY stock_quantity ASC
        `);


        // 6. RECENT ORDERS

        const recentOrdersResult = await sql.query(`
            SELECT TOP 5
                o.order_id,
                o.customer_id,
                c.company_name,
                o.order_date,
                o.total_amount,
                o.status

            FROM Orders o

            LEFT JOIN Customers c
                ON o.customer_id = c.customer_id

            ORDER BY o.order_id DESC
        `);


        // 7. SEND RESPONSE

        res.status(200).json({

            success: true,

            summary: summaryResult.recordset[0],

            monthlyRevenue: revenueResult.recordset,

            monthlyOrders: ordersResult.recordset,

            orderStatus: statusResult.recordset,

            lowStockProducts: inventoryResult.recordset,

            recentOrders: recentOrdersResult.recordset

        });

    } catch (error) {

        console.error("Dashboard Analytics Error:", error);

        res.status(500).json({

            success: false,

            message: "Failed to fetch dashboard analytics"

        });

    }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getDashboardAnalytics
};