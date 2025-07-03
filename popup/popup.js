// Popup JavaScript for TubeBoost Chrome Extension

class TubeBoostPopup {
  constructor() {
    this.currentTab = null;
    this.isYouTube = false;
    this.videoData = null;
    this.init();
  }

  async init() {
    await this.checkCurrentTab();
    this.updateUI();
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      this.currentTab = tab;
      this.isYouTube = tab.url && tab.url.includes("studio.youtube.com");

      // if (this.isYouTube && tab.url.includes("/watch")) {
      if (this.isYouTube) {
        await this.getVideoData();
      }
    } catch (error) {
      console.error("Error checking current tab:", error);
    }
  }

  async getVideoData() {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => {
          // This function runs in the YouTube page context
          try {
            const element = document.querySelector(".thumbnail-wrapper #entity-name");
            const videoTitle = element ? element.textContent : "Unknown Title";

            return {
              title: videoTitle.trim(),
              url: window.location.href,
            };
          } catch (error) {
            console.error("Error extracting video data:", error);
            return null;
          }
        }
      });

      if (results && results[0] && results[0].result) {
        this.videoData = results[0].result;
      }
    } catch (error) {
      console.error("Error getting video data:", error);
    }
  }

  updateUI() {
    const statusIndicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");
    const statsSection = document.getElementById("statsSection");
    const seoSection = document.getElementById("seoSection");

    if (this.isYouTube) {
      statusIndicator.classList.remove("inactive");
      statusText.textContent = "YouTube Detected";

      if (this.videoData) {
        statusText.textContent = this.videoData.title;
        statsSection.style.display = "block";
        seoSection.style.display = "block";
      } else {
        statusText.textContent = "Browse to a video";
        statsSection.style.display = "none";
        seoSection.style.display = "none";
      }
    } else {
      statusIndicator.classList.add("inactive");
      statusText.textContent = "Not on YouTube";
      statsSection.style.display = "none";
      seoSection.style.display = "none";
    }
  }

  // Tool opening methods
  openOptimizationTool() {
    this.injectTool("optimization");
  }

  openKeywordTool() {
    this.injectTool("keywords");
  }

  openTagGenerator() {
    this.injectTool("tags");
  }

  openAnalytics() {
    this.injectTool("analytics");
  }

  openThumbnailTool() {
    this.injectTool("thumbnail");
  }

  openBulkEditor() {
    this.injectTool("bulk");
  }

  openCompetitorAnalysis() {
    this.injectTool("competitor");
  }

  async injectTool(toolType) {
    if (!this.isYouTube) {
      alert("Please navigate to YouTube first!");
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: (toolType) => {
          // Send message to content script to show tool
          window.postMessage(
            { type: "TUBEBOOST_SHOW_TOOL", toolType: toolType },
            "*",
          );
        },
        args: [toolType],
      });

      // Close popup after opening tool
      window.close();
    } catch (error) {
      console.error("Error injecting tool:", error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TubeBoostPopup();
});
