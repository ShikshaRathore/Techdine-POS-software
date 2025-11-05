// routes/customerRoutes.js

const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

/**
 * @route   GET /restaurant/:branchId/info
 * @desc    Get branch info for QR code generation
 * @access  Public
 */
router.get("/:branchId/info", customerController.getBranchInfo);

/**
 * @route   GET /restaurant/:branchId/order/:orderId/status
 * @desc    Get order status
 * @access  Public
 */
router.get(
  "/:branchId/order/:orderId/status",
  customerController.getOrderStatus
);

router.get("/:branchId/reservations", customerController.getReservationPage);
/**
 * @route   POST /restaurant/:branchId/place-order
 * @desc    Place a new order
 * @access  Public
 */

router.post("/:branchId/place-order", customerController.placeOrder);
router.post("/:branchId/reservations", customerController.createReservation);
/**
 * @route   GET /restaurant/:branchId
 * @desc    Display customer dashboard with menu
 * @access  Public
 */
router.get("/:branchId", customerController.getCustomerDashboard);

module.exports = router;
