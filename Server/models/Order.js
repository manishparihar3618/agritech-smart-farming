const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        productName: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingAddress: {
            address: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
            phone: { type: String, trim: true },
        },
        paymentMethod: {
            type: String,
            enum: ["Cash on Delivery", "UPI / Online", "Bank Transfer"],
            default: "Cash on Delivery",
        },
        status: {
            type: String,
            enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
            default: "placed",
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
