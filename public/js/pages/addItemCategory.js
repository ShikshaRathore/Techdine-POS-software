export function initPage() {
  const modal = document.getElementById("addCategoryModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const categoryForm = document.getElementById("categoryForm");
  const clearFormBtn = document.getElementById("clearFormBtn");

  // Close Modal
  function closeModal() {
    modal.remove();
    window.history.back();
  }

  closeModalBtn.addEventListener("click", closeModal);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Clear Form
  clearFormBtn.addEventListener("click", () => categoryForm.reset());
}
