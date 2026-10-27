const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { demoStore, generateId } = require("../demoStore");

const isDbConnected = () => mongoose.connection.readyState === 1;

const createOrder = async (req, res) => {
    try {
        const {
            productId,
            quantity = 1,
            shippingAddress,
            paymentMethod = "Cash on Delivery",
            notes,
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        const orderQty = Number(quantity);
        if (isNaN(orderQty) || orderQty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Order quantity must be at least 1",
            });
        }

        if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
            return res.status(400).json({
                success: false,
                message: "Shipping address and city are required",
            });
        }

        if (isDbConnected()) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            if (product.stock < orderQty) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items available in stock`,
                });
            }

            const totalAmount = Number((product.price * orderQty).toFixed(2));

            product.stock -= orderQty;
            await product.save();

            const order = await Order.create({
                buyer: req.user._id,
                product: product._id,
                productName: product.name,
                productCategory: product.category,
                quantity: orderQty,
                unitPrice: product.price,
                totalAmount,
                shippingAddress,
                paymentMethod,
                notes,
                status: "placed",
            });

            return res.status(201).json({
                success: true,
                message: "Order placed successfully!",
                order,
            });
        }

        // Demo store fallback
        const product = demoStore.products.find(
            (p) => p._id === productId || p.id === productId
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (product.stock < orderQty) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`,
            });
        }

        const totalAmount = Number((product.price * orderQty).toFixed(2));
        product.stock -= orderQty;

        const newOrder = {
            _id: generateId("ord_"),
            buyer: String(req.user._id || req.user.id),
            product: product._id,
            productName: product.name,
            productCategory: product.category,
            quantity: orderQty,
            unitPrice: product.price,
            totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus: "pending",
            notes,
            status: "placed",
            createdAt: new Date().toISOString(),
        };
        newOrder.id = newOrder._id;
        demoStore.orders.unshift(newOrder);

        return res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order: newOrder,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to place order",
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        if (isDbConnected()) {
            const orders = await Order.find({ buyer: req.user._id })
                .populate("product", "name category brand imageUrl")
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                count: orders.length,
                orders,
            });
        }

        const userOrders = demoStore.orders.filter(
            (o) => String(o.buyer) === String(req.user._id || req.user.id)
        );

        res.json({
            success: true,
            count: userOrders.length,
            orders: userOrders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch orders",
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        if (isDbConnected()) {
            const order = await Order.findOne({
                _id: req.params.id,
                buyer: req.user._id,
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found",
                });
            }

            if (order.status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    message: "Order is already cancelled",
                });
            }

            if (order.status === "delivered") {
                return res.status(400).json({
                    success: false,
                    message: "Delivered orders cannot be cancelled",
                });
            }

            order.status = "cancelled";
            await order.save();

            await Product.findByIdAndUpdate(order.product, {
                $inc: { stock: order.quantity },
            });

            return res.json({
                success: true,
                message: "Order cancelled successfully",
                order,
            });
        }

        const order = demoStore.orders.find(
            (o) =>
                (o._id === req.params.id || o.id === req.params.id) &&
                String(o.buyer) === String(req.user._id || req.user.id)
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled",
            });
        }

        if (order.status === "delivered") {
            return res.status(400).json({
                success: false,
                message: "Delivered orders cannot be cancelled",
            });
        }

        order.status = "cancelled";

        const product = demoStore.products.find((p) => p._id === order.product);
        if (product) {
            product.stock += order.quantity;
        }

        res.json({
            success: true,
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to cancel order",
        });
    }
};

const deleteOrder = async (req, res) => {
    try {
        if (isDbConnected()) {
            const order = await Order.findOneAndDelete({
                _id: req.params.id,
                buyer: req.user._id,
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found",
                });
            }

            return res.json({
                success: true,
                message: "Order record removed",
            });
        }

        const initialLen = demoStore.orders.length;
        demoStore.orders = demoStore.orders.filter(
            (o) =>
                !(
                    (o._id === req.params.id || o.id === req.params.id) &&
                    String(o.buyer) === String(req.user._id || req.user.id)
                )
        );

        if (demoStore.orders.length === initialLen) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.json({
            success: true,
            message: "Order record removed",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    cancelOrder,
    deleteOrder,
};
