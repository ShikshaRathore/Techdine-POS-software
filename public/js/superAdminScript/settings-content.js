// Preview image when file is selected
document
  .getElementById("logo-input")
  ?.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("logo-preview").src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

// Update color display
document
  .getElementById("theme-color-input")
  ?.addEventListener("change", function () {
    document.getElementById("color-display").textContent = this.value;
  });

// Remove logo modal
const removeLogoBtn = document.getElementById("remove-logo-btn");
const removeLogoModal = document.getElementById("remove-logo-modal");
const cancelRemove = document.getElementById("cancel-remove");
const confirmRemove = document.getElementById("confirm-remove");

removeLogoBtn?.addEventListener("click", function () {
  removeLogoModal.classList.remove("hidden");
});

cancelRemove?.addEventListener("click", function () {
  removeLogoModal.classList.add("hidden");
});

confirmRemove?.addEventListener("click", function () {
  document.getElementById("removeLogo").value = "true";
  document.getElementById("logo-preview").src = "/images/default-logo.png";
  const fileInput = document.getElementById("logo-input");
  if (fileInput) fileInput.value = "";
  removeLogoModal.classList.add("hidden");
});

// Close modal on outside click
removeLogoModal?.addEventListener("click", function (e) {
  if (e.target === removeLogoModal) {
    removeLogoModal.classList.add("hidden");
  }
});

// --------------- Email  -----------------
document
  .getElementById("test-smtp-btn")
  ?.addEventListener("click", async function () {
    const btn = this;
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Testing...";

    try {
      const response = await fetch("/appSettings/email/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        alert("✓ " + data.message);
        location.reload();
      } else {
        alert("✗ " + data.message);
      }
    } catch (error) {
      alert("✗ Failed to test SMTP connection");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

// ---------------- Language ---------------
// =========================
// DELETE LANGUAGE (MODAL)
// =========================

// Delete Language Modal Elements
const deleteLanguageModal = document.getElementById("delete-language-modal");
const deleteLanguageName = document.getElementById("delete-language-name");
const cancelDeleteLanguage = document.getElementById("cancel-delete-language");
const confirmDeleteLanguage = document.getElementById(
  "confirm-delete-language"
);

// Toast Elements
const successToast = document.getElementById("success-toast");
const errorToast = document.getElementById("error-toast");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");

// Store current deletion data
let currentDeleteData = { code: "", button: null, name: "" };

// Show toast helper
function showToast(type, message) {
  const toast = type === "success" ? successToast : errorToast;
  const messageEl = type === "success" ? successMessage : errorMessage;

  messageEl.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// Trigger delete language modal
function deleteLanguage(code, button) {
  const row = button.closest("tr");
  const languageName = row.querySelector("td:nth-child(2)").textContent.trim();

  currentDeleteData = { code, button, name: languageName };
  deleteLanguageName.textContent = languageName;

  deleteLanguageModal.classList.remove("hidden");
}

// Cancel delete
cancelDeleteLanguage?.addEventListener("click", () => {
  deleteLanguageModal.classList.add("hidden");
  currentDeleteData = { code: "", button: null, name: "" };
});

// Close modal on outside click
deleteLanguageModal?.addEventListener("click", (e) => {
  if (e.target === deleteLanguageModal) {
    deleteLanguageModal.classList.add("hidden");
    currentDeleteData = { code: "", button: null, name: "" };
  }
});

// Confirm delete
confirmDeleteLanguage?.addEventListener("click", async () => {
  const { code, button, name } = currentDeleteData;

  if (!code || !button) return;

  confirmDeleteLanguage.disabled = true;
  confirmDeleteLanguage.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Deleting...';

  try {
    const response = await fetch(`/appSettings/language/${code}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.success) {
      button.closest("tr").remove();
      deleteLanguageModal.classList.add("hidden");
      showToast("success", `${name} deleted successfully`);
    } else {
      showToast("error", data.message || "Failed to delete language");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("error", "Failed to delete language. Please try again.");
  } finally {
    confirmDeleteLanguage.disabled = false;
    confirmDeleteLanguage.innerHTML =
      '<i class="fas fa-trash"></i> Delete Language';
    currentDeleteData = { code: "", button: null, name: "" };
  }
});

// =========================
// ADD LANGUAGE (MODAL)
// =========================

const addLanguageBtn = document.getElementById("add-language-btn");
const addLanguageModal = document.getElementById("add-language-modal");
const closeLanguageModal = document.getElementById("close-language-modal");
const cancelLanguage = document.getElementById("cancel-language");
const addLanguageForm = document.getElementById("add-language-form");

// Open modal
addLanguageBtn?.addEventListener("click", () => {
  addLanguageModal.classList.remove("hidden");
});

// Close modal
closeLanguageModal?.addEventListener("click", () => {
  addLanguageModal.classList.add("hidden");
  addLanguageForm.reset();
});

cancelLanguage?.addEventListener("click", () => {
  addLanguageModal.classList.add("hidden");
  addLanguageForm.reset();
});

// Close modal when clicking outside
addLanguageModal?.addEventListener("click", (e) => {
  if (e.target === addLanguageModal) {
    addLanguageModal.classList.add("hidden");
    addLanguageForm.reset();
  }
});

// Submit Add Language
addLanguageForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(addLanguageForm);
  const code = formData.get("code").trim().toLowerCase();
  const name = formData.get("name").trim();
  const active = formData.get("active") === "on";
  const rtl = formData.get("rtl") === "on";

  const tbody = document.getElementById("languages-tbody");
  const index = tbody.querySelectorAll("tr").length;

  const newRow = `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 text-sm text-gray-900">
        ${code}
        <input type="hidden" name="languages[${index}][code]" value="${code}" />
      </td>
      <td class="px-6 py-4 text-sm text-gray-900">
        ${name}
        <input type="hidden" name="languages[${index}][name]" value="${name}" />
      </td>
      <td class="px-6 py-4">
        <input type="checkbox" name="languages[${index}][active]" ${
    active ? "checked" : ""
  } class="w-4 h-4 text-orange-500">
      </td>
      <td class="px-6 py-4">
        <input type="checkbox" name="languages[${index}][rtl]" ${
    rtl ? "checked" : ""
  } class="w-4 h-4 text-orange-500">
      </td>
      <td class="px-6 py-4">
        <button type="button" onclick="deleteLanguage('${code}', this)" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;

  tbody.insertAdjacentHTML("beforeend", newRow);

  addLanguageModal.classList.add("hidden");
  addLanguageForm.reset();
});

// -------------------- Curriences ---------------------------

// Add Currency Modal Functions
function openAddCurrencyModal() {
  document.getElementById("addCurrencyModal").classList.remove("hidden");
}

function closeAddCurrencyModal() {
  document.getElementById("addCurrencyModal").classList.add("hidden");
}

// Edit Currency Modal Functions
function openEditCurrencyModal(currencyJson) {
  const currency = JSON.parse(currencyJson);
  const modal = document.getElementById("editCurrencyModal");
  const form = document.getElementById("editCurrencyForm");

  // Set form action
  form.action = `/appSettings/currencies/update/${currency._id}`;

  // Populate form fields
  document.getElementById("editName").value = currency.name;
  document.getElementById("editCode").value = currency.code;
  document.getElementById("editSymbol").value = currency.symbol;
  document.getElementById("editExchangeRate").value = currency.exchangeRate;
  document.getElementById("editIsDefault").checked = currency.isDefault;

  modal.classList.remove("hidden");
}

function closeEditCurrencyModal() {
  document.getElementById("editCurrencyModal").classList.add("hidden");
}

// Delete Currency Function
function deleteCurrency(currencyId) {
  openDeleteModal(currencyId);
}

function openDeleteModal(currencyId) {
  document.getElementById("deleteCurrencyModal").classList.remove("hidden");
  document.getElementById("confirmDeleteBtn").onclick = function () {
    performDelete(currencyId);
  };
}

function closeDeleteModal() {
  document.getElementById("deleteCurrencyModal").classList.add("hidden");
}

function performDelete(currencyId) {
  const deleteBtn = document.getElementById("confirmDeleteBtn");
  const originalText = deleteBtn.innerHTML;

  // Show loading state
  deleteBtn.disabled = true;
  deleteBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';

  fetch(`/appSettings/currencies/delete/${currencyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show success state briefly
        deleteBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Deleted!';
        deleteBtn.classList.remove("bg-red-600", "hover:bg-red-700");
        deleteBtn.classList.add("bg-green-600");

        // Reload after short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert(data.message || "Failed to delete currency");
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = originalText;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while deleting the currency");
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalText;
    });
}

// Close modals on escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeAddCurrencyModal();
    closeEditCurrencyModal();
    closeDeleteModal();
  }
});

// Close modals on outside click
document
  .getElementById("addCurrencyModal")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      closeAddCurrencyModal();
    }
  });

document
  .getElementById("editCurrencyModal")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      closeEditCurrencyModal();
    }
  });

document
  .getElementById("deleteCurrencyModal")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      closeDeleteModal();
    }
  });
