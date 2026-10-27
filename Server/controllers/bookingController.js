const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { demoStore, generateId } = require("../demoStore");

const isDbConnected = () => mongoose.connection.readyState === 1;

const createBooking = async (req, res) => {
    try {
        const { bookingType, title, scheduledDate } = req.body;

        if (!bookingType || !title || !scheduledDate) {
            return res.status(400).json({
                success: false,
                message: "Booking type, title and scheduled date are required",
            });
        }

        if (isDbConnected()) {
            const booking = await Booking.create({
                ...req.body,
                user: req.user._id,
            });

            return res.status(201).json({
                success: true,
                message: "Booking created successfully",
                booking,
            });
        }

        const newBooking = {
            _id: generateId("book_"),
            ...req.body,
            status: "pending",
            user: String(req.user._id || req.user.id),
            createdAt: new Date().toISOString(),
        };
        newBooking.id = newBooking._id;
        demoStore.bookings.unshift(newBooking);

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: newBooking,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getBookings = async (req, res) => {
    try {
        if (isDbConnected()) {
            const bookings = await Booking.find({
                user: req.user._id,
            }).populate("farm", "name");

            return res.json({
                success: true,
                count: bookings.length,
                bookings,
            });
        }

        const userBookings = demoStore.bookings.filter(
            (b) => String(b.user) === String(req.user._id || req.user.id)
        );

        res.json({
            success: true,
            count: userBookings.length,
            bookings: userBookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateBooking = async (req, res) => {
    try {
        if (isDbConnected()) {
            const booking = await Booking.findOneAndUpdate(
                { _id: req.params.id, user: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }

            return res.json({
                success: true,
                message: "Booking updated successfully",
                booking,
            });
        }

        const index = demoStore.bookings.findIndex(
            (b) =>
                (b._id === req.params.id || b.id === req.params.id) &&
                String(b.user) === String(req.user._id || req.user.id)
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        demoStore.bookings[index] = { ...demoStore.bookings[index], ...req.body };
        res.json({
            success: true,
            message: "Booking updated successfully",
            booking: demoStore.bookings[index],
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteBooking = async (req, res) => {
    try {
        if (isDbConnected()) {
            const booking = await Booking.findOneAndDelete({
                _id: req.params.id,
                user: req.user._id,
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }

            return res.json({
                success: true,
                message: "Booking deleted successfully",
            });
        }

        const initialLen = demoStore.bookings.length;
        demoStore.bookings = demoStore.bookings.filter(
            (b) =>
                !(
                    (b._id === req.params.id || b.id === req.params.id) &&
                    String(b.user) === String(req.user._id || req.user.id)
                )
        );

        if (demoStore.bookings.length === initialLen) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.json({
            success: true,
            message: "Booking deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createBooking,
    getBookings,
    updateBooking,
    deleteBooking,
};