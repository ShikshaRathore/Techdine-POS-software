// routes/adminDashboardRoutes.js
const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/superAdminController");
const { isSuperAdmin } = require("../middleware");

router.get("/", isSuperAdmin, adminDashboardController.getDashboard);

router.get(
  "/restaurants",
  isSuperAdmin,
  adminDashboardController.getRestaurants
);

// POST - Add new restaurant
router.post("/restaurants/add", adminDashboardController.addRestaurant);

router.get(
  "/restaurant/:userId",
  isSuperAdmin,
  adminDashboardController.getRestaurantDetails
);

router.post(
  "/restaurant/:userId/extend-trial",
  isSuperAdmin,
  adminDashboardController.extendTrial
);

router.post(
  "/restaurant/:userId/toggle-status",
  isSuperAdmin,
  adminDashboardController.toggleRestaurantStatus
);

// Edit restaurant route
router.post(
  "/restaurants/edit/:userId",
  isSuperAdmin,
  adminDashboardController.updateRestaurant
);

router.get("/payments", isSuperAdmin, adminDashboardController.getPayments);
router.get("/packages", isSuperAdmin, adminDashboardController.getPackages);

// add package
router.post("/packages/add", isSuperAdmin, adminDashboardController.addPackage);
router.post(
  "/packages/update",
  isSuperAdmin,
  adminDashboardController.updatePackage
);
router.post(
  "/packages/delete/:id",
  isSuperAdmin,
  adminDashboardController.deletePackage
);

// Billing routes
router.get("/billing", isSuperAdmin, adminDashboardController.getBilling);

router.get(
  "/offline-request",
  isSuperAdmin,
  adminDashboardController.getOfflineRequest
);
router.get(
  "/landing-site",
  isSuperAdmin,
  adminDashboardController.getLandingSite
);
router.get("/settings", isSuperAdmin, adminDashboardController.getSettings);

module.exports = router;
