const Order = require("./models/order.js"); // Adjust path as needed

// 🔹 Middleware 1: Auth check
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("success", "You must be logged in!");
    return res.redirect("/login");
  }
  next();
};

// Middleware to check if user is superAdmin
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }

  req.flash("success", "Login as Super Admin to continue to dashboard");
  return res.redirect("/login");
};

// 🔹 Middleware 2: Attach statistics
const attachStatistics = async (req, res, next) => {
  res.locals.statistics = null;
  res.locals.todayOrders = [];

  try {
    const branchId = req.params.id;
    if (!branchId) return next();

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
        branch: branchId,
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: "cancelled" },
      }).lean()) || [];

    const todayEarnings = todayOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    const yesterdayOrders =
      (await Order.find({
        branch: branchId,
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
        branch: branchId,
        createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        status: { $ne: "cancelled" },
      }).lean()) || [];

    const thisMonthSales = thisMonthOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    const lastMonthOrders =
      (await Order.find({
        branch: branchId,
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
        .filter((o) => o.paymentMethod === "cash")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      card: todayOrders
        .filter((o) => o.paymentMethod === "card")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      upi: todayOrders
        .filter((o) =>
          ["upi", "digital", "online"].includes(o.paymentMethod?.toLowerCase())
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

// ✅ Export both functions
module.exports = {
  isLoggedIn,
  attachStatistics,
  isSuperAdmin,
};
