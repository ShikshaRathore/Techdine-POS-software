let currentStatus = true;

function openEditModal(id, name, email, isActive) {
  document.getElementById("restaurantId").value = id;
  document.getElementById("branchName").value = name;
  document.getElementById("ownerEmail").value = email;
  setStatus(isActive);
  document.getElementById("editModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  document.getElementById("errorMessage").classList.add("hidden");
  document.getElementById("successMessage").classList.add("hidden");
}

function setStatus(isActive) {
  currentStatus = isActive;
  document.getElementById("isActive").value = isActive;

  const activeBtn = document.getElementById("activeBtn");
  const inactiveBtn = document.getElementById("inactiveBtn");

  if (isActive) {
    activeBtn.classList.add("border-green-500", "bg-green-50");
    activeBtn.classList.remove("border-gray-300");
    inactiveBtn.classList.remove("border-red-500", "bg-red-50");
    inactiveBtn.classList.add("border-gray-300");
  } else {
    inactiveBtn.classList.add("border-red-500", "bg-red-50");
    inactiveBtn.classList.remove("border-gray-300");
    activeBtn.classList.remove("border-green-500", "bg-green-50");
    activeBtn.classList.add("border-gray-300");
  }
}

// Handle form submission
document
  .getElementById("editRestaurantForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      branchName: document.getElementById("branchName").value,
      ownerEmail: document.getElementById("ownerEmail").value,
      isActive: document.getElementById("isActive").value === "true",
    };

    const restaurantId = document.getElementById("restaurantId").value;

    try {
      const response = await fetch(
        `/admin-dashboard/edit-branch/${restaurantId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Show success message
        document.getElementById("successText").textContent =
          result.message || "Restaurant updated successfully!";
        document.getElementById("successMessage").classList.remove("hidden");
        document.getElementById("errorMessage").classList.add("hidden");

        // Reload page after 1.5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Show error message
        document.getElementById("errorText").textContent =
          result.message || "Failed to update restaurant";
        document.getElementById("errorMessage").classList.remove("hidden");
        document.getElementById("successMessage").classList.add("hidden");
      }
    } catch (error) {
      document.getElementById("errorText").textContent =
        "An error occurred. Please try again.";
      document.getElementById("errorMessage").classList.remove("hidden");
      document.getElementById("successMessage").classList.add("hidden");
    }
  });

// Close modal when clicking outside
document.getElementById("editModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeEditModal();
  }
});
