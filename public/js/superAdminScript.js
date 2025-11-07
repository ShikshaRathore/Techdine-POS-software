// /***********************************************
//  * 🔹 GLOBAL VARIABLES
//  ***********************************************/
// let currentUserId = null;
// let hotelsData = []; // For in-memory hotel data (can be replaced with DB later)

// const allBranches = JSON.parse(
//   document.getElementById("branchData").textContent
// );

// /***********************************************
//  * 🔹 VIEW SWITCHING (Users ↔ Branches)
//  ***********************************************/
// function showUsersView() {
//   document.getElementById("usersView").classList.remove("hidden");
//   document.getElementById("branchesView").classList.add("hidden");
//   document.getElementById("backToUsers").classList.add("hidden");
//   document.getElementById("sectionTitle").textContent = "User Management";
//   document.getElementById("sectionIcon").className =
//     "fas fa-users text-blue-600 mr-2";
//   currentUserId = null;
// }

// function showBranchesView(userId, username, restaurantName) {
//   currentUserId = userId;
//   document.getElementById("usersView").classList.add("hidden");
//   document.getElementById("branchesView").classList.remove("hidden");
//   document.getElementById("backToUsers").classList.remove("hidden");
//   document.getElementById("sectionTitle").textContent = "Branch Management";
//   document.getElementById("sectionIcon").className =
//     "fas fa-building text-blue-600 mr-2";

//   document.getElementById("currentUserName").textContent = username || "N/A";
//   document.getElementById("currentRestaurantName").textContent =
//     restaurantName || "N/A";

//   fetchBranches(userId);
// }

// /***********************************************
//  * 🔹 BRANCH MANAGEMENT (No API version)
//  ***********************************************/
// function fetchBranches(userId) {
//   try {
//     // Filter branches belonging to this user
//     const userBranches = allBranches.filter(
//       (branch) =>
//         branch.owner && branch.owner._id.toString() === userId.toString()
//     );

//     renderBranches(userBranches);
//   } catch (error) {
//     console.error("Error loading branches:", error);
//     showEmptyBranches();
//   }
// }

// function renderBranches(branches) {
//   const tableBody = document.getElementById("branchesTableBody");
//   const emptyMessage = document.getElementById("emptyBranchesMessage");

//   tableBody.innerHTML = "";

//   if (!branches || branches.length === 0) {
//     showEmptyBranches();
//     return;
//   }

//   tableBody.classList.remove("hidden");
//   emptyMessage.classList.add("hidden");

//   branches.forEach((branch) => {
//     const statusClass = branch.isActive
//       ? "bg-green-100 text-green-800"
//       : "bg-red-100 text-red-800";
//     const statusIcon = branch.isActive ? "fa-check-circle" : "fa-times-circle";
//     const statusText = branch.isActive ? "Active" : "Inactive";

//     const row = `
//       <tr class="hover:bg-gray-50 transition-colors">
//         <td class="px-4 py-4">
//           <div class="flex items-center space-x-3">
//             <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
//               <i class="fas fa-building text-purple-600"></i>
//             </div>
//             <div>
//               <p class="text-sm font-semibold text-gray-900">${
//                 branch.branchName || "N/A"
//               }</p>
//               <p class="text-xs text-gray-500 sm:hidden">
//                 ${branch.country || "N/A"} • ${
//       branch.address ? branch.address.substring(0, 20) + "..." : "N/A"
//     }
//               </p>
//             </div>
//           </div>
//         </td>
//         <td class="px-4 py-4 hidden sm:table-cell">
//           <p class="text-sm text-gray-700 flex items-center">
//             <i class="fas fa-globe text-gray-400 mr-2"></i>${
//               branch.country || "N/A"
//             }
//           </p>
//           <p class="text-xs text-gray-500 mt-1">
//             <i class="fas fa-map-marker-alt text-gray-400 mr-1"></i>${
//               branch.address || "N/A"
//             }
//           </p>
//         </td>
//         <td class="px-4 py-4 hidden md:table-cell">
//           <div class="flex items-center text-sm text-gray-700">
//             <i class="fas fa-user-tie text-gray-400 mr-2"></i>
//             ${branch.branchHead || "Not Assigned"}
//           </div>
//         </td>
//         <td class="px-4 py-4 hidden lg:table-cell">
//           <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
//             ${branch._id ? branch._id.toString().slice(-8) : "N/A"}
//           </span>
//         </td>
//         <td class="px-4 py-4 text-center">
//           <span class="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full ${statusClass}">
//             <i class="fas ${statusIcon} mr-1"></i>${statusText}
//           </span>
//         </td>
//         <td class="px-4 py-4">
//           <div class="flex items-center justify-center space-x-2">
//             <a href="/branch/${branch._id}/edit" title="Edit Branch"
//                class="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
//               <i class="fas fa-edit"></i>
//             </a>
//             <form action="/branch/${branch._id}?_method=DELETE" method="POST"
//                   onsubmit="return confirm('Are you sure you want to delete this branch?')"
//                   class="inline">
//               <button type="submit" title="Delete Branch"
//                       class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-all">
//                 <i class="fas fa-trash"></i>
//               </button>
//             </form>
//           </div>
//         </td>
//       </tr>`;
//     tableBody.insertAdjacentHTML("beforeend", row);
//   });
// }

// function showEmptyBranches() {
//   document.getElementById("branchesTableBody").innerHTML = "";
//   document.getElementById("branchesTableBody").classList.add("hidden");
//   document.getElementById("emptyBranchesMessage").classList.remove("hidden");
// }

// document.getElementById("branchSearch")?.addEventListener("input", (e) => {
//   const searchTerm = e.target.value.toLowerCase();
//   document.querySelectorAll("#branchesTableBody tr").forEach((row) => {
//     const text = row.textContent.toLowerCase();
//     row.style.display = text.includes(searchTerm) ? "" : "none";
//   });
// });

// /***********************************************
//  * 🔹 DASHBOARD & HOTEL MANAGEMENT
//  ***********************************************/
// const sidebar = document.getElementById("sidebar");
// const openSidebar = document.getElementById("openSidebar");
// const backdrop = document.getElementById("sidebar-backdrop");
// const headerTitle = document.getElementById("headerTitle");
// const menuItems = document.querySelectorAll(".menu-item");
// const sections = document.querySelectorAll(".content-section");
// const totalHotelsCount = document.getElementById("totalHotelsCount");

// const updateDashboardMetrics = () => {
//   totalHotelsCount.textContent = hotelsData.length;
// };

// const toggleSidebar = (show) => {
//   sidebar.classList.toggle("-translate-x-full", !show);
//   backdrop.classList.toggle("hidden", !show);
// };

// openSidebar?.addEventListener("click", () => toggleSidebar(true));
// backdrop?.addEventListener("click", () => toggleSidebar(false));

// const switchSection = (targetId, title) => {
//   menuItems.forEach((item) => {
//     const target = item.getAttribute("data-target");
//     item.classList.toggle("active-menu", target === targetId);
//   });

//   sections.forEach((section) =>
//     section.id === targetId
//       ? section.classList.remove("hidden")
//       : section.classList.add("hidden")
//   );

//   headerTitle.textContent = title;

//   if (window.innerWidth < 1024) toggleSidebar(false);
//   if (targetId === "hotels") renderHotels();
// };

// menuItems.forEach((item) => {
//   item.addEventListener("click", (e) => {
//     const target = e.currentTarget.getAttribute("data-target");
//     const title = e.currentTarget.querySelector("span").textContent;
//     switchSection(target, title);
//   });
// });

// function renderHotels() {
//   const tableBody = document.getElementById("hotelsTableBody");
//   const emptyMessage = document.getElementById("emptyTableMessage");
//   const searchValue = document
//     .getElementById("hotelSearch")
//     .value.toLowerCase();

//   const filtered = hotelsData.filter(
//     (hotel) =>
//       hotel.name.toLowerCase().includes(searchValue) ||
//       hotel.city.toLowerCase().includes(searchValue) ||
//       hotel.ownerId.toLowerCase().includes(searchValue)
//   );

//   tableBody.innerHTML = "";
//   if (filtered.length === 0) {
//     emptyMessage.classList.remove("hidden");
//     return;
//   }

//   emptyMessage.classList.add("hidden");

//   filtered.forEach((hotel) => {
//     let statusColor = "bg-gray-200 text-gray-700";
//     if (hotel.status === "Active") statusColor = "bg-green-100 text-green-800";
//     else if (hotel.status === "Pending")
//       statusColor = "bg-yellow-100 text-yellow-800";
//     else if (hotel.status === "Suspended")
//       statusColor = "bg-red-100 text-red-800";

//     const row = `
//         <tr class="hover:bg-gray-50 transition-colors">
//           <td class="px-6 py-4 text-sm font-medium text-gray-900">${hotel.name}</td>
//           <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">${hotel.city}</td>
//           <td class="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">${hotel.ownerId}</td>
//           <td class="px-6 py-4 text-center">
//             <span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full ${statusColor}">
//               ${hotel.status}
//             </span>
//           </td>
//           <td class="px-6 py-4 text-center text-sm font-medium space-x-2">
//             <button onclick="openHotelModal(${hotel.id})" class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
//               <i class="fas fa-edit"></i>
//             </button>
//             <button onclick="deleteHotel(${hotel.id})" class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
//               <i class="fas fa-trash"></i>
//             </button>
//           </td>
//         </tr>`;
//     tableBody.insertAdjacentHTML("beforeend", row);
//   });

//   updateDashboardMetrics();
// }

// function openHotelModal(id = null) {
//   const modal = document.getElementById("hotelModal");
//   const title = document.getElementById("modalTitle");
//   const hotelId = document.getElementById("hotelId");
//   const hotelName = document.getElementById("hotelName");
//   const hotelCity = document.getElementById("hotelCity");
//   const hotelOwnerId = document.getElementById("hotelOwnerId");
//   const hotelStatus = document.getElementById("hotelStatus");

//   if (id) {
//     const hotel = hotelsData.find((h) => h.id === id);
//     if (hotel) {
//       title.textContent = "Edit Hotel: " + hotel.name;
//       hotelId.value = hotel.id;
//       hotelName.value = hotel.name;
//       hotelCity.value = hotel.city;
//       hotelOwnerId.value = hotel.ownerId;
//       hotelStatus.value = hotel.status;
//     }
//   } else {
//     title.textContent = "Add New Hotel";
//     hotelId.value = "";
//     document.getElementById("hotelForm").reset();
//     hotelOwnerId.value = "O" + Math.floor(Math.random() * 900) + "X";
//   }

//   modal.classList.remove("hidden");
// }

// function closeHotelModal() {
//   document.getElementById("hotelModal").classList.add("hidden");
// }

// function saveHotel(event) {
//   event.preventDefault();
//   const id = document.getElementById("hotelId").value;
//   const name = document.getElementById("hotelName").value.trim();
//   const city = document.getElementById("hotelCity").value.trim();
//   const ownerId = document
//     .getElementById("hotelOwnerId")
//     .value.trim()
//     .toUpperCase();
//   const status = document.getElementById("hotelStatus").value;

//   if (id) {
//     const index = hotelsData.findIndex((h) => h.id === parseInt(id));
//     if (index !== -1)
//       hotelsData[index] = {
//         id: parseInt(id),
//         name,
//         city,
//         ownerId,
//         status,
//       };
//   } else {
//     const newId =
//       hotelsData.length > 0 ? Math.max(...hotelsData.map((h) => h.id)) + 1 : 1;
//     hotelsData.push({ id: newId, name, city, ownerId, status });
//   }

//   closeHotelModal();
//   renderHotels();
// }

// function deleteHotel(id) {
//   if (confirm("Are you sure you want to delete this hotel?")) {
//     hotelsData = hotelsData.filter((h) => h.id !== id);
//     renderHotels();
//   }
// }

// /***********************************************
//  * 🔹 INITIALIZATION
//  ***********************************************/
// document.addEventListener("DOMContentLoaded", function () {
//   showUsersView();
//   switchSection("dashboard", "Dashboard Overview");
// });
