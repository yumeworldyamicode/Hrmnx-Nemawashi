/*
 * Nemawashi App Builder
 * Standalone dashboard + visual website builder.
 *
 * IMPORTANT:
 * supabase.js already creates the global `supabaseClient`.
 * Do NOT declare another variable with that name here.
 */

let currentUser = null;
let currentWebsite = null;
let currentPage = null;
let currentTheme = {};
let selectedElement = null;
let activeDevice = "desktop";

let historyStack = [];
let historyIndex = -1;
let saveTimer = null;

const COMPONENTS = [
    { type: "hero", label: "Hero", icon: "✦" },
    { type: "heading", label: "Heading", icon: "H" },
    { type: "text", label: "Text", icon: "T" },
    { type: "button", label: "Button", icon: "↗" },
    { type: "image", label: "Image", icon: "▧" },
    { type: "spacer", label: "Spacer", icon: "↕" }
];

document.addEventListener("DOMContentLoaded", initializeBuilder);

async function initializeBuilder() {
    try {
        if (typeof supabaseClient === "undefined") {
            showFatal("Supabase could not be loaded. Check supabase.js.");
            return;
        }

        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!data.session) {
            window.location.href = "logsignin.html";
            return;
        }

        currentUser = data.session.user;

        bindGlobalUI();

        const params = new URLSearchParams(window.location.search);
        const websiteId = params.get("website");

        if (websiteId) {
            await openWebsiteEditor(websiteId);
        } else {
            await showDashboard();
        }
    } catch (error) {
        console.error(error);
        showFatal(error.message || "Unable to initialize App Builder.");
    }
}

/* =========================
   Dashboard
========================= */

async function showDashboard() {
    document.getElementById("dashboardView").classList.remove("hidden");
    document.getElementById("editorView").classList.add("hidden");
    await loadDashboardData();
}

async function loadDashboardData() {
    await Promise.all([
        loadApps(),
        loadWebsites()
    ]);
}

async function loadApps() {
    const grid = document.getElementById("appsGrid");
    const empty = document.getElementById("appsEmpty");
    const count = document.getElementById("appsCount");

    grid.innerHTML = '<div class="loading-card">Loading apps…</div>';

    const { data, error } = await supabaseClient
        .from("nemawashi_apps")
        .select("id, slug, name, description, app_type, website_url, favicon_url, is_active")
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error(error);
        grid.innerHTML = "";
        empty.classList.remove("hidden");
        count.textContent = "Unable to load";
        return;
    }

    count.textContent = `${data.length} ${data.length === 1 ? "app" : "apps"}`;

    if (!data.length) {
        grid.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    grid.innerHTML = data.map(app => `
        <article class="resource-card">
            <div class="card-icon">${escapeHtml(getAppInitial(app))}</div>
            <h3>${escapeHtml(app.name)}</h3>
            <p>${escapeHtml(app.description || "Nemawashi application.")}</p>
            <div class="card-meta">${escapeHtml(app.app_type || "standard")}</div>
            <button class="card-open" data-open-app="${escapeAttr(app.id)}">Open →</button>
        </article>
    `).join("");

    grid.querySelectorAll("[data-open-app]").forEach(button => {
        button.addEventListener("click", () => openApp(button.dataset.openApp, data));
    });
}

function getAppInitial(app) {
    const name = String(app.name || "");
    return name.trim().charAt(0).toUpperCase() || "A";
}

async function openApp(appId, apps) {
    const app = apps.find(item => String(item.id) === String(appId));
    if (!app) return;

    /*
     * Existing Nemawashi apps are managed through Messages.
     * Keep the App Builder independent from messages.js.
     */
    if (app.website_url) {
        window.open(app.website_url, "_blank", "noopener");
        return;
    }

    showToast(`${app.name} is an app managed through Nemawashi.`, "success");
}

async function loadWebsites() {
    const grid = document.getElementById("websitesGrid");
    const empty = document.getElementById("websitesEmpty");
    const count = document.getElementById("websitesCount");

    grid.innerHTML = '<div class="loading-card">Loading websites…</div>';

    const { data, error } = await supabaseClient
        .from("websites")
        .select("id, name, slug, description, favicon_url, domain, status, updated_at")
        .order("updated_at", { ascending: false });

    if (error) {
        console.error(error);
        grid.innerHTML = "";
        empty.classList.remove("hidden");
        count.textContent = "Unable to load";
        return;
    }

    count.textContent = `${data.length} ${data.length === 1 ? "website" : "websites"}`;

    if (!data.length) {
        grid.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    grid.innerHTML = data.map(site => `
        <article class="resource-card">
            <div class="card-icon">⌁</div>
            <h3>${escapeHtml(site.name)}</h3>
            <p>${escapeHtml(site.description || "Nemawashi website.")}</p>
            <div class="card-meta">${escapeHtml(site.status || "draft")}${site.domain ? ` · ${escapeHtml(site.domain)}` : ""}</div>
            <button class="card-open" data-open-website="${escapeAttr(site.id)}">Edit →</button>
        </article>
    `).join("");

    grid.querySelectorAll("[data-open-website]").forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = `app-builder.html?website=${encodeURIComponent(button.dataset.openWebsite)}`;
        });
    });
}

/* =========================
   Global UI
========================= */

function bindGlobalUI() {
    document.getElementById("createAppBtn").addEventListener("click", () => openModal("appModal"));
    document.getElementById("emptyCreateAppBtn").addEventListener("click", () => openModal("appModal"));

    document.getElementById("createWebsiteBtn").addEventListener("click", () => openModal("websiteModal"));
    document.getElementById("emptyCreateWebsiteBtn").addEventListener("click", () => openModal("websiteModal"));

    document.getElementById("refreshDashboardBtn").addEventListener("click", loadDashboardData);

    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => closeModal(button.dataset.closeModal));
    });

    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", event => {
            if (event.target === backdrop) backdrop.classList.add("hidden");
        });
    });

    document.getElementById("appForm").addEventListener("submit", createApp);
    document.getElementById("websiteForm").addEventListener("submit", createWebsite);
    document.getElementById("pageForm").addEventListener("submit", createPage);
    document.getElementById("themeForm").addEventListener("submit", saveTheme);
    document.getElementById("siteSettingsForm").addEventListener("submit", saveSiteSettings);
}

/* =========================
   Create App
========================= */

async function createApp(event) {
    event.preventDefault();

    const name = document.getElementById("appName").value.trim();
    const slug = document.getElementById("appSlug").value.trim().toLowerCase();
    const appType = document.getElementById("appType").value;
    const description = document.getElementById("appDescription").value.trim();

    if (!name || !slug) return;

    const { data: app, error } = await supabaseClient
        .from("nemawashi_apps")
        .insert({
            name,
            slug,
            description,
            app_type: appType,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return;
    }

    if (appType === "shop") {
        const defaultSpaces = [
            { slug: "general", name: "General Space", space_type: "general", description: "General discussions and information for the app.", position: 0 },
            { slug: "artists", name: "Artists", space_type: "creative", description: "Manage and discuss artists.", position: 1 },
            { slug: "releases", name: "Releases", space_type: "creative", description: "Manage releases and release information.", position: 2 },
            { slug: "products", name: "Products", space_type: "creative", description: "Manage products and storefront items.", position: 3 },
            { slug: "themes", name: "Themes", space_type: "creative", description: "Create and manage artist storefront themes.", position: 4 },
            { slug: "website", name: "Website Builder", space_type: "app_creating", description: "Configure and customize the public website.", position: 5 },
            { slug: "files", name: "Files", space_type: "creative", description: "Manage images, artwork, logos and other assets.", position: 6 }
        ];

        const { error: spacesError } = await supabaseClient
            .from("nemawashi_spaces")
            .insert(defaultSpaces.map(space => ({
                ...space,
                app_id: app.id,
                project_id: null,
                is_active: true
            })));

        if (spacesError) {
            console.error(spacesError);
            showToast(`App created, but default spaces failed: ${spacesError.message}`, "error");
        }
    }

    closeModal("appModal");
    document.getElementById("appForm").reset();
    showToast("App created successfully.", "success");
    await loadApps();
}

/* =========================
   Create Website
========================= */

async function createWebsite(event) {
    event.preventDefault();

    const name = document.getElementById("websiteName").value.trim();
    const slug = document.getElementById("websiteSlug").value.trim().toLowerCase();
    const description = document.getElementById("websiteDescription").value.trim();
    const starter = document.getElementById("websiteStarter").value;

    if (!name || !slug) return;

    const { data: website, error } = await supabaseClient
        .from("websites")
        .insert({
            name,
            slug,
            description,
            status: "draft",
            owner_id: currentUser.id
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return;
    }

    const { data: page, error: pageError } = await supabaseClient
        .from("website_pages")
        .insert({
            website_id: website.id,
            name: "Home",
            slug: "home",
            position: 0,
            is_homepage: true
        })
        .select()
        .single();

    if (pageError) {
        console.error(pageError);
        await supabaseClient.from("websites").delete().eq("id", website.id);
        showToast(pageError.message, "error");
        return;
    }

    const defaultTheme = {
        primary: "#8f6cff",
        background: "#ffffff",
        text: "#111111",
        accent: "#c7b8ff",
        font: "system-ui"
    };

    const { error: themeError } = await supabaseClient
        .from("website_themes")
        .insert({
            website_id: website.id,
            settings: defaultTheme
        });

    if (themeError) {
        console.error(themeError);
        showToast(`Website created, but theme setup failed: ${themeError.message}`, "error");
    }

    if (starter === "starter") {
        await createStarterContent(page.id);
    }

    closeModal("websiteModal");
    document.getElementById("websiteForm").reset();

    showToast("Website created. Opening builder…", "success");
    window.location.href = `app-builder.html?website=${encodeURIComponent(website.id)}`;
}

async function createStarterContent(pageId) {
    const { data: heroSection, error: heroError } = await supabaseClient
        .from("website_sections")
        .insert({
            page_id: pageId,
            type: "hero",
            position: 0,
            settings: {
                background: "#17121f",
                color: "#ffffff"
            }
        })
        .select()
        .single();

    if (heroError) throw heroError;

    await supabaseClient.from("website_elements").insert([
        {
            section_id: heroSection.id,
            type: "hero",
            position: 0,
            settings: {
                heading: "Build something worth sharing.",
                text: "Create a beautiful Hrmnx website directly inside Nemawashi.",
                buttonText: "Get started",
                buttonUrl: "#"
            }
        }
    ]);

    const { data: headingSection, error: headingError } = await supabaseClient
        .from("website_sections")
        .insert({
            page_id: pageId,
            type: "content",
            position: 1,
            settings: {}
        })
        .select()
        .single();

    if (headingError) throw headingError;

    await supabaseClient.from("website_elements").insert([
        {
            section_id: headingSection.id,
            type: "heading",
            position: 0,
            settings: {
                text: "Your website, your space."
            }
        },
        {
            section_id: headingSection.id,
            type: "text",
            position: 1,
            settings: {
                text: "Use the Nemawashi builder to add pages, content, images, links and Hrmnx-specific components."
            }
        },
        {
            section_id: headingSection.id,
            type: "button",
            position: 2,
            settings: {
                text: "Explore",
                url: "#"
            }
        }
    ]);
}

/* =========================
   Editor
========================= */

async function openWebsiteEditor(websiteId) {
    document.getElementById("dashboardView").classList.add("hidden");
    document.getElementById("editorView").classList.remove("hidden");

    const { data: website, error } = await supabaseClient
        .from("websites")
        .select("*")
        .eq("id", websiteId)
        .single();

    if (error || !website) {
        console.error(error);
        showFatal(error?.message || "Website not found.");
        return;
    }

    currentWebsite = website;

    document.getElementById("editorWebsiteName").textContent = website.name;
    document.getElementById("saveStatus").textContent = "Loading…";

    bindEditorUI();

    await loadTheme();
    await loadPages();

    document.getElementById("saveStatus").textContent = "Saved";
}

function bindEditorUI() {
    document.getElementById("backToDashboardBtn").onclick = () => {
        window.location.href = "app-builder.html";
    };

    document.getElementById("addPageBtn").onclick = () => openModal("pageModal");
    document.getElementById("themeBtn").onclick = openThemeEditor;
    document.getElementById("siteSettingsBtn").onclick = openSiteSettings;

    document.getElementById("previewBtn").onclick = openPreview;
    document.getElementById("closePreviewBtn").onclick = closePreview;

    document.getElementById("publishBtn").onclick = publishWebsite;

    document.getElementById("undoBtn").onclick = undo;
    document.getElementById("redoBtn").onclick = redo;

    document.querySelectorAll(".device-button").forEach(button => {
        button.onclick = () => setDevice(button.dataset.device);
    });

    renderComponentList();
}

function renderComponentList() {
    const list = document.getElementById("componentList");

    list.innerHTML = COMPONENTS.map(component => `
        <button class="component-button" data-component="${component.type}">
            <span class="component-symbol">${component.icon}</span>
            <span>${component.label}</span>
        </button>
    `).join("");

    list.querySelectorAll("[data-component]").forEach(button => {
        button.addEventListener("click", () => addElement(button.dataset.component));
    });
}

async function loadPages() {
    const { data, error } = await supabaseClient
        .from("website_pages")
        .select("*")
        .eq("website_id", currentWebsite.id)
        .order("position");

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return;
    }

    renderPages(data);

    const home = data.find(page => page.is_homepage) || data[0];

    if (home) {
        currentPage = home;
        await renderCurrentPage();
    }
}

function renderPages(pages) {
    const list = document.getElementById("pagesList");

    list.innerHTML = pages.map(page => `
        <div class="page-item ${currentPage && page.id === currentPage.id ? "active" : ""}" data-page-id="${escapeAttr(page.id)}">
            <span>${escapeHtml(page.name)}</span>
            ${page.is_homepage ? '<span class="page-home">HOME</span>' : ""}
        </div>
    `).join("");

    list.querySelectorAll("[data-page-id]").forEach(item => {
        item.addEventListener("click", async () => {
            const { data, error } = await supabaseClient
                .from("website_pages")
                .select("*")
                .eq("id", item.dataset.pageId)
                .single();

            if (error) {
                showToast(error.message, "error");
                return;
            }

            currentPage = data;
            selectedElement = null;
            renderPages(pages);
            await renderCurrentPage();
        });
    });
}

async function renderCurrentPage() {
    if (!currentPage) return;

    document.getElementById("canvasPageName").textContent = currentPage.name;

    const { data: sections, error: sectionsError } = await supabaseClient
        .from("website_sections")
        .select("*")
        .eq("page_id", currentPage.id)
        .order("position");

    if (sectionsError) {
        console.error(sectionsError);
        showToast(sectionsError.message, "error");
        return;
    }

    const sectionIds = sections.map(section => section.id);

    let elements = [];
    if (sectionIds.length) {
        const { data, error } = await supabaseClient
            .from("website_elements")
            .select("*")
            .in("section_id", sectionIds)
            .order("position");

        if (error) {
            console.error(error);
            showToast(error.message, "error");
            return;
        }

        elements = data || [];
    }

    const canvas = document.getElementById("websiteCanvas");
    canvas.innerHTML = "";

    for (const section of sections) {
        const sectionEl = document.createElement("section");
        sectionEl.className = "canvas-section";
        sectionEl.dataset.sectionId = section.id;

        const sectionElements = elements
            .filter(element => element.section_id === section.id)
            .sort((a,b) => a.position - b.position);

        sectionElements.forEach(element => {
            sectionEl.appendChild(createElementNode(element));
        });

        canvas.appendChild(sectionEl);
    }

    if (!sections.length) {
        canvas.innerHTML = `
            <div class="empty-canvas-message" style="min-height:720px;display:grid;place-items:center;color:#999;text-align:center;padding:30px;">
                <div>
                    <div style="font-size:42px;margin-bottom:12px;">＋</div>
                    <h2 style="color:#222;margin:0 0 7px;">Start building</h2>
                    <p style="font-family:system-ui,sans-serif;font-weight:400;">Choose a component from the left sidebar to add it to this page.</p>
                </div>
            </div>
        `;
    }

    applyThemeToCanvas();
    updatePropertiesPanel();
}

function createElementNode(element) {
    const wrapper = document.createElement("div");
    wrapper.className = `canvas-element ${selectedElement && selectedElement.id === element.id ? "selected" : ""}`;
    wrapper.dataset.elementId = element.id;

    const settings = element.settings || {};

    if (element.type === "hero") {
        wrapper.innerHTML = `
            <div class="render-hero">
                <h1>${escapeHtml(settings.heading || "Your headline")}</h1>
                <p>${escapeHtml(settings.text || "Add a powerful introduction to your website.")}</p>
                ${settings.buttonText ? `<div><button style="border:0;background:white;color:#111;padding:13px 22px;border-radius:8px;">${escapeHtml(settings.buttonText)}</button></div>` : ""}
            </div>
        `;
    } else if (element.type === "heading") {
        wrapper.innerHTML = `<div class="render-heading"><h2>${escapeHtml(settings.text || "Heading")}</h2></div>`;
    } else if (element.type === "text") {
        wrapper.innerHTML = `<div class="render-text"><p>${escapeHtml(settings.text || "Write something here.")}</p></div>`;
    } else if (element.type === "button") {
        wrapper.innerHTML = `<div class="render-button"><button>${escapeHtml(settings.text || "Button")}</button></div>`;
    } else if (element.type === "image") {
        const src = settings.src || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";
        wrapper.innerHTML = `<div class="render-image"><img src="${escapeAttr(src)}" alt="${escapeAttr(settings.alt || "")}" onerror="this.style.display='none'"></div>`;
    } else if (element.type === "spacer") {
        wrapper.innerHTML = `<div class="render-spacer" style="height:${Number(settings.height) || 90}px"></div>`;
    }

    const controls = document.createElement("div");
    controls.className = "element-control";
    controls.innerHTML = `<button title="Move up">↑</button><button title="Move down">↓</button><button title="Delete">×</button>`;

    controls.children[0].onclick = event => {
        event.stopPropagation();
        moveElement(element, -1);
    };

    controls.children[1].onclick = event => {
        event.stopPropagation();
        moveElement(element, 1);
    };

    controls.children[2].onclick = event => {
        event.stopPropagation();
        deleteElement(element);
    };

    wrapper.appendChild(controls);

    wrapper.addEventListener("click", event => {
        if (event.target.closest(".element-control")) return;
        selectedElement = element;
        updatePropertiesPanel();
        document.querySelectorAll(".canvas-element").forEach(node => node.classList.remove("selected"));
        wrapper.classList.add("selected");
    });

    return wrapper;
}

async function addElement(type) {
    if (!currentPage) {
        showToast("Create or select a page first.", "error");
        return;
    }

    let section = null;

    const { data: existingSections, error } = await supabaseClient
        .from("website_sections")
        .select("*")
        .eq("page_id", currentPage.id)
        .order("position", { ascending: false })
        .limit(1);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    section = existingSections?.[0];

    if (!section || type === "hero") {
        const { data: maxSections } = await supabaseClient
            .from("website_sections")
            .select("position")
            .eq("page_id", currentPage.id)
            .order("position", { ascending: false })
            .limit(1);

        const position = maxSections?.length ? Number(maxSections[0].position) + 1 : 0;

        const { data: newSection, error: sectionError } = await supabaseClient
            .from("website_sections")
            .insert({
                page_id: currentPage.id,
                type: type === "hero" ? "hero" : "content",
                position,
                settings: {}
            })
            .select()
            .single();

        if (sectionError) {
            showToast(sectionError.message, "error");
            return;
        }

        section = newSection;
    }

    const defaults = {
        hero: {
            heading: "Your headline",
            text: "Tell visitors what your website is about.",
            buttonText: "Learn more",
            buttonUrl: "#"
        },
        heading: { text: "New heading" },
        text: { text: "Start writing your content here." },
        button: { text: "Button", url: "#" },
        image: {
            src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
            alt: "Website image"
        },
        spacer: { height: 90 }
    };

    const { data: maxElements } = await supabaseClient
        .from("website_elements")
        .select("position")
        .eq("section_id", section.id)
        .order("position", { ascending: false })
        .limit(1);

    const position = maxElements?.length ? Number(maxElements[0].position) + 1 : 0;

    const { data: element, error: elementError } = await supabaseClient
        .from("website_elements")
        .insert({
            section_id: section.id,
            type,
            position,
            settings: defaults[type] || {}
        })
        .select()
        .single();

    if (elementError) {
        showToast(elementError.message, "error");
        return;
    }

    selectedElement = element;
    recordHistory();
    scheduleSave();
    await renderCurrentPage();
    showToast(`${typeLabel(type)} added.`, "success");
}

function updatePropertiesPanel() {
    const panel = document.getElementById("propertiesPanel");

    if (!selectedElement) {
        panel.innerHTML = `
            <div class="properties-empty">
                <div class="properties-empty-icon">◇</div>
                <h3>Select something</h3>
                <p>Choose a component on the canvas to edit its content and appearance.</p>
            </div>
        `;
        return;
    }

    const settings = selectedElement.settings || {};
    let fields = "";

    if (selectedElement.type === "hero") {
        fields = `
            ${propertyInput("heading", "Heading", settings.heading || "", "text")}
            ${propertyTextarea("text", "Text", settings.text || "")}
            ${propertyInput("buttonText", "Button text", settings.buttonText || "", "text")}
            ${propertyInput("buttonUrl", "Button URL", settings.buttonUrl || "", "text")}
        `;
    } else if (selectedElement.type === "heading") {
        fields = propertyInput("text", "Heading", settings.text || "", "text");
    } else if (selectedElement.type === "text") {
        fields = propertyTextarea("text", "Text", settings.text || "");
    } else if (selectedElement.type === "button") {
        fields = `
            ${propertyInput("text", "Button text", settings.text || "", "text")}
            ${propertyInput("url", "Link URL", settings.url || "", "text")}
        `;
    } else if (selectedElement.type === "image") {
        fields = `
            ${propertyInput("src", "Image URL", settings.src || "", "text")}
            ${propertyInput("alt", "Alt text", settings.alt || "", "text")}
        `;
    } else if (selectedElement.type === "spacer") {
        fields = propertyInput("height", "Height (px)", settings.height || 90, "number");
    }

    panel.innerHTML = `
        <div class="property-group">
            <div class="property-group-title">${typeLabel(selectedElement.type)}</div>
            ${fields}
        </div>
        <div class="property-group">
            <div class="property-group-title">Element</div>
            <div class="property-field">
                <label>Position</label>
                <div style="color:var(--muted);font-size:10px;padding:9px 0;">${Number(selectedElement.position) + 1}</div>
            </div>
        </div>
    `;

    panel.querySelectorAll("[data-property]").forEach(input => {
        input.addEventListener("input", () => {
            const key = input.dataset.property;
            let value = input.value;

            if (input.type === "number") value = Number(value);

            selectedElement.settings = {
                ...(selectedElement.settings || {}),
                [key]: value
            };

            scheduleSave();
            renderCurrentPage();
            updatePropertiesPanel();
        });
    });
}

function propertyInput(key, label, value, type = "text") {
    return `
        <div class="property-field">
            <label>${escapeHtml(label)}</label>
            <input data-property="${escapeAttr(key)}" type="${type}" value="${escapeAttr(value)}">
        </div>
    `;
}

function propertyTextarea(key, label, value) {
    return `
        <div class="property-field">
            <label>${escapeHtml(label)}</label>
            <textarea data-property="${escapeAttr(key)}">${escapeHtml(value)}</textarea>
        </div>
    `;
}

async function deleteElement(element) {
    if (!confirm(`Delete this ${typeLabel(element.type)}?`)) return;

    const { error } = await supabaseClient
        .from("website_elements")
        .delete()
        .eq("id", element.id);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    selectedElement = null;
    recordHistory();
    await renderCurrentPage();
    showToast("Element deleted.", "success");
}

async function moveElement(element, direction) {
    const { data: siblings, error } = await supabaseClient
        .from("website_elements")
        .select("*")
        .eq("section_id", element.section_id)
        .order("position");

    if (error) {
        showToast(error.message, "error");
        return;
    }

    const index = siblings.findIndex(item => item.id === element.id);
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= siblings.length) return;

    const other = siblings[newIndex];

    await supabaseClient
        .from("website_elements")
        .update({ position: other.position })
        .eq("id", element.id);

    await supabaseClient
        .from("website_elements")
        .update({ position: element.position })
        .eq("id", other.id);

    recordHistory();
    await renderCurrentPage();
}

async function createPage(event) {
    event.preventDefault();

    const name = document.getElementById("pageName").value.trim();
    const slug = document.getElementById("pageSlug").value.trim().toLowerCase();

    if (!name || !slug) return;

    const { data: lastPage } = await supabaseClient
        .from("website_pages")
        .select("position")
        .eq("website_id", currentWebsite.id)
        .order("position", { ascending: false })
        .limit(1);

    const position = lastPage?.length ? Number(lastPage[0].position) + 1 : 0;

    const { data, error } = await supabaseClient
        .from("website_pages")
        .insert({
            website_id: currentWebsite.id,
            name,
            slug,
            position,
            is_homepage: false
        })
        .select()
        .single();

    if (error) {
        showToast(error.message, "error");
        return;
    }

    currentPage = data;
    closeModal("pageModal");
    document.getElementById("pageForm").reset();

    await loadPages();
    showToast("Page added.", "success");
}

/* =========================
   Theme
========================= */

async function loadTheme() {
    const { data, error } = await supabaseClient
        .from("website_themes")
        .select("*")
        .eq("website_id", currentWebsite.id)
        .maybeSingle();

    if (error) {
        console.error(error);
        return;
    }

    currentTheme = data?.settings || {
        primary: "#8f6cff",
        background: "#ffffff",
        text: "#111111",
        accent: "#c7b8ff"
    };

    applyThemeToCanvas();
}

function applyThemeToCanvas() {
    const canvas = document.getElementById("websiteCanvas");
    if (!canvas) return;

    canvas.style.background = currentTheme.background || "#fff";
    canvas.style.color = currentTheme.text || "#111";
}

function openThemeEditor() {
    document.getElementById("themePrimary").value = normalizeColor(currentTheme.primary, "#8f6cff");
    document.getElementById("themeBackground").value = normalizeColor(currentTheme.background, "#ffffff");
    document.getElementById("themeText").value = normalizeColor(currentTheme.text, "#111111");
    document.getElementById("themeAccent").value = normalizeColor(currentTheme.accent, "#c7b8ff");
    openModal("themeModal");
}

async function saveTheme(event) {
    event.preventDefault();

    currentTheme = {
        ...currentTheme,
        primary: document.getElementById("themePrimary").value,
        background: document.getElementById("themeBackground").value,
        text: document.getElementById("themeText").value,
        accent: document.getElementById("themeAccent").value
    };

    const { error } = await supabaseClient
        .from("website_themes")
        .upsert({
            website_id: currentWebsite.id,
            settings: currentTheme
        }, { onConflict: "website_id" });

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeModal("themeModal");
    applyThemeToCanvas();
    showToast("Theme saved.", "success");
}

/* =========================
   Site Settings
========================= */

function openSiteSettings() {
    document.getElementById("settingsWebsiteName").value = currentWebsite.name || "";
    document.getElementById("settingsWebsiteDescription").value = currentWebsite.description || "";
    document.getElementById("settingsFavicon").value = currentWebsite.favicon_url || "";
    document.getElementById("settingsDomain").value = currentWebsite.domain || "";
    openModal("siteSettingsModal");
}

async function saveSiteSettings(event) {
    event.preventDefault();

    const patch = {
        name: document.getElementById("settingsWebsiteName").value.trim(),
        description: document.getElementById("settingsWebsiteDescription").value.trim(),
        favicon_url: document.getElementById("settingsFavicon").value.trim() || null,
        domain: document.getElementById("settingsDomain").value.trim() || null,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
        .from("websites")
        .update(patch)
        .eq("id", currentWebsite.id)
        .select()
        .single();

    if (error) {
        showToast(error.message, "error");
        return;
    }

    currentWebsite = data;
    document.getElementById("editorWebsiteName").textContent = data.name;

    closeModal("siteSettingsModal");
    showToast("Site settings saved.", "success");
}

/* =========================
   Preview
========================= */

async function openPreview() {
    await saveEverything();

    const html = await buildPreviewHTML();

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    document.getElementById("previewFrame").src = url;
    document.getElementById("previewTitle").textContent = `${currentWebsite.name} — Preview`;
    document.getElementById("previewOverlay").classList.remove("hidden");
}

function closePreview() {
    const frame = document.getElementById("previewFrame");
    const oldSrc = frame.src;

    frame.src = "about:blank";
    document.getElementById("previewOverlay").classList.add("hidden");

    if (oldSrc.startsWith("blob:")) URL.revokeObjectURL(oldSrc);
}

async function buildPreviewHTML() {
    const { data: pages } = await supabaseClient
        .from("website_pages")
        .select("*")
        .eq("website_id", currentWebsite.id)
        .order("position");

    const page = currentPage || pages?.[0];

    if (!page) return "<!doctype html><html><body></body></html>";

    const { data: sections } = await supabaseClient
        .from("website_sections")
        .select("*")
        .eq("page_id", page.id)
        .order("position");

    const sectionIds = (sections || []).map(section => section.id);

    let elements = [];
    if (sectionIds.length) {
        const result = await supabaseClient
            .from("website_elements")
            .select("*")
            .in("section_id", sectionIds)
            .order("position");

        elements = result.data || [];
    }

    const body = (sections || []).map(section => {
        const sectionElements = elements
            .filter(element => element.section_id === section.id)
            .sort((a,b) => a.position - b.position);

        return sectionElements.map(element => renderPublicElement(element)).join("");
    }).join("");

    return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(currentWebsite.name)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:${safeColor(currentTheme.background,"#fff")};color:${safeColor(currentTheme.text,"#111")};font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
img{max-width:100%}
a{text-decoration:none}
.hero{min-height:430px;padding:80px 8%;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#17121f,#3a245d);color:#fff}
.hero h1{max-width:850px;margin:0 0 18px;font-size:clamp(42px,7vw,80px);line-height:.98;letter-spacing:-.045em}
.hero p{max-width:680px;line-height:1.7;opacity:.82}
.hero a,.cta a{display:inline-block;background:${safeColor(currentTheme.primary,"#111")};color:#fff;padding:13px 22px;border-radius:8px;margin-top:10px}
.heading{padding:60px 8% 15px}.heading h2{font-size:clamp(30px,5vw,55px);margin:0;letter-spacing:-.04em}
.text{padding:10px 8% 45px}.text p{max-width:760px;line-height:1.8;color:#555}
.cta{padding:20px 8% 55px}.cta a{background:${safeColor(currentTheme.primary,"#111")}}
.image{padding:25px 8%}.image img{width:100%;max-height:600px;object-fit:cover;border-radius:12px}
.spacer{height:90px}
</style>
</head>
<body>${body}</body>
</html>`;
}

function renderPublicElement(element) {
    const settings = element.settings || {};

    if (element.type === "hero") {
        return `<section class="hero">
            <h1>${escapeHtml(settings.heading || "Your headline")}</h1>
            <p>${escapeHtml(settings.text || "")}</p>
            ${settings.buttonText ? `<div><a href="${escapeAttr(settings.buttonUrl || "#")}">${escapeHtml(settings.buttonText)}</a></div>` : ""}
        </section>`;
    }

    if (element.type === "heading") {
        return `<section class="heading"><h2>${escapeHtml(settings.text || "Heading")}</h2></section>`;
    }

    if (element.type === "text") {
        return `<section class="text"><p>${escapeHtml(settings.text || "")}</p></section>`;
    }

    if (element.type === "button") {
        return `<section class="cta"><a href="${escapeAttr(settings.url || "#")}">${escapeHtml(settings.text || "Button")}</a></section>`;
    }

    if (element.type === "image") {
        return `<section class="image"><img src="${escapeAttr(settings.src || "")}" alt="${escapeAttr(settings.alt || "")}"></section>`;
    }

    if (element.type === "spacer") {
        return `<div class="spacer" style="height:${Number(settings.height) || 90}px"></div>`;
    }

    return "";
}

/* =========================
   Publish / Save
========================= */

async function publishWebsite() {
    await saveEverything();

    const { data, error } = await supabaseClient
        .from("websites")
        .update({
            status: "published",
            updated_at: new Date().toISOString()
        })
        .eq("id", currentWebsite.id)
        .select()
        .single();

    if (error) {
        showToast(error.message, "error");
        return;
    }

    currentWebsite = data;
    document.getElementById("saveStatus").textContent = "Published";
    showToast("Website published.", "success");
}

async function saveEverything() {
    if (!currentWebsite) return;

    document.getElementById("saveStatus").textContent = "Saving…";

    if (selectedElement) {
        const { error } = await supabaseClient
            .from("website_elements")
            .update({
                settings: selectedElement.settings || {},
                updated_at: new Date().toISOString()
            })
            .eq("id", selectedElement.id);

        if (error) console.error(error);
    }

    await supabaseClient
        .from("websites")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentWebsite.id);

    document.getElementById("saveStatus").textContent = "Saved";
}

function scheduleSave() {
    document.getElementById("saveStatus").textContent = "Unsaved changes";

    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveEverything, 800);
}

/* =========================
   Device / History
========================= */

function setDevice(device) {
    activeDevice = device;

    document.querySelectorAll(".device-button").forEach(button => {
        button.classList.toggle("active", button.dataset.device === device);
    });

    const canvas = document.getElementById("websiteCanvas");
    canvas.classList.remove("device-tablet", "device-mobile");

    if (device === "tablet") canvas.classList.add("device-tablet");
    if (device === "mobile") canvas.classList.add("device-mobile");
}

function recordHistory() {
    /*
     * Lightweight history marker.
     * Database remains the source of truth, while the controls stay ready
     * for richer version snapshots.
     */
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(Date.now());
    historyIndex = historyStack.length - 1;
    updateHistoryButtons();
}

function undo() {
    if (historyIndex <= 0) {
        showToast("Nothing to undo yet.", "error");
        return;
    }

    historyIndex--;
    updateHistoryButtons();
    showToast("Undo history is ready for version snapshots.", "success");
}

function redo() {
    if (historyIndex >= historyStack.length - 1) {
        showToast("Nothing to redo yet.", "error");
        return;
    }

    historyIndex++;
    updateHistoryButtons();
    showToast("Redo history is ready for version snapshots.", "success");
}

function updateHistoryButtons() {
    document.getElementById("undoBtn").disabled = historyIndex <= 0;
    document.getElementById("redoBtn").disabled = historyIndex >= historyStack.length - 1;
}

/* =========================
   Modal helpers
========================= */

function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

/* =========================
   Helpers
========================= */

function typeLabel(type) {
    const item = COMPONENTS.find(component => component.type === type);
    return item?.label || type;
}

function normalizeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;
}

function safeColor(value, fallback) {
    return normalizeColor(value, fallback);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}

function showToast(message, type = "") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.className = "toast";
    }, 3500);
}

function showFatal(message) {
    document.body.innerHTML = `
        <main style="min-height:100vh;display:grid;place-items:center;background:#08080b;color:#fff;padding:30px;font-family:system-ui,sans-serif;">
            <div style="max-width:600px;text-align:center;">
                <div style="font-size:50px;margin-bottom:15px;">根</div>
                <h1 style="font-family:system-ui,sans-serif;">App Builder couldn't start</h1>
                <p style="color:#aaa;line-height:1.6;">${escapeHtml(message)}</p>
                <button onclick="location.reload()" style="border:0;background:#8f6cff;color:white;border-radius:9px;padding:12px 18px;cursor:pointer;">Try again</button>
            </div>
        </main>
    `;
}
