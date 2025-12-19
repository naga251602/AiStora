// static/js/auth.js

const Auth = {
  init() {
    // We will attach these listeners in Main.js after DOM load
    // checking if elements exist to avoid errors during phase transitions
    this.bindEvents();
  },

  bindEvents() {
    // --- Login ---
    const btnLogin = document.getElementById("btn-login");
    if (btnLogin)
      btnLogin.addEventListener("click", this.handleLogin.bind(this));

    // --- Register ---
    const btnRegister = document.getElementById("btn-register");
    if (btnRegister)
      btnRegister.addEventListener("click", this.handleRegister.bind(this));

    // --- Logout (Global) ---
    window.addEventListener("auth:logout", () => {
      Router.navigate("auth");
      this.showAuthError("Session expired. Please log in again.");
    });
  },

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document
      .getElementById("login-identifier")
      ?.value.trim();
    const password = document.getElementById("login-password")?.value;
    const errorEl = document.getElementById("auth-error"); // Generic error box

    if (!identifier || !password) {
      this.showAuthError("Please enter your email/username and password.");
      return;
    }

    // UI Loading State
    this.setLoading("btn-login", true);

    const res = await API.fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier: identifier, password: password }),
    });

    this.setLoading("btn-login", false);

    if (res.success) {
      API.setToken(res.token);
      API.setUser(res.user);
      Router.navigate("db"); // Go to Workspace
    } else {
      this.showAuthError(res.error);
    }
  },

  async handleRegister(e) {
    e.preventDefault();

    // Grab values
    const fullName = document.getElementById("reg-fullname")?.value.trim();
    const username = document.getElementById("reg-username")?.value.trim();
    const email = document.getElementById("reg-email")?.value.trim();
    const password = document.getElementById("reg-password")?.value;
    const confirmPass = document.getElementById("reg-confirm-password")?.value;
    const terms = document.getElementById("reg-terms")?.checked;

    // --- Client Side Validations ---
    if (!fullName || !username || !email || !password) {
      this.showAuthError("All fields are required.");
      return;
    }
    if (password !== confirmPass) {
      this.showAuthError("Passwords do not match.");
      return;
    }
    if (!terms) {
      this.showAuthError("You must agree to the Terms of Service.");
      return;
    }

    this.setLoading("btn-register", true);

    const res = await API.fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ fullName, username, email, password }),
    });

    this.setLoading("btn-register", false);

    if (res.success) {
      alert("Account created successfully! Please log in.");
      // Ideally switch to login tab here
      this.toggleAuthMode("login");
    } else {
      this.showAuthError(res.error);
    }
  },

  showAuthError(msg) {
    // Assumes an element with id="auth-error-msg" or similar exists in the new UI
    const el = document.getElementById("auth-error");
    const error_msg = document.getElementById("auth-error-msg");
    if (el) {
      el.classList.remove("hidden");
      error_msg.innerText = msg;
      setTimeout(() => el.classList.add("hidden"), 5000);
    } else {
      alert(msg); // Fallback
    }
  },

  setLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalText = btn.innerText;
      btn.innerText = "Processing...";
      btn.disabled = true;
    } else {
      btn.innerText = btn.dataset.originalText || "Submit";
      btn.disabled = false;
    }
  },

  toggleAuthMode(mode) {
    // Helper to switch visual tabs (Login vs Register)
    const loginForm = document.getElementById("form-login");
    const regForm = document.getElementById("form-register");

    if (mode === "login") {
      if (loginForm) loginForm.classList.remove("hidden");
      if (regForm) regForm.classList.add("hidden");
    } else {
      if (loginForm) loginForm.classList.add("hidden");
      if (regForm) regForm.classList.remove("hidden");
    }
  },

  logout() {
    if (confirm("Are you sure you want to log out?")) {
      API.removeToken();
      API.removeUser();
      Router.navigate("auth");
    }
  },
};
