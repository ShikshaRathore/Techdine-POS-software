// ================================
// 🔍 SEARCH FILTER
// ================================
function initSearchFilter() {
  const searchInput = document.getElementById("searchPayments");
  searchInput?.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll("#paymentsTable tbody tr").forEach((row) => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(term) ? "" : "none";
    });
  });
}

// ================================
// 💾 EXPORT BUTTON CLICK
// ================================
function initExportButton() {
  const exportBtn = document.getElementById("exportBtn");
  exportBtn?.addEventListener("click", () => {
    const rows = Array.from(
      document.querySelectorAll("#paymentsTable tbody tr")
    )
      .filter((r) => r.style.display !== "none")
      .map((r) => {
        const tds = r.querySelectorAll("td");
        return {
          "#": tds[0]?.innerText || "",
          Amount: tds[1]?.innerText || "",
          "Payment Method": tds[2]?.innerText || "",
          "Transaction ID": tds[3]?.innerText || "",
          Order: tds[4]?.innerText || "",
          "Date & Time": tds[5]?.innerText || "",
        };
      });

    if (rows.length === 0) {
      alert("⚠️ No data to export!");
      return;
    }

    // Show modal for export format selection
    showExportModal(rows);
  });
}

// ================================
// 📦 EXPORT MODAL
// ================================
function showExportModal(data) {
  const modal = document.createElement("div");
  modal.id = "exportModal";
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-2xl shadow-xl w-80">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">Export Payments</h3>
        <div class="space-y-3">
          <button id="exportExcel" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Excel (.xlsx)</button>
          <button id="exportCSV" class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">CSV (.csv)</button>
          <button id="exportPDF" class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">PDF (.pdf)</button>
          <button id="cancelExport" class="w-full mt-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("cancelExport").onclick = () => modal.remove();
  document.getElementById("exportExcel").onclick = () => {
    exportToExcel(data);
    modal.remove();
  };
  document.getElementById("exportCSV").onclick = () => {
    exportToCSV(data);
    modal.remove();
  };
  document.getElementById("exportPDF").onclick = async () => {
    const btn = document.getElementById("exportPDF");
    btn.disabled = true;
    btn.textContent = "Generating PDF...";

    await exportToPDF(data);
    modal.remove();
  };
}

// ================================
// 🧾 EXPORT FUNCTIONS
// ================================
function exportToExcel(data) {
  if (typeof XLSX === "undefined") {
    alert("❌ XLSX library not loaded.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payments");
  XLSX.writeFile(wb, `Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  console.log("✅ Excel export complete");
}

function exportToCSV(data) {
  const headers = Object.keys(data[0]);
  const csv = [headers.join(",")].concat(
    data.map((r) => headers.map((h) => `"${r[h] || ""}"`).join(","))
  );
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Payments_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  console.log("✅ CSV export complete");
}

async function exportToPDF(data) {
  // Load jsPDF if not already loaded
  if (typeof window.jspdf === "undefined") {
    console.log("📦 Loading jsPDF library...");
    try {
      await loadJsPDFLibrary();
    } catch (err) {
      alert("❌ Failed to load PDF library. Please try again.");
      console.error("PDF library load error:", err);
      return;
    }
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Payment Records", 14, 20);

    // Prepare table data
    const headers = [Object.keys(data[0])];
    const rows = data.map((r) => Object.values(r));

    // Add table
    doc.autoTable({
      head: headers,
      body: rows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Save the PDF
    doc.save(`Payments_${new Date().toISOString().slice(0, 10)}.pdf`);
    console.log("✅ PDF export complete");
  } catch (err) {
    alert("❌ Error creating PDF. Please try again.");
    console.error("PDF creation error:", err);
  }
}

// Helper function to load jsPDF library
function loadJsPDFLibrary() {
  return new Promise((resolve, reject) => {
    // Load jsPDF main library
    const script1 = document.createElement("script");
    script1.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script1.onload = () => {
      console.log("✅ jsPDF main library loaded");

      // Load autoTable plugin
      const script2 = document.createElement("script");
      script2.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
      script2.onload = () => {
        console.log("✅ jsPDF autoTable plugin loaded");
        resolve();
      };
      script2.onerror = () => {
        console.error("❌ Failed to load jsPDF autoTable plugin");
        reject(new Error("Failed to load jsPDF autoTable plugin"));
      };
      document.head.appendChild(script2);
    };
    script1.onerror = () => {
      console.error("❌ Failed to load jsPDF library");
      reject(new Error("Failed to load jsPDF library"));
    };
    document.head.appendChild(script1);
  });
}

// ================================
// 🚀 MAIN INITIALIZATION FUNCTION
// ================================
export function initPage(branchId) {
  console.log("🔵 Initializing Payments page with branchId:", branchId);

  // Initialize search filter
  initSearchFilter();

  // Initialize export button
  initExportButton();

  console.log("✅ Payments page initialized successfully");
}
