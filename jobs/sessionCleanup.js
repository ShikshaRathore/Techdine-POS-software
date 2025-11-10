const cron = require("node-cron");
const TableSessionService = require("../services/tableSessionService");

/**
 * Run cleanup every hour to mark abandoned sessions
 * Sessions with no activity for 4 hours will be marked as abandoned
 */
function startSessionCleanup() {
  console.log("🧹 Session cleanup service started");

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("🔍 Running session cleanup...");

    try {
      const result = await TableSessionService.cleanupAbandonedSessions(4);
      console.log(`✅ Cleaned up ${result.cleaned} abandoned sessions`);

      if (result.cleaned > 0) {
        // Log details of cleaned sessions
        result.sessions.forEach((session) => {
          console.log(
            `  - Table ${session.table.tableCode} freed after ${Math.floor(
              (Date.now() - session.lastActivityAt) / (1000 * 60 * 60)
            )} hours of inactivity`
          );
        });

        // Optional: Send notification to admin
        // await sendAdminNotification({
        //   type: 'session_cleanup',
        //   count: result.cleaned,
        //   sessions: result.sessions
        // });
      } else {
        console.log("  No abandoned sessions found");
      }
    } catch (error) {
      console.error("❌ Error during session cleanup:", error);

      // Optional: Log to error tracking service
      // await logError('SESSION_CLEANUP_FAILED', error);
    }
  });

  // Also run cleanup on server start (one-time)
  console.log("🚀 Running initial session cleanup...");
  TableSessionService.cleanupAbandonedSessions(4)
    .then((result) => {
      console.log(`✅ Initial cleanup: ${result.cleaned} sessions cleaned`);
    })
    .catch((error) => {
      console.error("❌ Initial cleanup failed:", error);
    });
}

/**
 * Optional: Manual cleanup function for admin use
 */
async function manualCleanup(hoursInactive = 4) {
  try {
    console.log(`🧹 Manual cleanup initiated (${hoursInactive}h threshold)...`);
    const result = await TableSessionService.cleanupAbandonedSessions(
      hoursInactive
    );

    return {
      success: true,
      message: `Cleaned up ${result.cleaned} abandoned sessions`,
      details: result.sessions.map((s) => ({
        tableId: s.table._id,
        tableCode: s.table.tableCode,
        sessionId: s._id,
        lastActivity: s.lastActivityAt,
        totalAmount: s.totalAmount,
      })),
    };
  } catch (error) {
    console.error("❌ Manual cleanup failed:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

module.exports = {
  startSessionCleanup,
  manualCleanup,
};
