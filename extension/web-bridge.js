/**
 * LeadMagnets Web Bridge
 * Allows the LeadMagnets dashboard (localhost:3000 / magnets.bdatech.in)
 * to communicate seamlessly with the Chrome Extension in 1-click!
 */
(function () {
  'use strict';

  // Mark extension presence in DOM
  document.documentElement.dataset.leadmagnetsExtensionInstalled = "true";
  try {
    window.dispatchEvent(new CustomEvent("LM_EXTENSION_LOADED"));
  } catch (e) {}

  // Relay messages between Webpage <--> Background Service Worker
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || !event.data.type) return;

    if (event.data.type === "LM_CONNECT_LINKEDIN_TRIGGER") {
      const email = event.data.email || "";
      chrome.runtime.sendMessage({ action: "CONNECT_LINKEDIN_FROM_WEB", email }, (res) => {
        window.postMessage({
          type: "LM_CONNECT_LINKEDIN_RESPONSE",
          success: !!res?.success,
          profile: res?.profile,
          message: res?.message || res?.error,
        }, "*");
      });
    }

    if (event.data.type === "LM_CHECK_EXTENSION_STATUS") {
      chrome.runtime.sendMessage({ action: "GET_STATUS" }, (res) => {
        window.postMessage({
          type: "LM_EXTENSION_STATUS_RESPONSE",
          installed: true,
          data: res,
        }, "*");
      });
    }
  });
})();
