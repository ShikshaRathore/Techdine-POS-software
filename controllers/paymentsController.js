const Order = require("../models/order");

module.exports.showPayments = async (req, res) => {
  try {
    const { branchId } = req.params;

    // ✅ Get all Paid or Partially Paid Orders
    const payments = await Order.find({
      branch: branchId,
      paymentStatus: { $in: ["Paid", "Partial"] },
    })
      .sort({ createdAt: -1 })
      .populate("branch");

    res.render("dashboard/showPayments", { payments, branchId });
  } catch (err) {
    console.error("Error loading payments:", err);
    res.status(500).send("Server Error");
  }
};

module.exports.duePayments = async (req, res) => {
  try {
    const { branchId } = req.params;

    // ✅ Orders where payment is still due
    const duePayments = await Order.find({
      branch: branchId,
      paymentDue: true,
    })
      .sort({ createdAt: -1 })
      .populate("branch");

    res.render("dashboard/duePayments", { duePayments });
  } catch (err) {
    console.error("Error loading due payments:", err);
    res.status(500).send("Server Error");
  }
};
