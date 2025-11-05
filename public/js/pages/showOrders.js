export function initPage() {
  async function applyFilters() {
    const form = document.getElementById("filterForm");
    const query = new URLSearchParams(new FormData(form)).toString();
    const branchId = form.dataset.branchId;

    const res = await fetch(`/showOrders/${branchId}?${query}`);
    const html = await res.text();

    const temp = document.createElement("div");
    temp.innerHTML = html;
    const newOrders = temp.querySelector("#ordersContainer");
    document.querySelector("#ordersContainer").innerHTML =
      newOrders?.innerHTML || "";

    attachOrderClickHandlers();
  }

  function handleDateFilterChange() {
    const dateFilterSelect = document.getElementById("dateFilter");
    const customContainer = document.getElementById("customDateContainer");

    if (dateFilterSelect.value === "custom") {
      customContainer.classList.remove("hidden");
    } else {
      customContainer.classList.add("hidden");
      applyFilters();
    }
  }

  async function loadOrderInPOS(orderId, branchId) {
    try {
      console.log("🔍 Loading order:", orderId, "for branch:", branchId);

      // Fetch order details
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server returned ${response.status}`
        );
      }

      const result = await response.json();
      const order = result.data || result;
      console.log("📦 Order data:", order);

      // Load POS page via the global dashboard function
      if (typeof window.loadDashboardContent === "function") {
        console.log("🔵 Loading POS via loadDashboardContent");
        await window.loadDashboardContent(`/pos/${branchId}`);

        // Wait for POS to initialize and populate order
        setTimeout(() => {
          if (window.currentPOS) {
            console.log("✅ POS loaded, populating order");
            populateOrderInPOS(order);
          } else {
            console.warn("⚠️ POS not ready, waiting...");
            setTimeout(() => {
              if (window.currentPOS) {
                populateOrderInPOS(order);
              } else {
                console.error("❌ POS still not ready after delay");
                showNotification(
                  "POS failed to load. Please try again.",
                  "error"
                );
              }
            }, 1000);
          }
        }, 500);
      } else {
        console.error("❌ loadDashboardContent not available, redirecting");
        window.location.href = `/pos/${branchId}?orderId=${orderId}`;
      }
    } catch (err) {
      console.error("❌ Failed to load order:", err);
      showNotification(`Failed to load order: ${err.message}`, "error");
    }
  }

  function populateOrderInPOS(order) {
    console.log("🎨 Populating POS with order:", order);

    if (!window.currentPOS) {
      console.error("❌ POS object not available");
      showNotification("POS not ready. Please try again.", "error");
      return;
    }

    const POS = window.currentPOS;

    try {
      // Clear existing items and set order data
      POS.orderItems = [];
      POS.currentOrderId = order._id;
      POS.currentOrderStatus = order.status;
      POS.orderNumber = order.orderNumber;

      // Set customer data
      if (order.customer) {
        POS.customerData = {
          name: order.customer.name || "Walk-in Customer",
          phone: order.customer.phone || "",
          email: order.customer.email || "",
          address: order.customer.address || "",
        };

        const customerSelect = document.getElementById("customerSelect");
        if (customerSelect && order.customer.name) {
          customerSelect.innerHTML = `<option>${order.customer.name}${
            order.customer.phone ? " - " + order.customer.phone : ""
          }</option>`;
        }
      }

      // Set service type
      const orderTypeMap = {
        "Dine In": "dine-in",
        Delivery: "delivery",
        Pickup: "pickup",
      };
      const serviceTypeValue = orderTypeMap[order.orderType] || "dine-in";
      const serviceTypeRadio = document.querySelector(
        `input[name="serviceType"][value="${serviceTypeValue}"]`
      );
      if (serviceTypeRadio) {
        serviceTypeRadio.checked = true;
      }

      // Set pax count
      const paxInput = document.getElementById("paxCount");
      if (paxInput && order.pax) {
        paxInput.value = order.pax;
      }

      // Update order number display
      const orderNumberEl = document.querySelector("[data-order-number]");
      if (orderNumberEl) {
        orderNumberEl.textContent = `Order #${order.orderNumber}`;
        orderNumberEl.dataset.orderId = order._id;
      }

      // Add items to POS
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const orderItem = {
            id: item.menuItem?._id || item.menuItem,
            name: item.menuItem?.itemName || item.name || "Unknown Item",
            price: item.price || 0,
            quantity: item.quantity || 1,
            type: item.menuItem?.type || "Veg",
          };
          POS.orderItems.push(orderItem);
        });
      }

      // Update the display
      POS.updateOrder();

      console.log("✅ Order loaded successfully");
      showNotification(`Order #${order.orderNumber} loaded`, "success");

      // Add status control and configure buttons
      addStatusControl(order);
      configureActionButtons(order);
    } catch (err) {
      console.error("❌ Error populating order:", err);
      showNotification("Failed to populate order data", "error");
    }
  }

  function addStatusControl(order) {
    const controlPanel = document.querySelector("[data-control-panel]");
    if (!controlPanel) {
      console.warn("⚠️ Control panel not found");
      return;
    }

    // Remove existing status control
    const existing = document.getElementById("orderStatusControl");
    if (existing) existing.remove();

    const statusOptions = [
      "KOT",
      "Billed",
      "Paid",
      "Payment Due",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
    ];

    const statusHtml = `
      <div id="orderStatusControl" class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label class="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
        <select 
          id="orderStatusSelect" 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          onchange="handleOrderStatusChange(this.value)"
        >
          ${statusOptions
            .map(
              (status) => `
            <option value="${status}" ${
                order.status === status ? "selected" : ""
              }>
              ${status}
            </option>
          `
            )
            .join("")}
        </select>
      </div>
    `;

    controlPanel.insertAdjacentHTML("afterbegin", statusHtml);
  }

  function configureActionButtons(order) {
    const actionContainer = document.querySelector("[data-action-buttons]");
    if (!actionContainer) {
      console.warn("⚠️ Action buttons container not found");
      return;
    }

    // Hide default buttons
    const defaultButtons = actionContainer.querySelectorAll("button");
    defaultButtons.forEach((btn) => (btn.style.display = "none"));

    const status = order.status;
    const paymentStatus = order.paymentStatus;

    let buttons = [];

    if (status === "KOT") {
      buttons = [
        {
          label: "Generate Bill",
          class: "bg-green-500 hover:bg-green-600",
          action: "generateBill",
        },
        {
          label: "Print KOT",
          class: "bg-gray-700 hover:bg-gray-800",
          action: "printKOT",
        },
      ];
    } else if (status === "Billed" && paymentStatus === "Unpaid") {
      buttons = [
        {
          label: "Add Payment",
          class: "bg-green-500 hover:bg-green-600",
          action: "addPayment",
        },
        {
          label: "Print Bill",
          class: "bg-gray-700 hover:bg-gray-800",
          action: "printBill",
        },
      ];
    } else if (status === "Paid" || paymentStatus === "Paid") {
      buttons = [
        {
          label: "Print Receipt",
          class: "bg-gray-700 hover:bg-gray-800",
          action: "printReceipt",
        },
      ];
    } else if (status === "Payment Due" || paymentStatus === "Unpaid") {
      buttons = [
        {
          label: "Add Payment",
          class: "bg-green-500 hover:bg-green-600",
          action: "addPayment",
        },
        {
          label: "Print Receipt",
          class: "bg-gray-700 hover:bg-gray-800",
          action: "printReceipt",
        },
      ];
    }

    // Clear and add new buttons
    actionContainer.innerHTML = "";
    buttons.forEach((btn) => {
      const buttonHtml = `
        <button 
          class="${btn.class} text-white px-6 py-3 rounded-lg font-semibold shadow-md transition col-span-1"
          onclick="handleOrderAction('${btn.action}', '${order._id}')"
        >
          ${btn.label}
        </button>
      `;
      actionContainer.insertAdjacentHTML("beforeend", buttonHtml);
    });
  }

  function attachOrderClickHandlers() {
    const orderCards = document.querySelectorAll("[data-order-id]");
    console.log("🔗 Attaching handlers to", orderCards.length, "orders");

    orderCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const orderId = card.dataset.orderId;
        const branchId = card.dataset.branchId;
        console.log("🖱️ Clicked order:", orderId);
        loadOrderInPOS(orderId, branchId);
      });
    });
  }

  // Global functions for order actions
  window.handleOrderStatusChange = async function (newStatus) {
    const orderIdEl = document.querySelector("[data-order-number]");
    if (!orderIdEl || !orderIdEl.dataset.orderId) return;

    const orderId = orderIdEl.dataset.orderId;

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      const result = await response.json();
      const updatedOrder = result.data || result;

      if (window.currentPOS) {
        window.currentPOS.currentOrderStatus = newStatus;
      }

      configureActionButtons(updatedOrder);
      showNotification("Status updated successfully", "success");
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification("Failed to update status", "error");
    }
  };

  window.handleOrderAction = async function (action, orderId) {
    try {
      console.log("🎬 Action:", action, "for order:", orderId);

      switch (action) {
        case "generateBill":
          if (window.currentPOS && window.currentPOS.billOrder) {
            window.currentPOS.billOrder();
          } else {
            showNotification("Generate bill functionality", "info");
          }
          break;
        case "addPayment":
          if (window.currentPOS && window.currentPOS.showPaymentModal) {
            window.currentPOS.showPaymentModal();
          } else {
            showNotification("Payment modal functionality", "info");
          }
          break;
        case "printKOT":
        case "printBill":
        case "printReceipt":
          if (window.currentPOS && window.currentPOS.billAndPrint) {
            window.currentPOS.billAndPrint();
          } else {
            showNotification("Print functionality", "info");
          }
          break;
        default:
          showNotification(`Action: ${action}`, "info");
      }
    } catch (err) {
      console.error("Error handling action:", err);
      showNotification("Action failed", "error");
    }
  };

  function showNotification(message, type = "info") {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
    };

    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      info: "fa-info-circle",
      warning: "fa-exclamation-triangle",
    };

    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity flex items-center gap-2`;
    notification.innerHTML = `
      <i class="fas ${icons[type]}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize
  const form = document.getElementById("filterForm");
  const dateFilterSelect = document.getElementById("dateFilter");
  const customDateContainer = document.getElementById("customDateContainer");

  if (dateFilterSelect) {
    dateFilterSelect.addEventListener("change", handleDateFilterChange);
  }

  if (form) {
    form.addEventListener("change", async (e) => {
      if (e.target.id === "startDate" || e.target.id === "endDate") {
        const dateFilter = document.getElementById("dateFilter").value;
        if (dateFilter === "custom") await applyFilters();
      } else if (e.target.id !== "dateFilter") {
        await applyFilters();
      }
    });
  }

  if (
    dateFilterSelect &&
    dateFilterSelect.value === "custom" &&
    customDateContainer
  ) {
    customDateContainer.classList.remove("hidden");
  } else if (customDateContainer) {
    customDateContainer.classList.add("hidden");
  }

  attachOrderClickHandlers();
  console.log("✅ showOrders.js initialized");
}
