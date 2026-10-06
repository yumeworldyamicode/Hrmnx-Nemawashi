/* ============================================================
   NEMAWASHI APP BUILDER
   First version: App creation + Shop foundation
============================================================ */

let apps = [];

const appsGrid = document.getElementById("apps-grid");
const notice = document.getElementById("notice");
const dialog = document.getElementById("create-dialog");
const form = document.getElementById("create-app-form");

const createButton = document.getElementById("create-app-button");
const closeButton = document.getElementById("close-dialog");
const cancelButton = document.getElementById("cancel-button");
const refreshButton = document.getElementById("refresh-button");

initializeAppBuilder();

async function initializeAppBuilder() {
    if (typeof supabaseClient === "undefined") {
        showNotice("Supabase could not be loaded. Make sure supabase.js is available.", true);
        return;
    }

    const authenticated = await checkAuthentication();

    if (!authenticated) {
        return;
    }

    await loadApps();
}

async function checkAuthentication() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error(error);
            showNotice("Could not verify your Nemawashi session.", true);
            return false;
        }

        if (!data.session) {
            window.location.href = "logsignin.html";
            return false;
        }

        return true;
    } catch (error) {
        console.error(error);
        showNotice("Could not verify your Nemawashi session.", true);
        return false;
    }
}

async function loadApps() {
    appsGrid.innerHTML = '<div class="loading-card">Loading Apps…</div>';

    const { data, error } = await supabaseClient
        .from("nemawashi_apps")
        .select(`
            id,
            slug,
            name,
            description,
            app_type,
            website_url,
            background_color,
            primary_color,
            secondary_color,
            accent_color,
            text_color,
            is_active
        `)
        .order("name", { ascending: true });

    if (error) {
        console.error("Failed to load Apps:", error);
        showNotice("Could not load Nemawashi Apps: " + error.message, true);
        appsGrid.innerHTML = '<div class="loading-card">Apps could not be loaded.</div>';
        return;
    }

    apps = data || [];
    renderApps();
}

function renderApps() {
    if (!apps.length) {
        appsGrid.innerHTML = `
            <div class="loading-card">
                <strong>No Apps yet.</strong>
                <p>Create your first App to begin building the Nemawashi ecosystem.</p>
            </div>
        `;
        return;
    }

    appsGrid.innerHTML = apps.map(app => {
        const icon = getAppIcon(app);
        const bg = escapeAttribute(app.background_color || "#0b0b0d");
        const primary = escapeAttribute(app.primary_color || "#ffffff");
        const accent = escapeAttribute(app.accent_color || "#ffffff");

        return `
            <article
                class="app-card"
                style="--app-bg:${bg};--app-primary:${primary};--app-accent:${accent};"
            >
                <div>
                    <div class="app-icon">${escapeHtml(icon)}</div>
                    <h3>${escapeHtml(app.name)}</h3>
                    <p>${escapeHtml(app.description || "No description.")}</p>
                </div>

                <div class="app-meta">
                    ${escapeHtml(app.app_type || "app")}
                    ·
                    ${app.is_active ? "Active" : "Inactive"}
                </div>
            </article>
        `;
    }).join("");
}

function getAppIcon(app) {
    const icons = {
        shop: "S",
        nemawashi: "N",
        kiki: "K",
        serashio: "S",
        music: "M"
    };

    return icons[app.slug] || icons[app.app_type] || "A";
}

createButton.addEventListener("click", () => {
    dialog.showModal();
});

closeButton.addEventListener("click", () => dialog.close());
cancelButton.addEventListener("click", () => dialog.close());
refreshButton.addEventListener("click", loadApps);

document.getElementById("app-type").addEventListener("change", event => {
    if (event.target.value === "shop") {
        document.getElementById("app-name").value = "Hrmnx Shop";
        document.getElementById("app-slug").value = "shop";
        document.getElementById("app-description").value =
            "Hrmnx Entertainment official artist shop.";
        document.getElementById("app-website").value =
            "https://shop.hrmnx.site";
    }
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Creating…";

    try {
        const values = {
            name: document.getElementById("app-name").value.trim(),
            slug: document.getElementById("app-slug").value.trim().toLowerCase(),
            description: document.getElementById("app-description").value.trim(),
            app_type: document.getElementById("app-type").value,
            website_url: document.getElementById("app-website").value.trim() || null,
            background_color: document.getElementById("background-color").value,
            primary_color: document.getElementById("primary-color").value,
            secondary_color: document.getElementById("secondary-color").value,
            accent_color: document.getElementById("accent-color").value,
            text_color: document.getElementById("text-color").value,
            is_active: document.getElementById("is-active").checked
        };

        if (!values.name || !values.slug) {
            throw new Error("App name and slug are required.");
        }

        const { data: app, error } = await supabaseClient
            .from("nemawashi_apps")
            .insert(values)
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (values.app_type === "shop") {
            await createShopSpaces(app);
        }

        showNotice(`${values.name} was created successfully.`);
        dialog.close();
        form.reset();

        // Restore Shop defaults after reset.
        document.getElementById("app-name").value = "Hrmnx Shop";
        document.getElementById("app-slug").value = "shop";
        document.getElementById("app-description").value =
            "Hrmnx Entertainment official artist shop.";
        document.getElementById("app-website").value =
            "https://shop.hrmnx.site";
        document.getElementById("is-active").checked = true;

        await loadApps();

    } catch (error) {
        console.error("App creation failed:", error);
        showNotice("App could not be created: " + (error.message || error), true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create App";
    }
});

async function createShopSpaces(app) {
    const spaces = [
        {
            slug: "general",
            name: "General Space",
            space_type: "General Space",
            description: "General administration and information for the Hrmnx Shop.",
            position: 0
        },
        {
            slug: "artists",
            name: "Artists",
            space_type: "Creative Space",
            description: "Manage artists and their storefront identities.",
            position: 1
        },
        {
            slug: "releases",
            name: "Releases",
            space_type: "Creative Space",
            description: "Manage albums and releases.",
            position: 2
        },
        {
            slug: "products",
            name: "Products",
            space_type: "Creative Space",
            description: "Manage vinyl and CD products and their ElasticStage links.",
            position: 3
        },
        {
            slug: "themes",
            name: "Themes",
            space_type: "Creative Space",
            description: "Create and manage artist storefront themes.",
            position: 4
        },
        {
            slug: "website",
            name: "Website Builder",
            space_type: "App Creating Space",
            description: "Manage the Shop website structure and visual configuration.",
            position: 5
        },
        {
            slug: "files",
            name: "Files",
            space_type: "Creative Space",
            description: "Shop images, artwork, branding and other assets.",
            position: 6
        }
    ];

    const rows = spaces.map(space => ({
        app_id: app.id,
        project_id: null,
        slug: space.slug,
        name: space.name,
        space_type: space.space_type,
        description: space.description,
        position: space.position,
        is_active: true
    }));

    const { error } = await supabaseClient
        .from("nemawashi_spaces")
        .insert(rows);

    if (error) {
        console.error("Shop Spaces could not be created:", error);
        throw new Error(
            "The Shop App was created, but its default Spaces could not be created: " +
            error.message
        );
    }
}

function showNotice(message, isError = false) {
    notice.hidden = false;
    notice.className = "notice" + (isError ? " error" : "");
    notice.textContent = message;

    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(() => {
        notice.hidden = true;
    }, 6000);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
