// ============================================
// GET BRANCH ID FROM URL PATH
// ============================================
function getBranchIdFromURL() {
  const path = window.location.pathname;
  // Extract branchId from /dashboard/:branchId format
  const match = path.match(/\/dashboard\/([a-f0-9]{24})/i);

  if (match && match[1]) {
    console.log("🔵 Branch ID from URL path:", match[1]);
    return match[1];
  }

  console.warn("⚠️ No branch ID found in URL");
  return "";
}

// Global variables
let branchId = getBranchIdFromURL();
let currentMenuId = null;

// Make modal functions globally accessible
window.openUpdateModal = function (menuId, menuName) {
  // Ensure branchId is current
  const currentBranchId = branchId || getBranchIdFromURL();

  if (!currentBranchId) {
    console.error("❌ Cannot update menu: Branch ID is missing");
    alert("Error: Branch ID not found");
    return;
  }

  currentMenuId = menuId;
  document.getElementById("updateMenuName").value = menuName;
  document.getElementById(
    "updateMenuForm"
  ).action = `/menu/updateMenu/${currentBranchId}/${menuId}`;
  document.getElementById("updateModal").classList.add("active");
  document.body.style.overflow = "hidden";

  console.log(
    "🔵 Update modal opened - Branch:",
    currentBranchId,
    "Menu:",
    menuId
  );
};

window.closeUpdateModal = function () {
  document.getElementById("updateModal").classList.remove("active");
  document.body.style.overflow = "auto";
  currentMenuId = null;
};

window.openDeleteModal = function (menuId, menuName) {
  // Ensure branchId is current
  const currentBranchId = branchId || getBranchIdFromURL();

  if (!currentBranchId) {
    console.error("❌ Cannot delete menu: Branch ID is missing");
    alert("Error: Branch ID not found");
    return;
  }

  currentMenuId = menuId;
  document.getElementById(
    "deleteMenuNameDisplay"
  ).textContent = `"${menuName}"`;
  document.getElementById(
    "deleteMenuForm"
  ).action = `/menu/deleteMenu/${currentBranchId}/${menuId}`;
  document.getElementById("deleteModal").classList.add("active");
  document.body.style.overflow = "hidden";

  console.log(
    "🔵 Delete modal opened - Branch:",
    currentBranchId,
    "Menu:",
    menuId
  );
};

window.closeDeleteModal = function () {
  document.getElementById("deleteModal").classList.remove("active");
  document.body.style.overflow = "auto";
  currentMenuId = null;
};

// Menu card click to show specific menu
window.showMenuItems = function (menuId) {
  const menuSections = document.querySelectorAll(".menu-section");
  const menuCards = document.querySelectorAll(".menu-card");

  // Hide all menu sections first
  menuSections.forEach((section) => {
    section.style.display = "none";
  });

  // Show only the selected menu section
  menuSections.forEach((section) => {
    if (section.getAttribute("data-menu-id") === menuId) {
      section.style.display = "";
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Update card highlighting
  menuCards.forEach((card) => {
    if (card.getAttribute("data-menu-id") === menuId) {
      card.classList.add("border-orange-500", "shadow-md");
    } else {
      card.classList.remove("border-orange-500", "shadow-md");
    }
  });
};

// Initialize all functionality when DOM is ready
function init() {
  // Refresh branchId on init
  branchId = getBranchIdFromURL();
  console.log("✅ Menu page initialized with branchId:", branchId);

  // Get DOM elements
  const searchInput = document.getElementById("searchInput");
  const menuSections = document.querySelectorAll(".menu-section");
  const menuCards = document.querySelectorAll(".menu-card");

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase().trim();

      // Get currently visible menu section
      let currentVisibleSection = null;
      menuSections.forEach((section) => {
        if (section.style.display !== "none") {
          currentVisibleSection = section;
        }
      });

      if (currentVisibleSection) {
        const menuItems = currentVisibleSection.querySelectorAll(".menu-item");

        menuItems.forEach((item) => {
          const itemName = item.getAttribute("data-item-name") || "";
          const category = item.getAttribute("data-category") || "";
          const type = item.getAttribute("data-type") || "";

          const matches =
            itemName.includes(searchTerm) ||
            category.includes(searchTerm) ||
            type.includes(searchTerm);

          if (matches || searchTerm === "") {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      }
    });
  }

  // Highlight selected menu card
  menuCards.forEach((card) => {
    card.addEventListener("click", function () {
      menuCards.forEach((c) =>
        c.classList.remove("border-orange-500", "shadow-md")
      );
      this.classList.add("border-orange-500", "shadow-md");
    });
  });

  // Close modals on outside click
  window.onclick = function (event) {
    const updateModal = document.getElementById("updateModal");
    const deleteModal = document.getElementById("deleteModal");

    if (event.target === updateModal) {
      window.closeUpdateModal();
    }
    if (event.target === deleteModal) {
      window.closeDeleteModal();
    }
  };

  // Close modals on Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      window.closeUpdateModal();
      window.closeDeleteModal();
    }
  });
}

// ============================================
// EXPORT INIT FUNCTION FOR DASHBOARD.JS
// ============================================
export function initPage(providedBranchId) {
  console.log("🔵 initPage called with branchId:", providedBranchId);

  // Use provided branchId or get from URL
  branchId = providedBranchId || getBranchIdFromURL();

  console.log("✅ Menu page initialized with branchId:", branchId);

  // Run the init function
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

// Run init when DOM is fully loaded (fallback for direct access)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
