// controllers/appSettingsController.js
const AppSettings = require("../models/appSettings");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// Convert Cloudinary URL → public_id
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary")) return null;

  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;

  const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extension

  return publicId;
};

exports.updateAppSettings = async (req, res) => {
  try {
    const { appName, themeColor, removeLogo } = req.body;
    const settings = await AppSettings.findOne();

    if (!settings) {
      req.flash("error", "Settings not found");
      return res.redirect("/admin-dashboard/settings?tab=app");
    }

    // Update App Name
    if (appName?.trim()) {
      settings.appName = appName.trim();
    }

    // Update Theme Color
    if (themeColor) {
      settings.themeColor = themeColor;
    }

    // ===============================
    // DELETE LOGO (if remove flag true)
    // ===============================
    if (removeLogo === "true") {
      if (settings.appLogo?.url?.includes("cloudinary")) {
        const publicId = getPublicIdFromUrl(settings.appLogo.url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log("Deleted Cloudinary logo:", publicId);
          } catch (e) {
            console.error("Cloudinary delete error:", e);
          }
        }
      }

      settings.appLogo = {
        url: "/images/default-logo.png",
        filename: "default-logo.png",
      };
    }

    // ===============================
    // NEW LOGO UPLOAD
    // ===============================
    if (req.file?.path) {
      // Delete old Cloudinary logo
      if (settings.appLogo?.url?.includes("cloudinary")) {
        const publicId = getPublicIdFromUrl(settings.appLogo.url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log("Deleted old Cloudinary logo:", publicId);
          } catch (e) {
            console.error("Error deleting old image:", e);
          }
        }
      }

      // Save new logo (Cloudinary auto provides path + file name)
      settings.appLogo = {
        url: req.file.path,
        filename: req.file.filename || "",
      };
    }

    // Track modifier
    if (req.user?._id) {
      settings.lastModifiedBy = req.user._id;
    }

    settings.updatedAt = new Date();
    await settings.save();

    req.flash("success", "App settings updated successfully");
    return res.redirect("/admin-dashboard/settings?tab=app");
  } catch (error) {
    console.error("Update App Settings Error:", error);
    req.flash("error", "Failed to update app settings");
    return res.redirect("/admin-dashboard/settings?tab=app");
  }
};

const nodemailer = require("nodemailer"); // Add at top

// Update Email Settings
exports.updateEmailSettings = async (req, res) => {
  try {
    const {
      fromName,
      fromEmail,
      enableQueue,
      mailDriver,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpEncryption,
    } = req.body;

    const settings = await AppSettings.findOne();

    if (!settings) {
      req.flash("error", "Settings not found");
      return res.redirect("/admin-dashboard/settings?tab=email");
    }

    // Update email settings
    settings.emailSettings = {
      fromName: fromName?.trim() || settings.emailSettings.fromName,
      fromEmail: fromEmail?.trim() || settings.emailSettings.fromEmail,
      enableQueue: enableQueue === "true",
      mailDriver: mailDriver || settings.emailSettings.mailDriver,
      smtpHost: smtpHost?.trim() || settings.emailSettings.smtpHost,
      smtpPort: parseInt(smtpPort) || settings.emailSettings.smtpPort,
      smtpUsername: smtpUsername?.trim() || settings.emailSettings.smtpUsername,
      smtpPassword: smtpPassword || settings.emailSettings.smtpPassword,
      smtpEncryption: smtpEncryption || settings.emailSettings.smtpEncryption,
      smtpVerified: false, // Reset verification on update
    };

    // Track who made changes
    if (req.user && req.user._id) {
      settings.lastModifiedBy = req.user._id;
    }
    settings.updatedAt = new Date();

    await settings.save();

    req.flash("success", "Email settings updated successfully");
    res.redirect("/admin-dashboard/settings?tab=email");
  } catch (error) {
    console.error("Update Email Settings Error:", error);
    req.flash("error", "Failed to update email settings");
    res.redirect("/admin-dashboard/settings?tab=email");
  }
};

// Test SMTP Connection
exports.testSmtpConnection = async (req, res) => {
  try {
    const settings = await AppSettings.findOne();

    if (!settings || !settings.emailSettings) {
      return res.status(400).json({
        success: false,
        message: "Email settings not found",
      });
    }

    const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpEncryption } =
      settings.emailSettings;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpEncryption === "ssl",
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    // Verify connection
    await transporter.verify();

    // Update verification status
    settings.emailSettings.smtpVerified = true;
    await settings.save();

    res.json({
      success: true,
      message: "SMTP connection successful!",
    });
  } catch (error) {
    console.error("SMTP Test Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to connect to SMTP server",
    });
  }
};

// Update Language Settings
exports.updateLanguageSettings = async (req, res) => {
  try {
    const { languages } = req.body;
    const settings = await AppSettings.findOne();

    if (!settings) {
      req.flash("error", "Settings not found");
      return res.redirect("/admin-dashboard/settings?tab=language");
    }

    // Process languages array
    if (languages) {
      const updatedLanguages = [];

      // Handle both array and object formats
      const languagesArray = Array.isArray(languages)
        ? languages
        : Object.values(languages);

      languagesArray.forEach((lang) => {
        if (lang.code && lang.name) {
          updatedLanguages.push({
            code: lang.code.trim().toLowerCase(),
            name: lang.name.trim(),
            active: lang.active === "true" || lang.active === true,
            rtl: lang.rtl === "true" || lang.rtl === true,
          });
        }
      });

      settings.languages = updatedLanguages;
    }

    // Track who made changes
    if (req.user && req.user._id) {
      settings.lastModifiedBy = req.user._id;
    }
    settings.updatedAt = new Date();

    await settings.save();

    req.flash("success", "Language settings updated successfully");
    res.redirect("/admin-dashboard/settings?tab=language");
  } catch (error) {
    console.error("Update Language Settings Error:", error);
    req.flash("error", "Failed to update language settings");
    res.redirect("/admin-dashboard/settings?tab=language");
  }
};

// Delete Language
exports.deleteLanguage = async (req, res) => {
  try {
    const { code } = req.params;
    const settings = await AppSettings.findOne();

    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }

    // Remove language from array
    settings.languages = settings.languages.filter(
      (lang) => lang.code !== code
    );

    if (req.user && req.user._id) {
      settings.lastModifiedBy = req.user._id;
    }
    settings.updatedAt = new Date();

    await settings.save();

    res.json({ success: true, message: "Language deleted successfully" });
  } catch (error) {
    console.error("Delete Language Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete language" });
  }
};

// Update Payment Gateway Settings
exports.updatePaymentSettings = async (req, res) => {
  try {
    const {
      gateway, // razorpay, stripe, offline
      enabled,
      environment,
      testKey,
      testSecret,
      liveKey,
      liveSecret,
    } = req.body;

    const settings = await AppSettings.getSettings();

    if (gateway === "razorpay") {
      settings.paymentGateways.razorpay.enabled =
        enabled === "true" || enabled === true;
      settings.paymentGateways.razorpay.environment = environment || "TEST";
      if (testKey) settings.paymentGateways.razorpay.testKey = testKey;
      if (testSecret) settings.paymentGateways.razorpay.testSecret = testSecret;
      if (liveKey) settings.paymentGateways.razorpay.liveKey = liveKey;
      if (liveSecret) settings.paymentGateways.razorpay.liveSecret = liveSecret;
    } else if (gateway === "stripe") {
      settings.paymentGateways.stripe.enabled =
        enabled === "true" || enabled === true;
      settings.paymentGateways.stripe.environment = environment || "TEST";
      if (testKey) settings.paymentGateways.stripe.testPublishableKey = testKey;
      if (testSecret)
        settings.paymentGateways.stripe.testSecretKey = testSecret;
      if (liveKey) settings.paymentGateways.stripe.livePublishableKey = liveKey;
      if (liveSecret)
        settings.paymentGateways.stripe.liveSecretKey = liveSecret;
    }

    settings.lastModifiedBy = req.user._id;
    await settings.save();

    req.flash("success", "Payment gateway settings updated successfully");
    res.redirect("/admin-dashboard/settings?tab=payment");
  } catch (error) {
    console.error("Update Payment Settings Error:", error);
    req.flash("error", "Failed to update payment settings");
    res.redirect("/admin-dashboard/settings?tab=payment");
  }
};

// Update Push Notification Settings
exports.updatePushNotificationSettings = async (req, res) => {
  try {
    const { enabled, provider, instanceId, beamsSecret } = req.body;

    const settings = await AppSettings.getSettings();

    settings.pushNotifications.enabled = enabled === "true" || enabled === true;
    if (provider) settings.pushNotifications.provider = provider;

    if (provider === "pusher") {
      if (instanceId) settings.pushNotifications.pusher.instanceId = instanceId;
      if (beamsSecret)
        settings.pushNotifications.pusher.beamsSecret = beamsSecret;
    }

    settings.lastModifiedBy = req.user._id;
    await settings.save();

    req.flash("success", "Push notification settings updated successfully");
    res.redirect("/admin-dashboard/settings?tab=push");
  } catch (error) {
    console.error("Update Push Settings Error:", error);
    req.flash("error", "Failed to update push notification settings");
    res.redirect("/admin-dashboard/settings?tab=push");
  }
};

// Add Currency
exports.addCurrency = async (req, res) => {
  try {
    const { name, code, symbol, exchangeRate, isDefault } = req.body;

    const settings = await AppSettings.getSettings();

    // If this is set as default, unset other defaults
    if (isDefault === "true" || isDefault === true) {
      settings.currencies.forEach((currency) => {
        currency.isDefault = false;
      });
    }

    settings.currencies.push({
      name,
      code: code.toUpperCase(),
      symbol,
      exchangeRate: parseFloat(exchangeRate) || 1,
      isDefault: isDefault === "true" || isDefault === true,
      active: true,
    });

    settings.lastModifiedBy = req.user._id;
    await settings.save();

    req.flash("success", "Currency added successfully");
    res.redirect("/admin-dashboard/settings?tab=currencies");
  } catch (error) {
    console.error("Add Currency Error:", error);
    req.flash("error", "Failed to add currency");
    res.redirect("/admin-dashboard/settings?tab=currencies");
  }
};

// Update Currency
exports.updateCurrency = async (req, res) => {
  try {
    const { currencyId } = req.params;
    const { name, code, symbol, exchangeRate, isDefault } = req.body;

    const settings = await AppSettings.getSettings();
    const currency = settings.currencies.id(currencyId);

    if (!currency) {
      req.flash("error", "Currency not found");
      return res.redirect("/admin-dashboard/settings?tab=currencies");
    }

    // If this is set as default, unset other defaults
    if (isDefault === "true" || isDefault === true) {
      settings.currencies.forEach((curr) => {
        if (curr._id.toString() !== currencyId) {
          curr.isDefault = false;
        }
      });
    }

    currency.name = name || currency.name;
    currency.code = code ? code.toUpperCase() : currency.code;
    currency.symbol = symbol || currency.symbol;
    currency.exchangeRate = exchangeRate
      ? parseFloat(exchangeRate)
      : currency.exchangeRate;
    currency.isDefault = isDefault === "true" || isDefault === true;

    settings.lastModifiedBy = req.user._id;
    await settings.save();

    req.flash("success", "Currency updated successfully");
    res.redirect("/admin-dashboard/settings?tab=currencies");
  } catch (error) {
    console.error("Update Currency Error:", error);
    req.flash("error", "Failed to update currency");
    res.redirect("/admin-dashboard/settings?tab=currencies");
  }
};

// Delete Currency
exports.deleteCurrency = async (req, res) => {
  try {
    const { currencyId } = req.params;

    const settings = await AppSettings.getSettings();
    const currency = settings.currencies.id(currencyId);

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: "Currency not found",
      });
    }

    if (currency.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete default currency",
      });
    }

    settings.currencies.pull(currencyId);
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: "Currency deleted successfully",
    });
  } catch (error) {
    console.error("Delete Currency Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete currency",
    });
  }
};

// Get Settings API (for frontend use)
exports.getSettingsAPI = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();

    // Don't send sensitive information
    const publicSettings = {
      appName: settings.appName,
      appLogo: settings.appLogo,
      appFavicon: settings.appFavicon,
      themeColor: settings.themeColor,
      languages: settings.languages.filter((lang) => lang.active),
      currencies: settings.currencies.filter((currency) => currency.active),
      contactInfo: settings.contactInfo,
      socialMedia: settings.socialMedia,
    };

    res.json({
      success: true,
      data: publicSettings,
    });
  } catch (error) {
    console.error("Get Settings API Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};

module.exports = exports;
