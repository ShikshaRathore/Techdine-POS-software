export function initPage() {
  // Edit Modal Logic
  document.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener("click", function () {
      const areaId = this.dataset.areaId;
      const areaName = this.dataset.areaName;

      // Set form action dynamically
      document.getElementById("editForm").action = `/updateArea/${areaId}`;
      document.getElementById("editAreaId").value = areaId;
      document.getElementById("editAreaName").value = areaName;

      // Show modal
      document.getElementById("editModal").classList.remove("hidden");
    });
  });

  // Delete Modal Logic
  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener("click", function () {
      const areaId = this.dataset.areaId;
      const areaName = this.dataset.areaName;
      const tableCount = parseInt(this.dataset.tableCount || 0);

      // Set form action dynamically
      document.getElementById("deleteForm").action = `/deleteArea/${areaId}`;
      document.getElementById("deleteAreaId").value = areaId;
      document.getElementById("deleteAreaName").textContent = areaName;

      // Show/hide warning about tables
      const warningDiv = document.getElementById("deleteWarning");
      if (tableCount > 0) {
        document.getElementById("deleteTableCount").textContent = tableCount;
        warningDiv.classList.remove("hidden");
      } else {
        warningDiv.classList.add("hidden");
      }

      // Show modal
      document.getElementById("deleteModal").classList.remove("hidden");
    });
  });

  // Close Modal Logic
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", function () {
      const modalType = this.dataset.close;
      if (modalType === "edit-modal") {
        document.getElementById("editModal").classList.add("hidden");
      } else if (modalType === "delete-modal") {
        document.getElementById("deleteModal").classList.add("hidden");
      }
    });
  });

  // Close modal when clicking outside
  document.getElementById("editModal").addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.add("hidden");
    }
  });

  document
    .getElementById("deleteModal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.add("hidden");
      }
    });
}

initPage();
