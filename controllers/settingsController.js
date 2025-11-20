const Branch = require("../models/branch");
const User = require("../models/user");
const Permission = require("../models/permission"); // ✅ Import permission model
const Package = require("../models/package");
const UserSubscription = require("../models/userSubscription");
const Purchase = require("../models/purchase");
const OfflineRequest = require("../models/offlineRequest");
const ReservationSlot = require("../models/reservationSlot");
const CustomerSiteSettings = require("../models/customerSiteSetting");
const Currency = require("../models/currency");
const Tax = require("../models/tax");

// ============================================
// SHOW SETTINGS - Main Settings Page
// ============================================
module.exports.showSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await Branch.findById(branchId)
      .populate("owner")
      .populate("currency");

    if (!branch) {
      req.flash("error", "Branch not found");
      return res.redirect("/dashboard");
    }

    if (req.user.constructor.modelName === "Staff") {
      // staff → only their assigned branch
      allBranches = [await Branch.findById(req.user.branch)];
    } else {
      // admin → all branches they own
      allBranches = await Branch.find({ owner: req.user._id });
    }
    const user = await User.findById(req.user._id);
    const hotelAdmin = branch.owner;

    // Fetch permissions
    const allPermissions = await Permission.find({ branch: branchId });
    const permissionsByRole = {};
    allPermissions.forEach((p) => {
      permissionsByRole[p.role] = p.permissions;
    });

    const roles = ["Branch Head", "Chef", "Waiter"];
    roles.forEach((r) => {
      if (!permissionsByRole[r]) permissionsByRole[r] = {};
    });

    // Default email notifications
    if (!branch.emailNotifications) {
      branch.emailNotifications = {
        newOrderReceived: true,
        reservationConfirmation: true,
        newReservationReceived: true,
        orderBill: true,
        staffWelcomeEmail: true,
      };
    }

    // Default payment gateways
    if (!branch.paymentGateways) {
      branch.paymentGateways = {
        razorpay: { enabled: false, keyId: "", keySecret: "" },
        stripe: { enabled: false, publicKey: "", secretKey: "" },
      };
    }

    // ✅ BILLING DATA
    const userId = req.user._id;
    const currentSubscription = await UserSubscription.findOne({
      userId,
      status: { $in: ["active", "trial"] },
    })
      .populate("packageId")
      .sort({ createdAt: -1 })
      .limit(1);

    const currentPackage = currentSubscription
      ? currentSubscription.packageId
      : null;

    const purchaseHistory = await Purchase.find({ userId })
      .populate("packageId")
      .sort({ createdAt: -1 })
      .limit(50);

    const offlineRequests = await OfflineRequest.find({ userId })
      .populate("packageId")
      .sort({ createdAt: -1 });

    // ✅ RESERVATION SLOTS DATA
    const reservationSlots = await ReservationSlot.find({ branch: branchId });

    // ✅ CUSTOMER SITE SETTINGS DATA
    const customerSiteSettings = await CustomerSiteSettings.getOrCreate(
      branchId
    );
    const currencies = await Currency.find();
    const taxes = await Tax.find({ branch: branchId });

    res.render("dashboard/settings/showSettings", {
      branch,
      allBranches,
      hotelAdmin,
      user,
      branchId,
      permissions: permissionsByRole,
      currentPackage,
      currentSubscription,
      purchaseHistory,
      offlineRequests,
      reservationSlots,
      customerSiteSettings,
      currencies,
      taxes, // ✅ Add this
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    req.flash("error", "Error loading settings");
    res.redirect(`/dashboard/${req.params.branchId}?section=${sectionName}`);
  }
};

// ============================================
// CUSTOMER SITE SETTINGS
// ============================================

// Update Customer Site Settings
module.exports.updateCustomerSiteSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const {
      requireLogin,
      allowOrders,
      allowDelivery,
      allowPickup,
      enableWaiterRequest,
      defaultReservationStatus,
      minOrderAmount,
      deliveryRadius,
      deliveryCharges,
    } = req.body;

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found");
      return res.redirect("/dashboard");
    }

    // Prepare update data
    const updateData = {
      branch: branchId,
      requireLogin: requireLogin === "on",
      allowOrders: allowOrders === "on",
      allowDelivery: allowDelivery === "on",
      allowPickup: allowPickup === "on",
      enableWaiterRequest: enableWaiterRequest === "on",
      defaultReservationStatus: defaultReservationStatus || "Confirmed",
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      deliveryRadius: parseFloat(deliveryRadius) || 0,
      deliveryCharges: parseFloat(deliveryCharges) || 0,
    };

    // Validation: At least one order type should be enabled if orders are allowed
    if (
      updateData.allowOrders &&
      !updateData.allowDelivery &&
      !updateData.allowPickup
    ) {
      req.flash(
        "error",
        "Please enable at least one order type (Delivery or Pickup)"
      );
      return res.redirect(`/dashboard`);
    }

    // Update or create settings using findOneAndUpdate with upsert
    await CustomerSiteSettings.findOneAndUpdate(
      { branch: branchId },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    req.flash("success", "Customer site settings updated successfully");
    res.redirect(`/dashboard`);
  } catch (error) {
    console.error("Error updating customer site settings:", error);
    req.flash("error", "Error updating customer site settings");
    res.redirect(`/dashboard`);
  }
};

module.exports.updateReservationSlots = async (req, res) => {
  try {
    const { branchId } = req.params;
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // Process each day
    for (const day of days) {
      const slots = [];

      // Process Breakfast
      const breakfastData = {
        type: "Breakfast",
        startTime: req.body[`${day}_breakfast_startTime`] || "08:00",
        endTime: req.body[`${day}_breakfast_endTime`] || "11:00",
        slotDuration: parseInt(req.body[`${day}_breakfast_slotDuration`]) || 30,
        available: req.body[`${day}_breakfast_available`] === "on",
      };
      slots.push(breakfastData);

      // Process Lunch
      const lunchData = {
        type: "Lunch",
        startTime: req.body[`${day}_lunch_startTime`] || "12:00",
        endTime: req.body[`${day}_lunch_endTime`] || "17:00",
        slotDuration: parseInt(req.body[`${day}_lunch_slotDuration`]) || 60,
        available: req.body[`${day}_lunch_available`] === "on",
      };
      slots.push(lunchData);

      // Process Dinner
      const dinnerData = {
        type: "Dinner",
        startTime: req.body[`${day}_dinner_startTime`] || "18:00",
        endTime: req.body[`${day}_dinner_endTime`] || "22:00",
        slotDuration: parseInt(req.body[`${day}_dinner_slotDuration`]) || 60,
        available: req.body[`${day}_dinner_available`] === "on",
      };
      slots.push(dinnerData);

      // Update or create slot for this day
      await ReservationSlot.findOneAndUpdate(
        { branch: branchId, day },
        { branch: branchId, day, slots },
        { upsert: true, new: true }
      );
    }

    req.flash("success", "Reservation slots updated successfully");
    res.redirect(`/dashboard/${branchId}/settings`);
  } catch (error) {
    console.error("Error updating reservation slots:", error);
    req.flash("error", "Error updating reservation slots");
    res.redirect(`/dashboard/${branchId}/settings`);
  }
};

module.exports.updateRestaurantInfo = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { restaurantName, phone, email, address } = req.body;

    // Update user restaurant name
    await User.findByIdAndUpdate(req.user._id, { restaurantName });

    // Update branch info
    await Branch.findByIdAndUpdate(branchId, {
      phone,
      email,
      address,
    });

    req.flash("success", "Restaurant information updated successfully");
    res.redirect(`/dashboard/${branchId}/settings`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating restaurant information");
    res.redirect(`/dashboard/${branchId}/settings`);
  }
};

module.exports.updateAppSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { country, timezone, currency } = req.body;

    await Branch.findByIdAndUpdate(branchId, {
      country,
      timezone,
      currency,
    });

    req.flash("success", "App settings updated successfully");
    res.redirect(`/dashboard/${branchId}/settings`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating app settings");
    res.redirect(`/dashboard/${req.params.branchId}/settings`);
  }
};

module.exports.addBranch = async (req, res) => {
  try {
    const { branchName, address } = req.body;
    const mainBranch = await Branch.findById(req.params.branchId);

    const newBranch = new Branch({
      branchName,
      address,
      country: mainBranch.country,
      owner: req.user._id,
    });

    await newBranch.save();
    req.flash("success", "Branch added successfully");
    res.redirect(`/dashboard/${req.params.branchId}/settings`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error adding branch");
    res.redirect(`/dashboard/${req.params.branchId}/settings`);
  }
};

module.exports.updateBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { branchName, address } = req.body;

    await Branch.findByIdAndUpdate(req.params.branchId, {
      branchName,
      address,
    });

    req.flash("success", "Branch updated successfully");
    res.redirect(`/dashboard/${branchId}/settings`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating branch");
    res.redirect(`/dashboard/${req.params.branchId}/settings`);
  }
};

module.exports.deleteBranch = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.branchId);
    req.flash("success", "Branch deleted successfully");
    res.redirect(`/dashboard/${req.params.branchId}/settings`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error deleting branch");
    res.redirect(`/dashboard/${req.params.branchId}/settings`);
  }
};

module.exports.addCurrency = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, symbol, code } = req.body;

    // 1️⃣ Create new currency in Currency collection
    const newCurrency = await Currency.create({
      name,
      symbol,
      code,
    });

    req.flash("success", "Currency added successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error adding currency");
    res.redirect(`/dashboard`);
  }
};

module.exports.updateCurrency = async (req, res) => {
  try {
    const { branchId, currencyId } = req.params;
    const { name, symbol, code } = req.body;

    // Update Currency document
    await Currency.findByIdAndUpdate(currencyId, {
      name,
      symbol,
      code,
    });

    req.flash("success", "Currency updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Update Currency Error:", error);
    req.flash("error", "Error updating currency");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.deleteCurrency = async (req, res) => {
  try {
    const { branchId, currencyId } = req.params;

    // Check if this currency is currently assigned to ANY branch
    const inUse = await Branch.findOne({ currency: currencyId });

    if (inUse) {
      req.flash(
        "error",
        "Cannot delete: This currency is currently used by a branch."
      );
      return res.redirect(`/dashboard/${branchId}/settings`);
    }

    // Safe to delete
    await Currency.findByIdAndDelete(currencyId);

    req.flash("success", "Currency deleted successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Delete Currency Error:", error);
    req.flash("error", "Error deleting currency");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.updateEmailSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const {
      newOrderReceived,
      reservationConfirmation,
      newReservationReceived,
      orderBill,
      staffWelcomeEmail,
    } = req.body;

    await Branch.findByIdAndUpdate(branchId, {
      emailNotifications: {
        newOrderReceived: newOrderReceived === "on",
        reservationConfirmation: reservationConfirmation === "on",
        newReservationReceived: newReservationReceived === "on",
        orderBill: orderBill === "on",
        staffWelcomeEmail: staffWelcomeEmail === "on",
      },
    });

    req.flash("success", "Email settings updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating email settings");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.addTax = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, percentage } = req.body;

    const newTax = await Tax.create({
      name,
      percentage: Number(percentage),
      branch: branchId,
    });

    await Branch.findByIdAndUpdate(branchId, {
      $push: { tax: newTax._id },
    });

    req.flash("success", "Tax added successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error adding tax:", error);
    req.flash("error", "Error adding tax");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.updateTax = async (req, res) => {
  try {
    const { branchId, taxId } = req.params;
    const { name, percentage } = req.body;

    await Tax.findByIdAndUpdate(taxId, {
      name,
      percentage: Number(percentage),
    });

    req.flash("success", "Tax updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error updating tax:", error);
    req.flash("error", "Error updating tax");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.deleteTax = async (req, res) => {
  try {
    const { branchId, taxId } = req.params;

    await Tax.findByIdAndDelete(taxId);

    await Branch.findByIdAndUpdate(branchId, {
      $pull: { tax: taxId },
    });

    req.flash("success", "Tax deleted successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error deleting tax:", error);
    req.flash("error", "Error deleting tax");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.updatePaymentGateway = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { gateway, enabled, key, secret } = req.body;

    const updateData = {};
    updateData[`paymentGateways.${gateway}.enabled`] = enabled === "on";

    if (key)
      updateData[
        `paymentGateways.${gateway}.${
          gateway === "razorpay" ? "keyId" : "publicKey"
        }`
      ] = key;
    if (secret)
      updateData[
        `paymentGateways.${gateway}.${
          gateway === "razorpay" ? "keySecret" : "secretKey"
        }`
      ] = secret;

    await Branch.findByIdAndUpdate(branchId, updateData);

    req.flash("success", "Payment gateway settings updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating payment gateway settings");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

module.exports.updateTheme = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { primaryColor } = req.body;

    const updateData = {
      "theme.primaryColor": primaryColor,
    };

    // Handle logo upload if present
    if (req.file) {
      updateData["theme.logo"] = req.file.path;
    }

    await Branch.findByIdAndUpdate(branchId, updateData);

    req.flash("success", "Theme settings updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating theme settings");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

//--------------------- Billing ------------------------

// API endpoint to delete offline request
exports.deleteOfflineRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await OfflineRequest.findOne({
      _id: requestId,
      userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or cannot be deleted",
      });
    }

    await OfflineRequest.findByIdAndDelete(requestId);

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Delete offline request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Helper function to create trial subscription for new users
exports.createTrialSubscription = async (userId, trialPackageId) => {
  try {
    const trialPackage = await Package.findById(trialPackageId);

    if (!trialPackage || !trialPackage.isTrial) {
      throw new Error("Invalid trial package");
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialPackage.trialDays);

    const subscription = await UserSubscription.create({
      userId,
      packageId: trialPackageId,
      status: "trial",
      billingCycle: "monthly", // Default for trial
      startDate: new Date(),
      endDate,
      autoRenew: false,
      isTrialUsed: true,
    });

    // Create purchase record for trial
    await Purchase.create({
      userId,
      packageId: trialPackageId,
      packageName: trialPackage.name,
      billingCycle: "monthly",
      paymentDate: new Date(),
      nextPaymentDate: endDate,
      transactionId: `TRIAL-${Date.now()}`,
      paymentGateway: "free",
      amount: 0,
      status: "completed",
    });

    return subscription;
  } catch (error) {
    console.error("Create trial subscription error:", error);
    throw error;
  }
};

// ============================================
// ABOUT US
// ============================================

module.exports.updateAboutUs = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { aboutUs } = req.body;

    await Branch.findByIdAndUpdate(branchId, {
      aboutUs: aboutUs,
    });

    req.flash("success", "About Us updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error updating About Us:", error);
    req.flash("error", "Error updating About Us");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};
