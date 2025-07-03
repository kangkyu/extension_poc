// Options Page JavaScript for TubeBoost Chrome Extension

class TubeBoostOptions {
  constructor() {
    this.defaultSettings = {
      autoAnalyze: true,
      showSEOScore: true,
      showTagSuggestions: true,
      showOptimizationHints: true,
      notifications: true,
      analysisDelay: 2,
      maxTagSuggestions: 10,
      theme: "light",
      saveAnalytics: true,
      shareUsageData: false,
    };

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get("settings");
      this.settings = { ...this.defaultSettings, ...result.settings };
    } catch (error) {
      console.error("Error loading settings:", error);
      this.settings = { ...this.defaultSettings };
    }
  }

  setupEventListeners() {
    // Toggle switches
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        this.handleToggleChange(e.target.id, e.target.checked);
      });
    });

    // Range sliders
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
      slider.addEventListener("input", (e) => {
        this.handleRangeChange(e.target.id, parseInt(e.target.value));
      });
    });

    // Select dropdowns
    document.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", (e) => {
        this.handleSelectChange(e.target.id, e.target.value);
      });
    });

    // Action buttons
    document
      .getElementById("saveSettings")
      .addEventListener("click", () => this.saveSettings());

    document
      .getElementById("resetSettings")
      .addEventListener("click", () => this.resetSettings());

    document
      .getElementById("exportData")
      .addEventListener("click", () => this.exportData());

    document
      .getElementById("clearData")
      .addEventListener("click", () => this.clearData());

    document
      .getElementById("upgradePlan")
      .addEventListener("click", () => this.upgradePlan());

    document
      .getElementById("helpBtn")
      .addEventListener("click", () => this.openHelp());
  }

  updateUI() {
    // Update toggle switches
    Object.keys(this.settings).forEach((key) => {
      const element = document.getElementById(key);
      if (element && element.type === "checkbox") {
        element.checked = this.settings[key];
      }
    });

    // Update range sliders
    const analysisDelaySlider = document.getElementById("analysisDelay");
    if (analysisDelaySlider) {
      analysisDelaySlider.value = this.settings.analysisDelay;
      document.getElementById("analysisDelayValue").textContent =
        this.settings.analysisDelay + "s";
    }

    const maxTagsSlider = document.getElementById("maxTagSuggestions");
    if (maxTagsSlider) {
      maxTagsSlider.value = this.settings.maxTagSuggestions;
      document.getElementById("maxTagSuggestionsValue").textContent =
        this.settings.maxTagSuggestions;
    }

    // Update select dropdowns
    const themeSelect = document.getElementById("theme");
    if (themeSelect) {
      themeSelect.value = this.settings.theme;
      this.applyTheme(this.settings.theme);
    }

    // Update usage bars
    this.updateUsageBars();
  }

  handleToggleChange(settingKey, value) {
    this.settings[settingKey] = value;
    this.markAsChanged();
  }

  handleRangeChange(settingKey, value) {
    this.settings[settingKey] = value;

    // Update display values
    if (settingKey === "analysisDelay") {
      document.getElementById("analysisDelayValue").textContent = value + "s";
    } else if (settingKey === "maxTagSuggestions") {
      document.getElementById("maxTagSuggestionsValue").textContent = value;
    }

    this.markAsChanged();
  }

  handleSelectChange(settingKey, value) {
    this.settings[settingKey] = value;

    if (settingKey === "theme") {
      this.applyTheme(value);
    }

    this.markAsChanged();
  }

  applyTheme(theme) {
    const container = document.querySelector(".container");
    container.setAttribute("data-theme", theme);

    if (theme === "auto") {
      // Apply auto theme based on system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      container.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
  }

  markAsChanged() {
    const saveButton = document.getElementById("saveSettings");
    saveButton.textContent = "💾 Save Changes";
    saveButton.style.background = "#f59e0b";
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
      this.showSuccessMessage();
      this.resetSaveButton();

      // Notify background script of settings change
      chrome.runtime.sendMessage({
        action: "settingsUpdated",
        settings: this.settings,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      this.showErrorMessage("Failed to save settings");
    }
  }

  async resetSettings() {
    if (
      confirm(
        "Are you sure you want to reset all settings to their default values?",
      )
    ) {
      this.settings = { ...this.defaultSettings };
      await this.saveSettings();
      this.updateUI();
    }
  }

  async exportData() {
    try {
      // Get all extension data
      const allData = await chrome.storage.sync.get(null);

      // Create downloadable file
      const dataStr = JSON.stringify(allData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `tubeboost-data-${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  }

  async clearData() {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone.",
      )
    ) {
      if (
        confirm(
          "This will delete all your settings, analytics, and saved data. Are you absolutely sure?",
        )
      ) {
        try {
          await chrome.storage.sync.clear();
          await chrome.storage.local.clear();
          this.settings = { ...this.defaultSettings };
          this.updateUI();
          alert("All data has been cleared successfully.");
        } catch (error) {
          console.error("Error clearing data:", error);
          alert("Failed to clear data");
        }
      }
    }
  }

  upgradePlan() {
    chrome.tabs.create({ url: "https://tubeboost.help/upgrade" });
  }

  openHelp() {
    chrome.tabs.create({ url: "https://tubeboost.help" });
  }

  updateUsageBars() {
    // Mock usage data - in a real extension, this would come from storage
    const usageData = {
      videoAnalysis: { used: 6, limit: 10 },
      keywordResearch: { used: 3, limit: 10 },
      tagGeneration: { used: 8, limit: 10 },
    };

    Object.keys(usageData).forEach((key) => {
      const data = usageData[key];
      const percentage = (data.used / data.limit) * 100;

      // Update usage bar
      const usageFill = document.querySelector(
        `.usage-fill[data-usage*="${key}"]`,
      );
      if (usageFill) {
        usageFill.style.width = percentage + "%";
        usageFill.parentElement.nextElementSibling.textContent = `${data.used}/${data.limit}`;

        // Change color based on usage
        if (percentage >= 90) {
          usageFill.style.background =
            "linear-gradient(90deg, #ef4444, #dc2626)";
        } else if (percentage >= 70) {
          usageFill.style.background =
            "linear-gradient(90deg, #f59e0b, #d97706)";
        } else {
          usageFill.style.background =
            "linear-gradient(90deg, #10b981, #059669)";
        }
      }
    });
  }

  showSuccessMessage() {
    const message = document.getElementById("successMessage");
    message.classList.add("show");
    setTimeout(() => {
      message.classList.remove("show");
    }, 3000);
  }

  showErrorMessage(text) {
    const message = document.getElementById("successMessage");
    message.textContent = "❌ " + text;
    message.style.background = "#ef4444";
    message.classList.add("show");
    setTimeout(() => {
      message.classList.remove("show");
      message.textContent = "✅ Settings saved successfully!";
      message.style.background = "#10b981";
    }, 3000);
  }

  resetSaveButton() {
    const saveButton = document.getElementById("saveSettings");
    saveButton.textContent = "💾 Save Settings";
    saveButton.style.background = "";
  }
}

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    const container = document.querySelector(".container");
    if (container.getAttribute("data-theme") === "auto") {
      container.setAttribute("data-theme", e.matches ? "dark" : "light");
    }
  });

// Initialize options page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TubeBoostOptions();
});
