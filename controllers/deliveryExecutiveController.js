const DeliveryExecutive = require("../models/deliveryExecutive");

// Show all delivery executives for a branch
exports.showExecutives = async (req, res) => {
  try {
    const { branchId } = req.params;

    const executives = await DeliveryExecutive.find({ branch: branchId })
      .populate("branch", "branchName")
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

    req.flash("success", "Delivery Executive created successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    req.flash("error", error.message);
    res.redirect(`/dashboard`);
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

    res.render("dashboard/editDeliveryExecutive", { executive, branchId });
  } catch (error) {
    console.error("Error fetching executive:", error);
    res.status(500).send("Error loading executive");
  }
};

// Update this function in your controller
exports.updateExecutive = async (req, res) => {
  try {
    const { id, branchId } = req.params;
    const { name, phone, status } = req.body;

    const updateData = { name, phone, status };

    const executive = await DeliveryExecutive.findById(id);

    if (!executive) {
      return res.status(404).send("Executive not found");
    }

    Object.assign(executive, updateData);

    await executive.save();
    req.flash("success", "Updated Delivery Executive");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    req.flash("error", error.message);
    res.redirect(`/dashboard`);
  }
};

// Delete executive page (confirmation)
exports.deleteExecutivePage = async (req, res) => {
  try {
    const { id, branchId } = req.params;
    const executive = await DeliveryExecutive.findById(id).lean();

    if (!executive) {
      return res.status(404).send("Executive not found");
    }

    res.render("dashboard/deleteDeliveryExecutive", { executive, branchId });
  } catch (error) {
    console.error("Error fetching executive:", error);
    res.status(500).send("Error loading executive");
  }
};

// Delete delivery executive (already exists, just update the redirect)
exports.deleteExecutive = async (req, res) => {
  try {
    const { id, branchId } = req.params;
    await DeliveryExecutive.findByIdAndDelete(id);
    req.flash("success", "Delivery Executive Deleted");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error deleting executive:", error);
    res.status(500).send("Error deleting executive");
  }
};

// Export delivery executives (CSV)
exports.exportExecutives = async (req, res) => {
  try {
    const { branchId } = req.params;
    const executives = await DeliveryExecutive.find({ branch: branchId })
      .populate("branch", "branchName")
      .lean();

    const csv = [
      ["Name", "Phone", "Status", "Branch"].join(","),
      ...executives.map((exec) =>
        [
          exec.name,
          exec.phone,
          exec.status,
          exec.branch?.branchName || "N/A",
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
