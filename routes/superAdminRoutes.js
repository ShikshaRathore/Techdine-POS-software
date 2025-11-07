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

// Edit restaurant route
router.put(
  "/edit-branch/:id",
  isSuperAdmin,
  adminDashboardController.updateRestaurant
);

module.exports = router;
