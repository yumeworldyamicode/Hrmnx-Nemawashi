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

/* ================================================================
   V2 EDITOR ENHANCEMENTS
   - debounced editing without input re-render/focus loss
   - custom HTML/CSS/JS sections
   - zoom + canvas panning
   - richer theme/navigation/announcement/ad/footer/domain settings
   - asset drag/drop uploads
   - shop website starter pages
================================================================ */

const V2_COMPONENTS = [
    ...COMPONENTS,
    { type: "custom", label: "Custom Code", icon: "</>" }
];

let canvasZoom = 1;
let canvasPanX = 0;
let canvasPanY = 0;
let isCanvasPanning = false;
let canvasPanStartX = 0;
let canvasPanStartY = 0;
let canvasPanOriginX = 0;
let canvasPanOriginY = 0;
let propertySaveTimer = null;
let designNavigationLinks = [];

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

    document.getElementById("zoomOutBtn").onclick = () => setCanvasZoom(canvasZoom - 0.1);
    document.getElementById("zoomInBtn").onclick = () => setCanvasZoom(canvasZoom + 0.1);
    document.getElementById("zoomResetBtn").onclick = () => setCanvasZoom(1);
    document.getElementById("zoomFitBtn").onclick = fitCanvas;

    setupCanvasPanning();
    renderComponentList();
    setupDesignTabs();
}

function renderComponentList() {
    const list = document.getElementById("componentList");
    list.innerHTML = V2_COMPONENTS.map(component => `
        <button class="component-button" data-component="${component.type}">
            <span class="component-symbol">${escapeHtml(component.icon)}</span>
            <span>${escapeHtml(component.label)}</span>
        </button>
    `).join("");

    list.querySelectorAll("[data-component]").forEach(button => {
        button.addEventListener("click", () => addElement(button.dataset.component));
    });
}

async function createWebsite(event) {
    event.preventDefault();

    const name = document.getElementById("websiteName").value.trim();
    const slug = document.getElementById("websiteSlug").value.trim().toLowerCase();
    const description = document.getElementById("websiteDescription").value.trim();
    const starter = document.getElementById("websiteStarter").value;
    const siteType = document.getElementById("websiteType")?.value || "standard";

    if (!name || !slug) return;

    const { data: website, error } = await supabaseClient
        .from("websites")
        .insert({
            name,
            slug,
            description,
            status: "draft",
            owner_id: currentUser.id,
            site_type: siteType,
            base_path: `/app/${slug}`
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

    const defaultTheme = getDefaultTheme(siteType);
    const { error: themeError } = await supabaseClient.from("website_themes").insert({
        website_id: website.id,
        settings: defaultTheme
    });

    if (themeError) console.error(themeError);

    if (starter === "starter") await createStarterContent(page.id);
    if (siteType === "shop") await createShopPages(website.id);

    closeModal("websiteModal");
    document.getElementById("websiteForm").reset();
    showToast("Website created. Opening builder…", "success");
    window.location.href = `app-builder.html?website=${encodeURIComponent(website.id)}`;
}

function getDefaultTheme(siteType = "standard") {
    return {
        primary: "#8f6cff",
        background: "#ffffff",
        text: "#111111",
        heading: "#111111",
        accent: "#c7b8ff",
        buttonText: "#ffffff",
        backgroundGradient: "",
        buttonGradient: "",
        font: siteType === "shop" ? "Noto Sans JP" : "Inter",
        headingSize: 56,
        bodySize: 16,
        textAlign: "left",
        borderColor: "#dddddd",
        borderWidth: 0,
        borderRadius: 10,
        shadowColor: "#000000",
        shadowX: 0,
        shadowY: 20,
        shadowBlur: 40,
        shadowOpacity: 0.25,
        innerShadow: "",
        navigation: {
            style: "classic",
            logoPosition: "left",
            alignment: "left",
            menuButton: "yes",
            links: [
                { label: "Home", url: "/" },
                { label: "About", url: "/about" },
                { label: "Contact", url: "/contact" }
            ]
        },
        announcement: {
            enabled: false,
            text: "",
            link: "",
            background: "#8f6cff",
            color: "#ffffff"
        },
        ads: {
            enabled: false,
            placement: "footer",
            rotation: "auto"
        },
        footer: {
            enabled: true,
            year: String(new Date().getFullYear()),
            company: "Hrmnx Entertainment",
            alignment: "center",
            text: ""
        },
        logo: null,
        favicon: null
    };
}

async function createShopPages(websiteId) {
    const pages = [
        { name: "Products", slug: "products", template: "shop-products" },
        { name: "Product", slug: "product", template: "shop-product" },
        { name: "Reviews", slug: "reviews", template: "shop-reviews" },
        { name: "Artists", slug: "artists", template: "shop-artists" }
    ];

    const { data: existing } = await supabaseClient.from("website_pages").select("slug").eq("website_id", websiteId);
    const existingSlugs = new Set((existing || []).map(p => p.slug));
    const { data: last } = await supabaseClient.from("website_pages").select("position").eq("website_id", websiteId).order("position", { ascending: false }).limit(1);
    let position = last?.length ? Number(last[0].position) + 1 : 1;

    for (const page of pages) {
        if (existingSlugs.has(page.slug)) continue;
        const { data, error } = await supabaseClient.from("website_pages").insert({
            website_id: websiteId,
            name: page.name,
            slug: page.slug,
            position,
            is_homepage: false,
            page_type: page.template
        }).select().single();
        if (!error && data) {
            position++;
            await createShopTemplateContent(data.id, page.template);
        }
    }
}

async function createShopTemplateContent(pageId, template) {
    const { data: section } = await supabaseClient.from("website_sections").insert({
        page_id: pageId,
        type: "shop",
        position: 0,
        settings: { template }
    }).select().single();
    if (!section) return;

    const content = {
        "shop-products": { heading: "Products", text: "Browse the latest products and releases.", productGrid: true },
        "shop-product": { heading: "Product", text: "Product details, price, options and purchase information.", productDetail: true },
        "shop-reviews": { heading: "Reviews", text: "See what customers and fans are saying.", reviews: true },
        "shop-artists": { heading: "Artists", text: "Discover artists and their products.", artistGrid: true }
    }[template] || {};

    await supabaseClient.from("website_elements").insert({
        section_id: section.id,
        type: "heading",
        position: 0,
        settings: { text: content.heading || "Shop" }
    });
    await supabaseClient.from("website_elements").insert({
        section_id: section.id,
        type: "text",
        position: 1,
        settings: { text: content.text || "" }
    });
}

async function addElement(type) {
    if (!currentPage) {
        showToast("Create or select a page first.", "error");
        return;
    }

    let section = null;
    const { data: existingSections, error } = await supabaseClient
        .from("website_sections").select("*").eq("page_id", currentPage.id).order("position", { ascending: false }).limit(1);
    if (error) { showToast(error.message, "error"); return; }
    section = existingSections?.[0];

    if (!section || type === "hero" || type === "custom") {
        const { data: maxSections } = await supabaseClient.from("website_sections").select("position").eq("page_id", currentPage.id).order("position", { ascending: false }).limit(1);
        const position = maxSections?.length ? Number(maxSections[0].position) + 1 : 0;
        const { data: newSection, error: sectionError } = await supabaseClient.from("website_sections").insert({
            page_id: currentPage.id,
            type: type === "hero" ? "hero" : (type === "custom" ? "custom" : "content"),
            position,
            settings: {}
        }).select().single();
        if (sectionError) { showToast(sectionError.message, "error"); return; }
        section = newSection;
    }

    const defaults = {
        hero: { heading: "Your headline", text: "Tell visitors what your website is about.", buttonText: "Learn more", buttonUrl: "#" },
        heading: { text: "New heading" },
        text: { text: "Start writing your content here." },
        button: { text: "Button", url: "#" },
        image: { src: "", alt: "Website image" },
        spacer: { height: 90 },
        custom: {
            html: '<div class="custom-block"><h2>Custom section</h2><p>Edit the HTML, CSS and JavaScript from the properties panel.</p></div>',
            css: '.custom-block{padding:60px;text-align:center;background:#f3f3f3;border-radius:16px}.custom-block h2{margin:0 0 10px}',
            js: 'console.log("Nemawashi custom section loaded");'
        }
    };

    const { data: maxElements } = await supabaseClient.from("website_elements").select("position").eq("section_id", section.id).order("position", { ascending: false }).limit(1);
    const position = maxElements?.length ? Number(maxElements[0].position) + 1 : 0;
    const { data: element, error: elementError } = await supabaseClient.from("website_elements").insert({
        section_id: section.id, type, position, settings: defaults[type] || {}
    }).select().single();
    if (elementError) { showToast(elementError.message, "error"); return; }

    selectedElement = element;
    recordHistory();
    await renderCurrentPage();
    updatePropertiesPanel();
    showToast(`${typeLabel(type)} added.`, "success");
}

function createElementNode(element) {
    const wrapper = document.createElement("div");
    wrapper.className = `canvas-element ${selectedElement && selectedElement.id === element.id ? "selected" : ""}`;
    wrapper.dataset.elementId = element.id;
    const settings = element.settings || {};

    if (element.type === "custom") {
        const iframe = document.createElement("iframe");
        iframe.className = "custom-code-preview";
        iframe.sandbox = "allow-scripts";
        iframe.srcdoc = buildCustomSrcdoc(settings);
        iframe.title = "Custom code section";
        wrapper.appendChild(iframe);
    } else if (element.type === "hero") {
        wrapper.innerHTML = `<div class="render-hero"><h1>${escapeHtml(settings.heading || "Your headline")}</h1><p>${escapeHtml(settings.text || "Add a powerful introduction to your website.")}</p>${settings.buttonText ? `<div><button style="border:0;background:${safeColor(currentTheme.buttonText,'#fff')};color:${safeColor(currentTheme.text,'#111')};padding:13px 22px;border-radius:${Number(currentTheme.borderRadius)||8}px;">${escapeHtml(settings.buttonText)}</button></div>` : ""}</div>`;
    } else if (element.type === "heading") {
        wrapper.innerHTML = `<div class="render-heading"><h2>${escapeHtml(settings.text || "Heading")}</h2></div>`;
    } else if (element.type === "text") {
        wrapper.innerHTML = `<div class="render-text"><p>${escapeHtml(settings.text || "Write something here.")}</p></div>`;
    } else if (element.type === "button") {
        wrapper.innerHTML = `<div class="render-button"><button>${escapeHtml(settings.text || "Button")}</button></div>`;
    } else if (element.type === "image") {
        wrapper.innerHTML = settings.src ? `<div class="render-image"><img src="${escapeAttr(settings.src)}" alt="${escapeAttr(settings.alt || "")}"></div>` : `<div class="render-image image-placeholder"><span>Drop an image here or use Assets</span></div>`;
    } else if (element.type === "spacer") {
        wrapper.innerHTML = `<div class="render-spacer" style="height:${Number(settings.height)||90}px"></div>`;
    }

    const controls = document.createElement("div");
    controls.className = "element-control";
    controls.innerHTML = `<button title="Move up">↑</button><button title="Move down">↓</button><button title="Delete">×</button>`;
    controls.children[0].onclick = e => { e.stopPropagation(); moveElement(element, -1); };
    controls.children[1].onclick = e => { e.stopPropagation(); moveElement(element, 1); };
    controls.children[2].onclick = e => { e.stopPropagation(); deleteElement(element); };
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

function buildCustomSrcdoc(settings = {}) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${settings.css || ""}</style></head><body>${settings.html || ""}<script>${settings.js || ""}<\/script></body></html>`;
}

function updatePropertiesPanel() {
    const panel = document.getElementById("propertiesPanel");
    if (!selectedElement) {
        panel.innerHTML = `<div class="properties-empty"><div class="properties-empty-icon">◇</div><h3>Select something</h3><p>Choose a component on the canvas to edit its content and appearance.</p></div>`;
        return;
    }

    const settings = selectedElement.settings || {};
    let fields = "";

    if (selectedElement.type === "custom") {
        fields = `<div class="code-tabs"><button class="code-tab active" data-code-tab="html">HTML</button><button class="code-tab" data-code-tab="css">CSS</button><button class="code-tab" data-code-tab="js">JavaScript</button></div>
        <div class="code-editor-panel active" data-code-panel="html"><textarea class="code-editor" data-code-property="html" spellcheck="false">${escapeHtml(settings.html || "")}</textarea></div>
        <div class="code-editor-panel" data-code-panel="css"><textarea class="code-editor" data-code-property="css" spellcheck="false">${escapeHtml(settings.css || "")}</textarea></div>
        <div class="code-editor-panel" data-code-panel="js"><textarea class="code-editor" data-code-property="js" spellcheck="false">${escapeHtml(settings.js || "")}</textarea></div>`;
    } else if (selectedElement.type === "hero") {
        fields = propertyInputV2("heading", "Heading", settings.heading || "", "text") + propertyTextareaV2("text", "Text", settings.text || "") + propertyInputV2("buttonText", "Button text", settings.buttonText || "", "text") + propertyInputV2("buttonUrl", "Button URL", settings.buttonUrl || "", "text");
    } else if (selectedElement.type === "heading") {
        fields = propertyInputV2("text", "Heading", settings.text || "", "text");
    } else if (selectedElement.type === "text") {
        fields = propertyTextareaV2("text", "Text", settings.text || "");
    } else if (selectedElement.type === "button") {
        fields = propertyInputV2("text", "Button text", settings.text || "", "text") + propertyInputV2("url", "Link URL", settings.url || "", "text");
    } else if (selectedElement.type === "image") {
        fields = propertyInputV2("src", "Image URL", settings.src || "", "text") + propertyInputV2("alt", "Alt text", settings.alt || "", "text");
    } else if (selectedElement.type === "spacer") {
        fields = propertyInputV2("height", "Height (px)", settings.height || 90, "number");
    }

    panel.innerHTML = `<div class="property-group"><div class="property-group-title">${escapeHtml(typeLabel(selectedElement.type))}</div>${fields}</div>`;

    panel.querySelectorAll("[data-property]").forEach(input => {
        input.addEventListener("input", () => {
            const key = input.dataset.property;
            selectedElement.settings = { ...(selectedElement.settings || {}), [key]: input.type === "number" ? Number(input.value) : input.value };
            updateSelectedCanvasPreviewOnly();
            schedulePropertySave();
        });
    });

    panel.querySelectorAll("[data-code-property]").forEach(input => {
        input.addEventListener("input", () => {
            const key = input.dataset.codeProperty;
            selectedElement.settings = { ...(selectedElement.settings || {}), [key]: input.value };
            updateSelectedCanvasPreviewOnly();
            schedulePropertySave();
        });
    });

    panel.querySelectorAll("[data-code-tab]").forEach(tab => {
        tab.addEventListener("click", () => {
            panel.querySelectorAll("[data-code-tab]").forEach(t => t.classList.toggle("active", t === tab));
            panel.querySelectorAll("[data-code-panel]").forEach(p => p.classList.toggle("active", p.dataset.codePanel === tab.dataset.codeTab));
        });
    });
}

function propertyInputV2(key, label, value, type="text") {
    return `<div class="property-field"><label>${escapeHtml(label)}</label><input data-property="${escapeAttr(key)}" type="${type}" value="${escapeAttr(value)}"></div>`;
}
function propertyTextareaV2(key, label, value) {
    return `<div class="property-field"><label>${escapeHtml(label)}</label><textarea data-property="${escapeAttr(key)}">${escapeHtml(value)}</textarea></div>`;
}

function updateSelectedCanvasPreviewOnly() {
    if (!currentPage || !selectedElement) return;
    const node = document.querySelector(`[data-element-id="${CSS.escape(selectedElement.id)}"]`);
    if (!node) return;
    const fresh = createElementNode(selectedElement);
    node.replaceWith(fresh);
}

function schedulePropertySave() {
    document.getElementById("saveStatus").textContent = "Unsaved changes";
    clearTimeout(propertySaveTimer);
    clearTimeout(saveTimer);
    propertySaveTimer = setTimeout(async () => {
        await persistSelectedElement();
    }, 900);
}

async function persistSelectedElement() {
    if (!selectedElement) return;
    document.getElementById("saveStatus").textContent = "Saving…";
    const { error } = await supabaseClient.from("website_elements").update({
        settings: selectedElement.settings || {},
        updated_at: new Date().toISOString()
    }).eq("id", selectedElement.id);
    if (error) {
        console.error(error);
        document.getElementById("saveStatus").textContent = "Save failed";
        return;
    }
    document.getElementById("saveStatus").textContent = "Saved";
}

function setupDesignTabs() {
    document.querySelectorAll("[data-design-tab]").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("[data-design-tab]").forEach(t => t.classList.toggle("active", t === tab));
            document.querySelectorAll("[data-design-panel]").forEach(p => p.classList.toggle("active", p.dataset.designPanel === tab.dataset.designTab));
        });
    });
}

async function openThemeEditor() {
    currentTheme = { ...getDefaultTheme(currentWebsite?.site_type || "standard"), ...(currentTheme || {}) };
    const nav = currentTheme.navigation || getDefaultTheme().navigation;
    designNavigationLinks = Array.isArray(nav.links) ? [...nav.links] : [];

    setValue("themePrimary", currentTheme.primary, "#8f6cff");
    setValue("themeBackground", currentTheme.background, "#ffffff");
    setValue("themeText", currentTheme.text, "#111111");
    setValue("themeAccent", currentTheme.accent, "#c7b8ff");
    setValue("themeHeading", currentTheme.heading, "#111111");
    setValue("themeButtonText", currentTheme.buttonText, "#ffffff");
    setValue("themeBackgroundGradient", currentTheme.backgroundGradient, "");
    setValue("themeButtonGradient", currentTheme.buttonGradient, "");
    setValue("themeFont", currentTheme.font, "Inter");
    setValue("themeHeadingSize", currentTheme.headingSize, 56);
    setValue("themeBodySize", currentTheme.bodySize, 16);
    setValue("themeTextAlign", currentTheme.textAlign, "left");
    setValue("themeBorderColor", currentTheme.borderColor, "#dddddd");
    setValue("themeBorderWidth", currentTheme.borderWidth, 0);
    setValue("themeBorderRadius", currentTheme.borderRadius, 10);
    setValue("themeShadowColor", currentTheme.shadowColor, "#000000");
    setValue("themeShadowX", currentTheme.shadowX, 0);
    setValue("themeShadowY", currentTheme.shadowY, 20);
    setValue("themeShadowBlur", currentTheme.shadowBlur, 40);
    setValue("themeShadowOpacity", currentTheme.shadowOpacity, 0.25);
    setValue("themeInnerShadow", currentTheme.innerShadow, "");

    setValue("navStyle", nav.style, "classic"); setValue("navLogoPosition", nav.logoPosition, "left"); setValue("navAlignment", nav.alignment, "left"); setValue("navMenuButton", nav.menuButton, "yes");
    setValue("announcementEnabled", !!currentTheme.announcement?.enabled, false, true);
    setValue("announcementText", currentTheme.announcement?.text, ""); setValue("announcementLink", currentTheme.announcement?.link, ""); setValue("announcementBackground", currentTheme.announcement?.background, "#8f6cff"); setValue("announcementColor", currentTheme.announcement?.color, "#ffffff");
    setValue("adsEnabled", !!currentTheme.ads?.enabled, false, true); setValue("adPlacement", currentTheme.ads?.placement, "footer"); setValue("adRotation", currentTheme.ads?.rotation, "auto");
    setValue("footerEnabled", currentTheme.footer?.enabled === false ? "no" : "yes", "yes"); setValue("footerYear", currentTheme.footer?.year, String(new Date().getFullYear())); setValue("footerCompany", currentTheme.footer?.company, "Hrmnx Entertainment"); setValue("footerAlignment", currentTheme.footer?.alignment, "center"); setValue("footerText", currentTheme.footer?.text, "");
    setValue("customDomain", currentWebsite.domain, ""); setValue("domainStatus", currentTheme.domainStatus || "not_connected", "not_connected");
    document.getElementById("baseWebsiteUrl").textContent = `https://nemawashi.hrmnx.site/app/${currentWebsite.slug}`;

    renderNavigationLinksEditor();
    renderAssetList();

    document.getElementById("saveDesignBtn").onclick = saveDesignSettings;
    document.getElementById("addNavLinkBtn").onclick = () => { designNavigationLinks.push({label:"New link",url:"/"}); renderNavigationLinksEditor(); };
    document.getElementById("chooseAssetBtn").onclick = () => document.getElementById("assetFileInput").click();
    document.getElementById("assetFileInput").onchange = e => uploadAssets(e.target.files);
    setupAssetDropzone();
    document.getElementById("verifyDomainBtn").onclick = verifyCname;

    openModal("themeModal");
}

function setValue(id, value, fallback, checked=false) {
    const el = document.getElementById(id); if (!el) return;
    if (checked) el.checked = Boolean(value);
    else el.value = value ?? fallback;
}

function renderNavigationLinksEditor() {
    const box = document.getElementById("navigationLinksEditor");
    box.innerHTML = designNavigationLinks.map((link,index) => `<div class="nav-link-row"><input data-nav-label="${index}" value="${escapeAttr(link.label || "")}" placeholder="Label"><input data-nav-url="${index}" value="${escapeAttr(link.url || "")}" placeholder="/url"><button type="button" data-nav-remove="${index}">×</button></div>`).join("");
    box.querySelectorAll("[data-nav-label]").forEach(input => input.oninput = () => { designNavigationLinks[Number(input.dataset.navLabel)].label = input.value; });
    box.querySelectorAll("[data-nav-url]").forEach(input => input.oninput = () => { designNavigationLinks[Number(input.dataset.navUrl)].url = input.value; });
    box.querySelectorAll("[data-nav-remove]").forEach(btn => btn.onclick = () => { designNavigationLinks.splice(Number(btn.dataset.navRemove),1); renderNavigationLinksEditor(); });
}

async function saveDesignSettings() {
    const read = id => document.getElementById(id)?.value;
    currentTheme = {
        ...currentTheme,
        primary: read("themePrimary"), background: read("themeBackground"), text: read("themeText"), accent: read("themeAccent"), heading: read("themeHeading"), buttonText: read("themeButtonText"),
        backgroundGradient: read("themeBackgroundGradient"), buttonGradient: read("themeButtonGradient"), font: read("themeFont"), headingSize: Number(read("themeHeadingSize")), bodySize: Number(read("themeBodySize")), textAlign: read("themeTextAlign"),
        borderColor: read("themeBorderColor"), borderWidth: Number(read("themeBorderWidth")), borderRadius: Number(read("themeBorderRadius")), shadowColor: read("themeShadowColor"), shadowX: Number(read("themeShadowX")), shadowY: Number(read("themeShadowY")), shadowBlur: Number(read("themeShadowBlur")), shadowOpacity: Number(read("themeShadowOpacity")), innerShadow: read("themeInnerShadow"),
        navigation: { style: read("navStyle"), logoPosition: read("navLogoPosition"), alignment: read("navAlignment"), menuButton: read("navMenuButton"), links: designNavigationLinks },
        announcement: { enabled: document.getElementById("announcementEnabled").checked, text: read("announcementText"), link: read("announcementLink"), background: read("announcementBackground"), color: read("announcementColor") },
        ads: { enabled: document.getElementById("adsEnabled").checked, placement: read("adPlacement"), rotation: read("adRotation") },
        footer: { enabled: read("footerEnabled") !== "no", year: read("footerYear"), company: read("footerCompany"), alignment: read("footerAlignment"), text: read("footerText") },
        domainStatus: read("domainStatus")
    };

    const customDomain = read("customDomain")?.trim() || null;
    const { data, error } = await supabaseClient.from("website_themes").upsert({ website_id: currentWebsite.id, settings: currentTheme }, { onConflict: "website_id" }).select().single();
    if (error) { showToast(error.message, "error"); return; }
    const { data: updated, error: websiteError } = await supabaseClient.from("websites").update({ domain: customDomain, updated_at: new Date().toISOString() }).eq("id", currentWebsite.id).select().single();
    if (websiteError) { showToast(websiteError.message, "error"); return; }
    currentWebsite = updated;
    closeModal("themeModal");
    applyThemeToCanvas();
    await renderCurrentPage();
    showToast("Design settings saved.", "success");
}

function applyThemeToCanvas() {
    const canvas = document.getElementById("websiteCanvas"); if (!canvas) return;
    canvas.style.background = currentTheme.backgroundGradient || currentTheme.background || "#fff";
    canvas.style.color = currentTheme.text || "#111";
    canvas.style.fontFamily = `'${currentTheme.font || "Inter"}', system-ui, sans-serif`;
    canvas.style.textAlign = currentTheme.textAlign || "left";
    loadGoogleFont(currentTheme.font || "Inter");
}

function loadGoogleFont(font) {
    const id = "nemawashi-google-font";
    let link = document.getElementById(id);
    if (!link) { link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; document.head.appendChild(link); }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,"+")}:wght@400;500;600;700&display=swap`;
}

function setupAssetDropzone() {
    const zone = document.getElementById("assetDropzone"); if (!zone) return;
    zone.ondragover = e => { e.preventDefault(); zone.classList.add("dragover"); };
    zone.ondragleave = () => zone.classList.remove("dragover");
    zone.ondrop = e => { e.preventDefault(); zone.classList.remove("dragover"); uploadAssets(e.dataTransfer.files); };
}

async function uploadAssets(files) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");
        const path = `app/${currentWebsite.slug}/images/${Date.now()}-${safeName}`;
        const { error } = await supabaseClient.storage.from("website-assets").upload(path, file, { upsert: false, contentType: file.type });
        if (error) { showToast(`Upload failed: ${error.message}`, "error"); continue; }
        const { data } = supabaseClient.storage.from("website-assets").getPublicUrl(path);
        currentTheme.assets = [...(currentTheme.assets || []), { name: file.name, path, url: data.publicUrl }];
    }
    await supabaseClient.from("website_themes").upsert({ website_id: currentWebsite.id, settings: currentTheme }, { onConflict:"website_id" });
    renderAssetList();
    showToast("Assets uploaded.", "success");
}

function renderAssetList() {
    const box = document.getElementById("assetList"); if (!box) return;
    const assets = currentTheme.assets || [];
    box.innerHTML = assets.map((asset,index) => `<div class="asset-row"><img src="${escapeAttr(asset.url)}" alt=""><div><strong>${escapeHtml(asset.name)}</strong><code>${escapeHtml(asset.path)}</code></div><button type="button" data-asset-remove="${index}">×</button></div>`).join("");
    box.querySelectorAll("[data-asset-remove]").forEach(btn => btn.onclick = async () => { (currentTheme.assets || []).splice(Number(btn.dataset.assetRemove),1); await supabaseClient.from("website_themes").upsert({website_id:currentWebsite.id,settings:currentTheme},{onConflict:"website_id"}); renderAssetList(); });
}

async function verifyCname() {
    const domain = document.getElementById("customDomain")?.value.trim();
    if (!domain) { showToast("Enter a custom domain first.", "error"); return; }
    showToast("Checking DNS…", "success");
    try {
        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`, {headers:{accept:"application/dns-json"}});
        const result = await response.json();
        const cname = (result.Answer || []).map(a => String(a.data || "").replace(/\.$/,"")).find(Boolean);
        if (cname && cname === "nemawashi.hrmnx.site") {
            document.getElementById("domainStatus").value = "verified";
            showToast("CNAME verified. HTTPS still needs to be provisioned by the hosting layer.", "success");
        } else if (cname) {
            showToast(`CNAME currently points to ${cname}. Expected nemawashi.hrmnx.site.`, "error");
        } else {
            showToast("No CNAME record was found yet. DNS may still be propagating.", "error");
        }
    } catch (error) {
        console.error(error);
        showToast("DNS lookup could not be completed from the browser.", "error");
    }
}

function setupCanvasPanning() {
    const viewport = document.getElementById("canvasViewport"); if (!viewport) return;
    viewport.addEventListener("pointerdown", e => {
        if (!(e.button === 1 || e.button === 0 && (e.shiftKey || e.altKey))) return;
        isCanvasPanning = true; viewport.setPointerCapture(e.pointerId);
        canvasPanStartX = e.clientX; canvasPanStartY = e.clientY; canvasPanOriginX = canvasPanX; canvasPanOriginY = canvasPanY;
        viewport.classList.add("panning");
    });
    viewport.addEventListener("pointermove", e => {
        if (!isCanvasPanning) return;
        canvasPanX = canvasPanOriginX + (e.clientX - canvasPanStartX);
        canvasPanY = canvasPanOriginY + (e.clientY - canvasPanStartY);
        applyCanvasTransform();
    });
    viewport.addEventListener("pointerup", () => { isCanvasPanning = false; viewport.classList.remove("panning"); });
    viewport.addEventListener("wheel", e => {
        if (e.ctrlKey) { e.preventDefault(); setCanvasZoom(canvasZoom + (e.deltaY < 0 ? .05 : -.05)); }
    }, {passive:false});
}

function setCanvasZoom(value) {
    canvasZoom = Math.max(.35, Math.min(2, Math.round(value * 20) / 20));
    document.getElementById("zoomResetBtn").textContent = `${Math.round(canvasZoom*100)}%`;
    applyCanvasTransform();
}
function applyCanvasTransform() {
    const stage = document.getElementById("canvasStage"); if (!stage) return;
    stage.style.transform = `translate(${canvasPanX}px,${canvasPanY}px) scale(${canvasZoom})`;
}
function fitCanvas() {
    canvasZoom = 1; canvasPanX = 0; canvasPanY = 0; applyCanvasTransform(); document.getElementById("zoomResetBtn").textContent="100%";
}

async function buildPreviewHTML() {
    const { data: pages } = await supabaseClient.from("website_pages").select("*").eq("website_id", currentWebsite.id).order("position");
    const page = currentPage || pages?.[0];
    if (!page) return "<!doctype html><html><body></body></html>";
    const { data: sections } = await supabaseClient.from("website_sections").select("*").eq("page_id", page.id).order("position");
    const ids=(sections||[]).map(s=>s.id); let elements=[];
    if(ids.length){const r=await supabaseClient.from("website_elements").select("*").in("section_id",ids).order("position"); elements=r.data||[];}
    const body=(sections||[]).map(s=>(elements.filter(e=>e.section_id===s.id).sort((a,b)=>a.position-b.position).map(renderPublicElementV2).join(""))).join("");
    const nav = currentTheme.navigation || {};
    const navHtml = `<nav class="site-nav"><div class="nav-inner"><a class="brand-link" href="/">${escapeHtml(currentWebsite.name)}</a><div class="nav-links">${(nav.links||[]).map(l=>`<a href="${escapeAttr(l.url||"#")}">${escapeHtml(l.label||"")}</a>`).join("")}</div></div></nav>`;
    const announcement = currentTheme.announcement?.enabled ? `<div class="announcement"><a href="${escapeAttr(currentTheme.announcement.link||"#")}">${escapeHtml(currentTheme.announcement.text||"")}</a></div>` : "";
    const footer = currentTheme.footer?.enabled !== false ? `<footer>© ${escapeHtml(currentTheme.footer?.year || new Date().getFullYear())} ${escapeHtml(currentTheme.footer?.company || "Hrmnx Entertainment")}. ${escapeHtml(currentTheme.footer?.text || "All rights reserved.")}</footer>` : "";
    return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(currentWebsite.name)}</title><link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(currentTheme.font||"Inter").replace(/%20/g,"+")}:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${buildPublicCSSV2()}</style></head><body>${announcement}${navHtml}${body}${footer}</body></html>`;
}

function renderPublicElementV2(element){
    const s=element.settings||{};
    if(element.type==="custom") return `<section class="custom-public">${s.html||""}<style>${s.css||""}</style><script>${s.js||""}<\/script></section>`;
    if(element.type==="hero") return `<section class="hero"><h1>${escapeHtml(s.heading||"Your headline")}</h1><p>${escapeHtml(s.text||"")}</p>${s.buttonText?`<a class="cta-button" href="${escapeAttr(s.buttonUrl||"#")}">${escapeHtml(s.buttonText)}</a>`:""}</section>`;
    if(element.type==="heading") return `<section class="heading"><h2>${escapeHtml(s.text||"Heading")}</h2></section>`;
    if(element.type==="text") return `<section class="text"><p>${escapeHtml(s.text||"")}</p></section>`;
    if(element.type==="button") return `<section class="cta"><a class="cta-button" href="${escapeAttr(s.url||"#")}">${escapeHtml(s.text||"Button")}</a></section>`;
    if(element.type==="image") return s.src?`<section class="image"><img src="${escapeAttr(s.src)}" alt="${escapeAttr(s.alt||"")}"></section>`:"";
    if(element.type==="spacer") return `<div style="height:${Number(s.height)||90}px"></div>`;
    return "";
}

function buildPublicCSSV2(){
    const t=currentTheme||{};
    const shadow=`${Number(t.shadowX)||0}px ${Number(t.shadowY)||20}px ${Number(t.shadowBlur)||40}px ${hexToRgba(t.shadowColor||"#000000",Number(t.shadowOpacity??.25))}`;
    return `*{box-sizing:border-box}body{margin:0;background:${safeColor(t.background,"#fff")};color:${safeColor(t.text,"#111")};font-family:'${String(t.font||"Inter").replace(/'/g,"")}',system-ui,sans-serif;font-size:${Number(t.bodySize)||16}px;text-align:${t.textAlign||"left"}}.announcement{padding:10px 20px;text-align:center;background:${safeColor(t.announcement?.background,"#8f6cff")};color:${safeColor(t.announcement?.color,"#fff")}}.announcement a{color:inherit}.site-nav{position:relative;z-index:5;border-bottom:${Number(t.borderWidth)||0}px solid ${safeColor(t.borderColor,"#ddd")};box-shadow:${shadow}}.nav-inner{min-height:70px;padding:0 6%;display:flex;align-items:center;justify-content:space-between}.brand-link{font-weight:700;color:inherit;text-decoration:none}.nav-links{display:flex;gap:24px;align-items:center}.nav-links a{color:inherit;text-decoration:none}.hero{min-height:430px;padding:80px 8%;display:flex;flex-direction:column;justify-content:center;background:${t.backgroundGradient||"linear-gradient(135deg,#17121f,#3a245d)"};color:#fff}.hero h1{max-width:850px;margin:0 0 18px;font-size:${Number(t.headingSize)||56}px;line-height:.98;letter-spacing:-.045em}.hero p{max-width:680px;line-height:1.7;opacity:.82}.cta-button{display:inline-block;margin-top:12px;padding:13px 22px;border:${Number(t.borderWidth)||0}px solid ${safeColor(t.borderColor,"transparent")};border-radius:${Number(t.borderRadius)||10}px;color:${safeColor(t.buttonText,"#fff")};background:${t.buttonGradient||safeColor(t.primary,"#8f6cff")};box-shadow:${shadow};text-decoration:none}.heading{padding:60px 8% 15px}.heading h2{font-size:${Math.min(Number(t.headingSize)||56,120)}px;color:${safeColor(t.heading,"#111")};margin:0;letter-spacing:-.04em}.text{padding:10px 8% 45px}.text p{max-width:760px;line-height:1.8}.cta{padding:20px 8% 55px}.image{padding:25px 8%}.image img{width:100%;max-height:600px;object-fit:cover;border-radius:${Number(t.borderRadius)||10}px}.custom-public{width:100%}footer{padding:35px 6%;text-align:${t.footer?.alignment||"center"};border-top:1px solid ${safeColor(t.borderColor,"#ddd")};font-size:13px}`;
}

function hexToRgba(hex, opacity){
    const h=String(hex||"").replace("#",""); if(!/^[0-9a-f]{6}$/i.test(h)) return `rgba(0,0,0,${opacity})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${opacity})`;
}

function typeLabel(type){ return (V2_COMPONENTS.find(c=>c.type===type)?.label)||type; }

/* Render the site chrome inside the editor as well as the page content. */
async function renderCurrentPage() {
    if (!currentPage) return;
    document.getElementById("canvasPageName").textContent = currentPage.name;

    const { data: sections, error: sectionsError } = await supabaseClient.from("website_sections").select("*").eq("page_id", currentPage.id).order("position");
    if (sectionsError) { showToast(sectionsError.message, "error"); return; }

    const ids=(sections||[]).map(s=>s.id); let elements=[];
    if(ids.length){ const r=await supabaseClient.from("website_elements").select("*").in("section_id",ids).order("position"); if(r.error){showToast(r.error.message,"error");return;} elements=r.data||[]; }

    const canvas=document.getElementById("websiteCanvas"); canvas.innerHTML="";

    if(currentTheme.announcement?.enabled){
        const ann=document.createElement("div"); ann.className="editor-site-announcement"; ann.textContent=currentTheme.announcement.text||"Announcement"; canvas.appendChild(ann);
    }
    const nav=document.createElement("div"); nav.className="editor-site-nav"; nav.innerHTML=`<strong>${escapeHtml(currentWebsite.name)}</strong><div>${(currentTheme.navigation?.links||[]).map(l=>`<span>${escapeHtml(l.label||"")}</span>`).join("")}</div>`; canvas.appendChild(nav);

    for(const section of (sections||[])){
        const sectionEl=document.createElement("section"); sectionEl.className="canvas-section"; sectionEl.dataset.sectionId=section.id;
        elements.filter(e=>e.section_id===section.id).sort((a,b)=>a.position-b.position).forEach(e=>sectionEl.appendChild(createElementNode(e)));
        canvas.appendChild(sectionEl);
    }
    if(!sections?.length){
        const empty=document.createElement("div"); empty.className="empty-canvas-message"; empty.style.cssText="min-height:520px;display:grid;place-items:center;color:#999;text-align:center;padding:30px;"; empty.innerHTML='<div><div style="font-size:42px;margin-bottom:12px">＋</div><h2 style="color:#222;margin:0 0 7px">Start building</h2><p style="font-family:system-ui,sans-serif;font-weight:400">Choose a component from the left sidebar.</p></div>'; canvas.appendChild(empty);
    }
    if(currentTheme.footer?.enabled!==false){
        const footer=document.createElement("div"); footer.className="editor-site-footer"; footer.textContent=`© ${currentTheme.footer?.year||new Date().getFullYear()} ${currentTheme.footer?.company||"Hrmnx Entertainment"}.`; canvas.appendChild(footer);
    }
    applyThemeToCanvas();
    updatePropertiesPanel();
    applyCanvasTransform();
}
