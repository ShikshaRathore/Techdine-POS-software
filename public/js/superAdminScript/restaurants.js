let currentStatus = true;

function openEditModal(
  userId,
  restaurantName,
  username,
  email,
  phone,
  isActive
) {
  // Set form action dynamically with the user ID
  const form = document.getElementById("editRestaurantForm");
  form.action = `/admin-dashboard/restaurants/edit/${userId}`;

  document.getElementById("userId").value = userId;
  document.getElementById("restaurantName").value = restaurantName;
  document.getElementById("restaurantUsername").value = username;
  document.getElementById("restaurantEmail").value = email;
  document.getElementById("restaurantPhone").value = phone || "";

  // Convert string to boolean if needed
  const isActiveBoolean = isActive === true || isActive === "true";
  setStatus(isActiveBoolean);

  document.getElementById("editModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  document.body.style.overflow = "auto";
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

// Close modal when clicking outside
document.getElementById("editModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeEditModal();
  }
});

// Open Add Modal
function openAddModal() {
  document.getElementById("addModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  // Set default status to active
  setAddStatus(true);
}

// Close Add Modal
function closeAddModal() {
  document.getElementById("addModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  document.getElementById("addRestaurantForm").reset();
  setAddStatus(true); // Reset to active
}

// Set Status for Add Form
function setAddStatus(isActive) {
  const activeBtn = document.getElementById("addActiveBtn");
  const inactiveBtn = document.getElementById("addInactiveBtn");
  const statusInput = document.getElementById("addIsActive");

  if (isActive) {
    activeBtn.classList.add("border-orange-500", "bg-orange-50");
    activeBtn.classList.remove("border-gray-300");
    activeBtn.querySelector("span:last-child").classList.add("text-gray-900");
    activeBtn
      .querySelector("span:last-child")
      .classList.remove("text-gray-600");

    inactiveBtn.classList.remove("border-orange-500", "bg-orange-50");
    inactiveBtn.classList.add("border-gray-300");
    inactiveBtn
      .querySelector("span:last-child")
      .classList.remove("text-gray-900");
    inactiveBtn.querySelector("span:last-child").classList.add("text-gray-600");

    statusInput.value = "true";
  } else {
    inactiveBtn.classList.add("border-orange-500", "bg-orange-50");
    inactiveBtn.classList.remove("border-gray-300");
    inactiveBtn.querySelector("span:last-child").classList.add("text-gray-900");
    inactiveBtn
      .querySelector("span:last-child")
      .classList.remove("text-gray-600");

    activeBtn.classList.remove("border-orange-500", "bg-orange-50");
    activeBtn.classList.add("border-gray-300");
    activeBtn
      .querySelector("span:last-child")
      .classList.remove("text-gray-900");
    activeBtn.querySelector("span:last-child").classList.add("text-gray-600");

    statusInput.value = "false";
  }
}

// Toggle Password Visibility
function togglePassword() {
  const passwordInput = document.getElementById("addPassword");
  const icon = document.getElementById("togglePasswordIcon");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}
