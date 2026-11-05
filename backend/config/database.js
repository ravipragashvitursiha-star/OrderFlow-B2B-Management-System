const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: "localhost",
    database: process.env.DB_NAME,

    port: 1433,

    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: undefined
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("SQL Server Connected Successfully!");
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        throw error;
    }
};

module.exports = { sql, connectDB };