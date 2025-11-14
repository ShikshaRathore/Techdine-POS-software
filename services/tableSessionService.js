const TableSession = require("../models/tableSession");
const Table = require("../models/table");
const crypto = require("crypto");

class TableSessionService {
  /**
   * Create or retrieve session when user scans QR code
   */
  static async createOrGetSession(tableId, branchId, customerInfo = {}) {
    try {
      // Check if table exists and is active
      const table = await Table.findOne({
        _id: tableId,
        status: "Active",
      });

      if (!table) {
        throw new Error("Table not found or inactive");
      }

      // Check for existing active session
      let session = await TableSession.findActiveSession(tableId);

      if (session) {
        // Session exists - update last activity
        session.lastActivityAt = new Date();
        await session.save();

        return {
          session,
          isNew: false,
          message: "Table is currently in use",
        };
      }

      // Create new session
      const sessionToken = crypto.randomBytes(32).toString("hex");

      session = new TableSession({
        table: tableId,
        branch: branchId,
        sessionToken,
        customer: customerInfo.customerId || null,
        guestInfo: {
          deviceId: customerInfo.deviceId,
          ipAddress: customerInfo.ipAddress,
        },
      });

      await session.save();

      // Occupy the table
      await table.occupy(session._id);

      return {
        session,
        isNew: true,
        message: "Session created successfully",
      };
    } catch (error) {
      console.error("Error creating/getting session:", error);
      throw error;
    }
  }

  /**
   * Add order to existing session
   */
  static async addOrderToSession(sessionId, orderId, orderAmount) {
    try {
      const session = await TableSession.findById(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      if (!session.isActive()) {
        throw new Error("Session is not active");
      }

      await session.addOrder(orderId, orderAmount);

      return session;
    } catch (error) {
      console.error("Error adding order to session:", error);
      throw error;
    }
  }

  /**
   * Complete session and free table when payment is done
   */
  static async completeSession(sessionId) {
    try {
      const session = await TableSession.findById(sessionId).populate("table");

      if (!session) {
        throw new Error("Session not found");
      }

      // Mark session as completed
      await session.complete();

      // Free the table
      if (session.table) {
        await session.table.free();
      }

      return {
        success: true,
        message: "Session completed and table freed",
        session,
      };
    } catch (error) {
      console.error("Error completing session:", error);
      throw error;
    }
  }

  /**
   * Check if table is available (no active session)
   */
  static async isTableAvailable(tableId) {
    try {
      const activeSession = await TableSession.findActiveSession(tableId);
      return !activeSession;
    } catch (error) {
      console.error("Error checking table availability:", error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  static async getSessionDetails(sessionId) {
    try {
      const session = await TableSession.findById(sessionId)
        .populate("table")
        .populate("orders")
        .populate("customer");

      return session;
    } catch (error) {
      console.error("Error getting session details:", error);
      throw error;
    }
  }

  /**
   * Validate session token (for security)
   */
  static async validateSession(sessionToken, tableId) {
    try {
      const session = await TableSession.findOne({
        sessionToken,
        table: tableId,
        status: "Active",
      });

      return session;
    } catch (error) {
      console.error("Error validating session:", error);
      return null;
    }
  }

  /**
   * Clean up abandoned sessions (run periodically)
   * Mark sessions as abandoned if no activity for X hours
   */
  static async cleanupAbandonedSessions(hoursInactive = 4) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursInactive);

      // Find abandoned sessions
      const abandonedSessions = await TableSession.find({
        status: "Active",
        lastActivityAt: { $lt: cutoffTime },
      }).populate("table");

      if (abandonedSessions.length === 0) {
        return { cleaned: 0, sessions: [] };
      }

      // 1️⃣ Bulk update all sessions at once
      await TableSession.updateMany(
        {
          status: "Active",
          lastActivityAt: { $lt: cutoffTime },
        },
        { $set: { status: "Abandoned" } }
      );

      // 2️⃣ Bulk update all tables in parallel
      const tableIds = abandonedSessions
        .filter((s) => s.table)
        .map((s) => s.table._id);

      await Promise.all(
        tableIds.map((id) =>
          Table.findByIdAndUpdate(id, { status: "Available" })
        )
      );

      return {
        cleaned: abandonedSessions.length,
        sessions: abandonedSessions,
      };
    } catch (error) {
      console.error("Error cleaning up abandoned sessions:", error);
      throw error;
    }
  }
}

module.exports = TableSessionService;
