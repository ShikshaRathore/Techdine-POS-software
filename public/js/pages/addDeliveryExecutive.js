export function initPage() {
  function openModal() {
    const modal = document.getElementById("modal");
    const overlay = document.getElementById("modalOverlay");
    const content = document.getElementById("modalContent");

    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Trigger animation
    setTimeout(() => {
      overlay.classList.remove("opacity-0");
      overlay.classList.add("opacity-100");
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }, 10);
  }

  function closeModal() {
    // Go back to previous page
    window.history.back();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const form = document.getElementById("executiveForm");
    if (form.checkValidity()) {
      // Add your form submission logic here
      console.log("Form submitted");

      // For now, just close the modal
      closeModal();
    } else {
      form.reportValidity();
    }
  }

  // Close modal when clicking outside
  document.getElementById("modalOverlay").addEventListener("click", closeModal);

  // Close modal with Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  // Make openModal available globally
  window.openModal = openModal;

  // Auto-open modal when page loads
  window.addEventListener("DOMContentLoaded", function () {
    openModal();
  });
}
