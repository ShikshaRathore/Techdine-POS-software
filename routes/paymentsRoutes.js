const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  showPayments,
  duePayments,
} = require("../controllers/paymentsController");

// ✅ Show All Payments
router.get("/showPayments/:branchId", showPayments);

// ✅ Show Due Payments
router.get("/duePayments/:branchId", duePayments);

module.exports = router;
