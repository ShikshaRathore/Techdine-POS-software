// Wrap everything in DOMContentLoaded or IIFE to ensure elements exist
(function () {
  let selectedCategories = [];
  let selectedTypes = [];
  let searchQuery = "";

  // DOM Elements - check if they exist
  const showFiltersBtn = document.getElementById("showFiltersBtn");
  const hideFiltersBtn = document.getElementById("hideFiltersBtn");
  const filtersSection = document.getElementById("filtersSection");
  const categoryFilterBtn = document.getElementById("categoryFilterBtn");
  const typeFilterBtn = document.getElementById("typeFilterBtn");
  const categoryDropdown = document.getElementById("categoryDropdown");
  const typeDropdown = document.getElementById("typeDropdown");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const searchInput = document.getElementById("searchInput");
  const noResults = document.getElementById("noResults");
  const categoryBadge = document.getElementById("categoryBadge");
  const typeBadge = document.getElementById("typeBadge");

  // Exit if elements don't exist
  if (!showFiltersBtn || !searchInput) {
    console.error("Menu items elements not found");
    return;
  }

  // Toggle Filters Section
  showFiltersBtn.addEventListener("click", () => {
    filtersSection.classList.remove("hidden");
  });

  hideFiltersBtn.addEventListener("click", () => {
    filtersSection.classList.add("hidden");
  });

  // Toggle Dropdowns
  categoryFilterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    categoryDropdown.classList.toggle("hidden");
    typeDropdown.classList.add("hidden");
  });

  typeFilterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    typeDropdown.classList.toggle("hidden");
    categoryDropdown.classList.add("hidden");
  });

  //   // Close dropdowns when clicking outside
  //   document.addEventListener("click", () => {
  //     categoryDropdown.classList.add("hidden");
  //     typeDropdown.classList.add("hidden");
  //   });

  // Category Filter
  document.querySelectorAll(".category-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      selectedCategories = Array.from(
        document.querySelectorAll(".category-checkbox:checked")
      ).map((cb) => cb.value);
      updateBadge(categoryBadge, selectedCategories.length);
      filterItems();
    });
  });

  // Type Filter
  document.querySelectorAll(".type-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      selectedTypes = Array.from(
        document.querySelectorAll(".type-checkbox:checked")
      ).map((cb) => cb.value);
      updateBadge(typeBadge, selectedTypes.length);
      filterItems();
    });
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    filterItems();
  });

  // Clear Filters
  clearFiltersBtn.addEventListener("click", () => {
    document
      .querySelectorAll(".category-checkbox")
      .forEach((cb) => (cb.checked = false));
    document
      .querySelectorAll(".type-checkbox")
      .forEach((cb) => (cb.checked = false));
    selectedCategories = [];
    selectedTypes = [];
    searchQuery = "";
    searchInput.value = "";
    updateBadge(categoryBadge, 0);
    updateBadge(typeBadge, 0);
    filterItems();
  });

  // Update Badge
  function updateBadge(badge, count) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  // Filter Items (Client-side filtering)
  function filterItems() {
    const rows = document.querySelectorAll(".menu-item-row");
    let visibleCount = 0;

    rows.forEach((row) => {
      const name = row.dataset.name;
      const description = row.dataset.description;
      const category = row.dataset.category;
      const type = row.dataset.type;

      const matchesSearch =
        searchQuery === "" ||
        name.includes(searchQuery) ||
        description.includes(searchQuery);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some(
          (cat) => cat.toLowerCase() === category.toLowerCase()
        );
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(type);

      if (matchesSearch && matchesCategory && matchesType) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    // Show/hide no results message
    if (visibleCount === 0) {
      noResults.classList.remove("hidden");
      noResults.querySelector("p:last-child").textContent =
        "Try adjusting your filters or search query";
    } else {
      noResults.classList.add("hidden");
    }
  }
})(); // End of IIFE
