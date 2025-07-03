// Content Script for TubeBoost Chrome Extension
// This script runs on YouTube pages and adds functionality

class TubeBoostContent {
  constructor() {
    this.isInjected = false;
    this.currentVideoId = null;
    this.tools = {};
    this.init();
  }

  init() {
    console.log("TubeBoost: Content script loaded");
    this.injectStyles();
    this.setupMessageListener();
    this.observePageChanges();
    this.addFloatingButton();
  }

  injectStyles() {
    if (document.getElementById("tubeboost-styles")) return;

    const style = document.createElement("link");
    style.id = "tubeboost-styles";
    style.rel = "stylesheet";
    style.href = chrome.runtime.getURL("content/content.css");
    document.head.appendChild(style);
  }

  setupMessageListener() {
    window.addEventListener("message", (event) => {
      if (event.data.type === "TUBEBOOST_SHOW_TOOL") {
        this.showTool(event.data.toolType);
      }
    });
  }

  observePageChanges() {
    // YouTube is a SPA, so we need to watch for navigation changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.onPageChange();
      }
    }).observe(document, { subtree: true, childList: true });

    this.onPageChange();
  }

  onPageChange() {
    setTimeout(() => {
      this.currentVideoId = this.extractVideoId();
      this.updateFloatingButton();
      this.addVideoEnhancements();
    }, 1000);
  }

  extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  }

  addFloatingButton() {
    if (document.getElementById("tubeboost-floating-btn")) return;

    const button = document.createElement("div");
    button.id = "tubeboost-floating-btn";
    button.className = "tubeboost-floating-btn";
    button.innerHTML = `
      <div class="tubeboost-btn-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 9.71a8.5 8.5 0 0 0-.91-4.13 2.92 2.92 0 0 0-1.72-1A78.36 78.36 0 0 0 12 4.27a78.45 78.45 0 0 0-8.34.3 2.87 2.87 0 0 0-1.46.74c-.9.83-1 2.25-1.1 3.45a48.29 48.29 0 0 0 0 6.48 47.92 47.92 0 0 0 .6 4.73c.15 1.65.4 3.29 1.05 3.83a2.87 2.87 0 0 0 1.46.74 78.45 78.45 0 0 0 8.34.3 78.36 78.36 0 0 0 8.37-.31 2.92 2.92 0 0 0 1.72-1A8.5 8.5 0 0 0 23 14.29c.17-1.53.17-3.2.17-4.58s0-3.05-.17-4.58zM8.8 15.74V8.26l7.13 3.74z"/>
        </svg>
      </div>
      <span class="tubeboost-btn-text">TubeBoost</span>
    `;

    button.addEventListener("click", () => {
      this.showQuickTools();
    });

    document.body.appendChild(button);
  }

  updateFloatingButton() {
    const button = document.getElementById("tubeboost-floating-btn");
    if (button) {
      button.style.display = this.currentVideoId ? "flex" : "none";
    }
  }

  addVideoEnhancements() {
    if (!this.currentVideoId) return;

    this.addSEOInsights();
    this.addTagSuggestions();
    this.addOptimizationHints();
  }

  addSEOInsights() {
    // Add SEO score badge to video title
    const titleElement = document.querySelector("h1.ytd-watch-metadata");
    if (titleElement && !titleElement.querySelector(".tubeboost-seo-badge")) {
      const badge = document.createElement("span");
      badge.className = "tubeboost-seo-badge";
      badge.textContent = "SEO: 85/100";
      badge.title = "TubeBoost SEO Score";
      titleElement.appendChild(badge);
    }
  }

  addTagSuggestions() {
    // Add tag suggestions below description
    const description = document.querySelector("#description");
    if (
      description &&
      !description.querySelector(".tubeboost-tag-suggestions")
    ) {
      const suggestions = document.createElement("div");
      suggestions.className = "tubeboost-tag-suggestions";
      suggestions.innerHTML = `
        <div class="tubeboost-suggestions-header">
          <strong>🏷️ TubeBoost Tag Suggestions:</strong>
        </div>
        <div class="tubeboost-tags">
          <span class="tubeboost-tag">youtube tutorial</span>
          <span class="tubeboost-tag">how to</span>
          <span class="tubeboost-tag">beginner guide</span>
          <span class="tubeboost-tag">tips and tricks</span>
        </div>
      `;
      description.parentNode.insertBefore(suggestions, description.nextSibling);
    }
  }

  addOptimizationHints() {
    // Add optimization panel to sidebar
    const secondary = document.querySelector("#secondary");
    if (secondary && !secondary.querySelector(".tubeboost-optimization")) {
      const panel = document.createElement("div");
      panel.className = "tubeboost-optimization";
      panel.innerHTML = `
        <div class="tubeboost-panel">
          <h3>⚡ TubeBoost Insights</h3>
          <div class="tubeboost-insights">
            <div class="tubeboost-insight">
              <span class="insight-icon">📈</span>
              <span class="insight-text">Engagement: Above Average</span>
            </div>
            <div class="tubeboost-insight">
              <span class="insight-icon">🎯</span>
              <span class="insight-text">SEO Score: 85/100</span>
            </div>
            <div class="tubeboost-insight">
              <span class="insight-icon">🏷️</span>
              <span class="insight-text">Tags: 8/15 recommended</span>
            </div>
          </div>
          <button class="tubeboost-optimize-btn">Optimize This Video</button>
        </div>
      `;

      const optimizeBtn = panel.querySelector(".tubeboost-optimize-btn");
      optimizeBtn.addEventListener("click", () => {
        this.showTool("optimization");
      });

      secondary.insertBefore(panel, secondary.firstChild);
    }
  }

  showQuickTools() {
    if (document.getElementById("tubeboost-quick-tools")) {
      this.hideQuickTools();
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "tubeboost-quick-tools";
    overlay.className = "tubeboost-overlay";
    overlay.innerHTML = `
      <div class="tubeboost-modal">
        <div class="tubeboost-modal-header">
          <h3>TubeBoost Quick Tools</h3>
          <button class="tubeboost-close-btn">&times;</button>
        </div>
        <div class="tubeboost-modal-content">
          <div class="tubeboost-tools-grid">
            <div class="tubeboost-tool-card" data-tool="keywords">
              <div class="tool-icon">🔍</div>
              <h4>Keyword Research</h4>
              <p>Find trending keywords for your niche</p>
            </div>
            <div class="tubeboost-tool-card" data-tool="tags">
              <div class="tool-icon">🏷️</div>
              <h4>Tag Generator</h4>
              <p>AI-powered tag suggestions</p>
            </div>
            <div class="tubeboost-tool-card" data-tool="thumbnail">
              <div class="tool-icon">🖼️</div>
              <h4>Thumbnail A/B Test</h4>
              <p>Test multiple thumbnail designs</p>
            </div>
            <div class="tubeboost-tool-card" data-tool="analytics">
              <div class="tool-icon">📊</div>
              <h4>Advanced Analytics</h4>
              <p>Deep dive into performance metrics</p>
            </div>
            <div class="tubeboost-tool-card" data-tool="competitor">
              <div class="tool-icon">🎯</div>
              <h4>Competitor Analysis</h4>
              <p>See what your competitors are doing</p>
            </div>
            <div class="tubeboost-tool-card" data-tool="optimization">
              <div class="tool-icon">⚡</div>
              <h4>Video Optimizer</h4>
              <p>Complete SEO optimization</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    overlay
      .querySelector(".tubeboost-close-btn")
      .addEventListener("click", () => {
        this.hideQuickTools();
      });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.hideQuickTools();
      }
    });

    overlay.querySelectorAll(".tubeboost-tool-card").forEach((card) => {
      card.addEventListener("click", () => {
        const tool = card.dataset.tool;
        this.hideQuickTools();
        this.showTool(tool);
      });
    });

    document.body.appendChild(overlay);
  }

  hideQuickTools() {
    const overlay = document.getElementById("tubeboost-quick-tools");
    if (overlay) {
      overlay.remove();
    }
  }

  showTool(toolType) {
    console.log(`TubeBoost: Opening ${toolType} tool`);

    // Hide any existing tools
    this.hideAllTools();

    switch (toolType) {
      case "keywords":
        this.showKeywordTool();
        break;
      case "tags":
        this.showTagTool();
        break;
      case "thumbnail":
        this.showThumbnailTool();
        break;
      case "analytics":
        this.showAnalyticsTool();
        break;
      case "competitor":
        this.showCompetitorTool();
        break;
      case "optimization":
        this.showOptimizationTool();
        break;
      default:
        console.warn(`Unknown tool type: ${toolType}`);
    }
  }

  hideAllTools() {
    document
      .querySelectorAll('[id^="tubeboost-tool-"]')
      .forEach((el) => el.remove());
  }

  showKeywordTool() {
    const tool = this.createToolModal(
      "keywords",
      "🔍 Keyword Research",
      `
      <div class="tubeboost-tool-content">
        <div class="search-bar">
          <input type="text" placeholder="Enter your main keyword..." class="tubeboost-input">
          <button class="tubeboost-btn">Research</button>
        </div>
        <div class="keyword-results">
          <h4>Trending Keywords</h4>
          <div class="keyword-list">
            <div class="keyword-item">
              <span class="keyword">youtube tutorial</span>
              <span class="volume">12K/month</span>
              <span class="difficulty">Easy</span>
            </div>
            <div class="keyword-item">
              <span class="keyword">how to youtube</span>
              <span class="volume">8.5K/month</span>
              <span class="difficulty">Medium</span>
            </div>
            <div class="keyword-item">
              <span class="keyword">youtube tips</span>
              <span class="volume">6.2K/month</span>
              <span class="difficulty">Easy</span>
            </div>
          </div>
        </div>
      </div>
    `,
    );
    document.body.appendChild(tool);
  }

  showTagTool() {
    const tool = this.createToolModal(
      "tags",
      "🏷️ Tag Generator",
      `
      <div class="tubeboost-tool-content">
        <div class="tag-input">
          <textarea placeholder="Paste your video title and description here..." rows="4" class="tubeboost-textarea"></textarea>
          <button class="tubeboost-btn">Generate Tags</button>
        </div>
        <div class="generated-tags">
          <h4>Recommended Tags</h4>
          <div class="tag-cloud">
            <span class="generated-tag">youtube</span>
            <span class="generated-tag">tutorial</span>
            <span class="generated-tag">how to</span>
            <span class="generated-tag">beginner</span>
            <span class="generated-tag">guide</span>
            <span class="generated-tag">tips</span>
            <span class="generated-tag">tricks</span>
            <span class="generated-tag">2024</span>
          </div>
          <button class="tubeboost-btn-outline">Copy All Tags</button>
        </div>
      </div>
    `,
    );
    document.body.appendChild(tool);
  }

  showThumbnailTool() {
    const tool = this.createToolModal(
      "thumbnail",
      "🖼️ Thumbnail A/B Test",
      `
      <div class="tubeboost-tool-content">
        <div class="thumbnail-upload">
          <h4>Upload Thumbnail Variants</h4>
          <div class="upload-grid">
            <div class="upload-slot">
              <div class="upload-area">
                <span>📁 Upload Variant A</span>
              </div>
            </div>
            <div class="upload-slot">
              <div class="upload-area">
                <span>📁 Upload Variant B</span>
              </div>
            </div>
          </div>
          <button class="tubeboost-btn">Start A/B Test</button>
        </div>
        <div class="test-results">
          <h4>Current Test Results</h4>
          <p class="placeholder-text">Upload thumbnails to start testing</p>
        </div>
      </div>
    `,
    );
    document.body.appendChild(tool);
  }

  showAnalyticsTool() {
    const tool = this.createToolModal(
      "analytics",
      "📊 Advanced Analytics",
      `
      <div class="tubeboost-tool-content">
        <div class="analytics-overview">
          <div class="metric-cards">
            <div class="metric-card">
              <h4>CTR</h4>
              <div class="metric-value">8.5%</div>
              <div class="metric-change">+2.1%</div>
            </div>
            <div class="metric-card">
              <h4>Retention</h4>
              <div class="metric-value">65%</div>
              <div class="metric-change">+5.2%</div>
            </div>
            <div class="metric-card">
              <h4>Engagement</h4>
              <div class="metric-value">4.2%</div>
              <div class="metric-change">+0.8%</div>
            </div>
          </div>
        </div>
        <div class="analytics-chart">
          <h4>Performance Over Time</h4>
          <div class="chart-placeholder">
            📈 Chart visualization would appear here
          </div>
        </div>
      </div>
    `,
    );
    document.body.appendChild(tool);
  }

  showCompetitorTool() {
    const tool = this.createToolModal(
      "competitor",
      "🎯 Competitor Analysis",
      `
      <div class="tubeboost-tool-content">
        <div class="competitor-search">
          <input type="text" placeholder="Enter competitor channel URL..." class="tubeboost-input">
          <button class="tubeboost-btn">Analyze</button>
        </div>
        <div class="competitor-results">
          <h4>Top Performing Videos</h4>
          <div class="competitor-videos">
            <div class="competitor-video">
              <div class="video-title">How to Grow on YouTube in 2024</div>
              <div class="video-stats">1.2M views • 85K likes</div>
            </div>
            <div class="competitor-video">
              <div class="video-title">YouTube Algorithm Secrets</div>
              <div class="video-stats">950K views • 67K likes</div>
            </div>
          </div>
        </div>
      </div>
    `,
    );
    document.body.appendChild(tool);
  }

  showOptimizationTool() {
    const tool = this.createToolModal(
      "optimization",
      "⚡ Video Optimizer",
      `
      <div class="tubeboost-tool-content">
        <div class="optimization-checklist">
          <h4>Optimization Checklist</h4>
          <div class="checklist-items">
            <div class="checklist-item completed">
              <span class="checkbox">✓</span>
              <span>Title length optimized (67 characters)</span>
            </div>
            <div class="checklist-item">
              <span class="checkbox">○</span>
              <span>Add more descriptive tags</span>
            </div>
            <div class="checklist-item">
              <span class="checkbox">○</span>
              <span>Improve description (add timestamps)</span>
            </div>
            <div class="checklist-item completed">
              <span class="checkbox">✓</span>
              <span>Custom thumbnail uploaded</span>
            </div>
          </div>
        </div>
        <div class="optimization-suggestions">
          <h4>AI Suggestions</h4>
          <div class="suggestion">
            <strong>Title:</strong> Consider adding "2024" to your title for better searchability
          </div>
          <div class="suggestion">
            <strong>Tags:</strong> Add trending tags: "youtube growth", "content creation"
          </div>
        </div>
      </div>
    `,
    );
    document.body.appendChild(tool);
  }

  createToolModal(id, title, content) {
    const modal = document.createElement("div");
    modal.id = `tubeboost-tool-${id}`;
    modal.className = "tubeboost-overlay";
    modal.innerHTML = `
      <div class="tubeboost-tool-modal">
        <div class="tubeboost-modal-header">
          <h3>${title}</h3>
          <button class="tubeboost-close-btn">&times;</button>
        </div>
        <div class="tubeboost-modal-body">
          ${content}
        </div>
      </div>
    `;

    // Add close functionality
    modal
      .querySelector(".tubeboost-close-btn")
      .addEventListener("click", () => {
        modal.remove();
      });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modal;
  }
}

// Initialize content script
if (
  typeof window !== "undefined" &&
  window.location.hostname.includes("youtube.com")
) {
  new TubeBoostContent();
}
