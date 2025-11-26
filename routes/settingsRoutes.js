const express = require("express");
const router = express.Router({ mergeParams: true });
const settingsController = require("../controllers/settingsController");
const { isLoggedIn } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const Permission = require("../models/permission.js");

// Main settings route
router.get("/", isLoggedIn, settingsController.showSettings);

// Restaurant Information
router.post(
  "/restaurant-info",
  isLoggedIn,
  settingsController.updateRestaurantInfo
);

// App Settings
router.post("/app-settings", isLoggedIn, settingsController.updateAppSettings);

// Branch Settings
router.post("/branch/add", isLoggedIn, settingsController.addBranch);
router.put("/branch/:branchId", isLoggedIn, settingsController.updateBranch);
router.delete("/branch/:branchId", isLoggedIn, settingsController.deleteBranch);

// Currency Settings
router.post("/currency/add", isLoggedIn, settingsController.addCurrency);
router.put(
  "/currency/:currencyId",
  isLoggedIn,
  settingsController.updateCurrency
);
router.delete(
  "/currency/:currencyId",
  isLoggedIn,
  settingsController.deleteCurrency
);

// Email Settings
router.post(
  "/email-settings",
  isLoggedIn,
  settingsController.updateEmailSettings
);

// Tax Settings
router.post("/tax/add", isLoggedIn, settingsController.addTax);
router.put("/tax/:taxId", isLoggedIn, settingsController.updateTax);
router.delete("/tax/:taxId", isLoggedIn, settingsController.deleteTax);

// Payment Gateway Settings
router.post(
  "/payment-gateway",
  isLoggedIn,
  settingsController.updatePaymentGateway
);

router.post(
  "/theme",
  isLoggedIn,
  upload.single("logo"),
  settingsController.updateTheme
);

// ✅ NEW: Toggle single permission dynamically (used by frontend "+"/"-" button)
router.post("/permissions/update", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { role, section, action, value } = req.body;

    const validRoles = ["Branch-Head", "Chef", "Waiter"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updated = await Permission.findOneAndUpdate(
      { branch: branchId, role },
      { $set: { [`permissions.${section}.${action}`]: value } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Permission updated successfully",
      permission: updated,
    });
  } catch (error) {
    console.error("Error updating single permission:", error);
    res.status(500).json({
      success: false,
      message: "Error updating single permission",
    });
  }
});

// Reservation Slots Settings
router.post(
  "/reservation-slots",
  isLoggedIn,
  settingsController.updateReservationSlots
);

// About Us
router.post("/about-us", isLoggedIn, settingsController.updateAboutUs);
router.post(
  "/customer-site",
  isLoggedIn,
  settingsController.updateCustomerSiteSettings
);

module.exports = router;
