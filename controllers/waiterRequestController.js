// controllers/waiterRequestController.js

const WaiterRequest = require("../models/waiterRequest");
const Table = require("../models/table");
const sendNotification = require("../utils/sendNotification");
const Area = require("../models/area");

// ================================
// GET NEW REQUESTS FOR API (JSON Response)
// ================================
exports.getNewRequest = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    console.log("🔵 API: Fetching pending requests for branch:", branchId);

    const requests = await WaiterRequest.find({
      branch: branchId,
      status: "Pending",
    })
      .populate("table", "tableCode")
      .populate("area", "name")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${requests.length} pending requests`);

    // Map to correct field names for frontend
    const mappedRequests = requests.map((req) => ({
      _id: req._id,
      tableId: req.table, // Map table to tableId
      area: req.area,
      status: req.status,
      createdAt: req.createdAt,
    }));

    res.json({
      success: true,
      requests: mappedRequests,
    });
  } catch (error) {
    console.error("❌ Error fetching requests:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================
// GET PENDING REQUESTS
// ================================
exports.getPendingRequests = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    const requests = await WaiterRequest.find({
      branch: branchId,
      status: "Pending",
    })
      .populate("table", "tableCode")
      .populate("area", "name")
      .populate("assignedTo", "name")
      .sort({ createdAt: 1 });

    res.render("dashboard/showWaiterRequest", { requests, branchId });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching requests");
  }
};

// ================================
// MARK AS ATTENDED (Dashboard)
// ================================
exports.markAttended = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const sectionName = "waiterRequest";

    await WaiterRequest.findByIdAndUpdate(req.params.id, {
      status: "Attended",
    });

    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      return res.json({ success: true, message: "Request marked as attended" });
    }

    // Otherwise, redirect (for non-AJAX requests)
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error(error);

    // Return JSON error for AJAX requests
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      return res
        .status(500)
        .json({ success: false, message: "Error updating request" });
    }

    res.status(500).send("Error updating request");
  }
};

// ================================
// CREATE REQUEST (Customer Page)
// ================================
exports.createRequest = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { tableCode, tableId } = req.body;

    if ((!tableId && !tableCode) || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Table ID or table code and branch ID are required",
      });
    }

    let table = null;

    console.log("🔍 Incoming waiter request:", {
      branchId,
      tableId,
      tableCode,
    });

    // 1️⃣ PRIORITY: CHECK USING tableId (Best & always correct)
    if (tableId) {
      console.log("🔎 Searching using tableId:", tableId);

      table = await Table.findById(tableId).populate({
        path: "area",
        populate: { path: "branch" },
      });

      if (!table) {
        return res.status(404).json({
          success: false,
          message: "Invalid QR: Table not found",
        });
      }

      // Validate the table belongs to this branch
      if (String(table.area.branch._id) !== String(branchId)) {
        return res.status(404).json({
          success: false,
          message: "Invalid QR: This table does not belong to this branch",
        });
      }
    }

    // 2️⃣ If NO tableId → fallback to tableCode (only inside same branch)
    if (!table) {
      const trimmed = tableCode.trim();
      console.log("🔎 Searching by tableCode:", trimmed);

      // Get areas that belong to the branch
      const areas = await Area.find({ branch: branchId }).select("_id");
      const areaIds = areas.map((a) => a._id);

      if (areaIds.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No areas found in this branch",
        });
      }

      // Exact match
      table = await Table.findOne({
        tableCode: trimmed,
        area: { $in: areaIds },
      }).populate({ path: "area", populate: { path: "branch" } });

      // Case-insensitive fallback
      if (!table) {
        table = await Table.findOne({
          tableCode: { $regex: new RegExp(`^${trimmed}$`, "i") },
          area: { $in: areaIds },
        }).populate({ path: "area", populate: { path: "branch" } });
      }

      if (!table) {
        return res.status(404).json({
          success: false,
          message: `Table '${trimmed}' not found in this branch`,
        });
      }
    }

    // 3️⃣ Table is now found and valid
    console.log("✅ Table resolved:", {
      tableId: table._id,
      tableCode: table.tableCode,
      area: table.area.name,
      branch: table.area.branch._id,
    });

    // 4️⃣ Check for pending request
    const existing = await WaiterRequest.findOne({
      table: table._id,
      status: "Pending",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A waiter request is already pending for this table",
      });
    }

    // 5️⃣ Create new waiter request
    const waiterRequest = await WaiterRequest.create({
      table: table._id,
      area: table.area._id,
      branch: branchId,
    });

    await waiterRequest.populate([
      { path: "table", select: "tableCode" },
      { path: "area", select: "name" },
    ]);

    console.log("✅ Waiter request created:", {
      requestId: waiterRequest._id,
      table: waiterRequest.table.tableCode,
      area: waiterRequest.area.name,
    });

    sendNotification(`🚨 Waiter Call from Table ${table.tableCode}`);

    return res.status(201).json({
      success: true,
      message: "Waiter has been notified successfully",
      data: waiterRequest,
    });
  } catch (error) {
    console.error("❌ Error creating waiter request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to notify waiter",
      error: error.message,
    });
  }
};

// ================================
// GET ALL REQUESTS (API)
// ================================
exports.getAllRequests = async (req, res) => {
  try {
    const filter = { branch: req.params.branchId };

    if (req.query.status) filter.status = req.query.status;

    const requests = await WaiterRequest.find(filter)
      .populate("table", "tableCode")
      .populate("area", "name")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message,
    });
  }
};

// ================================
// MARK AS ATTENDED (Mobile App)
// ================================
exports.markAsAttended = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { staffId } = req.body;

    const request = await WaiterRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status === "Attended") {
      return res.status(400).json({
        success: false,
        message: "Request already attended",
      });
    }

    if (staffId) request.assignedTo = staffId;

    await request.complete();

    await request.populate([
      { path: "table", select: "tableCode" },
      { path: "area", select: "name" },
      { path: "assignedTo", select: "name" },
    ]);

    res.status(200).json({
      success: true,
      message: "Request marked as attended",
      data: request,
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update request",
      error: error.message,
    });
  }
};

// ================================
// DELETE REQUEST
// ================================
exports.deleteRequest = async (req, res) => {
  try {
    const request = await WaiterRequest.findByIdAndDelete(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete request",
      error: error.message,
    });
  }
};
