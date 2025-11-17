// controllers/customerController.js (UPDATED WITH BRANCH DROPDOWN)

const Branch = require("../models/branch");
const Menu = require("../models/menu");
const MenuItem = require("../models/menuItem");
const Order = require("../models/order");
const KOT = require("../models/kot");
const Area = require("../models/area");

/**
 * Display customer dashboard with menu
 * GET /restaurant/:branchId
 */
exports.getCustomerDashboard = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate MongoDB ObjectId format
    if (!branchId.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash("error", "Invalid restaurant link!");
      return res.redirect("/");
    }

    // Find branch by ID and populate owner (which has restaurantName)
    const branch = await Branch.findById(branchId)
      .populate("owner", "restaurantName username email")
      .lean();

    if (!branch) {
      req.flash("error", "Restaurant not found!");
      return res.redirect("/");
    }

    // Check if branch is active
    if (!branch.isActive) {
      req.flash("error", "This restaurant is currently unavailable!");
      return res.redirect("/");
    }

    // Find ALL branches for this restaurant owner (for the dropdown)
    const allBranches = await Branch.find({
      owner: branch.owner._id,
      isActive: true,
    })
      .select("branchName address _id")
      .sort({ branchName: 1 })
      .lean();

    // Find menu for this branch
    const menu = await Menu.findOne({ branch: branchId }).lean();

    // Find all menu items for this branch
    const menuItems = await MenuItem.find({
      branch: branchId,
    })
      .populate("category")
      .populate("menu")
      .sort({ category: 1, itemName: 1 })
      .lean();

    res.render("./layouts/customer-dashboard.ejs", {
      branch,
      branchId,
      allBranches, // Pass all branches for dropdown
      menu,
      menuItems,
      pageTitle: `${branch.owner.restaurantName} - ${branch.branchName}`,
    });
  } catch (err) {
    console.error("Error loading customer dashboard:", err);
    req.flash("error", "Failed to load restaurant menu!");
    res.redirect("/");
  }
};

/**
 * Place a new order
 * POST /restaurant/:branchId/place-order
 */
exports.placeOrder = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate MongoDB ObjectId format
    if (!branchId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid restaurant ID",
      });
    }

    const { orderType, items, totalAmount, specialInstructions } = req.body;

    // Validate required fields
    if (!orderType || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate branch exists and is active
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: "Restaurant not found",
      });
    }

    if (!branch.isActive) {
      return res.status(403).json({
        success: false,
        error: "Restaurant is currently closed",
      });
    }

    // Generate unique order number with date prefix
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create the order
    const newOrder = new Order({
      orderNumber: orderNumber,
      branch: branchId,
      orderType: orderType,
      items: items,
      totalAmount: totalAmount,
      specialInstructions: specialInstructions || "",
      status: "KOT",
      paymentStatus: "Unpaid",
      kotGenerated: true,
      customer: req.user?._id || null,
    });

    await newOrder.save();

    const kotNumber = `KOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create KOT
    const newKOT = new KOT({
      kotNumber: kotNumber,
      order: newOrder._id,
      branch: branchId,
      items: items.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        notes: specialInstructions || "",
      })),
      status: "In Kitchen",
      createdBy: req.user?._id || newOrder._id,
      createdByModel: "Customer",
      startedAt: new Date(),
    });

    await newKOT.save();

    // Populate order details for response
    await newOrder.populate("items.menuItem");

    console.log("✅ Order Created:", newOrder.orderNumber);
    console.log("✅ KOT Created:", newKOT.kotNumber);

    res.json({
      success: true,
      message: "Order placed successfully!",
      order: {
        _id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        orderType: newOrder.orderType,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        items: newOrder.items,
        createdAt: newOrder.createdAt,
      },
      kot: {
        _id: newKOT._id,
        kotNumber: newKOT.kotNumber,
        status: newKOT.status,
      },
    });
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to place order. Please try again.",
    });
  }
};

/**
 * Get branch info for QR code generation
 * GET /restaurant/:branchId/info
 */
exports.getBranchInfo = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate MongoDB ObjectId format
    if (!branchId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(branchId)
      .populate("owner", "restaurantName")
      .select("branchName owner address isActive")
      .lean();

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: "Branch not found",
      });
    }

    res.json({
      success: true,
      data: {
        restaurantName: branch.owner.restaurantName,
        branchName: branch.branchName,
        address: branch.address,
        isActive: branch.isActive,
        url: `${req.protocol}://${req.get("host")}/restaurant/${branchId}`,
        qrCodeUrl: `${req.protocol}://${req.get(
          "host"
        )}/restaurant/${branchId}`,
      },
    });
  } catch (err) {
    console.error("Error fetching branch info:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Get order status
 * GET /restaurant/:branchId/order/:orderId/status
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const { branchId, orderId } = req.params;

    // Validate MongoDB ObjectId format
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      branch: branchId,
    })
      .populate("items.menuItem")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Get associated KOT
    const kot = await KOT.findOne({ order: orderId }).lean();

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt,
      },
      kot: kot
        ? {
            kotNumber: kot.kotNumber,
            status: kot.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order status",
    });
  }
};

/**
 * Display reservation form
 * GET /restaurant/:branchId/reservations
 */
exports.getReservationPage = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate MongoDB ObjectId format
    if (!branchId.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash("error", "Invalid restaurant link!");
      return res.redirect("/");
    }

    // Find branch
    const branch = await Branch.findById(branchId)
      .populate("owner", "restaurantName")
      .lean();

    if (!branch) {
      req.flash("error", "Restaurant not found!");
      return res.redirect("/");
    }

    // Check if branch is active
    if (!branch.isActive) {
      req.flash("error", "This restaurant is currently unavailable!");
      return res.redirect("/");
    }

    // Fetch all active areas for this branch
    const areas = await Area.find({
      branch: branchId,
      status: "Active",
    })
      .sort({ name: 1 })
      .lean();

    res.render("/customer/showCustomerReservationForm.ejs", {
      branch,
      areas,
      pageTitle: `Book a Table - ${branch.owner.restaurantName}`,
    });
  } catch (err) {
    console.error("Error loading reservation page:", err);
    req.flash("error", "Failed to load reservation page!");
    res.redirect("/");
  }
};

/**
 * Create a new reservation
 * POST /restaurant/:branchId/reservations
 */
exports.createReservation = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate MongoDB ObjectId format
    if (!branchId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const {
      reservationDate,
      timeSlot,
      mealPeriod,
      numberOfGuests,
      area,
      table,
      specialRequests,
      customerName,
      customerPhone,
      customerEmail,
    } = req.body;

    // Validate required fields
    if (
      !reservationDate ||
      !timeSlot ||
      !mealPeriod ||
      !numberOfGuests ||
      !area ||
      !table ||
      !customerName ||
      !customerPhone
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    // Verify that area belongs to the branch
    const areaDoc = await Area.findOne({ _id: area, branch: branchId });
    if (!areaDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid area for this restaurant",
      });
    }

    // Check if table is available for the selected date and time
    const existingReservation = await Reservation.findOne({
      branch: branchId,
      table,
      reservationDate: new Date(reservationDate),
      timeSlot,
      status: { $in: ["Confirmed"] },
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message:
          "This table is already reserved for the selected date and time",
      });
    }

    // Find existing customer by phone OR email
    let customer = await Customer.findOne({
      $or: [
        { phone: customerPhone },
        ...(customerEmail ? [{ email: customerEmail }] : []),
      ],
    });

    // Only create new customer if they don't exist
    if (!customer) {
      customer = new Customer({
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
      });
      await customer.save();
    }

    // Create reservation
    const reservation = new Reservation({
      branch: branchId,
      customer: customer._id,
      area,
      table,
      reservationDate: new Date(reservationDate),
      timeSlot,
      mealPeriod,
      numberOfGuests,
      specialRequests: specialRequests || "",
      status: "Confirmed",
    });

    await reservation.save();

    // Update table status to Reserved
    await Table.findByIdAndUpdate(table, {
      availabilityStatus: "Reserved",
    });

    console.log("✅ Reservation Created:", reservation._id);

    res.json({
      success: true,
      message: "Reservation created successfully!",
      reservation: {
        _id: reservation._id,
        reservationDate: reservation.reservationDate,
        timeSlot: reservation.timeSlot,
        numberOfGuests: reservation.numberOfGuests,
      },
    });
  } catch (error) {
    console.error("❌ Error creating reservation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create reservation. Please try again.",
    });
  }
};
