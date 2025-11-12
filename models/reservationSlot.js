// models/reservationSlot.js
const mongoose = require("mongoose");

const reservationSlotSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    slots: [
      {
        type: {
          type: String,
          enum: ["Breakfast", "Lunch", "Dinner"],
          required: true,
        },
        startTime: {
          type: String, // Format: "08:00"
          required: true,
        },
        endTime: {
          type: String, // Format: "11:00"
          required: true,
        },
        slotDuration: {
          type: Number, // Duration in minutes
          default: 30,
          min: 15,
          max: 120,
        },
        available: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to ensure one document per branch per day
reservationSlotSchema.index({ branch: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("ReservationSlot", reservationSlotSchema);
