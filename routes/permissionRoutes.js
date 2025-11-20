const express = require("express");
const router = express.Router({ mergeParams: true });
const Permission = require("../models/permission");
const { isLoggedIn } = require("../middleware");

// ✅ Get permissions for a specific role
router.get("/settings/permissions/:role", isLoggedIn, async (req, res) => {
  try {
    const { branchId, role } = req.params;

    const permission = await Permission.findOne({ branch: branchId, role });

    if (!permission) {
      return res.json({ success: true, permissions: {} });
    }

    res.json({ success: true, permissions: permission.permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching permissions",
    });
  }
});

router.post("/settings/permissions", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { role, permissions } = req.body;

    const validRoles = ["Branch-Head", "Chef", "Waiter"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const permission = await Permission.findOneAndUpdate(
      { branch: branchId, role },
      { branch: branchId, role, permissions },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Permissions updated successfully",
      permission,
    });
  } catch (error) {
    console.error("Error saving permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error saving permissions",
    });
  }
});

//Get all permissions for a branch (overview)
router.get("/settings/permissions", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;
    const permissions = await Permission.find({ branch: branchId });

    res.json({ success: true, permissions });
  } catch (error) {
    console.error("Error fetching all permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all permissions",
    });
  }
});

// ✅ NEW: Toggle single permission dynamically
router.post("/settings/permissions/update", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { role, section, action, value } = req.body;

    const validRoles = ["Branch-Head", "Chef", "Waiter"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updated = await Permission.findOneAndUpdate(
      { branch: branchId, role },
      { $set: { [`permissions.${section}.${action}`]: value } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Permission updated successfully",
      permission: updated,
    });
  } catch (error) {
    console.error("Error updating single permission:", error);
    res.status(500).json({
      success: false,
      message: "Error updating single permission",
    });
  }
});

// ✅ Middleware to check specific permission for routes
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "Hotel-Admin") return next(); // Full access for Hotel-Admin

      const permission = await Permission.findOne({
        branch: req.user.branch,
        role: req.user.role,
      });

      if (!permission) {
        return res.status(403).json({
          success: false,
          message: "Access denied - No permissions set for this role",
        });
      }

      const allowed =
        permission.permissions[module] &&
        permission.permissions[module][action];

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied - You don't have ${action} permission for ${module}`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking permissions",
      });
    }
  };
};

module.exports = { router, checkPermission };
