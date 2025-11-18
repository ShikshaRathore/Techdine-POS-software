const pathParts = window.location.pathname.split("/");
const branchId = pathParts[2]; // index: 0="", 1="restaurant", 2="branchId"
const params = new URLSearchParams(window.location.search);

const tableCode = params.get("tableCode") || "Unknown Table";

let cart = [];
let currentCategory = "all";

// Mobile menu toggle
document
  .getElementById("mobileMenuButton")
  .addEventListener("click", function () {
    const menu = document.getElementById("mobileMenu");
    menu.classList.toggle("hidden");
  });

// Add to cart
function addToCart(itemId, itemName, price, prepTime) {
  const existing = cart.find((i) => i.id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: itemId,
      name: itemName,
      price: parseFloat(price),
      preparationTime: parseInt(prepTime) || 0,
      quantity: 1,
    });
  }

  updateCart();
  updateItemControls(itemId);
  showNotification(`${itemName} added to cart!`);
}

// Update item quantity
function updateQuantity(itemId, delta) {
  const item = cart.find((i) => i.id === itemId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter((i) => i.id !== itemId);
    }
    updateCart();
    updateItemControls(itemId);
  }
}

// Update cart display
function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartCountDesktop").textContent = count;
  document.getElementById("mobileCartCount").textContent = count;
  document.getElementById("cartItemCount").textContent = count;
  document.getElementById("cartSubTotal").textContent = `${total.toFixed(2)}`;
  document.getElementById("cartTotal").textContent = `${total.toFixed(2)}`;

  // Update cart items display
  const cartItemsDiv = document.getElementById("cartItems");
  if (cart.length === 0) {
    cartItemsDiv.innerHTML =
      '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
  } else {
    cartItemsDiv.innerHTML = cart
      .map(
        (item) => `
            <div class="bg-gray-50 p-3 rounded-lg mb-3">
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-sm">${item.name}</span>
                <button onclick="updateQuantity('${item.id}', -${
          item.quantity
        })" class="text-red-500 hover:text-red-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <button onclick="updateQuantity('${
                    item.id
                  }', -1)" class="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100">-</button>
                  <span class="w-8 text-center font-semibold">${
                    item.quantity
                  }</span>
                  <button onclick="updateQuantity('${
                    item.id
                  }', 1)" class="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100">+</button>
                </div>
                <span class="font-bold">${(item.price * item.quantity).toFixed(
                  2
                )}</span>
              </div>
              ${
                item.preparationTime > 0
                  ? `<p class="text-xs text-gray-500 mt-2">Prep time: ${item.preparationTime} min</p>`
                  : ""
              }
            </div>
          `
      )
      .join("");
  }
}

// Update item controls (show quantity controls instead of Add button)
function updateItemControls(itemId) {
  const item = cart.find((i) => i.id === itemId);
  const controlsDiv = document.querySelector(`.item-controls-${itemId}`);

  if (!controlsDiv) return;

  if (item && item.quantity > 0) {
    controlsDiv.innerHTML = `
            <button onclick="updateQuantity('${itemId}', -1)" class="w-8 h-8 bg-white border-2 border-orange-500 text-orange-500 rounded flex items-center justify-center hover:bg-orange-50">-</button>
            <span class="w-8 text-center font-bold">${item.quantity}</span>
            <button onclick="updateQuantity('${itemId}', 1)" class="w-8 h-8 bg-orange-500 text-white rounded flex items-center justify-center hover:bg-orange-600">+</button>
          `;
  } else {
    const menuItemElem = document.querySelector(`[data-id="${itemId}"]`);
    const itemName = menuItemElem ? menuItemElem.dataset.name : "";
    const itemPrice = menuItemElem ? menuItemElem.dataset.price : "0";
    const itemPrepTime = menuItemElem ? menuItemElem.dataset.prepTime : "0";

    controlsDiv.innerHTML = `
            <button onclick="addToCart(this.dataset.id, this.dataset.name, this.dataset.price, this.dataset.prepTime)" data-id="${itemId}" data-name="${itemName}" data-price="${itemPrice}" data-prep-time="${itemPrepTime}" class="add-btn bg-white text-orange-500 border-2 border-orange-500 px-4 py-2 rounded-lg hover:bg-orange-500 hover:text-white font-semibold transition-colors">
              Add
            </button>
          `;
  }
}

// Cart operations
function openCart() {
  if (cart.length === 0) {
    showNotification("Your cart is empty!");
    return;
  }
  document.getElementById("cartSidebar").classList.remove("translate-x-full");
}

function closeCart() {
  document.getElementById("cartSidebar").classList.add("translate-x-full");
}

// Checkout operations
function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification("Your cart is empty!");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maxPrepTime = Math.max(...cart.map((item) => item.preparationTime));

  document.getElementById("checkoutItemCount").textContent = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  document.getElementById("checkoutSubTotal").textContent = `${total.toFixed(
    2
  )}`;
  document.getElementById("checkoutTotal").textContent = `${total.toFixed(2)}`;

  document.getElementById("checkoutItems").innerHTML =
    cart
      .map(
        (item) => `
          <div class="flex justify-between items-center py-2 border-b last:border-0">
            <div class="flex items-center space-x-3">
              <div class="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold">${
                item.quantity
              }</div>
              <span class="text-sm">${item.name}</span>
            </div>
            <span class="font-semibold text-sm">${(
              item.price * item.quantity
            ).toFixed(2)}</span>
          </div>
        `
      )
      .join("") +
    (maxPrepTime > 0
      ? `<p class="text-sm text-gray-600 mt-3">Preparation Time: ${maxPrepTime} Minutes (Approx)</p>`
      : "");

  closeCart();
  document.getElementById("checkoutModal").classList.remove("hidden");
  document.getElementById("checkoutModal").classList.add("flex");
}

function closeCheckout() {
  document.getElementById("checkoutModal").classList.add("hidden");
  document.getElementById("checkoutModal").classList.remove("flex");
}

// Place order
async function placeOrder() {
  if (cart.length === 0) {
    showNotification("Your cart is empty!");
    return;
  }

  const orderType = document.querySelector(
    'input[name="orderType"]:checked'
  ).value;
  const specialInstructions = document.getElementById(
    "specialInstructions"
  ).value;
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderData = {
    branchId: branchId,
    tableId: tableId,
    orderType: orderType,
    items: cart.map((item) => ({
      menuItem: item.id,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: totalAmount,
    specialInstructions: specialInstructions,
  };

  try {
    const response = await fetch(
      `/restaurant/${branchId}/place-order?tableCode=${tableCode}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      }
    );

    const result = await response.json();

    if (result.success) {
      closeCheckout();
      showSuccessModal(result.order, result.kot);
      cart = [];
      updateCart();

      document
        .querySelectorAll('[class*="item-controls-"]')
        .forEach((control) => {
          const itemId = control.className.match(/item-controls-([\w]+)/)[1];
          updateItemControls(itemId);
        });
    } else {
      showNotification("Failed to place order. Please try again.");
    }
  } catch (error) {
    console.error("Error placing order:", error);
    showNotification("Failed to place order. Please try again.");
  }
}

// Show success modal
function showSuccessModal(order, kot) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const maxPrepTime = Math.max(...cart.map((item) => item.preparationTime));

  document.getElementById("orderDetails").innerHTML = `
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-semibold text-sm">Order #${
                order.orderNumber
              }</span>
              <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">COOKING NOW</span>
            </div>
            <p class="text-xs text-gray-600">${itemCount} Item(s) | ${new Date().toLocaleString()}</p>
            ${
              maxPrepTime > 0
                ? `<p class="text-xs text-gray-600">Preparation Time: ${maxPrepTime} Minutes (Approx)</p>`
                : ""
            }
            <div class="border-t pt-2 mt-2 space-y-1">
              ${cart
                .map(
                  (item) => `
                <div class="flex justify-between text-xs">
                  <span>x${item.quantity} ${item.name}</span>
                  <span class="font-semibold">${(
                    item.price * item.quantity
                  ).toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
            </div>
            <div class="border-t pt-2 mt-2">
              <div class="flex justify-between text-xs">
                <span>Sub Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-base font-bold mt-2">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        `;

  document.getElementById("successModal").classList.remove("hidden");
  document.getElementById("successModal").classList.add("flex");
}

// New order
function newOrder() {
  document.getElementById("successModal").classList.add("hidden");
  document.getElementById("successModal").classList.remove("flex");
  window.location.reload();
}

// Filter by category
function filterByCategory(category) {
  currentCategory = category;
  applyFilters();

  document.querySelectorAll(".category-filter-btn").forEach((btn) => {
    btn.classList.remove(
      "text-orange-500",
      "font-bold",
      "border-b-2",
      "border-orange-500"
    );
    btn.classList.add("text-gray-500");
  });

  let activeBtn;
  if (category === "all") {
    activeBtn = document.querySelector(
      ".category-filter-btn[onclick=\"filterByCategory('all')\"]"
    );
  } else {
    activeBtn = Array.from(
      document.querySelectorAll(".category-filter-btn")
    ).find((btn) => btn.dataset.category === category);
  }

  if (activeBtn) {
    activeBtn.classList.remove("text-gray-500");
    activeBtn.classList.add(
      "text-orange-500",
      "font-bold",
      "border-b-2",
      "border-orange-500"
    );
  }
}

// Search items
function searchItems() {
  applyFilters();
}

// Apply filters
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((item) => {
    const itemCategory = item.dataset.category;
    const itemName = item.dataset.name;

    const categoryMatch =
      currentCategory === "all" || itemCategory === currentCategory;
    const searchMatch = !searchTerm || itemName.includes(searchTerm);

    if (categoryMatch && searchMatch) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Replace your existing showNotification with this:
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-24 md:bottom-16 left-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 transition-opacity text-center";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  updateCart();
});

const dropdown = document.getElementById("accountDropdown");
const menu = document.getElementById("dropdownMenu");
const arrow = document.getElementById("dropdownArrow");

dropdown.addEventListener("click", (e) => {
  e.stopPropagation();
  menu.classList.toggle("hidden");
  arrow.classList.toggle("rotate-180");
});

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  menu.classList.add("hidden");
  arrow.classList.remove("rotate-180");
});
// Scroll to top function
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
