export function initPage() {
  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const categoryRows = document.querySelectorAll(".category-row");
  const noResults = document.getElementById("noResults");

  searchInput.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    let visibleCount = 0;

    categoryRows.forEach((row) => {
      const categoryName = row.getAttribute("data-category");
      if (categoryName.includes(searchTerm)) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    // Show/hide no results message
    if (visibleCount === 0) {
      noResults.classList.remove("hidden");
    } else {
      noResults.classList.add("hidden");
    }
  });
}
