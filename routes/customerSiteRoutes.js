// // routes/customerRoutes.js

// const express = require("express");
// const router = express.Router();
// const customerSiteController = require("../controllers/customerSiteController");

// /**
//  * @route   GET /restaurant/:branchId/info
//  * @desc    Get branch info for QR code generation
//  * @access  Public
//  */
// router.get("/:branchId/info", customerSiteController.getBranchInfo);

// /**
//  * @route   GET /restaurant/:branchId/order/:orderId/status
//  * @desc    Get order status
//  * @access  Public
//  */
// router.get(
//   "/:branchId/order/:orderId/status",
//   customerSiteController.getOrderStatus
// );

// router.get(
//   "/:branchId/reservations",
//   customerSiteController.getReservationPage
// );
// /**
//  * @route   POST /restaurant/:branchId/place-order
//  * @desc    Place a new order
//  * @access  Public
//  */

// router.post("/:branchId/place-order", customerSiteController.placeOrder);
// router.post(
//   "/:branchId/reservations",
//   customerSiteController.createReservation
// );
// /**
//  * @route   GET /restaurant/:branchId
//  * @desc    Display customer dashboard with menu
//  * @access  Public
//  */
// router.get("/:branchId", customerSiteController.getCustomerDashboard);

// module.exports = router;

const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const TableSessionService = require("../services/tableSessionService");
const Branch = require("../models/branch");
const MenuItem = require("../models/menuItem");
const sendNotification = require("../utils/sendNotification");

/**
 * Customer site route - Initialize session when QR is scanned
 */
router.get("/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { table: tableId, tableCode } = req.query;

    // Get customer info
    const customerInfo = {
      customerId: req.user?._id, // If logged in
      deviceId: req.headers["x-device-id"] || req.sessionID,
      ipAddress: req.ip,
    };

    let sessionData = null;

    // If table ID is provided, create/get session
    if (tableId) {
      sessionData = await TableSessionService.createOrGetSession(
        tableId,
        branchId,
        customerInfo
      );

      // Store session token in cookie for subsequent requests
      res.cookie("tableSession", sessionData.session.sessionToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Render customer site with session info
    res.render("layouts/customer-dashboard", {
      branch: await Branch.findById(branchId),
      menuItems: await MenuItem.find({ branch: branchId }),
      allBranches: await Branch.find(),
      session: sessionData?.session || sessionData || null,
      tableId,
      tableCode,
      isTableInUse: sessionData && !sessionData.isNew,
    });
  } catch (error) {
    console.error("Error loading customer site:", error);
    res.status(500).send("Error loading restaurant page");
  }
});

/**
 * Place order with session tracking
 */
router.post("/:branchId/place-order", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { orderType, items, totalAmount, specialInstructions, tableId } =
      req.body;

    const tableCode = req.query.tableCode;

    // Get session from cookie or create new one
    const sessionToken = req.cookies.tableSession;
    let session = null;

    if (tableId) {
      if (sessionToken) {
        session = await TableSessionService.validateSession(
          sessionToken,
          tableId
        );
      }

      if (!session) {
        const customerInfo = {
          customerId: req.user?._id,
          deviceId: req.headers["x-device-id"] || req.sessionID,
          ipAddress: req.ip,
        };

        const sessionData = await TableSessionService.createOrGetSession(
          tableId,
          branchId,
          customerInfo
        );

        session = sessionData.session;

        // Update cookie with new session
        res.cookie("tableSession", session.sessionToken, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
      }
    }

    // Generate order number
    const orderCount = await Order.countDocuments({ branch: branchId });
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    // Create order
    const order = new Order({
      orderNumber,
      branch: branchId,
      customer: req.user?._id,
      table: tableId || null,
      items,
      orderType,
      totalAmount,
      specialInstructions,
      status: "KOT",
      kotGenerated: true,
    });

    await order.save();

    // Add order to session if exists
    if (session) {
      await TableSessionService.addOrderToSession(
        session._id,
        order._id,
        totalAmount
      );
    }

    // Create KOT
    const KOT = require("../models/kot");
    const kot = new KOT({
      order: order._id,
      branch: branchId,
      table: tableId,
      items: items.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        notes: item.notes,
      })),
      kotNumber: `KOT-${Date.now()}`,
      createdBy: req.user?._id || null,
      createdByModel: req.user ? "Customer" : "Staff",
    });

    await kot.save();

    res.json({
      success: true,
      order,
      kot,
      session: session
        ? {
            id: session._id,
            token: session.sessionToken,
            totalAmount: session.totalAmount,
          }
        : null,
    });

    sendNotification(`🛎️ New Order from Table ${tableCode}`);
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

/**
 * Mark order as paid and complete session
 */
router.post("/:branchId/complete-payment", async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = "Paid";
    order.paymentStatus = "Paid";
    order.paymentMethod = paymentMethod;
    order.billedAt = new Date();
    await order.save();
    await afterStatusUpdate(order._id);

    // Find session and check if all orders are paid
    const sessionToken = req.cookies.tableSession;
    if (sessionToken && order.table) {
      const session = await TableSessionService.validateSession(
        sessionToken,
        order.table
      );

      if (session) {
        // Check if all orders in session are paid
        const sessionOrders = await Order.find({
          _id: { $in: session.orders },
        });
        const allPaid = sessionOrders.every(
          (o) => o.paymentStatus === "Paid" || o.status === "Paid"
        );

        if (allPaid) {
          // Complete session and free table
          await TableSessionService.completeSession(session._id);

          // Clear session cookie
          res.clearCookie("tableSession");

          return res.json({
            success: true,
            message: "Payment completed and table freed",
            sessionCompleted: true,
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Payment completed",
      sessionCompleted: false,
    });
  } catch (error) {
    console.error("Error completing payment:", error);
    res.status(500).json({ success: false, message: "Payment failed" });
  }
});

/**
 * Get current session status
 */
router.get("/:branchId/session-status", async (req, res) => {
  try {
    const sessionToken = req.cookies.tableSession;
    const { tableId } = req.query;

    if (!sessionToken || !tableId) {
      return res.json({ hasSession: false });
    }

    const session = await TableSessionService.validateSession(
      sessionToken,
      tableId
    );

    if (!session) {
      return res.json({ hasSession: false });
    }

    const sessionDetails = await TableSessionService.getSessionDetails(
      session._id
    );

    res.json({
      hasSession: true,
      session: {
        id: sessionDetails._id,
        totalAmount: sessionDetails.totalAmount,
        orderCount: sessionDetails.orders.length,
        startedAt: sessionDetails.startedAt,
        isActive: sessionDetails.isActive(),
      },
    });
  } catch (error) {
    console.error("Error getting session status:", error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
