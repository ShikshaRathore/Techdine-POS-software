const Reservation = require("../models/reservation.js");
const Customer = require("../models/customer.js");
const Table = require("../models/table.js");
const Area = require("../models/area.js");

// GET - Render reservations page
exports.getReservationsPage = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to current week if no dates provided
    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();

    if (!startDate && !endDate) {
      // Set to start of current week (Monday)
      start.setDate(start.getDate() - start.getDay() + 1);
      start.setHours(0, 0, 0, 0);

      // Set to end of current week (Sunday)
      end.setDate(end.getDate() - end.getDay() + 7);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Fetch reservations for the date range AND specific branch
    const reservations = await Reservation.find({
      branch: branchId,
      reservationDate: { $gte: start, $lte: end },
      status: { $ne: "Cancelled" },
    })
      .populate("customer")
      .populate("area")
      .populate("table")
      .sort({ reservationDate: 1, timeSlot: 1 });

    // Fetch all active areas for the dropdown (branch-specific)
    const areas = await Area.find({
      branch: branchId,
      status: "Active",
    }).sort({ name: 1 });

    res.render("dashboard/showReservations.ejs", {
      reservations,
      areas,
      branchId,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).render("error", { message: "Failed to load reservations" });
  }
};

exports.getAreaTables = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { branchId } = req.query;

    // Verify area belongs to the branch
    const area = await Area.findOne({ _id: areaId, branch: branchId });
    if (!area) {
      return res
        .status(404)
        .json({ message: "Area not found for this branch" });
    }

    // ✅ Get all tables for this area (no branch filter)
    const tables = await Table.find({
      area: areaId,
      status: "Active",
    }).sort({ tableCode: 1 });

    res.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ message: "Failed to load tables" });
  }
};

// POST - Create new reservation
exports.createReservation = async (req, res) => {
  try {
    const {
      branchId,
      reservationDate,
      timeSlot,
      mealPeriod,
      numberOfGuests,
      area,
      table,
      specialRequests,
      customer: customerData,
    } = req.body;

    // Verify that area and table belong to the branch
    const areaDoc = await Area.findOne({ _id: area, branch: branchId });

    if (!areaDoc) {
      return res.status(400).json({
        message: "Invalid area for this branch",
      });
    }

    // Check if table is available for the selected date and time (branch-specific)
    const existingReservation = await Reservation.findOne({
      branch: branchId,
      table,
      reservationDate: new Date(reservationDate),
      timeSlot,
      status: { $in: ["Confirmed"] },
    });

    if (existingReservation) {
      return res.status(400).json({
        message:
          "This table is already reserved for the selected date and time",
      });
    }

    // Find or create customer (branch-specific)
    let customer = await Customer.findOne({
      branch: branchId,
      phone: customerData.phone,
    });

    if (!customer) {
      customer = new Customer({
        branch: branchId,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || null,
        createdBy: req.user?._id,
      });
      await customer.save();
    } else {
      // Update customer info if provided
      customer.name = customerData.name;
      if (customerData.email) {
        customer.email = customerData.email;
      }
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
      specialRequests,
      status: "Confirmed",
      createdBy: req.user?._id,
    });

    await reservation.save();

    // Update table status to Reserved
    await Table.findByIdAndUpdate(table, {
      availabilityStatus: "Reserved",
    });

    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Failed to create reservation" });
  }
};

// PATCH - Cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;

    const reservation = await Reservation.findOneAndUpdate(
      { _id: id, branch: branchId },
      { status: "Cancelled" },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Update table status back to Available
    await Table.findByIdAndUpdate(reservation.table, {
      availabilityStatus: "Available",
    });

    res.json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
};

// GET - View single reservation
exports.getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;

    const reservation = await Reservation.findOne({
      _id: id,
      branch: branchId,
    })
      .populate("customer")
      .populate("area")
      .populate("table");

    if (!reservation) {
      return res
        .status(404)
        .render("error", { message: "Reservation not found" });
    }

    res.render("reservations/view", { reservation, branchId });
  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).render("error", { message: "Failed to load reservation" });
  }
};

// PATCH - Complete reservation
exports.completeReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;

    const reservation = await Reservation.findOneAndUpdate(
      { _id: id, branch: branchId },
      { status: "Completed" },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Update table status back to Available
    await Table.findByIdAndUpdate(reservation.table, {
      availabilityStatus: "Available",
    });

    res.json({
      message: "Reservation completed successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error completing reservation:", error);
    res.status(500).json({ message: "Failed to complete reservation" });
  }
};

module.exports = exports;
