export function initPage() {
  // Make functions available globally for dynamic loading
  window.customerPageFunctions = {
    exportToExcel: function () {
      const table = document.querySelector("table");
      const rows = Array.from(
        table.querySelectorAll(
          'tbody .customer-row:not([style*="display: none"])'
        )
      );

      if (rows.length === 0) {
        alert("No customers to export");
        return;
      }

      const data = rows.map((row) => ({
        "Customer Name": row.querySelector(".customer-name").textContent.trim(),
        "Email Address": row
          .querySelector(".customer-email")
          .textContent.trim(),
        Phone: row.querySelector(".customer-phone").textContent.trim(),
        "Total Orders": row
          .querySelector("span")
          .textContent.replace(" Orders", "")
          .trim(),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");

      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `customers_${date}.xlsx`);
    },

    openUpdateModal: function (id, name, email, phone, address) {
      document.getElementById("updateCustomerId").value = id;
      document.getElementById("updateName").value = name;
      document.getElementById("updateEmail").value = email;
      document.getElementById("updatePhone").value = phone;
      document.getElementById("updateAddress").value = address;
      document.getElementById("updateModal").classList.remove("hidden");
    },

    closeUpdateModal: function () {
      document.getElementById("updateModal").classList.add("hidden");
    },

    openDeleteModal: function (id, name) {
      document.getElementById("deleteCustomerId").value = id;
      document.getElementById("deleteCustomerName").textContent = name;
      document.getElementById("deleteModal").classList.remove("hidden");
    },

    closeDeleteModal: function () {
      document.getElementById("deleteModal").classList.add("hidden");
    },
  };

  // Initialize page functionality
  function initCustomerPage() {
    // Search functionality
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll(".customer-row");

        rows.forEach((row) => {
          const name = row
            .querySelector(".customer-name")
            .textContent.toLowerCase();
          const email = row
            .querySelector(".customer-email")
            .textContent.toLowerCase();
          const phone = row
            .querySelector(".customer-phone")
            .textContent.toLowerCase();

          if (
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            phone.includes(searchTerm)
          ) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        });
      });
    }

    // Export button
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener(
        "click",
        window.customerPageFunctions.exportToExcel
      );
    }

    // Update buttons
    document.querySelectorAll(".update-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const name = this.dataset.name;
        const email = this.dataset.email;
        const phone = this.dataset.phone;
        const address = this.dataset.address;
        window.customerPageFunctions.openUpdateModal(
          id,
          name,
          email,
          phone,
          address
        );
      });
    });

    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const name = this.dataset.name;
        window.customerPageFunctions.openDeleteModal(id, name);
      });
    });

    // Close update modal buttons
    const closeUpdateBtn = document.getElementById("closeUpdateBtn");
    const cancelUpdateBtn = document.getElementById("cancelUpdateBtn");
    if (closeUpdateBtn) {
      closeUpdateBtn.addEventListener(
        "click",
        window.customerPageFunctions.closeUpdateModal
      );
    }
    if (cancelUpdateBtn) {
      cancelUpdateBtn.addEventListener(
        "click",
        window.customerPageFunctions.closeUpdateModal
      );
    }

    // Close delete modal buttons
    const closeDeleteBtn = document.getElementById("closeDeleteBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    if (closeDeleteBtn) {
      closeDeleteBtn.addEventListener(
        "click",
        window.customerPageFunctions.closeDeleteModal
      );
    }
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener(
        "click",
        window.customerPageFunctions.closeDeleteModal
      );
    }

    // Close modals on ESC key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        window.customerPageFunctions.closeUpdateModal();
        window.customerPageFunctions.closeDeleteModal();
      }
    });

    // Close modals on background click
    const updateModal = document.getElementById("updateModal");
    const deleteModal = document.getElementById("deleteModal");

    if (updateModal) {
      updateModal.addEventListener("click", function (e) {
        if (e.target === this) window.customerPageFunctions.closeUpdateModal();
      });
    }

    if (deleteModal) {
      deleteModal.addEventListener("click", function (e) {
        if (e.target === this) window.customerPageFunctions.closeDeleteModal();
      });
    }
  }

  // Initialize on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCustomerPage);
  } else {
    initCustomerPage();
  }

  // Export initPage for external access
  window.initPage = initCustomerPage;
}
