// const mongoose = require("mongoose");

// const tableSessionSchema = new mongoose.Schema(
//   {
//     table: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Table",
//       required: true,
//     },

//     branch: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Branch",
//       required: true,
//     },

//     // Session identifier (can be used for QR code validation)
//     sessionToken: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     // Track all orders in this session
//     orders: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Order",
//       },
//     ],

//     // Session status
//     status: {
//       type: String,
//       enum: ["Active", "Completed", "Abandoned"],
//       default: "Active",
//     },

//     // Total amount for all orders in session
//     totalAmount: {
//       type: Number,
//       default: 0,
//     },

//     // Payment tracking
//     paidAmount: {
//       type: Number,
//       default: 0,
//     },

//     // Customer info (optional if not logged in)
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//     },

//     // Guest info for non-logged in users
//     guestInfo: {
//       deviceId: String, // Browser fingerprint or device ID
//       ipAddress: String,
//     },

//     // Session timestamps
//     startedAt: {
//       type: Date,
//       default: Date.now,
//     },

//     completedAt: {
//       type: Date,
//     },

//     // Last activity to detect abandoned sessions
//     lastActivityAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { timestamps: true }
// );

// // Index for quick lookups
// tableSessionSchema.index({ table: 1, status: 1 });

// // Method to check if session is active
// tableSessionSchema.methods.isActive = function () {
//   return this.status === "Active";
// };

// // Method to add order to session
// tableSessionSchema.methods.addOrder = function (orderId, orderAmount) {
//   this.orders.push(orderId);
//   this.totalAmount += orderAmount;
//   this.lastActivityAt = new Date();
//   return this.save();
// };

// // Method to complete session
// tableSessionSchema.methods.complete = function () {
//   this.status = "Completed";
//   this.completedAt = new Date();
//   return this.save();
// };

// // Static method to find active session for table
// tableSessionSchema.statics.findActiveSession = function (tableId) {
//   return this.findOne({ table: tableId, status: "Active" });
// };

// module.exports = mongoose.model("TableSession", tableSessionSchema);

// models/TableSession.js - Enhanced version

const mongoose = require("mongoose");

const tableSessionSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // Session identifier (can be used for QR code validation)
    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },

    // Track all orders in this session
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // Session status
    status: {
      type: String,
      enum: ["Active", "Completed", "Abandoned"],
      default: "Active",
    },

    // Total amount for all orders in session
    totalAmount: {
      type: Number,
      default: 0,
    },

    // Payment tracking
    paidAmount: {
      type: Number,
      default: 0,
    },

    // Customer info (optional if not logged in)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    // Guest info for non-logged in users
    guestInfo: {
      deviceId: String, // Browser fingerprint or device ID
      ipAddress: String,
      userAgent: String, // Store user agent for additional verification
    },

    // Session timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },

    // Last activity to detect abandoned sessions
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // Session lock to prevent race conditions
    isLocked: {
      type: Boolean,
      default: false,
    },

    lockExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for quick lookups - ensures one active session per table
tableSessionSchema.index(
  { table: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "Active" } }
);
tableSessionSchema.index({ sessionToken: 1 });
tableSessionSchema.index({ lastActivityAt: 1 });

// Method to check if session is active
tableSessionSchema.methods.isActive = function () {
  return this.status === "Active";
};

// Method to check if session belongs to device
tableSessionSchema.methods.belongsToDevice = function (
  deviceId,
  customerId = null
) {
  // Check customer match first
  if (customerId && this.customer) {
    return this.customer.toString() === customerId;
  }

  // Check device ID
  if (this.guestInfo?.deviceId === deviceId) {
    return true;
  }

  return false;
};

// Method to add order to session
tableSessionSchema.methods.addOrder = function (orderId, orderAmount) {
  this.orders.push(orderId);
  this.totalAmount += orderAmount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to update last activity
tableSessionSchema.methods.updateActivity = function () {
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to complete session
tableSessionSchema.methods.complete = async function () {
  const Table = mongoose.model("Table");

  this.status = "Completed";
  this.completedAt = new Date();

  // Update table availability
  await Table.findByIdAndUpdate(this.table, {
    availabilityStatus: "Available",
  });

  return this.save();
};

// Method to abandon session
tableSessionSchema.methods.abandon = async function () {
  const Table = mongoose.model("Table");

  this.status = "Abandoned";
  this.completedAt = new Date();

  // Update table availability
  await Table.findByIdAndUpdate(this.table, {
    availabilityStatus: "Available",
  });

  return this.save();
};

// Method to acquire lock
tableSessionSchema.methods.acquireLock = async function (durationMs = 30000) {
  this.isLocked = true;
  this.lockExpiry = new Date(Date.now() + durationMs);
  return this.save();
};

// Method to release lock
tableSessionSchema.methods.releaseLock = function () {
  this.isLocked = false;
  this.lockExpiry = null;
  return this.save();
};

// Static method to find active session for table
tableSessionSchema.statics.findActiveSession = function (tableId) {
  return this.findOne({ table: tableId, status: "Active" })
    .populate("table")
    .populate("customer");
};

// Static method to check if table is available
tableSessionSchema.statics.isTableAvailable = async function (tableId) {
  const activeSession = await this.findActiveSession(tableId);
  return !activeSession;
};

// Static method to find abandoned sessions
tableSessionSchema.statics.findAbandonedSessions = function (
  inactiveMinutes = 120
) {
  const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);

  return this.find({
    status: "Active",
    lastActivityAt: { $lt: cutoffTime },
  });
};

// Static method to cleanup expired locks
tableSessionSchema.statics.cleanupExpiredLocks = async function () {
  const now = new Date();

  return this.updateMany(
    {
      isLocked: true,
      lockExpiry: { $lt: now },
    },
    {
      $set: {
        isLocked: false,
        lockExpiry: null,
      },
    }
  );
};

// Pre-save hook to update table status
tableSessionSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "Active") {
    const Table = mongoose.model("Table");
    await Table.findByIdAndUpdate(this.table, {
      availabilityStatus: "Occupied",
    });
  }
  next();
});

module.exports = mongoose.model("TableSession", tableSessionSchema);
