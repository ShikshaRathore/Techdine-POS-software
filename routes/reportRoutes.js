// routes/reports.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// Sales Report Route
router.get("/salesReport/:branchId", reportController.getSalesReport);

// Item Report Route
router.get("/itemReports/:branchId", reportController.getItemReport);

// Category Report Route
router.get("/categoryReport/:branchId", reportController.getCategoryReport);

module.exports = router;
