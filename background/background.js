// Background Script for TubeBoost Chrome Extension

class TubeBoostBackground {
  constructor() {
    this.init();
  }

  init() {
    console.log("TubeBoost: Background script loaded");
    this.setupEventListeners();
    this.setupContextMenus();
    this.initializeStorage();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Handle tab updates to detect YouTube navigation
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle action button clicks
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      // Add context menu for YouTube videos
      chrome.contextMenus.create({
        id: "tubeboost-analyze",
        title: "🚀 Analyze with TubeBoost",
        contexts: ["page", "link"],
        documentUrlPatterns: ["*://*.youtube.com/*"],
      });

      chrome.contextMenus.create({
        id: "tubeboost-keywords",
        title: "🔍 Find Keywords",
        contexts: ["selection"],
        documentUrlPatterns: ["*://*.youtube.com/*"],
      });

      chrome.contextMenus.create({
        id: "tubeboost-tags",
        title: "🏷️ Generate Tags",
        contexts: ["selection"],
        documentUrlPatterns: ["*://*.youtube.com/*"],
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  async initializeStorage() {
    // Set default settings if not already set
    const defaultSettings = {
      autoAnalyze: true,
      showSEOScore: true,
      showTagSuggestions: true,
      showOptimizationHints: true,
      notifications: true,
      theme: "light",
    };

    try {
      const stored = await chrome.storage.sync.get("settings");
      if (!stored.settings) {
        await chrome.storage.sync.set({ settings: defaultSettings });
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }

  handleInstallation(details) {
    if (details.reason === "install") {
      console.log("TubeBoost: First time installation");
      this.showWelcomeNotification();
      // Open options page for setup
      chrome.runtime.openOptionsPage();
    } else if (details.reason === "update") {
      console.log("TubeBoost: Extension updated");
      this.showUpdateNotification();
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when page is completely loaded
    if (changeInfo.status !== "complete" || !tab.url) return;

    // Check if it's a YouTube page
    if (tab.url.includes("youtube.com")) {
      this.handleYouTubePageLoad(tabId, tab);
    }
  }

  async handleYouTubePageLoad(tabId, tab) {
    try {
      // Get user settings
      const result = await chrome.storage.sync.get("settings");
      const settings = result.settings || {};

      // Auto-analyze if enabled
      if (settings.autoAnalyze && tab.url.includes("/watch")) {
        setTimeout(() => {
          this.analyzeVideo(tabId, tab.url);
        }, 2000); // Wait for page to fully load
      }

      // Update action badge
      chrome.action.setBadgeText({
        tabId: tabId,
        text: "ON",
      });

      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: "#667eea",
      });
    } catch (error) {
      console.error("Error handling YouTube page load:", error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case "analyzeVideo":
        this.analyzeVideo(sender.tab.id, request.url);
        sendResponse({ success: true });
        break;

      case "getVideoAnalysis":
        this.getVideoAnalysis(request.videoId)
          .then((analysis) => sendResponse({ success: true, data: analysis }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message }),
          );
        break;

      case "generateTags":
        this.generateTags(request.content)
          .then((tags) => sendResponse({ success: true, data: tags }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message }),
          );
        break;

      case "getKeywords":
        this.getKeywords(request.query)
          .then((keywords) => sendResponse({ success: true, data: keywords }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message }),
          );
        break;

      case "saveUserData":
        this.saveUserData(request.data)
          .then(() => sendResponse({ success: true }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message }),
          );
        break;

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  }

  handleActionClick(tab) {
    // If not on YouTube, redirect to YouTube
    if (!tab.url.includes("youtube.com")) {
      chrome.tabs.create({ url: "https://youtube.com" });
      return;
    }

    // If popup is disabled or we want to inject directly
    this.injectQuickTools(tab.id);
  }

  handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case "tubeboost-analyze":
        this.analyzeVideo(tab.id, tab.url);
        break;

      case "tubeboost-keywords":
        if (info.selectionText) {
          this.findKeywordsForText(tab.id, info.selectionText);
        }
        break;

      case "tubeboost-tags":
        if (info.selectionText) {
          this.generateTagsForText(tab.id, info.selectionText);
        }
        break;
    }
  }

  async analyzeVideo(tabId, url) {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) return;

      // Inject analysis overlay
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: this.showAnalysisOverlay,
        args: [videoId],
      });

      // Get video data and perform analysis
      const analysis = await this.performVideoAnalysis(videoId);

      // Send results back to content script
      chrome.tabs.sendMessage(tabId, {
        action: "displayAnalysis",
        data: analysis,
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
    }
  }

  async performVideoAnalysis(videoId) {
    // In a real extension, this would make API calls to YouTube Data API
    // For now, return mock analysis data
    return {
      videoId: videoId,
      seoScore: Math.floor(Math.random() * 40) + 60, // 60-100
      titleScore: Math.floor(Math.random() * 30) + 70,
      descriptionScore: Math.floor(Math.random() * 30) + 70,
      tagsScore: Math.floor(Math.random() * 30) + 70,
      suggestions: [
        "Consider adding trending keywords to your title",
        "Add timestamps to your description",
        "Include call-to-action in your description",
        "Use more specific tags for better discoverability",
      ],
      recommendedTags: [
        "youtube tutorial",
        "how to",
        "beginner guide",
        "tips and tricks",
        "2024",
      ],
      competitorData: [
        {
          title: "Similar Video #1",
          views: "1.2M",
          engagement: "8.5%",
        },
        {
          title: "Similar Video #2",
          views: "850K",
          engagement: "7.2%",
        },
      ],
    };
  }

  async generateTags(content) {
    // Mock tag generation - in real app would use AI/ML
    const commonTags = [
      "youtube",
      "tutorial",
      "how to",
      "guide",
      "tips",
      "tricks",
      "beginner",
      "advanced",
      "2024",
      "learn",
    ];

    const contentWords = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const suggestedTags = [
      ...commonTags.slice(0, 5),
      ...contentWords.slice(0, 10),
    ];

    return suggestedTags.slice(0, 15);
  }

  async getKeywords(query) {
    // Mock keyword research - in real app would use keyword APIs
    const keywords = [
      {
        keyword: query + " tutorial",
        volume: "12.5K",
        difficulty: "Easy",
        cpc: "$0.45",
      },
      {
        keyword: query + " guide",
        volume: "8.2K",
        difficulty: "Medium",
        cpc: "$0.65",
      },
      {
        keyword: "how to " + query,
        volume: "15.8K",
        difficulty: "Easy",
        cpc: "$0.35",
      },
      {
        keyword: query + " tips",
        volume: "6.7K",
        difficulty: "Low",
        cpc: "$0.25",
      },
      {
        keyword: query + " 2024",
        volume: "9.3K",
        difficulty: "Medium",
        cpc: "$0.55",
      },
    ];

    return keywords;
  }

  async saveUserData(data) {
    try {
      await chrome.storage.sync.set({ userData: data });
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  }

  async injectQuickTools(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          window.postMessage({ type: "TUBEBOOST_SHOW_QUICK_TOOLS" }, "*");
        },
      });
    } catch (error) {
      console.error("Error injecting quick tools:", error);
    }
  }

  async findKeywordsForText(tabId, text) {
    try {
      const keywords = await this.getKeywords(text);
      chrome.tabs.sendMessage(tabId, {
        action: "showKeywords",
        data: keywords,
      });
    } catch (error) {
      console.error("Error finding keywords:", error);
    }
  }

  async generateTagsForText(tabId, text) {
    try {
      const tags = await this.generateTags(text);
      chrome.tabs.sendMessage(tabId, {
        action: "showTags",
        data: tags,
      });
    } catch (error) {
      console.error("Error generating tags:", error);
    }
  }

  extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  showAnalysisOverlay(videoId) {
    // This function runs in the context of the YouTube page
    const overlay = document.createElement("div");
    overlay.id = "tubeboost-analysis-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 9999;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <strong style="color: #667eea;">🚀 TubeBoost Analysis</strong>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; border: none; background: none; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      <div style="color: #666; font-size: 14px;">
        Analyzing video... Please wait.
      </div>
      <div style="width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; margin-top: 8px; overflow: hidden;">
        <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); animation: slide 2s infinite;"></div>
      </div>
      <style>
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      </style>
    `;

    document.body.appendChild(overlay);

    // Remove after 3 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 3000);
  }

  showWelcomeNotification() {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Welcome to TubeBoost!",
      message:
        "Your YouTube optimization companion is ready. Visit any YouTube video to get started!",
    });
  }

  showUpdateNotification() {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "TubeBoost Updated!",
      message: "New features and improvements are now available.",
    });
  }
}

// Initialize background script
new TubeBoostBackground();
