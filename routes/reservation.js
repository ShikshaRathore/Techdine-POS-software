const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

// Page routes - branch-specific
router.get("/:branchId", reservationController.getReservationsPage);
router.get("/:id/view", reservationController.getReservation);

// API routes - with branch context
router.get("/areas/:areaId/tables", reservationController.getAreaTables);
router.post("/", reservationController.createReservation);
router.patch("/:id/cancel", reservationController.cancelReservation);
router.patch("/:id/complete", reservationController.completeReservation);

module.exports = router;
