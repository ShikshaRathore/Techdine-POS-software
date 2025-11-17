// ============================================
// 🆕 LOAD XLSX LIBRARY FIRST
// ============================================
function loadXLSXLibrary() {
  return new Promise((resolve, reject) => {
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

loadXLSXLibrary().catch((err) => {
  console.error("❌ Critical error loading XLSX:", err);
});

// ============================================
// DASHBOARD SCRIPT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("dashboard-content");

  // ============================================
  // GET BRANCH ID FROM URL PATH
  // ============================================
  function getBranchIdFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/dashboard\/([a-f0-9]{24})/i);

    if (match && match[1]) {
      console.log("🔵 Branch ID from URL path:", match[1]);
      return match[1];
    }

    console.warn("⚠️ No branch ID found in URL");
    return "";
  }

  // ============================================
  // MAIN CONTENT LOADER
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

      if (url.includes("/waiterRequest") && window.showWaiterRequestInit) {
        console.log("🔄 Reinitializing Waiter Request JS after AJAX load...");
        window.showWaiterRequestInit();
      }

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
      else if (url.includes("/showPayments")) pageName = "showPayments";
      else if (url.includes("/duePayments")) pageName = "duePayments";
      else if (url.includes("/salesReport")) pageName = "showSalesReport";
      else if (url.includes("/itemReport")) pageName = "showItemReport";
      else if (url.includes("/categoryReport")) pageName = "showCategoryReport";
      else if (url.includes("/showMenu")) pageName = "showMenu";
      else if (url.includes("/showItemCategories"))
        pageName = "showItemCategories";
      else if (url.includes("/showAreas")) pageName = "showArea";
      else if (url.includes("/waiterRequest")) pageName = "showWaiterRequest";
      else {
        const match = url.match(/\/([a-zA-Z0-9_-]+)(?:\?|$)/);
        pageName = match ? match[1] : null;
      }

      if (pageName) {
        try {
          const module = await import(`/js/pages/${pageName}.js`);
          const branchId = getBranchIdFromURL();
          console.log(`🔵 Loading ${pageName} with branchId:`, branchId);

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
  // INTERCEPT SIDEBAR LINKS + FORMS
  // ============================================
  document.querySelectorAll(".content-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      let url = link.getAttribute("href");

      if (url && url.includes("/dashboard/")) {
        console.log("🔄 Navigating to dashboard (full page load):", url);
        window.location.href = url;
        return;
      }

      const branchId = getBranchIdFromURL();
      if (branchId && url && !url.includes(branchId)) {
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

      if (url.includes("/dashboard/")) {
        console.log("🔄 Navigating to dashboard (full page load):", url);
        window.location.href = url;
        return;
      }

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
  // SIDEBAR + DROPDOWN + TOGGLE LOGIC
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
  // SUBMENU LOGIC
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
  // LOADING & ERROR HANDLERS
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
  // GLOBAL FUNCTIONS
  // ============================================
  window.loadDashboardContent = loadContent;
  window.getBranchId = getBranchIdFromURL;

  window.loadPOSWithOrder = function (orderId, branchId) {
    console.log("🔵 Loading POS with order:", orderId);
    const url = `/pos/${branchId}?orderId=${orderId}`;
    loadContent(url);
  };

  window.viewOrderDetails = function (orderId) {
    console.log("🔵 Viewing order details:", orderId);
    alert(`View order details for: ${orderId}\n(Implement detail modal here)`);
  };

  // ============================================
  // BRANCH SWITCHER
  // ============================================
  const branchSelect = document.querySelector('select[name="branchId"]');
  if (branchSelect) {
    branchSelect.addEventListener("change", function () {
      const selectedBranchId = this.value;
      console.log("🔄 Switching to branch:", selectedBranchId);
      window.location.href = `/dashboard/${selectedBranchId}`;
    });
  }

  // ============================================
  // UNIVERSAL AUTO-SECTION RESTORER
  // ============================================
  (function () {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");

    if (!section) return;

    const branchId = getBranchIdFromURL();
    if (!branchId) return;

    console.log(`🔵 Auto-loading section from redirect: ${section}`);
    let url = `/${section}/${branchId}`;
    loadContent(url);
  })();

  // ============================================
  // 🔔 GLOBAL WAITER REQUEST MONITOR
  // ============================================

  const globalWaiterMonitor = {
    previousRequestIds: new Set(),
    isMonitoring: false,
    pollInterval: null,
    audioContext: null,
    isFirstCheck: true, // Track first check

    init() {
      if (this.isMonitoring) {
        console.log("⚠️ Monitor already running");
        return;
      }

      console.log("🔔 Starting global waiter request monitoring...");
      this.isMonitoring = true;

      // Initialize audio context on first user interaction
      this.initAudioContext();

      // Start polling
      this.startPolling();
    },

    initAudioContext() {
      const initAudio = () => {
        if (!this.audioContext) {
          try {
            const AudioContextClass =
              window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            console.log("🔊 Global audio context initialized");

            // Try to resume immediately
            if (this.audioContext.state === "suspended") {
              this.audioContext.resume().then(() => {
                console.log("✅ Audio context resumed");
              });
            }
          } catch (error) {
            console.error("❌ Failed to initialize audio context:", error);
          }
        }
      };

      // Initialize on multiple events
      ["click", "touchstart", "keydown"].forEach((event) => {
        document.addEventListener(event, initAudio, { once: true });
      });
    },

    async checkForNewRequests() {
      try {
        const branchId = window.getBranchId?.();
        if (!branchId) {
          console.log("⚠️ No branch ID, skipping check");
          return;
        }

        console.log(
          `🔍 Checking for new waiter requests... (First check: ${this.isFirstCheck})`
        );

        // Fetch waiter requests via API
        const response = await fetch(`/waiterRequest/${branchId}/newRequest`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error(
            "❌ Failed to fetch requests:",
            response.status,
            response.statusText
          );
          return;
        }

        const data = await response.json();
        console.log("📦 Received data:", data);

        const currentRequests = data.requests || [];
        console.log(`📊 Current requests count: ${currentRequests.length}`);

        // Extract current request IDs
        const currentRequestIds = new Set(
          currentRequests.map((req) => req._id.toString())
        );

        // On first check, just initialize baseline WITHOUT notifications
        if (this.isFirstCheck) {
          this.previousRequestIds = new Set(currentRequestIds);
          this.isFirstCheck = false;
          console.log(
            `📊 Baseline initialized with ${currentRequestIds.size} existing requests (no notifications)`
          );
          return;
        }

        // Find NEW requests (not in previous baseline)
        const newRequests = [];
        currentRequestIds.forEach((id) => {
          if (!this.previousRequestIds.has(id)) {
            const request = currentRequests.find(
              (req) => req._id.toString() === id
            );
            if (request) {
              newRequests.push({
                id,
                tableCode: request.tableId?.tableCode || "Unknown",
                areaName: request.tableId?.area?.name || "Unknown Area",
                createdAt: request.createdAt,
              });
            }
          }
        });

        // Notify for new requests
        if (newRequests.length > 0) {
          console.log(`🔔 NEW REQUESTS DETECTED: ${newRequests.length}`);
          console.log("🔔 New requests:", newRequests);

          newRequests.forEach((req, i) => {
            setTimeout(() => {
              console.log(
                `🔊 Playing notification for: Table ${req.tableCode}`
              );
              this.playNotificationSound();
              this.showVisualNotification(req.tableCode, req.areaName);
            }, i * 300); // Stagger notifications by 300ms
          });
        } else {
          console.log("✅ No new requests");
        }

        // Update baseline with current state
        this.previousRequestIds = new Set(currentRequestIds);
      } catch (error) {
        console.error("❌ Error checking waiter requests:", error);
      }
    },

    playNotificationSound() {
      try {
        if (!this.audioContext) {
          console.warn("⚠️ Audio context not initialized, trying to create...");
          this.audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
        }

        if (this.audioContext.state === "suspended") {
          console.log("🔊 Resuming suspended audio context...");
          this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        const playTone = (frequency, startTime, duration) => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            startTime + duration
          );

          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };

        // Play two-tone notification
        playTone(800, now, 0.15);
        playTone(600, now + 0.15, 0.2);

        console.log("✅ Notification sound played successfully");
      } catch (error) {
        console.error("❌ Sound error:", error);
        // Fallback: Try browser notification API
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Waiter Request", {
            body: "A table needs assistance",
            icon: "🔔",
          });
        }
      }
    },

    showVisualNotification(tableCode, areaName) {
      // Remove any existing notification
      const existing = document.querySelector(".global-waiter-notification");
      if (existing) existing.remove();

      const notification = document.createElement("div");
      notification.className =
        "global-waiter-notification fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] transition-all transform translate-x-96 cursor-pointer hover:bg-blue-700";
      notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-3xl animate-bounce">🔔</div>
        <div>
          <div class="font-bold text-lg">New Waiter Request!</div>
          <div class="text-blue-100 text-sm">Table ${tableCode} - ${areaName}</div>
          <div class="text-blue-200 text-xs mt-1">Click to view</div>
        </div>
      </div>
    `;

      // Click to navigate to waiter request page
      notification.addEventListener("click", () => {
        const branchId = window.getBranchId?.();
        if (branchId && window.loadDashboardContent) {
          window.loadDashboardContent(`/waiterRequest/${branchId}`);
        }
        notification.remove();
      });

      document.body.appendChild(notification);

      // Slide in animation
      setTimeout(() => {
        notification.style.transform = "translateX(0)";
      }, 20);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        notification.style.transform = "translateX(24rem)";
        setTimeout(() => notification.remove(), 300);
      }, 10000);

      console.log("✅ Visual notification displayed");
    },

    startPolling() {
      // Initial check after 2 seconds
      setTimeout(() => {
        console.log("🔍 Starting initial check (baseline only)...");
        this.checkForNewRequests();
      }, 2000);

      // Poll every 5 seconds
      this.pollInterval = setInterval(() => {
        this.checkForNewRequests();
      }, 5000);

      console.log(
        "✅ Global waiter request monitoring started (polling every 5s)"
      );
    },

    stop() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      this.isMonitoring = false;
      this.isFirstCheck = true;
      this.previousRequestIds.clear();
      console.log("🛑 Global waiter request monitoring stopped");
    },

    // Manual test function
    test() {
      console.log("🧪 Testing notification system...");
      this.playNotificationSound();
      this.showVisualNotification("TEST-01", "Test Area");
    },
  };

  // Expose globally
  window.globalWaiterMonitor = globalWaiterMonitor;

  // ✅ Initialize monitor immediately (not nested in another DOMContentLoaded)
  setTimeout(() => {
    console.log("🚀 Initializing global waiter monitor...");
    globalWaiterMonitor.init();
  }, 1000);

  // ============================================
  // INITIAL LOAD CHECK
  // ============================================
  console.log("✅ Dashboard script loaded");
  console.log("🔵 Current branch ID:", getBranchIdFromURL());
});
