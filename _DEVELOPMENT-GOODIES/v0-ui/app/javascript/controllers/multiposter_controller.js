import { Controller } from "@hotwired/stimulus";

// Platform character limits
const PLATFORM_LIMITS = {
  bluesky: 300,
  mastodon: 500,
  threads: 500,
  facebook: 63206,
  x: 280,
};

export default class extends Controller {
  static targets = [
    "content",
    "platform",
    "counter",
    "progressBar",
    "submitButton",
  ];

  connect() {
    this.updateCounters();
    this.updateSubmitButton();
  }

  updateCounters() {
    const content = this.contentTarget.value;
    this.counterTargets.forEach((counter, index) => {
      const platform = this.platformTargets[index].value;
      const limit = PLATFORM_LIMITS[platform];
      const count = content.length;
      counter.textContent = `${count}/${limit}`;

      this.updateProgressBar(this.progressBarTargets[index], count, limit);

      if (count > limit) {
        counter.classList.add("text-red-500", "font-medium");
        counter.classList.remove("text-gray-500");
      } else {
        counter.classList.remove("text-red-500", "font-medium");
        counter.classList.add("text-gray-500");
      }
    });
    this.updateSubmitButton();
  }

  updateProgressBar(progressBar, count, limit) {
    const percentage = Math.min((count / limit) * 100, 100);
    progressBar.style.width = `${percentage}%`;

    if (percentage >= 100) {
      progressBar.classList.add("bg-red-500");
      progressBar.classList.remove("bg-amber-500", "bg-blue-500");
    } else if (percentage >= 90) {
      progressBar.classList.add("bg-amber-500");
      progressBar.classList.remove("bg-red-500", "bg-blue-500");
    } else {
      progressBar.classList.add("bg-blue-500");
      progressBar.classList.remove("bg-red-500", "bg-amber-500");
    }
  }

  updateSubmitButton() {
    const canPost =
      this.platformTargets.some((platform) => platform.checked) &&
      this.contentTarget.value.length > 0 &&
      this.platformTargets.every((platform) => {
        return (
          !platform.checked ||
          this.contentTarget.value.length <= PLATFORM_LIMITS[platform.value]
        );
      });

    this.submitButtonTarget.disabled = !canPost;
  }

  togglePlatform() {
    this.updateSubmitButton();
  }
}
