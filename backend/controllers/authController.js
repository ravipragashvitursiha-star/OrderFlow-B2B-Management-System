const { sql } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==============================
// REGISTER USER
// ==============================

const register = async (req, res) => {
    try {

        console.log("Registration Request:", req.body);

        // Accept different frontend field names
        const firstName = req.body.first_name || req.body.firstName || "";
        const lastName = req.body.last_name || req.body.lastName || "";

        const full_name = (
            req.body.full_name ||
            `${firstName} ${lastName}`
        ).trim();

        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        // Validation
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        // Check existing email
        const existingUser = await sql.query`
            SELECT user_id
            FROM Users
            WHERE email = ${email}
        `;

        if (existingUser.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await sql.query`
            INSERT INTO Users
            (
                full_name,
                email,
                password_hash,
                role
            )
            OUTPUT
                INSERTED.user_id,
                INSERTED.full_name,
                INSERTED.email,
                INSERTED.role

            VALUES
            (
                ${full_name},
                ${email},
                ${password_hash},
                'Customer'
            )
        `;

        console.log("Registration Successful!");

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user: result.recordset[0]
        });

    } catch (error) {

        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==============================
// LOGIN USER
// ==============================

const login = async (req, res) => {
    try {

        console.log("Login Request:", {
            email: req.body.email
        });

        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const result = await sql.query`
            SELECT
                user_id,
                full_name,
                email,
                password_hash,
                role
            FROM Users
            WHERE email = ${email}
        `;

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please register first."
            });
        }

        const user = result.recordset[0];

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        // Check JWT Secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        // Generate JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        console.log("Login Successful!");

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    register,
    login
};