// export function initPage() {
//   // --- Elements ---
//   const filterBtn = document.getElementById("availabilityFilterBtn");
//   const dropdown = document.getElementById("availabilityDropdown");
//   const dropdownItems = document.querySelectorAll(".dropdown-item");
//   const areaTabs = document.querySelectorAll(".area-tab");

//   let currentAreaFilter = "all";
//   let currentStatusFilter = "all";

//   // --- Dropdown toggle ---
//   if (filterBtn && dropdown) {
//     filterBtn.addEventListener("click", (e) => {
//       e.stopPropagation();
//       dropdown.classList.toggle("hidden");
//     });
//     document.addEventListener("click", () => dropdown.classList.add("hidden"));
//   }

//   // --- Availability filter ---
//   dropdownItems.forEach((item) => {
//     item.addEventListener("click", () => {
//       dropdownItems.forEach((i) =>
//         i.classList.remove("bg-orange-50", "text-orange-600", "font-medium")
//       );
//       item.classList.add("bg-orange-50", "text-orange-600", "font-medium");
//       currentStatusFilter = item.dataset.status;
//       applyFilters();
//       dropdown.classList.add("hidden");
//     });
//   });

//   // --- Area Tabs ---
//   areaTabs.forEach((tab) => {
//     tab.addEventListener("click", () => {
//       areaTabs.forEach((t) =>
//         t.classList.remove(
//           "bg-orange-100",
//           "text-orange-600",
//           "border-orange-200",
//           "font-medium"
//         )
//       );
//       tab.classList.add(
//         "bg-orange-100",
//         "text-orange-600",
//         "border-orange-200",
//         "font-medium"
//       );
//       currentAreaFilter = tab.dataset.area;
//       applyFilters();
//     });
//   });

//   // --- Filter Logic ---
//   function applyFilters() {
//     const allSections = document.querySelectorAll(".area-section");
//     const allCards = document.querySelectorAll(".table-card");

//     allSections.forEach((s) => s.classList.remove("hidden"));
//     allCards.forEach((c) => c.classList.remove("hidden"));

//     // Area filter
//     if (currentAreaFilter !== "all") {
//       allSections.forEach((s) => {
//         if (s.dataset.areaId !== currentAreaFilter) s.classList.add("hidden");
//       });
//     }

//     // Availability filter
//     if (currentStatusFilter !== "all") {
//       allCards.forEach((c) => {
//         const status = c.dataset.status?.trim();
//         if (status !== currentStatusFilter) c.classList.add("hidden");
//       });
//     }

//     // Update counts
//     allSections.forEach((s) => {
//       if (!s.classList.contains("hidden")) {
//         const visibleCards = s.querySelectorAll(".table-card:not(.hidden)");
//         if (visibleCards.length === 0) s.classList.add("hidden");
//         const countElement = s.querySelector(".table-count");
//         if (countElement)
//           countElement.textContent = `${visibleCards.length} Table${
//             visibleCards.length !== 1 ? "s" : ""
//           }`;
//       }
//     });
//   }
// }

export function initPage() {
  // Filter functionality
  const filterBtn = document.getElementById("availabilityFilterBtn");
  const dropdown = document.getElementById("availabilityDropdown");
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  filterBtn.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
  });

  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      const status = item.dataset.status;
      filterTables(status);
      dropdown.classList.add("hidden");

      dropdownItems.forEach((i) => {
        i.classList.remove("bg-orange-50", "text-orange-600", "font-medium");
      });
      item.classList.add("bg-orange-50", "text-orange-600", "font-medium");
    });
  });

  function filterTables(status) {
    const cards = document.querySelectorAll(".table-card");
    cards.forEach((card) => {
      if (status === "all" || card.dataset.status === status) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Area tabs functionality
  const areaTabs = document.querySelectorAll(".area-tab");
  const areaSections = document.querySelectorAll(".area-section");

  areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const area = tab.dataset.area;

      areaTabs.forEach((t) => {
        t.classList.remove(
          "bg-orange-100",
          "text-orange-600",
          "border-orange-200"
        );
        t.classList.add("bg-white", "text-gray-600", "border-gray-300");
      });
      tab.classList.add(
        "bg-orange-100",
        "text-orange-600",
        "border-orange-200"
      );
      tab.classList.remove("bg-white", "text-gray-600", "border-gray-300");

      areaSections.forEach((section) => {
        if (area === "all" || section.dataset.areaId === area) {
          section.style.display = "block";
        } else {
          section.style.display = "none";
        }
      });
    });
  });

  // Modal functionality
  const modal = document.getElementById("editTableModal");
  const editForm = document.getElementById("editTableForm");
  const editBtns = document.querySelectorAll(".edit-table-btn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const deleteTableBtn = document.getElementById("deleteTableBtn");
  const statusBtns = document.querySelectorAll(".status-btn");
  const statusInput = document.getElementById("editStatusInput");

  let currentTableId = null;

  // Open modal and load table data
  editBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      currentTableId = btn.dataset.tableId;

      try {
        const response = await fetch(`/tables/api/table/${currentTableId}`);
        const data = await response.json();

        if (data.success) {
          // Populate form
          document.getElementById("editTableCode").value = data.table.tableCode;
          document.getElementById("editSeatingCapacity").value =
            data.table.seatingCapacity;
          document.getElementById("editAvailabilityStatus").value =
            data.table.availabilityStatus;
          statusInput.value = data.table.status;

          // Populate area dropdown
          const areaSelect = document.getElementById("editAreaSelect");
          areaSelect.innerHTML = '<option value="">Select Area</option>';
          data.areas.forEach((area) => {
            const option = document.createElement("option");
            option.value = area._id;
            option.textContent = area.name;
            if (area._id === data.table.area) {
              option.selected = true;
            }
            areaSelect.appendChild(option);
          });

          // Update status buttons
          updateStatusButtons(data.table.status);

          // Set form action
          editForm.action = `/tables/updateTable/${currentTableId}`;

          // Show modal
          modal.classList.remove("hidden");
        }
      } catch (err) {
        console.error("Error loading table data:", err);
        alert("Failed to load table data");
      }
    });
  });

  // Status button toggle
  statusBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const status = btn.dataset.status;
      statusInput.value = status;
      updateStatusButtons(status);
    });
  });

  function updateStatusButtons(status) {
    statusBtns.forEach((btn) => {
      if (btn.dataset.status === status) {
        btn.classList.add("border-orange-500", "bg-orange-500", "text-white");
        btn.classList.remove("border-gray-300", "bg-white", "text-gray-700");
      } else {
        btn.classList.remove(
          "border-orange-500",
          "bg-orange-500",
          "text-white"
        );
        btn.classList.add("border-gray-300", "bg-white", "text-gray-700");
      }
    });
  }

  // Close modal
  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  cancelModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Close modal on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Delete table
  deleteTableBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this table?")) {
      const deleteForm = document.createElement("form");
      deleteForm.method = "POST";
      deleteForm.action = `/tables/deleteTable/${currentTableId}`;
      document.body.appendChild(deleteForm);
      deleteForm.submit();
    }
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!filterBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
}
