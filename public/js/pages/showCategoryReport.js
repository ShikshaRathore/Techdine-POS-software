// ============================================
// 📂 CATEGORY REPORT - Complete Implementation
// File: /public/js/pages/categoryReport.js
// ============================================

export function initPage(branchId) {
  console.log("✅ Initializing Category Report with branchId:", branchId);

  // ============================================
  // 1️⃣ DATE PERIOD TOGGLE FUNCTIONALITY
  // ============================================
  const periodSelect = document.getElementById("periodSelect");
  const startDateContainer = document.getElementById("startDateContainer");
  const endDateContainer = document.getElementById("endDateContainer");

  function toggleDateInputs() {
    if (!periodSelect) return;

    const isCustom = periodSelect.value === "custom";

    if (startDateContainer) {
      startDateContainer.style.display = isCustom ? "block" : "none";
    }
    if (endDateContainer) {
      endDateContainer.style.display = isCustom ? "block" : "none";
    }
  }

  if (periodSelect) {
    periodSelect.addEventListener("change", toggleDateInputs);
    toggleDateInputs(); // Initial state
  }

  // ============================================
  // 2️⃣ GET REPORT DATA FROM TABLE
  // ============================================
  function getReportData() {
    const table = document.getElementById("categoryTable");
    if (!table) {
      console.error("❌ Category table not found");
      return null;
    }

    const data = [];

    // Get headers
    const headers = [];
    table.querySelectorAll("thead th").forEach((th) => {
      headers.push(th.textContent.trim());
    });

    // Get rows
    table.querySelectorAll("tbody tr").forEach((tr) => {
      const row = {};
      const cells = tr.querySelectorAll("td");

      if (cells.length > 0) {
        const firstCellText = cells[0].textContent.trim().toLowerCase();
        if (
          !firstCellText.includes("no category") &&
          !firstCellText.includes("data available")
        ) {
          cells.forEach((td, index) => {
            if (headers[index]) {
              row[headers[index]] = td.textContent.trim();
            }
          });

          if (Object.keys(row).length > 0) {
            data.push(row);
          }
        }
      }
    });

    return { headers, data };
  }

  // ============================================
  // 3️⃣ GET METADATA
  // ============================================
  function getMetadata() {
    return {
      period:
        document.querySelector("[data-period]")?.textContent ||
        document.getElementById("periodSelect")?.options[
          document.getElementById("periodSelect")?.selectedIndex
        ]?.text ||
        "All Time",
      startDate:
        document.querySelector("[data-start-date]")?.textContent ||
        document.querySelector('input[name="startDate"]')?.value ||
        "",
      endDate:
        document.querySelector("[data-end-date]")?.textContent ||
        document.querySelector('input[name="endDate"]')?.value ||
        "",
    };
  }

  // ============================================
  // 4️⃣ EXPORT TO CSV
  // ============================================
  function exportToCSV() {
    const reportData = getReportData();
    if (!reportData || reportData.data.length === 0) {
      showToast("No data available to export", "warning");
      return;
    }

    try {
      const metadata = getMetadata();
      let csv = [];

      // Add report title
      csv.push(["Category Report"]);
      csv.push([]);

      // Add metadata
      if (metadata.period) csv.push(["Period", metadata.period]);
      if (metadata.startDate && metadata.endDate) {
        csv.push([
          "Date Range",
          `${metadata.startDate} to ${metadata.endDate}`,
        ]);
      }
      csv.push([]);

      // Add headers
      csv.push(reportData.headers);

      // Add data rows
      reportData.data.forEach((row) => {
        const values = reportData.headers.map((header) => {
          let value = row[header] || "";
          if (value.includes(",") || value.includes('"')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv.push(values);
      });

      // Convert to CSV string
      const csvContent = csv.map((row) => row.join(",")).join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `category_report_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast("CSV file downloaded successfully!", "success");
      console.log("✅ CSV export successful");
    } catch (error) {
      console.error("❌ CSV export error:", error);
      showToast("Failed to export CSV file", "error");
    }
  }

  // ============================================
  // 5️⃣ EXPORT TO EXCEL (XLSX)
  // ============================================
  function exportToExcel() {
    if (typeof XLSX === "undefined") {
      showToast("Excel library not loaded. Falling back to CSV...", "warning");
      exportToCSV();
      return;
    }

    const reportData = getReportData();
    if (!reportData || reportData.data.length === 0) {
      showToast("No data available to export", "warning");
      return;
    }

    try {
      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(reportData.data);

      // Set column widths
      const colWidths = reportData.headers.map((header) => ({
        wch: Math.max(header.length, 15),
      }));
      ws["!cols"] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Category Report");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `category_report_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      showToast("Excel file downloaded successfully!", "success");
      console.log("✅ Excel export successful");
    } catch (error) {
      console.error("❌ Excel export error:", error);
      showToast("Failed to export Excel file", "error");
    }
  }

  // ============================================
  // 6️⃣ EXPORT TO PDF
  // ============================================
  async function exportToPDF() {
    const reportData = getReportData();
    if (!reportData || reportData.data.length === 0) {
      showToast("No data available to export", "warning");
      return;
    }

    try {
      // Load jsPDF if not already loaded
      if (typeof window.jspdf === "undefined") {
        await loadJsPDF();
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const metadata = getMetadata();

      // Add title
      doc.setFontSize(18);
      doc.text("Category Report", 14, 20);

      // Add metadata
      let yPos = 28;
      doc.setFontSize(10);

      if (metadata.period) {
        doc.text(`Period: ${metadata.period}`, 14, yPos);
        yPos += 6;
      }
      if (metadata.startDate && metadata.endDate) {
        doc.text(
          `Date Range: ${metadata.startDate} to ${metadata.endDate}`,
          14,
          yPos
        );
        yPos += 6;
      }

      const exportDate = new Date().toLocaleString();
      doc.text(`Exported: ${exportDate}`, 14, yPos);
      yPos += 10;

      // Prepare table data
      const headers = [reportData.headers];
      const rows = reportData.data.map((row) =>
        reportData.headers.map((header) => row[header] || "")
      );

      // Add table
      doc.autoTable({
        head: headers,
        body: rows,
        startY: yPos,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        margin: { top: 10 },
      });

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `category_report_${timestamp}.pdf`;

      // Download
      doc.save(filename);

      showToast("PDF file downloaded successfully!", "success");
      console.log("✅ PDF export successful");
    } catch (error) {
      console.error("❌ PDF export error:", error);
      showToast("Failed to export PDF file", "error");
    }
  }

  // Load jsPDF library
  function loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (typeof window.jspdf !== "undefined") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        const autoTableScript = document.createElement("script");
        autoTableScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
        autoTableScript.onload = resolve;
        autoTableScript.onerror = reject;
        document.head.appendChild(autoTableScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ============================================
  // 7️⃣ SHOW EXPORT MODAL
  // ============================================
  function showExportModal() {
    const reportData = getReportData();
    if (!reportData || reportData.data.length === 0) {
      showToast("No data available to export", "warning");
      return;
    }

    const modalHTML = `
      <div id="exportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="animation: fadeIn 0.3s ease-out;">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" style="animation: slideDown 0.3s ease-out;">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-800">Export Category Report</h3>
            <button onclick="window.closeExportModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p class="text-gray-600 mb-6">Choose export format for <span class="font-semibold text-blue-600">${reportData.data.length}</span> categories:</p>
          
          <div class="space-y-3">
            <button onclick="window.exportCategoryReport('excel')" 
              class="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <span class="flex items-center gap-3">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"/>
                  <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
                <span class="font-semibold">Export as Excel</span>
              </span>
              <span class="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">.xlsx</span>
            </button>

            <button onclick="window.exportCategoryReport('csv')" 
              class="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <span class="flex items-center gap-3">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"/>
                </svg>
                <span class="font-semibold">Export as CSV</span>
              </span>
              <span class="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">.csv</span>
            </button>

            <button onclick="window.exportCategoryReport('pdf')" 
              class="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <span class="flex items-center gap-3">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                </svg>
                <span class="font-semibold">Export as PDF</span>
              </span>
              <span class="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">.pdf</span>
            </button>
          </div>

          <button onclick="window.closeExportModal()" 
            class="w-full mt-6 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  // ============================================
  // 8️⃣ TOAST NOTIFICATIONS
  // ============================================
  function showToast(message, type = "info") {
    const colors = {
      success: "from-green-500 to-green-600",
      error: "from-red-500 to-red-600",
      warning: "from-yellow-500 to-yellow-600",
      info: "from-blue-500 to-blue-600",
    };

    const icons = {
      success:
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
      error:
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
      warning:
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    };

    const toast = document.createElement("div");
    toast.style.cssText =
      "position: fixed; top: 1rem; right: 1rem; z-index: 9999; animation: slideDown 0.3s ease-out;";
    toast.className = `bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3`;
    toast.innerHTML = `${icons[type]}<span class="font-medium">${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================
  // 9️⃣ GLOBAL FUNCTIONS & EVENT LISTENERS
  // ============================================

  // Export handler
  window.exportCategoryReport = function (format) {
    window.closeExportModal();

    switch (format) {
      case "excel":
        exportToExcel();
        break;
      case "csv":
        exportToCSV();
        break;
      case "pdf":
        exportToPDF();
        break;
      default:
        showToast("Invalid export format", "error");
    }
  };

  // Close modal
  window.closeExportModal = function () {
    const modal = document.getElementById("exportModal");
    if (modal) {
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 300);
    }
  };

  // Attach to export button
  const exportBtn =
    document.getElementById("exportBtn") ||
    document.querySelector("[data-export]") ||
    document.querySelector(".export-btn");

  if (exportBtn) {
    exportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showExportModal();
    });
    console.log("✅ Export button attached");
  }

  // Add required CSS animations if not present
  if (!document.getElementById("export-animations")) {
    const style = document.createElement("style");
    style.id = "export-animations";
    style.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  console.log("✅ Category Report initialized successfully");
}
