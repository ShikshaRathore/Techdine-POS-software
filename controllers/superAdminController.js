const Branch = require("../models/branch");
const User = require("../models/user");
const Package = require("../models/package");

exports.getDashboard = (req, res) => {
  res.render("layouts/super-admin-dashboard", {
    page: "dashboard",
    title: "Dashboard",
    stats: {
      todayCount: 0,
      totalCount: 4,
      freeCount: 4,
      paidCount: 0,
    },
  });
};

exports.getRestaurants = async (req, res) => {
  try {
    // find all branches
    const branches = await Branch.find().populate("owner").lean();

    res.render("layouts/super-admin-dashboard", {
      page: "restaurants",
      title: "Restaurants",
      restaurants: branches, // sending branches to view
    });
  } catch (err) {
    console.log("Error fetching branches:", err);
    res.status(500).send("Internal Server Error");
  }
};

// exports.getRestaurants = (req, res) => {
//   res.render("layouts/super-admin-dashboard", {
//     page: "restaurants",
//     title: "Restaurants",
//     restaurants: [
//       { id: 1, name: "Restaurant A", status: "Active" },
//       { id: 2, name: "Restaurant B", status: "Inactive" },
//     ],
//   });
// };

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

exports.getBilling = async (req, res) => {
  try {
    // Get all Hotel-Admin users
    const users = await User.find({ role: "Hotel-Admin" }).sort({
      createdAt: -1,
    });

    const payments = users.map((user, index) => ({
      id: index + 1,
      restaurant: user.restaurantName || "-",
      package: "Default",
      cycle: "-",
      paymentDate: "-",
      nextPayment: "-",
      transactionId: "-",
      gateway: "offline",
      amount: "-",
    }));

    res.render("layouts/super-admin-dashboard", {
      page: "billing",
      title: "Billing",
      payments: payments,
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    res.render("layouts/super-admin-dashboard", {
      page: "billing",
      title: "Billing",
      payments: [],
    });
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

exports.getSettings = (req, res) => {
  res.render("layouts/super-admin-dashboard", {
    page: "settings",
    title: "Settings",
    currentTab: req.query.tab || "app",
    appSettings: {
      /* same */
    },
    emailSettings: {
      /* same */
    },
    languages: [
      /* same */
    ],
    paymentGateways: {
      /* same */
    },
    pushNotifications: {
      /* same */
    },
    currencies: [
      /* same */
    ],
  });
};

// Update Restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    // Debug logs
    console.log("Session exists:", !!req.session);
    console.log("Session user:", req.user);
    console.log("User role:", req.user?.role);
    const { id } = req.params;
    const { branchName, ownerEmail, isActive } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    const currentUser = req.user;

    // Check if user is superAdmin
    if (currentUser.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin can edit restaurants.",
      });
    }

    const branch = await Branch.findById(id).populate("owner");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // If email is being changed, check if the new email exists and update owner
    if (ownerEmail && ownerEmail !== branch.owner?.email) {
      const newOwner = await User.findOne({ email: ownerEmail });
      if (!newOwner) {
        return res.status(404).json({
          success: false,
          message: "User with this email not found",
        });
      }

      branch.owner = newOwner._id;
    }

    // Update branch details
    if (branchName) branch.branchName = branchName;
    if (typeof isActive !== "undefined") branch.isActive = isActive;

    await branch.save();

    // Populate owner details for response
    await branch.populate("owner");

    res.json({
      success: true,
      message: "Restaurant updated successfully",
      branch: {
        _id: branch._id,
        branchName: branch.branchName,
        isActive: branch.isActive,
        owner: {
          _id: branch.owner._id,
          email: branch.owner.email,
        },
      },
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};
