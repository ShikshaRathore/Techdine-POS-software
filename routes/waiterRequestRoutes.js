// routes/waiterRequestRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });

const waiterRequestController = require("../controllers/waiterRequestController");

// Show pending requests
router.get("/", waiterRequestController.getPendingRequests);

// Create a new waiter request
router.post("/create", waiterRequestController.createRequest);

// Get all pending requests for a branch
router.get("/newRequest", waiterRequestController.getNewRequest);

// Get all requests for a branch (with optional status filter)
router.get("/all", waiterRequestController.getAllRequests);

// Mark a request as attended
router.patch("/:requestId/attend", waiterRequestController.markAsAttended);

// Delete a request
router.delete("/:requestId", waiterRequestController.deleteRequest);

// Mark as attended
router.post("/markAttended/:id", waiterRequestController.markAttended);

module.exports = router;
