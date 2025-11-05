export function initCustomerReservation(branchId) {
  console.log("🔵 Initializing Customer Reservations with branchId:", branchId);

  const BRANCH_ID = branchId;

  const timeSlots = {
    Breakfast: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
    Lunch: [
      "12:00 PM",
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
    ],
    Dinner: [
      "06:00 PM",
      "06:30 PM",
      "07:00 PM",
      "07:30 PM",
      "08:00 PM",
      "08:30 PM",
      "09:00 PM",
      "09:30 PM",
      "10:00 PM",
    ],
  };

  // Set default date
  const reservationDateInput = document.getElementById("reservationDate");
  if (reservationDateInput) {
    const today = new Date().toISOString().split("T")[0];
    reservationDateInput.value = today;
    reservationDateInput.min = today;
  }

  // Initialize with Lunch time slots (default)
  updateTimeSlots("Lunch");

  // Add event listener for meal period change
  const mealPeriodSelect = document.getElementById("mealPeriod");
  if (mealPeriodSelect) {
    mealPeriodSelect.addEventListener("change", function (e) {
      updateTimeSlots(e.target.value);
    });
  }

  function updateTimeSlots(mealPeriod) {
    const container = document.getElementById("timeSlotsContainer");
    if (!container) return;

    const slots = timeSlots[mealPeriod];
    container.innerHTML = "";

    slots.forEach((slot) => {
      const label = document.createElement("label");
      label.className = "cursor-pointer";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "timeSlot";
      input.value = slot;
      input.className = "peer hidden";
      input.required = true;

      const div = document.createElement("div");
      div.className =
        "px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-sm peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 font-semibold hover:border-orange-300 transition";
      div.textContent = slot;

      label.appendChild(input);
      label.appendChild(div);
      container.appendChild(label);
    });
  }

  window.loadAreaTables = async function () {
    const areaSelect = document.getElementById("areaSelect");
    const tableSelect = document.getElementById("tableSelect");
    const tableContainer = document.getElementById("tableSelectContainer");

    if (!areaSelect || !tableSelect || !tableContainer) return;

    const areaId = areaSelect.value;

    if (!areaId) {
      tableContainer.classList.add("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/reservation/areas/${areaId}/tables?branchId=${BRANCH_ID}`
      );
      const tables = await response.json();

      tableSelect.innerHTML = '<option value="">Choose a table...</option>';

      tables.forEach((table) => {
        const option = document.createElement("option");
        option.value = table._id;
        option.textContent = `Table ${table.tableCode} (${table.seatingCapacity} seats) - ${table.availabilityStatus}`;
        option.disabled = table.availabilityStatus !== "Available";
        tableSelect.appendChild(option);
      });

      tableContainer.classList.remove("hidden");
    } catch (error) {
      console.error("Error loading tables:", error);
      alert("Failed to load tables. Please try again.");
    }
  };

  window.submitReservation = async function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const data = {
      reservationDate: formData.get("reservationDate"),
      timeSlot: formData.get("timeSlot"),
      mealPeriod: formData.get("mealPeriod"),
      numberOfGuests: parseInt(formData.get("numberOfGuests")),
      area: formData.get("area"),
      table: formData.get("table"),
      specialRequests: formData.get("specialRequests"),
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: formData.get("customerEmail"),
    };

    try {
      const response = await fetch(`/restaurant/${BRANCH_ID}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Reservation created successfully!");
        // Redirect back to restaurant page
        window.location.href = `/restaurant/${BRANCH_ID}`;
      } else {
        alert(`Failed to create reservation: ${result.message}`);
      }
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation. Please try again.");
    }
  };

  // Make updateTimeSlots available globally for the select onchange
  window.updateTimeSlots = updateTimeSlots;

  console.log("✅ Customer Reservations initialized");
}
