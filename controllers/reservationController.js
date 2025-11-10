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
      const currentDay = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
      start.setDate(start.getDate() - daysFromMonday);
      start.setHours(0, 0, 0, 0);

      // Set to end of current week (Sunday)
      end = new Date(start);
      end.setDate(start.getDate() + 6); // Add 6 days to Monday to get Sunday
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // First, let's check all reservations without filters
    const allReservations = await Reservation.find({ branch: branchId });

    // Fetch reservations for the date range AND specific branch
    const reservations = await Reservation.find({
      branch: branchId,
      reservationDate: { $gte: start, $lte: end },
      // status: { $ne: "Cancelled" },
    })
      .populate("customer")
      .populate("area")
      .populate("table")
      .sort({ reservationDate: 1, timeSlot: 1 });

    // If no reservations found, let's debug further
    if (reservations.length === 0 && allReservations.length > 0) {
      // Check date range issue
      const reservationsInRange = await Reservation.find({
        branch: branchId,
        reservationDate: { $gte: start, $lte: end },
      });

      // Check status issue
      const confirmedReservations = await Reservation.find({
        branch: branchId,
        status: { $ne: "Cancelled" },
      });
    }

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
      console.log("Area not found for this branch");
      return res
        .status(404)
        .json({ message: "Area not found for this branch" });
    }

    // Get all tables for this area
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

    console.log("Creating reservation:", req.body);

    // Verify that area and table belong to the branch
    const areaDoc = await Area.findOne({ _id: area, branch: branchId });

    if (!areaDoc) {
      console.log("Invalid area for this branch");
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
      console.log("Table already reserved");
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
      console.log("🔍 Updating existing customer");
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

    req.flash("success", "Reservation created successfully!");
    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    req.flash("success", error.message);
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
      console.log("Reservation not found");
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Update table status back to Available
    await Table.findByIdAndUpdate(reservation.table, {
      availabilityStatus: "Available",
    });

    console.log("Reservation cancelled");
    req.flash("success", "Reservation cancelled successfully!");
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

    req.flash("success", "Reservation completed successfully!");
    res.json({
      message: "Reservation completed successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error completing reservation:", error);
    res.status(500).json({ message: "Failed to complete reservation" });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Confirmed", "Cancelled", "Completed", "No-Show"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Must be one of: Confirmed, Cancelled, Completed, No-Show",
      });
    }

    // Find and update the reservation
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Update table status back to Available
    await Table.findByIdAndUpdate(reservation.table, {
      availabilityStatus: "Available",
    });

    // Send success response
    res.json({
      success: true,
      message: "Reservation status updated successfully",
      reservation: reservation,
    });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({
      error: "Failed to update reservation status",
      details: error.message,
    });
  }
};

module.exports = exports;
