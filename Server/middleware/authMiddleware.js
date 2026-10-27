const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { DEMO_USER_ID, demoStore } = require("../demoStore");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Always check demo user first
        if (decoded.userId === DEMO_USER_ID) {
            const demoUser = demoStore.users.find(u => u._id === DEMO_USER_ID);
            req.user = {
                _id: DEMO_USER_ID,
                id: DEMO_USER_ID,
                name: demoUser ? demoUser.name : "Ramesh Patel",
                email: demoUser ? demoUser.email : "demo@agritech.com",
                role: demoUser ? demoUser.role : "farmer",
                phone: demoUser ? demoUser.phone : "+91 98765 43210",
            };
            return next();
        }

        // If MongoDB is connected, query MongoDB
        if (mongoose.connection.readyState === 1) {
            try {
                const user = await User.findById(decoded.userId).select("-password");
                if (user) {
                    req.user = user;
                    return next();
                }
            } catch (dbErr) {
                console.warn("DB user lookup error, checking memory store:", dbErr.message);
            }
        }

        // Fallback: check in-memory store
        const memoryUser = demoStore.users.find(u => u._id === decoded.userId);
        if (memoryUser) {
            req.user = {
                _id: memoryUser._id,
                id: memoryUser._id,
                name: memoryUser.name,
                email: memoryUser.email,
                role: memoryUser.role,
                phone: memoryUser.phone,
            };
            return next();
        }

        return res.status(401).json({
            success: false,
            message: "User not found",
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = authMiddleware;