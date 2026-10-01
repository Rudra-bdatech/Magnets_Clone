document.addEventListener("DOMContentLoaded", async () => {
  const syncBtn = document.getElementById("syncBtn");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const statusBadge = document.getElementById("statusBadge");
  const dmsCount = document.getElementById("dmsCount");
  const commentsCount = document.getElementById("commentsCount");
  const lastSync = document.getElementById("lastSync");

  const connectedView = document.getElementById("connectedView");
  const setupView = document.getElementById("setupView");
  const connectedEmail = document.getElementById("connectedEmail");
  const emailInput = document.getElementById("emailInput");
  const saveEmailBtn = document.getElementById("saveEmailBtn");
  const changeAccountBtn = document.getElementById("changeAccountBtn");
  const autoDetectBtn = document.getElementById("autoDetectBtn");

  let currentEmail = "";

  // Auto-detect email from active or open LeadMagnets tabs
  async function detectEmailFromTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      const targetTabs = tabs.filter(t => t.url && (t.url.includes("magnets.bdatech.in") || t.url.includes("localhost:3000")));
      for (const tab of targetTabs) {
        if (!tab.id) continue;
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return localStorage.getItem("currentUserEmail") || "";
            }
          });
          const detected = results?.[0]?.result;
          if (detected && typeof detected === "string" && detected.includes("@")) {
            return detected.trim().toLowerCase();
          }
        } catch (e) {
          // Tab might not allow script execution
        }
      }
    } catch (err) {
      console.warn("Auto-detect tab error:", err);
    }
    return null;
  }

  function setAccountUI(email) {
    currentEmail = email || "";
    if (currentEmail) {
      connectedEmail.textContent = currentEmail;
      connectedView.style.display = "flex";
      setupView.style.display = "none";
      changeAccountBtn.textContent = "Change";
      statusBadge.textContent = "Active";
      statusBadge.className = "badge";
      if (statusDot) statusDot.className = "status-dot";
    } else {
      connectedEmail.textContent = "Not connected";
      connectedView.style.display = "none";
      setupView.style.display = "flex";
      changeAccountBtn.textContent = "Cancel";
      statusBadge.textContent = "Setup";
      statusBadge.className = "badge warning";
      if (statusDot) statusDot.className = "status-dot warning";
    }
  }

  // Load and display current stats
  async function updateUI() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "GET_STATUS" }, async (res) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        if (res) {
          const email = res.userEmail || "";
          setAccountUI(email);

          if (res.totalDms !== undefined) dmsCount.textContent = res.totalDms;
          if (res.totalReplies !== undefined) commentsCount.textContent = res.totalReplies;
          if (res.lastResult) statusText.textContent = res.lastResult;
          if (res.lastSync) {
            const d = new Date(res.lastSync);
            lastSync.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }

          // If no email is set, try auto-detection quietly once
          if (!email) {
            const detected = await detectEmailFromTabs();
            if (detected) {
              emailInput.value = detected;
              statusText.textContent = `Found logged-in account: ${detected}`;
            }
          }
        }
        resolve();
      });
    });
  }

  await updateUI();

  // Switch between Connected View and Edit View
  changeAccountBtn.addEventListener("click", () => {
    if (setupView.style.display === "none") {
      setupView.style.display = "flex";
      connectedView.style.display = "none";
      emailInput.value = currentEmail;
      changeAccountBtn.textContent = currentEmail ? "Cancel" : "";
      emailInput.focus();
    } else {
      setAccountUI(currentEmail);
    }
  });

  // Save Email Button
  saveEmailBtn.addEventListener("click", () => {
    const email = (emailInput.value || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      statusText.textContent = "⚠️ Please enter a valid email address";
      return;
    }

    chrome.runtime.sendMessage({ action: "SET_USER_EMAIL", email }, (res) => {
      if (res?.success) {
        setAccountUI(email);
        statusText.textContent = `✅ Connected to ${email}`;
      } else {
        statusText.textContent = "⚠️ Could not save email.";
      }
    });
  });

  // Auto-detect Button
  autoDetectBtn.addEventListener("click", async () => {
    autoDetectBtn.innerHTML = `<span>Detecting...</span>`;
    const detected = await detectEmailFromTabs();
    if (detected) {
      emailInput.value = detected;
      chrome.runtime.sendMessage({ action: "SET_USER_EMAIL", email: detected }, (res) => {
        setAccountUI(detected);
        statusText.textContent = `✅ Connected to ${detected}`;
      });
    } else {
      statusText.textContent = "⚠️ No active LeadMagnets dashboard tab found.";
      autoDetectBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Auto-detect from open Dashboard</span>
      `;
    }
  });

  // Sync Button
  syncBtn.addEventListener("click", async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>Running sync...</span>`;
    statusText.textContent = "Fetching comments via LinkedIn API...";

    chrome.runtime.sendMessage({ action: "RUN_SYNC_NOW" }, async (res) => {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 21h5v-5"/>
        </svg>
        <span>Sync LinkedIn Comments Now</span>
      `;

      if (res?.success) {
        statusText.textContent = res.result?.summary || "✅ Sync complete!";
      } else {
        statusText.textContent = res?.error || res?.result?.message || "⚠️ Sync finished";
      }

      await updateUI();
    });
  });

  // Send Chat DM Button
  if (sendChatBtn) {
    sendChatBtn.addEventListener("click", async () => {
      sendChatBtn.disabled = true;
      sendChatBtn.textContent = "Delivering Lead Magnet...";
      statusText.textContent = "Checking active chat...";

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url || !activeTab.url.includes("linkedin.com")) {
        statusText.textContent = "⚠️ Please open a LinkedIn tab first!";
        sendChatBtn.disabled = false;
        sendChatBtn.textContent = "Send Lead Magnet in Current Chat";
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "SEND_CURRENT_CHAT_DM" }, async (res) => {
        sendChatBtn.disabled = false;
        sendChatBtn.textContent = "Send Lead Magnet in Current Chat";

        if (chrome.runtime.lastError) {
          statusText.textContent = "⚠️ Tab busy. Please refresh the LinkedIn tab and try again.";
        } else if (res?.success) {
          statusText.textContent = res.message || "✅ Lead Magnet delivered to chat!";
        } else {
          statusText.textContent = res?.message || "⚠️ Could not deliver message to this chat.";
        }
        await updateUI();
      });
    });
  }
});
