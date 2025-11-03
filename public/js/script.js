// tailwind.config = {
//   theme: {
//     extend: {
//       colors: {
//         primary: "#FF6B35",
//         secondary: "#004E89",
//         accent: "#F7B801",
//       },
//     },
//   },
// };

// //-----------------------dashboard------------------------
// const profileBtn = document.getElementById("profileBtn");
// const dropdownMenu = document.getElementById("dropdownMenu");

// // Toggle dropdown
// profileBtn.addEventListener("click", (e) => {
//   e.stopPropagation();
//   dropdownMenu.classList.toggle("hidden");
// });

// // Close dropdown when clicking outside
// document.addEventListener("click", (e) => {
//   if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
//     dropdownMenu.classList.add("hidden");
//   }
// });

// // Logout function
// function handleLogout() {
//   // Add your logout logic here
//   alert("Logging out...");
//   dropdownMenu.classList.add("hidden");
// }

// // Sidebar Toggle Functionality
// const sidebar = document.getElementById("sidebar");
// const sidebarBackdrop = document.getElementById("sidebar-backdrop");
// const openSidebarBtn = document.getElementById("open-sidebar");
// const closeSidebarBtn = document.getElementById("close-sidebar");

// function openSidebar() {
//   sidebar.classList.remove("-translate-x-full");
//   sidebarBackdrop.classList.remove("hidden");
//   document.body.style.overflow = "hidden";
// }

// function closeSidebar() {
//   sidebar.classList.add("-translate-x-full");
//   sidebarBackdrop.classList.add("hidden");
//   document.body.style.overflow = "";
// }

// openSidebarBtn.addEventListener("click", openSidebar);
// closeSidebarBtn.addEventListener("click", closeSidebar);
// sidebarBackdrop.addEventListener("click", closeSidebar);

// // Close sidebar when clicking on any nav link (mobile)
// const navLinks = sidebar.querySelectorAll("nav a");
// navLinks.forEach((link) => {
//   link.addEventListener("click", () => {
//     if (window.innerWidth < 1024) {
//       closeSidebar();
//     }
//   });
// });

// // Example: Function to update dashboard data
// function updateDashboardData(data) {
//   // Update statistics
//   if (data.todayEarnings !== undefined) {
//     document.querySelector(
//       "#statistics-section .from-green-500 p.text-2xl"
//     ).textContent = `${data.todayEarnings}`;
//   }

//   if (data.todayCustomers !== undefined) {
//     document.querySelector(
//       "#statistics-section .from-blue-500 p.text-2xl"
//     ).textContent = data.todayCustomers;
//   }

//   if (data.avgDailyEarnings !== undefined) {
//     document.querySelector(
//       "#statistics-section .from-purple-500 p.text-2xl"
//     ).textContent = `${data.avgDailyEarnings}`;
//   }

//   if (data.salesThisMonth !== undefined) {
//     document.querySelector(
//       "#statistics-section .from-orange-500 p.text-2xl"
//     ).textContent = `${data.salesThisMonth}`;
//   }

//   // Update payment methods
//   if (data.cashPayments !== undefined) {
//     document.querySelector(
//       ".from-green-50 span.text-xl"
//     ).textContent = `${data.cashPayments}`;
//   }

//   if (data.cardPayments !== undefined) {
//     document.querySelector(
//       ".from-blue-50 span.text-xl"
//     ).textContent = `${data.cardPayments}`;
//   }

//   if (data.upiPayments !== undefined) {
//     document.querySelector(
//       ".from-purple-50 span.text-xl"
//     ).textContent = `${data.upiPayments}`;
//   }
// }

// // Example: Update header time
// function updateDateTime() {
//   const now = new Date();
//   const options = {
//     weekday: "long",
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   };
//   const dateTimeStr = now
//     .toLocaleDateString("en-US", options)
//     .replace(",", ", ");
//   document.getElementById("mobile-datetime").textContent = dateTimeStr;
// }

// // Update time every minute
// setInterval(updateDateTime, 60000);
// updateDateTime();

// //-----------------------dashboard------------------------
