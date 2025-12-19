// static/js/router.js

const Router = {
  screens: ["landing", "auth", "db", "uploader", "chat"],

  init() {
    // Expose to window for onclick="navigate('...')" support in updated.html
    window.navigate = this.navigate.bind(this);

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.screen) {
        this.show(e.state.screen);
      }
    });
  },

  navigate(screenId) {
    this.show(screenId);
    // Update URL without reload (optional, keeps history clean)
    history.pushState({ screen: screenId }, "", `#${screenId}`);
  },

  show(screenId) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.add("hidden");
    });

    // Show target screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.remove("hidden");
    }

    // Toggle Global Nav visibility
    const globalNav = document.getElementById("global-nav");
    if (globalNav) {
      if (["landing", "auth"].includes(screenId)) {
        globalNav.classList.add("hidden");
      } else {
        globalNav.classList.remove("hidden");
      }
    }
  },
};
