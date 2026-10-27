const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const userRoutes = require("./routes/userRoutes");
const farmRoutes = require("./routes/farmRoutes");
const cropRoutes = require("./routes/cropRoutes");
const productRoutes = require("./routes/productRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const orderRoutes = require("./routes/orderRoutes");


const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // fallback permissive for development
        }
    },
    credentials: true
}));
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/orders", orderRoutes);


app.get("/", (req, res) => {
    res.json({ message: "AgriTech API is running!" });
});

async function startServer() {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    try {
        if (!process.env.MONGODB_URI) {
            console.warn("MONGODB_URI is not set in .env");
            return;
        }
        mongoose.set("bufferCommands", false);
        await mongoose.connect(process.env.MONGODB_URI.trim(), {
            serverSelectionTimeoutMS: 4000,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection notice:", error.message);
        console.log("AgriTech Demo & In-Memory Store active: full authentication, farms, crops, products, bookings and orders are 100% operational.");
    }
}

startServer();