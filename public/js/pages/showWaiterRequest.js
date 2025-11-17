// Waiter Request Page JavaScript

// 🔵 Declare globals ONCE at top
let previousRequestIds = new Set();
let hasInitialized = false;
let audioContext = null;

export function initPage() {
  console.log("♻️ Reinitializing Waiter Request Page...");

  // RESET baseline every time Waiter Request page reloads (AJAX)
  previousRequestIds = new Set();
  hasInitialized = false;

  // Initialize AudioContext on first user interaction
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log("🔊 Audio context initialized");
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  // Attach only once globally (browser ignores duplicates)
  document.addEventListener("click", initAudioContext, { once: true });
  document.addEventListener("touchstart", initAudioContext, { once: true });

  async function loadPOSWithTable(tableId, tableCode, requestId, branchId) {
    try {
      console.log("🔍 Loading POS for table:", tableCode, "Branch:", branchId);

      if (typeof window.loadDashboardContent === "function") {
        const posUrl = `/pos/${branchId}?tableId=${tableId}&tableCode=${tableCode}&requestId=${requestId}`;
        await window.loadDashboardContent(posUrl);
      } else {
        window.location.href = `/dashboard/pos/${branchId}?tableId=${tableId}&tableCode=${tableCode}&requestId=${requestId}`;
      }
    } catch (err) {
      console.error("❌ Failed to load POS:", err);
    }
  }

  function playNotificationSound() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === "suspended") audioContext.resume();

      const now = audioContext.currentTime;

      const playTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      playTone(800, now, 0.15);
      playTone(600, now + 0.15, 0.2);

      console.log("✅ Sound played successfully");
    } catch (error) {
      console.error("❌ Sound error:", error);
    }
  }

  function showVisualNotification(tableCode, areaName) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 transition-all transform translate-x-96";
    notification.innerHTML = `
      <div class="font-bold text-lg">New Waiter Request!</div>
      <div class="text-blue-100 text-sm">Table ${tableCode} - ${areaName}</div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 20);
    setTimeout(() => notification.remove(), 5000);
  }

  function getCurrentRequestIds() {
    const ids = new Set();
    document
      .querySelectorAll(".waiter-request-card")
      .forEach((card) => ids.add(card.dataset.requestId));
    return ids;
  }

  function checkForNewRequests() {
    const currentRequestIds = getCurrentRequestIds();

    if (!hasInitialized) {
      previousRequestIds = new Set(currentRequestIds);
      hasInitialized = true;
      console.log("📊 Initialized with", currentRequestIds.size, "requests");
      return;
    }

    const newRequests = [];

    currentRequestIds.forEach((id) => {
      if (!previousRequestIds.has(id)) {
        const card = document.querySelector(`[data-request-id="${id}"]`);
        if (card) {
          newRequests.push({
            id,
            tableCode: card.dataset.tableCode,
            areaName:
              card.closest(".mb-8")?.querySelector("h2")?.textContent.trim() ||
              "Unknown",
          });
        }
      }
    });

    if (newRequests.length > 0) {
      console.log("🔔 New waiter requests:", newRequests.length);

      newRequests.forEach((req, i) => {
        setTimeout(() => {
          playNotificationSound();
          showVisualNotification(req.tableCode, req.areaName);
        }, i * 300);
      });

      previousRequestIds = new Set(currentRequestIds);
    }
  }

  function attachRequestClickHandlers() {
    const requestCards = document.querySelectorAll(".waiter-request-card");
    console.log("🔗 Attaching handlers to", requestCards.length, "cards");

    requestCards.forEach((card) => {
      card.addEventListener("click", function (e) {
        if (e.target.closest("button") || e.target.closest("form")) return;

        loadPOSWithTable(
          this.dataset.tableId,
          this.dataset.tableCode,
          this.dataset.requestId,
          this.dataset.branchId
        );
      });
    });
  }

  function addTestButton() {
    const testBtn = document.createElement("button");
    testBtn.textContent = "🔊 Test Sound";
    testBtn.className =
      "fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    testBtn.onclick = () => {
      playNotificationSound();
      showVisualNotification("TF-01", "Top Floor");
    };
    document.body.appendChild(testBtn);
  }

  // --- Initialize features ---
  attachRequestClickHandlers();
  addTestButton();

  console.log("✅ Waiter Request handlers initialized");

  // Re-check every 5 sec
  setInterval(checkForNewRequests, 5000);
}

// ❗ DO NOT auto-run initPage()
// Dashboard script will call it:
// module.initPage(branchId);

window.showWaiterRequestInit = initPage;
