const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      enum: [
        // Breakfast: 9 AM - 11 AM
        "09:00 AM",
        "09:30 AM",
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        // Lunch: 12 PM - 4 PM
        "12:00 PM",
        "12:30 PM",
        "01:00 PM",
        "01:30 PM",
        "02:00 PM",
        "02:30 PM",
        "03:00 PM",
        "03:30 PM",
        "04:00 PM",
        // Dinner: 6 PM - 10 PM
        "06:00 PM",
        "06:30 PM",
        "07:00 PM",
        "07:30 PM",
        "08:00 PM",
        "08:30 PM",
        "09:00 PM",
        "09:30 PM",
        "10:00 PM",
      ],
    },
    mealPeriod: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner"],
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Completed", "No-Show"],
      default: "Confirmed",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
reservationSchema.index({ reservationDate: 1, area: 1, status: 1 });
reservationSchema.index({ customer: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);

// models/reservationSlot.js - SETTINGS (keep as is, this is good)
// Defines WHAT slots are available per branch/day

// models/reservation.js - BOOKINGS (needs changes)
// const reservationSchema = new mongoose.Schema(
//   {
//     branch: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Branch",
//       required: true,
//     },
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     area: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Area",
//       required: true,
//     },
//     table: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Table",
//       required: true,
//     },
//     reservationDate: {
//       type: Date,
//       required: true,
//     },
//     // CHANGE: Remove hardcoded enum, use flexible time
//     timeSlot: {
//       type: String, // Format: "09:00" (24-hour)
//       required: true,
//     },
//     mealPeriod: {
//       type: String,
//       required: true,
//       enum: ["Breakfast", "Lunch", "Dinner"],
//     },
//     numberOfGuests: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//     specialRequests: {
//       type: String,
//       trim: true,
//     },
//     status: {
//       type: String,
//       enum: ["Confirmed", "Cancelled", "Completed", "No-Show"],
//       default: "Confirmed",
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Staff",
//     },
//   },
//   { timestamps: true }
// );

// // ADD: Validation to ensure slot exists in ReservationSlot
// reservationSchema.pre("save", async function (next) {
//   const dayOfWeek = new Date(this.reservationDate).toLocaleDateString("en-US", {
//     weekday: "long",
//   });

//   const ReservationSlot = mongoose.model("ReservationSlot");
//   const slotConfig = await ReservationSlot.findOne({
//     branch: this.branch,
//     day: dayOfWeek,
//   });

//   if (!slotConfig) {
//     throw new Error(`No slot configuration found for ${dayOfWeek}`);
//   }

//   // Validate timeSlot falls within configured slots
//   const validSlot = slotConfig.slots.find(
//     (slot) =>
//       slot.type === this.mealPeriod &&
//       slot.available &&
//       this.timeSlot >= slot.startTime &&
//       this.timeSlot < slot.endTime
//   );

//   if (!validSlot) {
//     throw new Error(`Invalid time slot for ${this.mealPeriod}`);
//   }

//   next();
// });
