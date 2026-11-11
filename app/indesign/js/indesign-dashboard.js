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
    function showDialog(options = {}) {
        return new Promise(resolve => {
            const kind = options.kind || "prompt";
            const isConfirm = kind === "confirm";
            const isSelect = kind === "select";
            const isTextarea = kind === "textarea";
            const value = options.value ?? "";
            const overlay = document.createElement("div");
            overlay.className = "indesign-dialog-overlay";
            overlay.innerHTML = '<section class="indesign-dialog" role="dialog" aria-modal="true" aria-labelledby="indesign-dialog-title">' +
              '<div class="indesign-dialog-top"><span class="indesign-dialog-mark">indesign<span>.</span></span><button type="button" class="indesign-dialog-close" data-dialog-cancel aria-label="Close">×</button></div>' +
              '<h2 id="indesign-dialog-title">' + escapeHTML(options.title || "A quick question") + '</h2>' +
              (options.message ? '<p class="indesign-dialog-message">' + escapeHTML(options.message) + '</p>' : '') +
              (isConfirm ? '' : (isSelect ? '<label class="indesign-dialog-label">' + escapeHTML(options.label || "Choose an option") + '<select class="indesign-dialog-input" id="indesign-dialog-value">' + (options.options || []).map(o => '<option value="' + escapeHTML(o.value) + '"' + (o.value === value ? " selected" : "") + '>' + escapeHTML(o.label) + '</option>').join("") + '</select></label>' : '<label class="indesign-dialog-label">' + escapeHTML(options.label || "Your answer") + (isTextarea ? '<textarea class="indesign-dialog-input" id="indesign-dialog-value" rows="4" placeholder="' + escapeHTML(options.placeholder || "") + '">' + escapeHTML(value) + '</textarea>' : '<input class="indesign-dialog-input" id="indesign-dialog-value" type="' + escapeHTML(options.inputType || "text") + '" value="' + escapeHTML(value) + '" placeholder="' + escapeHTML(options.placeholder || "") + '" autocomplete="off">') + '</label>')) +
              '<div class="indesign-dialog-actions"><button type="button" class="indesign-dialog-cancel" data-dialog-cancel>' + escapeHTML(options.cancelLabel || "Cancel") + '</button><button type="button" class="indesign-dialog-submit">' + escapeHTML(options.confirmLabel || (isConfirm ? "Continue" : "Save")) + '</button></div></section>';
            const finish = result => { overlay.classList.remove("visible"); window.setTimeout(() => overlay.remove(), 180); document.removeEventListener("keydown", onKey); resolve(result); };
            const submit = () => { const field = overlay.querySelector("#indesign-dialog-value"); finish(isConfirm ? true : field ? field.value : ""); };
            const onKey = event => { if (event.key === "Escape") finish(isConfirm ? false : null); if (event.key === "Enter" && !isTextarea && !isConfirm) { event.preventDefault(); submit(); } };
            overlay.addEventListener("click", event => { if (event.target === overlay || event.target.closest("[data-dialog-cancel]")) finish(isConfirm ? false : null); if (event.target.closest(".indesign-dialog-submit")) submit(); });
            document.addEventListener("keydown", onKey);
            document.body.appendChild(overlay);
            requestAnimationFrame(() => { overlay.classList.add("visible"); overlay.querySelector("#indesign-dialog-value")?.focus(); });
        });
    }
    const ask = (title, value = "", placeholder = "") => showDialog({ title, value, placeholder, label: " " });
    const confirmAction = (title, message, confirmLabel = "Continue") => showDialog({ kind: "confirm", title, message, confirmLabel });

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
            stage.querySelectorAll(".board-object").forEach(node => node.classList.toggle("selected", node === object));
            document.querySelectorAll(".board-layer").forEach((node, layerIndex) => node.classList.toggle("active", layerIndex === index));
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
        stage.addEventListener("dblclick", async event => {
            const object = event.target.closest(".board-text");
            if (!object) return;
            const item = boardElements()[Number(object.dataset.boardElement)];
            const value = await ask("Edit text", item.text || "");
            if (value !== null) { item.text = value; redrawBoard(); }
        });
    }
    let selectedMoodRefs = [];
    let selectedMoodObject = null;
    let moodViewport = { x: 0, y: 0, zoom: 1 };
    let moodPointer = null;
    function moodboardData() {
        if (!activeProject.content || typeof activeProject.content !== "object") activeProject.content = {};
        const data = activeProject.content;
        if (!Array.isArray(data.references)) data.references = [];
        if (!Array.isArray(data.connections)) data.connections = [];
        if (!Array.isArray(data.palette)) data.palette = [];
        if (!Array.isArray(data.notes)) data.notes = [];
        if (typeof data.purpose !== "string") data.purpose = "";
        data.references.forEach((item, i) => {
            if (!Number.isFinite(Number(item.x))) item.x = 90 + (i % 3) * 290;
            if (!Number.isFinite(Number(item.y))) item.y = 90 + Math.floor(i / 3) * 280;
        });
        data.notes.forEach((item, i) => {
            if (!Number.isFinite(Number(item.x))) item.x = 120 + i * 36;
            if (!Number.isFinite(Number(item.y))) item.y = 420 + i * 36;
        });
        data.palette.forEach((item, i) => {
            if (typeof item === "string") data.palette[i] = { color: item, x: 110 + i * 110, y: 760 };
            else {
                if (!Number.isFinite(Number(item.x))) item.x = 110 + i * 110;
                if (!Number.isFinite(Number(item.y))) item.y = 760;
            }
        });
        return data;
    }
    function moodObjectList() {
        const d = moodboardData();
        return [
            ...d.references.map((item, index) => ({ type: "reference", index, item })),
            ...d.notes.map((item, index) => ({ type: "note", index, item })),
            ...d.palette.map((item, index) => ({ type: "color", index, item }))
        ];
    }
    function moodObjectHTML(entry) {
        const { type, index, item } = entry;
        const selected = selectedMoodObject && selectedMoodObject.type === type && selectedMoodObject.index === index;
        const common = 'class="mood-canvas-object mood-object-' + type + (selected ? ' selected' : '') + '" data-mood-object="' + type + ':' + index + '" style="left:' + Number(item.x || 0) + 'px;top:' + Number(item.y || 0) + 'px"';
        if (type === "reference") return '<article ' + common + '><img src="' + escapeHTML(item.src) + '" alt="' + escapeHTML(item.title || "Moodboard reference") + '" draggable="false"><div class="mood-object-copy"><strong>' + escapeHTML(item.title || "Untitled reference") + '</strong><p>' + escapeHTML(item.notes || "") + '</p></div><button class="mood-object-edit" data-edit-mood-ref="' + index + '" title="Edit reference">···</button></article>';
        if (type === "note") return '<article ' + common + '><div class="mood-note-grip">NOTE</div><div class="mood-note-text">' + escapeHTML(item.text || "New note") + '</div><button class="mood-object-edit" data-edit-mood-note="' + index + '" title="Edit note">···</button></article>';
        return '<article ' + common + '><div class="mood-color-swatch" style="background:' + escapeHTML(item.color || "#748fe8") + '"></div><span>' + escapeHTML(item.color || "#748fe8") + '</span><button class="mood-object-edit" data-remove-mood-color="' + index + '" title="Remove color">×</button></article>';
    }
    function renderMoodboard() {
        const data = moodboardData();
        document.body.classList.remove("indesign-brainstorm-fullscreen");
        document.body.classList.add("moodboard-fullscreen");
        title.textContent = activeProject.name;
        const objects = moodObjectList();
        const connectionLines = data.connections.map(pair => {
            const a = data.references[pair[0]], b = data.references[pair[1]];
            if (!a || !b) return "";
            return '<line x1="' + (Number(a.x || 0) + 115) + '" y1="' + (Number(a.y || 0) + 100) + '" x2="' + (Number(b.x || 0) + 115) + '" y2="' + (Number(b.y || 0) + 100) + '" />';
        }).join("");
        const layerHTML = objects.map(o => '<button class="mood-layer' + (selectedMoodObject && selectedMoodObject.type === o.type && selectedMoodObject.index === o.index ? ' active' : '') + '" data-select-mood-object="' + o.type + ':' + o.index + '"><span>' + escapeHTML(o.type === "reference" ? (o.item.title || "Image") : o.type === "note" ? (o.item.text || "Note").slice(0, 25) : o.item.color) + '</span><small>' + (o.type === "reference" ? "Image" : o.type === "note" ? "Note" : "Color") + '</small></button>').join("");
        const palette = data.palette.map(c => '<button class="mood-sidebar-color" data-remove-mood-color="' + data.palette.indexOf(c) + '"><i style="background:' + escapeHTML(c.color || c) + '"></i><span>' + escapeHTML(c.color || c) + '</span></button>').join("");
        content.innerHTML = '<div class="mood-workspace">' +
          '<header class="mood-topbar"><button class="mood-back" id="back-to-projects" title="Back to projects">←</button><div class="mood-doc-title"><strong>' + escapeHTML(activeProject.name) + '</strong><small>MOODBOARD</small></div><button class="mood-purpose-button" id="edit-mood-purpose">' + escapeHTML(data.purpose || "Add a purpose…") + '</button><span class="mood-save-state" id="mood-save-state">Unsaved changes</span><button class="mood-top-action" id="save-moodboard-button">Save</button><div class="mood-export-wrap"><button class="mood-top-action" id="mood-export-toggle">Export ↓</button><div class="mood-export-menu" id="mood-export-menu"><button data-export-moodboard="png">Download PNG</button><button data-export-moodboard="json">Download JSON</button><button data-export-project="' + escapeHTML(activeProject.id) + '">Download .in</button></div></div></header>' +
          '<div class="mood-toolstrip"><button class="active" data-mood-tool="select" title="Select">↖</button><button data-mood-tool="pan" title="Pan">✋</button><i></i><button data-add-mood-ref title="Add image">▧</button><button data-add-mood-note title="Add note">T</button><button data-add-mood-color title="Add color">◉</button><button data-connect-mood-refs title="Connect two selected images" ' + (selectedMoodRefs.length === 2 ? '' : 'disabled') + '>⌁</button><span class="mood-tool-hint">Drag objects to move · Select two images to connect · Drag empty space to pan · Scroll to zoom</span></div>' +
          '<div class="mood-workarea"><aside class="mood-left-panel"><div class="mood-panel-heading">LAYERS <span>' + objects.length + '</span></div><div class="mood-layer-list">' + (layerHTML || '<p class="mood-panel-empty">Your objects will appear here.</p>') + '</div><div class="mood-panel-heading mood-panel-subhead">COLOR PALETTE <button data-add-mood-color>＋</button></div><div class="mood-sidebar-palette">' + (palette || '<p class="mood-panel-empty">No colors yet.</p>') + '</div><div class="mood-panel-heading mood-panel-subhead">CONNECTIONS <span>' + data.connections.length + '</span></div><div class="mood-connection-list">' + data.connections.map((p,i) => '<div><span>' + escapeHTML(data.references[p[0]]?.title || "Image " + (p[0]+1)) + ' ↔ ' + escapeHTML(data.references[p[1]]?.title || "Image " + (p[1]+1)) + '</span><button data-delete-mood-connection="' + i + '">×</button></div>').join("") + '</div></aside>' +
          '<main class="mood-canvas-viewport" id="mood-canvas-viewport"><div class="mood-canvas-world" id="mood-canvas-world" style="transform:translate(' + moodViewport.x + 'px,' + moodViewport.y + 'px) scale(' + moodViewport.zoom + ')"><svg class="mood-connection-svg" id="mood-connection-svg">' + connectionLines + '</svg>' + objects.map(moodObjectHTML).join("") + '</div></main>' +
          '<aside class="mood-right-panel"><div class="mood-panel-heading">MOODBOARD</div><label class="mood-field-label">Name</label><div class="mood-field-value">' + escapeHTML(activeProject.name) + '</div><label class="mood-field-label">Purpose</label><div class="mood-field-value mood-purpose-value">' + escapeHTML(data.purpose || "No purpose added yet.") + '</div><button class="mood-panel-button" id="edit-mood-purpose">Edit purpose</button><div class="mood-panel-divider"></div><div class="mood-panel-heading">SELECTED OBJECT</div><div id="mood-selection-details" class="mood-selection-details">' + (selectedMoodObject ? escapeHTML(selectedMoodObject.type === "reference" ? (data.references[selectedMoodObject.index]?.title || "Image") : selectedMoodObject.type === "note" ? (data.notes[selectedMoodObject.index]?.text || "Note") : (data.palette[selectedMoodObject.index]?.color || data.palette[selectedMoodObject.index] || "Color")) : 'Select an object on the canvas to see its details.') + '</div><div class="mood-panel-divider"></div><div class="mood-panel-heading">CANVAS</div><div class="mood-zoom-controls"><button id="mood-zoom-out">−</button><span id="mood-zoom-label">' + Math.round(moodViewport.zoom * 100) + '%</span><button id="mood-zoom-in">＋</button><button id="mood-zoom-fit">Fit</button></div></aside></div></div>';
        bindMoodCanvas();
    }
    function updateMoodTransform() {
        const world = document.getElementById("mood-canvas-world");
        const label = document.getElementById("mood-zoom-label");
        if (world) world.style.transform = 'translate(' + moodViewport.x + 'px,' + moodViewport.y + 'px) scale(' + moodViewport.zoom + ')';
        if (label) label.textContent = Math.round(moodViewport.zoom * 100) + "%";
    }
    function bindMoodCanvas() {
        const viewport = document.getElementById("mood-canvas-viewport");
        const world = document.getElementById("mood-canvas-world");
        if (!viewport || !world) return;
        viewport.addEventListener("wheel", event => {
            event.preventDefault();
            const rect = viewport.getBoundingClientRect();
            const px = event.clientX - rect.left, py = event.clientY - rect.top;
            const old = moodViewport.zoom;
            const next = Math.max(.2, Math.min(2.5, old * (event.deltaY < 0 ? 1.1 : .9)));
            moodViewport.x = px - (px - moodViewport.x) * (next / old);
            moodViewport.y = py - (py - moodViewport.y) * (next / old);
            moodViewport.zoom = next; updateMoodTransform();
        }, { passive: false });
        viewport.addEventListener("pointerdown", event => {
            const object = event.target.closest("[data-mood-object]");
            if (object && !event.target.closest("button") && !viewport.classList.contains("pan-tool")) {
                const [type, rawIndex] = object.dataset.moodObject.split(":");
                const index = Number(rawIndex);
                selectedMoodObject = { type, index };
                if (type === "reference" && !selectedMoodRefs.includes(index)) selectedMoodRefs = selectedMoodRefs.concat(index).slice(-2);
                const item = type === "reference" ? moodboardData().references[index] : type === "note" ? moodboardData().notes[index] : moodboardData().palette[index];
                moodPointer = { mode: "object", type, index, startX: event.clientX, startY: event.clientY, x: Number(item.x || 0), y: Number(item.y || 0), pointerId: event.pointerId };
                object.setPointerCapture(event.pointerId);
                document.querySelectorAll(".mood-canvas-object").forEach(n => n.classList.toggle("selected", n === object));
                const connect = document.querySelector("[data-connect-mood-refs]");
                if (connect) connect.disabled = selectedMoodRefs.length !== 2;
                const details = document.getElementById("mood-selection-details");
                if (details) details.textContent = type === "reference" ? (item.title || "Image reference") : type === "note" ? (item.text || "Note") : (item.color || item);
                event.preventDefault(); return;
            }
            if (!object || viewport.classList.contains("pan-tool")) {
                moodPointer = { mode: "pan", startX: event.clientX, startY: event.clientY, x: moodViewport.x, y: moodViewport.y, pointerId: event.pointerId };
                viewport.setPointerCapture(event.pointerId);
                viewport.classList.add("is-panning");
            }
        });
        viewport.addEventListener("pointermove", event => {
            if (!moodPointer) return;
            const dx = (event.clientX - moodPointer.startX) / (moodPointer.mode === "object" ? moodViewport.zoom : 1);
            const dy = (event.clientY - moodPointer.startY) / (moodPointer.mode === "object" ? moodViewport.zoom : 1);
            if (moodPointer.mode === "pan") {
                moodViewport.x = moodPointer.x + dx; moodViewport.y = moodPointer.y + dy; updateMoodTransform();
            } else {
                const d = moodboardData();
                const item = moodPointer.type === "reference" ? d.references[moodPointer.index] : moodPointer.type === "note" ? d.notes[moodPointer.index] : d.palette[moodPointer.index];
                if (!item) return;
                item.x = Math.round(moodPointer.x + dx); item.y = Math.round(moodPointer.y + dy);
                const node = world.querySelector('[data-mood-object="' + moodPointer.type + ':' + moodPointer.index + '"]');
                if (node) { node.style.left = item.x + "px"; node.style.top = item.y + "px"; }
                const saveState = document.getElementById("mood-save-state");
                if (saveState) saveState.textContent = "Unsaved changes";
                updateMoodConnections();
            }
        });
        const stop = () => { moodPointer = null; viewport.classList.remove("is-panning"); };
        viewport.addEventListener("pointerup", stop); viewport.addEventListener("pointercancel", stop);
    }
    function updateMoodConnections() {
        const svg = document.getElementById("mood-connection-svg");
        if (!svg) return;
        svg.innerHTML = moodboardData().connections.map(pair => {
            const a = moodboardData().references[pair[0]], b = moodboardData().references[pair[1]];
            return a && b ? '<line x1="' + (Number(a.x || 0)+115) + '" y1="' + (Number(a.y || 0)+100) + '" x2="' + (Number(b.x || 0)+115) + '" y2="' + (Number(b.y || 0)+100) + '" />' : "";
        }).join("");
    }
    async function addMoodReference() {
        const value = await ask("Add image reference", "", "Paste an HTTPS image URL");
        if (!value) return;
        let src;
        try { const url = new URL(value); if (url.protocol !== "https:") throw new Error("https required"); src = url.href; }
        catch (_) { notify("Please enter a valid HTTPS image URL."); return; }
        const titleValue = await ask("Name this reference", "New reference");
        if (titleValue === null) return;
        const notes = await showDialog({ kind: "textarea", title: "Add a note", value: "", placeholder: "What should you remember about this reference?" });
        if (notes === null) return;
        moodboardData().references.push({ src, title: titleValue.trim() || "Untitled reference", notes: notes || "", x: 100 + moodboardData().references.length * 34, y: 100 + moodboardData().references.length * 34 });
        renderMoodboard();
    }
    async function editMoodReference(index) {
        const item = moodboardData().references[index];
        if (!item) return;
        const titleValue = await ask("Edit reference name", item.title || "");
        if (titleValue === null) return;
        const notes = await showDialog({ kind: "textarea", title: "Edit reference notes", value: item.notes || "" });
        if (notes === null) return;
        item.title = titleValue.trim();
        item.notes = notes;
        renderMoodboard();
    }
    async function addMoodColor() {
        const value = await ask("Add a palette color", "#748fe8", "Hex color, e.g. #748fe8");
        if (!value) return;
        if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())) { notify("Enter a valid 3- or 6-digit hex color."); return; }
        moodboardData().palette.push({ color: value.trim().toLowerCase(), x: 120 + moodboardData().palette.length * 35, y: 760 });
        renderMoodboard();
    }
    async function addMoodNote() {
        const value = await showDialog({ kind: "textarea", title: "New moodboard note", value: "New idea", placeholder: "Write your idea…" });
        if (value === null) return;
        const notes = moodboardData().notes;
        notes.push({ text: value, x: 140 + notes.length * 35, y: 430 + notes.length * 35 });
        selectedMoodObject = { type: "note", index: notes.length - 1 };
        renderMoodboard();
    }
    async function editMoodNote(index) {
        const item = moodboardData().notes[index];
        if (!item) return;
        const value = await showDialog({ kind: "textarea", title: "Edit note", value: item.text || "" });
        if (value !== null) { item.text = value; renderMoodboard(); }
    }
    function exportMoodboardJSON() {
        const project = activeProject;
        const blob = new Blob([JSON.stringify({ format: "indesign", version: 1, project }, null, 2)], { type: "application/json" });
        downloadBlob(blob, project.name, ".json");
    }
    function downloadBlob(blob, name, extension) {
        const url = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = url; a.download = name.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-") + extension;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    async function exportMoodboardPNG() {
        const d = moodboardData(), canvas = document.createElement("canvas");
        const allObjects = [...d.references, ...d.notes, ...d.palette];
        const maxX = Math.max(0, ...allObjects.map(item => Number(item.x || 0) + 320));
        const maxY = Math.max(0, ...allObjects.map(item => Number(item.y || 0) + 300));
        canvas.width = Math.min(4096, Math.max(1800, Math.ceil(128 + maxX * .75)));
        canvas.height = Math.min(4096, Math.max(1200, Math.ceil(180 + maxY * .75)));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f1f2f5"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#111"; ctx.font = "600 34px Arial"; ctx.fillText(activeProject.name, 64, 68);
        if (d.purpose) { ctx.fillStyle = "#777"; ctx.font = "18px Arial"; ctx.fillText(d.purpose.slice(0, 110), 64, 102); }
        d.connections.forEach(pair => {
            const a = d.references[pair[0]], b = d.references[pair[1]];
            if (!a || !b) return;
            ctx.beginPath();
            ctx.moveTo(64 + (Number(a.x || 0) + 115) * .75, 150 + (Number(a.y || 0) + 100) * .75);
            ctx.lineTo(64 + (Number(b.x || 0) + 115) * .75, 150 + (Number(b.y || 0) + 100) * .75);
            ctx.strokeStyle = "#748fe8"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
        });
        for (const item of d.references) {
            const x = 64 + Number(item.x || 0) * .75, y = 150 + Number(item.y || 0) * .75;
            const img = new Image(); img.crossOrigin = "anonymous";
            try {
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = item.src; });
                const w = 250, h = 190, ratio = Math.min(w / img.width, h / img.height);
                ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio);
            } catch (_) {
                ctx.fillStyle = "#e8e8ec"; ctx.fillRect(x, y, 250, 150);
                ctx.fillStyle = "#555"; ctx.font = "14px Arial"; ctx.fillText("Image unavailable", x + 12, y + 78);
            }
            ctx.fillStyle = "#111"; ctx.font = "bold 16px Arial"; ctx.fillText((item.title || "Reference").slice(0, 32), x, y + 214);
            ctx.fillStyle = "#777"; ctx.font = "13px Arial"; ctx.fillText((item.notes || "").slice(0, 48), x, y + 236);
        }
        for (const item of d.notes) {
            const x = 64 + Number(item.x || 0) * .75, y = 150 + Number(item.y || 0) * .75;
            ctx.fillStyle = "#fff4a8"; ctx.fillRect(x, y, 220, 130);
            ctx.fillStyle = "#222"; ctx.font = "16px Arial"; ctx.fillText((item.text || "").slice(0, 100), x + 12, y + 28, 195);
        }
        d.palette.forEach(item => {
            const color = item.color || item, x = 64 + Number(item.x || 0) * .75, y = 150 + Number(item.y || 0) * .75;
            ctx.fillStyle = color; ctx.fillRect(x, y, 54, 54);
            ctx.fillStyle = "#333"; ctx.font = "12px Arial"; ctx.fillText(color, x, y + 72);
        });
        canvas.toBlob(blob => {
            if (!blob) { notify("PNG export failed. Try exporting JSON or .in instead."); return; }
            downloadBlob(blob, activeProject.name, ".png"); notify("PNG exported.");
        }, "image/png");
    }
    function brainstormData() {
        if (!activeProject.content || typeof activeProject.content !== "object") activeProject.content = {};
        const data = activeProject.content;
        if (!["music", "comeback"].includes(data.mode)) data.mode = "music";
        if (!data.music || typeof data.music !== "object") data.music = {};
        if (!data.comeback || typeof data.comeback !== "object") data.comeback = {};
        const defaults = {
            music: [{ id: "ideas", title: "Song ideas", items: [] }, { id: "production", title: "Production", items: [] }, { id: "lyrics", title: "Lyrics & topline", items: [] }, { id: "arrangement", title: "Arrangement", items: [] }],
            comeback: [{ id: "concept", title: "Concept & story", items: [] }, { id: "visuals", title: "Visual direction", items: [] }, { id: "promotion", title: "Promotion", items: [] }, { id: "content", title: "Content ideas", items: [] }]
        };
        ["music", "comeback"].forEach(mode => {
            const part = data[mode];
            if (!Array.isArray(part.sections)) part.sections = defaults[mode].map(section => ({ ...section }));
            part.sections.forEach((section, index) => {
                if (!section.id) section.id = mode + "-" + index;
                if (!Array.isArray(section.items)) section.items = [];
            });
        });
        return data;
    }
    function activeBrainstormPart() {
        const data = brainstormData();
        return data[data.mode];
    }

    let brainstormAudioUrl = null;
    function renderMusicReferences(text) {
        const refs=[]; let match;
        const timePattern=/\\b(\\d{1,2}:\\d{2})\\s*(?:to|-)\\s*(\\d{1,2}:\\d{2})\\b/gi;
        while((match=timePattern.exec(text))!==null)refs.push({type:"time",start:match[1],end:match[2]});
        const rulePattern=/\\bRule\\s*(\\d+)(?:\\s*(?:to|-)\\s*Rule?\\s*(\\d+))?\\b/gi;
        while((match=rulePattern.exec(text))!==null)refs.push({type:"rule",start:Number(match[1]),end:match[2]?Number(match[2]):Number(match[1])});
        return refs.map(ref=>ref.type==="time"?'<button class="brainstorm-reference-chip" data-play-range="'+ref.start+':'+ref.end+'">♫ '+ref.start+' - '+ref.end+'</button>':'<button class="brainstorm-reference-chip lyric" data-show-rules="'+ref.start+':'+ref.end+'">♪ Rule '+ref.start+(ref.end!==ref.start?' - '+ref.end:'')+'</button>').join("");
    }
    function parseClock(value){const p=value.split(":").map(Number);return p[0]*60+p[1];}
    function showRuleRange(start,end){
        const lyrics=brainstormData().music.lyrics;
        if(!lyrics?.sections){notify("Import a .lyrdem package first.");return;}
        const rules=lyrics.sections.flatMap(section=>(section.rules||[]).map(rule=>({...rule,section:section.title}))).filter(rule=>rule.number>=start&&rule.number<=end);
        if(!rules.length){notify("Those lyric rules are not in the imported package.");return;}
        const html=rules.map(rule=>'<article class="music-rule-preview"><small>'+escapeHTML(rule.section)+' · RULE '+rule.number+'</small><p>'+escapeHTML(rule.text)+'</p>'+(rule.adlibs?.length?'<em>'+escapeHTML(rule.adlibs.join(" / "))+'</em>':'')+(rule.members?.length?'<small>PERFORMER: '+escapeHTML(rule.members.join(", "))+'</small>':'')+'</article>').join("");
        const modal=document.createElement("div");modal.className="indesign-dialog-overlay visible music-reference-overlay";
        modal.innerHTML='<section class="music-reference-dialog"><header><strong>Lyrics reference</strong><button type="button" data-close-reference>×</button></header><div>'+html+'</div></section>';
        document.body.appendChild(modal);modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest("[data-close-reference]"))modal.remove();});
    }
    async function importBrainstormPackage(file,kind){
        try{
            if(!window.JSZip)throw new Error("Package library did not load. Refresh and try again.");
            const zip=await window.JSZip.loadAsync(file),mf=zip.file("manifest.json");
            if(!mf)throw new Error("This package has no manifest.json.");
            const data=JSON.parse(await mf.async("string")),expected=kind==="prodem"?"indesign-prodem":"indesign-lyrdem";
            if(data.format!==expected||data.version!==1)throw new Error("This is not a supported ."+kind+" package.");
            const music=brainstormData().music;
            if(kind==="prodem"){
                const track=data.track||{};music.production={title:track.title||"",artist:track.artist||"",bpm:track.bpm||"",key:track.key||"",producers:track.producers||[],credits:track.credits||"",audioName:data.assets?.audio||""};
                if(brainstormAudioUrl)URL.revokeObjectURL(brainstormAudioUrl);
                const path=data.assets?.audio?"audio/"+data.assets.audio:"";
                if(path&&zip.file(path)){const blob=await zip.file(path).async("blob");brainstormAudioUrl=URL.createObjectURL(blob);}
            }else music.lyrics={artist:data.artist||{},sections:data.sections||[],credits:data.credits||{}};
            const state=document.getElementById("brainstorm-save-state");if(state)state.textContent="Unsaved changes";
            renderBrainstorm();notify("."+kind+" imported into this brainstorm.");
        }catch(error){notify(error.message||"Could not import package.");}
    }
    function renderBrainstorm() {
        document.body.classList.remove("moodboard-fullscreen");
        document.body.classList.add("indesign-brainstorm-fullscreen");
        const data = brainstormData(), mode = data.mode, part = activeBrainstormPart();
        const music = mode === "music";
        const fields = music
          ? [["projectName","Project name"],["daw","DAW"],["bpm","BPM"],["key","Key"],["contributors","Contributors"],["visibility","Session access"]]
          : [["artist","Artist"],["release","Release"],["concept","Creative direction"],["launchDate","Target date"],["campaignLead","Campaign lead"]];
        const fieldValues = fields.map(([key,label]) => '<div class="brainstorm-field"><span>' + escapeHTML(label) + '</span><strong>' + escapeHTML(part[key] || "Add details") + '</strong><button data-edit-brainstorm-field="' + key + '">Edit</button></div>').join("");
        const sectionHTML = part.sections.map((section,index) => '<section class="brainstorm-section" data-brainstorm-section="' + index + '"><header><div><span class="brainstorm-section-index">' + String(index+1).padStart(2,"0") + '</span><input class="brainstorm-section-title" data-brainstorm-section-title="' + index + '" value="' + escapeHTML(section.title) + '" aria-label="Section title"></div><div class="brainstorm-section-actions"><button data-move-brainstorm-section="' + index + ':-1" title="Move up" ' + (index===0?'disabled':'') + '>↑</button><button data-move-brainstorm-section="' + index + ':1" title="Move down" ' + (index===part.sections.length-1?'disabled':'') + '>↓</button><button data-delete-brainstorm-section="' + index + '" title="Delete section">×</button></div></header><div class="brainstorm-ideas">' + (section.items.map((item,itemIndex) => '<article class="brainstorm-idea"><span class="brainstorm-idea-dot"></span><div class="brainstorm-idea-copy"><p>' + escapeHTML(item.text || "") + '</p>' + renderMusicReferences(item.text || "") + '</div><button data-edit-brainstorm-idea="' + index + ':' + itemIndex + '" title="Edit idea">···</button><button data-delete-brainstorm-idea="' + index + ':' + itemIndex + '" title="Remove idea">×</button></article>').join("") || '<p class="brainstorm-empty">Nothing here yet. Add your first idea.</p>') + '</div><button class="brainstorm-add-idea" data-add-brainstorm-idea="' + index + '">＋ Add an idea</button></section>').join("");
        title.textContent = activeProject.name;
        content.innerHTML = '<div class="brainstorm-workspace"><header class="brainstorm-topbar"><button class="mood-back" id="back-to-projects" title="Back to projects">←</button><div class="mood-doc-title"><strong>' + escapeHTML(activeProject.name) + '</strong><small>BRAINSTORM</small></div><div class="brainstorm-mode-switch"><button data-brainstorm-mode="music" class="' + (music?'active':'') + '">Music</button><button data-brainstorm-mode="comeback" class="' + (!music?'active':'') + '">Comebacks</button></div><span class="mood-save-state" id="brainstorm-save-state">Unsaved changes</span>' + (music ? '<button class="mood-top-action" id="open-music-tools">Music tools</button><button class="mood-top-action" id="import-prodem-trigger">Import .prodem</button><input id="brainstorm-prodem-file" type="file" accept=".prodem" hidden><button class="mood-top-action" id="import-lyrdem-trigger">Import .lyrdem</button><input id="brainstorm-lyrdem-file" type="file" accept=".lyrdem" hidden>' : '') + '<button class="mood-top-action" id="save-brainstorm-button">Save</button><button class="mood-top-action" data-export-project="' + escapeHTML(activeProject.id) + '">Export .in</button></header><div class="brainstorm-body"><aside class="brainstorm-sidebar"><div class="mood-panel-heading">WORKSPACE</div><p class="brainstorm-side-description">' + (music?'Build a song from its first idea to a finished production plan.':'Shape the release concept and organize the campaign around it.') + '</p><div class="mood-panel-heading">PROJECT DETAILS</div>' + fieldValues + '<button class="brainstorm-add-section" id="add-brainstorm-section">＋ Add section</button></aside><main class="brainstorm-main"><div class="brainstorm-heading"><div><p class="eyebrow">' + (music?'MUSIC DEVELOPMENT':'COMEBACK DEVELOPMENT') + '</p><h2>' + (music?'Build the sound.':'Build the era.') + '</h2><p>' + (music?'Collect production thoughts, lyrics, and arrangement ideas in one place.':'Collect the concept, visual language, and promotional direction.') + '</p></div><span class="brainstorm-section-count">' + part.sections.length + ' SECTIONS</span></div><div class="brainstorm-imported-assets">' + (part.production ? '<div class="brainstorm-asset-card"><strong>♫ ' + escapeHTML(part.production.title || "Production audio") + '</strong><span>' + escapeHTML(part.production.artist || "") + ' · ' + escapeHTML(part.production.bpm || "—") + ' BPM · ' + escapeHTML(part.production.key || "Key not set") + '</span>' + (brainstormAudioUrl ? '<audio id="brainstorm-audio" controls preload="metadata" src="' + brainstormAudioUrl + '"></audio>' : '<small>Re-import the .prodem to play audio in this session.</small>') + '</div>' : '') + (part.lyrics ? '<div class="brainstorm-asset-card"><strong>♪ ' + escapeHTML(part.lyrics.artist?.name || "Lyrics") + '</strong><span>' + part.lyrics.sections.reduce((n,section)=>n+(section.rules||[]).length,0) + ' lyric rules imported</span></div>' : '') + '</div><div class="brainstorm-section-grid">' + sectionHTML + '</div></main></div></div>';
    }
    async function addBrainstormIdea(sectionIndex) {
        const section = activeBrainstormPart().sections[sectionIndex];
        if (!section) return;
        const value = await showDialog({ kind:"textarea", title:"Add an idea to " + section.title, value:"", placeholder:"Write down the idea…" });
        if (value === null || !value.trim()) return;
        section.items.push({ text:value.trim() });
        renderBrainstorm();
    }
    async function editBrainstormIdea(sectionIndex, itemIndex) {
        const item = activeBrainstormPart().sections[sectionIndex]?.items[itemIndex];
        if (!item) return;
        const value = await showDialog({ kind:"textarea", title:"Edit idea", value:item.text || "" });
        if (value === null) return;
        item.text = value.trim();
        renderBrainstorm();
    }
    async function editBrainstormField(key) {
        const part = activeBrainstormPart(), mode = brainstormData().mode;
        const labels = { projectName:"Project name", daw:"DAW", bpm:"BPM", key:"Key", contributors:"Contributors", visibility:"Session access", artist:"Artist", release:"Release", concept:"Creative direction", launchDate:"Target date", campaignLead:"Campaign lead" };
        const multiline = ["contributors","concept"].includes(key);
        const value = await showDialog({ kind:multiline?"textarea":"prompt", title:labels[key] || "Edit detail", value:part[key] || "", placeholder:labels[key] || "" });
        if (value === null) return;
        part[key] = value.trim();
        renderBrainstorm();
    }
    async function addBrainstormSection() {
        const value = await ask("Name your new section", "");
        if (!value || !value.trim()) return;
        const sections = activeBrainstormPart().sections;
        sections.push({ id:"section-" + Date.now(), title:value.trim(), items:[] });
        renderBrainstorm();
    }
    async function saveBrainstorm() {
        if (!activeProject || activeProject.type !== "brainstorm") return;
        const { data, error } = await window.supabaseClient.from(table).update({ content: brainstormData() }).eq("id", activeProject.id).select().single();
        if (error) { console.error(error); notify("Could not save brainstorm."); return; }
        activeProject = data;
        projects = projects.map(p => p.id === data.id ? data : p);
        const state = document.getElementById("brainstorm-save-state");
        if (state) state.textContent = "Saved";
        notify("Brainstorm saved.");
    }
    async function saveMoodboard() {
        if (!activeProject || activeProject.type !== "moodboard") return;
        const { data, error } = await window.supabaseClient.from(table)
            .update({ content: moodboardData() }).eq("id", activeProject.id).select().single();
        if (error) { console.error(error); notify("Could not save moodboard. Check that the Step 3 migration was run."); return; }
        activeProject = data;
        projects = projects.map(p => p.id === data.id ? data : p);
        const saveState = document.getElementById("mood-save-state");
        if (saveState) saveState.textContent = "Saved";
        notify("Moodboard saved.");
    }
    function renderProject(project) {
        activeProject = project;
        document.body.classList.remove("moodboard-fullscreen", "indesign-brainstorm-fullscreen");
        title.textContent = project.name;
        if (project.type === "moodboard") {
            if (!project.content || typeof project.content !== "object") project.content = {};
            selectedMoodRefs = [];
            selectedMoodObject = null;
            moodViewport = { x: 0, y: 0, zoom: 1 };
            renderMoodboard();
            return;
        }
        if (project.type === "brainstorm") { brainstormData(); renderBrainstorm(); return; }
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
    async function addBoardElement(kind) {
        if (!activeProject || activeProject.type !== "board") return;
        const item = { kind, x: 70 + boardElements().length * 18, y: 65 + boardElements().length * 18, color: kind === "shape" ? "#748fe8" : "#111111" };
        if (kind === "text") {
            const value = await showDialog({ kind: "textarea", title: "Add text to board", value: "Your idea" });
            if (value === null) return;
            item.text = value;
        } else if (kind === "image") {
            const value = await ask("Add an image", "", "Paste an HTTPS image URL");
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
        const name = await ask("Name your " + (typeLabels[type] || "project").toLowerCase());
        if (!name || !name.trim()) return;
        const initialContent = type === "moodboard" ? { purpose: "", references: [], connections: [], palette: [] } : type === "brainstorm" ? { mode:"music", music:{}, comeback:{} } : { elements: [] };
        const { data, error } = await window.supabaseClient.from(table).insert({
            owner_id: employee.user.id, name: name.trim(), type, description: "", content: initialContent
        }).select().single();
        if (error) { console.error(error); notify("Could not create project. Check the indesign database setup."); return; }
        projects.unshift(data); notify("Project created."); renderProject(data);
    }
    async function renameProject(id) {
        const project = activeProject?.id === id ? activeProject : projects.find(p => p.id === id);
        if (!project) return;
        const name = await ask("Rename project", project.name);
        if (!name || !name.trim() || name.trim() === project.name) return;
        const { data, error } = await window.supabaseClient.from(table).update({name:name.trim()}).eq("id",id).select().single();
        if (error) { console.error(error); notify("Could not rename project."); return; }
        projects = projects.map(p => p.id === id ? data : p);
        notify("Project renamed."); renderProject(data);
    }
    async function deleteProject(id) {
        const project = projects.find(p => p.id === id);
        if (!project || !(await confirmAction("Delete project?", "“" + project.name + "” will be permanently deleted. This cannot be undone.", "Delete project"))) return;
        const { error } = await window.supabaseClient.from(table).delete().eq("id",id);
        if (error) { console.error(error); notify("Could not delete project."); return; }
        projects = projects.filter(p => p.id !== id); activeProject = null;
        notify("Project deleted."); showView("projects");
    }
    function exportProject(id) {
        const project = activeProject?.id === id ? activeProject : projects.find(p => p.id === id);
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
                owner_id:employee.user.id,name:project.name,type:project.type,description:project.description||"",content:(project.content && typeof project.content === "object" && !Array.isArray(project.content)) ? project.content : (project.type === "moodboard" ? {purpose:"",references:[],connections:[],palette:[]} : {elements:[]})
            }).select().single();
            if(error) throw error;
            projects.unshift(data); notify("Project imported."); renderProject(data);
        } catch(error) { console.error(error); notify(error.message||"Could not import this .in file."); }
    }
    async function showView(view) {
        document.querySelectorAll(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
        activeProject=null;
        document.body.classList.remove("moodboard-fullscreen", "indesign-brainstorm-fullscreen");
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
            const type=await showDialog({ kind:"select", title:"Choose a project type", value:"board", options:[{value:"moodboard",label:"Moodboard"},{value:"board",label:"Regular board"},{value:"brainstorm",label:"Brainstorm"}], confirmLabel:"Continue" });
            if(type && typeLabels[type]) createProject(type);
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
        if(addBoard){await addBoardElement(addBoard.dataset.addBoard);return;}
        const layer = event.target.closest("[data-select-board-element]");
        if(layer){selectedBoardElement=Number(layer.dataset.selectBoardElement);redrawBoard();return;}
        if(event.target.closest("#save-board-button")){saveBoard();return;}
        if(event.target.closest("[data-add-mood-ref]")){await addMoodReference();return;}
        if(event.target.closest("[data-add-mood-note]")){await addMoodNote();return;}
        const moodNoteEdit=event.target.closest("[data-edit-mood-note]");
        if(moodNoteEdit){await editMoodNote(Number(moodNoteEdit.dataset.editMoodNote));return;}
        const moodNoteDelete=event.target.closest("[data-delete-mood-note]");
        if(moodNoteDelete){moodboardData().notes.splice(Number(moodNoteDelete.dataset.deleteMoodNote),1);selectedMoodObject=null;renderMoodboard();return;}
        if(event.target.closest("#mood-export-toggle")){document.getElementById("mood-export-menu")?.classList.toggle("visible");return;}
        const moodExport=event.target.closest("[data-export-moodboard]");
        if(moodExport){document.getElementById("mood-export-menu")?.classList.remove("visible");if(moodExport.dataset.exportMoodboard==="json")exportMoodboardJSON();else exportMoodboardPNG();return;}
        const moodObjectSelect=event.target.closest("[data-select-mood-object]");
        if(moodObjectSelect){const [type,index]=moodObjectSelect.dataset.selectMoodObject.split(":");selectedMoodObject={type,index:Number(index)};renderMoodboard();return;}
        if(event.target.closest("#mood-zoom-in")){moodViewport.zoom=Math.min(2.5,moodViewport.zoom*1.15);updateMoodTransform();return;}
        if(event.target.closest("#mood-zoom-out")){moodViewport.zoom=Math.max(.2,moodViewport.zoom/1.15);updateMoodTransform();return;}
        if(event.target.closest("#mood-zoom-fit")){moodViewport={x:0,y:0,zoom:1};updateMoodTransform();return;}
        const moodTool=event.target.closest("[data-mood-tool]");
        if(moodTool){document.querySelectorAll("[data-mood-tool]").forEach(b=>b.classList.toggle("active",b===moodTool));document.getElementById("mood-canvas-viewport")?.classList.toggle("pan-tool",moodTool.dataset.moodTool==="pan");return;}
        if(event.target.closest("[data-add-mood-color]")){await addMoodColor();return;}
        if(event.target.closest("#save-moodboard-button")){saveMoodboard();return;}
        if(event.target.closest("#open-music-tools")){window.indesignMusicTools?.open();return;}
        if(event.target.closest("#import-prodem-trigger")){document.getElementById("brainstorm-prodem-file")?.click();return;}
        if(event.target.closest("#import-lyrdem-trigger")){document.getElementById("brainstorm-lyrdem-file")?.click();return;}
        const playRange=event.target.closest("[data-play-range]");
        if(playRange){const [from,to]=playRange.dataset.playRange.split(":");const audio=document.getElementById("brainstorm-audio");if(!audio){notify("Import a .prodem package with audio first.");return;}const start=parseClock(from),end=parseClock(to);if(end<=start){notify("The end of the range must be after the start.");return;}audio.currentTime=start;audio.play().catch(()=>notify("Audio playback could not start."));audio.ontimeupdate=()=>{if(audio.currentTime>=end){audio.pause();audio.ontimeupdate=null;}};return;}
        const ruleRange=event.target.closest("[data-show-rules]");
        if(ruleRange){const [start,end]=ruleRange.dataset.showRules.split(":").map(Number);showRuleRange(start,end);return;}
        if(event.target.closest("#save-brainstorm-button")){saveBrainstorm();return;}
        const brainstormMode=event.target.closest("[data-brainstorm-mode]");
        if(brainstormMode){brainstormData().mode=brainstormMode.dataset.brainstormMode;renderBrainstorm();return;}
        const brainstormField=event.target.closest("[data-edit-brainstorm-field]");
        if(brainstormField){await editBrainstormField(brainstormField.dataset.editBrainstormField);return;}
        if(event.target.closest("#add-brainstorm-section")){await addBrainstormSection();return;}
        const brainstormAddIdea=event.target.closest("[data-add-brainstorm-idea]");
        if(brainstormAddIdea){await addBrainstormIdea(Number(brainstormAddIdea.dataset.addBrainstormIdea));return;}
        const brainstormEditIdea=event.target.closest("[data-edit-brainstorm-idea]");
        if(brainstormEditIdea){const [sectionIndex,itemIndex]=brainstormEditIdea.dataset.editBrainstormIdea.split(":").map(Number);await editBrainstormIdea(sectionIndex,itemIndex);return;}
        const brainstormDeleteIdea=event.target.closest("[data-delete-brainstorm-idea]");
        if(brainstormDeleteIdea){const [sectionIndex,itemIndex]=brainstormDeleteIdea.dataset.deleteBrainstormIdea.split(":").map(Number);activeBrainstormPart().sections[sectionIndex]?.items.splice(itemIndex,1);renderBrainstorm();return;}
        const brainstormDeleteSection=event.target.closest("[data-delete-brainstorm-section]");
        if(brainstormDeleteSection){const index=Number(brainstormDeleteSection.dataset.deleteBrainstormSection);const ok=await confirmAction("Delete section?","This removes the section and all ideas inside it.","Delete section");if(ok){activeBrainstormPart().sections.splice(index,1);renderBrainstorm();}return;}
        const brainstormMoveSection=event.target.closest("[data-move-brainstorm-section]");
        if(brainstormMoveSection){const [index,delta]=brainstormMoveSection.dataset.moveBrainstormSection.split(":").map(Number);const sections=activeBrainstormPart().sections;const target=index+delta;if(target>=0&&target<sections.length){[sections[index],sections[target]]=[sections[target],sections[index]];renderBrainstorm();}return;}
        if(event.target.closest("#edit-mood-purpose")){
            const value=await showDialog({ kind:"textarea", title:"Moodboard purpose", value:moodboardData().purpose, placeholder:"Describe the direction of this moodboard…" });
            if(value!==null){moodboardData().purpose=value;renderMoodboard();}
            return;
        }
        const moodSelect=event.target.closest("[data-select-mood-ref]");
        if(moodSelect){
            const index=Number(moodSelect.dataset.selectMoodRef);
            selectedMoodRefs=selectedMoodRefs.includes(index)?selectedMoodRefs.filter(i=>i!==index):selectedMoodRefs.concat(index).slice(-2);
            renderMoodboard();return;
        }
        if(event.target.closest("[data-connect-mood-refs]")){
            if(selectedMoodRefs.length!==2){notify("Select two references first.");return;}
            const pair=[...selectedMoodRefs].sort((a,b)=>a-b);
            const exists=moodboardData().connections.some(p=>p[0]===pair[0]&&p[1]===pair[1]);
            if(!exists)moodboardData().connections.push(pair);
            selectedMoodRefs=[];renderMoodboard();return;
        }
        const moodEdit=event.target.closest("[data-edit-mood-ref]");
        if(moodEdit){await editMoodReference(Number(moodEdit.dataset.editMoodRef));return;}
        const moodDelete=event.target.closest("[data-delete-mood-ref]");
        if(moodDelete){
            const index=Number(moodDelete.dataset.deleteMoodRef);
            moodboardData().references.splice(index,1);
            moodboardData().connections=moodboardData().connections.filter(pair=>pair[0]!==index&&pair[1]!==index).map(pair=>pair.map(i=>i>index?i-1:i));
            selectedMoodRefs=[];renderMoodboard();return;
        }
        const moodColor=event.target.closest("[data-remove-mood-color]");
        if(moodColor){moodboardData().palette.splice(Number(moodColor.dataset.removeMoodColor),1);renderMoodboard();return;}
        const moodConnection=event.target.closest("[data-delete-mood-connection]");
        if(moodConnection){moodboardData().connections.splice(Number(moodConnection.dataset.deleteMoodConnection),1);renderMoodboard();return;}
        if(event.target.closest("#import-project-button")){document.getElementById("import-project-file").click();return;}
        const theme=event.target.closest("[data-theme]");
        if(theme){const dark=theme.dataset.theme==="dark";document.body.classList.toggle("dark-theme",dark);localStorage.setItem("indesign-theme",dark?"dark":"light");renderAccount();return;}
        if(event.target.closest("#sign-out-button")){try{await window.indesignAuth.signOut();}catch(e){console.error(e);notify("Could not sign out.");}}
    });
    document.addEventListener("change",event=>{
        if(event.target.id==="import-project-file" && event.target.files?.[0]) importProject(event.target.files[0]);
        if(event.target.id==="brainstorm-prodem-file"&&event.target.files?.[0])importBrainstormPackage(event.target.files[0],"prodem");
        if(event.target.id==="brainstorm-lyrdem-file"&&event.target.files?.[0])importBrainstormPackage(event.target.files[0],"lyrdem");
        const sectionTitle=event.target.closest("[data-brainstorm-section-title]");
        if(sectionTitle){const section=activeBrainstormPart()?.sections[Number(sectionTitle.dataset.brainstormSectionTitle)];if(section){section.title=sectionTitle.value.trim()||"Untitled section";const state=document.getElementById("brainstorm-save-state");if(state)state.textContent="Unsaved changes";}}
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