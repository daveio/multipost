import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = [
    "input",
    "blueskyCount",
    "mastodonCount",
    "threadsCount",
    "facebookCount",
    "xCount",
    "blueskyBar",
    "mastodonBar",
    "threadsBar",
    "facebookBar",
    "xBar",
    "blueskyParts",
    "mastodonParts",
    "threadsParts",
    "facebookParts",
    "xParts",
  ];

  static values = {
    blueskyLimit: { type: Number, default: 300 },
    mastodonLimit: { type: Number, default: 500 },
    threadsLimit: { type: Number, default: 500 },
    facebookLimit: { type: Number, default: 63206 },
    xLimit: { type: Number, default: 280 },
  };

  connect() {
    console.log("PostComposer controller connected");
    this.updateCounts();
  }

  disconnect() {
    this.inputTarget.removeEventListener("input", () => this.updateCounts());
  }

  updateCounts() {
    console.log("Updating counts");
    const text = this.inputTarget.value;
    const length = text.length;
    console.log(`Current text length: ${length}`);

    // Update character counts and progress bars for each platform
    this.updatePlatformMetrics("bluesky", length);
    this.updatePlatformMetrics("mastodon", length);
    this.updatePlatformMetrics("threads", length);
    this.updatePlatformMetrics("facebook", length);
    this.updatePlatformMetrics("x", length);
  }

  updatePlatformMetrics(platform, length) {
    const limit = this[`${platform}LimitValue`];
    const percentage = Math.min((length / limit) * 100, 100);
    const parts = Math.ceil(length / limit);

    // Update count
    this[`${platform}CountTarget`].textContent = `${length}/${limit}`;

    // Update progress bar
    const bar = this[`${platform}BarTarget`];
    bar.style.width = `${percentage}%`;

    // Update color based on percentage
    if (percentage >= 100) {
      bar.classList.remove("bg-green-500", "bg-yellow-500");
      bar.classList.add("bg-red-500");
    } else if (percentage >= 90) {
      bar.classList.remove("bg-green-500", "bg-red-500");
      bar.classList.add("bg-yellow-500");
    } else {
      bar.classList.remove("bg-yellow-500", "bg-red-500");
      bar.classList.add("bg-green-500");
    }

    // Update parts count
    if (parts > 1) {
      this[`${platform}PartsTarget`].textContent = `Will be split into ${parts} posts`;
      this[`${platform}PartsTarget`].classList.remove("hidden");
    } else {
      this[`${platform}PartsTarget`].classList.add("hidden");
    }
  }
}
