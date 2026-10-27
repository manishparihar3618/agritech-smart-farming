const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createOrder,
    getMyOrders,
    cancelOrder,
    deleteOrder,
} = require("../controllers/orderController");

router.use(authMiddleware);

router.post("/", createOrder);
router.get("/", getMyOrders);
router.put("/:id/cancel", cancelOrder);
router.delete("/:id", deleteOrder);

module.exports = router;
