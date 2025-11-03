export function initPage() {
  // --- Elements ---
  const filterBtn = document.getElementById("availabilityFilterBtn");
  const dropdown = document.getElementById("availabilityDropdown");
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  const areaTabs = document.querySelectorAll(".area-tab");

  let currentAreaFilter = "all";
  let currentStatusFilter = "all";

  // --- Dropdown toggle ---
  if (filterBtn && dropdown) {
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", () => dropdown.classList.add("hidden"));
  }

  // --- Availability filter ---
  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      dropdownItems.forEach((i) =>
        i.classList.remove("bg-orange-50", "text-orange-600", "font-medium")
      );
      item.classList.add("bg-orange-50", "text-orange-600", "font-medium");
      currentStatusFilter = item.dataset.status;
      applyFilters();
      dropdown.classList.add("hidden");
    });
  });

  // --- Area Tabs ---
  areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      areaTabs.forEach((t) =>
        t.classList.remove(
          "bg-orange-100",
          "text-orange-600",
          "border-orange-200",
          "font-medium"
        )
      );
      tab.classList.add(
        "bg-orange-100",
        "text-orange-600",
        "border-orange-200",
        "font-medium"
      );
      currentAreaFilter = tab.dataset.area;
      applyFilters();
    });
  });

  // --- Filter Logic ---
  function applyFilters() {
    const allSections = document.querySelectorAll(".area-section");
    const allCards = document.querySelectorAll(".table-card");

    allSections.forEach((s) => s.classList.remove("hidden"));
    allCards.forEach((c) => c.classList.remove("hidden"));

    // Area filter
    if (currentAreaFilter !== "all") {
      allSections.forEach((s) => {
        if (s.dataset.areaId !== currentAreaFilter) s.classList.add("hidden");
      });
    }

    // Availability filter
    if (currentStatusFilter !== "all") {
      allCards.forEach((c) => {
        const status = c.dataset.status?.trim();
        if (status !== currentStatusFilter) c.classList.add("hidden");
      });
    }

    // Update counts
    allSections.forEach((s) => {
      if (!s.classList.contains("hidden")) {
        const visibleCards = s.querySelectorAll(".table-card:not(.hidden)");
        if (visibleCards.length === 0) s.classList.add("hidden");
        const countElement = s.querySelector(".table-count");
        if (countElement)
          countElement.textContent = `${visibleCards.length} Table${
            visibleCards.length !== 1 ? "s" : ""
          }`;
      }
    });
  }
}
