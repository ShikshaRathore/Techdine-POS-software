const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");

// Show all tables for a branch
router.get("/showTables/:id", tableController.showTables);

// Show add table form
router.get("/addTable/:branchId", tableController.showAddTableForm);

// Add new table
router.post("/addTable/:branchId", tableController.addTable);

// Get table data (for modal - API endpoint)
router.get("/api/table/:id", tableController.getTableData);

// Update table
router.post("/updateTable/:id", tableController.updateTable);

// Delete table
router.post("/deleteTable/:id", tableController.deleteTable);

router.get("/showQRCodes/:branchId", tableController.showTableQRCodes);

module.exports = router;
