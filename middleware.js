const mongoose = require("mongoose");
const Order = require("./models/order.js");
const Reservation = require("./models/reservation.js");
const WaiterRequest = require("./models/waiterRequest.js");
const AppSettings = require("./models/appSettings.js");

const TableSession = require("./models/tableSession");
const Table = require("./models/table");

// 🔹 Middleware 1: Auth check
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in!");
    return res.redirect("/login");
  }
  next();
};

// Middleware to check if user is superAdmin
const isSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      req.flash("error", "Please login to continue");
      return res.redirect("/login");
    }

    if (req.user.role !== "superadmin") {
      req.flash("error", "Access denied. Super Admin privileges required.");
      return res.redirect("/admin-dashboard");
    }

    next();
  } catch (error) {
    console.error("Super Admin Middleware Error:", error);
    req.flash("error", "Authorization error occurred");
    res.redirect("/admin-dashboard");
  }
};

// 🔹 Middleware 2: Attach statistics
const attachStatistics = async (req, res, next) => {
  res.locals.statistics = null;
  res.locals.todayOrders = [];

  try {
    const branchId = req.params.branchId; // ✅ Match the route parameter name
    if (!branchId) return next();

    // 🔥 FIX: Convert string to ObjectId
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      console.error("Invalid branch ID format:", branchId);
      return next();
    }

    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
    const firstDayOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );

    const todayOrders =
      (await Order.find({
        branch: branchObjectId, // ✅ Changed
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: "cancelled" },
      }).lean()) || [];

    const todayEarnings = todayOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    // ✅ ADD THIS: Count today's reservations
    const todayReservations = await Reservation.countDocuments({
      branch: branchObjectId,
      reservationDate: { $gte: today, $lt: tomorrow },
      status: { $in: ["Confirmed", "Completed"] },
    });

    // Count pending waiter requests
    const waiterRequestsCount = await WaiterRequest.countDocuments({
      branch: branchObjectId,
      status: "Pending",
    });

    const yesterdayOrders =
      (await Order.find({
        branch: branchObjectId, // ✅ Changed
        createdAt: { $gte: yesterday, $lt: today },
        status: { $ne: "cancelled" },
      }).lean()) || [];

    const yesterdayEarnings = yesterdayOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    const todayCustomers = [
      ...new Set(todayOrders.map((o) => o.customer?.toString())),
    ].filter(Boolean).length;
    const yesterdayCustomers = [
      ...new Set(yesterdayOrders.map((o) => o.customer?.toString())),
    ].filter(Boolean).length;

    const thisMonthOrders =
      (await Order.find({
        branch: branchObjectId, // ✅ Changed
        createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        status: { $ne: "cancelled" },
      }).lean()) || [];

    const thisMonthSales = thisMonthOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    const lastMonthOrders =
      (await Order.find({
        branch: branchObjectId, // ✅ Changed
        createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
        status: { $ne: "cancelled" },
      }).lean()) || [];

    const lastMonthSales = lastMonthOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    const daysInMonth = today.getDate();
    const avgDailyEarnings = daysInMonth > 0 ? thisMonthSales / daysInMonth : 0;

    const daysInLastMonth = lastDayOfLastMonth.getDate();
    const lastMonthAvg =
      daysInLastMonth > 0 ? lastMonthSales / daysInLastMonth : 0;

    const paymentMethods = {
      cash: todayOrders
        .filter((o) => o.paymentMethod === "Cash") // ✅ Changed to match schema enum
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      card: todayOrders
        .filter((o) => o.paymentMethod === "Card") // ✅ Changed
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      upi: todayOrders
        .filter(
          (o) => ["UPI", "Online"].includes(o.paymentMethod) // ✅ Changed to match schema enum
        )
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    const earningsChange =
      yesterdayEarnings > 0
        ? (
            ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) *
            100
          ).toFixed(1)
        : todayEarnings > 0
        ? 100
        : 0;

    const customersChange =
      yesterdayCustomers > 0
        ? (
            ((todayCustomers - yesterdayCustomers) / yesterdayCustomers) *
            100
          ).toFixed(1)
        : todayCustomers > 0
        ? 100
        : 0;

    const avgEarningsChange =
      lastMonthAvg > 0
        ? (((avgDailyEarnings - lastMonthAvg) / lastMonthAvg) * 100).toFixed(1)
        : avgDailyEarnings > 0
        ? 100
        : 0;

    const salesChange =
      lastMonthSales > 0
        ? (((thisMonthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(
            1
          )
        : thisMonthSales > 0
        ? 100
        : 0;

    res.locals.statistics = {
      todayEarnings: todayEarnings.toFixed(2),
      earningsChange: Math.abs(earningsChange),
      earningsDirection: earningsChange >= 0 ? "up" : "down",

      todayCustomers,
      customersChange: Math.abs(customersChange),
      customersDirection: customersChange >= 0 ? "up" : "down",

      avgDailyEarnings: avgDailyEarnings.toFixed(2),
      avgEarningsChange: Math.abs(avgEarningsChange),
      avgEarningsDirection: avgEarningsChange >= 0 ? "up" : "down",

      thisMonthSales: thisMonthSales.toFixed(2),
      salesChange: Math.abs(salesChange),
      salesDirection: salesChange >= 0 ? "up" : "down",

      todayOrdersCount: todayOrders.length,
      paymentMethods,
      todayReservationsCount: todayReservations, // ✅ ADD THIS
      waiterRequestsCount,

      currentMonth: today.toLocaleString("en-US", { month: "long" }),
      currentDate: today.toLocaleString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    res.locals.todayOrders = todayOrders;
    next();
  } catch (error) {
    console.error("Statistics middleware error:", error);
    next();
  }
};

// Middleware to load app settings and make available to all views
const superAdminAppsettings = async (req, res, next) => {
  try {
    const settings = await AppSettings.getSettings();

    // Make only themeColor and logo available to all views
    res.locals.themeColor = settings.themeColor;
    res.locals.appLogo = settings.appLogo.url;

    next();
  } catch (error) {
    console.error("Error loading app settings:", error);
    // Fallback to defaults if settings can't be loaded
    res.locals.themeColor = "#F97316";
    res.locals.appLogo = "/images/default-logo.png";
    next();
  }
};

/**
 * Middleware to validate table access and prevent multiple sessions
 */
const validateTableAccess = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { table: tableId, tableCode } = req.query;

    // If no table info, continue (will show table selection)
    if (!tableId || !tableCode) {
      return next();
    }

    // Check if table exists and is active
    const table = await Table.findById(tableId);
    if (!table || table.status !== "Active") {
      return res.render("customer/table-unavailable", {
        message: "This table is not available",
        tableCode,
        branchId,
      });
    }

    // Check for active session
    const activeSession = await TableSession.findActiveSession(tableId);

    if (activeSession) {
      // Get device/session identifier from request
      const deviceId = req.cookies.deviceId || req.sessionID;
      const userSession = req.session;

      // Check if this is the SAME user/device trying to access
      const isSessionOwner =
        (activeSession.customer &&
          userSession.customerId &&
          activeSession.customer.toString() === userSession.customerId) ||
        activeSession.guestInfo?.deviceId === deviceId;

      if (isSessionOwner) {
        // Same user - allow access, attach session info
        req.tableSession = activeSession;
        req.isSessionOwner = true;
        return next();
      } else {
        // Different user - table is occupied
        return res.render("customer/table-occupied", {
          message: "This table is currently in use",
          tableCode,
          tableId,
          branchId,
          sessionStartedAt: activeSession.startedAt,
          canRequestNotification: true, // Allow them to request notification when available
        });
      }
    }

    // No active session - allow access
    next();
  } catch (error) {
    console.error("Error validating table access:", error);
    res.status(500).render("error", {
      message: "Error validating table access",
    });
  }
};

/**
 * Middleware to create or retrieve session
 */
const ensureTableSession = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { table: tableId, tableCode } = req.query;

    if (!tableId) {
      return next();
    }

    // Check if session already exists in request (from validateTableAccess)
    if (req.tableSession) {
      return next();
    }

    // Get or create device identifier
    let deviceId = req.cookies.deviceId;
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      res.cookie("deviceId", deviceId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
      });
    }

    // Create new session
    const sessionToken = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newSession = new TableSession({
      table: tableId,
      branch: branchId,
      sessionToken,
      guestInfo: {
        deviceId,
        ipAddress: req.ip || req.connection.remoteAddress,
      },
      customer: req.session.customerId || null,
    });

    await newSession.save();

    // Update table availability status
    await Table.findByIdAndUpdate(tableId, {
      availabilityStatus: "Occupied",
    });

    req.tableSession = newSession;
    req.session.currentTableSession = sessionToken;

    next();
  } catch (error) {
    console.error("Error ensuring table session:", error);
    next(error);
  }
};

/**
 * Check if table is in use before allowing QR scan access
 */
const checkTableAvailability = async (req, res, next) => {
  try {
    const { table: tableId } = req.query;

    if (!tableId) {
      return next();
    }

    const activeSession = await TableSession.findActiveSession(tableId);

    if (activeSession) {
      const deviceId = req.cookies.deviceId || req.sessionID;
      const isSessionOwner =
        (activeSession.customer &&
          req.session.customerId &&
          activeSession.customer.toString() === req.session.customerId) ||
        activeSession.guestInfo?.deviceId === deviceId;

      if (!isSessionOwner) {
        // Table is occupied by someone else
        req.isTableOccupied = true;
        req.occupiedSession = activeSession;
      }
    }

    next();
  } catch (error) {
    console.error("Error checking table availability:", error);
    next(error);
  }
};

// ✅ Export both functions
module.exports = {
  isLoggedIn,
  attachStatistics,
  isSuperAdmin,
  superAdminAppsettings,
  validateTableAccess,
  ensureTableSession,
  checkTableAvailability,
};
