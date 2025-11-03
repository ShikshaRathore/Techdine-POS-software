export function initPage() {
  // Filter functionality
  let activeFilter = "kitchen";

  const filterButtons = {
    kitchen: document.getElementById("filterKitchen"),
    ready: document.getElementById("filterReady"),
    served: document.getElementById("filterServed"),
  };

  const ordersContainer = document.getElementById("ordersContainer");
  const emptyState = document.getElementById("emptyState");

  function updateActiveButton(filter) {
    // Reset all buttons
    Object.values(filterButtons).forEach((btn) => {
      btn.classList.remove(
        "bg-yellow-100",
        "text-yellow-800",
        "border-yellow-300",
        "bg-blue-100",
        "text-blue-800",
        "border-blue-300",
        "bg-green-100",
        "text-green-800",
        "border-green-300"
      );
      btn.classList.add("bg-gray-100", "text-gray-600", "border-gray-300");
    });

    // Highlight active button
    if (filter === "kitchen") {
      filterButtons.kitchen.classList.remove(
        "bg-gray-100",
        "text-gray-600",
        "border-gray-300"
      );
      filterButtons.kitchen.classList.add(
        "bg-yellow-100",
        "text-yellow-800",
        "border-yellow-300"
      );
    } else if (filter === "ready") {
      filterButtons.ready.classList.remove(
        "bg-gray-100",
        "text-gray-600",
        "border-gray-300"
      );
      filterButtons.ready.classList.add(
        "bg-blue-100",
        "text-blue-800",
        "border-blue-300"
      );
    } else if (filter === "served") {
      filterButtons.served.classList.remove(
        "bg-gray-100",
        "text-gray-600",
        "border-gray-300"
      );
      filterButtons.served.classList.add(
        "bg-green-100",
        "text-green-800",
        "border-green-300"
      );
    }
  }

  function filterOrders(status) {
    activeFilter = status;
    updateActiveButton(status);

    const cards = document.querySelectorAll(".order-card");
    let visibleCount = 0;

    // Map status to data-status values
    const statusMap = {
      kitchen: "in-kitchen",
      ready: "food-is-ready",
      served: "food-is-served",
    };

    cards.forEach((card) => {
      const cardStatus = card.dataset.status;
      if (cardStatus === statusMap[status]) {
        card.classList.remove("hidden");
        visibleCount++;
      } else {
        card.classList.add("hidden");
      }
    });

    // Show/hide empty state
    if (visibleCount === 0) {
      if (emptyState) {
        emptyState.classList.remove("hidden");
      }
    } else {
      if (emptyState) {
        emptyState.classList.add("hidden");
      }
    }
  }

  // Event listeners
  filterButtons.kitchen?.addEventListener("click", () =>
    filterOrders("kitchen")
  );
  filterButtons.ready?.addEventListener("click", () => filterOrders("ready"));
  filterButtons.served?.addEventListener("click", () => filterOrders("served"));

  // Date filter
  document
    .getElementById("dateFilter")
    ?.addEventListener("change", function (e) {
      const fromDate = document.getElementById("fromDate");
      const toDate = document.getElementById("toDate");

      const today = new Date().toISOString().split("T")[0];

      switch (e.target.value) {
        case "today":
          fromDate.value = today;
          toDate.value = today;
          break;
        case "yesterday":
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          fromDate.value = yesterdayStr;
          toDate.value = yesterdayStr;
          break;
        case "this-week":
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          fromDate.value = weekStart.toISOString().split("T")[0];
          toDate.value = today;
          break;
      }
    });

  // Toast Function
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `
          px-4 py-2 rounded-lg shadow-lg text-white text-sm animate-fade-in-down
          ${type === "success" ? "bg-green-500" : "bg-red-500"}
        `;
    toast.textContent = message;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  }

  // Animations
  const style = document.createElement("style");
  style.textContent = `
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }
      `;
  document.head.appendChild(style);

  // AJAX Actions
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".ready-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const kotId = btn.closest(".kot-item").dataset.id;
        const res = await fetch(`/dashboard/kot/${kotId}/ready`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.success) {
          btn.closest(".kot-item").querySelector(".status").textContent =
            data.status.toUpperCase();
          btn.closest(".kot-item").querySelector(".status").className =
            "status inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded mb-4";
          btn.remove();
          showToast("✅ KOT marked as Ready!");
        } else showToast("❌ Failed to update KOT", "error");
      });
    });

    document.querySelectorAll(".served-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const kotId = btn.closest(".kot-item").dataset.id;
        const res = await fetch(`/dashboard/kot/${kotId}/served`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.success) {
          btn.closest(".kot-item").querySelector(".status").textContent =
            data.status.toUpperCase();
          btn.closest(".kot-item").querySelector(".status").className =
            "status inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded mb-4";
          btn.remove();
          showToast("✅ KOT marked as Served!");
        } else showToast("❌ Failed to update KOT", "error");
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const kotItem = btn.closest(".kot-item");
        const kotId = kotItem.dataset.id;
        if (!confirm("Are you sure you want to delete this KOT?")) return;

        const res = await fetch(`/dashboard/kot/${kotId}/delete`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.success) {
          kotItem.remove();
          showToast("🗑️ KOT deleted successfully!");
        } else showToast("❌ Failed to delete KOT", "error");
      });
    });
  });

  // Initialize with kitchen filter active
  updateActiveButton("kitchen");
  filterOrders("kitchen");
}
