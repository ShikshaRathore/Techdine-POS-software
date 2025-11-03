export function initPage() {
  async function applyFilters() {
    const form = document.getElementById("filterForm");
    const query = new URLSearchParams(new FormData(form)).toString();
    const branchId = form.dataset.branchId;

    const res = await fetch(`/showOrders/${branchId}?${query}`);
    const html = await res.text();

    // Replace orders container content dynamically
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const newOrders = temp.querySelector("#ordersContainer");
    document.querySelector("#ordersContainer").innerHTML =
      newOrders?.innerHTML || "";

    // Re-attach click handlers after content update
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

  async function loadOrderInPOS(orderId) {
    try {
      console.log("🔍 Fetching order ID:", orderId);

      // Fetch order details
      const response = await fetch(`/api/orders/${orderId}`);
      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Server error:", errorData);
        throw new Error(
          errorData.error || `Server returned ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Order data received:", result);
      const order = result.data || result;

      // Load POS dashboard
      const branchId = document.getElementById("filterForm").dataset.branchId;
      const posResponse = await fetch(`/pos/${branchId}`);
      const posHtml = await posResponse.text();

      // Update dashboard content area - check if element exists
      const dashboardContent = document.getElementById("dashboard-content");

      if (!dashboardContent) {
        console.error(
          "❌ #dashboard-content element not found! Redirecting..."
        );
        // If no dashboard-content container, redirect to POS page directly
        window.location.href = `/pos/${branchId}?orderId=${orderId}`;
        return;
      }

      // Replace entire dashboard content with POS
      dashboardContent.innerHTML = posHtml;

      // Update sidebar active state
      document
        .querySelectorAll("#sidebar a")
        .forEach((a) => a.classList.remove("active"));
      const posLink = document.querySelector(
        `#sidebar a[href='/dashboard/pos']`
      );
      if (posLink) posLink.classList.add("active");

      // Wait for POS to initialize, then populate with order data
      // Use longer timeout and check if elements exist
      setTimeout(() => {
        populateOrderInPOS(order);
      }, 500);
    } catch (err) {
      console.error("❌ Failed to load order in POS:", err);
      console.error("Error stack:", err.stack);
      showNotification(`Failed to load order: ${err.message}`, "error");
    }
  }

  // ✅ UPDATED FUNCTION WITH OPTION 3 FIX
  function populateOrderInPOS(order) {
    console.log("🎨 Populating POS with order:", order);

    // Helper function to wait for elements to exist
    const waitForElement = (selector, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkElement = () => {
          const element = document.querySelector(selector);
          if (element) {
            console.log(`✅ Found element: ${selector}`);
            resolve(element);
          } else if (Date.now() - startTime > timeout) {
            console.error(`❌ Timeout waiting for: ${selector}`);
            reject(new Error(`Timeout waiting for ${selector}`));
          } else {
            setTimeout(checkElement, 100);
          }
        };
        checkElement();
      });
    };

    // Wait for all required POS elements to be available
    Promise.all([
      waitForElement("#orderItems"),
      waitForElement("[data-order-number]"),
      waitForElement("#customerSelect"),
    ])
      .then(() => {
        console.log("✅ All POS elements found, populating order data...");

        // Set order number
        const orderNumberEl = document.querySelector("[data-order-number]");
        if (orderNumberEl) {
          orderNumberEl.textContent = `Order #${order.orderNumber}`;
          orderNumberEl.dataset.orderId = order._id;
          console.log("✅ Order number set");
        }

        // Set customer info
        const customerSelect = document.getElementById("customerSelect");
        if (customerSelect && order.customer) {
          const customerName = order.customer.name || "Walk-in Customer";
          customerSelect.innerHTML = `<option>${customerName}</option>`;
          console.log("✅ Customer name set:", customerName);
        }

        // Set order type (serviceType radio buttons)
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
          console.log("✅ Service type set:", serviceTypeValue);
        }

        // Set pax count
        const paxInput = document.getElementById("paxCount");
        if (paxInput && order.pax) {
          paxInput.value = order.pax;
          console.log("✅ Pax count set:", order.pax);
        }

        // Populate items in order table
        const orderItemsBody = document.getElementById("orderItems");
        if (orderItemsBody && order.items && order.items.length > 0) {
          console.log("🛒 Populating", order.items.length, "items");

          // Clear existing items
          orderItemsBody.innerHTML = "";

          // Add each item
          order.items.forEach((item, index) => {
            const itemName =
              item.menuItem?.itemName || item.name || "Unknown Item";
            const itemPrice = item.price || item.menuItem?.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemTotal = itemPrice * itemQuantity;

            const itemRow = `
              <tr class="border-b">
                <td class="px-4 py-3 font-medium">${itemName}</td>
                <td class="px-4 py-3 text-center">
                  <button class="px-2 bg-gray-100 rounded hover:bg-gray-200" onclick="decrementItem(${index})">-</button>
                  <span class="px-2">${itemQuantity}</span>
                  <button class="px-2 bg-gray-100 rounded hover:bg-gray-200" onclick="incrementItem(${index})">+</button>
                </td>
                <td class="px-4 py-3 text-right">₹${itemPrice.toFixed(2)}</td>
                <td class="px-4 py-3 text-right font-semibold">₹${itemTotal.toFixed(
                  2
                )}</td>
                <td class="px-4 py-3 text-right">
                  <button class="text-red-500 hover:text-red-700 text-xl" onclick="removeItem(${index})">×</button>
                </td>
              </tr>
            `;
            orderItemsBody.insertAdjacentHTML("beforeend", itemRow);
          });

          // Update totals
          updateCartTotals(order);
          console.log("✅ Cart populated successfully");
        }

        // Add status control and configure buttons
        addStatusControl(order);
        configureActionButtons(order);

        console.log("✅ Order successfully loaded in POS");
        showNotification("Order loaded successfully", "success");
      })
      .catch((err) => {
        console.error("❌ Failed to find POS elements:", err);
        showNotification(
          "Failed to load order in POS. Please try again.",
          "error"
        );
      });
  }

  function updateCartTotals(order) {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const itemCountEl = document.getElementById("itemCount");
    const subTotalEl = document.getElementById("subTotal");
    const totalAmountEl = document.getElementById("totalAmount");

    if (itemCountEl) itemCountEl.textContent = itemCount;
    if (subTotalEl) subTotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (totalAmountEl)
      totalAmountEl.textContent = `₹${order.totalAmount.toFixed(2)}`;
  }

  function addStatusControl(order) {
    const controlPanel = document.querySelector("[data-control-panel]");
    if (!controlPanel) return;

    // Remove existing status control if present
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
      <div id="orderStatusControl" class="mb-4 p-4 bg-white rounded-lg shadow">
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
    // Get action buttons container
    const actionContainer = document.querySelector("[data-action-buttons]");
    if (!actionContainer) return;

    // Clear existing buttons
    actionContainer.innerHTML = "";

    const status = order.status;
    const paymentStatus = order.paymentStatus;

    // Define button configurations based on status
    let buttons = [];

    if (status === "KOT") {
      buttons = [
        {
          label: "Generate Bill",
          icon: "fa-file-invoice",
          class: "bg-green-500 hover:bg-green-600",
          action: "generateBill",
        },
        {
          label: "Print KOT",
          icon: "fa-print",
          class: "bg-gray-500 hover:bg-gray-600",
          action: "printKOT",
        },
        {
          label: "Cancel Order",
          icon: "fa-times",
          class: "bg-red-500 hover:bg-red-600",
          action: "cancelOrder",
        },
      ];
    } else if (status === "Billed" && paymentStatus === "Unpaid") {
      buttons = [
        {
          label: "Add Payment",
          icon: "fa-credit-card",
          class: "bg-green-500 hover:bg-green-600",
          action: "addPayment",
        },
        {
          label: "Print Bill",
          icon: "fa-print",
          class: "bg-gray-500 hover:bg-gray-600",
          action: "printBill",
        },
      ];
    } else if (status === "Paid" || paymentStatus === "Paid") {
      buttons = [
        {
          label: "Print Receipt",
          icon: "fa-print",
          class: "bg-gray-500 hover:bg-gray-600",
          action: "printReceipt",
        },
        {
          label: "View Details",
          icon: "fa-eye",
          class: "bg-blue-500 hover:bg-blue-600",
          action: "viewDetails",
        },
      ];
    } else if (status === "Out For Delivery") {
      buttons = [
        {
          label: "Mark Delivered",
          icon: "fa-check",
          class: "bg-green-500 hover:bg-green-600",
          action: "markDelivered",
        },
        {
          label: "Print Receipt",
          icon: "fa-print",
          class: "bg-gray-500 hover:bg-gray-600",
          action: "printReceipt",
        },
      ];
    } else if (status === "Delivered" || status === "Cancelled") {
      buttons = [
        {
          label: "Print Receipt",
          icon: "fa-print",
          class: "bg-gray-500 hover:bg-gray-600",
          action: "printReceipt",
        },
        {
          label: "View Details",
          icon: "fa-eye",
          class: "bg-blue-500 hover:bg-blue-600",
          action: "viewDetails",
        },
      ];
    }

    // Render buttons
    buttons.forEach((btn) => {
      const buttonHtml = `
        <button 
          class="${btn.class} text-white px-6 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2 transition"
          onclick="handleOrderAction('${btn.action}', '${order._id}')"
        >
          <i class="fas ${btn.icon}"></i>
          ${btn.label}
        </button>
      `;
      actionContainer.insertAdjacentHTML("beforeend", buttonHtml);
    });
  }

  function attachOrderClickHandlers() {
    const orderCards = document.querySelectorAll("[data-order-id]");
    orderCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const orderId = card.dataset.orderId;
        loadOrderInPOS(orderId);
      });
    });
  }

  // Global functions for order actions
  window.handleOrderStatusChange = async function (newStatus) {
    const orderIdEl = document.querySelector("[data-order-number]");
    if (!orderIdEl) return;

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

      configureActionButtons(updatedOrder);
      showNotification(
        result.message || "Order status updated successfully",
        "success"
      );
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification(err.message || "Failed to update order status", "error");

      const statusSelect = document.getElementById("orderStatusSelect");
      if (statusSelect) {
        statusSelect.value = statusSelect.dataset.previousStatus || "KOT";
      }
    }
  };

  window.handleOrderAction = async function (action, orderId) {
    try {
      switch (action) {
        case "generateBill":
          await generateBill(orderId);
          break;
        case "addPayment":
          showPaymentModal(orderId);
          break;
        case "printKOT":
          await printDocument(orderId, "kot");
          break;
        case "printBill":
          await printDocument(orderId, "bill");
          break;
        case "printReceipt":
          await printDocument(orderId, "receipt");
          break;
        case "markDelivered":
          await updateOrderStatus(orderId, "Delivered");
          break;
        case "viewDetails":
          window.location.href = `/orders/${orderId}`;
          break;
        case "cancelOrder":
          showCancelOrderModal(orderId);
          break;
      }
    } catch (err) {
      console.error("Error handling order action:", err);
      showNotification("Action failed. Please try again.", "error");
    }
  };

  async function generateBill(orderId) {
    // Implementation from original code
    showNotification("Generate bill functionality", "info");
  }

  function showPaymentModal(orderId) {
    // Implementation from original code
    showNotification("Payment modal functionality", "info");
  }

  function showCancelOrderModal(orderId) {
    // Implementation from original code
    showNotification("Cancel order modal functionality", "info");
  }

  async function printDocument(orderId, type) {
    try {
      window.open(`/api/orders/${orderId}/print/${type}`, "_blank");
    } catch (err) {
      console.error("Error printing:", err);
      showNotification("Failed to print document", "error");
    }
  }

  async function updateOrderStatus(orderId, status) {
    // Implementation from original code
    showNotification(`Update status to ${status}`, "info");
  }

  function showNotification(message, type = "info") {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
    };

    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      info: "fa-info-circle",
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

  dateFilterSelect.addEventListener("change", handleDateFilterChange);

  form.addEventListener("change", async (e) => {
    if (e.target.id === "startDate" || e.target.id === "endDate") {
      const dateFilter = document.getElementById("dateFilter").value;
      if (dateFilter === "custom") await applyFilters();
    } else if (e.target.id !== "dateFilter") {
      await applyFilters();
    }
  });

  if (dateFilterSelect.value === "custom") {
    customDateContainer.classList.remove("hidden");
  } else {
    customDateContainer.classList.add("hidden");
  }

  attachOrderClickHandlers();
}
