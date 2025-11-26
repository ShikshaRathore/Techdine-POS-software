const Branch = require("../models/branch");
const User = require("../models/user");
const Purchase = require("../models/purchase");
const Package = require("../models/package");
const Order = require("../models/order");
const AppSettings = require("../models/appSettings");

exports.getDashboard = async (req, res) => {
  try {
    const appSettings = await AppSettings.getSettings();

    res.render("layouts/super-admin-dashboard", {
      page: "dashboard",
      title: "Dashboard",
      appSettings,
      stats: {
        todayCount: 0,
        totalCount: 4,
        freeCount: 4,
        paidCount: 0,
      },
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Server Error");
  }
};

exports.getRestaurants = async (req, res) => {
  try {
    // Find all users with role "Hotel-Admin" (restaurants)
    const restaurants = await User.find({ role: "Hotel-Admin" })
      .sort({ createdAt: -1 })
      .lean();

    res.render("layouts/super-admin-dashboard", {
      page: "restaurants",
      title: "Restaurants",
      restaurants: restaurants, // sending users to view
    });
  } catch (err) {
    console.log("Error fetching restaurants:", err);
    res.status(500).send("Internal Server Error");
  }
};

// POST - Add new restaurant
exports.addRestaurant = async (req, res) => {
  try {
    const { restaurantName, username, email, password, isActive } = req.body;

    // Validation
    if (!restaurantName || !username || !email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/admin-dashboard/restaurants");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash("error", "Email already exists");
      return res.redirect("/admin-dashboard/restaurants");
    }

    // Create new user with restaurant details
    const newUser = new User({
      restaurantName: restaurantName.trim(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      role: "Hotel-Admin",
      isActive: isActive === true || isActive === "true",
    });

    // Register user with password (passport-local-mongoose handles hashing)
    await User.register(newUser, password);

    req.flash("success", "Restaurant added successfully!");
    res.redirect("/admin-dashboard/restaurants");
  } catch (error) {
    console.error("Error adding restaurant:", error);

    // Handle specific mongoose errors
    if (error.name === "ValidationError") {
      req.flash("error", "Validation error: " + error.message);
      return res.redirect("/admin-dashboard/restaurants");
    }

    req.flash("error", "Error adding restaurant. Please try again.");
    res.redirect("/admin-dashboard/restaurants");
  }
};

exports.getPayments = (req, res) => {
  res.render("layouts/super-admin-dashboard", {
    page: "payments",
    title: "Payments",
    payments: [
      /* same data you wrote */
    ],
  });
};

exports.getPackages = async (req, res) => {
  const packages = await Package.find().lean();
  res.render("layouts/super-admin-dashboard", {
    page: "packages",
    title: "Packages",
    packages,
  });
};

exports.addPackage = async (req, res) => {
  try {
    const {
      name,
      monthlyPrice,
      annualPrice,
      lifetimePrice,
      isRecommended,
      isTrial,
      trialDays,
      isPrivate,
    } = req.body;

    await Package.create({
      name,
      monthlyPrice,
      annualPrice,
      lifetimePrice,
      isRecommended: isRecommended === "on",
      isTrial: isTrial === "on",
      trialDays: trialDays || 0,
      isPrivate: isPrivate === "on",
      modules: req.body.modules || [],
    });

    res.redirect("/admin-dashboard/packages");
  } catch (err) {
    console.log(err);
    res.send("Error adding package");
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const id = req.body.packageId;

    await Package.findByIdAndUpdate(id, {
      name: req.body.name,
      monthlyPrice: req.body.monthlyPrice || null,
      annualPrice: req.body.annualPrice || null,
      lifetimePrice: req.body.lifetimePrice || null,
      isRecommended: req.body.isRecommended === "on",
      isTrial: req.body.isTrial === "on",
      trialDays: req.body.trialDays || 0,
      isPrivate: req.body.isPrivate === "on",
      modules: Array.isArray(req.body.modules) ? req.body.modules : [],
    });

    res.redirect("/admin-dashboard/packages");
  } catch (err) {
    console.log(err);
    res.send("update error");
  }
};

exports.deletePackage = async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.redirect("/admin-dashboard/packages");
  } catch (err) {
    console.log(err);
    res.send("delete error");
  }
};

// Billing page with restaurant details - shows specific restaurant
exports.getBilling = async (req, res) => {
  try {
    // Get all Hotel-Admin users with their purchases
    const users = await User.find({ role: "Hotel-Admin" }).sort({
      createdAt: -1,
    });

    // Fetch all purchases and populate package details
    const allPurchases = await Purchase.find()
      .populate("userId", "restaurantName email")
      .populate("packageId")
      .sort({ createdAt: -1 });

    // Create a map of userId to their latest purchase
    const userPurchaseMap = {};
    allPurchases.forEach((purchase) => {
      const userId = purchase.userId?._id.toString();
      if (userId && !userPurchaseMap[userId]) {
        userPurchaseMap[userId] = purchase;
      }
    });

    // Map users to payment data
    const payments = users.map((user, index) => {
      const purchase = userPurchaseMap[user._id.toString()];

      return {
        id: index + 1,
        userId: user._id,
        restaurant: user.restaurantName || "-",
        package: purchase?.packageName || "Default",
        packageId: purchase?.packageId?._id,
        isTrial: purchase?.packageId?.isTrial || false,
        isLifetime: purchase?.billingCycle === "lifetime",
        cycle: purchase?.billingCycle
          ? purchase.billingCycle.charAt(0).toUpperCase() +
            purchase.billingCycle.slice(1)
          : "-",
        paymentDate: purchase?.paymentDate
          ? new Date(purchase.paymentDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "-",
        nextPayment: purchase?.nextPaymentDate
          ? new Date(purchase.nextPaymentDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "-",
        transactionId: purchase?.transactionId || "-",
        gateway: purchase?.paymentGateway || "offline",
        amount: purchase?.amount ? `$${purchase.amount.toFixed(2)}` : "-",
        currency: purchase?.currency || "USD",
        status: purchase?.status || "pending",
      };
    });

    res.render("layouts/super-admin-dashboard", {
      page: "billing",
      title: "Billing",
      payments: payments,
      showRestaurantDetails: false,
      restaurant: null,
      branches: [],
      purchases: [],
      currentPackage: null,
      currentPurchase: null,
      trialExpiresOn: null,
      totalOrders: 0,
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    res.render("layouts/super-admin-dashboard", {
      page: "billing",
      title: "Billing",
      payments: [],
      showRestaurantDetails: false,
      restaurant: null,
      branches: [],
      purchases: [],
      currentPackage: null,
      currentPurchase: null,
      trialExpiresOn: null,
      totalOrders: 0,
    });
  }
};

// Billing page with restaurant details - shows specific restaurant
exports.getRestaurantDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("=== Restaurant Details Route ===");
    console.log("userId:", userId);

    // 1. Fetch restaurant owner (Hotel-Admin)
    const restaurant = await User.findById(userId).lean(); // Use .lean() for easier manipulation later

    if (!restaurant) {
      req.flash("error", "Restaurant not found");
      return res.redirect("/admin-dashboard/billing");
    }

    // 2. Fetch all branches for this restaurant
    const branches = await Branch.find({ owner: userId }).lean();
    const branchIds = branches.map((b) => b._id); // Get IDs for aggregation

    // 3. Count total orders for each branch using the Order model
    const orderCounts = await Order.aggregate([
      {
        // Match orders belonging to any branch ID under this restaurant
        $match: {
          branch: { $in: branchIds },
        },
      },
      {
        // Group by branch ID and count the documents
        $group: {
          _id: "$branch",
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 4. Create a map for quick lookup: { branchId: totalOrders }
    const orderMap = orderCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.totalOrders;
      return acc;
    }, {});

    // 5. Merge order counts back into the branches array
    const branchesWithOrders = branches.map((branch) => {
      const branchIdString = branch._id.toString();

      return {
        ...branch,
        // Attach the actual calculated total, defaulting to 0
        totalOrders: orderMap[branchIdString] || 0,
      };
    });

    // Fetch all purchases/payments
    const purchases = await Purchase.find({ userId: userId })
      .populate("packageId")
      .sort({ createdAt: -1 });

    // Get current active package (logic remains the same)
    const currentPurchase = purchases.find(
      (p) =>
        p.status === "completed" &&
        (!p.nextPaymentDate || p.nextPaymentDate > new Date())
    );

    let currentPackage = null;
    let trialExpiresOn = null;

    if (currentPurchase) {
      currentPackage = await Package.findById(currentPurchase.packageId);

      if (currentPackage && currentPackage.isTrial) {
        trialExpiresOn = new Date(currentPurchase.paymentDate);
        trialExpiresOn.setDate(
          trialExpiresOn.getDate() + currentPackage.trialDays
        );
      }
    }

    // Count total orders across all branches (no longer needed, but kept for legacy)
    const totalOrders = branchesWithOrders.reduce(
      (sum, branch) => sum + (branch.totalOrders || 0),
      0
    );

    // Render using the layout system with billing page
    res.render("layouts/super-admin-dashboard", {
      page: "billing",
      title: `Billing - ${restaurant.restaurantName}`,
      payments: [],
      showRestaurantDetails: true,
      restaurant: restaurant,
      branches: branchesWithOrders, // <--- Use the array with actual order counts
      purchases: purchases,
      currentPackage: currentPackage,
      currentPurchase: currentPurchase,
      trialExpiresOn: trialExpiresOn,
      totalOrders: totalOrders, // This now reflects the sum of actual orders
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    req.flash("error", "Error loading restaurant details");
    res.redirect("/admin-dashboard/billing");
  }
};

// Extend trial functionality
exports.extendTrial = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from restaurantId to userId
    const { days } = req.body;

    const currentPurchase = await Purchase.findOne({
      userId: userId, // Changed from restaurantId
      status: "completed",
    })
      .populate("packageId")
      .sort({ createdAt: -1 });

    if (!currentPurchase || !currentPurchase.packageId.isTrial) {
      req.flash("error", "No active trial found");
      return res.redirect(`/admin-dashboard/restaurant/${userId}`); // Changed redirect
    }

    const newExpirationDate = new Date(
      currentPurchase.nextPaymentDate || currentPurchase.paymentDate
    );
    newExpirationDate.setDate(newExpirationDate.getDate() + parseInt(days));

    currentPurchase.nextPaymentDate = newExpirationDate;
    await currentPurchase.save();

    req.flash("success", `Trial extended by ${days} days`);
    res.redirect(`/admin-dashboard/restaurant/${userId}`); // Changed redirect
  } catch (error) {
    console.error("Error extending trial:", error);
    req.flash("error", "Error extending trial");
    res.redirect(`/admin-dashboard/billing`);
  }
};

// Toggle restaurant status
exports.toggleRestaurantStatus = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from restaurantId to userId

    const restaurant = await User.findById(userId); // Changed from restaurantId
    if (!restaurant) {
      req.flash("error", "Restaurant not found");
      return res.redirect("/admin-dashboard/billing");
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    req.flash(
      "success",
      `Restaurant ${
        restaurant.isActive ? "activated" : "deactivated"
      } successfully`
    );
    res.redirect(`/admin-dashboard/restaurant/${userId}`); // Changed redirect
  } catch (error) {
    console.error("Error toggling restaurant status:", error);
    req.flash("error", "Error updating restaurant status");
    res.redirect(`/admin-dashboard/billing`);
  }
};

exports.getOfflineRequest = (req, res) => {
  res.render("layouts/super-admin-dashboard", {
    page: "offline-request",
    title: "Offline Request",
  });
};

exports.getLandingSite = (req, res) => {
  res.render("layouts/super-admin-dashboard", {
    page: "landing-site",
    title: "Landing Site",
  });
};

exports.getSettings = async (req, res) => {
  try {
    // Ensure admin is logged in
    if (!req.user) {
      return res.redirect("/superadmin/login");
    }

    // Get the logged-in super admin details
    const superAdmin = req.user;

    // Get actual DB AppSettings document
    const settings = await AppSettings.getSettings();

    res.render("layouts/super-admin-dashboard", {
      page: "settings",
      title: "Settings",
      currentTab: req.query.tab || "app",

      // NEW: Passing super admin info to EJS
      superAdmin,

      // OLD: AppSettings data
      appSettings: settings,
      emailSettings: settings.emailSettings,
      languages: settings.languages,
      paymentGateways: settings.paymentGateways,
      pushNotifications: settings.pushNotifications,
      currencies: settings.currencies,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading settings");
  }
};

// PUT - Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from 'id' to 'userId'
    const { restaurantName, username, email, isActive } = req.body;

    // Validation
    if (!restaurantName || !username || !email) {
      req.flash("error", "All fields are required");
      return res.redirect("/admin-dashboard/restaurants");
    }

    // Get the current user to check if email is actually changing
    const currentUser = await User.findById(userId); // Changed to userId

    if (!currentUser) {
      req.flash("error", "Restaurant not found");
      return res.redirect("/admin-dashboard/restaurants");
    }

    // Only check for duplicate email if the email is being changed
    if (currentUser.email !== email.toLowerCase()) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        req.flash("error", "Email already exists");
        return res.redirect("/admin-dashboard/restaurants");
      }
    }

    // Update restaurant
    const updatedUser = await User.findByIdAndUpdate(
      userId, // Changed to userId
      {
        restaurantName: restaurantName.trim(),
        username: username.trim(),
        email: email.toLowerCase().trim(),
        isActive: isActive === true || isActive === "true",
      },
      { new: true, runValidators: true }
    );

    req.flash("success", "Restaurant updated successfully!");
    res.redirect("/admin-dashboard/restaurants");
  } catch (error) {
    console.error("Error updating restaurant:", error);

    if (error.name === "ValidationError") {
      req.flash("error", "Validation error: " + error.message);
      return res.redirect("/admin-dashboard/restaurants");
    }

    req.flash("error", "Error updating restaurant. Please try again.");
    res.redirect("/admin-dashboard/restaurants");
  }
};
