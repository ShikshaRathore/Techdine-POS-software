// export function initPage(branchId) {
//   console.log("showPOS is working");
//   console.log("Received branchId:", branchId);

//   // Create scoped namespace
//   const POS = {
//     orderItems: [],
//     orderNumber: 1,
//     branchId: branchId,
//     currentOrderId: null,
//     currentOrderStatus: "Pending",
//     customerData: null,
//     taxes: [], // Store branch taxes

//     init() {
//       // Fetch taxes for this branch
//       this.fetchBranchTaxes();

//       // --- 📱 Mobile Cart Toggle ---
//       this.initMobileCart();

//       // --- 🔍 Search Functionality ---
//       const searchInput = document.getElementById("searchInput");
//       if (searchInput) {
//         searchInput.addEventListener("input", (e) => {
//           const term = e.target.value.toLowerCase().trim();
//           document.querySelectorAll(".menu-item").forEach((item) => {
//             const name = item.dataset.name?.toLowerCase() || "";
//             item.style.display = name.includes(term) ? "block" : "none";
//           });
//         });
//       }

//       // --- 🔹 Category Filter ---
//       document.querySelectorAll(".category-btn").forEach((btn) => {
//         btn.addEventListener("click", () => {
//           this.filterCategory(btn.dataset.category);
//         });
//       });

//       // --- 🍔 Menu Item Click (Add to Order) ---
//       document.querySelectorAll(".menu-item").forEach((card) => {
//         card.addEventListener("click", () => {
//           try {
//             const item = JSON.parse(card.dataset.item);
//             this.addToOrder(item);
//           } catch (err) {
//             console.error("Error adding item:", err);
//           }
//         });
//       });

//       // --- 🔄 Reset Search ---
//       const resetBtn = document.getElementById("resetSearchBtn");
//       if (resetBtn) {
//         resetBtn.addEventListener("click", () => {
//           this.resetSearch();
//         });
//       }

//       // --- 👤 Customer Details ---
//       const customerSelect = document.getElementById("customerSelect");
//       if (customerSelect) {
//         customerSelect.addEventListener("click", () => {
//           this.showCustomerDetailsForm();
//         });
//       }

//       // --- 🧾 Action Buttons (KOT, Bill, etc.) ---
//       const kotBtn = document.querySelector(".kot-btn");
//       if (kotBtn) {
//         kotBtn.addEventListener("click", (e) => {
//           e.preventDefault();
//           this.kotOrder();
//         });
//       }

//       const billBtn = document.querySelector(".bill-btn");
//       if (billBtn) {
//         billBtn.addEventListener("click", (e) => {
//           e.preventDefault();
//           this.billOrder();
//         });
//       }

//       const payBtn = document.querySelector(".pay-btn");
//       if (payBtn) {
//         payBtn.addEventListener("click", (e) => {
//           e.preventDefault();
//           this.billAndPayment();
//         });
//       }

//       const printBtn = document.querySelector(".print-btn");
//       if (printBtn) {
//         printBtn.addEventListener("click", (e) => {
//           e.preventDefault();
//           this.billAndPrint();
//         });
//       }

//       // Show all categories initially
//       this.filterCategory("all");
//     },

//     // 💰 Fetch Branch Taxes
//     async fetchBranchTaxes() {
//       try {
//         const response = await fetch(`/dashboard/taxes/${this.branchId}`);
//         const data = await response.json();

//         if (data.success) {
//           this.taxes = data.taxes || [];
//           console.log("✅ Loaded taxes:", this.taxes);
//           this.updateOrder(); // Refresh totals with taxes
//         } else {
//           console.warn("⚠️ No taxes found for branch");
//           this.taxes = [];
//         }
//       } catch (err) {
//         console.error("❌ Error fetching taxes:", err);
//         this.taxes = [];
//       }
//     },

//     // 📱 Initialize Mobile Cart
//     initMobileCart() {
//       const cartSection = document.querySelector(".cart-section");
//       const cartToggle = document.getElementById("cartToggle");
//       const cartBackdrop = document.getElementById("cartBackdrop");

//       const isMobile = () => window.innerWidth < 768;

//       if (isMobile()) {
//         if (cartToggle) {
//           cartToggle.addEventListener("click", (e) => {
//             e.preventDefault();
//             e.stopPropagation();

//             const isOpen = cartSection?.classList.contains("open");
//             if (isOpen) {
//               this.closeMobileCart();
//             } else {
//               this.openMobileCart();
//             }
//           });
//         }

//         if (cartBackdrop) {
//           cartBackdrop.addEventListener("click", () => {
//             this.closeMobileCart();
//           });
//         }
//       }

//       window.addEventListener("resize", () => {
//         if (window.innerWidth >= 768) {
//           cartSection?.classList.remove("open");
//           cartBackdrop?.classList.remove("active");
//         }
//       });
//     },

//     openMobileCart() {
//       if (window.innerWidth < 768) {
//         const cartSection = document.querySelector(".cart-section");
//         const cartBackdrop = document.getElementById("cartBackdrop");
//         cartSection?.classList.add("open");
//         cartBackdrop?.classList.add("active");
//       }
//     },

//     closeMobileCart() {
//       const cartSection = document.querySelector(".cart-section");
//       const cartBackdrop = document.getElementById("cartBackdrop");
//       cartSection?.classList.remove("open");
//       cartBackdrop?.classList.remove("active");
//     },

//     updateMobileItemCount() {
//       const count = this.orderItems.reduce((sum, i) => sum + i.quantity, 0);
//       const mobileCount = document.getElementById("mobileItemCount");
//       if (mobileCount) {
//         mobileCount.textContent = count;
//       }
//     },

//     filterCategory(category) {
//       const buttons = document.querySelectorAll(".category-btn");
//       buttons.forEach((btn) => {
//         const active = btn.dataset.category === category;
//         btn.classList.toggle("bg-gray-900", active);
//         btn.classList.toggle("text-white", active);
//         btn.classList.toggle("bg-white", !active);
//         btn.classList.toggle("text-gray-700", !active);
//       });

//       document.querySelectorAll(".menu-item").forEach((item) => {
//         const match = category === "all" || item.dataset.category === category;
//         item.style.display = match ? "block" : "none";
//       });
//     },

//     resetSearch() {
//       const searchInput = document.getElementById("searchInput");
//       if (searchInput) searchInput.value = "";
//       this.filterCategory("all");
//     },

//     addToOrder(item) {
//       const existing = this.orderItems.find((i) => i.id === item.id);
//       if (existing) existing.quantity++;
//       else this.orderItems.push({ ...item, quantity: 1 });
//       this.updateOrder();

//       if (window.innerWidth < 768) {
//         this.openMobileCart();
//       }
//     },

//     changeQty(index, delta) {
//       const i = this.orderItems[index];
//       if (!i) return;
//       i.quantity += delta;
//       if (i.quantity <= 0) this.orderItems.splice(index, 1);
//       this.updateOrder();
//     },

//     removeItem(index) {
//       this.orderItems.splice(index, 1);
//       this.updateOrder();
//     },

//     updateOrder() {
//       const tbody = document.getElementById("orderItems");
//       if (!tbody) return;

//       if (this.orderItems.length === 0) {
//         tbody.innerHTML = `
//           <tr><td colspan="5" class="text-center py-8 md:py-12 text-gray-500 text-sm">No items yet</td></tr>
//         `;
//         this.updateTotals();
//         this.updateMobileItemCount();
//         return;
//       }

//       tbody.innerHTML = this.orderItems
//         .map(
//           (i, idx) => `
//             <tr class="border-b">
//               <td class="px-2 md:px-4 py-2 md:py-3 font-medium text-sm">${
//                 i.name
//               }</td>
//               <td class="px-2 md:px-4 py-2 md:py-3 text-center">
//                 <button class="px-1.5 md:px-2 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-action="dec" data-idx="${idx}">-</button>
//                 <span class="px-1.5 md:px-2 text-sm">${i.quantity}</span>
//                 <button class="px-1.5 md:px-2 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-action="inc" data-idx="${idx}">+</button>
//               </td>
//               <td class="px-2 md:px-4 py-2 md:py-3 text-right hidden md:table-cell text-sm">₹${i.price.toFixed(
//                 2
//               )}</td>
//               <td class="px-2 md:px-4 py-2 md:py-3 text-right font-semibold text-sm">₹${(
//                 i.price * i.quantity
//               ).toFixed(2)}</td>
//               <td class="px-2 md:px-4 py-2 md:py-3 text-right">
//                 <button class="text-red-500 hover:text-red-700 text-lg md:text-xl" data-action="remove" data-idx="${idx}">×</button>
//               </td>
//             </tr>
//           `
//         )
//         .join("");

//       tbody.querySelectorAll("[data-action]").forEach((btn) => {
//         const idx = parseInt(btn.dataset.idx);
//         if (btn.dataset.action === "inc")
//           btn.addEventListener("click", () => this.changeQty(idx, 1));
//         if (btn.dataset.action === "dec")
//           btn.addEventListener("click", () => this.changeQty(idx, -1));
//         if (btn.dataset.action === "remove")
//           btn.addEventListener("click", () => this.removeItem(idx));
//       });

//       this.updateTotals();
//       this.updateMobileItemCount();
//     },

//     // 💰 Calculate totals with taxes
//     calculateTotals() {
//       const subtotal = this.orderItems.reduce(
//         (sum, i) => sum + i.quantity * i.price,
//         0
//       );

//       let taxDetails = [];
//       let totalTax = 0;

//       // Calculate each tax
//       this.taxes.forEach((tax) => {
//         const taxAmount = (subtotal * tax.percentage) / 100;
//         totalTax += taxAmount;
//         taxDetails.push({
//           name: tax.name,
//           percentage: tax.percentage,
//           amount: taxAmount,
//         });
//       });

//       const grandTotal = subtotal + totalTax;

//       return {
//         subtotal,
//         taxDetails,
//         totalTax,
//         grandTotal,
//       };
//     },

//     updateTotals() {
//       const count = this.orderItems.reduce((sum, i) => sum + i.quantity, 0);
//       const { subtotal, taxDetails, totalTax, grandTotal } =
//         this.calculateTotals();

//       const countEl = document.getElementById("itemCount");
//       const subEl = document.getElementById("subTotal");
//       const totalEl = document.getElementById("totalAmount");

//       if (countEl) countEl.textContent = count;
//       if (subEl) {
//         // Show subtotal with tax breakdown
//         let taxBreakdown = taxDetails
//           .map(
//             (t) =>
//               `<div class="flex justify-between text-xs text-gray-500">
//             <span>${t.name} (${t.percentage}%)</span>
//             <span>₹${t.amount.toFixed(2)}</span>
//           </div>`
//           )
//           .join("");

//         subEl.innerHTML = `
//           <div>₹${subtotal.toFixed(2)}</div>
//           ${taxBreakdown}
//         `;
//       }
//       if (totalEl) totalEl.textContent = `₹${grandTotal.toFixed(2)}`;
//     },

//     showCustomerDetailsForm() {
//       const modal = document.createElement("div");
//       modal.id = "customerModal";
//       modal.className =
//         "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
//       modal.innerHTML = `
//         <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
//           <div class="flex justify-between items-center mb-6">
//             <h2 class="text-2xl font-bold text-gray-800">Customer Details</h2>
//             <button id="closeCustomerModal" class="text-gray-500 hover:text-gray-700">
//               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
//               </svg>
//             </button>
//           </div>

//           <form id="customerForm" class="space-y-4">
//             <div>
//               <label class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
//               <input type="text" id="customerName" required
//                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
//             </div>

//             <div>
//               <label class="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
//               <input type="tel" id="customerPhone" required pattern="[0-9]{10}"
//                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
//             </div>

//             <div>
//               <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
//               <input type="email" id="customerEmail"
//                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
//             </div>

//             <div>
//               <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
//               <textarea id="customerAddress" rows="3"
//                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"></textarea>
//             </div>

//             <div class="flex gap-3 pt-4">
//               <button type="button" id="cancelCustomerBtn"
//                 class="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
//                 Cancel
//               </button>
//               <button type="submit"
//                 class="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
//                 Save Customer
//               </button>
//             </div>
//           </form>
//         </div>
//       `;

//       document.body.appendChild(modal);

//       const closeModal = () => modal.remove();
//       document
//         .getElementById("closeCustomerModal")
//         .addEventListener("click", closeModal);
//       document
//         .getElementById("cancelCustomerBtn")
//         .addEventListener("click", closeModal);

//       document
//         .getElementById("customerForm")
//         .addEventListener("submit", (e) => {
//           e.preventDefault();
//           this.customerData = {
//             name: document.getElementById("customerName").value,
//             phone: document.getElementById("customerPhone").value,
//             email: document.getElementById("customerEmail").value,
//             address: document.getElementById("customerAddress").value,
//           };

//           const customerSelect = document.getElementById("customerSelect");
//           if (customerSelect) {
//             customerSelect.innerHTML = `<option>${this.customerData.name} - ${this.customerData.phone}</option>`;
//           }

//           modal.remove();
//           alert("✅ Customer details saved!");
//         });
//     },

//     kotOrder() {
//       if (!this.orderItems.length) return alert("Add items first!");

//       const serviceType =
//         document.querySelector('input[name="serviceType"]:checked')?.value ||
//         "dine-in";
//       const pax = document.getElementById("paxCount")?.value || 1;
//       const branchId = this.branchId;

//       if (!branchId || branchId === "") {
//         alert("❌ Branch ID is missing!");
//         return;
//       }

//       const { subtotal, taxDetails, totalTax, grandTotal } =
//         this.calculateTotals();

//       const orderTypeMap = {
//         "dine-in": "Dine In",
//         delivery: "Delivery",
//         pickup: "Pickup",
//       };

//       const orderData = {
//         items: this.orderItems.map((i) => ({
//           menuItem: i.id,
//           quantity: i.quantity,
//           price: i.price,
//           notes: "",
//         })),
//         branch: branchId,
//         serviceType,
//         pax,
//         subtotal: subtotal,
//         taxes: taxDetails.map((t) => ({
//           name: t.name,
//           percentage: t.percentage,
//           amount: t.amount,
//         })),
//         totalTax: totalTax,
//         totalAmount: grandTotal,
//         orderType: orderTypeMap[serviceType] || "Dine In",
//         customer: this.customerData,
//       };

//       console.log("🔵 Sending KOT data with taxes:", orderData);

//       fetch("/createOrderKOT", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(orderData),
//       })
//         .then((res) => res.json())
//         .then((data) => {
//           if (data.success) {
//             this.currentOrderId = data.order._id;
//             this.currentOrderStatus = "Pending";
//             alert(
//               `✅ KOT created successfully!\nOrder: ${
//                 data.order.orderNumber
//               }\nKOT: ${data.kot.kotNumber}\nTotal: ₹${grandTotal.toFixed(2)}`
//             );
//           } else {
//             alert("❌ Error creating KOT: " + (data.error || "Unknown error"));
//           }
//         })
//         .catch((err) => {
//           console.error("🔴 KOT Error:", err);
//           alert("Server error while creating KOT: " + err.message);
//         });
//     },

//     billOrder() {
//       if (!this.orderItems.length) return alert("Add items first!");
//       if (!this.currentOrderId) return alert("Please create KOT first!");

//       fetch(`/updateOrderStatus/${this.currentOrderId}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: "Billed" }),
//       })
//         .then((res) => res.json())
//         .then((data) => {
//           if (data.success) {
//             this.currentOrderStatus = "Billed";
//             alert("✅ Order billed successfully!");
//             this.showPaymentModal();
//           } else {
//             alert("❌ Error billing order: " + data.error);
//           }
//         })
//         .catch((err) => {
//           console.error("Error:", err);
//           alert("Server error");
//         });
//     },

//     showPaymentModal() {
//       const { subtotal, taxDetails, totalTax, grandTotal } =
//         this.calculateTotals();

//       const modal = document.createElement("div");
//       modal.id = "paymentModal";
//       modal.className =
//         "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";

//       const taxBreakdownHTML = taxDetails
//         .map(
//           (t) => `
//         <div class="flex justify-between text-gray-600 text-sm">
//           <span>${t.name} (${t.percentage}%)</span>
//           <span>₹${t.amount.toFixed(2)}</span>
//         </div>
//       `
//         )
//         .join("");

//       modal.innerHTML = `
//         <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//           <div class="flex justify-between items-center mb-6">
//             <div>
//               <h2 class="text-2xl font-bold text-gray-800">💳 Payment</h2>
//               <p class="text-sm text-gray-500">Order #${
//                 this.currentOrderId?.slice(-6) || "N/A"
//               }</p>
//             </div>
//             <div class="text-right">
//               <p class="text-sm text-gray-500">Total Amount</p>
//               <p class="text-3xl font-bold text-orange-600">₹${grandTotal.toFixed(
//                 2
//               )}</p>
//             </div>
//           </div>

//           <!-- Payment Method Tabs -->
//           <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
//             <button class="payment-tab px-4 py-3 border-2 border-orange-500 bg-orange-50 text-orange-600 rounded-lg font-medium transition-all" data-method="Cash">
//               <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
//               </svg>
//               Cash
//             </button>
//             <button class="payment-tab px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition-all" data-method="Card">
//               <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
//               </svg>
//               Card
//             </button>
//             <button class="payment-tab px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition-all" data-method="UPI">
//               <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
//               </svg>
//               UPI
//             </button>
//             <button class="payment-tab px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition-all" data-method="Online">
//               <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
//               </svg>
//               Online
//             </button>
//           </div>

//           <!-- Amount Input -->
//           <div class="mb-6">
//             <label class="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
//             <input type="number" id="paymentAmount" value="${grandTotal}" step="0.01" min="0"
//               class="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
//           </div>

//           <!-- Quick Amount Buttons -->
//           <div class="grid grid-cols-4 gap-2 mb-6">
//             <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="50">₹50</button>
//             <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="100">₹100</button>
//             <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="500">₹500</button>
//             <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="1000">₹1000</button>
//           </div>

//           <!-- Summary with Tax Breakdown -->
//           <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 space-y-2 border border-gray-200">
//             <div class="flex justify-between items-center">
//               <span class="text-gray-700 font-medium">Subtotal</span>
//               <span class="font-bold">₹${subtotal.toFixed(2)}</span>
//             </div>
//             ${taxBreakdownHTML}
//             <div class="h-px bg-gray-300 my-2"></div>
//             <div class="flex justify-between items-center">
//               <span class="text-gray-700 font-medium">Total Bill</span>
//               <span class="font-bold text-lg">₹${grandTotal.toFixed(2)}</span>
//             </div>
//             <div class="flex justify-between items-center">
//               <span class="text-gray-700 font-medium">Amount Paid</span>
//               <span class="font-bold text-lg text-green-600" id="amountPaidDisplay">₹${grandTotal.toFixed(
//                 2
//               )}</span>
//             </div>
//             <div class="h-px bg-gray-300"></div>
//             <div class="flex justify-between items-center">
//               <span class="text-red-600 font-bold">Change/Due</span>
//               <span class="font-bold text-xl text-red-600" id="dueAmountDisplay">₹0.00</span>
//             </div>
//           </div>

//           <!-- Action Buttons -->
//           <div class="flex gap-3">
//             <button id="cancelPaymentBtn"
//               class="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
//               Cancel
//             </button>
//             <button id="completePaymentBtn"
//               class="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-bold text-lg shadow-lg transition-all">
//               Complete Payment
//             </button>
//           </div>
//         </div>
//       `;

//       document.body.appendChild(modal);

//       let selectedMethod = "Cash";

//       document.querySelectorAll(".payment-tab").forEach((tab) => {
//         tab.addEventListener("click", () => {
//           document.querySelectorAll(".payment-tab").forEach((t) => {
//             t.classList.remove(
//               "border-orange-500",
//               "bg-orange-50",
//               "text-orange-600"
//             );
//             t.classList.add("border-gray-300", "text-gray-600");
//           });
//           tab.classList.add(
//             "border-orange-500",
//             "bg-orange-50",
//             "text-orange-600"
//           );
//           tab.classList.remove("border-gray-300", "text-gray-600");
//           selectedMethod = tab.dataset.method;
//         });
//       });

//       document.querySelectorAll(".quick-amount").forEach((btn) => {
//         btn.addEventListener("click", () => {
//           const currentAmount =
//             parseFloat(document.getElementById("paymentAmount").value) || 0;
//           const amount = parseFloat(btn.dataset.amount);
//           document.getElementById("paymentAmount").value =
//             currentAmount + amount;
//           updateDue();
//         });
//       });

//       const updateDue = () => {
//         const paid =
//           parseFloat(document.getElementById("paymentAmount").value) || 0;
//         const change = paid - grandTotal;
//         document.getElementById(
//           "amountPaidDisplay"
//         ).textContent = `₹${paid.toFixed(2)}`;

//         if (change >= 0) {
//           document.getElementById(
//             "dueAmountDisplay"
//           ).textContent = `Change: ₹${change.toFixed(2)}`;
//           document.getElementById("dueAmountDisplay").className =
//             "font-bold text-xl text-green-600";
//         } else {
//           document.getElementById(
//             "dueAmountDisplay"
//           ).textContent = `Due: ₹${Math.abs(change).toFixed(2)}`;
//           document.getElementById("dueAmountDisplay").className =
//             "font-bold text-xl text-red-600";
//         }
//       };

//       document
//         .getElementById("paymentAmount")
//         .addEventListener("input", updateDue);

//       document
//         .getElementById("cancelPaymentBtn")
//         .addEventListener("click", () => {
//           modal.remove();
//         });

//       document
//         .getElementById("completePaymentBtn")
//         .addEventListener("click", () => {
//           const paidAmount =
//             parseFloat(document.getElementById("paymentAmount").value) || 0;

//           if (paidAmount < grandTotal) {
//             if (
//               !confirm(
//                 `Payment is short by ₹${(grandTotal - paidAmount).toFixed(
//                   2
//                 )}. Mark as partial payment?`
//               )
//             ) {
//               return;
//             }
//           }

//           fetch(`/completePayment/${this.currentOrderId}`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               paymentMethod: selectedMethod,
//               amountPaid: paidAmount,
//               totalAmount: grandTotal,
//             }),
//           })
//             .then((res) => res.json())
//             .then((data) => {
//               if (data.success) {
//                 modal.remove();
//                 alert("✅ Payment completed successfully!");
//                 this.orderItems = [];
//                 this.updateOrder();
//                 this.currentOrderId = null;
//                 this.currentOrderStatus = "Pending";
//                 this.customerData = null;
//                 this.orderNumber++;

//                 const customerSelect =
//                   document.getElementById("customerSelect");
//                 if (customerSelect) {
//                   customerSelect.innerHTML =
//                     "<option>Walk-in Customer</option>";
//                 }
//               } else {
//                 alert("❌ Error processing payment: " + data.error);
//               }
//             })
//             .catch((err) => {
//               console.error("Error:", err);
//               alert("Server error");
//             });
//         });
//     },

//     billAndPayment() {
//       if (!this.orderItems.length) return alert("Add items first!");
//       if (!this.currentOrderId) return alert("Please create KOT first!");
//       this.billOrder();
//     },

//     billAndPrint() {
//       if (!this.orderItems.length) return alert("Add items first!");

//       const { subtotal, taxDetails, totalTax, grandTotal } =
//         this.calculateTotals();

//       const printFrame = document.createElement("iframe");
//       printFrame.style.position = "absolute";
//       printFrame.style.width = "0";
//       printFrame.style.height = "0";
//       printFrame.style.border = "none";
//       document.body.appendChild(printFrame);

//       const taxRowsHTML = taxDetails
//         .map(
//           (t) => `
//         <div class="total-row">
//           <span>${t.name} (${t.percentage}%):</span>
//           <span>₹${t.amount.toFixed(2)}</span>
//         </div>
//       `
//         )
//         .join("");

//       const receiptHTML = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <title>Bill Receipt</title>
//           <style>
//             * { margin: 0; padding: 0; box-sizing: border-box; }
//             body {
//               font-family: Arial, sans-serif;
//               padding: 20px;
//               max-width: 400px;
//               margin: 0 auto;
//             }
//             .header {
//               text-align: center;
//               border-bottom: 2px dashed #000;
//               padding-bottom: 10px;
//               margin-bottom: 15px;
//             }
//             .header h2 { font-size: 18px; margin-bottom: 5px; }
//             .header p { font-size: 11px; }
//             .info { margin-bottom: 15px; font-size: 12px; }
//             .info p { margin: 3px 0; }
//             .divider {
//               border-bottom: 1px dashed #000;
//               margin: 10px 0;
//             }
//             .items { margin-bottom: 15px; }
//             .item {
//               display: flex;
//               justify-content: space-between;
//               margin: 8px 0;
//               font-size: 12px;
//             }
//             .item-name { flex: 1; }
//             .item-qty { width: 50px; text-align: center; }
//             .item-price { width: 80px; text-align: right; }
//             .totals {
//               border-top: 2px solid #000;
//               padding-top: 10px;
//               margin-top: 10px;
//             }
//             .total-row {
//               display: flex;
//               justify-content: space-between;
//               margin: 5px 0;
//               font-size: 13px;
//             }
//             .total-row.grand {
//               font-size: 16px;
//               font-weight: bold;
//               margin-top: 10px;
//               padding-top: 10px;
//               border-top: 2px double #000;
//             }
//             .footer {
//               text-align: center;
//               margin-top: 20px;
//               font-size: 11px;
//               border-top: 2px dashed #000;
//               padding-top: 10px;
//             }
//             @media print {
//               @page {
//                 size: A5 portrait;
//                 margin: 10mm;
//               }
//               body {
//                 width: 100%;
//                 max-width: none;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="header">
//             <h2>Techdine</h2>
//             <p>Address Line 1</p>
//             <p>City, State - PIN</p>
//             <p>Tel: +91-XXXXXXXXXX</p>
//             <p>GSTIN: XXXXXXXXXXXX</p>
//           </div>

//           <div class="info">
//             <p><strong>Bill No:</strong> ${this.orderNumber}</p>
//             <p><strong>Date:</strong> ${new Date().toLocaleDateString(
//               "en-IN"
//             )}</p>
//             <p><strong>Time:</strong> ${new Date().toLocaleTimeString(
//               "en-IN"
//             )}</p>
//             <p><strong>Customer:</strong> ${
//               this.customerData?.name || "Walk-in Customer"
//             }</p>
//             ${
//               this.customerData?.phone
//                 ? `<p><strong>Phone:</strong> ${this.customerData.phone}</p>`
//                 : ""
//             }
//           </div>

//           <div class="divider"></div>

//           <div class="items">
//             <div class="item" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px;">
//               <span class="item-name">ITEM</span>
//               <span class="item-qty">QTY</span>
//               <span class="item-price">AMOUNT</span>
//             </div>
//             ${this.orderItems
//               .map(
//                 (item) => `
//               <div class="item">
//                 <span class="item-name">${item.name}</span>
//                 <span class="item-qty">${item.quantity}</span>
//                 <span class="item-price">₹${(
//                   item.price * item.quantity
//                 ).toFixed(2)}</span>
//               </div>
//             `
//               )
//               .join("")}
//           </div>

//           <div class="totals">
//             <div class="total-row">
//               <span>Subtotal:</span>
//               <span>₹${subtotal.toFixed(2)}</span>
//             </div>
//             ${taxRowsHTML}
//             <div class="divider" style="margin: 8px 0;"></div>
//             <div class="total-row grand">
//               <span>GRAND TOTAL:</span>
//               <span>₹${grandTotal.toFixed(2)}</span>
//             </div>
//           </div>

//           <div class="footer">
//             <p><strong>Thank you for your visit!</strong></p>
//             <p>Please visit again</p>
//             <p style="margin-top: 10px; font-size: 10px;">*** This is a computer generated bill ***</p>
//           </div>
//         </body>
//         </html>
//       `;

//       const doc = printFrame.contentWindow.document;
//       doc.open();
//       doc.write(receiptHTML);
//       doc.close();

//       printFrame.contentWindow.onload = () => {
//         setTimeout(() => {
//           printFrame.contentWindow.focus();
//           printFrame.contentWindow.print();

//           setTimeout(() => {
//             document.body.removeChild(printFrame);
//           }, 1000);
//         }, 250);
//       };
//     },
//   };

//   POS.init();
//   window.currentPOS = POS;
// }

export function initPage(branchId) {
  console.log("showPOS is working");
  console.log("Received branchId:", branchId);

  // Create scoped namespace
  const POS = {
    orderItems: [],
    orderNumber: 1,
    branchId: branchId,
    currentOrderId: null,
    currentOrderStatus: "Pending",
    customerData: null,
    taxes: [],
    assignedTable: null, // NEW: Store assigned table

    init() {
      // Check URL parameters for table assignment
      this.checkUrlParameters();

      // Fetch taxes for this branch
      this.fetchBranchTaxes();

      // --- 📱 Mobile Cart Toggle ---
      this.initMobileCart();

      // --- 🔍 Search Functionality ---
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          const term = e.target.value.toLowerCase().trim();
          document.querySelectorAll(".menu-item").forEach((item) => {
            const name = item.dataset.name?.toLowerCase() || "";
            item.style.display = name.includes(term) ? "block" : "none";
          });
        });
      }

      // --- 🔹 Category Filter ---
      document.querySelectorAll(".category-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.filterCategory(btn.dataset.category);
        });
      });

      // --- 🍔 Menu Item Click (Add to Order) ---
      document.querySelectorAll(".menu-item").forEach((card) => {
        card.addEventListener("click", () => {
          try {
            const item = JSON.parse(card.dataset.item);
            this.addToOrder(item);
          } catch (err) {
            console.error("Error adding item:", err);
          }
        });
      });

      // --- 🍽️ Table Assignment ---
      const assignTableBtn = document.getElementById("assignTableBtn");
      if (assignTableBtn) {
        assignTableBtn.addEventListener("click", () => {
          this.showTableSelectionModal();
        });
      }

      // --- 🔄 Reset Search ---
      const resetBtn = document.getElementById("resetSearchBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          this.resetSearch();
        });
      }

      // --- 👤 Customer Details ---
      const customerSelect = document.getElementById("customerSelect");
      if (customerSelect) {
        customerSelect.addEventListener("click", () => {
          this.showCustomerDetailsForm();
        });
      }

      // --- 🧾 Action Buttons (KOT, Bill, etc.) ---
      const kotBtn = document.querySelector(".kot-btn");
      if (kotBtn) {
        kotBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.kotOrder();
        });
      }

      const billBtn = document.querySelector(".bill-btn");
      if (billBtn) {
        billBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.billOrder();
        });
      }

      const payBtn = document.querySelector(".pay-btn");
      if (payBtn) {
        payBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.billAndPayment();
        });
      }

      const printBtn = document.querySelector(".print-btn");
      if (printBtn) {
        printBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.billAndPrint();
        });
      }

      // Show all categories initially
      this.filterCategory("all");
    },

    // NEW: Check URL parameters for table assignment
    checkUrlParameters() {
      const urlParams = new URLSearchParams(window.location.search);
      const tableId = urlParams.get("tableId");
      const tableCode = urlParams.get("tableCode");
      const requestId = urlParams.get("requestId");

      if (tableId && tableCode) {
        this.assignedTable = {
          id: tableId,
          code: tableCode,
          requestId: requestId,
        };

        // Update the UI to show the assigned table
        this.updateTableDisplay();

        // Show notification
        this.showNotification(
          `Table ${tableCode} assigned to this order`,
          "success"
        );

        // If there's a request ID, mark it as attended
        if (requestId) {
          this.markRequestAttended(requestId);
        }
      }
    },

    // NEW: Update table display in UI
    updateTableDisplay() {
      const tableDisplayText = document.getElementById("tableDisplayText");
      const tableSettingsIcon = document.getElementById("tableSettingsIcon");
      const assignTableBtn = document.getElementById("assignTableBtn");

      if (this.assignedTable && tableDisplayText && assignTableBtn) {
        // Show table code and settings icon
        tableDisplayText.textContent = this.assignedTable.code;
        tableSettingsIcon?.classList.remove("hidden");

        // Update button styling
        assignTableBtn.classList.add(
          "bg-teal-100",
          "text-teal-700",
          "font-semibold"
        );
        assignTableBtn.classList.remove("bg-gray-100");
      } else if (tableDisplayText && assignTableBtn) {
        // Reset to default state
        tableDisplayText.textContent = "Assign Table";
        tableSettingsIcon?.classList.add("hidden");

        assignTableBtn.classList.remove(
          "bg-teal-100",
          "text-teal-700",
          "font-semibold"
        );
        assignTableBtn.classList.add("bg-gray-100");
      }
    },

    // NEW: Show notification
    showNotification(message, type = "info") {
      const notification = document.createElement("div");
      notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all transform translate-x-0 ${
        type === "success"
          ? "bg-green-500"
          : type === "error"
          ? "bg-red-500"
          : "bg-blue-500"
      } text-white font-medium`;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.transform = "translateX(400px)";
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    // NEW: Mark waiter request as attended
    async markRequestAttended(requestId) {
      try {
        const response = await fetch(
          `/waiterRequest/${this.branchId}/markAttended/${requestId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();

        if (data.success) {
          console.log("✅ Request marked as attended");
        }
      } catch (err) {
        console.error("Error marking request attended:", err);
      }
    },

    // 💰 Fetch Branch Taxes
    async fetchBranchTaxes() {
      try {
        const response = await fetch(`/dashboard/taxes/${this.branchId}`);
        const data = await response.json();

        if (data.success) {
          this.taxes = data.taxes || [];
          console.log("✅ Loaded taxes:", this.taxes);
          this.updateOrder();
        } else {
          console.warn("⚠️ No taxes found for branch");
          this.taxes = [];
        }
      } catch (err) {
        console.error("❌ Error fetching taxes:", err);
        this.taxes = [];
      }
    },

    // 📱 Initialize Mobile Cart
    initMobileCart() {
      const cartSection = document.querySelector(".cart-section");
      const cartToggle = document.getElementById("cartToggle");
      const cartBackdrop = document.getElementById("cartBackdrop");

      const isMobile = () => window.innerWidth < 768;

      if (isMobile()) {
        if (cartToggle) {
          cartToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = cartSection?.classList.contains("open");
            if (isOpen) {
              this.closeMobileCart();
            } else {
              this.openMobileCart();
            }
          });
        }

        if (cartBackdrop) {
          cartBackdrop.addEventListener("click", () => {
            this.closeMobileCart();
          });
        }
      }

      window.addEventListener("resize", () => {
        if (window.innerWidth >= 768) {
          cartSection?.classList.remove("open");
          cartBackdrop?.classList.remove("active");
        }
      });
    },

    openMobileCart() {
      if (window.innerWidth < 768) {
        const cartSection = document.querySelector(".cart-section");
        const cartBackdrop = document.getElementById("cartBackdrop");
        cartSection?.classList.add("open");
        cartBackdrop?.classList.add("active");
      }
    },

    closeMobileCart() {
      const cartSection = document.querySelector(".cart-section");
      const cartBackdrop = document.getElementById("cartBackdrop");
      cartSection?.classList.remove("open");
      cartBackdrop?.classList.remove("active");
    },

    updateMobileItemCount() {
      const count = this.orderItems.reduce((sum, i) => sum + i.quantity, 0);
      const mobileCount = document.getElementById("mobileItemCount");
      if (mobileCount) {
        mobileCount.textContent = count;
      }
    },

    filterCategory(category) {
      const buttons = document.querySelectorAll(".category-btn");
      buttons.forEach((btn) => {
        const active = btn.dataset.category === category;
        btn.classList.toggle("bg-gray-900", active);
        btn.classList.toggle("text-white", active);
        btn.classList.toggle("bg-white", !active);
        btn.classList.toggle("text-gray-700", !active);
      });

      document.querySelectorAll(".menu-item").forEach((item) => {
        const match = category === "all" || item.dataset.category === category;
        item.style.display = match ? "block" : "none";
      });
    },

    resetSearch() {
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      this.filterCategory("all");
    },

    addToOrder(item) {
      const existing = this.orderItems.find((i) => i.id === item.id);
      if (existing) existing.quantity++;
      else this.orderItems.push({ ...item, quantity: 1 });
      this.updateOrder();

      if (window.innerWidth < 768) {
        this.openMobileCart();
      }
    },

    changeQty(index, delta) {
      const i = this.orderItems[index];
      if (!i) return;
      i.quantity += delta;
      if (i.quantity <= 0) this.orderItems.splice(index, 1);
      this.updateOrder();
    },

    removeItem(index) {
      this.orderItems.splice(index, 1);
      this.updateOrder();
    },

    updateOrder() {
      const tbody = document.getElementById("orderItems");
      if (!tbody) return;

      if (this.orderItems.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="5" class="text-center py-8 md:py-12 text-gray-500 text-sm">No items yet</td></tr>
        `;
        this.updateTotals();
        this.updateMobileItemCount();
        return;
      }

      tbody.innerHTML = this.orderItems
        .map(
          (i, idx) => `
            <tr class="border-b">
              <td class="px-2 md:px-4 py-2 md:py-3 font-medium text-sm">${
                i.name
              }</td>
              <td class="px-2 md:px-4 py-2 md:py-3 text-center">
                <button class="px-1.5 md:px-2 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-action="dec" data-idx="${idx}">-</button>
                <span class="px-1.5 md:px-2 text-sm">${i.quantity}</span>
                <button class="px-1.5 md:px-2 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-action="inc" data-idx="${idx}">+</button>
              </td>
              <td class="px-2 md:px-4 py-2 md:py-3 text-right hidden md:table-cell text-sm">₹${i.price.toFixed(
                2
              )}</td>
              <td class="px-2 md:px-4 py-2 md:py-3 text-right font-semibold text-sm">₹${(
                i.price * i.quantity
              ).toFixed(2)}</td>
              <td class="px-2 md:px-4 py-2 md:py-3 text-right">
                <button class="text-red-500 hover:text-red-700 text-lg md:text-xl" data-action="remove" data-idx="${idx}">×</button>
              </td>
            </tr>
          `
        )
        .join("");

      tbody.querySelectorAll("[data-action]").forEach((btn) => {
        const idx = parseInt(btn.dataset.idx);
        if (btn.dataset.action === "inc")
          btn.addEventListener("click", () => this.changeQty(idx, 1));
        if (btn.dataset.action === "dec")
          btn.addEventListener("click", () => this.changeQty(idx, -1));
        if (btn.dataset.action === "remove")
          btn.addEventListener("click", () => this.removeItem(idx));
      });

      this.updateTotals();
      this.updateMobileItemCount();
    },

    calculateTotals() {
      const subtotal = this.orderItems.reduce(
        (sum, i) => sum + i.quantity * i.price,
        0
      );

      let taxDetails = [];
      let totalTax = 0;

      this.taxes.forEach((tax) => {
        const taxAmount = (subtotal * tax.percentage) / 100;
        totalTax += taxAmount;
        taxDetails.push({
          name: tax.name,
          percentage: tax.percentage,
          amount: taxAmount,
        });
      });

      const grandTotal = subtotal + totalTax;

      return {
        subtotal,
        taxDetails,
        totalTax,
        grandTotal,
      };
    },

    updateTotals() {
      const count = this.orderItems.reduce((sum, i) => sum + i.quantity, 0);
      const { subtotal, taxDetails, totalTax, grandTotal } =
        this.calculateTotals();

      const countEl = document.getElementById("itemCount");
      const subEl = document.getElementById("subTotal");
      const totalEl = document.getElementById("totalAmount");

      if (countEl) countEl.textContent = count;
      if (subEl) {
        let taxBreakdown = taxDetails
          .map(
            (t) =>
              `<div class="flex justify-between text-xs text-gray-500">
            <span>${t.name} (${t.percentage}%)</span>
            <span>₹${t.amount.toFixed(2)}</span>
          </div>`
          )
          .join("");

        subEl.innerHTML = `
          <div>₹${subtotal.toFixed(2)}</div>
          ${taxBreakdown}
        `;
      }
      if (totalEl) totalEl.textContent = `₹${grandTotal.toFixed(2)}`;
    },

    // NEW: Show table selection modal
    async showTableSelectionModal() {
      try {
        // Fetch available tables and today's reservations
        const response = await fetch(
          `/dashboard/assignTables/available/${this.branchId}`
        );
        const data = await response.json();

        if (!data.success) {
          this.showNotification("Unable to load tables", "error");
          return;
        }

        const { areas, reservations } = data;

        const modal = document.createElement("div");
        modal.id = "tableSelectionModal";
        modal.className =
          "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";

        // Group tables by area
        const areasHTML = areas
          .map((area) => {
            const tables = area.tables || [];
            const availableTables = tables.filter(
              (t) =>
                t.availabilityStatus === "Available" && t.status === "Active"
            );

            if (availableTables.length === 0) return "";

            const tablesHTML = availableTables
              .map(
                (table) => `
        <button 
          class="table-select-btn px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left"
          data-table-id="${table._id}"
          data-table-code="${table.tableCode}"
          data-area-name="${area.areaName}">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-gray-800">${table.tableCode}</div>
              <div class="text-xs text-gray-500">Capacity: ${table.seatingCapacity}</div>
            </div>
            <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
        </button>
      `
              )
              .join("");

            return `
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-gray-600 mb-2 px-1">${area.areaName}</h4>
          <div class="grid grid-cols-2 gap-2">
            ${tablesHTML}
          </div>
          <div class="text-xs text-gray-500 mt-1 px-1">${availableTables.length} table(s) available</div>
        </div>
      `;
          })
          .filter(Boolean)
          .join("");

        const reservationsHTML =
          reservations.length > 0
            ? `
      <div class="mt-6 pt-4 border-t border-gray-200">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Today's Reservations</h4>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          ${reservations
            .map(
              (res) => `
            <div class="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <span class="font-medium">${
                res.table?.tableCode || "N/A"
              }</span> - 
              ${res.timeSlot} (${res.mealPeriod}) - 
              ${res.numberOfGuests} guests
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
            : '<p class="text-sm text-gray-500 mt-4 text-center">No table is reserved.</p>';

        modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Available Tables</h2>
          <button id="closeTableModal" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="mb-4">
          ${
            areasHTML ||
            '<p class="text-center text-gray-500 py-8">No available tables found</p>'
          }
        </div>

        ${reservationsHTML}

        <div class="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          ${
            this.assignedTable
              ? `
            <button id="clearTableBtn"
              class="flex-1 px-6 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
              Clear Table
            </button>
          `
              : ""
          }
          <button id="cancelTableBtn"
            class="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        // Close modal handlers
        const closeModal = () => modal.remove();
        document
          .getElementById("closeTableModal")
          ?.addEventListener("click", closeModal);
        document
          .getElementById("cancelTableBtn")
          ?.addEventListener("click", closeModal);

        // Clear table handler
        if (this.assignedTable) {
          document
            .getElementById("clearTableBtn")
            ?.addEventListener("click", () => {
              this.assignedTable = null;
              this.updateTableDisplay();
              this.showNotification("Table assignment cleared", "success");
              closeModal();
            });
        }

        // Table selection handlers
        document.querySelectorAll(".table-select-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const tableId = btn.dataset.tableId;
            const tableCode = btn.dataset.tableCode;
            const areaName = btn.dataset.areaName;

            this.assignedTable = {
              id: tableId,
              code: tableCode,
              area: areaName,
            };

            this.updateTableDisplay();
            this.showNotification(`Table ${tableCode} assigned`, "success");
            closeModal();
          });
        });
      } catch (err) {
        console.error("Error loading tables:", err);
        this.showNotification("Error loading tables", "error");
      }
    },

    showCustomerDetailsForm() {
      const modal = document.createElement("div");
      modal.id = "customerModal";
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Customer Details</h2>
            <button id="closeCustomerModal" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form id="customerForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input type="text" id="customerName" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input type="tel" id="customerPhone" required pattern="[0-9]{10}"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" id="customerEmail"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea id="customerAddress" rows="3"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" id="cancelCustomerBtn"
                class="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                Save Customer
              </button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      const closeModal = () => modal.remove();
      document
        .getElementById("closeCustomerModal")
        .addEventListener("click", closeModal);
      document
        .getElementById("cancelCustomerBtn")
        .addEventListener("click", closeModal);

      document
        .getElementById("customerForm")
        .addEventListener("submit", (e) => {
          e.preventDefault();
          this.customerData = {
            name: document.getElementById("customerName").value,
            phone: document.getElementById("customerPhone").value,
            email: document.getElementById("customerEmail").value,
            address: document.getElementById("customerAddress").value,
          };

          const customerSelect = document.getElementById("customerSelect");
          if (customerSelect) {
            customerSelect.innerHTML = `<option>${this.customerData.name} - ${this.customerData.phone}</option>`;
          }

          modal.remove();
          this.showNotification("Customer details saved!", "success");
        });
    },

    kotOrder() {
      if (!this.orderItems.length) return alert("Add items first!");

      const serviceType =
        document.querySelector('input[name="serviceType"]:checked')?.value ||
        "dine-in";
      const pax = document.getElementById("paxCount")?.value || 1;
      const branchId = this.branchId;

      if (!branchId || branchId === "") {
        alert("❌ Branch ID is missing!");
        return;
      }

      const { subtotal, taxDetails, totalTax, grandTotal } =
        this.calculateTotals();

      const orderTypeMap = {
        "dine-in": "Dine In",
        delivery: "Delivery",
        pickup: "Pickup",
      };

      // ADD THESE DEBUG LOGS
      console.log("🔍 Current assigned table:", this.assignedTable);
      console.log("🔍 Table ID being sent:", this.assignedTable?.id);

      const orderData = {
        items: this.orderItems.map((i) => ({
          menuItem: i.id,
          quantity: i.quantity,
          price: i.price,
          notes: "",
        })),
        branch: branchId,
        serviceType,
        pax,
        subtotal: subtotal,
        taxes: taxDetails.map((t) => ({
          name: t.name,
          percentage: t.percentage,
          amount: t.amount,
        })),
        totalTax: totalTax,
        totalAmount: grandTotal,
        orderType: orderTypeMap[serviceType] || "Dine In",
        customer: this.customerData,
        table: this.assignedTable?.id || null, // This should have the table ID
      };

      console.log("🔵 Sending KOT data with table:", orderData);
      console.log("🔵 Table in order data:", orderData.table); // ADD THIS

      fetch("/createOrderKOT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            this.currentOrderId = data.order._id;
            this.currentOrderStatus = "Pending";

            const tableInfo = this.assignedTable
              ? ` | Table: ${this.assignedTable.code}`
              : "";
            this.showNotification(
              `KOT created! Order: ${data.order.orderNumber}${tableInfo}`,
              "success"
            );
          } else {
            alert("❌ Error creating KOT: " + (data.error || "Unknown error"));
          }
        })
        .catch((err) => {
          console.error("🔴 KOT Error:", err);
          alert("Server error while creating KOT: " + err.message);
        });
    },

    billOrder() {
      if (!this.orderItems.length) return alert("Add items first!");
      if (!this.currentOrderId) return alert("Please create KOT first!");

      fetch(`/updateOrderStatus/${this.currentOrderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Billed" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            this.currentOrderStatus = "Billed";
            this.showNotification("Order billed successfully!", "success");
            this.showPaymentModal();
          } else {
            alert("❌ Error billing order: " + data.error);
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("Server error");
        });
    },

    showPaymentModal() {
      const { subtotal, taxDetails, totalTax, grandTotal } =
        this.calculateTotals();

      const modal = document.createElement("div");
      modal.id = "paymentModal";
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";

      const taxBreakdownHTML = taxDetails
        .map(
          (t) => `
        <div class="flex justify-between text-gray-600 text-sm">
          <span>${t.name} (${t.percentage}%)</span>
          <span>₹${t.amount.toFixed(2)}</span>
        </div>
      `
        )
        .join("");

      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">💳 Payment</h2>
              <p class="text-sm text-gray-500">Order #${
                this.currentOrderId?.slice(-6) || "N/A"
              }${
        this.assignedTable ? ` | Table: ${this.assignedTable.code}` : ""
      }</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Total Amount</p>
              <p class="text-3xl font-bold text-orange-600">₹${grandTotal.toFixed(
                2
              )}</p>
            </div>
          </div>

          <!-- Payment Method Tabs -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <button class="payment-tab px-4 py-3 border-2 border-orange-500 bg-orange-50 text-orange-600 rounded-lg font-medium transition-all" data-method="Cash">
              <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Cash
            </button>
            <button class="payment-tab px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition-all" data-method="Card">
              <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              Card
            </button>
            <button class="payment-tab px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition-all" data-method="UPI">
              <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              UPI
            </button>
            <button class="payment-tab px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-gray-400 transition-all" data-method="Online">
              <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
              Online
            </button>
          </div>

          <!-- Amount Input -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
            <input type="number" id="paymentAmount" value="${grandTotal}" step="0.01" min="0"
              class="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
          </div>

          <!-- Quick Amount Buttons -->
          <div class="grid grid-cols-4 gap-2 mb-6">
            <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="50">₹50</button>
            <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="100">₹100</button>
            <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="500">₹500</button>
            <button class="quick-amount px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors" data-amount="1000">₹1000</button>
          </div>

          <!-- Summary with Tax Breakdown -->
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 space-y-2 border border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-medium">Subtotal</span>
              <span class="font-bold">₹${subtotal.toFixed(2)}</span>
            </div>
            ${taxBreakdownHTML}
            <div class="h-px bg-gray-300 my-2"></div>
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-medium">Total Bill</span>
              <span class="font-bold text-lg">₹${grandTotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-medium">Amount Paid</span>
              <span class="font-bold text-lg text-green-600" id="amountPaidDisplay">₹${grandTotal.toFixed(
                2
              )}</span>
            </div>
            <div class="h-px bg-gray-300"></div>
            <div class="flex justify-between items-center">
              <span class="text-red-600 font-bold">Change/Due</span>
              <span class="font-bold text-xl text-red-600" id="dueAmountDisplay">₹0.00</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button id="cancelPaymentBtn"
              class="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button id="completePaymentBtn"
              class="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-bold text-lg shadow-lg transition-all">
              Complete Payment
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      let selectedMethod = "Cash";

      document.querySelectorAll(".payment-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".payment-tab").forEach((t) => {
            t.classList.remove(
              "border-orange-500",
              "bg-orange-50",
              "text-orange-600"
            );
            t.classList.add("border-gray-300", "text-gray-600");
          });
          tab.classList.add(
            "border-orange-500",
            "bg-orange-50",
            "text-orange-600"
          );
          tab.classList.remove("border-gray-300", "text-gray-600");
          selectedMethod = tab.dataset.method;
        });
      });

      document.querySelectorAll(".quick-amount").forEach((btn) => {
        btn.addEventListener("click", () => {
          const currentAmount =
            parseFloat(document.getElementById("paymentAmount").value) || 0;
          const amount = parseFloat(btn.dataset.amount);
          document.getElementById("paymentAmount").value =
            currentAmount + amount;
          updateDue();
        });
      });

      const updateDue = () => {
        const paid =
          parseFloat(document.getElementById("paymentAmount").value) || 0;
        const change = paid - grandTotal;
        document.getElementById(
          "amountPaidDisplay"
        ).textContent = `₹${paid.toFixed(2)}`;

        if (change >= 0) {
          document.getElementById(
            "dueAmountDisplay"
          ).textContent = `Change: ₹${change.toFixed(2)}`;
          document.getElementById("dueAmountDisplay").className =
            "font-bold text-xl text-green-600";
        } else {
          document.getElementById(
            "dueAmountDisplay"
          ).textContent = `Due: ₹${Math.abs(change).toFixed(2)}`;
          document.getElementById("dueAmountDisplay").className =
            "font-bold text-xl text-red-600";
        }
      };

      document
        .getElementById("paymentAmount")
        .addEventListener("input", updateDue);

      document
        .getElementById("cancelPaymentBtn")
        .addEventListener("click", () => {
          modal.remove();
        });

      document
        .getElementById("completePaymentBtn")
        .addEventListener("click", () => {
          const paidAmount =
            parseFloat(document.getElementById("paymentAmount").value) || 0;

          if (paidAmount < grandTotal) {
            if (
              !confirm(
                `Payment is short by ₹${(grandTotal - paidAmount).toFixed(
                  2
                )}. Mark as partial payment?`
              )
            ) {
              return;
            }
          }

          fetch(`/completePayment/${this.currentOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentMethod: selectedMethod,
              amountPaid: paidAmount,
              totalAmount: grandTotal,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                modal.remove();
                this.showNotification(
                  "Payment completed successfully!",
                  "success"
                );
                this.orderItems = [];
                this.updateOrder();
                this.currentOrderId = null;
                this.currentOrderStatus = "Pending";
                this.customerData = null;
                this.assignedTable = null; // Clear table assignment
                this.orderNumber++;

                // Reset customer select
                const customerSelect =
                  document.getElementById("customerSelect");
                if (customerSelect) {
                  customerSelect.innerHTML =
                    "<option>Walk-in Customer</option>";
                }

                // Reset table display
                const assignBtn = document.querySelector(
                  "[data-table-assign-btn]"
                );
                if (assignBtn) {
                  assignBtn.textContent = "Assign Table";
                  assignBtn.classList.remove(
                    "bg-teal-100",
                    "text-teal-700",
                    "font-semibold"
                  );
                  assignBtn.classList.add("bg-gray-100");
                }

                // Remove table indicator
                const tableIndicator =
                  document.getElementById("tableIndicator");
                if (tableIndicator) {
                  tableIndicator.remove();
                }
                // Reset table display - ADD THIS LINE
                this.updateTableDisplay();
              } else {
                alert("❌ Error processing payment: " + data.error);
              }
            })
            .catch((err) => {
              console.error("Error:", err);
              alert("Server error");
            });
        });
    },

    billAndPayment() {
      if (!this.orderItems.length) return alert("Add items first!");
      if (!this.currentOrderId) return alert("Please create KOT first!");
      this.billOrder();
    },

    billAndPrint() {
      if (!this.orderItems.length) return alert("Add items first!");

      const { subtotal, taxDetails, totalTax, grandTotal } =
        this.calculateTotals();

      const printFrame = document.createElement("iframe");
      printFrame.style.position = "absolute";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      document.body.appendChild(printFrame);

      const taxRowsHTML = taxDetails
        .map(
          (t) => `
        <div class="total-row">
          <span>${t.name} (${t.percentage}%):</span>
          <span>₹${t.amount.toFixed(2)}</span>
        </div>
      `
        )
        .join("");

      const tableInfo = this.assignedTable
        ? `<p><strong>Table:</strong> ${this.assignedTable.code}</p>`
        : "";

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h2 { font-size: 18px; margin-bottom: 5px; }
            .header p { font-size: 11px; }
            .info { margin-bottom: 15px; font-size: 12px; }
            .info p { margin: 3px 0; }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 10px 0;
            }
            .items { margin-bottom: 15px; }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 12px;
            }
            .item-name { flex: 1; }
            .item-qty { width: 50px; text-align: center; }
            .item-price { width: 80px; text-align: right; }
            .totals {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 13px;
            }
            .total-row.grand {
              font-size: 16px;
              font-weight: bold;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px double #000;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 11px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
            @media print {
              @page { 
                size: A5 portrait;
                margin: 10mm;
              }
              body { 
                width: 100%;
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Techdine</h2>
            <p>Address Line 1</p>
            <p>City, State - PIN</p>
            <p>Tel: +91-XXXXXXXXXX</p>
            <p>GSTIN: XXXXXXXXXXXX</p>
          </div>

          <div class="info">
            <p><strong>Bill No:</strong> ${this.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString(
              "en-IN"
            )}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString(
              "en-IN"
            )}</p>
            ${tableInfo}
            <p><strong>Customer:</strong> ${
              this.customerData?.name || "Walk-in Customer"
            }</p>
            ${
              this.customerData?.phone
                ? `<p><strong>Phone:</strong> ${this.customerData.phone}</p>`
                : ""
            }
          </div>

          <div class="divider"></div>

          <div class="items">
            <div class="item" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px;">
              <span class="item-name">ITEM</span>
              <span class="item-qty">QTY</span>
              <span class="item-price">AMOUNT</span>
            </div>
            ${this.orderItems
              .map(
                (item) => `
              <div class="item">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">${item.quantity}</span>
                <span class="item-price">₹${(
                  item.price * item.quantity
                ).toFixed(2)}</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${taxRowsHTML}
            <div class="divider" style="margin: 8px 0;"></div>
            <div class="total-row grand">
              <span>GRAND TOTAL:</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for your visit!</strong></p>
            <p>Please visit again</p>
            <p style="margin-top: 10px; font-size: 10px;">*** This is a computer generated bill ***</p>
          </div>
        </body>
        </html>
      `;

      const doc = printFrame.contentWindow.document;
      doc.open();
      doc.write(receiptHTML);
      doc.close();

      printFrame.contentWindow.onload = () => {
        setTimeout(() => {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();

          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        }, 250);
      };
    },
  };

  POS.init();
  window.currentPOS = POS;
}
