const Table = require("../models/table");
const Area = require("../models/area");
const Branch = require("../models/branch");

// Show all tables for a branch
exports.showTables = async (req, res) => {
  try {
    const branchId = req.params.id;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found!");
      return res.redirect("/dashboard");
    }

    const areas = await Area.find({ branch: branchId }).populate("tables");

    res.render("dashboard/showTables.ejs", {
      branch,
      branchId,
      areas,
    });
  } catch (err) {
    console.error("Error loading tables:", err);
    req.flash("error", "Unable to load tables at this moment.");
    res.redirect("/dashboard");
  }
};

// Show add table form
exports.showAddTableForm = async (req, res) => {
  try {
    const { branchId } = req.params;
    const areas = await Area.find({ branch: branchId }).lean();
    res.render("dashboard/addTable.ejs", { branchId, areas });
  } catch (err) {
    console.error("Error loading add table form:", err);
    req.flash("error", "Unable to load form.");
    res.redirect(`/dashboard/${req.params.branchId}`);
  }
};

// Add new table
exports.addTable = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { area, tableCode, seatingCapacity, availabilityStatus, status } =
      req.body;

    if (!area || !tableCode || !seatingCapacity) {
      req.flash("error", "Please fill all required fields!");
      return res.redirect(`/dashboard/${branchId}`);
    }

    const areaDoc = await Area.findOne({ _id: area, branch: branchId });
    if (!areaDoc) {
      req.flash("error", "Selected area not found for this branch!");
      return res.redirect(`/dashboard/${branchId}`);
    }

    const existingTable = await Table.findOne({
      area,
      tableCode: tableCode.trim(),
    });
    if (existingTable) {
      req.flash(
        "error",
        "A table with this code already exists in the selected area!"
      );
      return res.redirect(`/dashboard/${branchId}`);
    }

    const newTable = new Table({
      area,
      tableCode: tableCode.trim(),
      seatingCapacity: parseInt(seatingCapacity),
      availabilityStatus: availabilityStatus || "Available",
      status: status || "Active",
    });

    await newTable.save();
    await Area.findByIdAndUpdate(area, { $push: { tables: newTable._id } });

    req.flash("success", "New table added successfully!");
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error adding table:", err);
    req.flash("error", "Failed to add table!");
    res.redirect(`/dashboard/${branchId}`);
  }
};

// Get table data for update (API endpoint)
exports.getTableData = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findById(id).populate("area");

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    const areas = await Area.find({ branch: table.area.branch });

    res.json({
      success: true,
      table: {
        _id: table._id,
        tableCode: table.tableCode,
        seatingCapacity: table.seatingCapacity,
        availabilityStatus: table.availabilityStatus,
        status: table.status,
        area: table.area._id,
      },
      areas,
      branchId: table.area.branch,
    });
  } catch (err) {
    console.error("Error fetching table data:", err);
    res.status(500).json({ error: "Failed to fetch table data" });
  }
};

// Update table
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { area, tableCode, seatingCapacity, availabilityStatus, status } =
      req.body;

    if (!area || !tableCode || !seatingCapacity) {
      req.flash("error", "Please fill all required fields!");
      return res.redirect("back");
    }

    const table = await Table.findById(id).populate("area");
    if (!table) {
      req.flash("error", "Table not found!");
      return res.redirect("back");
    }

    const branchId = table.area.branch;

    // Check if table code already exists in the same area (excluding current table)
    const existingTable = await Table.findOne({
      area,
      tableCode: tableCode.trim(),
      _id: { $ne: id },
    });
    if (existingTable) {
      req.flash(
        "error",
        "A table with this code already exists in the selected area!"
      );
      return res.redirect(`/dashboard/${branchId}`);
    }

    const oldAreaId = table.area._id;
    const newAreaId = area;

    // If area changed, update both areas
    if (oldAreaId.toString() !== newAreaId.toString()) {
      await Area.findByIdAndUpdate(oldAreaId, { $pull: { tables: id } });
      await Area.findByIdAndUpdate(newAreaId, { $push: { tables: id } });
    }

    // Update table
    table.area = newAreaId;
    table.tableCode = tableCode.trim();
    table.seatingCapacity = parseInt(seatingCapacity);
    table.availabilityStatus = availabilityStatus;
    table.status = status;

    await table.save();

    req.flash("success", "Table updated successfully!");
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error updating table:", err);
    req.flash("error", "Failed to update table!");
    res.redirect("back");
  }
};

// Delete table
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findById(id).populate("area");
    if (!table) {
      req.flash("error", "Table not found!");
      return res.redirect("back");
    }

    const branchId = table.area.branch;
    const areaId = table.area._id;

    // Remove table reference from area
    await Area.findByIdAndUpdate(areaId, { $pull: { tables: id } });

    // Delete table
    await Table.findByIdAndDelete(id);

    req.flash("success", "Table deleted successfully!");
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error deleting table:", err);
    req.flash("error", "Failed to delete table!");
    res.redirect("back");
  }
};

// Table QR Codes
exports.showTableQRCodes = async function (req, res) {
  try {
    const branchId = req.params.branchId;

    // Fetch all active areas for this branch with their tables
    const areas = await Area.find({
      branch: branchId,
      status: "Active",
    })
      .populate({
        path: "tables",
        match: { status: "Active" },
        select: "tableCode seatingCapacity availabilityStatus status",
      })
      .lean();

    // Create a flat array of all tables for QR generation
    const tablesData = [];
    areas.forEach((area) => {
      if (area.tables && area.tables.length > 0) {
        area.tables.forEach((table) => {
          tablesData.push({
            _id: table._id.toString(), // Convert to string
            tableCode: table.tableCode,
            seatingCapacity: table.seatingCapacity,
            availabilityStatus: table.availabilityStatus,
            areaId: area._id.toString(),
            areaName: area.name,
          });
        });
      }
    });

    res.render("dashboard/showQRCodes", {
      branchId,
      areas,
      tablesDataJSON: JSON.stringify(tablesData), // Pre-stringify
      customerSiteUrl: "/restaurant/690af97df61932b4b256820f",
    });
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).render("error", {
      message: "Error loading QR codes",
      error: error,
    });
  }
};
