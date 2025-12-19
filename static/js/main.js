// static/js/main.js

const Main = {
  state: {
    activeDbId: null,
    schema: {},
    chartInstances: {},
  },

  init() {
    Router.init();
    Auth.init();
    this.bindEvents();
    this.checkSession();

    // Run initial demo if on landing page
    if (document.getElementById("landing-demo-output")) {
      this.runLandingDemo(
        "metrics",
        document.querySelector(".landing-demo-tab")
      );
    }
  },

  async checkSession() {
    const token = API.getToken();
    if (token) {
      const res = await API.fetch("/api/auth/status");
      if (res.isLoggedIn) {
        API.setUser(res.user);

        const currentHash = window.location.hash.replace("#", "");

        // If we are on a public page (or root), go to Dashboard
        if (["landing", "auth", ""].includes(currentHash)) {
          Router.navigate("db");
        } else {
          // If we are already on a protected page (e.g. #chat), stay there!
          // We must call navigate() to hide the Landing page and show the correct screen.
          Router.navigate(currentHash);
        }

        this.loadDatabases();
      } else {
        API.removeToken();
      }
    }
  },

  bindEvents() {
    // --- Upload Screen ---
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-upload");

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("border-sky-500", "bg-sky-50");
      });
      dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-sky-500", "bg-sky-50");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-sky-500", "bg-sky-50");
        this.handleUpload(e.dataTransfer.files);
      });
      fileInput.addEventListener("change", (e) =>
        this.handleUpload(e.target.files)
      );
    }

    // --- Chat Screen ---
    const btnSend = document.getElementById("chat-send");
    const inputChat = document.getElementById("chat-input");
    if (btnSend) btnSend.addEventListener("click", () => this.sendMessage());
    if (inputChat) {
      inputChat.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  },

  // ============================================================
  // DATABASE MANAGEMENT (This was missing!)
  // ============================================================

  async createDatabase() {
    const nameInput = document.getElementById("new-db-name");
    const name = nameInput?.value.trim();

    if (!name) {
      alert("Please enter a workspace name.");
      return;
    }

    const res = await API.fetch("/api/databases", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    if (res.success) {
      // Clear input and hide modal
      if (nameInput) nameInput.value = "";
      document.getElementById("modal-create-db").classList.add("hidden");

      // Refresh list
      this.loadDatabases();
    } else {
      alert(res.error || "Failed to create workspace");
    }
  },

  async deleteDatabase(id) {
    if (
      !confirm(
        "Are you sure you want to delete this workspace? This action cannot be undone."
      )
    )
      return;

    const res = await API.fetch(`/api/databases/${id}`, {
      method: "DELETE",
    });

    if (res.success) {
      this.loadDatabases(); // Refresh list
    } else {
      alert(res.error || "Failed to delete workspace");
    }
  },

  async renameDatabase(id, currentName) {
    // Simple prompt for now, can be replaced with a modal later
    const newName = prompt("Rename Workspace:", currentName);
    if (!newName || newName.trim() === "" || newName === currentName) return;

    const res = await API.fetch(`/api/databases/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (res.success) {
      this.loadDatabases(); // Refresh UI
    } else {
      alert(res.error || "Failed to rename workspace");
    }
  },

  async loadDatabases() {
    const res = await API.fetch("/api/databases");
    if (res.success) {
      const list = document.getElementById("db-list");
      if (!list) return;

      list.innerHTML = res.databases
        .map(
          (db) => `
                <div onclick="Main.selectDatabase(${db.id})" class="bento-card col-span-12 md:col-span-4 p-8 rounded-[2.5rem] flex flex-col cursor-pointer animate-in relative overflow-hidden group hover:border-sky-400 transition-all">
                    
                    <div class="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onclick="event.stopPropagation(); Main.renameDatabase(${db.id}, '${db.name}')" class="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 hover:bg-sky-50 hover:text-sky-600 transition-all shadow-sm" title="Rename">
                            <i data-lucide="edit-3" class="h-4 w-4"></i>
                        </button>
                        <button onclick="event.stopPropagation(); Main.deleteDatabase(${db.id})" class="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm" title="Delete">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>

                    <div class="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-8 group-hover:bg-sky-600 group-hover:text-white transition-all">
                        <i data-lucide="database" class="h-7 w-7"></i>
                    </div>
                    <h3 class="text-xl font-bold text-zinc-950 truncate">${db.name}</h3>
                    <p class="text-sm text-zinc-400 mt-2 mb-8 leading-relaxed">${db.table_count} Tables Active</p>
                    <div class="mt-auto flex items-center justify-between pt-6 border-t border-zinc-50">
                        <span class="text-[10px] font-bold text-zinc-300 uppercase">Last Active</span>
                        <span class="text-[10px] font-bold text-emerald-600 uppercase">Ready</span>
                    </div>
                </div>
            `
        )
        .join("");
      lucide.createIcons();
    }
  },
  async selectDatabase(id) {
    const res = await API.fetch("/api/databases/select", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    if (res.success) {
      this.state.activeDbId = id;
      this.state.schema = res.schema;

      // Update UI Name
      const dbNameEl = document.getElementById("active-db-name");
      if (dbNameEl) {
        dbNameEl.innerText = res.name;
      }

      this.renderArchitecture();
      Router.navigate("uploader");
    }
  },

  // ============================================================
  // UPLOAD / ARCHITECTURE LOGIC
  // ============================================================

  async handleUpload(files) {
    if (!files.length) return;

    // Show loading overlay if it exists
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.classList.remove("hidden");

    const formData = new FormData();
    // Add Project ID (Critical fix for backend)
    formData.append("project_id", this.state.activeDbId);

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    const res = await API.fetch("/api/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });

    if (overlay) overlay.classList.add("hidden");

    if (res.success) {
      this.state.schema = res.schema;
      this.renderArchitecture();
      this.detectRelationships();
    } else {
      alert("Upload failed: " + res.error);
    }
  },

  async detectRelationships() {
    const statusText = document.getElementById("integrity-status-text");
    if (statusText) statusText.innerText = "Analyzing...";

    const res = await API.fetch("/api/detect-relationships", {
      method: "POST",
      body: JSON.stringify({ project_id: this.state.activeDbId }),
    });

    if (res.success) {
      const relList = document.getElementById("relationship-list");
      if (relList) {
        relList.innerHTML =
          res.relationships.length > 0
            ? res.relationships
                .map(
                  (r) => `
                    <div class="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl animate-in">
                        <i data-lucide="link-2" class="h-4 w-4 text-sky-600"></i>
                        <span class="text-xs font-bold text-zinc-700">${r.from_table}.${r.from_column} → ${r.to_table}.${r.to_column}</span>
                    </div>
                `
                )
                .join("")
            : `<p class="text-xs text-zinc-400 p-2">No direct links detected yet.</p>`;
        lucide.createIcons();
      }
      if (statusText) statusText.innerText = "Verified";
    }
  },

  renderArchitecture() {
    const list = document.getElementById("file-list");
    const schema = this.state.schema;
    if (!list) return;

    list.innerHTML = Object.entries(schema)
      .map(
        ([name, details]) => `
            <div class="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] hover:border-sky-400 hover:bg-white transition-all cursor-pointer relative group">
                <div class="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="Main.openPreview('${name}')" class="h-8 w-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 hover:text-sky-600 transition-all shadow-sm">
                        <i data-lucide="eye" class="h-4 w-4"></i>
                    </button>
                    <button onclick="Main.openRename('${
                      details.id
                    }', '${name}')" class="h-8 w-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 hover:text-sky-600 transition-all shadow-sm">
                        <i data-lucide="edit-3" class="h-4 w-4"></i>
                    </button>
                    <button onclick="Main.deleteTable('${
                      details.id
                    }')" class="h-8 w-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-all shadow-sm">
                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                </div>
                <div class="flex items-center gap-5 mb-8 text-left">
                    <div class="h-14 w-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-sky-600 shadow-sm">
                        <i data-lucide="table" class="h-7 w-7"></i>
                    </div>
                    <div>
                        <p class="text-xl font-black text-zinc-950 tracking-tight text-left">${name}</p>
                        <p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-left">${
                          details.row_count
                        } Rows</p>
                    </div>
                </div>
                <div class="space-y-2">
                    ${Object.keys(details.types)
                      .slice(0, 3)
                      .map(
                        (col) => `
                        <div class="flex items-center justify-between text-[11px] font-semibold text-zinc-500 bg-white/50 p-3 rounded-xl border border-zinc-100/50">
                            <span class="flex items-center gap-2"><i data-lucide="columns" class="h-3 w-3 text-zinc-400"></i> ${col}</span>
                            <span class="uppercase text-[8px] font-black text-zinc-300">${details.types[col]}</span>
                        </div>
                    `
                      )
                      .join("")}
                    ${
                      Object.keys(details.types).length > 3
                        ? `<div class="text-center text-[10px] text-zinc-300 pt-2">+${
                            Object.keys(details.types).length - 3
                          } more columns</div>`
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");
    lucide.createIcons();
  },

  exportSchema() {
    if (!this.state.schema || Object.keys(this.state.schema).length === 0) {
      alert("No schema available to export.");
      return;
    }
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(this.state.schema, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `schema_export_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  // ============================================================
  // LANDING DEMO (Exact match from updated.html)
  // ============================================================
  runLandingDemo(type, el) {
    const container = document.getElementById("landing-demo-output");
    if (!container) return;

    // 1. Update Active Tab State
    document.querySelectorAll(".landing-demo-tab").forEach((t) => {
      t.classList.toggle("border-sky-500", t === el);
      t.classList.toggle("bg-sky-50/50", t === el);
    });

    // 2. Define Queries (Exact text from updated.html)
    const queries = {
      metrics: "What's the total record density across all correlated tiers?",
      tables: "Show me a correlated breakdown of nodes grouped by status.",
      charts:
        "Visualize the performance distribution of our top correlated datasets.",
    };

    // 3. Render "Thinking" State
    container.innerHTML = `
        <div class="flex justify-end animate-in">
            <div class="user-bubble px-5 py-3 rounded-2xl rounded-tr-none text-white text-xs leading-relaxed font-medium max-w-[85%] text-left">${queries[type]}</div>
        </div>
        <div id="landing-thinking" class="flex gap-3 animate-in stagger-1 text-left">
            <div class="h-7 w-7 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 shadow-lg text-left"><i data-lucide="bot" class="h-4 w-4 text-sky-400"></i></div>
            <div class="flex items-center gap-1.5 px-4 py-3 bg-zinc-50 rounded-2xl">
                <div class="h-1.5 w-1.5 bg-sky-500 rounded-full animate-bounce"></div>
                <div class="h-1.5 w-1.5 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="h-1.5 w-1.5 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>
    `;
    lucide.createIcons();

    // 4. Render Result after delay
    setTimeout(() => {
      const indicator = document.getElementById("landing-thinking");
      if (indicator) indicator.remove();

      let viz = "";
      let sql = "";

      if (type === "metrics") {
        viz = `<div class="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 text-center animate-in"><p class="text-[10px] font-black text-zinc-400 uppercase mb-2 tracking-widest text-center">Global Node Density</p><p class="text-5xl font-black text-sky-600 tracking-tighter text-center">12,450</p></div>`;
        sql = `SELECT COUNT(*) FROM unified_map WHERE integrity_score > 0.95;`;
      } else if (type === "tables") {
        viz = `
            <div class="overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-white animate-in text-left">
                <div class="overflow-auto max-h-40 no-scrollbar">
                    <table class="w-full text-[10px] text-left">
                        <thead class="bg-zinc-50 sticky top-0"><tr><th class="p-3 font-black uppercase tracking-widest text-[9px]">Entity</th><th class="p-3 text-right uppercase tracking-widest text-[9px]">Correlation</th></tr></thead>
                        <tbody class="divide-y divide-zinc-100">
                            <tr><td class="p-3 font-bold">Primary Core</td><td class="p-3 text-right font-black text-sky-600">0.98</td></tr>
                            <tr><td class="p-3 font-bold">Mapped Source</td><td class="p-3 text-right font-black text-sky-600">0.85</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="px-3 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                    <span class="text-[8px] font-black uppercase text-zinc-400">Join Table Result</span>
                    <i data-lucide="file-output" class="h-3 w-3 text-sky-600"></i>
                </div>
            </div>`;
        sql = `SELECT entity_id, AVG(integrity_score) FROM relational_map GROUP BY 1;`;
      } else {
        // CHARTS LOGIC
        const cid = "landing-chart-" + Date.now();
        // Note: calling global expandChatChart. Ensure this function exists in global scope or Main.
        viz = `<div class="group relative bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-xl cursor-pointer hover:bg-zinc-50 transition-all active:scale-[0.98] animate-in text-left" 
                 onclick="expandChatChart('Relational Performance Map', ['A','B','C','D'], [45, 82, 120, 195])">
                 <div class="flex items-center justify-between mb-8">
                    <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logic Visual</span>
                    <i data-lucide="maximize-2" class="h-4 w-4 text-zinc-300 group-hover:text-sky-600 transition-colors"></i>
                 </div>
                 <div class="h-32 w-full"><canvas id="${cid}" class="chart-small"></canvas></div>
                 <p class="text-center text-[10px] font-black text-zinc-400 uppercase mt-8 group-hover:text-sky-600 transition-colors">Click Visual to Expand</p>
               </div>`;
        sql = `LOAD Architecture(node_data).Visualize(Bar);`;

        setTimeout(() => {
          const el = document.getElementById(cid);
          if (el && typeof Chart !== "undefined") {
            new Chart(el, {
              type: "bar",
              data: {
                labels: ["A", "B", "C", "D"],
                datasets: [
                  {
                    data: [45, 82, 120, 195],
                    backgroundColor: "#0ea5e9",
                    borderRadius: 8,
                  },
                ],
              },
              options: {
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
                maintainAspectRatio: false,
              },
            });
          }
        }, 50);
      }

      const botRes = document.createElement("div");
      botRes.className = "flex gap-3 animate-in text-left";
      botRes.innerHTML = `
            <div class="h-7 w-7 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 shadow-lg"><i data-lucide="bot" class="h-4 w-4 text-sky-400"></i></div>
            <div class="flex-1 space-y-4 min-w-0">
                <div class="ai-bubble p-5 rounded-2xl rounded-tl-none shadow-sm text-xs leading-relaxed text-zinc-600">Correlation verified. Identified <strong>4 logical entities</strong> with relational mapping engine.</div>
                ${viz}
                <div>
                    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="flex items-center gap-1.5 text-[10px] font-black uppercase text-sky-600 hover:text-sky-700 transition-colors"><i data-lucide="code-2" class="h-3 w-3"></i> Show Code</button>
                    <div class="hidden code-block text-left">${sql}</div>
                </div>
            </div>
        `;
      container.appendChild(botRes);
      lucide.createIcons();
    }, 1000);
  },

  // ============================================================
  // MODALS / CHAT
  // ============================================================

  openPreview(tableName) {
    alert("Preview for " + tableName + " (Backend route pending)");
  },

  openRename(id, currentName) {
    // Ensure you have a modal with id="modal-rename" in your HTML or remove this
    const newName = prompt("Rename table:", currentName);
    if (newName) {
      this.renameTable(id, newName);
    }
  },

  async renameTable(id, newName) {
    const res = await API.fetch(`/api/tables/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });
    if (res.success) {
      this.selectDatabase(this.state.activeDbId);
    } else {
      alert(res.error);
    }
  },

  async deleteTable(id) {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    const res = await API.fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (res.success) {
      this.selectDatabase(this.state.activeDbId);
    } else {
      alert(res.error);
    }
  },

  async sendMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    this.appendMsg("user", text);
    input.value = "";
    const loadingId = this.appendMsg("ai", "Thinking...", true);

    const res = await API.fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        query: text,
        project_id: this.state.activeDbId, // Added Project ID to chat
      }),
    });

    document.getElementById(loadingId).remove();
    if (res.type === "error") {
      this.appendMsg("ai", `Error: ${res.data}`);
    } else if (res.type === "table") {
      this.appendMsg(
        "ai",
        "Here is the data:",
        false,
        res.data,
        "table",
        res.query
      );
    } else if (res.type === "chart") {
      this.appendMsg(
        "ai",
        "Generated visualization:",
        false,
        res.data,
        "chart",
        res.query
      );
    } else {
      this.appendMsg("ai", res.data, false, null, "text", res.query);
    }
  },

  appendMsg(
    role,
    text,
    isLoading = false,
    data = null,
    type = "text",
    code = null
  ) {
    const thread = document.getElementById("chat-thread");
    const id = "msg-" + Date.now();
    let contentHtml = "";
    if (role === "user") {
      contentHtml = `<div class="flex justify-end animate-in"><div class="user-bubble px-6 py-4 rounded-3xl rounded-tr-none text-xs md:text-sm font-medium text-white max-w-[80%] shadow-sm text-left">${text}</div></div>`;
    } else {
      let innerContent = isLoading
        ? `<div class="flex gap-1"><div class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75"></div><div class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"></div></div>`
        : text;

      let extraHtml = "";
      // --- 1. NEW TABLE RENDERER ---
      if (type === "table" && Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        // We use JSON.stringify(data) for the onclick, escaping single quotes
        const safeData = JSON.stringify(data).replace(/'/g, "&apos;");

        extraHtml = `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mt-4 overflow-hidden animate-in">
                <div class="flex justify-between items-center mb-3 border-b border-zinc-100 pb-2">
                    <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Result Table</span>
                    <button onclick='downloadCSV(${safeData})' class="text-sky-600 hover:text-sky-700 text-[10px] font-bold uppercase flex items-center transition-colors">
                        <i data-lucide="download" class="h-3 w-3 mr-1"></i> Export CSV
                    </button>
                </div>
                <div class="max-h-64 overflow-auto scrollbar-thin scrollbar-thumb-zinc-300">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-zinc-50 sticky top-0 z-10">
                            <tr>
                                ${headers
                                  .map(
                                    (h) =>
                                      `<th class="p-3 font-black text-zinc-400 uppercase tracking-widest text-[9px] whitespace-nowrap">${h}</th>`
                                  )
                                  .join("")}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-100 bg-white">
                            ${data
                              .map(
                                (row) => `
                                <tr class="hover:bg-zinc-50 transition-colors">
                                    ${headers
                                      .map(
                                        (h) =>
                                          `<td class="p-3 text-[11px] font-medium text-zinc-600 whitespace-nowrap border-b border-zinc-50">${row[h]}</td>`
                                      )
                                      .join("")}
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>`;
      }

      // --- 2. NEW CHART RENDERER ---
      if (type === "chart") {
        extraHtml = `
            <div class="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 mt-4 max-w-md w-full animate-in">
                <div class="relative group">
                    <div class="bg-zinc-50 rounded-xl p-2 border border-zinc-50 cursor-pointer overflow-hidden relative" onclick="openImageModal('${data}')">
                        <img src="${data}" class="w-full h-48 object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300" alt="Data Visualization">
                        
                        <div class="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/5 transition-all flex items-center justify-center">
                            <span class="opacity-0 group-hover:opacity-100 bg-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold text-zinc-600 uppercase tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-all">
                                Click to Expand
                            </span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mt-3 px-2">
                        <span class="text-[10px] font-medium text-zinc-400">Generated by AIStora</span>
                        <div class="flex space-x-2">
                            <button onclick="openImageModal('${data}')" class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-sky-600 transition-colors" title="Expand">
                                <i data-lucide="maximize-2" class="h-4 w-4"></i>
                            </button>
                            <a href="${data}" download="chart.png" class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-emerald-600 transition-colors" title="Download">
                                <i data-lucide="download" class="h-4 w-4"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
      }

      if (code) {
        extraHtml += `<div class="mt-3"><button onclick="this.nextElementSibling.classList.toggle('hidden')" class="flex items-center gap-1.5 text-[10px] font-black uppercase text-sky-600 hover:text-sky-700 transition-colors"><i data-lucide="code-2" class="h-3 w-3"></i> Show Query</button><div class="hidden code-block text-left mt-2 p-3 bg-zinc-900 rounded-xl text-zinc-300 text-[10px] font-mono overflow-x-auto">${code}</div></div>`;
      }

      contentHtml = `<div id="${id}" class="flex gap-4 md:gap-6 animate-in text-left group">
        <div class="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0 shadow-lg text-left mt-1">
            <i data-lucide="bot" class="h-4 w-4 md:h-5 md:w-5 text-sky-400"></i>
        </div>
        <div class="flex-1 min-w-0">
            <div class="ai-bubble inline-block px-6 py-4 rounded-3xl rounded-tl-none text-xs md:text-sm text-zinc-700 leading-relaxed font-medium bg-white border border-zinc-100 shadow-sm">${innerContent}</div>
            ${extraHtml}
        </div>
      </div>`;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = contentHtml;
    thread.appendChild(wrapper.firstElementChild);
    lucide.createIcons();
    thread.scrollTop = thread.scrollHeight;
    return id;
  },
};
window.Main = Main;
document.addEventListener("DOMContentLoaded", () => {
  Main.init();
});
