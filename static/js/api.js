// static/js/api.js

const API = {
  setToken(token) {
    localStorage.setItem("jwt_token", token);
  },
  getToken() {
    return localStorage.getItem("jwt_token");
  },
  removeToken() {
    localStorage.removeItem("jwt_token");
  },
  setUser(user) {
    localStorage.setItem("user_info", JSON.stringify(user));
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("user_info"));
    } catch (e) {
      return null;
    }
  },
  removeUser() {
    localStorage.removeItem("user_info");
  },

  async fetch(endpoint, options = {}) {
    const headers = { ...options.headers }; // Start with existing headers
    const token = this.getToken();

    // Only set Content-Type to JSON if we are NOT sending FormData (files)
    // Fetch sets the boundary automatically for FormData, so we must NOT set Content-Type manually there.
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) headers["Authorization"] = `Bearer ${token}`;

    const config = { ...options, headers };

    // [DEBUG] Log the outgoing request (Safely)
    let bodyLog = "";
    if (config.body instanceof FormData) {
      bodyLog = "FormData (Binary/File Upload)";
    } else if (config.body) {
      try {
        bodyLog = JSON.parse(config.body);
      } catch (e) {
        bodyLog = config.body; // Log raw string if not JSON
      }
    }

    try {
      const response = await fetch(endpoint, config);
      

      // Handle Session Expiry
      if (response.status === 401 || response.status === 422) {
        console.warn("[API ERROR] Session expired or invalid. Logging out.");
        this.removeToken();
        this.removeUser();
        if (!window.location.hash.includes("auth")) {
          window.dispatchEvent(new Event("auth:logout"));
        }
        return {
          success: false,
          error: "Session expired. Please login again.",
        };
      }

      // Handle 404 specifically
      if (response.status === 404) {
        console.error(
          "[API ERROR] Route not found (404)."
        );
        return {
          success: false,
          error: response.error,
        };
      }

      const data = await response.json();

      // Normalize errors
      if (!response.ok && data.msg) {
        return { success: false, error: data.msg };
      }

      return data;
    } catch (error) {
      console.error("[API NETWORK ERROR]", error);
      return { success: false, error: "Network error. Is the server running?" };
    }
  },
};
// --- HELPER: Convert JSON to CSV for the Table Download ---
function downloadCSV(data, filename = "export.csv") {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add Header Row
  csvRows.push(headers.join(","));

  // Add Data Rows
  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = ("" + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- HELPER: Modal Logic ---
function openImageModal(url) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const downloadLink = document.getElementById("modalDownloadLink");

  modalImg.src = url;
  downloadLink.href = url; // Set download link to the image URL
  modal.classList.remove("hidden");
}

function closeImageModal() {
  document.getElementById("imageModal").classList.add("hidden");
}
