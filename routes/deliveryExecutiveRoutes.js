// routes/deliveryExecutive.js
const express = require("express");
const router = express.Router();
const deliveryExecutiveController = require("../controllers/deliveryExecutiveController");

// Show all delivery executives for a branch
router.get("/show/:branchId", deliveryExecutiveController.showExecutives);

// Add new delivery executive page
router.get("/add/:branchId", deliveryExecutiveController.addExecutivePage);

// Create new delivery executive
router.post("/add/:branchId", deliveryExecutiveController.createExecutive);

// Edit delivery executive page
router.get(
  "/edit/:id/:branchId",
  deliveryExecutiveController.editExecutivePage
);

// Update delivery executive
router.post("/edit/:id/:branchId", deliveryExecutiveController.updateExecutive);

// DELETE confirmation page (GET request)
router.get(
  "/delete/:id/:branchId",
  deliveryExecutiveController.deleteExecutivePage
);

// Actual DELETE action (POST/DELETE request)
router.post(
  "/delete/:id/:branchId",
  deliveryExecutiveController.deleteExecutive
);
router.delete(
  "/delete/:id/:branchId",
  deliveryExecutiveController.deleteExecutive
);

// Export delivery executives
router.get("/export/:branchId", deliveryExecutiveController.exportExecutives);

module.exports = router;
