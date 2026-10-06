let supabaseClient;
let currentUser = null;
let currentWebsite = null;
let currentPage = null;
let selectedElement = null;
let activeDevice = "desktop";
let historyStack = [];
let historyIndex = -1;
let saveTimer = null;

const COMPONENTS = [
    { type: "hero", icon: "✦", name: "Hero", description: "Large introduction section" },
    { type: "heading", icon: "T", name: "Heading", description: "Large title text" },
    { type: "text", icon: "≡", name: "Text", description: "Paragraph or description" },
    { type: "button", icon: "↗", name: "Button", description: "Clickable call to action" },
    { type: "image", icon: "▧", name: "Image", description: "Image block" },
    { type: "spacer", icon: "↕", name: "Spacer", description: "Add vertical space" }
];

document.addEventListener("DOMContentLoaded", initializeBuilder);

async function initializeBuilder() {
    if (typeof window.supabase === "undefined") {
        showFatal("Supabase library could not be loaded.");
        return;
    }

    if (typeof window.supabaseClient !== "undefined") {
        supabaseClient = window.supabaseClient;
    }

    if (!supabaseClient && typeof createClient !== "undefined") {
        supabaseClient = window.supabaseClient;
    }

    if (!supabaseClient) {
        showFatal("supabase.js did not create supabaseClient.");
        return;
    }

    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) {
        window.location.href = "logsignin.html";
        return;
    }

    currentUser = data.session.user;
    bindUI();
    renderComponentList();
    await loadWebsiteOrWelcome();
}

function showFatal(message) {
    document.body.innerHTML = `<div style="padding:40px;color:white;background:#09090c;font-family:system-ui"><h2>Nemawashi Website Builder</h2><p>${escapeHtml(message)}</p></div>`;
}

function bindUI() {
    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "messages.html";
    });

    document.querySelectorAll(".panel-tab").forEach(button => {
        button.addEventListener("click", () => switchLeftTab(button.dataset.leftTab));
    });

    document.querySelectorAll(".device-button").forEach(button => {
        button.addEventListener("click", () => setDevice(button.dataset.device));
    });

    document.getElementById("addPageButton").addEventListener("click", () => {
        document.getElementById("pageModal").classList.remove("hidden");
        document.getElementById("newPageName").focus();
    });

    document.getElementById("cancelPageButton").addEventListener("click", closePageModal);
    document.getElementById("createPageButton").addEventListener("click", createPage);

    document.getElementById("createWebsiteButton").addEventListener("click", createWebsite);
    document.getElementById("openExistingButton").addEventListener("click", openExistingWebsite);

    document.getElementById("undoButton").addEventListener("click", undo);
    document.getElementById("redoButton").addEventListener("click", redo);

    document.getElementById("previewButton").addEventListener("click", openPreview);
    document.getElementById("closePreviewButton").addEventListener("click", () => {
        document.getElementById("previewOverlay").classList.add("hidden");
    });

    document.getElementById("publishButton").addEventListener("click", publishWebsite);
}

async function loadWebsiteOrWelcome() {
    const params = new URLSearchParams(window.location.search);
    const websiteId = params.get("website");

    if (websiteId) {
        const { data, error } = await supabaseClient
            .from("websites")
            .select("*")
            .eq("id", websiteId)
            .single();

        if (!error && data) {
            await openWebsite(data);
            return;
        }
    }

    const { data, error } = await supabaseClient
        .from("websites")
        .select("*")
        .eq("owner_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (!error && data && data.length) {
        await openWebsite(data[0]);
        return;
    }

    document.getElementById("welcomeOverlay").classList.remove("hidden");
}

async function createWebsite() {
    const nameInput = document.getElementById("newWebsiteName");
    const slugInput = document.getElementById("newWebsiteSlug");

    const name = nameInput.value.trim();
    const slug = (slugInput.value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));

    if (!name || !slug) {
        alert("Please enter a website name.");
        return;
    }

    setSaveStatus("Creating...");

    const { data: website, error } = await supabaseClient
        .from("websites")
        .insert({
            name,
            slug,
            owner_id: currentUser.id,
            status: "draft"
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        alert("Website could not be created: " + error.message);
        setSaveStatus("Error");
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
        alert("Website created, but the Home page could not be created: " + pageError.message);
        return;
    }

    await supabaseClient.from("website_themes").insert({
        website_id: website.id,
        settings: defaultTheme()
    });

    const { data: section, error: sectionError } = await supabaseClient
        .from("website_sections")
        .insert({
            page_id: page.id,
            type: "hero",
            position: 0,
            settings: {
                background: "#f0f0f3",
                padding: 80
            }
        })
        .select()
        .single();

    if (!sectionError && section) {
        await supabaseClient.from("website_elements").insert([
            {
                section_id: section.id,
                type: "heading",
                position: 0,
                settings: {
                    text: name,
                    fontSize: 56,
                    color: "#17171b",
                    align: "left"
                }
            },
            {
                section_id: section.id,
                type: "text",
                position: 1,
                settings: {
                    text: "Welcome to your new website.",
                    fontSize: 18,
                    color: "#55555f",
                    align: "left"
                }
            },
            {
                section_id: section.id,
                type: "button",
                position: 2,
                settings: {
                    text: "Get started",
                    background: "#17171b",
                    color: "#ffffff",
                    href: "#"
                }
            }
        ]);
    }

    document.getElementById("welcomeOverlay").classList.add("hidden");
    await openWebsite(website);
}

async function openExistingWebsite() {
    const { data, error } = await supabaseClient
        .from("websites")
        .select("*")
        .eq("owner_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error || !data.length) {
        alert("No websites have been created yet.");
        return;
    }

    document.getElementById("welcomeOverlay").classList.add("hidden");
    await openWebsite(data[0]);
}

async function openWebsite(website) {
    currentWebsite = website;
    document.getElementById("siteName").textContent = website.name;

    const { data: pages, error } = await supabaseClient
        .from("website_pages")
        .select("*")
        .eq("website_id", website.id)
        .order("position");

    if (error) {
        alert(error.message);
        return;
    }

    renderPages(pages || []);

    currentPage = pages?.find(page => page.is_homepage) || pages?.[0] || null;

    if (!currentPage) {
        await createDefaultPage();
        return;
    }

    await loadPage(currentPage.id);
}

async function createDefaultPage() {
    const { data, error } = await supabaseClient
        .from("website_pages")
        .insert({
            website_id: currentWebsite.id,
            name: "Home",
            slug: "home",
            position: 0,
            is_homepage: true
        })
        .select()
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    currentPage = data;
    renderPages([data]);
    await loadPage(data.id);
}

function renderPages(pages) {
    const list = document.getElementById("pageList");
    list.innerHTML = "";

    pages.forEach(page => {
        const button = document.createElement("button");
        button.className = "page-item" + (currentPage?.id === page.id ? " active" : "");
        button.innerHTML = `
            <span class="page-icon">□</span>
            <span>${escapeHtml(page.name)}</span>
            ${page.is_homepage ? '<span class="page-home">HOME</span>' : ""}
        `;
        button.addEventListener("click", () => loadPage(page.id));
        list.appendChild(button);
    });
}

async function loadPage(pageId) {
    const { data: page, error } = await supabaseClient
        .from("website_pages")
        .select("*")
        .eq("id", pageId)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    currentPage = page;
    selectedElement = null;
    historyStack = [];
    historyIndex = -1;

    document.getElementById("pageBreadcrumb").textContent = page.name;

    const { data: sections, error: sectionError } = await supabaseClient
        .from("website_sections")
        .select("*")
        .eq("page_id", page.id)
        .order("position");

    if (sectionError) {
        alert(sectionError.message);
        return;
    }

    const sectionIds = (sections || []).map(s => s.id);
    let elements = [];

    if (sectionIds.length) {
        const result = await supabaseClient
            .from("website_elements")
            .select("*")
            .in("section_id", sectionIds)
            .order("position");

        if (!result.error) elements = result.data || [];
    }

    renderCanvas(sections || [], elements);
    renderPages(await fetchPages());
    renderProperties();
}

async function fetchPages() {
    const { data } = await supabaseClient
        .from("website_pages")
        .select("*")
        .eq("website_id", currentWebsite.id)
        .order("position");

    return data || [];
}

function renderCanvas(sections, elements) {
    const canvas = document.getElementById("siteCanvas");
    canvas.innerHTML = "";

    if (!sections.length) {
        canvas.innerHTML = `
            <div class="section-placeholder">
                <strong>Your page is empty</strong>
                <div style="margin-top:7px;font-size:12px">Open Add and choose your first component.</div>
            </div>
        `;
        return;
    }

    sections.forEach(section => {
        const sectionEl = document.createElement("section");
        sectionEl.className = `builder-section canvas-element ${section.type}-section`;
        sectionEl.dataset.elementId = section.id;
        sectionEl.dataset.elementLabel = section.type;
        sectionEl.addEventListener("click", e => {
            e.stopPropagation();
            selectElement({
                id: section.id,
                kind: "section",
                type: section.type,
                settings: section.settings || {}
            });
        });

        const inner = document.createElement("div");
        inner.className = "section-inner";

        const sectionElements = elements
            .filter(el => el.section_id === section.id)
            .sort((a,b) => a.position - b.position);

        sectionElements.forEach(element => {
            const el = renderElement(element);
            inner.appendChild(el);
        });

        sectionEl.appendChild(inner);
        canvas.appendChild(sectionEl);
    });

    canvas.addEventListener("click", () => {
        selectedElement = null;
        renderCanvas(sections, elements);
        renderProperties();
    }, { once: true });
}

function renderElement(element) {
    let node;

    switch (element.type) {
        case "heading":
            node = document.createElement("h1");
            node.className = "block-heading";
            node.textContent = element.settings?.text || "Heading";
            break;

        case "text":
            node = document.createElement("p");
            node.className = "block-text";
            node.textContent = element.settings?.text || "Your text goes here.";
            break;

        case "button":
            node = document.createElement("a");
            node.className = "block-button";
            node.textContent = element.settings?.text || "Button";
            node.href = element.settings?.href || "#";
            node.addEventListener("click", e => e.preventDefault());
            break;

        case "image":
            node = document.createElement("div");
            node.className = "block-image";
            node.style.background = element.settings?.background || "#dedee4";
            node.innerHTML = `<div style="height:100%;min-height:260px;display:grid;place-items:center;color:#777;font-size:12px">Image placeholder</div>`;
            break;

        case "spacer":
            node = document.createElement("div");
            node.className = "block-spacer";
            break;

        default:
            node = document.createElement("div");
            node.textContent = element.type;
    }

    node.classList.add("canvas-element");
    node.dataset.elementId = element.id;
    node.dataset.elementLabel = element.type;

    applyElementStyles(node, element.settings || {});

    node.addEventListener("click", e => {
        e.stopPropagation();
        selectElement({
            id: element.id,
            kind: "element",
            type: element.type,
            settings: {...(element.settings || {})}
        });
    });

    if (selectedElement?.id === element.id) node.classList.add("selected");

    return node;
}

function applyElementStyles(node, settings) {
    if (settings.fontSize) node.style.fontSize = `${settings.fontSize}px`;
    if (settings.color) node.style.color = settings.color;
    if (settings.align) node.style.textAlign = settings.align;
    if (settings.background && node.classList.contains("block-button")) node.style.background = settings.background;
    if (settings.background && node.classList.contains("block-image")) node.style.background = settings.background;
    if (settings.padding) node.style.padding = `${settings.padding}px`;
}

function selectElement(element) {
    selectedElement = element;
    renderProperties();
    highlightSelection();
}

function highlightSelection() {
    document.querySelectorAll(".canvas-element.selected").forEach(el => el.classList.remove("selected"));
    if (selectedElement) {
        const node = document.querySelector(`[data-element-id="${CSS.escape(selectedElement.id)}"]`);
        if (node) node.classList.add("selected");
    }
}

function renderProperties() {
    const panel = document.getElementById("propertiesPanel");
    const title = document.getElementById("propertiesTitle");

    if (!selectedElement) {
        title.textContent = "Select an element";
        panel.innerHTML = `
            <div class="empty-properties">
                <div class="empty-icon">✦</div>
                <strong>Nothing selected</strong>
                <p>Select an element on the canvas to edit it.</p>
            </div>
        `;
        return;
    }

    title.textContent = selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1);

    const settings = selectedElement.settings || {};
    let html = "";

    if (selectedElement.kind === "element") {
        if (["heading", "text", "button"].includes(selectedElement.type)) {
            html += `
                <div class="property-group">
                    <div class="property-group-title">CONTENT</div>
                    <label class="property-label">Text</label>
                    <textarea id="propText" class="property-textarea">${escapeHtml(settings.text || "")}</textarea>
                </div>
            `;
        }

        if (selectedElement.type === "button") {
            html += `
                <div class="property-group">
                    <div class="property-group-title">LINK</div>
                    <label class="property-label">URL</label>
                    <input id="propHref" class="property-input" value="${escapeAttr(settings.href || "#")}">
                </div>
            `;
        }

        if (["heading", "text", "button"].includes(selectedElement.type)) {
            html += `
                <div class="property-group">
                    <div class="property-group-title">STYLE</div>
                    <div class="property-row">
                        <div>
                            <label class="property-label">Font size</label>
                            <input id="propFontSize" type="number" class="property-input" value="${settings.fontSize || (selectedElement.type === "heading" ? 56 : 17)}">
                        </div>
                        <div>
                            <label class="property-label">Align</label>
                            <select id="propAlign" class="property-select">
                                <option value="left" ${settings.align === "left" ? "selected" : ""}>Left</option>
                                <option value="center" ${settings.align === "center" ? "selected" : ""}>Center</option>
                                <option value="right" ${settings.align === "right" ? "selected" : ""}>Right</option>
                            </select>
                        </div>
                    </div>
                    <label class="property-label">Text color</label>
                    <input id="propColor" type="color" class="property-input color-input" value="${validColor(settings.color, "#17171b")}">
                </div>
            `;
        }

        if (selectedElement.type === "button") {
            html += `
                <div class="property-group">
                    <div class="property-group-title">BUTTON</div>
                    <label class="property-label">Background</label>
                    <input id="propBackground" type="color" class="property-input color-input" value="${validColor(settings.background, "#17171b")}">
                </div>
            `;
        }
    } else {
        html += `
            <div class="property-group">
                <div class="property-group-title">SECTION</div>
                <label class="property-label">Background</label>
                <input id="propSectionBackground" type="color" class="property-input color-input" value="${validColor(settings.background, "#f0f0f3")}">
                <div style="height:8px"></div>
                <label class="property-label">Padding</label>
                <input id="propSectionPadding" type="number" class="property-input" value="${settings.padding || 80}">
            </div>
        `;
    }

    html += `
        <div class="property-group">
            <div class="property-group-title">ACTIONS</div>
            <button id="duplicateElement" class="ghost-button" style="width:100%">Duplicate</button>
        </div>
    `;

    panel.innerHTML = html;

    bindPropertyInputs();
}

function bindPropertyInputs() {
    const bind = (id, key, transform = v => v) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener("input", async () => {
            selectedElement.settings[key] = transform(input.value);
            await updateSelectedElement();
        });
    };

    bind("propText", "text");
    bind("propHref", "href");
    bind("propFontSize", "fontSize", Number);
    bind("propAlign", "align");
    bind("propColor", "color");
    bind("propBackground", "background");
    bind("propSectionBackground", "background");
    bind("propSectionPadding", "padding", Number);

    document.getElementById("duplicateElement")?.addEventListener("click", duplicateSelected);
}

async function updateSelectedElement() {
    if (!selectedElement) return;

    setSaveStatus("Saving...");

    const table = selectedElement.kind === "section" ? "website_sections" : "website_elements";

    const { error } = await supabaseClient
        .from(table)
        .update({ settings: selectedElement.settings, updated_at: new Date().toISOString() })
        .eq("id", selectedElement.id);

    if (error) {
        console.error(error);
        setSaveStatus("Save error");
        return;
    }

    await loadPage(currentPage.id);
    setSaveStatus("Saved");
}

async function addComponent(type) {
    if (!currentPage) return;

    setSaveStatus("Adding...");

    if (type === "hero") {
        const { data: section, error } = await supabaseClient
            .from("website_sections")
            .insert({
                page_id: currentPage.id,
                type: "hero",
                position: await nextPosition("website_sections", "page_id", currentPage.id),
                settings: { background: "#f0f0f3", padding: 80 }
            })
            .select()
            .single();

        if (!error && section) {
            await supabaseClient.from("website_elements").insert([
                {
                    section_id: section.id,
                    type: "heading",
                    position: 0,
                    settings: { text: "Your headline", fontSize: 56, color: "#17171b", align: "left" }
                },
                {
                    section_id: section.id,
                    type: "text",
                    position: 1,
                    settings: { text: "Tell visitors what this website is about.", fontSize: 18, color: "#55555f", align: "left" }
                },
                {
                    section_id: section.id,
                    type: "button",
                    position: 2,
                    settings: { text: "Learn more", background: "#17171b", color: "#ffffff", href: "#" }
                }
            ]);
        }
    } else {
        let sectionId = await getOrCreateBasicSection();

        const defaults = {
            heading: { text: "New heading", fontSize: 46, color: "#17171b", align: "left" },
            text: { text: "Add your text here.", fontSize: 17, color: "#55555f", align: "left" },
            button: { text: "Button", background: "#17171b", color: "#ffffff", href: "#" },
            image: { background: "#dedee4" },
            spacer: {}
        };

        await supabaseClient.from("website_elements").insert({
            section_id: sectionId,
            type,
            position: await nextPosition("website_elements", "section_id", sectionId),
            settings: defaults[type] || {}
        });
    }

    await loadPage(currentPage.id);
    switchLeftTab("pages");
    setSaveStatus("Saved");
}

async function getOrCreateBasicSection() {
    const { data } = await supabaseClient
        .from("website_sections")
        .select("*")
        .eq("page_id", currentPage.id)
        .order("position")
        .limit(1);

    if (data?.length) return data[0].id;

    const { data: section, error } = await supabaseClient
        .from("website_sections")
        .insert({
            page_id: currentPage.id,
            type: "basic",
            position: 0,
            settings: { background: "#ffffff", padding: 60 }
        })
        .select()
        .single();

    if (error) throw error;
    return section.id;
}

async function duplicateSelected() {
    if (!selectedElement) return;

    if (selectedElement.kind === "element") {
        const { data: original } = await supabaseClient
            .from("website_elements")
            .select("*")
            .eq("id", selectedElement.id)
            .single();

        if (!original) return;

        await supabaseClient.from("website_elements").insert({
            section_id: original.section_id,
            type: original.type,
            position: original.position + 1,
            settings: original.settings
        });

        await loadPage(currentPage.id);
    }
}

async function createPage() {
    const input = document.getElementById("newPageName");
    const name = input.value.trim();

    if (!name) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `page-${Date.now()}`;

    const { data, error } = await supabaseClient
        .from("website_pages")
        .insert({
            website_id: currentWebsite.id,
            name,
            slug,
            position: (await fetchPages()).length,
            is_homepage: false
        })
        .select()
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    closePageModal();
    await loadPage(data.id);
}

function closePageModal() {
    document.getElementById("pageModal").classList.add("hidden");
    document.getElementById("newPageName").value = "";
}

function renderComponentList() {
    const list = document.getElementById("componentList");

    list.innerHTML = COMPONENTS.map(component => `
        <button class="component-item" data-component="${component.type}">
            <span class="component-icon">${component.icon}</span>
            <span>
                <div class="component-name">${component.name}</div>
                <div class="component-description">${component.description}</div>
            </span>
        </button>
    `).join("");

    list.querySelectorAll(".component-item").forEach(button => {
        button.addEventListener("click", () => addComponent(button.dataset.component));
    });
}

function switchLeftTab(tab) {
    document.querySelectorAll(".panel-tab").forEach(button => {
        button.classList.toggle("active", button.dataset.leftTab === tab);
    });

    document.getElementById("pagesPanel").classList.toggle("hidden", tab !== "pages");
    document.getElementById("addPanel").classList.toggle("hidden", tab !== "add");
}

function setDevice(device) {
    activeDevice = device;
    document.querySelectorAll(".device-button").forEach(button => {
        button.classList.toggle("active", button.dataset.device === device);
    });

    const viewport = document.getElementById("canvasViewport");
    viewport.className = `canvas-viewport ${device}`;
}

async function publishWebsite() {
    if (!currentWebsite) return;

    setSaveStatus("Publishing...");

    const { error } = await supabaseClient
        .from("websites")
        .update({
            status: "published",
            updated_at: new Date().toISOString()
        })
        .eq("id", currentWebsite.id);

    if (error) {
        alert("Could not publish: " + error.message);
        setSaveStatus("Error");
        return;
    }

    currentWebsite.status = "published";
    setSaveStatus("Published");
}

async function openPreview() {
    if (!currentWebsite || !currentPage) return;

    const sectionsResult = await supabaseClient
        .from("website_sections")
        .select("*")
        .eq("page_id", currentPage.id)
        .order("position");

    const sections = sectionsResult.data || [];
    const sectionIds = sections.map(s => s.id);

    let elements = [];
    if (sectionIds.length) {
        const result = await supabaseClient
            .from("website_elements")
            .select("*")
            .in("section_id", sectionIds)
            .order("position");
        elements = result.data || [];
    }

    const html = generatePreviewHTML(sections, elements);
    const frame = document.getElementById("previewFrame");
    frame.srcdoc = html;
    document.getElementById("previewOverlay").classList.remove("hidden");
}

function generatePreviewHTML(sections, elements) {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;color:#17171b}
.section-inner{max-width:1120px;margin:auto;padding:80px 40px}
.hero-section{background:#f0f0f3}.hero-section .section-inner{min-height:500px;display:flex;flex-direction:column;justify-content:center}
.block-heading{font-size:56px;line-height:1.05;margin:0}.block-text{font-size:18px;line-height:1.6;margin:20px 0 28px}.block-button{display:inline-block;width:max-content;padding:12px 20px;border-radius:9px;background:#17171b;color:#fff;text-decoration:none;font-size:13px;font-weight:700}
.block-image{min-height:260px;background:#dedee4;display:grid;place-items:center;color:#777}.block-spacer{height:90px}
</style>
</head>
<body>
${sections.map(section => {
    const sectionElements = elements.filter(el => el.section_id === section.id).sort((a,b)=>a.position-b.position);
    const background = section.settings?.background || "#fff";
    const padding = section.settings?.padding || 60;

    return `<section class="${section.type}-section" style="background:${escapeAttr(background)}">
        <div class="section-inner" style="padding-top:${padding}px;padding-bottom:${padding}px">
            ${sectionElements.map(el => previewElement(el)).join("")}
        </div>
    </section>`;
}).join("")}
</body>
</html>`;
}

function previewElement(element) {
    const s = element.settings || {};

    if (element.type === "heading") {
        return `<h1 class="block-heading" style="font-size:${Number(s.fontSize)||56}px;color:${escapeAttr(s.color||"#17171b")};text-align:${escapeAttr(s.align||"left")}">${escapeHtml(s.text||"Heading")}</h1>`;
    }

    if (element.type === "text") {
        return `<p class="block-text" style="font-size:${Number(s.fontSize)||18}px;color:${escapeAttr(s.color||"#55555f")};text-align:${escapeAttr(s.align||"left")}">${escapeHtml(s.text||"Text")}</p>`;
    }

    if (element.type === "button") {
        return `<a class="block-button" href="${escapeAttr(s.href||"#")}" style="background:${escapeAttr(s.background||"#17171b")};color:${escapeAttr(s.color||"#fff")}">${escapeHtml(s.text||"Button")}</a>`;
    }

    if (element.type === "image") {
        return `<div class="block-image" style="background:${escapeAttr(s.background||"#dedee4")}">Image</div>`;
    }

    if (element.type === "spacer") {
        return `<div class="block-spacer"></div>`;
    }

    return "";
}

async function nextPosition(table, foreignKey, value) {
    const { data } = await supabaseClient
        .from(table)
        .select("position")
        .eq(foreignKey, value)
        .order("position", { ascending: false })
        .limit(1);

    return data?.length ? Number(data[0].position) + 1 : 0;
}

function defaultTheme() {
    return {
        background: "#ffffff",
        surface: "#f5f5f7",
        primary: "#8b7cff",
        secondary: "#17171b",
        accent: "#ffffff",
        text: "#17171b",
        headingFont: "Inter",
        bodyFont: "Inter",
        radius: 14,
        animation: "smooth"
    };
}

function setSaveStatus(text) {
    document.getElementById("saveStatus").textContent = text;
}

function validColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
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

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
}

function redo() {
    if (historyIndex >= historyStack.length - 1) return;
    historyIndex++;
}
