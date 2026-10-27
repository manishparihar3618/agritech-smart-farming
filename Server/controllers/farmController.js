const mongoose = require("mongoose");
const Farm = require("../models/Farm");
const { demoStore, generateId } = require("../demoStore");

const isDbConnected = () => mongoose.connection.readyState === 1;

const createFarm = async (req, res) => {
    try {
        if (isDbConnected()) {
            const farm = await Farm.create({
                ...req.body,
                farmer: req.user._id,
            });

            return res.status(201).json({
                success: true,
                message: "Farm created successfully",
                farm,
            });
        }

        // Demo store fallback
        const newFarm = {
            _id: generateId("farm_"),
            ...req.body,
            farmer: String(req.user._id || req.user.id),
            createdAt: new Date().toISOString(),
        };
        newFarm.id = newFarm._id;
        demoStore.farms.unshift(newFarm);

        return res.status(201).json({
            success: true,
            message: "Farm created successfully",
            farm: newFarm,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getFarms = async (req, res) => {
    try {
        if (isDbConnected()) {
            const farms = await Farm.find({ farmer: req.user._id });
            return res.json({
                success: true,
                count: farms.length,
                farms,
            });
        }

        // Demo store fallback
        const userFarms = demoStore.farms.filter(
            (f) => String(f.farmer) === String(req.user._id || req.user.id)
        );

        res.json({
            success: true,
            count: userFarms.length,
            farms: userFarms,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getFarmById = async (req, res) => {
    try {
        if (isDbConnected()) {
            const farm = await Farm.findOne({
                _id: req.params.id,
                farmer: req.user._id,
            });

            if (!farm) {
                return res.status(404).json({
                    success: false,
                    message: "Farm not found",
                });
            }

            return res.json({ success: true, farm });
        }

        const farm = demoStore.farms.find(
            (f) =>
                (f._id === req.params.id || f.id === req.params.id) &&
                String(f.farmer) === String(req.user._id || req.user.id)
        );

        if (!farm) {
            return res.status(404).json({
                success: false,
                message: "Farm not found",
            });
        }

        res.json({ success: true, farm });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateFarm = async (req, res) => {
    try {
        if (isDbConnected()) {
            const farm = await Farm.findOneAndUpdate(
                { _id: req.params.id, farmer: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!farm) {
                return res.status(404).json({
                    success: false,
                    message: "Farm not found",
                });
            }

            return res.json({
                success: true,
                message: "Farm updated successfully",
                farm,
            });
        }

        const index = demoStore.farms.findIndex(
            (f) =>
                (f._id === req.params.id || f.id === req.params.id) &&
                String(f.farmer) === String(req.user._id || req.user.id)
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Farm not found",
            });
        }

        demoStore.farms[index] = { ...demoStore.farms[index], ...req.body };
        res.json({
            success: true,
            message: "Farm updated successfully",
            farm: demoStore.farms[index],
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteFarm = async (req, res) => {
    try {
        if (isDbConnected()) {
            const farm = await Farm.findOneAndDelete({
                _id: req.params.id,
                farmer: req.user._id,
            });

            if (!farm) {
                return res.status(404).json({
                    success: false,
                    message: "Farm not found",
                });
            }

            return res.json({
                success: true,
                message: "Farm deleted successfully",
            });
        }

        const initialLen = demoStore.farms.length;
        demoStore.farms = demoStore.farms.filter(
            (f) =>
                !(
                    (f._id === req.params.id || f.id === req.params.id) &&
                    String(f.farmer) === String(req.user._id || req.user.id)
                )
        );

        if (demoStore.farms.length === initialLen) {
            return res.status(404).json({
                success: false,
                message: "Farm not found",
            });
        }

        res.json({
            success: true,
            message: "Farm deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createFarm,
    getFarms,
    getFarmById,
    updateFarm,
    deleteFarm,
};