/* ============================================================
   NEMAWASHI MESSAGES
   DATABASE VERSION
============================================================ */


/* ============================================================
   STATE
============================================================ */

let nemawashiApps = [];

let currentApp = null;

let currentSpace = null;

let currentMessages = [];

let currentMessageProfiles = new Map();

let currentMessageAttachments = new Map();


/* ============================================================
   ELEMENTS
============================================================ */

const messagesContent =
    document.getElementById("messages-content");

const topbarTitle =
    document.getElementById("topbar-title");

const topbarLabel =
    document.getElementById("topbar-label");

const appsToggle =
    document.getElementById("apps-toggle");

const appsList =
    document.getElementById("apps-list");


/* ============================================================
   FALLBACK ICONS
============================================================ */

const appIcons = {

    nemawashi: "N",
    kiki: "K",
    audition: "A",
    serashio: "S",

    "hrmnx-entertainment": "H",

    yumeworld: "Y",

    seiun: "S",

    hoshi: "H",

    "osakos-diary": "O",

    harmonia: "H",

    links: "L"

};


/* ============================================================
   MESSAGE ANIMATION STYLES
============================================================ */

function ensureMessageAnimationStyles() {

    if (document.getElementById("nemawashi-message-animation-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "nemawashi-message-animation-styles";

    style.textContent = `
        .message-entering {
            animation: nemawashiMessageIn 0.22s cubic-bezier(.22, .8, .3, 1) both;
            transform-origin: bottom center;
        }

        @keyframes nemawashiMessageIn {
            from {
                opacity: 0;
                transform: translateY(8px) scale(.97);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .message-entering {
                animation: none;
            }
        }
    `;

    document.head.appendChild(style);
}


/* ============================================================
   START
============================================================ */

ensureMessageAnimationStyles();
initializeMessages();


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeMessages() {

    if (
        typeof supabaseClient === "undefined"
    ) {

        showError(
            "Supabase could not be loaded. Check supabase.js."
        );

        return;

    }


    await loadApps();

    setupNavigation();

    renderHome();

}


/* ============================================================
   LOAD APPS
============================================================ */

async function loadApps() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("nemawashi_apps")

            .select(`
                id,
                slug,
                name,
                description,
                app_type,
                website_url,
                favicon_url,
                text_logo_url,
                banner_url,
                background_color,
                primary_color,
                secondary_color,
                accent_color,
                text_color,
                is_active
            `)

            .eq(
                "is_active",
                true
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Failed to load Nemawashi Apps:",
                error
            );

            showError(
                "Nemawashi Apps could not be loaded."
            );

            return;

        }


        nemawashiApps =
            data || [];


        renderAppsSidebar();

    }

    catch (error) {

        console.error(
            "Unexpected App loading error:",
            error
        );

        showError(
            "Something went wrong while loading Apps."
        );

    }

}

/* ============================================================
   RENDER APP SIDEBAR
============================================================ */

function renderAppsSidebar() {

    /*
     * The Apps already exist in messages.html.
     * Do not replace them with database-generated HTML.
     *
     * The database is used for App data/pages,
     * while the existing sidebar keeps its structure.
     */

    if (!appsList) {
        return;
    }

    /*
     * Keep the existing HTML buttons exactly as they are.
     * Only make sure their click targets remain available.
     */

    appsList.style.display = "";

}

/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

    document.addEventListener(
        "click",
        async function(event) {

            /* ==================================================
               APP BUTTONS
            ================================================== */

            const appButton =
                event.target.closest(
                    ".app-navigation-item, .app-card"
                );

            if (appButton) {

                event.preventDefault();
                event.stopPropagation();

                const appSlug =
                    appButton.dataset.app;

                if (!appSlug) {
                    return;
                }

                setAppNavigationActive(
                    appButton
                );

                await renderApp(
                    appSlug
                );

                return;
            }


            /* ==================================================
               NORMAL PAGE BUTTONS
            ================================================== */

            const pageButton =
                event.target.closest(
                    "[data-page]"
                );

            if (pageButton) {

                event.preventDefault();

                setNavigationActive(
                    pageButton
                );

                resetNemawashiTheme();

                renderPage(
                    pageButton.dataset.page
                );

                return;
            }


            /* ==================================================
               SPACE BUTTONS
            ================================================== */

            const spaceButton =
                event.target.closest(
                    "[data-space]"
                );

            if (spaceButton) {

                selectSpace(
                    spaceButton.dataset.space
                );

                return;
            }

        }
    );


    /* ========================================================
       APPS DROPDOWN
    ======================================================== */

    if (appsToggle) {

        appsToggle.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                if (!appsList) {
                    return;
                }

                const open =
                    appsList.classList.toggle(
                        "open"
                    );

                appsToggle.classList.toggle(
                    "open",
                    open
                );

            }
        );

    }

}

/* ============================================================
   NAVIGATION ACTIVE STATES
============================================================ */

function setNavigationActive(
    element
) {

    document
        .querySelectorAll(
            ".navigation-item, .app-navigation-item"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


function setAppNavigationActive(
    element
) {

    document
        .querySelectorAll(
            ".navigation-item, .app-navigation-item"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    if (appsToggle) {

        appsToggle.classList.add(
            "active"
        );

    }


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


/* ============================================================
   PAGE ROUTER
============================================================ */

function renderPage(
    page
) {

    switch (page) {

        case "home":

            renderHome();

            break;


        case "personal":

            renderBasicPage(
                "Personal Messages",
                "Private conversations with other Nemawashi users.",
                "◇"
            );

            break;


        case "subsidiary":

            renderBasicPage(
                "Subsidiary Messages",
                "Communication between Hrmnx subsidiaries and their teams.",
                "◇"
            );

            break;


        case "business":

            renderBasicPage(
                "Business Messages",
                "Professional communication across Hrmnx Entertainment.",
                "◇"
            );

            break;


        case "app-builder":

            renderBasicPage(
                "App Builder",
                "Create and configure Apps for the Nemawashi ecosystem.",
                "+"
            );

            break;

    }

}

/* ============================================================
   BASIC PAGE
============================================================ */

function renderBasicPage(
    title,
    description,
    icon
) {

    resetNemawashiTheme();

    setTopbar(
        "NEMAWASHI",
        title
    );

    messagesContent.innerHTML = `

        <section
            class="communication-page"
        >

            <div
                class="communication-intro"
            >

                <span
                    class="communication-eyebrow"
                >
                    NEMAWASHI
                </span>

                <h2>
                    ${escapeHtml(title)}
                </h2>

                <p>
                    ${escapeHtml(description)}
                </p>

            </div>


            <div
                class="space-placeholder"
            >

                <div
                    class="space-placeholder-icon"
                >
                    ${escapeHtml(icon)}
                </div>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    The ${escapeHtml(title)}
                    section will be built here.
                </p>

            </div>

        </section>

    `;

}

/* ============================================================
   HOME
============================================================ */

function renderHome() {

    resetNemawashiTheme();


    setTopbar(
        "NEMAWASHI",
        "Nemawashi"
    );


    messagesContent.innerHTML = `

        <section
            class="communication-page"
        >

            <div
                class="communication-intro"
            >

                <span
                    class="communication-eyebrow"
                >
                    NEMAWASHI
                </span>


                <h2>
                    Work together.
                </h2>


                <p>
                    Connect with people,
                    teams, projects and
                    Hrmnx services through
                    Nemawashi.
                </p>

            </div>


            <div
                class="communication-grid"
            >

                <button
                    type="button"
                    class="communication-card"
                    data-page="personal"
                >

                    <span
                        class="communication-card-icon"
                    >
                        ◇
                    </span>

                    <strong>
                        Personal Messages
                    </strong>

                    <span>
                        Private conversations
                        with other people.
                    </span>

                </button>


                <button
                    type="button"
                    class="communication-card"
                    data-page="business"
                >

                    <span
                        class="communication-card-icon"
                    >
                        ◇
                    </span>

                    <strong>
                        Business Messages
                    </strong>

                    <span>
                        Professional communication
                        across Hrmnx.
                    </span>

                </button>


                <button
                    type="button"
                    class="communication-card"
                    id="home-apps-card"
                >

                    <span
                        class="communication-card-icon"
                    >
                        ▦
                    </span>

                    <strong>
                        Apps
                    </strong>

                    <span>
                        Enter an App and
                        its Spaces.
                    </span>

                </button>


                <button
                    type="button"
                    class="communication-card"
                    data-page="app-builder"
                >

                    <span
                        class="communication-card-icon"
                    >
                        +
                    </span>

                    <strong>
                        App Builder
                    </strong>

                    <span>
                        Create and configure
                        future Nemawashi Apps.
                    </span>

                </button>

            </div>

        </section>

    `;


    const appsCard =
        document.getElementById(
            "home-apps-card"
        );


    if (appsCard) {

        appsCard.addEventListener(
            "click",
            function() {

                renderAppDirectory();

            }
        );

    }

}


/* ============================================================
   APP DIRECTORY
============================================================ */

function renderAppDirectory() {

    resetNemawashiTheme();


    setTopbar(
        "NEMAWASHI",
        "Apps"
    );


    messagesContent.innerHTML = `

        <section
            class="app-directory"
        >

            <div
                class="communication-intro"
            >

                <span
                    class="communication-eyebrow"
                >
                    APPS
                </span>


                <h2>
                    Hrmnx Apps
                </h2>


                <p>
                    Select an App to enter
                    its community and Spaces.
                </p>

            </div>


            <div
                class="app-grid"
            >

                ${
                    nemawashiApps
                        .map(
                            app => `

                                <button
                                    type="button"
                                    class="app-card"
                                    data-app="${escapeHtml(app.slug)}"
                                >

                                    ${
                                        app.favicon_url

                                        ?

                                        `
                                            <img
                                                class="app-card-icon"
                                                src="${escapeHtml(app.favicon_url)}"
                                                alt=""
                                            >
                                        `

                                        :

                                        `
                                            <span
                                                class="app-card-icon"
                                            >
                                                ${
                                                    appIcons[app.slug]
                                                    || "A"
                                                }
                                            </span>
                                        `
                                    }


                                    <span
                                        class="app-card-name"
                                    >
                                        ${escapeHtml(app.name)}
                                    </span>


                                    <span
                                        class="app-card-type"
                                    >
                                        ${escapeHtml(app.app_type)}
                                    </span>


                                    <span
                                        class="app-card-arrow"
                                    >
                                        →
                                    </span>

                                </button>

                            `
                        )
                        .join("")
                }

            </div>

        </section>

    `;

}


/* ============================================================
   RENDER APP
============================================================ */

async function renderApp(
    appSlug
) {

    const app =
        nemawashiApps.find(
            item =>
                item.slug === appSlug
        );


    if (!app) {

        console.error(
            "App not found:",
            appSlug
        );

        return;

    }


    currentApp =
        app;


    applyAppTheme(
        app
    );


    setTopbar(
        "APP",
        app.name
    );


    messagesContent.innerHTML = `

        <section
            class="app-page"
        >

            <div
                class="app-banner"
                style="
                    ${
                        app.banner_url
                        ?
                        `
                            background-image:
                                url('${escapeHtml(app.banner_url)}');
                            background-size: cover;
                            background-position: center;
                        `
                        :
                        ""
                    }
                "
            >

                <div
                    class="app-banner-content"
                >

                    ${
                        app.text_logo_url

                        ?

                        `
                            <img
                                class="app-text-logo"
                                src="${escapeHtml(app.text_logo_url)}"
                                alt="${escapeHtml(app.name)}"
                            >
                        `

                        :

                        `
                            <div
                                class="app-logo-fallback"
                            >
                                ${
                                    appIcons[app.slug]
                                    || "A"
                                }
                            </div>
                        `
                    }


                    <small>
                        ${escapeHtml(app.app_type)}
                    </small>


                    <h2>
                        ${escapeHtml(app.name)}
                    </h2>


                    <p>
                        ${escapeHtml(
                            app.description || ""
                        )}
                    </p>

                </div>

            </div>


            <div
                class="app-workspace"
            >

                <aside
                    class="space-sidebar"
                >

                    <div
                        class="space-sidebar-title"
                    >
                        ${escapeHtml(app.name)}
                    </div>


                    <div
                        class="space-category"
                    >

                        <div
                            class="space-category-title"
                        >
                            GENERAL
                        </div>


                        <div
                            id="general-spaces"
                        >

                            <div
                                class="space-loading"
                            >
                                Loading Spaces...
                            </div>

                        </div>

                    </div>


                    <div
                        class="space-category"
                    >

                        <div
                            class="space-category-title"
                        >
                            PROJECTS
                        </div>


                        <div
                            id="project-list"
                        >

                            <div
                                class="space-loading"
                            >
                                Loading Projects...
                            </div>

                        </div>

                    </div>

                </aside>


                <main
                    class="space-main"
                >

                    <div
                        class="space-header"
                    >

                        <small>
                            SPACE
                        </small>


                        <h3>
                            Select a Space
                        </h3>

                    </div>


                    <div
                        class="space-placeholder"
                    >

                        <div
                            class="space-placeholder-icon"
                        >
                            ◌
                        </div>


                        <h3>
                            Welcome
                        </h3>


                        <p>
                            Select a Space from
                            the sidebar to begin.
                        </p>

                    </div>

                </main>

            </div>

        </section>

    `;


    await loadAppSpaces(
        app.id
    );

}


/* ============================================================
   LOAD APP SPACES
============================================================ */

async function loadAppSpaces(
    appId
) {

    const generalSpaces =
        document.getElementById(
            "general-spaces"
        );

    const projectList =
        document.getElementById(
            "project-list"
        );


    try {

        /* =====================================================
           LOAD PROJECTS
        ===================================================== */

        const {
            data: projects,
            error: projectError
        } = await supabaseClient

            .from("nemawashi_projects")

            .select(`
                id,
                app_id,
                slug,
                name,
                description,
                is_active
            `)

            .eq(
                "app_id",
                appId
            )

            .eq(
                "is_active",
                true
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (projectError) {

            console.error(
                "Failed to load Projects:",
                projectError
            );

            if (projectList) {

                projectList.innerHTML = `
                    <div class="project-empty">
                        Could not load Projects.
                    </div>
                `;

            }

            return;

        }


        /* =====================================================
           LOAD SPACES
        ===================================================== */

        const {
            data: spaces,
            error: spaceError
        } = await supabaseClient

            .from("nemawashi_spaces")

            .select(`
                id,
                app_id,
                project_id,
                slug,
                name,
                space_type,
                description,
                position,
                is_active
            `)

            .eq(
                "app_id",
                appId
            )

            .eq(
                "is_active",
                true
            )

            .order(
                "position",
                {
                    ascending: true
                }
            );


        if (spaceError) {

            console.error(
                "Failed to load Spaces:",
                spaceError
            );

            if (generalSpaces) {

                generalSpaces.innerHTML = `
                    <div class="space-loading">
                        Could not load Spaces.
                    </div>
                `;

            }

            return;

        }


        const allSpaces =
            spaces || [];

        const allProjects =
            projects || [];


        /* =====================================================
           GENERAL SPACES
        ===================================================== */

        const general =
            allSpaces.filter(
                space =>
                    space.project_id === null
            );


        if (generalSpaces) {

            if (!general.length) {

                generalSpaces.innerHTML = `
                    <div class="space-loading">
                        No Spaces yet.
                    </div>
                `;

            }

            else {

                generalSpaces.innerHTML =
                    general
                        .map(
                            space => `

                                <button
                                    type="button"
                                    class="space-item"
                                    data-space="${escapeHtml(space.id)}"
                                >

                                    <span>
                                        ${getSpaceIcon(
                                            space.space_type
                                        )}
                                    </span>

                                    ${escapeHtml(
                                        space.name
                                    )}

                                </button>

                            `
                        )
                        .join("");

            }

        }


        /* =====================================================
           PROJECTS + THEIR SPACES
        ===================================================== */

        if (projectList) {

            if (!allProjects.length) {

                projectList.innerHTML = `
                    <div class="project-empty">
                        No projects yet.
                    </div>
                `;

            }

            else {

                projectList.innerHTML =
                    allProjects
                        .map(
                            project => {

                                const projectSpaces =
                                    allSpaces.filter(
                                        space =>
                                            space.project_id ===
                                            project.id
                                    );


                                return `

                                    <div
                                        class="project-group"
                                        data-project="${escapeHtml(project.id)}"
                                    >

                                        <div
                                            class="project-group-title"
                                        >

                                            <span>
                                                ◆
                                            </span>

                                            ${escapeHtml(
                                                project.name
                                            )}

                                        </div>


                                        <div
                                            class="project-space-list"
                                        >

                                            ${
                                                projectSpaces.length

                                                ?

                                                projectSpaces
                                                    .map(
                                                        space => `

                                                            <button
                                                                type="button"
                                                                class="space-item"
                                                                data-space="${escapeHtml(space.id)}"
                                                            >

                                                                <span>
                                                                    ${getSpaceIcon(
                                                                        space.space_type
                                                                    )}
                                                                </span>

                                                                ${escapeHtml(
                                                                    space.name
                                                                )}

                                                            </button>

                                                        `
                                                    )
                                                    .join("")

                                                :

                                                `
                                                    <div class="project-empty">
                                                        No Spaces yet.
                                                    </div>
                                                `
                                            }

                                        </div>

                                    </div>

                                `;

                            }
                        )
                        .join("");

            }

        }


        /* =====================================================
           SPACE CLICK HANDLING
        ===================================================== */

        document
            .querySelectorAll(
                ".space-item[data-space]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function() {

                            selectSpace(
                                this.dataset.space
                            );

                        }
                    );

                }
            );

    }

    catch (error) {

        console.error(
            "App workspace loading error:",
            error
        );

    }

}

function formatSpaceType(type) {

    const labels = {
        general: "General Space",
        project: "Project Space",
        massive_project: "Massive Project Space",
        info: "Info Space",
        meeting: "Meeting Space",
        music: "Music Space",
        creative: "Creative Space",
        app_creating: "App Creating Space"
    };

    return labels[type] || "Space";
}

/* ============================================================
   SELECT SPACE
============================================================ */

async function selectSpace(spaceId) {
    try {
        const { data: space, error } = await supabaseClient
            .from("nemawashi_spaces")
            .select(`
                id,
                app_id,
                project_id,
                slug,
                name,
                space_type,
                description
            `)
            .eq("id", spaceId)
            .single();

        if (error) {
            console.error("Failed to load Space:", error);
            return;
        }

        currentSpace = space;

        document.querySelectorAll(".space-item").forEach(button => {
            button.classList.toggle(
                "active",
                String(button.dataset.space) === String(spaceId)
            );
        });

        const spaceHeader = document.querySelector(".space-header");
        const spacePlaceholder = document.querySelector(".space-placeholder");

        if (spaceHeader) {
spaceHeader.innerHTML = `
    <div class="space-header-main">

        <div class="space-header-icon">
            ${getSpaceIcon(space.space_type)}
        </div>

        <div class="space-header-info">

            <div class="space-header-title-row">

                <h2>
                    ${escapeHtml(space.name)}
                </h2>

                <span class="space-header-type">
                    ${escapeHtml(
                        formatSpaceType(space.space_type)
                    )}
                </span>

            </div>

            <p>
                ${escapeHtml(
                    space.description ||
                    "Communication for this Space."
                )}
            </p>

        </div>

    </div>

    <div class="space-header-actions">

        <button
            type="button"
            class="space-header-action"
            id="space-members-button"
            title="Members"
        >
            Members
        </button>

        <button
            type="button"
            class="space-header-action space-header-more"
            id="space-more-button"
            title="More"
        >
            ⋯
        </button>

    </div>
`;
        }

        if (spacePlaceholder) {
            spacePlaceholder.outerHTML = `
                <div class="space-chat" id="space-chat">

                    <div class="messages-list" id="messages-list">
                        <div class="messages-loading">
                            Loading messages...
                        </div>
                    </div>

<form class="message-composer" id="message-composer">

    <div class="attachment-wrapper">

        <button
            type="button"
            class="attachment-button"
            id="attachment-button"
            aria-label="Add attachment"
        >
            +
        </button>

        <div
            class="attachment-menu"
            id="attachment-menu"
        >

            <button
                type="button"
                class="attachment-option"
                data-attachment-type="lyrdem"
            >
                <span class="attachment-option-icon">TXT</span>
                <span>
                    <strong>Demo Lyrics</strong>
                    <small>Lyrics demo</small>
                </span>
            </button>

            <button
                type="button"
                class="attachment-option"
                data-attachment-type="prodem"
            >
                <span class="attachment-option-icon">♫</span>
                <span>
                    <strong>Demo Base</strong>
                    <small>Music demo</small>
                </span>
            </button>

            <button
                type="button"
                class="attachment-option"
                data-attachment-type="image"
            >
                <span class="attachment-option-icon">▧</span>
                <span>
                    <strong>Image</strong>
                    <small>Upload an image</small>
                </span>
            </button>

            <button
                type="button"
                class="attachment-option"
                data-attachment-type="file"
            >
                <span class="attachment-option-icon">□</span>
                <span>
                    <strong>File</strong>
                    <small>Upload a file</small>
                </span>
            </button>

        </div>

        <input
            type="file"
            id="attachment-input"
            hidden
        >

    </div>

    <textarea
        id="message-input"
        placeholder="Message ${escapeHtml(space.name)}..."
        rows="1"
        maxlength="5000"
    ></textarea>

    <button
        type="submit"
        class="message-send-button"
    >
        Send
    </button>

</form>

                </div>
            `;

            loadMessages(space.id);
            setupMessageComposer();
            setupAttachmentMenu();
        }

    } catch (error) {
        console.error("Space selection error:", error);
    }
}

async function loadMessages(spaceId) {
    const messagesList = document.getElementById("messages-list");

    console.log("LOAD MESSAGES CALLED:", spaceId);

    if (!messagesList) return;

    messagesList.innerHTML = `
        <div class="messages-loading">
            Loading messages...
        </div>
    `;

    /*
     * Load messages
     */
    const {
        data: messages,
        error
    } = await supabaseClient
        .from("nemawashi_messages")
        .select(`
            id,
            space_id,
            user_id,
            content,
            reply_to_id,
            is_edited,
            created_at
        `)
        .eq("space_id", spaceId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to load messages:", error);

        messagesList.innerHTML = `
            <div class="messages-loading">
                Could not load messages.
            </div>
        `;

        return;
    }

    /*
     * No messages
     */
    if (!messages || messages.length === 0) {
        currentMessages = [];
        currentMessageProfiles = new Map();
        currentMessageAttachments = new Map();

        messagesList.innerHTML = `
            <div class="messages-empty">
                <div class="messages-empty-icon">◇</div>
                <h3>No messages yet</h3>
                <p>Start the conversation in this Space.</p>
            </div>
        `;

        return;
    }

    /*
     * Load profiles
     */
    const userIds = [
        ...new Set(
            messages
                .map(message => message.user_id)
                .filter(Boolean)
        )
    ];

    let profiles = [];

    if (userIds.length) {
        const {
            data: profileData,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                display_name,
                username,
                avatar_url,
                is_staff
            `)
            .in("id", userIds);

        if (profileError) {
            console.error(
                "Failed to load message profiles:",
                profileError
            );
        } else {
            profiles = profileData || [];
        }
    }

    const profileMap = new Map(
        profiles.map(profile => [profile.id, profile])
    );

    currentMessages = messages;
    currentMessageProfiles = profileMap;

    /*
     * Load attachments.
     *
     * Attachments are optional. If this query fails,
     * normal messages will STILL be rendered.
     */
    const attachmentMap = new Map();

    currentMessageAttachments = attachmentMap;

    try {
        const messageIds = messages.map(message => message.id);

        if (messageIds.length) {
            const {
                data: attachmentData,
                error: attachmentError
            } = await supabaseClient
                .from("nemawashi_message_attachments")
                .select(`
                    id,
                    message_id,
                    user_id,
                    file_name,
                    file_type,
                    file_size,
                    storage_path,
                    attachment_type,
                    created_at
                `)
                .in("message_id", messageIds)
                .order("created_at", {
                    ascending: true
                });

            if (attachmentError) {
                console.error(
                    "Failed to load message attachments:",
                    attachmentError
                );
            } else if (attachmentData) {
                attachmentData.forEach(attachment => {
                    if (!attachmentMap.has(attachment.message_id)) {
                        attachmentMap.set(
                            attachment.message_id,
                            []
                        );
                    }

                    attachmentMap
                        .get(attachment.message_id)
                        .push(attachment);
                });
            }
        }
    } catch (attachmentException) {
        console.error(
            "Attachment loading failed:",
            attachmentException
        );
    }

    /*
     * Current logged-in user
     */
    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    /*
     * Render messages
     */
    try {
        messagesList.innerHTML = messages
            .map((message, index) => {

                const previousMessage =
                    index > 0
                        ? messages[index - 1]
                        : null;

                const previousProfile =
                    previousMessage
                        ? profileMap.get(
                            previousMessage.user_id
                        ) || null
                        : null;

                return renderMessage(
                    message,
                    profileMap.get(message.user_id) || null,
                    user?.id || null,
                    previousProfile,
                    previousMessage,
                    index === 0,
                    attachmentMap.get(message.id) || []
                );
            })
            .join("");

    } catch (renderError) {
        console.error(
            "Failed to render Nemawashi messages:",
            renderError
        );

        messagesList.innerHTML = `
            <div class="messages-loading">
                Could not display messages.
            </div>
        `;

        return;
    }

    scrollMessagesToBottom();

    /*
     * Load attachment previews/download handlers
     * after the messages have been inserted.
     */
    if (typeof setupAttachmentDownloads === "function") {
        setupAttachmentDownloads();
    }

    if (typeof loadAttachmentImages === "function") {
        loadAttachmentImages();
    }
}

function setupAttachmentMenu() {
    const attachmentButton =
        document.getElementById("attachment-button");

    const attachmentMenu =
        document.getElementById("attachment-menu");

    const attachmentInput =
        document.getElementById("attachment-input");

    if (
        !attachmentButton ||
        !attachmentMenu ||
        !attachmentInput
    ) {
        return;
    }

    attachmentButton.addEventListener(
        "click",
        function(event) {
            event.preventDefault();
            event.stopPropagation();

            const isOpen =
                attachmentMenu.classList.toggle("open");

            attachmentButton.classList.toggle(
                "active",
                isOpen
            );
        }
    );

    attachmentMenu
        .querySelectorAll(".attachment-option")
        .forEach(option => {

            option.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    const attachmentType =
                        this.dataset.attachmentType;

                    attachmentInput.dataset.attachmentType =
                        attachmentType;

                    attachmentInput.value = "";

                    if (attachmentType === "image") {

                        attachmentInput.accept =
                            "image/*";

                    } else if (attachmentType === "lyrdem") {

                        attachmentInput.accept =
                            ".txt,.lrc,.lyrdem";

                    } else if (attachmentType === "prodem") {

                        attachmentInput.accept =
                            ".mp3,.wav,.flac,.m4a,.ogg,.prodem";

                    } else {

                        attachmentInput.accept =
                            "*/*";
                    }

                    attachmentInput.click();

                    attachmentMenu.classList.remove("open");

                    attachmentButton.classList.remove(
                        "active"
                    );
                }
            );

        });

    document.addEventListener(
        "click",
        function(event) {

            if (
                !attachmentMenu.contains(event.target) &&
                !attachmentButton.contains(event.target)
            ) {
                attachmentMenu.classList.remove("open");

                attachmentButton.classList.remove(
                    "active"
                );
            }

        }
    );

    attachmentInput.addEventListener(
        "change",
        async function() {

            const file =
                this.files?.[0];

            if (!file) {
                return;
            }

            const attachmentType =
                this.dataset.attachmentType || "file";

            await uploadMessageAttachment(
                file,
                attachmentType
            );

            this.value = "";
        }
    );
}


async function uploadMessageAttachment(
    file,
    attachmentType
) {

    if (!currentSpace) {
        return;
    }

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        alert(
            "You must be logged in to upload files."
        );

        return;
    }

    const maxSize =
        50 * 1024 * 1024;

    if (file.size > maxSize) {

        alert(
            "This file is too large. The maximum size is 50 MB."
        );

        return;
    }

    const {
        data: message,
        error: messageError
    } = await supabaseClient
        .from("nemawashi_messages")
        .insert({
            space_id: currentSpace.id,
            user_id: user.id,
            content: ""
        })
        .select()
        .single();

    if (messageError) {

        console.error(
            "Failed to create attachment message:",
            messageError
        );

        alert(
            "Could not create the attachment message."
        );

        return;
    }

    const safeFileName =
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

    const storagePath =
        `${currentSpace.id}/${user.id}/${message.id}-${Date.now()}-${safeFileName}`;

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("nemawashi-attachments")
        .upload(
            storagePath,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType:
                    file.type ||
                    "application/octet-stream"
            }
        );

    if (uploadError) {

        console.error(
            "Failed to upload attachment:",
            uploadError
        );

        await supabaseClient
            .from("nemawashi_messages")
            .delete()
            .eq("id", message.id);

        alert(
            "Could not upload the file."
        );

        return;
    }

    const {
        error: attachmentError
    } = await supabaseClient
        .from("nemawashi_message_attachments")
        .insert({
            message_id: message.id,
            user_id: user.id,
            file_name: file.name,
            file_type: file.type || null,
            file_size: file.size,
            storage_path: storagePath,
            attachment_type: attachmentType
        });

    if (attachmentError) {

        console.error(
            "Failed to save attachment metadata:",
            attachmentError
        );

        await supabaseClient
            .storage
            .from("nemawashi-attachments")
            .remove([
                storagePath
            ]);

        await supabaseClient
            .from("nemawashi_messages")
            .delete()
            .eq("id", message.id);

        alert(
            "Could not save the attachment."
        );

        return;
    }

    await loadMessages(
        currentSpace.id
    );
}


function renderMessage(
    message,
    profile,
    currentUserId,
    previousProfile,
    previousMessage,
    isFirstMessage,
    attachments = []
) {
    const date = new Date(message.created_at);

    const displayName =
        profile?.display_name || "Unknown user";

    const isOwnMessage =
        String(message.user_id) ===
        String(currentUserId);

    /*
     * Clean whitespace.
     */
    const cleanContent = String(message.content || "")
        .replace(/^[ \t]+|[ \t]+$/gm, "")
        .trim();

    let sameDay = false;
    let sameUser = false;
    let timeDifference = Infinity;

    if (previousMessage) {
        const previousDate =
            new Date(previousMessage.created_at);

        sameDay =
            date.getFullYear() ===
                previousDate.getFullYear() &&
            date.getMonth() ===
                previousDate.getMonth() &&
            date.getDate() ===
                previousDate.getDate();

        sameUser =
            String(previousMessage.user_id) ===
            String(message.user_id);

        timeDifference =
            date.getTime() -
            previousDate.getTime();
    }

    const grouped =
        !isFirstMessage &&
        sameDay &&
        sameUser &&
        timeDifference >= 0 &&
        timeDifference <= 5 * 60 * 1000;

    const longGap =
        !isFirstMessage &&
        sameDay &&
        timeDifference >= 2 * 60 * 60 * 1000;

    const dayLabel =
        date.toLocaleDateString([], {
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    const timeLabel =
        date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    let divider = "";

    if (isFirstMessage || !sameDay) {
        divider = `
            <div class="message-day-divider">
                <span>${escapeHtml(dayLabel)}</span>
            </div>
        `;
    } else if (longGap) {
        divider = `
            <div class="message-time-divider">
                <span>${escapeHtml(timeLabel)}</span>
            </div>
        `;
    }

    /*
     * Attachment HTML
     */
    const attachmentHTML = attachments
        .map(attachment => {
            return renderMessageAttachment(
                attachment,
                isOwnMessage
            );
        })
        .join("");

    /*
     * YOUR MESSAGE
     */
    if (isOwnMessage) {
        return `
            ${divider}

            <article
                class="
                    message-item
                    message-own
                    ${grouped ? "message-grouped" : ""}
                "
                data-message-id="${escapeHtml(message.id)}"
            >

                <div class="message-body">

                    ${
                        !grouped
                            ? `
                                <div class="message-meta message-own-meta">

                                    <span class="message-author">
                                        you
                                    </span>

                                    <span class="message-time">
                                        ${escapeHtml(timeLabel)}
                                    </span>

                                    ${
                                        message.is_edited
                                            ? `
                                                <span class="message-edited">
                                                    (edited)
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>
                            `
                            : ""
                    }

                    ${
                        cleanContent
                            ? `
                                <div class="message-bubble message-own-bubble">
                                    ${escapeHtml(cleanContent)}
                                </div>
                            `
                            : ""
                    }

                    ${attachmentHTML}

                </div>

            </article>
        `;
    }

    /*
     * SOMEONE ELSE'S MESSAGE
     */
    const avatar = profile?.avatar_url
        ? `
            <img
                src="${escapeHtml(profile.avatar_url)}"
                alt="${escapeHtml(displayName)}"
            >
        `
        : "◇";

    return `
        ${divider}

        <article
            class="
                message-item
                message-other
                ${grouped ? "message-grouped" : ""}
            "
            data-message-id="${escapeHtml(message.id)}"
        >

            ${
                grouped
                    ? `
                        <div class="message-avatar-spacer"></div>
                    `
                    : `
                        <button
                            type="button"
                            class="message-avatar"
                            data-profile-id="${escapeHtml(message.user_id)}"
                            aria-label="View ${escapeHtml(displayName)}'s profile"
                        >
                            ${avatar}
                        </button>
                    `
            }

            <div class="message-body">

                ${
                    !grouped
                        ? `
                            <div class="message-meta">

                                <button
                                    type="button"
                                    class="message-author"
                                    data-profile-id="${escapeHtml(message.user_id)}"
                                >
                                    ${escapeHtml(displayName)}
                                </button>

                                ${
                                    profile?.username
                                        ? `
                                            <span class="message-username">
                                                @${escapeHtml(profile.username)}
                                            </span>
                                        `
                                        : ""
                                }

                                ${
                                    profile?.is_staff
                                        ? `
                                            <span class="message-staff">
                                                Staff
                                            </span>
                                        `
                                        : ""
                                }

                                <span class="message-time">
                                    ${escapeHtml(timeLabel)}
                                </span>

                                ${
                                    message.is_edited
                                        ? `
                                            <span class="message-edited">
                                                (edited)
                                            </span>
                                        `
                                        : ""
                                }

                            </div>
                        `
                        : ""
                }

                ${
                    cleanContent
                        ? `
                            <div class="message-bubble message-other-bubble">
                                ${escapeHtml(cleanContent)}
                            </div>
                        `
                        : ""
                }

                ${attachmentHTML}

            </div>

        </article>
    `;
}

function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) {
        return "Unknown size";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    let size = Number(bytes);
    let unitIndex = 0;

    while (
        size >= 1024 &&
        unitIndex < units.length - 1
    ) {
        size /= 1024;
        unitIndex++;
    }

    if (unitIndex === 0) {
        return `${Math.round(size)} ${units[unitIndex]}`;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function renderMessageAttachment(
    attachment,
    isOwnMessage
) {
    const type =
        attachment.attachment_type;

    const storagePath =
        attachment.storage_path;

    let icon = "□";
    let label = "File";
    let previewClass = "";

    if (type === "lyrdem") {
        icon = "LYR";
        label = "Nemawashi Lyrics";
        previewClass =
            "message-native-demo-attachment message-lyrdem-attachment";
    } else if (type === "prodem") {
        icon = "PRO";
        label = "Nemawashi Audio";
        previewClass =
            "message-native-demo-attachment message-prodem-attachment";
    } else if (type === "image") {
        icon = "▧";
        label = "Image";
    }

    /*
     * IMAGE
     */
    if (type === "image") {
        return `
            <div
                class="
                    message-attachment
                    message-image-attachment
                    ${isOwnMessage ? "message-attachment-own" : ""}
                "
                data-storage-path="${escapeHtml(storagePath)}"
                data-attachment-id="${escapeHtml(attachment.id)}"
            >
                <div class="message-image-loading">
                    Loading image...
                </div>
            </div>
        `;
    }

    /*
     * NEMAWASHI-NATIVE DEMO FILES
     */
    if (
        type === "lyrdem" ||
        type === "prodem"
    ) {
        const extension =
            type === "lyrdem"
                ? ".lyrdem"
                : ".prodem";

        return `
            <button
                type="button"
                class="
                    message-attachment
                    message-file-attachment
                    ${previewClass}
                    ${isOwnMessage ? "message-attachment-own" : ""}
                "
                data-attachment-id="${escapeHtml(
                    attachment.id
                )}"
            >

                <span class="message-native-file-icon">
                    ${icon}
                </span>

                <span class="message-native-file-info">

                    <span class="message-native-file-action">
                        View ${extension} file
                    </span>

                    <span class="message-native-file-shared">
                        Shared with you
                    </span>

                    <span class="message-native-file-name">
                        ${escapeHtml(
                            attachment.file_name
                        )}
                    </span>

                    <span class="message-native-file-meta">
                        ${escapeHtml(label)}
                        ·
                        ${formatFileSize(
                            attachment.file_size
                        )}
                    </span>

                </span>

            </button>
        `;
    }

    /*
     * NORMAL FILE
     */
    return `
        <button
            type="button"
            class="
                message-attachment
                message-file-attachment
                ${isOwnMessage ? "message-attachment-own" : ""}
            "
            data-storage-path="${escapeHtml(storagePath)}"
            data-attachment-id="${escapeHtml(attachment.id)}"
        >

            <span class="message-attachment-icon">
                ${icon}
            </span>

            <span class="message-attachment-info">

                <span class="message-attachment-name">
                    ${escapeHtml(
                        attachment.file_name
                    )}
                </span>

                <span class="message-attachment-type">
                    ${escapeHtml(label)}
                    ·
                    ${formatFileSize(
                        attachment.file_size
                    )}
                </span>

            </span>

        </button>
    `;
}

function setupAttachmentDownloads() {
    document
        .querySelectorAll(
            ".message-file-attachment"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async function() {

                    const attachmentId =
                        this.dataset.attachmentId;

                    if (!attachmentId) {
                        return;
                    }

                    /*
                     * LYRDEM
                     */
                    if (
                        this.classList.contains(
                            "message-lyrdem-attachment"
                        )
                    ) {
                        window.location.href =
                            `lyrdem-viewer.html?attachment=${encodeURIComponent(
                                attachmentId
                            )}`;

                        return;
                    }

                    /*
                     * PRODEM
                     */
                    if (
                        this.classList.contains(
                            "message-prodem-attachment"
                        )
                    ) {
                        window.location.href =
                            `prodem-viewer.html?attachment=${encodeURIComponent(
                                attachmentId
                            )}`;

                        return;
                    }

                    /*
                     * NORMAL FILE
                     */
                    const storagePath =
                        this.dataset.storagePath;

                    if (!storagePath) {
                        return;
                    }

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .storage
                            .from(
                                "nemawashi-attachments"
                            )
                            .createSignedUrl(
                                storagePath,
                                60 * 10
                            );

                    if (error) {
                        console.error(
                            "Could not create attachment URL:",
                            error
                        );

                        return;
                    }

                    if (data?.signedUrl) {
                        window.open(
                            data.signedUrl,
                            "_blank",
                            "noopener,noreferrer"
                        );
                    }

                }
            );

        });
}

async function loadAttachmentImages() {
    const imageAttachments =
        document.querySelectorAll(
            ".message-image-attachment"
        );

    for (const container of imageAttachments) {

        const storagePath =
            container.dataset.storagePath;

        if (!storagePath) continue;

        const {
            data,
            error
        } = await supabaseClient
            .storage
            .from("nemawashi-attachments")
            .createSignedUrl(
                storagePath,
                60 * 60
            );

        if (error) {
            console.error(
                "Could not create image URL:",
                error
            );

            container.innerHTML = `
                <div class="message-image-error">
                    Could not load image.
                </div>
            `;

            continue;
        }

        if (!data?.signedUrl) continue;

        container.innerHTML = `
            <img
                src="${escapeHtml(data.signedUrl)}"
                alt="Uploaded image"
            >
        `;
    }
}

function setupMessageComposer() {
    const composer = document.getElementById("message-composer");
    const input = document.getElementById("message-input");

    if (!composer || !input) return;

    composer.addEventListener("submit", async function(event) {
        event.preventDefault();

   const content = input.value
       .replace(/^[ \t]+|[ \t]+$/gm, "")
       .trim();

   if (!content) return;

        const {
            data: {
                user
            }
        } = await supabaseClient.auth.getUser();

        if (!user) {
            alert("You must be logged in to send messages.");
            return;
        }

        if (!currentSpace) {
            return;
        }

        const sendButton = composer.querySelector(".message-send-button");

        input.disabled = true;

        if (sendButton) {
            sendButton.disabled = true;
        }

        const { data: message, error } = await supabaseClient
            .from("nemawashi_messages")
            .insert({
                space_id: currentSpace.id,
                user_id: user.id,
                content: content
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to send message:", error);

            input.disabled = false;

            if (sendButton) {
                sendButton.disabled = false;
            }

            return;
        }

        input.value = "";

        input.disabled = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        appendNewMessage(message, user.id);

        input.focus();
    });

    input.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            composer.requestSubmit();
        }
    });
}

function appendNewMessage(message, currentUserId) {
    const messagesList = document.getElementById("messages-list");

    if (!messagesList || !message || !currentSpace) return;

    const previousMessage =
        currentMessages.length
            ? currentMessages[currentMessages.length - 1]
            : null;

    const previousProfile =
        previousMessage
            ? currentMessageProfiles.get(previousMessage.user_id) || null
            : null;

    const messageHTML = renderMessage(
        message,
        currentMessageProfiles.get(message.user_id) || null,
        currentUserId,
        previousProfile,
        previousMessage,
        currentMessages.length === 0,
        currentMessageAttachments.get(message.id) || []
    );

    const emptyState =
        messagesList.querySelector(".messages-empty");

    if (emptyState) {
        emptyState.remove();
    }

    messagesList.insertAdjacentHTML(
        "beforeend",
        messageHTML
    );

    currentMessages.push(message);

    const newMessageElement =
        messagesList.querySelector(
            `[data-message-id="${CSS.escape(String(message.id))}"]`
        );

    if (newMessageElement) {
        newMessageElement.classList.add(
            "message-entering"
        );

        newMessageElement.addEventListener(
            "animationend",
            function() {
                newMessageElement.classList.remove(
                    "message-entering"
                );
            },
            { once: true }
        );
    }

    if (typeof setupAttachmentDownloads === "function") {
        setupAttachmentDownloads();
    }

    requestAnimationFrame(() => {
        scrollMessagesToBottom(true);
    });
}

function scrollMessagesToBottom(
    smooth = false
) {
    const messagesList =
        document.getElementById("messages-list");

    if (!messagesList) {
        return;
    }

    messagesList.scrollTo({
        top: messagesList.scrollHeight,
        behavior: smooth
            ? "smooth"
            : "auto"
    });
}

/* ============================================================
   SPACE ICONS
============================================================ */

function getSpaceIcon(
    type
) {

    switch (type) {

        case "general":
            return "◌";

        case "planning":
            return "◇";

        case "feedback":
            return "◎";

        case "info":
            return "ⓘ";

        case "creative":
            return "✦";

        case "music":
            return "♫";

        case "meeting":
            return "◉";

        case "app_creating":
            return "＋";

        case "project":
            return "◆";

        case "massive_project":
            return "◆";

        default:
            return "◌";

    }

}


/* ============================================================
   APP THEME
============================================================ */

function applyAppTheme(
    app
) {

    if (!app) {

        return;

    }


    document.documentElement.style.setProperty(
        "--messages-background",
        app.background_color
    );


    document.documentElement.style.setProperty(
        "--messages-accent",
        app.primary_color
    );


    document.documentElement.style.setProperty(
        "--messages-accent-soft",
        hexToRgba(
            app.primary_color,
            0.10
        )
    );


    document.documentElement.style.setProperty(
        "--app-secondary",
        app.secondary_color
    );


    document.documentElement.style.setProperty(
        "--app-accent",
        app.accent_color
    );


    document.documentElement.style.setProperty(
        "--app-text",
        app.text_color
    );

}


/* ============================================================
   RESET THEME
============================================================ */

function resetNemawashiTheme() {

    applyAppTheme({

        background_color: "#f7f7fb",

        primary_color: "#636bd8",

        secondary_color: "#aeb3f1",

        accent_color: "#4f57c7",

        text_color: "#292a35"

    });

}


/* ============================================================
   TOPBAR
============================================================ */

function setTopbar(
    label,
    title
) {

    if (topbarLabel) {

        topbarLabel.textContent =
            label;

    }


    if (topbarTitle) {

        topbarTitle.textContent =
            title;

    }


    document.title =
        `根回し - ${title}`;
   
}


/* ============================================================
   HEX → RGBA
============================================================ */

function hexToRgba(
    hex,
    alpha
) {

    if (!hex) {

        return `rgba(99,107,216,${alpha})`;

    }


    let value =
        hex.replace(
            "#",
            ""
        );


    if (value.length === 3) {

        value =
            value
                .split("")
                .map(
                    character =>
                        character + character
                )
                .join("");

    }


    const number =
        parseInt(
            value,
            16
        );


    const red =
        (number >> 16) & 255;


    const green =
        (number >> 8) & 255;


    const blue =
        number & 255;


    return `
        rgba(
            ${red},
            ${green},
            ${blue},
            ${alpha}
        )
    `;

}


/* ============================================================
   ERROR
============================================================ */

function showError(
    message
) {

    if (!messagesContent) {

        return;

    }


    messagesContent.innerHTML = `

        <section
            class="communication-page"
        >

            <div
                class="communication-intro"
            >

                <span
                    class="communication-eyebrow"
                >
                    NEMAWASHI
                </span>


                <h2>
                    Something went wrong
                </h2>


                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        </section>

    `;

}


/* ============================================================
   HTML ESCAPING
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

/* ============================================================
   NEMAWASHI MUSIC SPACE
   FIRST BUILD
============================================================ */

const NEMAWASHI_MUSIC_CONFIG = {

    youtubeCollaborator: {
        name: "Hrmnx Entertainment",
        handle: "@harmoniajp",
        role: "Official Hrmnx YouTube collaborator"
    },

    daws: [
        "Ableton Live",
        "FL Studio",
        "Logic Pro",
        "Cubase",
        "Studio One",
        "Pro Tools",
        "REAPER",
        "GarageBand",
        "Other"
    ]

};


/* ============================================================
   KEEP ORIGINAL SPACE LOADING
============================================================ */

const nemawashiOriginalSelectSpace = selectSpace;

selectSpace = async function(spaceId) {

    await nemawashiOriginalSelectSpace(spaceId);

    if (
        currentSpace &&
        currentSpace.space_type === "music"
    ) {
        initializeMusicSpace();
    }

};


/* ============================================================
   MUSIC SPACE
============================================================ */

function initializeMusicSpace() {

    const spaceChat =
        document.getElementById("space-chat");

    if (!spaceChat) {
        return;
    }


    /*
     * Prevent duplicate initialization.
     */

    if (
        document.getElementById(
            "music-space-controls"
        )
    ) {
        return;
    }


    const controls =
        document.createElement("div");

    controls.id =
        "music-space-controls";

    controls.className =
        "music-space-controls";


    controls.innerHTML = `

        <div class="music-space-project">

            <div class="music-project-icon">
                ♫
            </div>

            <div class="music-project-copy">

                <span class="music-project-label">
                    MUSIC SPACE
                </span>

                <strong>
                    ${escapeHtml(
                        currentSpace?.name ||
                        "Untitled Project"
                    )}
                </strong>

                <small>
                    Collaborative music session
                </small>

            </div>

        </div>


        <div class="music-space-actions">

            <button
                type="button"
                class="music-action-button primary"
                id="start-new-call-button"
            >
                <span>＋</span>
                Start a new call
            </button>

        </div>

    `;


    spaceChat.prepend(
        controls
    );


    document
        .getElementById(
            "start-new-call-button"
        )
        ?.addEventListener(
            "click",
            openMusicCallSetup
        );

}


/* ============================================================
   CALL SETUP
============================================================ */

let musicCallState = {

    step: 0,

    projectName: "",
    bpm: "",
    key: "",
    timeSignature: "4/4",
    projectType: "Song",
    description: "",
    referenceLink: "",

    invitees: [],

    daw: "",

    openSpace: false,

    visitors: true,

    visitorChat: true,

    announcements: {
        kiki: false,
        serashio: false,
        links: false
    },

    livestream: false,

    youtubePremiere: false

};


const musicCallSteps = [

    {
        id: "invite",

        title: "Who do you want to invite?",

        subtitle:
            "Choose the people who should be part of this music call."
    },

    {
        id: "daw",

        title:
            "What DAW do you use for this project?",

        subtitle:
            "This helps everyone know what the project is being created in."
    },

    {
        id: "open",

        title:
            "Would you like to make this an Open Space?",

        subtitle:
            "Open Spaces allow visitors to join the project."
    },

    {
        id: "announcements",

        title:
            "What should visitors be able to see?",

        subtitle:
            "Choose the public communication channels for this Space."
    },

    {
        id: "livestream",

        title:
            "Would you like to livestream this?",

        subtitle:
            "You can connect the Space to the official Hrmnx YouTube channel."
    },

    {
        id: "review",

        title:
            "Everything is ready.",

        subtitle:
            "Review your Music Space before starting the call."
    }

];


/* ============================================================
   OPEN SETUP
============================================================ */

async function openMusicCallSetup() {

    musicCallState = {

        step: 0,

        projectName: "",
        bpm: "",
        key: "",
        timeSignature: "4/4",
        projectType: "Song",
        description: "",
        referenceLink: "",

        invitees: [],

        daw: "",

        openSpace: false,

        visitors: true,

        visitorChat: true,

        announcements: {
            kiki: false,
            serashio: false,
            links: false
        },

        livestream: false,

        youtubePremiere: false

    };


    await loadMusicInvitePeople();

    renderMusicCallSetup();

}


/* ============================================================
   INVITE PEOPLE
============================================================ */

let musicInvitePeople = [];


async function loadMusicInvitePeople() {

    musicInvitePeople = [];


    if (
        typeof supabaseClient ===
        "undefined"
    ) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    display_name,
                    username,
                    avatar_url
                `)
                .order(
                    "display_name",
                    {
                        ascending: true
                    }
                )
                .limit(100);


        if (!error) {

            musicInvitePeople =
                data || [];

        }

    }

    catch (error) {

        console.error(
            "Music invite loading error:",
            error
        );

    }

}


/* ============================================================
   SETUP OVERLAY
============================================================ */

function renderMusicCallSetup() {

    let overlay =
        document.getElementById(
            "music-call-setup"
        );


    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "music-call-setup";

        overlay.className =
            "music-call-setup";


        document.body.appendChild(
            overlay
        );

    }


    const step =
        musicCallSteps[
            musicCallState.step
        ];


    overlay.innerHTML = `

        <div class="music-call-backdrop"></div>


        <section
            class="music-call-window"
            aria-label="Start a new Music Space call"
        >

            <button
                type="button"
                class="music-call-close"
                id="music-call-close"
                aria-label="Close"
            >
                ×
            </button>


            <div class="music-call-progress">

                ${musicCallSteps
                    .map(
                        (_, index) => `
                            <span
                                class="${
                                    index ===
                                    musicCallState.step
                                        ? "active"
                                        : ""
                                } ${
                                    index <
                                    musicCallState.step
                                        ? "completed"
                                        : ""
                                }"
                            ></span>
                        `
                    )
                    .join("")}

            </div>


            <div
                class="music-call-question"
                id="music-call-question"
            >

                ${renderMusicCallStep(
                    step.id
                )}

            </div>


            <div class="music-call-navigation">

                <button
                    type="button"
                    class="music-call-back"
                    id="music-call-back"
                    ${
                        musicCallState.step === 0
                            ? "disabled"
                            : ""
                    }
                >
                    Back
                </button>


                <button
                    type="button"
                    class="music-call-next"
                    id="music-call-next"
                >
                    ${
                        musicCallState.step ===
                        musicCallSteps.length - 1
                            ? "Start the call"
                            : "Next"
                    }
                    <span>→</span>
                </button>

            </div>

        </section>

    `;


    requestAnimationFrame(
        () => {

            overlay.classList.add(
                "visible"
            );

        }
    );


    document
        .getElementById(
            "music-call-close"
        )
        ?.addEventListener(
            "click",
            closeMusicCallSetup
        );


    document
        .querySelector(
            ".music-call-backdrop"
        )
        ?.addEventListener(
            "click",
            closeMusicCallSetup
        );


    document
        .getElementById(
            "music-call-next"
        )
        ?.addEventListener(
            "click",
            nextMusicCallStep
        );


    document
        .getElementById(
            "music-call-back"
        )
        ?.addEventListener(
            "click",
            previousMusicCallStep
        );


    setupMusicStepInteractions();

}


/* ============================================================
   STEP CONTENT
============================================================ */

function renderMusicCallStep(
    stepId
) {

    switch (stepId) {


        /* ----------------------------------------------------
           INVITE
        ---------------------------------------------------- */

        case "invite":

            return `

                <div class="music-step-heading">

                    <span class="music-step-number">
                        01
                    </span>

                    <h2>
                        Who do you want to invite?
                    </h2>

                    <p>
                        Select the people who should
                        participate in this call.
                    </p>

                </div>


                <div class="music-invite-search">

                    <input
                        id="music-invite-search"
                        type="search"
                        placeholder="Search people..."
                        autocomplete="off"
                    >

                </div>


                <div
                    class="music-invite-list"
                    id="music-invite-list"
                >

                    ${renderMusicInvitePeople()}

                </div>

            `;


        /* ----------------------------------------------------
           DAW
        ---------------------------------------------------- */

        case "daw":

            return `

                <div class="music-step-heading">

                    <span class="music-step-number">
                        02
                    </span>

                    <h2>
                        What DAW do you use for this project?
                    </h2>

                    <p>
                        Choose the software being used
                        for this project.
                    </p>

                </div>


                <label
                    class="music-select-label"
                    for="music-daw"
                >
                    DAW
                </label>


                <select
                    id="music-daw"
                    class="music-large-select"
                >

                    <option value="">
                        Select a DAW
                    </option>

                    ${NEMAWASHI_MUSIC_CONFIG.daws
                        .map(
                            daw => `
                                <option
                                    value="${escapeHtml(daw)}"
                                    ${
                                        musicCallState.daw === daw
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(daw)}
                                </option>
                            `
                        )
                        .join("")}

                </select>

            `;


        /* ----------------------------------------------------
           OPEN SPACE
        ---------------------------------------------------- */

        case "open":

            return `

                <div class="music-step-heading">

                    <span class="music-step-number">
                        03
                    </span>

                    <h2>
                        Would you like to make this an Open Space?
                    </h2>

                    <p>
                        Open Spaces allow visitors to join
                        and follow the project.
                    </p>

                </div>


                <div class="music-choice-grid">

                    <button
                        type="button"
                        class="music-choice-card ${
                            musicCallState.openSpace
                                ? "selected"
                                : ""
                        }"
                        data-open-space="yes"
                    >

                        <span class="music-choice-icon">
                            ◉
                        </span>

                        <strong>
                            Yes, make it open
                        </strong>

                        <small>
                            Visitors can join the Space.
                        </small>

                    </button>


                    <button
                        type="button"
                        class="music-choice-card ${
                            !musicCallState.openSpace
                                ? "selected"
                                : ""
                        }"
                        data-open-space="no"
                    >

                        <span class="music-choice-icon">
                            ◌
                        </span>

                        <strong>
                            Keep it private
                        </strong>

                        <small>
                            Only invited participants can join.
                        </small>

                    </button>

                </div>


                ${
                    musicCallState.openSpace
                        ? `

                            <div class="music-open-options">

                                <label class="music-toggle-row">

                                    <span>
                                        <strong>
                                            Allow visitors
                                        </strong>

                                        <small>
                                            Let visitors enter the Space.
                                        </small>
                                    </span>

                                    <input
                                        type="checkbox"
                                        id="music-visitors"
                                        ${
                                            musicCallState.visitors
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                </label>


                                <label class="music-toggle-row">

                                    <span>
                                        <strong>
                                            Visitor chat
                                        </strong>

                                        <small>
                                            Give visitors their own chat tab.
                                        </small>
                                    </span>

                                    <input
                                        type="checkbox"
                                        id="music-visitor-chat"
                                        ${
                                            musicCallState.visitorChat
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                </label>

                            </div>

                        `
                        : ""
                }

            `;


        /* ----------------------------------------------------
           ANNOUNCEMENTS
        ---------------------------------------------------- */

        case "announcements":

            return `

                <div class="music-step-heading">

                    <span class="music-step-number">
                        04
                    </span>

                    <h2>
                        What should visitors be able to see?
                    </h2>

                    <p>
                        These become announcement tabs
                        inside the Open Space.
                    </p>

                </div>


                <div class="music-announcement-options">

                    ${renderAnnouncementOption(
                        "kiki",
                        "KiKi",
                        "Community announcements"
                    )}

                    ${renderAnnouncementOption(
                        "serashio",
                        "Serashio",
                        "Serashio announcements"
                    )}

                    ${renderAnnouncementOption(
                        "links",
                        "Links",
                        "Useful project links"
                    )}

                </div>

            `;


        /* ----------------------------------------------------
           LIVESTREAM
        ---------------------------------------------------- */

        case "livestream":

            return `

                <div class="music-step-heading">

                    <span class="music-step-number">
                        05
                    </span>

                    <h2>
                        Would you like to livestream this?
                    </h2>

                    <p>
                        YouTube viewers can participate in
                        the conversation too.
                    </p>

                </div>


                <div class="youtube-collaborator-card">

                    <div class="youtube-icon">
                        ▶
                    </div>

                    <div>

                        <span>
                            REQUIRED COLLABORATOR
                        </span>

                        <strong>
                            Hrmnx Entertainment
                        </strong>

                        <small>
                            ${escapeHtml(
                                NEMAWASHI_MUSIC_CONFIG
                                    .youtubeCollaborator
                                    .handle
                            )}
                        </small>

                    </div>

                    <div class="youtube-check">
                        ✓
                    </div>

                </div>


                <div class="music-choice-grid">

                    <button
                        type="button"
                        class="music-choice-card ${
                            musicCallState.livestream
                                ? "selected"
                                : ""
                        }"
                        data-livestream="yes"
                    >

                        <span class="music-choice-icon">
                            ▶
                        </span>

                        <strong>
                            Livestream to YouTube
                        </strong>

                        <small>
                            Sync the YouTube chat with Nemawashi.
                        </small>

                    </button>


                    <button
                        type="button"
                        class="music-choice-card ${
                            !musicCallState.livestream
                                ? "selected"
                                : ""
                        }"
                        data-livestream="no"
                    >

                        <span class="music-choice-icon">
                            ◌
                        </span>

                        <strong>
                            Don't livestream
                        </strong>

                        <small>
                            Keep this call inside Nemawashi.
                        </small>

                    </button>

                </div>


                ${
                    musicCallState.livestream
                        ? `

                            <label
                                class="music-toggle-row youtube-premiere-toggle"
                            >

                                <span>

                                    <strong>
                                        Save as a YouTube Premiere
                                    </strong>

                                    <small>
                                        The finished livestream can later
                                        appear as a Premiere.
                                    </small>

                                </span>

                                <input
                                    type="checkbox"
                                    id="music-youtube-premiere"
                                    ${
                                        musicCallState
                                            .youtubePremiere
                                                ? "checked"
                                                : ""
                                    }
                                >

                            </label>

                        `
                        : ""
                }

            `;


        /* ----------------------------------------------------
           REVIEW
        ---------------------------------------------------- */

        case "review":

            return renderMusicCallReview();


        default:

            return "";

    }

}


/* ============================================================
   INVITE PEOPLE HTML
============================================================ */

function renderMusicInvitePeople(
    search = ""
) {

    const normalized =
        search
            .trim()
            .toLowerCase();


    const people =
        musicInvitePeople
            .filter(
                person => {

                    if (!normalized) {
                        return true;
                    }

                    return (
                        String(
                            person.display_name ||
                            ""
                        )
                        .toLowerCase()
                        .includes(normalized)

                        ||

                        String(
                            person.username ||
                            ""
                        )
                        .toLowerCase()
                        .includes(normalized)
                    );

                }
            );


    if (!people.length) {

        return `

            <div class="music-invite-empty">
                No people found.
            </div>

        `;

    }


    return people
        .map(
            person => {

                const selected =
                    musicCallState
                        .invitees
                        .includes(person.id);


                return `

                    <button
                        type="button"
                        class="music-person-option ${
                            selected
                                ? "selected"
                                : ""
                        }"
                        data-person-id="${
                            escapeHtml(person.id)
                        }"
                    >

                        ${
                            person.avatar_url
                                ? `
                                    <img
                                        src="${
                                            escapeHtml(
                                                person.avatar_url
                                            )
                                        }"
                                        alt=""
                                    >
                                `
                                : `
                                    <span class="music-person-avatar">
                                        ${
                                            String(
                                                person.display_name ||
                                                person.username ||
                                                "?"
                                            )
                                            .charAt(0)
                                            .toUpperCase()
                                        }
                                    </span>
                                `
                        }


                        <span>

                            <strong>
                                ${
                                    escapeHtml(
                                        person.display_name ||
                                        person.username ||
                                        "Unknown"
                                    )
                                }
                            </strong>

                            <small>
                                ${
                                    person.username
                                        ? "@" +
                                          escapeHtml(
                                              person.username
                                          )
                                        : ""
                                }
                            </small>

                        </span>


                        <span class="music-person-check">
                            ${selected ? "✓" : ""}
                        </span>

                    </button>

                `;

            }
        )
        .join("");

}


/* ============================================================
   ANNOUNCEMENT OPTION
============================================================ */

function renderAnnouncementOption(
    key,
    title,
    description
) {

    const selected =
        musicCallState
            .announcements[key];


    return `

        <button
            type="button"
            class="music-announcement-option ${
                selected
                    ? "selected"
                    : ""
            }"
            data-announcement="${key}"
        >

            <span class="music-announcement-icon">
                ${
                    key === "kiki"
                        ? "K"
                        : key === "serashio"
                            ? "S"
                            : "↗"
                }
            </span>


            <span>

                <strong>
                    ${title}
                </strong>

                <small>
                    ${description}
                </small>

            </span>


            <span class="music-person-check">
                ${selected ? "✓" : ""}
            </span>

        </button>

    `;

}


/* ============================================================
   REVIEW
============================================================ */

function renderMusicCallReview() {

    const selectedNames =
        musicCallState.invitees
            .map(
                id =>
                    musicInvitePeople.find(
                        person =>
                            String(person.id) ===
                            String(id)
                    )
            )
            .filter(Boolean)
            .map(
                person =>
                    person.display_name ||
                    person.username
            );


    const announcements =
        Object.entries(
            musicCallState.announcements
        )
        .filter(
            ([, enabled]) => enabled
        )
        .map(
            ([key]) =>
                key === "kiki"
                    ? "KiKi"
                    : key === "serashio"
                        ? "Serashio"
                        : "Links"
        );


    return `

        <div class="music-step-heading">

            <span class="music-step-number">
                06
            </span>

            <h2>
                Everything is ready.
            </h2>

            <p>
                Review your Music Space before starting the call.
            </p>

        </div>


        <div class="music-review">

            <div>
                <span>INVITED</span>
                <strong>
                    ${
                        selectedNames.length
                            ? selectedNames.join(", ")
                            : "Nobody yet"
                    }
                </strong>
            </div>


            <div>
                <span>DAW</span>
                <strong>
                    ${
                        musicCallState.daw ||
                        "Not selected"
                    }
                </strong>
            </div>


            <div>
                <span>SPACE</span>
                <strong>
                    ${
                        musicCallState.openSpace
                            ? "Open Space"
                            : "Private Space"
                    }
                </strong>
            </div>


            <div>
                <span>ANNOUNCEMENTS</span>
                <strong>
                    ${
                        announcements.length
                            ? announcements.join(", ")
                            : "None"
                    }
                </strong>
            </div>


            <div>
                <span>YOUTUBE</span>
                <strong>
                    ${
                        musicCallState.livestream
                            ? "Live with Hrmnx collaborator"
                            : "Not enabled"
                    }
                </strong>
            </div>

        </div>


        ${
            musicCallState.livestream
                ? `

                    <div class="music-review-notice">

                        <strong>
                            YouTube collaboration enabled
                        </strong>

                        <span>
                            Hrmnx Entertainment
                            ${
                                NEMAWASHI_MUSIC_CONFIG
                                    .youtubeCollaborator
                                    .handle
                            }
                            will always be included as
                            a collaborator.
                        </span>

                    </div>

                `
                : ""
        }

    `;

}


/* ============================================================
   STEP INTERACTIONS
============================================================ */

function setupMusicStepInteractions() {

    const search =
        document.getElementById(
            "music-invite-search"
        );


    if (search) {

        search.addEventListener(
            "input",
            function() {

                const list =
                    document.getElementById(
                        "music-invite-list"
                    );

                if (!list) {
                    return;
                }

                list.innerHTML =
                    renderMusicInvitePeople(
                        this.value
                    );

                setupMusicStepInteractions();

            }
        );

    }


    document
        .querySelectorAll(
            ".music-person-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const id =
                            this.dataset.personId;


                        if (
                            musicCallState
                                .invitees
                                .includes(id)
                        ) {

                            musicCallState
                                .invitees =
                                musicCallState
                                    .invitees
                                    .filter(
                                        item =>
                                            item !== id
                                    );

                        }

                        else {

                            musicCallState
                                .invitees
                                .push(id);

                        }


                        renderMusicCallSetup();

                    }
                );

            }
        );


    const daw =
        document.getElementById(
            "music-daw"
        );


    if (daw) {

        daw.addEventListener(
            "change",
            function() {

                musicCallState.daw =
                    this.value;

            }
        );

    }


    document
        .querySelectorAll(
            "[data-open-space]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        musicCallState.openSpace =
                            this.dataset.openSpace ===
                            "yes";

                        renderMusicCallSetup();

                    }
                );

            }
        );


    const visitors =
        document.getElementById(
            "music-visitors"
        );


    if (visitors) {

        visitors.addEventListener(
            "change",
            function() {

                musicCallState.visitors =
                    this.checked;

            }
        );

    }


    const visitorChat =
        document.getElementById(
            "music-visitor-chat"
        );


    if (visitorChat) {

        visitorChat.addEventListener(
            "change",
            function() {

                musicCallState.visitorChat =
                    this.checked;

            }
        );

    }


    document
        .querySelectorAll(
            "[data-announcement]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const key =
                            this.dataset.announcement;

                        musicCallState
                            .announcements[key] =
                            !musicCallState
                                .announcements[key];

                        renderMusicCallSetup();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-livestream]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        musicCallState.livestream =
                            this.dataset.livestream ===
                            "yes";

                        renderMusicCallSetup();

                    }
                );

            }
        );


    const premiere =
        document.getElementById(
            "music-youtube-premiere"
        );


    if (premiere) {

        premiere.addEventListener(
            "change",
            function() {

                musicCallState
                    .youtubePremiere =
                    this.checked;

            }
        );

    }

}

function renderMusicProjectStep() {
    return `
        <div class="music-question">

            <div class="music-call-setup-kicker">
                MUSIC PROJECT
            </div>

            <div class="music-call-setup-title">
                What are you working on?
            </div>

            <div class="music-call-setup-description">
                Set the basic information for this music project.
                Everyone in the call will be able to see these details.
            </div>

            <div style="margin-top:24px;">

                <label style="
                    display:block;
                    font-size:12px;
                    font-weight:700;
                    margin-bottom:7px;
                ">
                    Project name
                </label>

                <input
                    id="music-project-name"
                    type="text"
                    class="music-invite-search"
                    placeholder="e.g. Twin Stars"
                    value="${escapeMusicHTML(musicCallState.projectName)}"
                />

            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(2, minmax(0, 1fr));
                gap:12px;
                margin-top:15px;
            ">

                <div>

                    <label style="
                        display:block;
                        font-size:12px;
                        font-weight:700;
                        margin-bottom:7px;
                    ">
                        BPM
                    </label>

                    <input
                        id="music-project-bpm"
                        type="number"
                        min="20"
                        max="400"
                        class="music-invite-search"
                        placeholder="128"
                        value="${escapeMusicHTML(musicCallState.bpm)}"
                    />

                </div>

                <div>

                    <label style="
                        display:block;
                        font-size:12px;
                        font-weight:700;
                        margin-bottom:7px;
                    ">
                        Key
                    </label>

                    <select
                        id="music-project-key"
                        class="music-daw-select"
                    >

                        ${[
                            "C",
                            "C♯ / D♭",
                            "D",
                            "D♯ / E♭",
                            "E",
                            "F",
                            "F♯ / G♭",
                            "G",
                            "G♯ / A♭",
                            "A",
                            "A♯ / B♭",
                            "B"
                        ].map(key => `
                            <option
                                value="${escapeMusicHTML(key)}"
                                ${musicCallState.key === key ? "selected" : ""}
                            >
                                ${escapeMusicHTML(key)}
                            </option>
                        `).join("")}

                    </select>

                </div>

            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(2, minmax(0, 1fr));
                gap:12px;
                margin-top:15px;
            ">

                <div>

                    <label style="
                        display:block;
                        font-size:12px;
                        font-weight:700;
                        margin-bottom:7px;
                    ">
                        Time signature
                    </label>

                    <select
                        id="music-project-time-signature"
                        class="music-daw-select"
                    >

                        ${[
                            "4/4",
                            "3/4",
                            "6/8",
                            "2/4",
                            "5/4",
                            "7/8",
                            "9/8",
                            "12/8"
                        ].map(signature => `
                            <option
                                value="${signature}"
                                ${musicCallState.timeSignature === signature ? "selected" : ""}
                            >
                                ${signature}
                            </option>
                        `).join("")}

                    </select>

                </div>

                <div>

                    <label style="
                        display:block;
                        font-size:12px;
                        font-weight:700;
                        margin-bottom:7px;
                    ">
                        Project type
                    </label>

                    <select
                        id="music-project-type"
                        class="music-daw-select"
                    >

                        ${[
                            "Song",
                            "Beat",
                            "Album",
                            "EP",
                            "OST",
                            "Remix",
                            "Demo",
                            "Other"
                        ].map(type => `
                            <option
                                value="${type}"
                                ${musicCallState.projectType === type ? "selected" : ""}
                            >
                                ${type}
                            </option>
                        `).join("")}

                    </select>

                </div>

            </div>

            <div style="margin-top:15px;">

                <label style="
                    display:block;
                    font-size:12px;
                    font-weight:700;
                    margin-bottom:7px;
                ">
                    Description / notes
                </label>

                <textarea
                    id="music-project-description"
                    class="music-invite-search"
                    rows="4"
                    placeholder="What are you working on?"
                    style="resize:vertical;"
                >${escapeMusicHTML(musicCallState.description)}</textarea>

            </div>

            <div style="margin-top:15px;">

                <label style="
                    display:block;
                    font-size:12px;
                    font-weight:700;
                    margin-bottom:7px;
                ">
                    Reference / demo link
                    <span style="opacity:.4;">
                        optional
                    </span>
                </label>

                <input
                    id="music-project-reference"
                    type="url"
                    class="music-invite-search"
                    placeholder="https://..."
                    value="${escapeMusicHTML(musicCallState.referenceLink)}"
                />

            </div>

        </div>
    `;
}


/* ============================================================
   NAVIGATION
============================================================ */

function nextMusicCallStep() {

    if (
        musicCallState.step === 1 &&
        !musicCallState.daw
    ) {

        alert(
            "Please select the DAW used for this project."
        );

        return;

    }


    if (
        musicCallState.step <
        musicCallSteps.length - 1
    ) {

        animateMusicStep(
            "next",
            () => {

                musicCallState.step++;

                renderMusicCallSetup();

            }
        );

        return;

    }


    startMusicCall();

}


function previousMusicCallStep() {

    if (
        musicCallState.step <= 0
    ) {

        return;

    }


    animateMusicStep(
        "previous",
        () => {

            musicCallState.step--;

            renderMusicCallSetup();

        }
    );

}


/* ============================================================
   SMOOTH QUESTION TRANSITION
============================================================ */

function animateMusicStep(
    direction,
    callback
) {

    const question =
        document.getElementById(
            "music-call-question"
        );


    if (!question) {

        callback();

        return;

    }


    question.classList.add(
        direction === "next"
            ? "question-leaving-next"
            : "question-leaving-previous"
    );


    setTimeout(
        callback,
        260
    );

}


/* ============================================================
   CLOSE
============================================================ */

function closeMusicCallSetup() {

    const overlay =
        document.getElementById(
            "music-call-setup"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "visible"
    );


    setTimeout(
        () => {

            overlay.remove();

        },
        300
    );

}


/* ============================================================
   START CALL
============================================================ */

async function startMusicCall() {
    const setup = document.querySelector(".music-call-setup");

    if (!setup) return;

    const projectName =
        currentSpace?.name ||
        "Untitled Music Project";

    const callId =
        "music-call-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 8);

    // Make sure the official Hrmnx collaborator can never be removed.
    const callConfig = {
        id: callId,
        projectName: projectName,

        invitees: [...musicCallState.invitees],

        daw: musicCallState.daw || "Not specified",

        openSpace: musicCallState.openSpace,
        visitors: musicCallState.visitors,
        visitorChat: musicCallState.visitorChat,

        announcements: {
            kiki: !!musicCallState.announcements.kiki,
            serashio: !!musicCallState.announcements.serashio,
            links: !!musicCallState.announcements.links
        },

        livestream: !!musicCallState.livestream,
        youtubePremiere: !!musicCallState.youtubePremiere,

        youtubeCollaborator: {
            ...NEMAWASHI_MUSIC_CONFIG.youtubeCollaborator
        },

        createdAt: new Date().toISOString()
    };

    // Store temporarily so the room can access it.
    window.activeNemawashiMusicCall = callConfig;

    setup.innerHTML = `
        <div class="music-call-setup-header">
            <div class="music-call-setup-kicker">
                MUSIC SPACE
            </div>

            <div class="music-call-setup-title">
                Creating your music call…
            </div>

            <div class="music-call-setup-description">
                Preparing the collaboration room for
                ${escapeMusicHTML(projectName)}.
            </div>
        </div>
    `;

    await new Promise(resolve => setTimeout(resolve, 500));

    openMusicCallRoom(callConfig);
}

/* ============================================================
   CALL STARTED UI
============================================================ */

function showMusicCallStarted(
    configuration
) {

    const spaceChat =
        document.getElementById(
            "space-chat"
        );


    if (!spaceChat) {
        return;
    }


    const banner =
        document.createElement(
            "div"
        );


    banner.className =
        "music-call-live-banner";


    banner.innerHTML = `

        <div>

            <span class="live-dot"></span>

            <div>

                <strong>
                    Music call ready
                </strong>

                <small>
                    ${
                        configuration.daw
                    }
                    ${
                        configuration.livestream
                            ? " · YouTube enabled"
                            : ""
                    }
                </small>

            </div>

        </div>


        <button
            type="button"
            id="enter-music-call-button"
        >
            Enter call →
        </button>

    `;


    spaceChat.prepend(
        banner
    );

}

/* =========================================================
   NEMAWASHI MUSIC CALL ROOM
   ========================================================= */

function escapeMusicHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ---------------------------------------------------------
   OPEN CALL ROOM
   --------------------------------------------------------- */

function openMusicCallRoom(callConfig) {

    const placeholder =
        document.querySelector(".space-placeholder");

    const chat =
        document.querySelector(".space-chat");

    const target = placeholder || chat;

    if (!target) {
        console.error(
            "Nemawashi Music Space: Could not find space container."
        );
        return;
    }

    target.innerHTML = createMusicCallRoomHTML(callConfig);

    target.classList.add("music-room-active");

    setupMusicCallRoom(callConfig);
}


/* ---------------------------------------------------------
   ROOM HTML
   --------------------------------------------------------- */

function createMusicCallRoomHTML(callConfig) {

    const participantCount =
        1 + (callConfig.invitees?.length || 0);

    const openLabel =
        callConfig.openSpace
            ? "Open Space"
            : "Private Space";

    return `
        <div class="music-call-window">

            <!-- HEADER -->

            <div class="music-call-header">

                <div class="music-call-header-left">

                    <div class="music-call-header-title">

                        <span class="music-call-live-dot"></span>

                        <span>
                            ${escapeMusicHTML(callConfig.projectName)}
                        </span>

                    </div>

                    <div class="music-call-header-meta">

                        ${escapeMusicHTML(callConfig.daw)}
                        ·
                        ${participantCount}
                        participant${participantCount === 1 ? "" : "s"}
                        ·
                        ${openLabel}

                    </div>

                </div>


                <div class="music-call-header-actions">

                    ${
                        callConfig.livestream
                            ? `
                                <button
                                    class="music-action-button"
                                    id="music-live-button"
                                    type="button"
                                >
                                    ● Live
                                </button>
                              `
                            : ""
                    }

                    <button
                        class="music-action-button secondary"
                        id="music-leave-call"
                        type="button"
                    >
                        Leave call
                    </button>

                </div>

            </div>


            <!-- MAIN STAGE -->

            <div class="music-call-stage">

                <!-- PROJECT -->

                <div class="music-project-panel">

                    <div class="music-project-panel-label">
                        Current project
                    </div>

                    <div class="music-project-panel-title">
                        ${escapeMusicHTML(callConfig.projectName)}
                    </div>

                    <div class="music-project-panel-daw">
                        ${escapeMusicHTML(callConfig.daw)}
                    </div>

                </div>


                <!-- ANNOUNCEMENTS -->

                <div class="music-announcement-bar">

                    ${
                        callConfig.announcements.kiki
                            ? `
                                <button
                                    class="music-announcement-button"
                                    data-announcement="kiki"
                                    type="button"
                                >
                                    KiKi
                                </button>
                              `
                            : ""
                    }

                    ${
                        callConfig.announcements.serashio
                            ? `
                                <button
                                    class="music-announcement-button"
                                    data-announcement="serashio"
                                    type="button"
                                >
                                    Serashio
                                </button>
                              `
                            : ""
                    }

                    ${
                        callConfig.announcements.links
                            ? `
                                <button
                                    class="music-announcement-button"
                                    data-announcement="links"
                                    type="button"
                                >
                                    Links
                                </button>
                              `
                            : ""
                    }

                </div>


                ${
                    callConfig.livestream
                        ? `
                            <div class="music-live-banner">

                                <span class="music-live-banner-dot"></span>

                                <span>
                                    YouTube livestream ready
                                    ·
                                    ${escapeMusicHTML(
                                        callConfig.youtubeCollaborator.handle
                                    )}
                                </span>

                            </div>
                          `
                        : ""
                }


                <!-- CHAT TABS -->

                <div class="music-chat-tabs">

                    <button
                        type="button"
                        class="music-chat-tab active"
                        data-chat-tab="participants"
                    >
                        Nemawashi Chat
                    </button>

                    ${
                        callConfig.openSpace &&
                        callConfig.visitorChat
                            ? `
                                <button
                                    type="button"
                                    class="music-chat-tab"
                                    data-chat-tab="visitors"
                                >
                                    Visitor Chat
                                </button>
                              `
                            : ""
                    }

                </div>


                <!-- CHAT -->

                <div class="music-chat-area">

                    <div
                        class="music-chat-messages"
                        id="music-chat-messages"
                    ></div>


                    <div class="music-chat-composer">

                        <input
                            id="music-chat-input"
                            class="music-chat-input"
                            type="text"
                            autocomplete="off"
                            placeholder="Write a message..."
                        />

                        <button
                            id="music-chat-send"
                            class="music-chat-send"
                            type="button"
                            aria-label="Send message"
                        >
                            ➤
                        </button>

                    </div>

                </div>

            </div>


            <!-- PARTICIPANTS -->

            <aside class="music-participants-panel">

                <div class="music-participants-header">

                    <div class="music-participants-title">
                        Participants
                    </div>

                    <div class="music-participants-count">
                        ${participantCount} in this call
                    </div>

                </div>


                <div
                    class="music-participants-list"
                    id="music-participants-list"
                ></div>


                ${
                    callConfig.openSpace
                        ? `
                            <div class="music-participants-header">

                                <div class="music-participants-title">
                                    Open Space
                                </div>

                                <div class="music-participants-count">
                                    Visitors can enter this room
                                </div>

                            </div>
                          `
                        : ""
                }

            </aside>

        </div>
    `;
}


/* ---------------------------------------------------------
   INITIALIZE ROOM
   --------------------------------------------------------- */

function setupMusicCallRoom(callConfig) {

    populateMusicParticipants(callConfig);

    setupMusicChat(callConfig);

    setupMusicChatTabs(callConfig);

    setupMusicAnnouncementButtons(callConfig);

    setupMusicLeaveButton();

    setupMusicLiveButton(callConfig);

    showMusicWelcomeMessage(callConfig);
}


/* ---------------------------------------------------------
   PARTICIPANTS
   --------------------------------------------------------- */

function populateMusicParticipants(callConfig) {

    const container =
        document.getElementById("music-participants-list");

    if (!container) return;

    const participants = [
        {
            name: "You",
            role: "Host",
            avatar: null,
            online: true
        }
    ];

    if (Array.isArray(callConfig.invitees)) {

        callConfig.invitees.forEach(person => {

            participants.push({
                name:
                    person.display_name ||
                    person.username ||
                    "Invited user",

                role: "Invited collaborator",

                avatar:
                    person.avatar_url || null,

                online: false
            });

        });

    }

    container.innerHTML = participants
        .map(person => {

            const avatar = person.avatar
                ? `
                    <img
                        class="music-participant-avatar"
                        src="${escapeMusicHTML(person.avatar)}"
                        alt=""
                    >
                  `
                : `
                    <div
                        class="music-participant-avatar"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:11px;
                        "
                    >
                        ${escapeMusicHTML(
                            person.name.charAt(0).toUpperCase()
                        )}
                    </div>
                  `;

            return `
                <div class="music-participant">

                    ${avatar}

                    <div class="music-participant-info">

                        <div class="music-participant-name">
                            ${escapeMusicHTML(person.name)}
                        </div>

                        <div class="music-participant-role">
                            ${escapeMusicHTML(person.role)}
                        </div>

                    </div>

                    <span
                        class="
                            music-participant-status
                            ${person.online ? "" : "offline"}
                        "
                    ></span>

                </div>
            `;

        })
        .join("");
}


/* ---------------------------------------------------------
   CHAT
   --------------------------------------------------------- */

const musicChatState = {
    activeTab: "participants",

    participants: [],

    visitors: []
};


function setupMusicChat(callConfig) {

    const input =
        document.getElementById("music-chat-input");

    const send =
        document.getElementById("music-chat-send");

    if (!input || !send) return;


    send.addEventListener("click", () => {

        sendMusicChatMessage(callConfig);

    });


    input.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMusicChatMessage(callConfig);

        }

    });
}


function sendMusicChatMessage(callConfig) {

    const input =
        document.getElementById("music-chat-input");

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;


    const message = {
        id: Date.now(),

        author: "You",

        body: text,

        timestamp: new Date(),

        chat:
            musicChatState.activeTab
    };


    if (musicChatState.activeTab === "visitors") {

        musicChatState.visitors.push(message);

    } else {

        musicChatState.participants.push(message);

    }


    input.value = "";

    renderMusicChatMessages();
}


function renderMusicChatMessages() {

    const container =
        document.getElementById("music-chat-messages");

    if (!container) return;


    const messages =
        musicChatState.activeTab === "visitors"
            ? musicChatState.visitors
            : musicChatState.participants;


    if (!messages.length) {

        container.innerHTML = `
            <div
                style="
                    padding:30px 10px;
                    text-align:center;
                    font-size:12px;
                    opacity:.4;
                "
            >
                No messages yet.
            </div>
        `;

        return;
    }


    container.innerHTML = messages
        .map(message => {

            return `
                <div
                    class="
                        music-chat-message
                        ${message.author === "You" ? "host" : ""}
                    "
                >

                    <div class="music-chat-message-author">
                        ${escapeMusicHTML(message.author)}
                    </div>

                    <div class="music-chat-message-body">
                        ${escapeMusicHTML(message.body)}
                    </div>

                </div>
            `;

        })
        .join("");


    container.scrollTop =
        container.scrollHeight;
}


/* ---------------------------------------------------------
   CHAT TABS
   --------------------------------------------------------- */

function setupMusicChatTabs(callConfig) {

    document
        .querySelectorAll(".music-chat-tab")
        .forEach(button => {

            button.addEventListener("click", () => {

                const tab =
                    button.dataset.chatTab;

                musicChatState.activeTab =
                    tab;

                document
                    .querySelectorAll(".music-chat-tab")
                    .forEach(other => {

                        other.classList.toggle(
                            "active",
                            other === button
                        );

                    });

                renderMusicChatMessages();

            });

        });


    renderMusicChatMessages();
}


/* ---------------------------------------------------------
   WELCOME MESSAGE
   --------------------------------------------------------- */

function showMusicWelcomeMessage(callConfig) {

    musicChatState.participants = [

        {
            id: "welcome",

            author: "Nemawashi",

            body:
                `Music Call started for "${callConfig.projectName}".`,

            timestamp: new Date(),

            chat: "participants"
        },

        {
            id: "daw",

            author: "Nemawashi",

            body:
                `Project DAW: ${callConfig.daw}`,

            timestamp: new Date(),

            chat: "participants"
        }

    ];

    renderMusicChatMessages();
}


/* ---------------------------------------------------------
   ANNOUNCEMENTS
   --------------------------------------------------------- */

function setupMusicAnnouncementButtons(callConfig) {

    document
        .querySelectorAll(".music-announcement-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const type =
                    button.dataset.announcement;

                openMusicAnnouncement(type);

            });

        });
}


function openMusicAnnouncement(type) {

    const names = {

        kiki: "KiKi",

        serashio: "Serashio",

        links: "Links"

    };

    const name =
        names[type] || "Announcement";


    musicChatState.participants.push({

        id: Date.now(),

        author: "Nemawashi",

        body:
            `${name} announcement panel opened.`,

        timestamp: new Date(),

        chat: "participants"

    });


    musicChatState.activeTab =
        "participants";


    document
        .querySelectorAll(".music-chat-tab")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.chatTab === "participants"
            );

        });


    renderMusicChatMessages();
}


/* ---------------------------------------------------------
   YOUTUBE LIVE
   --------------------------------------------------------- */

function setupMusicLiveButton(callConfig) {

    const button =
        document.getElementById("music-live-button");

    if (!button) return;


    button.addEventListener("click", () => {

        startMusicYouTubeLivestream(callConfig);

    });
}


function startMusicYouTubeLivestream(callConfig) {

    /*
     * YouTube API integration will be connected later.
     *
     * The official Hrmnx channel is ALWAYS included
     * as a required collaborator.
     */

    const collaborator =
        callConfig.youtubeCollaborator;


    musicChatState.participants.push({

        id: Date.now(),

        author: "Nemawashi",

        body:
            `YouTube livestream prepared with required collaborator ${collaborator.handle}.`,

        timestamp: new Date(),

        chat: "participants"

    });


    renderMusicChatMessages();

    alert(
        "YouTube livestream integration is the next backend step."
    );
}


/* ---------------------------------------------------------
   LEAVE CALL
   --------------------------------------------------------- */

function setupMusicLeaveButton() {

    const button =
        document.getElementById("music-leave-call");

    if (!button) return;


    button.addEventListener("click", () => {

        leaveMusicCall();

    });
}


function leaveMusicCall() {

    window.activeNemawashiMusicCall = null;

    musicChatState.participants = [];

    musicChatState.visitors = [];

    musicChatState.activeTab =
        "participants";


    const target =
        document.querySelector(".space-placeholder") ||
        document.querySelector(".space-chat");


    if (!target) return;


    target.innerHTML = `

        <div
            style="
                width:100%;
                min-height:400px;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                opacity:.55;
            "
        >

            <div>

                <div
                    style="
                        font-size:32px;
                        margin-bottom:10px;
                    "
                >
                    ♫
                </div>

                <div
                    style="
                        font-size:16px;
                        font-weight:700;
                    "
                >
                    Music Space
                </div>

                <div
                    style="
                        margin-top:5px;
                        font-size:13px;
                    "
                >
                    Start a new call to begin collaborating.
                </div>

            </div>

        </div>
    `;

}
