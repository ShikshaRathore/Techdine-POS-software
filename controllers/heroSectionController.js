const HeroSection = require("../models/HeroSection");
const Branch = require("../models/branch");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

// Verify HeroSection model is loaded correctly
console.log("HeroSection model loaded:", HeroSection.modelName);

// GET: Display hero section management page
exports.getHeroSectionPage = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Verify branch exists and user has access
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).send("Branch not found");
    }

    // Get all video offers and image ads for this branch
    const videoOffers = await HeroSection.find({
      branchId,
      type: "video",
      isActive: true,
    }).sort({ order: 1, createdAt: -1 });

    const imageAds = await HeroSection.find({
      branchId,
      type: "image",
      isActive: true,
    }).sort({ order: 1, createdAt: -1 });

    res.render("dashboard/hero-section", {
      branchId,
      branch,
      videoOffers,
      imageAds,
    });
  } catch (error) {
    console.error("Error loading hero section page:", error);
    res.status(500).send("Error loading page: " + error.message);
  }
};

// POST: Add video offer
exports.addVideoOffer = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { heading, subHeading, link } = req.body;

    console.log("=== VIDEO UPLOAD DEBUG ===");
    console.log("Branch ID:", branchId);
    console.log("Request Body:", req.body);
    console.log("File Info:", req.file);
    console.log("========================");

    // Check if file was uploaded
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).send("Video file is required");
    }

    // Verify branchId is valid
    if (!branchId || branchId === "undefined") {
      console.error("Invalid branchId:", branchId);
      return res.status(400).send("Invalid branch ID");
    }

    // Create video offer object
    const videoOfferData = {
      branchId: branchId,
      type: "video",
      heading: heading,
      subHeading: subHeading || "",
      mediaUrl: req.file.path,
      link: link,
    };

    console.log("Attempting to save:", videoOfferData);

    const videoOffer = new HeroSection(videoOfferData);
    await videoOffer.save();

    console.log("Video offer saved successfully:", videoOffer._id);

    res.redirect(`/frontend-setting/hero-section/${branchId}`);
  } catch (error) {
    console.error("=== ERROR DETAILS ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.name === "ValidationError") {
      console.error("Validation errors:", error.errors);
      return res
        .status(400)
        .send("Validation error: " + JSON.stringify(error.errors));
    }

    res.status(500).send("Error adding video offer: " + error.message);
  }
};

// POST: Add image ad
exports.addImageAd = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { heading, subHeading, link } = req.body;

    console.log("=== IMAGE UPLOAD DEBUG ===");
    console.log("Branch ID:", branchId);
    console.log("Request Body:", req.body);
    console.log("File Info:", req.file);
    console.log("========================");

    // Check if file was uploaded
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).send("Image file is required");
    }

    // Verify branchId is valid
    if (!branchId || branchId === "undefined") {
      console.error("Invalid branchId:", branchId);
      return res.status(400).send("Invalid branch ID");
    }

    // Create image ad object
    const imageAdData = {
      branchId: branchId,
      type: "image",
      heading: heading,
      subHeading: subHeading || "",
      mediaUrl: req.file.path,
      link: link,
    };

    console.log("Attempting to save:", imageAdData);

    const imageAd = new HeroSection(imageAdData);
    await imageAd.save();

    console.log("Image ad saved successfully:", imageAd._id);

    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("=== ERROR DETAILS ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.name === "ValidationError") {
      console.error("Validation errors:", error.errors);
      return res
        .status(400)
        .send("Validation error: " + JSON.stringify(error.errors));
    }

    res.status(500).send("Error adding image ad: " + error.message);
  }
};

// POST: Delete item (video or image)
exports.deleteItem = async (req, res) => {
  try {
    const { branchId, itemId } = req.params;

    const item = await HeroSection.findOne({ _id: itemId, branchId });

    if (!item) {
      return res.status(404).send("Item not found");
    }

    // Delete from Cloudinary
    try {
      const urlParts = item.mediaUrl.split("/");
      const fileWithExtension = urlParts[urlParts.length - 1];
      const publicIdWithFolder = urlParts.slice(7).join("/"); // Get everything after .com/
      const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, ""); // Remove extension

      console.log("Deleting from Cloudinary:", publicId);

      await cloudinary.uploader.destroy(publicId, {
        resource_type: item.type === "video" ? "video" : "image",
      });

      console.log("Deleted from Cloudinary successfully");
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await HeroSection.findByIdAndDelete(itemId);
    console.log("Deleted from database successfully");

    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).send("Error deleting item: " + error.message);
  }
};

// GET: Get hero section items for frontend display (public API)
exports.getHeroSectionItems = async (req, res) => {
  try {
    const { branchId } = req.params;

    const items = await HeroSection.find({
      branchId,
      isActive: true,
    }).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error fetching hero section items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching items: " + error.message,
    });
  }
};
