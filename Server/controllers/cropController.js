const mongoose = require("mongoose");
const Crop = require("../models/Crop");
const Farm = require("../models/Farm");
const { demoStore, generateId } = require("../demoStore");

const isDbConnected = () => mongoose.connection.readyState === 1;

const createCrop = async (req, res) => {
    try {
        const { farm, name } = req.body;

        if (!farm || !name) {
            return res.status(400).json({
                success: false,
                message: "Farm ID and crop name are required",
            });
        }

        if (isDbConnected()) {
            const farmExists = await Farm.findOne({
                _id: farm,
                farmer: req.user._id,
            });

            if (!farmExists) {
                return res.status(404).json({
                    success: false,
                    message: "Farm not found",
                });
            }

            const crop = await Crop.create({
                ...req.body,
                farm,
                farmer: req.user._id,
            });

            return res.status(201).json({
                success: true,
                message: "Crop created successfully",
                crop,
            });
        }

        // Demo store fallback
        const farmObj = demoStore.farms.find(
            (f) =>
                (f._id === farm || f.id === farm) &&
                String(f.farmer) === String(req.user._id || req.user.id)
        );

        const newCrop = {
            _id: generateId("crop_"),
            ...req.body,
            farm: farmObj ? { _id: farmObj._id, name: farmObj.name } : farm,
            farmer: String(req.user._id || req.user.id),
            createdAt: new Date().toISOString(),
        };
        newCrop.id = newCrop._id;
        demoStore.crops.unshift(newCrop);

        return res.status(201).json({
            success: true,
            message: "Crop created successfully",
            crop: newCrop,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getCrops = async (req, res) => {
    try {
        if (isDbConnected()) {
            const crops = await Crop.find({ farmer: req.user._id })
                .populate("farm", "name");

            return res.json({
                success: true,
                count: crops.length,
                crops,
            });
        }

        // Demo store fallback
        const userCrops = demoStore.crops.filter(
            (c) => String(c.farmer) === String(req.user._id || req.user.id)
        );

        res.json({
            success: true,
            count: userCrops.length,
            crops: userCrops,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateCrop = async (req, res) => {
    try {
        if (isDbConnected()) {
            const crop = await Crop.findOneAndUpdate(
                { _id: req.params.id, farmer: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!crop) {
                return res.status(404).json({
                    success: false,
                    message: "Crop not found",
                });
            }

            return res.json({
                success: true,
                message: "Crop updated successfully",
                crop,
            });
        }

        const index = demoStore.crops.findIndex(
            (c) =>
                (c._id === req.params.id || c.id === req.params.id) &&
                String(c.farmer) === String(req.user._id || req.user.id)
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Crop not found",
            });
        }

        demoStore.crops[index] = { ...demoStore.crops[index], ...req.body };
        res.json({
            success: true,
            message: "Crop updated successfully",
            crop: demoStore.crops[index],
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteCrop = async (req, res) => {
    try {
        if (isDbConnected()) {
            const crop = await Crop.findOneAndDelete({
                _id: req.params.id,
                farmer: req.user._id,
            });

            if (!crop) {
                return res.status(404).json({
                    success: false,
                    message: "Crop not found",
                });
            }

            return res.json({
                success: true,
                message: "Crop deleted successfully",
            });
        }

        const initialLen = demoStore.crops.length;
        demoStore.crops = demoStore.crops.filter(
            (c) =>
                !(
                    (c._id === req.params.id || c.id === req.params.id) &&
                    String(c.farmer) === String(req.user._id || req.user.id)
                )
        );

        if (demoStore.crops.length === initialLen) {
            return res.status(404).json({
                success: false,
                message: "Crop not found",
            });
        }

        res.json({
            success: true,
            message: "Crop deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createCrop,
    getCrops,
    updateCrop,
    deleteCrop,
};