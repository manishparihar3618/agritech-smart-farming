const mongoose = require("mongoose");
const Product = require("../models/Product");
const { demoStore, generateId } = require("../demoStore");

const isDbConnected = () => mongoose.connection.readyState === 1;

const createProduct = async (req, res) => {
    try {
        if (isDbConnected()) {
            const product = await Product.create({
                ...req.body,
                seller: req.user._id,
            });

            return res.status(201).json({
                success: true,
                message: "Product created successfully",
                product,
            });
        }

        const newProduct = {
            _id: generateId("prod_"),
            ...req.body,
            seller: {
                _id: String(req.user._id || req.user.id),
                name: req.user.name || "Demo Farmer",
                email: req.user.email || "demo@agritech.com",
            },
            createdAt: new Date().toISOString(),
        };
        newProduct.id = newProduct._id;
        demoStore.products.unshift(newProduct);

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getProducts = async (req, res) => {
    try {
        if (isDbConnected()) {
            const filter = req.query.myProducts === "true"
                ? { seller: req.user._id }
                : {};

            const products = await Product.find(filter)
                .populate("seller", "name email")
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                count: products.length,
                products,
            });
        }

        let products = demoStore.products;
        if (req.query.myProducts === "true") {
            products = products.filter(
                (p) =>
                    p.seller &&
                    (p.seller._id === req.user._id ||
                        p.seller.id === req.user._id ||
                        p.seller === req.user._id)
            );
        }

        res.json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        if (isDbConnected()) {
            const product = await Product.findOneAndUpdate(
                { _id: req.params.id, seller: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            return res.json({
                success: true,
                message: "Product updated successfully",
                product,
            });
        }

        const index = demoStore.products.findIndex(
            (p) => p._id === req.params.id || p.id === req.params.id
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        demoStore.products[index] = { ...demoStore.products[index], ...req.body };
        res.json({
            success: true,
            message: "Product updated successfully",
            product: demoStore.products[index],
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        if (isDbConnected()) {
            const product = await Product.findOneAndDelete({
                _id: req.params.id,
                seller: req.user._id,
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            return res.json({
                success: true,
                message: "Product deleted successfully",
            });
        }

        const initialLen = demoStore.products.length;
        demoStore.products = demoStore.products.filter(
            (p) => !(p._id === req.params.id || p.id === req.params.id)
        );

        if (demoStore.products.length === initialLen) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
};