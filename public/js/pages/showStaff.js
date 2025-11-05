let currentBranchId = "";

export function initPage(branchId) {
  console.log("✅ Initializing showStaff page with branchId:", branchId);
  currentBranchId = branchId;

  // Initialize immediately - XLSX should already be loaded globally
  setTimeout(() => {
    initializeStaffPage();
  }, 100);
}

function initializeStaffPage() {
  // Verify XLSX is available
  if (typeof window.XLSX === "undefined") {
    console.error("❌ XLSX library not loaded globally");
  } else {
    console.log("✅ XLSX library available:", window.XLSX.version);
  }

  // Search functionality
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll(".staff-row");

      rows.forEach((row) => {
        const name = row.dataset.name;
        const email = row.dataset.email;

        if (name.includes(searchTerm) || email.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }

  // Expose functions globally for onclick handlers
  window.exportToExcel = exportToExcel;
  window.openAddModal = openAddModal;
  window.closeAddModal = closeAddModal;
  window.openUpdateModal = openUpdateModal;
  window.closeUpdateModal = closeUpdateModal;
  window.updateRole = updateRole;
  window.deleteStaff = deleteStaff;

  // Set up modal backdrop click handlers
  const addModal = document.getElementById("addModal");
  const updateModal = document.getElementById("updateModal");

  if (addModal) {
    addModal.addEventListener("click", function (e) {
      if (e.target === this) closeAddModal();
    });
  }

  if (updateModal) {
    updateModal.addEventListener("click", function (e) {
      if (e.target === this) closeUpdateModal();
    });
  }

  console.log("✅ Staff page initialized successfully");
}

// Export to Excel
function exportToExcel() {
  try {
    if (typeof window.XLSX === "undefined") {
      console.error("❌ XLSX library not available");
      alert("Excel export library not loaded. Please refresh the page.");
      return;
    }

    console.log("📊 Exporting table to Excel...");

    // Get all staff rows (excluding the current user row if needed)
    const rows = document.querySelectorAll(".staff-row");

    // Create data array for Excel
    const data = [];

    // Add headers
    data.push(["Member Name", "Email Address", "Role"]);

    // Add data rows
    rows.forEach((row) => {
      const name = row.querySelector("td:nth-child(1)")?.textContent.trim();
      const email = row.querySelector("td:nth-child(2)")?.textContent.trim();

      // Get role from either the badge or the select dropdown
      let role = "";
      const roleBadge = row.querySelector("td:nth-child(3) span");
      const roleSelect = row.querySelector("td:nth-child(3) select");

      if (roleBadge) {
        // For the current user (Hotel Admin with badge)
        role = roleBadge.textContent.trim();
      } else if (roleSelect) {
        // For other staff members (with dropdown)
        role = roleSelect.value;
      }

      if (name && email && role) {
        data.push([name, email, role]);
      }
    });

    // Create workbook and worksheet
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Member Name
      { wch: 30 }, // Email Address
      { wch: 15 }, // Role
    ];

    // Add worksheet to workbook
    window.XLSX.utils.book_append_sheet(wb, ws, "Staff");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `staff_list_${timestamp}.xlsx`;

    // Save file
    window.XLSX.writeFile(wb, filename);
    console.log("✅ Export successful");
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error);
    alert("Error exporting to Excel: " + error.message);
  }
}

// Modal functions
function openAddModal() {
  const modal = document.getElementById("addModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeAddModal() {
  const modal = document.getElementById("addModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function openUpdateModal(id, name, email, phone, role) {
  document.getElementById("updateName").value = name;
  document.getElementById("updateEmail").value = email;
  document.getElementById("updatePhone").value = phone;
  document.getElementById("updateRole").value = role;
  document.getElementById(
    "updateForm"
  ).action = `/staff/update/${currentBranchId}/${id}`;
  document.getElementById("updateModal").classList.remove("hidden");
}

function closeUpdateModal() {
  const modal = document.getElementById("updateModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Update role
async function updateRole(staffId, newRole) {
  if (confirm("Are you sure you want to change this staff member's role?")) {
    try {
      const response = await fetch(
        `/staff/update-role/${currentBranchId}/${staffId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Role updated successfully");
        window.location.reload();
      } else {
        alert("Error updating role: " + (data.message || "Unknown error"));
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating role");
      window.location.reload();
    }
  } else {
    // Reset the dropdown to original value
    window.location.reload();
  }
}

// Delete staff
async function deleteStaff(staffId, name) {
  if (
    confirm(
      `Are you sure you want to delete ${name}? This action cannot be undone.`
    )
  ) {
    try {
      const response = await fetch(
        `/staff/delete/${currentBranchId}/${staffId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Staff member deleted successfully");
        window.location.reload();
      } else {
        alert(
          "Error deleting staff member: " + (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting staff member");
    }
  }
}
