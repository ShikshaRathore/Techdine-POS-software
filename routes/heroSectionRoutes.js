const express = require("express");
const router = express.Router();
const heroSectionController = require("../controllers/heroSectionController");
const { isLoggedIn } = require("../middleware"); // Your auth middleware
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const HeroSection = require("../models/HeroSection.js");

// GET: Display hero section management page
router.get(
  "/hero-section/:branchId",
  isLoggedIn,
  heroSectionController.getHeroSectionPage
);

// POST: Add video offer
router.post(
  "/hero-section/:branchId/video",
  isLoggedIn,
  upload.single("video"),
  heroSectionController.addVideoOffer
);

// POST: Add image ad
router.post(
  "/hero-section/:branchId/image",
  isLoggedIn,
  upload.single("image"),
  heroSectionController.addImageAd
);

// POST: Delete video offer
router.post(
  "/hero-section/:branchId/video/:itemId/delete",
  isLoggedIn,
  heroSectionController.deleteItem
);

// POST: Delete image ad
router.post(
  "/hero-section/:branchId/image/:itemId/delete",
  isLoggedIn,
  heroSectionController.deleteItem
);

// GET: Get hero section items for frontend display (public route)
router.get(
  "/hero-section/:branchId/items",
  isLoggedIn,
  heroSectionController.getHeroSectionItems
);

// routes/heroSection.js or add to existing routes
router.get("/hero-section/:branchId/showAds", async (req, res) => {
  try {
    const { branchId } = req.params;

    const heroSections = await HeroSection.find({
      branchId,
      isActive: true,
    }).sort({ order: 1 });

    res.json({
      success: true,
      heroSections,
    });
  } catch (error) {
    console.error("Error fetching hero sections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hero sections",
    });
  }
});

module.exports = router;
