export function initPage(branchId) {
  console.log("🔵 Initializing QR Codes page with branchId:", branchId);

  // Function to load QRCode library if not already loaded
  function ensureQRCodeLibrary() {
    return new Promise((resolve, reject) => {
      // Check if QRCode is already available
      if (typeof QRCode !== "undefined") {
        console.log("QRCode library already loaded");
        resolve();
        return;
      }

      console.log("Loading QRCode library...");

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="qrcodejs"]');
      if (existingScript) {
        existingScript.onload = () => {
          console.log("QRCode library loaded");
          resolve();
        };
        existingScript.onerror = () =>
          reject(new Error("Failed to load QRCode"));
        return;
      }

      // Load the script
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.onload = () => {
        console.log("QRCode library loaded successfully");
        resolve();
      };
      script.onerror = () => {
        console.error("Failed to load QRCode library");
        reject(new Error("Failed to load QRCode library"));
      };
      document.head.appendChild(script);
    });
  }

  // Main initialization function
  async function initialize() {
    // Ensure QRCode library is loaded
    try {
      await ensureQRCodeLibrary();
    } catch (error) {
      console.error("Could not load QRCode library:", error);
      alert("Failed to load QR code generator. Please refresh the page.");
      return;
    }

    // Get data from hidden divs
    const tablesDataEl = document.getElementById("tables-data");
    const customerUrlEl = document.getElementById("customer-url");
    const branchIdEl = document.getElementById("branch-id");

    if (!tablesDataEl || !customerUrlEl || !branchIdEl) {
      console.error("Data elements not found");
      return;
    }

    // Parse data
    let tables, customerSiteUrl, storedBranchId;

    try {
      const tablesJSON = tablesDataEl.textContent.trim();
      console.log("Raw tables JSON length:", tablesJSON.length);

      tables = JSON.parse(tablesJSON);
      customerSiteUrl = customerUrlEl.textContent.trim();
      storedBranchId = branchIdEl.textContent.trim();

      console.log("Parsed tables count:", tables.length);
      console.log("Customer site URL:", customerSiteUrl);
      console.log("Branch ID:", storedBranchId);
    } catch (error) {
      console.error("Error parsing QR data:", error);
      return;
    }

    const BRANCH_ID = branchId || storedBranchId;

    // Generate QR codes
    if (!Array.isArray(tables) || tables.length === 0) {
      console.warn("No tables data available");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    tables.forEach((table) => {
      const qrElement = document.getElementById(`qr-${table._id}`);
      if (qrElement) {
        // Clear any existing QR code
        qrElement.innerHTML = "";

        // // Create URL with table information
        // const qrUrl = `${window.location.origin}${customerSiteUrl}?table=${table._id}&tableCode=${table.tableCode}`;

        // Try this:
        const qrUrl = `https://techdine-pos-software.onrender.com/restaurant/${BRANCH_ID}?table=${table._id}&tableCode=${table.tableCode}`;

        try {
          new QRCode(qrElement, {
            text: qrUrl,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H,
          });
          successCount++;
          console.log(`Generated QR for table ${table.tableCode}`);
        } catch (error) {
          failCount++;
          console.error(`Error generating QR for ${table.tableCode}:`, error);
        }
      } else {
        failCount++;
        console.warn(`⚠️ QR element not found for table ${table._id}`);
      }
    });

    console.log(
      `QR generation complete: ${successCount} success, ${failCount} failed`
    );

    // Setup window functions
    setupWindowFunctions(customerSiteUrl);
  }

  // Setup global functions
  function setupWindowFunctions(customerSiteUrl) {
    // Filter by area
    window.filterArea = function (areaId) {
      console.log("🔍 Filtering by area:", areaId);
      const sections = document.querySelectorAll(".area-section");
      const allButtons = document.querySelectorAll('[id^="btn-"]');

      allButtons.forEach((btn) => {
        btn.className =
          "px-6 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-600 hover:bg-gray-300";
      });

      const activeButton = document.getElementById(`btn-${areaId}`);
      if (activeButton) {
        activeButton.className =
          "px-6 py-2 rounded-lg font-medium transition-colors bg-orange-200 text-orange-800";
      }

      sections.forEach((section) => {
        if (areaId === "all") {
          section.style.display = "block";
        } else {
          section.style.display =
            section.dataset.area === areaId ? "block" : "none";
        }
      });
    };

    // Download QR code
    window.downloadQR = function (tableId, tableCode) {
      console.log("Downloading QR for table:", tableCode);
      const qrElement = document.getElementById(`qr-${tableId}`);

      if (!qrElement) {
        console.error("QR element not found for download");
        alert("QR code not found. Please refresh the page.");
        return;
      }

      const canvas = qrElement.querySelector("canvas");

      if (canvas) {
        try {
          const url = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `QR-${tableCode}.png`;
          link.href = url;
          link.click();
          console.log("QR downloaded:", tableCode);
        } catch (error) {
          console.error("Error downloading QR:", error);
          alert("Failed to download QR code. Please try again.");
        }
      } else {
        console.error("Canvas not found in QR element");
        alert("QR code not ready. Please wait a moment and try again.");
      }
    };

    // Open customer site
    window.openCustomerSite = function (tableId, tableCode) {
      const url = `${window.location.origin}${customerSiteUrl}?table=${tableId}&tableCode=${tableCode}`;
      console.log("🔗 Opening customer site:", url);
      window.open(url, "_blank");
    };
  }

  // Start initialization
  initialize();
}
