(function () {
    "use strict";
    const content = document.getElementById("dashboard-content");
    const title = document.getElementById("page-title");
    const toast = document.getElementById("toast");
    let employee = null;
    let projects = [];
    let activeProject = null;
    const table = "indesign_projects";
    const typeLabels = { moodboard: "Moodboard", board: "Regular board", brainstorm: "Brainstorm" };

    function notify(message) {
        toast.textContent = message;
        toast.classList.add("visible");
        window.setTimeout(() => toast.classList.remove("visible"), 2600);
    }
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    }
    function displayName() {
        return employee?.profile?.display_name || employee?.profile?.username ||
            employee?.user?.email?.split("@")[0] || "Your account";
    }
    function setIdentity() {
        const name = displayName(), avatarUrl = employee?.profile?.avatar_url;
        document.getElementById("sidebar-name").textContent = name;
        ["sidebar-avatar", "header-avatar"].forEach(id => {
            const node = document.getElementById(id);
            if (avatarUrl) {
                node.textContent = "";
                node.style.backgroundImage = "url('" + avatarUrl.replace(/'/g, "%27") + "')";
                node.style.backgroundSize = "cover"; node.style.backgroundPosition = "center";
            } else node.textContent = name.charAt(0).toUpperCase();
        });
    }
    async function loadProjects() {
        const { data, error } = await window.supabaseClient.from(table)
            .select("id, owner_id, name, type, description, content, created_at, updated_at")
            .order("updated_at", { ascending: false });
        if (error) throw error;
        projects = data || [];
        return projects;
    }
    function projectCards(items) {
        if (!items.length) return '<div class="empty-state"><span>＋</span><strong>No projects yet.</strong><p>Create your first project to get started.</p></div>';
        return '<div class="indesign-project-grid">' + items.map(p => `
            <article class="indesign-project-card">
              <button class="project-open" data-open-project="${escapeHTML(p.id)}">
                <span class="project-kind">${escapeHTML(typeLabels[p.type] || "Project")}</span>
                <strong>${escapeHTML(p.name)}</strong>
                <small>Updated ${new Date(p.updated_at || p.created_at).toLocaleDateString()}</small>
              </button>
              <div class="project-actions">
                <button data-rename-project="${escapeHTML(p.id)}" aria-label="Rename ${escapeHTML(p.name)}">Rename</button>
                <button data-export-project="${escapeHTML(p.id)}">Export .in</button>
                <button data-delete-project="${escapeHTML(p.id)}">Delete</button>
              </div>
            </article>`).join("") + "</div>";
    }
    function renderHome() {
        title.textContent = "Home";
        const recent = projects.slice(0, 3);
        content.innerHTML = `
          <div class="welcome-row"><div><p class="eyebrow">YOUR CREATIVE WORKSPACE</p><h2>Make room<br>for new ideas.</h2><p class="muted">Start something new or continue where you left off.</p></div><button class="button button-dark" id="create-project-button">＋ Create project</button></div>
          <div class="section-heading"><h3>Start creating</h3><span>CHOOSE A PROJECT TYPE</span></div>
          <div class="project-types">
            <button class="type-card" data-create="moodboard"><span class="type-number">01</span><span class="type-symbol">▦</span><strong>Moodboard</strong><small>Collect references and connect ideas.</small><span class="type-arrow">↗</span></button>
            <button class="type-card" data-create="board"><span class="type-number">02</span><span class="type-symbol">⌗</span><strong>Regular board</strong><small>Design freely on a flexible canvas.</small><span class="type-arrow">↗</span></button>
            <button class="type-card" data-create="brainstorm"><span class="type-number">03</span><span class="type-symbol">✳</span><strong>Brainstorm</strong><small>Develop music or comeback concepts.</small><span class="type-arrow">↗</span></button>
          </div>
          <div class="section-heading recent-heading"><h3>Recent projects</h3><button class="text-button" data-view="projects">View all ↗</button></div>
          ${projectCards(recent)}`;
    }
    function renderProjects() {
        title.textContent = "Projects";
        content.innerHTML = `
          <div class="welcome-row"><div><p class="eyebrow">YOUR WORK</p><h2>All projects.</h2><p class="muted">Your creative projects, saved to your employee account.</p></div>
          <div class="project-toolbar"><button class="button button-dark" id="create-project-button">＋ Create project</button><button class="button button-outline" id="import-project-button">Import .in</button><input id="import-project-file" type="file" accept=".in,.json,application/json" hidden></div></div>
          <div class="section-heading"><h3>All projects</h3><span>${projects.length} TOTAL</span></div>
          ${projectCards(projects)}`;
    }
    function renderMessages() {
        title.textContent = "Messages";
        content.innerHTML = '<p class="eyebrow">NEMAWASHI CONNECTION</p><h2 style="font-size:48px;letter-spacing:-3px">Messages.</h2><p class="muted">Your indesign messages will connect to Nemawashi and remain available there.</p><div class="empty-state" style="margin-top:32px"><span>↗</span><strong>Messaging integration is the next stage.</strong><p>This area is reserved for your Nemawashi conversations.</p></div>';
    }
    function renderAccount() {
        title.textContent = "Account";
        const theme = document.body.classList.contains("dark-theme") ? "dark" : "light";
        content.innerHTML = `<p class="eyebrow">PERSONAL SETTINGS</p><h2 style="font-size:48px;letter-spacing:-3px">Your account.</h2><div style="max-width:560px;margin-top:35px;border-top:1px solid var(--line);padding-top:24px"><p><strong>${escapeHTML(displayName())}</strong></p><p class="muted">${escapeHTML(employee.user.email || "")}</p><div class="section-heading"><h3>Appearance</h3></div><label style="font-size:13px;font-weight:700">App theme</label><div style="display:flex;gap:10px;margin-top:12px"><button class="button ${theme === "light" ? "button-dark" : "button-outline"}" data-theme="light">Light</button><button class="button ${theme === "dark" ? "button-dark" : "button-outline"}" data-theme="dark">Dark</button></div><div class="section-heading"><h3>Session</h3></div><button class="button button-dark" id="sign-out-button">Sign out</button></div>`;
    }
    function boardElements() {
        return Array.isArray(activeProject?.content?.elements) ? activeProject.content.elements : [];
    }
    function boardElementHTML(item, index) {
        const style = "left:" + Number(item.x || 0) + "px;top:" + Number(item.y || 0) + "px;color:" + escapeHTML(item.color || "#111111") + ";";
        const selected = selectedBoardElement === index ? " selected" : "";
        if (item.kind === "shape") return '<div class="board-object board-shape' + selected + '" data-board-element="' + index + '" style="' + style + 'background:' + escapeHTML(item.color || "#748fe8") + '"></div>';
        if (item.kind === "image") return '<div class="board-object board-image' + selected + '" data-board-element="' + index + '" style="' + style + '"><img src="' + escapeHTML(item.src || "") + '" alt="' + escapeHTML(item.label || "Board image") + '"><span>' + escapeHTML(item.label || "Image") + '</span></div>';
        return '<div class="board-object board-text' + selected + '" data-board-element="' + index + '" style="' + style + '">' + escapeHTML(item.text || "Double-click to edit") + '</div>';
    }
    let selectedBoardElement = null;
    let boardDrag = null;
    function redrawBoard() {
        const stage = document.getElementById("board-stage");
        const layers = document.getElementById("board-layers");
        if (!stage || !layers) return;
        stage.innerHTML = boardElements().map(boardElementHTML).join("");
        layers.innerHTML = boardElements().map((item, i) =>
            '<button class="board-layer' + (selectedBoardElement === i ? " active" : "") + '" data-select-board-element="' + i + '"><span>' +
            escapeHTML(item.kind === "shape" ? "▰ Shape" : item.kind === "image" ? "▧ " + (item.label || "Image") : "T " + (item.text || "Text").slice(0, 24)) +
            '</span><small>' + (i + 1) + '</small></button>'
        ).join("") || '<p class="muted board-no-layers">Your layers will appear here.</p>';
        const status = document.getElementById("board-status");
        if (status) status.textContent = boardElements().length + " OBJECTS";
    }
    function bindBoardInteractions() {
        const stage = document.getElementById("board-stage");
        if (!stage) return;
        stage.addEventListener("pointerdown", event => {
            const object = event.target.closest("[data-board-element]");
            if (!object) { selectedBoardElement = null; redrawBoard(); return; }
            const index = Number(object.dataset.boardElement);
            selectedBoardElement = index;
            const item = boardElements()[index];
            const rect = stage.getBoundingClientRect();
            boardDrag = { index, pointerX: event.clientX, pointerY: event.clientY, x: Number(item.x || 0), y: Number(item.y || 0) };
            object.setPointerCapture?.(event.pointerId);
            redrawBoard();
            event.preventDefault();
        });
        stage.addEventListener("pointermove", event => {
            if (!boardDrag) return;
            const item = boardElements()[boardDrag.index];
            if (!item) return;
            item.x = Math.max(0, Math.round(boardDrag.x + event.clientX - boardDrag.pointerX));
            item.y = Math.max(0, Math.round(boardDrag.y + event.clientY - boardDrag.pointerY));
            const object = stage.querySelector('[data-board-element="' + boardDrag.index + '"]');
            if (object) { object.style.left = item.x + "px"; object.style.top = item.y + "px"; }
        });
        const stopDrag = () => { if (boardDrag) { boardDrag = null; redrawBoard(); } };
        stage.addEventListener("pointerup", stopDrag);
        stage.addEventListener("pointercancel", stopDrag);
        stage.addEventListener("dblclick", event => {
            const object = event.target.closest(".board-text");
            if (!object) return;
            const item = boardElements()[Number(object.dataset.boardElement)];
            const value = window.prompt("Edit text:", item.text || "");
            if (value !== null) { item.text = value; redrawBoard(); }
        });
    }
    function renderProject(project) {
        activeProject = project;
        title.textContent = project.name;
        if (project.type !== "board") {
            content.innerHTML = '<button class="text-button" id="back-to-projects">← All projects</button>' +
              '<div class="project-detail-head"><div><p class="eyebrow">' + escapeHTML(typeLabels[project.type] || "PROJECT") + '</p><h2>' + escapeHTML(project.name) + '</h2><p class="muted">' + escapeHTML(project.description || "Your project workspace is ready.") + '</p></div><div class="project-toolbar"><button class="button button-outline" data-rename-project="' + escapeHTML(project.id) + '">Rename</button><button class="button button-dark" data-export-project="' + escapeHTML(project.id) + '">Export .in</button></div></div>' +
              '<div class="project-workspace-placeholder"><span>' + (project.type === "moodboard" ? "▦" : "✳") + '</span><strong>' + escapeHTML(typeLabels[project.type] || "Project") + ' workspace</strong><p>This project type will receive its dedicated editor in a later stage.</p></div>';
            return;
        }
        if (!project.content || !Array.isArray(project.content.elements)) project.content = { elements: [] };
        content.innerHTML = '<button class="text-button" id="back-to-projects">← All projects</button>' +
          '<div class="board-topline"><div><p class="eyebrow">REGULAR BOARD</p><h2>' + escapeHTML(project.name) + '</h2></div><div class="project-toolbar"><button class="button button-outline" data-rename-project="' + escapeHTML(project.id) + '">Rename</button><button class="button button-dark" id="save-board-button">Save board</button><button class="button button-outline" data-export-project="' + escapeHTML(project.id) + '">Export .in</button></div></div>' +
          '<div class="board-toolbar"><button data-add-board="text">＋ Text</button><button data-add-board="shape">＋ Shape</button><button data-add-board="image">＋ Image URL</button><span id="board-status">0 OBJECTS</span></div>' +
          '<div class="board-editor"><aside class="board-inspector"><div class="board-panel-title">LAYERS</div><div id="board-layers"></div><div class="board-hint">Drag objects to move them. Double-click text to edit it.</div></aside><div class="board-canvas-wrap"><div class="board-stage" id="board-stage"></div></div></div>';
        selectedBoardElement = null;
        redrawBoard();
        bindBoardInteractions();
    }
    async function saveBoard() {
        if (!activeProject || activeProject.type !== "board") return;
        const payload = { elements: boardElements().map(item => ({
            kind: item.kind, x: Number(item.x || 0), y: Number(item.y || 0),
            color: item.color || "#111111", text: item.text || "",
            src: item.src || "", label: item.label || ""
        })) };
        const { data, error } = await window.supabaseClient.from(table)
            .update({ content: payload }).eq("id", activeProject.id).select().single();
        if (error) { console.error(error); notify("Could not save board. Run the Step 3 SQL migration first."); return; }
        activeProject = data;
        projects = projects.map(p => p.id === data.id ? data : p);
        notify("Board saved.");
    }
    function addBoardElement(kind) {
        if (!activeProject || activeProject.type !== "board") return;
        const item = { kind, x: 70 + boardElements().length * 18, y: 65 + boardElements().length * 18, color: kind === "shape" ? "#748fe8" : "#111111" };
        if (kind === "text") {
            const value = window.prompt("Text for your board:", "Your idea");
            if (value === null) return;
            item.text = value;
        } else if (kind === "image") {
            const value = window.prompt("Paste an image URL (https://):");
            if (!value) return;
            try { const url = new URL(value); if (url.protocol !== "https:") throw new Error("https required"); item.src = url.href; }
            catch (_) { notify("Please enter a valid HTTPS image URL."); return; }
            item.label = "Image";
        }
        activeProject.content.elements.push(item);
        selectedBoardElement = activeProject.content.elements.length - 1;
        redrawBoard();
    }
    async function createProject(type) {
        const name = window.prompt("Name your " + (typeLabels[type] || "project").toLowerCase() + ":");
        if (!name || !name.trim()) return;
        const { data, error } = await window.supabaseClient.from(table).insert({
            owner_id: employee.user.id, name: name.trim(), type, description: "", content: { elements: [] }
        }).select().single();
        if (error) { console.error(error); notify("Could not create project. Check the indesign database setup."); return; }
        projects.unshift(data); notify("Project created."); renderProject(data);
    }
    async function renameProject(id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        const name = window.prompt("New project name:", project.name);
        if (!name || !name.trim() || name.trim() === project.name) return;
        const { data, error } = await window.supabaseClient.from(table).update({name:name.trim()}).eq("id",id).select().single();
        if (error) { console.error(error); notify("Could not rename project."); return; }
        projects = projects.map(p => p.id === id ? data : p);
        notify("Project renamed."); renderProject(data);
    }
    async function deleteProject(id) {
        const project = projects.find(p => p.id === id);
        if (!project || !window.confirm('Delete "' + project.name + '"? This cannot be undone.')) return;
        const { error } = await window.supabaseClient.from(table).delete().eq("id",id);
        if (error) { console.error(error); notify("Could not delete project."); return; }
        projects = projects.filter(p => p.id !== id); activeProject = null;
        notify("Project deleted."); showView("projects");
    }
    function exportProject(id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        const file = new Blob([JSON.stringify({format:"indesign",version:1,project},null,2)],{type:"application/json"});
        const url=URL.createObjectURL(file), a=document.createElement("a");
        a.href=url; a.download=project.name.replace(/[^a-z0-9-_ ]/gi,"").trim().replace(/\s+/g,"-")+".in";
        a.click(); URL.revokeObjectURL(url); notify("Project exported.");
    }
    async function importProject(file) {
        try {
            const parsed=JSON.parse(await file.text());
            const project=parsed.project;
            if(parsed.format!=="indesign" || !project || !typeLabels[project.type] || typeof project.name!=="string") throw new Error("This is not a valid indesign project file.");
            const {data,error}=await window.supabaseClient.from(table).insert({
                owner_id:employee.user.id,name:project.name,type:project.type,description:project.description||"",content:(project.content && Array.isArray(project.content.elements)) ? project.content : {elements:[]}
            }).select().single();
            if(error) throw error;
            projects.unshift(data); notify("Project imported."); renderProject(data);
        } catch(error) { console.error(error); notify(error.message||"Could not import this .in file."); }
    }
    async function showView(view) {
        document.querySelectorAll(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
        activeProject=null;
        if(view==="projects") { try { await loadProjects(); renderProjects(); } catch(e) { console.error(e); notify("Could not load projects. Check the database setup."); } }
        else if(view==="messages") renderMessages();
        else if(view==="account") renderAccount();
        else { try { await loadProjects(); } catch(e) { console.error(e); } renderHome(); }
    }

    document.addEventListener("click",async event=>{
        const nav=event.target.closest("[data-view]");
        if(nav){showView(nav.dataset.view);return;}
        const create=event.target.closest("[data-create]");
        if(create){createProject(create.dataset.create);return;}
        if(event.target.closest("#create-project-button")) {
            const type=window.prompt("Choose a project type: moodboard, board, or brainstorm","board");
            if(type && typeLabels[type.trim().toLowerCase()]) createProject(type.trim().toLowerCase());
            else if(type) notify("Please enter moodboard, board, or brainstorm.");
            return;
        }
        const open=event.target.closest("[data-open-project]");
        if(open){const project=projects.find(p=>p.id===open.dataset.openProject);if(project)renderProject(project);return;}
        const rename=event.target.closest("[data-rename-project]");
        if(rename){renameProject(rename.dataset.renameProject);return;}
        const del=event.target.closest("[data-delete-project]");
        if(del){deleteProject(del.dataset.deleteProject);return;}
        const exp=event.target.closest("[data-export-project]");
        if(exp){exportProject(exp.dataset.exportProject);return;}
        if(event.target.closest("#back-to-projects")){showView("projects");return;}
        const addBoard = event.target.closest("[data-add-board]");
        if(addBoard){addBoardElement(addBoard.dataset.addBoard);return;}
        const layer = event.target.closest("[data-select-board-element]");
        if(layer){selectedBoardElement=Number(layer.dataset.selectBoardElement);redrawBoard();return;}
        if(event.target.closest("#save-board-button")){saveBoard();return;}
        if(event.target.closest("#import-project-button")){document.getElementById("import-project-file").click();return;}
        const theme=event.target.closest("[data-theme]");
        if(theme){const dark=theme.dataset.theme==="dark";document.body.classList.toggle("dark-theme",dark);localStorage.setItem("indesign-theme",dark?"dark":"light");renderAccount();return;}
        if(event.target.closest("#sign-out-button")){try{await window.indesignAuth.signOut();}catch(e){console.error(e);notify("Could not sign out.");}}
    });
    document.addEventListener("change",event=>{
        if(event.target.id==="import-project-file" && event.target.files?.[0]) importProject(event.target.files[0]);
    });
    document.addEventListener("DOMContentLoaded",async()=>{
        if(localStorage.getItem("indesign-theme")==="dark") document.body.classList.add("dark-theme");
        try {
            employee=await window.indesignAuth.getEmployeeSession();
            if(!employee)return;
            setIdentity(); await loadProjects(); renderHome();
        } catch(error){console.error("Could not load indesign dashboard:",error);notify("Could not load your account or projects.");}
    });
})();