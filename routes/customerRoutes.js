// ============================================
// FILE: routes/customerRoutes.js
// ============================================
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/cutomerController");

// Show all customers for a branch
router.get("/show/:branchId", customerController.showCustomers);

// Create new customer
router.post("/create/:branchId", customerController.createCustomer);

// Update customer
router.post("/update/:branchId", customerController.updateCustomer);

// Delete customer
router.post("/delete/:branchId", customerController.deleteCustomer);

module.exports = router;
