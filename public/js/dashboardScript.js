// Sidebar functionality
document.addEventListener("DOMContentLoaded", function () {
  const openSidebarBtn = document.getElementById("open-sidebar");
  const closeSidebarBtn = document.getElementById("close-sidebar");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const profileBtn = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");

  // Toggle sidebar on mobile
  openSidebarBtn.addEventListener("click", function () {
    sidebar.classList.remove("-translate-x-full");
    sidebarBackdrop.classList.remove("hidden");
  });

  closeSidebarBtn.addEventListener("click", function () {
    sidebar.classList.add("-translate-x-full");
    sidebarBackdrop.classList.add("hidden");
  });

  sidebarBackdrop.addEventListener("click", function () {
    sidebar.classList.add("-translate-x-full");
    sidebarBackdrop.classList.add("hidden");
  });

  // Toggle profile dropdown
  profileBtn.addEventListener("click", function () {
    dropdownMenu.classList.toggle("hidden");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !profileBtn.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.classList.add("hidden");
    }
  });

  // Submenu toggle functionality
  const menuToggles = document.querySelectorAll(".menu-toggle");

  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      const menuId = this.getAttribute("data-menu");
      const submenu = document.getElementById(`submenu-${menuId}`);
      const icon = this.querySelector("svg:last-child");

      // Close other open submenus
      document.querySelectorAll(".submenu").forEach((sm) => {
        if (sm.id !== `submenu-${menuId}`) {
          sm.classList.remove("open");
          // Reset other icons
          const otherIcons = document.querySelectorAll(
            ".menu-toggle svg:last-child"
          );
          otherIcons.forEach((otherIcon) => {
            if (otherIcon !== icon) {
              otherIcon.classList.remove("rotate-180");
            }
          });
        }
      });

      // Toggle current submenu
      submenu.classList.toggle("open");

      // Rotate icon
      if (submenu.classList.contains("open")) {
        icon.classList.add("rotate-180");
      } else {
        icon.classList.remove("rotate-180");
      }
    });
  });

  // Submenu item click handler - SIMPLIFIED VERSION
  const submenuItems = document.querySelectorAll(".submenu-item");
  const contentTitle = document.getElementById("content-title");
  const contentBody = document.getElementById("content-body");

  submenuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const contentType = this.getAttribute("data-content");

      // Directly update content without loading indicator
      updateContent(contentType);

      // Close sidebar on mobile after selection
      if (window.innerWidth < 1024) {
        sidebar.classList.add("-translate-x-full");
        sidebarBackdrop.classList.add("hidden");
      }
    });
  });

  // Function to update content based on submenu selection
  function updateContent(contentType) {
    let title = "";
    let body = "";

    switch (contentType) {
      case "categories":
        title = "Menu Categories";
        body = `
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <div class="flex justify-between items-center mb-6">
                <h4 class="text-lg font-semibold text-gray-800">All Categories</h4>
                <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Add Category
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span class="text-orange-600 font-medium">A</span>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">Appetizers</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">12 items</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="#" class="text-orange-600 hover:text-orange-900 mr-3">Edit</a>
                        <a href="#" class="text-red-600 hover:text-red-900">Delete</a>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span class="text-blue-600 font-medium">M</span>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">Main Course</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">24 items</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="#" class="text-orange-600 hover:text-orange-900 mr-3">Edit</a>
                        <a href="#" class="text-red-600 hover:text-red-900">Delete</a>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span class="text-purple-600 font-medium">D</span>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">Desserts</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">8 items</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="#" class="text-orange-600 hover:text-orange-900 mr-3">Edit</a>
                        <a href="#" class="text-red-600 hover:text-red-900">Delete</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
        break;

      case "items":
        title = "Menu Items";

        break;

      case "pending-orders":
        title = "Pending Orders";
        body = `
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <div class="flex justify-between items-center mb-6">
                <h4 class="text-lg font-semibold text-gray-800">Pending Orders (3)</h4>
                <div class="flex space-x-2">
                  <button class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Filter
                  </button>
                  <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Refresh
                  </button>
                </div>
              </div>
              <div class="space-y-4">
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h5 class="font-semibold text-gray-800">Order #1234</h5>
                      <p class="text-sm text-gray-600">Table 5 • 2 people</p>
                    </div>
                    <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Pending</span>
                  </div>
                  <div class="text-sm text-gray-700 mb-3">
                    <p>• Paneer Tikka</p>
                    <p>• Butter Naan</p>
                    <p>• Mango Lassi</p>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-900">$32.97</span>
                    <div class="flex space-x-2">
                      <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                        Accept
                      </button>
                      <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h5 class="font-semibold text-gray-800">Order #1235</h5>
                      <p class="text-sm text-gray-600">Takeaway • John Doe</p>
                    </div>
                    <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Pending</span>
                  </div>
                  <div class="text-sm text-gray-700 mb-3">
                    <p>• Chicken Biryani</p>
                    <p>• Raita</p>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-900">$18.99</span>
                    <div class="flex space-x-2">
                      <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                        Accept
                      </button>
                      <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        break;

      default:
        title = "Dashboard Overview";
        body = document.getElementById("content-body").innerHTML;
    }

    // Update the content
    contentTitle.textContent = title;
    contentBody.innerHTML = body;
  }
});
