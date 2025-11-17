const Order = require("../models/order");
const KOT = require("../models/kot");

exports.createOrderKOT = async (req, res) => {
  try {
    const {
      items,
      branch,
      serviceType,
      pax,
      totalAmount,
      subtotal,
      taxes,
      totalTax,
      orderType,
      customer, // ADD THIS
      table, // ADD THIS
    } = req.body;

    // ✅ Validate required fields
    if (!branch) {
      return res.status(400).json({
        success: false,
        error: "Branch ID is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Order must contain at least one item",
      });
    }

    // ✅ Auto-generate ORDER number (branch-scoped, unique string)
    const lastOrder = await Order.findOne({ branch })
      .sort({ createdAt: -1 })
      .select("orderNumber");

    let orderNumber;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNum = parseInt(lastOrder.orderNumber.replace(/\D/g, "")) || 0;
      orderNumber = `ORD${String(lastNum + 1).padStart(6, "0")}`;
    } else {
      orderNumber = `ORD000001`;
    }

    // ✅ Auto-generate KOT number (branch-scoped, unique string)
    const lastKOT = await KOT.findOne({ branch })
      .sort({ createdAt: -1 })
      .select("kotNumber");

    let kotNumber;
    if (lastKOT && lastKOT.kotNumber) {
      const lastNum = parseInt(lastKOT.kotNumber.replace(/\D/g, "")) || 0;
      kotNumber = `KOT${String(lastNum + 1).padStart(6, "0")}`;
    } else {
      kotNumber = `KOT000001`;
    }

    console.log("🔵 Creating order:", {
      orderNumber,
      kotNumber,
      branch,
      itemCount: items.length,
      totalAmount,
      table: table || "No table", // ADD THIS DEBUG
      customer: customer || "Walk-in", // ADD THIS DEBUG
    });

    // ✅ Validate and transform items
    const transformedItems = items.map((item) => {
      if (!item.menuItem || !item.quantity || !item.price) {
        throw new Error("Each item must have menuItem, quantity, and price");
      }
      return {
        menuItem: item.menuItem,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        notes: item.notes || "",
      };
    });

    // ✅ Create Order with customer and table
    const order = new Order({
      orderNumber,
      branch,
      items: transformedItems,
      orderType: orderType || "Dine In",
      status: "KOT",
      paymentStatus: "Unpaid",
      subtotal: parseFloat(subtotal) || 0, // ADD THIS
      taxes: taxes || [],
      totalTax: parseFloat(totalTax) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      kotGenerated: true,
      pax: pax || 1,
      customer: customer || null, // ADD THIS - customer object or null
      table: table || null, // ADD THIS - table ID or null
    });

    await order.save();
    console.log("✅ Order created:", order._id, "with table:", table);

    // ✅ Get createdBy from session/auth
    const createdBy = req.user?._id || req.session?.userId;
    const createdByModel = req.user?.role === "Customer" ? "Customer" : "Staff";

    if (!createdBy) {
      console.warn(
        "⚠️ No user ID found in session. Using order as creator reference."
      );
    }

    // ✅ Create KOT linked to that order
    const kot = new KOT({
      kotNumber,
      order: order._id,
      branch,
      items: transformedItems.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        notes: item.notes || "",
      })),
      status: "In Kitchen",
      createdBy: createdBy || order._id,
      createdByModel: createdBy ? createdByModel : "Staff",
      startedAt: new Date(),
    });

    await kot.save();
    console.log("✅ KOT created:", kot._id);

    res.json({
      success: true,
      message: "Order and KOT created successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        table: table, // ADD THIS for debugging
      },
      kot: {
        _id: kot._id,
        kotNumber: kot.kotNumber,
        status: kot.status,
      },
    });
  } catch (err) {
    console.error("❌ Error in createOrderKOT:");
    console.error("  - Message:", err.message);
    console.error("  - Stack:", err.stack);

    // ✅ Better error response
    if (err.name === "ValidationError") {
      const errors = Object.keys(err.errors).map((key) => ({
        field: key,
        message: err.errors[key].message,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};
