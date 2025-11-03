const KOT = require("../models/kot.js");

module.exports.renderKOTDashboard = async (req, res) => {
  try {
    const branchId = req.params.id; // ✅ Get branch ID from URL params

    // ✅ Filter KOTs by branch
    const kots = await KOT.find({ branch: branchId })
      .populate("order")
      .populate("items.menuItem")
      .sort({ createdAt: -1 });

    const kotCounts = {
      kitchen: kots.filter((k) => k.status === "In Kitchen").length,
      ready: kots.filter((k) => k.status === "Food is Ready").length,
      served: kots.filter((k) => k.status === "Food is Served").length,
    };

    res.render("dashboard/showKOT.ejs", {
      kots,
      kotCounts,
      branchId, // ✅ Pass branchId to the view
    });
  } catch (err) {
    console.error("Error loading KOT dashboard:", err);
    req.flash("success", "Error loading KOT dashboard");
    res.redirect("/dashboard");
  }
};

// ✅ Mark as Ready
exports.markAsReady = async (req, res) => {
  try {
    const { id } = req.params;
    const kot = await KOT.findByIdAndUpdate(
      id,
      {
        status: "Food is Ready",
        readyAt: new Date(), // ✅ Add timestamp
      },
      { new: true }
    );

    if (!kot) {
      req.flash("error", "KOT not found");
      return res.redirect("/dashboard");
    }

    req.flash("success", "KOT marked as Food is Ready!");
    res.redirect(`/showKOT/${kot.branch}`); // ✅ Redirect back to KOT page
  } catch (err) {
    console.error("Error updating KOT status:", err);
    req.flash("error", "Failed to update KOT status.");
    res.redirect("/dashboard");
  }
};

// ✅ Mark as Served
exports.markAsServed = async (req, res) => {
  try {
    const { id } = req.params;
    const kot = await KOT.findByIdAndUpdate(
      id,
      {
        status: "Food is Served",
        servedAt: new Date(), // ✅ Add timestamp
      },
      { new: true }
    );

    if (!kot) {
      req.flash("error", "KOT not found");
      return res.redirect("/dashboard");
    }

    req.flash("success", "KOT marked as Food is Served!");
    res.redirect(`/showKOT/${kot.branch}`); // ✅ Redirect back to KOT page
  } catch (err) {
    console.error("Error updating KOT status:", err);
    req.flash("error", "Failed to update KOT status.");
    res.redirect("/dashboard");
  }
};

// 🗑️ Delete KOT
exports.deleteKOT = async (req, res) => {
  try {
    const { id } = req.params;
    const kot = await KOT.findByIdAndDelete(id);

    if (!kot) {
      req.flash("error", "KOT not found");
      return res.redirect("/dashboard");
    }

    req.flash("success", "KOT deleted successfully!");
    res.redirect(`/showKOT/${kot.branch}`); // ✅ Redirect back to KOT page
  } catch (err) {
    console.error("Error deleting KOT:", err);
    req.flash("error", "Failed to delete KOT.");
    res.redirect("/dashboard");
  }
};
