const DeliveryExecutive = require("../models/deliveryExecutive");

// Show all delivery executives for a branch
exports.showExecutives = async (req, res) => {
  try {
    const { branchId } = req.params;

    const executives = await DeliveryExecutive.find({ branch: branchId })
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Get order counts (optional - if you have Order model)
    // // const Order = require('../models/Order');
    // // const executivesWithOrders = await Promise.all(
    // // executives.map(async (exec) => {
    // // const totalOrders = await Order.countDocuments({
    // // deliveryExecutive: exec._id // });
    // // return { ...exec, totalOrders }; })
    // );
    const executivesWithOrders = executives.map((exec) => ({
      ...exec,
      totalOrders: 0,
    }));

    res.render("dashboard/showDeliveryExecutive", {
      executives: executivesWithOrders,
      branchId,
    });
  } catch (error) {
    console.error("Error fetching delivery executives:", error);
    res.status(500).send("Error loading delivery executives");
  }
};

// Add executive page
exports.addExecutivePage = (req, res) => {
  const { branchId } = req.params;
  res.render("dashboard/addDeliveryExecutive", { branchId });
};

// Create new delivery executive
exports.createExecutive = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, phone, status } = req.body;

    await DeliveryExecutive.create({
      name,
      phone,
      status,
      branch: branchId,
    });

    res.redirect(`/deliveryExecutive/show/${branchId}`);
  } catch (error) {
    console.error("Error creating delivery executive:", error);
    res.status(500).send("Error creating delivery executive");
  }
};

// Edit executive page
exports.editExecutivePage = async (req, res) => {
  try {
    const { id, branchId } = req.params;
    const executive = await DeliveryExecutive.findById(id).lean();

    if (!executive) {
      return res.status(404).send("Executive not found");
    }

    res.render("edit-delivery-executive", { executive, branchId });
  } catch (error) {
    console.error("Error fetching executive:", error);
    res.status(500).send("Error loading executive");
  }
};

// Update delivery executive  ✅ UPDATED (NO bcrypt)
exports.updateExecutive = async (req, res) => {
  try {
    const { id, branchId } = req.params;
    const { name, email, phone, status, password } = req.body;

    const updateData = { name, email, phone, status };

    const executive = await DeliveryExecutive.findById(id);

    if (!executive) {
      return res.status(404).send("Executive not found");
    }

    // update simple fields
    Object.assign(executive, updateData);

    // only set new password if provided
    if (password && password.trim() !== "") {
      await executive.setPassword(password); // passport-local-mongoose method
    }

    await executive.save();

    res.redirect(`/deliveryExecutive/show/${branchId}`);
  } catch (error) {
    console.error("Error updating delivery executive:", error);
    res.status(500).send("Error updating delivery executive");
  }
};

// View delivery executive
exports.viewExecutive = async (req, res) => {
  try {
    const { id, branchId } = req.params;
    const executive = await DeliveryExecutive.findById(id)
      .populate("branch", "name")
      .lean();

    if (!executive) {
      return res.status(404).send("Executive not found");
    }

    const totalOrders = 0;

    res.render("view-delivery-executive", {
      executive,
      branchId,
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching executive:", error);
    res.status(500).send("Error loading executive");
  }
};

// Delete delivery executive
exports.deleteExecutive = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryExecutive.findByIdAndDelete(id);
    res.json({ success: true, message: "Executive deleted successfully" });
  } catch (error) {
    console.error("Error deleting executive:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export delivery executives (CSV)
exports.exportExecutives = async (req, res) => {
  try {
    const { branchId } = req.params;
    const executives = await DeliveryExecutive.find({ branch: branchId })
      .populate("branch", "name")
      .lean();

    const csv = [
      ["Name", "Email", "Phone", "Status", "Branch"].join(","),
      ...executives.map((exec) =>
        [
          exec.name,
          exec.email,
          exec.phone,
          exec.status,
          exec.branch?.name || "N/A",
        ].join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=delivery-executives.csv"
    );
    res.send(csv);
  } catch (error) {
    console.error("Error exporting executives:", error);
    res.status(500).send("Error exporting data");
  }
};
