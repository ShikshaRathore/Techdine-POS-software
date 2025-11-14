// ============================================
// 🆕 LOAD XLSX LIBRARY FIRST
// ============================================
function loadXLSXLibrary() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window.XLSX !== "undefined") {
      console.log("✅ XLSX already loaded");
      resolve();
      return;
    }

    console.log("📦 Loading XLSX library...");
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => {
      console.log("✅ XLSX library loaded successfully");
      resolve();
    };
    script.onerror = () => {
      console.error("❌ Failed to load XLSX library");
      reject(new Error("Failed to load XLSX library"));
    };
    document.head.appendChild(script);
  });
}

// Load XLSX immediately when script loads
loadXLSXLibrary().catch((err) => {
  console.error("❌ Critical error loading XLSX:", err);
});

// ============================================
// DASHBOARD SCRIPT (Fixed - No Nested Dashboards)
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("dashboard-content");

  // ============================================
  // 🆕 GET BRANCH ID FROM URL PATH
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

  // ============================================
  // 1️⃣ MAIN CONTENT LOADER (Dynamic + Modular)
  // ============================================
  async function loadContent(url, method = "GET") {
    try {
      showLoading();

      const res = await fetch(url, {
        method,
        headers: { Accept: "text/html" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      content.innerHTML = html;

      // ✅ Detect page name for JS import (based on URL)
      let pageName = null;

      if (url.includes("/showTables")) pageName = "showTables";
      else if (url.includes("/showMenuItems")) pageName = "showMenuItems";
      else if (url.includes("/showOrders")) pageName = "showOrders";
      else if (url.includes("/pos")) pageName = "showPos";
      else if (url.includes("/showKOT")) pageName = "showKOT";
      else if (url.includes("/showStaff")) pageName = "showStaff";
      else if (url.includes("/reservations")) pageName = "showReservations";
      else if (url.includes("/deliveryExecutive"))
        pageName = "showDeliveryExecutive";
      else if (url.includes("/customers")) pageName = "showCustomers";
      else if (url.includes("/showQRCodes")) pageName = "showQRCodes";
      // Add after the existing conditions:
      else if (url.includes("/showPayments")) pageName = "showPayments";
      else if (url.includes("/duePayments")) pageName = "duePayments";
      else if (url.includes("/salesReport")) pageName = "showSalesReport";
      else if (url.includes("/itemReport")) pageName = "showItemReport";
      else if (url.includes("/categoryReport")) pageName = "showCategoryReport";
      else if (url.includes("/showMenu")) pageName = "showMenu";
      else if (url.includes("/showItemCategories"))
        pageName = "showItemCategories";
      else if (url.includes("/showAreas")) pageName = "showArea";
      else {
        const match = url.match(/\/([a-zA-Z0-9_-]+)(?:\?|$)/);
        pageName = match ? match[1] : null;
      }

      // ✅ Try dynamic import for corresponding JS file
      if (pageName) {
        try {
          const module = await import(`/js/pages/${pageName}.js`);

          // ✅ Get branchId from URL
          const branchId = getBranchIdFromURL();
          console.log(`🔵 Loading ${pageName} with branchId:`, branchId);

          // ✅ Call appropriate init function
          if (typeof module.initPage === "function") {
            module.initPage(branchId);
            console.log(
              `✅ Initialized ${pageName}.js with branchId:`,
              branchId
            );
          } else if (typeof module.initTablesPage === "function") {
            module.initTablesPage(branchId);
            console.log(
              `✅ Initialized ${pageName} page with branchId:`,
              branchId
            );
          } else if (typeof module.initOrders === "function") {
            module.initOrders(branchId);
            console.log(
              `✅ Initialized ${pageName} orders with branchId:`,
              branchId
            );
          } else {
            console.warn(`⚠️ No init function found in ${pageName}.js`);
          }
        } catch (err) {
          console.warn(`⚠️ Could not load /js/pages/${pageName}.js`, err);
        }
      }
    } catch (err) {
      console.error("❌ Error loading content:", err);
      showError();
    } finally {
      hideLoading();
      closeSidebarOnMobile();
    }
  }

  // ============================================
  // 2️⃣ INTERCEPT SIDEBAR LINKS + FORMS
  // ============================================
  document.querySelectorAll(".content-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      let url = link.getAttribute("href");

      // ❌ DON'T intercept dashboard routes - let them navigate normally
      if (url && url.includes("/dashboard/")) {
        console.log("🔄 Navigating to dashboard (full page load):", url);
        window.location.href = url;
        return;
      }

      // ✅ For other routes, load content dynamically
      const branchId = getBranchIdFromURL();
      if (branchId && url && !url.includes(branchId)) {
        // Replace :id placeholder with actual branchId
        url = url.replace(/:id/g, branchId);
      }

      if (url) {
        console.log("🔵 Loading content via AJAX:", url);
        loadContent(url);
      }
    });
  });

  document.querySelectorAll(".content-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let url = form.getAttribute("action");

      if (!url || url === "null" || url === "/null" || url === "#") return;

      // ❌ DON'T intercept dashboard routes - let them navigate normally
      if (url.includes("/dashboard/")) {
        console.log("🔄 Navigating to dashboard (full page load):", url);
        window.location.href = url;
        return;
      }

      // ✅ For other routes, load content dynamically
      const branchId = getBranchIdFromURL();
      if (branchId && !url.includes(branchId)) {
        url = url.replace(/:id/g, branchId);
      }

      const method = form.getAttribute("method") || "GET";
      console.log("🔵 Loading content via AJAX:", url);
      loadContent(url, method);
    });
  });

  // ============================================
  // 3️⃣ SIDEBAR + DROPDOWN + TOGGLE LOGIC
  // ============================================
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const openSidebarBtn = document.getElementById("open-sidebar");
  const closeSidebarBtn = document.getElementById("close-sidebar");
  const profileBtn = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const loadingIndicator = document.getElementById("loading-indicator");

  function openSidebar() {
    sidebar?.classList.remove("-translate-x-full");
    sidebarBackdrop?.classList.remove("hidden");
  }

  function closeSidebar() {
    sidebar?.classList.add("-translate-x-full");
    sidebarBackdrop?.classList.add("hidden");
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth < 1024) closeSidebar();
  }

  openSidebarBtn?.addEventListener("click", openSidebar);
  closeSidebarBtn?.addEventListener("click", closeSidebar);
  sidebarBackdrop?.addEventListener("click", closeSidebar);

  // Profile dropdown
  function toggleDropdown() {
    dropdownMenu?.classList.toggle("hidden");
  }

  function closeDropdown() {
    dropdownMenu?.classList.add("hidden");
  }

  profileBtn?.addEventListener("click", toggleDropdown);
  document.addEventListener("click", (e) => {
    if (!profileBtn?.contains(e.target) && !dropdownMenu?.contains(e.target)) {
      closeDropdown();
    }
  });

  // ============================================
  // 4️⃣ SUBMENU LOGIC
  // ============================================
  function closeAllSubmenus(except = null) {
    document.querySelectorAll(".submenu").forEach((s) => {
      if (s.id !== `submenu-${except}`) {
        s.classList.remove("open");
      }
    });
    document.querySelectorAll(".menu-toggle svg:last-child").forEach((icon) => {
      const menuId = icon.closest(".menu-toggle")?.dataset.menu;
      if (menuId !== except) {
        icon.classList.remove("rotate-180");
      }
    });
  }

  function toggleSubmenu(toggle) {
    const menuId = toggle.dataset.menu;
    const submenu = document.getElementById(`submenu-${menuId}`);
    const icon = toggle.querySelector("svg:last-child");

    if (!submenu || !icon) return;

    closeAllSubmenus(menuId);
    submenu.classList.toggle("open");
    icon.classList.toggle("rotate-180", submenu.classList.contains("open"));
  }

  document.querySelectorAll(".menu-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      toggleSubmenu(toggle);
    });
  });

  // ============================================
  // 5️⃣ LOADING & ERROR HANDLERS
  // ============================================
  function showLoading() {
    loadingIndicator?.classList.add("active");
  }

  function hideLoading() {
    loadingIndicator?.classList.remove("active");
  }

  function showError(msg = "Failed to load content. Please try again.") {
    if (content) {
      content.innerHTML = `
        <div class="flex items-center justify-center min-h-[400px]">
          <div class="text-center">
            <div class="text-red-500 text-6xl mb-4">⚠️</div>
            <p class="text-red-500 text-lg font-medium">${msg}</p>
            <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }

  // ============================================
  // 6️⃣ GLOBAL FUNCTIONS
  // ============================================

  // Expose functions for global use
  window.loadDashboardContent = loadContent;
  window.getBranchId = getBranchIdFromURL;

  // Function to load POS with existing order (for editing)
  window.loadPOSWithOrder = function (orderId, branchId) {
    console.log("🔵 Loading POS with order:", orderId);
    const url = `/pos/${branchId}?orderId=${orderId}`;
    loadContent(url);
  };

  // Function to view order details
  window.viewOrderDetails = function (orderId) {
    console.log("🔵 Viewing order details:", orderId);
    alert(`View order details for: ${orderId}\n(Implement detail modal here)`);
  };

  // ============================================
  // 7️⃣ BRANCH SWITCHER (Fixed)
  // ============================================

  // Handle branch selection dropdown
  const branchSelect = document.querySelector('select[name="branchId"]');
  if (branchSelect) {
    branchSelect.addEventListener("change", function () {
      const selectedBranchId = this.value;
      console.log("🔄 Switching to branch:", selectedBranchId);
      // ✅ Full page navigation to new branch dashboard
      window.location.href = `/dashboard/${selectedBranchId}`;
    });
  }

  // ============================================
  // 8️⃣ INITIAL LOAD CHECK
  // ============================================

  console.log("✅ Dashboard script loaded");
  console.log("🔵 Current branch ID:", getBranchIdFromURL());
});
