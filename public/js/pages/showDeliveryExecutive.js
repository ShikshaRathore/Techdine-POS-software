export function initPage() {
  // Search functionality
  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();

      // Desktop table rows
      const tableRows = document.querySelectorAll(
        "tbody tr[data-executive-id]"
      );
      tableRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });

      // Mobile cards
      const mobileCards = document.querySelectorAll(
        ".md\\:hidden > div[data-executive-id]"
      );
      mobileCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
}
