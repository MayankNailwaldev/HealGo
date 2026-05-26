const express = require("express");

const router = express.Router();

const {
  placeOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
} = require("../controllers/Ordercontroller");

router.post("/", placeOrder);

router.get("/", getOrders);

router.get("/my-orders/:userId", getMyOrders);

router.put("/:id/status", updateOrderStatus);

module.exports = router;
