// routes/appSettingsRoutes.js

const express = require("express");
const router = express.Router();
const { isLoggedIn, isSuperAdmin } = require("../middleware");
const appSettingController = require("../controllers/appSettingController");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// All routes require super admin authentication
router.use(isSuperAdmin);

// POST: Update App Settings
router.post(
  "/app",
  isLoggedIn, // Your authentication middleware
  isSuperAdmin, // Your admin authorization middleware
  upload.single("logo"), // Handle single file upload with field name "logo"
  appSettingController.updateAppSettings
);
// POST: Update Email Settings
router.post("/email", appSettingController.updateEmailSettings);

// POST: Test SMTP Connection
router.post("/email/test-smtp", appSettingController.testSmtpConnection);

// POST: Update Language Settings
router.post("/language", appSettingController.updateLanguageSettings);

router.delete("/language/:code", appSettingController.deleteLanguage);

// POST: Update Payment Gateway Settings
router.post("/payment", appSettingController.updatePaymentSettings);

// POST: Update Push Notification Settings
router.post("/push", appSettingController.updatePushNotificationSettings);

// POST: Add Currency
router.post("/currencies/add", appSettingController.addCurrency);

// POST: Update Currency
router.post(
  "/currencies/update/:currencyId",
  appSettingController.updateCurrency
);

// DELETE: Delete Currency
router.delete(
  "/currencies/delete/:currencyId",
  appSettingController.deleteCurrency
);

module.exports = router;
