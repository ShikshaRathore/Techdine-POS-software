const Order = require("../models/order");
const TableSession = require("../models/tableSession");
const TableSessionService = require("../services/tableSessionService");

async function afterStatusUpdate(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order || !order.table) return;

    // find active session for table
    const session = await TableSession.findActiveSession(order.table);
    if (!session) return;

    // fetch all orders in this session
    const sessionOrders = await Order.find({ _id: { $in: session.orders } });
    const allPaid = sessionOrders.every(
      (o) => o.paymentStatus === "Paid" || o.status === "Paid"
    );

    // free table if all paid
    if (allPaid) {
      await TableSessionService.completeSession(session._id); // ✅ THIS IS CORRECT
    }
  } catch (err) {
    console.log("afterStatusUpdate error:", err);
  }
}

module.exports = { afterStatusUpdate };
