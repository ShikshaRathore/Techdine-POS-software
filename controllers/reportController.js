const Order = require("../models/order");
const MenuItem = require("../models/menuItem");
const Category = require("../models/category");
const moment = require("moment");

// Helper function to get date range
const getDateRange = (period, startDate, endDate) => {
  let start, end;

  if (period === "custom" && startDate && endDate) {
    start = moment(startDate).startOf("day").toDate();
    end = moment(endDate).endOf("day").toDate();
  } else {
    const now = moment();

    switch (period) {
      case "today":
        start = now.startOf("day").toDate();
        end = now.endOf("day").toDate();
        break;
      case "yesterday":
        start = now.subtract(1, "days").startOf("day").toDate();
        end = now.endOf("day").toDate();
        break;
      case "currentWeek":
        start = now.startOf("week").toDate();
        end = now.endOf("week").toDate();
        break;
      case "lastWeek":
        start = now.subtract(1, "weeks").startOf("week").toDate();
        end = now.endOf("week").toDate();
        break;
      case "currentMonth":
        start = now.startOf("month").toDate();
        end = now.endOf("month").toDate();
        break;
      case "lastMonth":
        start = now.subtract(1, "months").startOf("month").toDate();
        end = now.endOf("month").toDate();
        break;
      default:
        start = now.startOf("week").toDate();
        end = now.endOf("week").toDate();
    }
  }

  return { start, end };
};

// Sales Report
exports.getSalesReport = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { period = "currentWeek", startDate, endDate } = req.query;

    const { start, end } = getDateRange(period, startDate, endDate);

    // Fetch orders with paid status
    const orders = await Order.find({
      branch: branchId,
      paymentStatus: "Paid",
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    // Group by date
    const salesByDate = {};
    orders.forEach((order) => {
      const date = moment(order.createdAt).format("YYYY-MM-DD");
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          quantity: 0,
          amount: 0,
        };
      }
      salesByDate[date].quantity += order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      salesByDate[date].amount += order.totalAmount;
    });

    const salesData = Object.values(salesByDate);
    const totalAmount = salesData.reduce((sum, item) => sum + item.amount, 0);
    const totalQuantity = salesData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.render("dashboard/showSalesReport", {
      salesData,
      totalAmount,
      totalQuantity,
      period,
      startDate: moment(start).format("YYYY-MM-DD"),
      endDate: moment(end).format("YYYY-MM-DD"),
      branchId,
    });
  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).send("Error generating sales report");
  }
};

// Item Report
exports.getItemReport = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { period = "currentWeek", startDate, endDate } = req.query;

    const { start, end } = getDateRange(period, startDate, endDate);

    // Fetch paid orders
    const orders = await Order.find({
      branch: branchId,
      paymentStatus: "Paid",
      createdAt: { $gte: start, $lte: end },
    }).populate("items.menuItem");

    // Group by item
    const itemSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!item.menuItem) {
          console.warn("⚠️ Missing menuItem in order item:", item);
          return; // Skip null items
        }

        const itemId = item.menuItem._id.toString();
        const itemName = item.menuItem.itemName;

        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            itemName,
            quantity: 0,
            amount: 0,
          };
        }
        itemSales[itemId].quantity += item.quantity;
        itemSales[itemId].amount += item.price * item.quantity;
      });
    });

    const itemData = Object.values(itemSales).sort(
      (a, b) => b.amount - a.amount
    );
    const totalAmount = itemData.reduce((sum, item) => sum + item.amount, 0);
    const totalQuantity = itemData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.render("dashboard/showItemReport", {
      itemData,
      totalAmount,
      totalQuantity,
      period,
      startDate: moment(start).format("YYYY-MM-DD"),
      endDate: moment(end).format("YYYY-MM-DD"),
      branchId,
    });
  } catch (error) {
    console.error("Item Report Error:", error);
    res.status(500).send("Error generating item report");
  }
};

// Category Report
exports.getCategoryReport = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { period = "currentWeek", startDate, endDate } = req.query;

    const { start, end } = getDateRange(period, startDate, endDate);

    // Fetch paid orders
    const orders = await Order.find({
      branch: branchId,
      paymentStatus: "Paid",
      createdAt: { $gte: start, $lte: end },
    }).populate({
      path: "items.menuItem",
      populate: {
        path: "category",
      },
    });

    // Group by category
    const categorySales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.menuItem && item.menuItem.category) {
          const categoryId = item.menuItem.category._id.toString();
          const categoryName = item.menuItem.category.name;

          if (!categorySales[categoryId]) {
            categorySales[categoryId] = {
              categoryName,
              quantity: 0,
              amount: 0,
            };
          }
          categorySales[categoryId].quantity += item.quantity;
          categorySales[categoryId].amount += item.price * item.quantity;
        }
      });
    });

    const categoryData = Object.values(categorySales).sort(
      (a, b) => b.amount - a.amount
    );
    const totalAmount = categoryData.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalQuantity = categoryData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.render("dashboard/showCategoryReport", {
      categoryData,
      totalAmount,
      totalQuantity,
      period,
      startDate: moment(start).format("YYYY-MM-DD"),
      endDate: moment(end).format("YYYY-MM-DD"),
      branchId,
    });
  } catch (error) {
    console.error("Category Report Error:", error);
    res.status(500).send("Error generating category report");
  }
};
