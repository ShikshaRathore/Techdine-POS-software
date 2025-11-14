// Make modal functions globally accessible
window.openEditModal = function (categoryId, categoryName) {
  document.getElementById("editCategoryId").value = categoryId;

  const input = document.getElementById("editCategoryName");

  input.value = null; // remove value attribute completely
  input.placeholder = categoryName;

  document.getElementById("editModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

window.closeEditModal = function () {
  document.getElementById("editModal").classList.add("hidden");
  document.body.style.overflow = "auto";
};

window.openDeleteModal = function (categoryId, categoryName) {
  document.getElementById("deleteCategoryId").value = categoryId;
  document.getElementById("deleteCategoryName").textContent = categoryName;
  document.getElementById("deleteModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

window.closeDeleteModal = function () {
  document.getElementById("deleteModal").classList.add("hidden");
  document.body.style.overflow = "auto";
};

export function initPage() {
  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const categoryRows = document.querySelectorAll(".category-row");
  const noResults = document.getElementById("noResults");

  if (searchInput && categoryRows.length > 0) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      let visibleCount = 0;

      categoryRows.forEach((row) => {
        const categoryName = row.getAttribute("data-category");
        if (categoryName && categoryName.toLowerCase().includes(searchTerm)) {
          row.style.display = "";
          visibleCount++;
        } else {
          row.style.display = "none";
        }
      });

      // Show/hide no results message
      if (noResults) {
        if (visibleCount === 0) {
          noResults.classList.remove("hidden");
        } else {
          noResults.classList.add("hidden");
        }
      }
    });
  }

  // Close modal when clicking outside
  const editModal = document.getElementById("editModal");
  const deleteModal = document.getElementById("deleteModal");

  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === this) window.closeEditModal();
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener("click", function (e) {
      if (e.target === this) window.closeDeleteModal();
    });
  }

  // Close modal on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      window.closeEditModal();
      window.closeDeleteModal();
    }
  });

  // Add close button event listeners
  const editCloseBtn = document.querySelector(
    '#editModal button[onclick*="closeEditModal"]'
  );
  const deleteCloseBtn = document.querySelector(
    '#deleteModal button[onclick*="closeDeleteModal"]'
  );

  if (editCloseBtn) {
    editCloseBtn.addEventListener("click", window.closeEditModal);
  }

  if (deleteCloseBtn) {
    deleteCloseBtn.addEventListener("click", window.closeDeleteModal);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
