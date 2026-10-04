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
    key: "C",
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
        id: "project",

        title: "What are you working on?",

        subtitle:
            "Set the basic information for this music project."
    },

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
           PROJECT
        ---------------------------------------------------- */

        case "project":

            return renderMusicProjectStep();

        /* ----------------------------------------------------
           INVITE
        ---------------------------------------------------- */

        case "invite":

            return `

                <div class="music-step-heading">

                    <span class="music-step-number">
                        02
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
                        03
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
                        04
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
                        05
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
                        06
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
                07
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
                <span>PROJECT</span>
                <strong>
                    ${escapeMusicHTML(
                        musicCallState.projectName ||
                        "Untitled Project"
                    )}
                </strong>
            </div>


            <div>
                <span>MUSIC INFO</span>
                <strong>
                    ${escapeMusicHTML(
                        musicCallState.bpm || "—"
                    )} BPM
                    ·
                    ${escapeMusicHTML(
                        musicCallState.key || "C"
                    )}
                    ·
                    ${escapeMusicHTML(
                        musicCallState.timeSignature || "4/4"
                    )}
                </strong>
            </div>


            <div>
                <span>TYPE</span>
                <strong>
                    ${escapeMusicHTML(
                        musicCallState.projectType || "Song"
                    )}
                </strong>
            </div>


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

    const projectName =
        document.getElementById(
            "music-project-name"
        );

    const projectBpm =
        document.getElementById(
            "music-project-bpm"
        );

    const projectKey =
        document.getElementById(
            "music-project-key"
        );

    const projectTimeSignature =
        document.getElementById(
            "music-project-time-signature"
        );

    const projectType =
        document.getElementById(
            "music-project-type"
        );

    const projectDescription =
        document.getElementById(
            "music-project-description"
        );

    const projectReference =
        document.getElementById(
            "music-project-reference"
        );


    if (projectName) {

        projectName.addEventListener(
            "input",
            function() {
                musicCallState.projectName =
                    this.value;
            }
        );

    }


    if (projectBpm) {

        projectBpm.addEventListener(
            "input",
            function() {
                musicCallState.bpm =
                    this.value;
            }
        );

    }


    if (projectKey) {

        projectKey.addEventListener(
            "change",
            function() {
                musicCallState.key =
                    this.value;
            }
        );

    }


    if (projectTimeSignature) {

        projectTimeSignature.addEventListener(
            "change",
            function() {
                musicCallState.timeSignature =
                    this.value;
            }
        );

    }


    if (projectType) {

        projectType.addEventListener(
            "change",
            function() {
                musicCallState.projectType =
                    this.value;
            }
        );

    }


    if (projectDescription) {

        projectDescription.addEventListener(
            "input",
            function() {
                musicCallState.description =
                    this.value;
            }
        );

    }


    if (projectReference) {

        projectReference.addEventListener(
            "input",
            function() {
                musicCallState.referenceLink =
                    this.value;
            }
        );

    }


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
   PROJECT DETAILS
============================================================ */


function saveMusicProjectDetails() {

    const name =
        document.getElementById("music-project-name");

    const bpm =
        document.getElementById("music-project-bpm");

    const key =
        document.getElementById("music-project-key");

    const timeSignature =
        document.getElementById("music-project-time-signature");

    const projectType =
        document.getElementById("music-project-type");

    const description =
        document.getElementById("music-project-description");

    const reference =
        document.getElementById("music-project-reference");


    musicCallState.projectName =
        name?.value.trim() || "";

    musicCallState.bpm =
        bpm?.value.trim() || "";

    musicCallState.key =
        key?.value || "C";

    musicCallState.timeSignature =
        timeSignature?.value || "4/4";

    musicCallState.projectType =
        projectType?.value || "Song";

    musicCallState.description =
        description?.value.trim() || "";

    musicCallState.referenceLink =
        reference?.value.trim() || "";


    if (!musicCallState.projectName) {

        alert(
            "Please enter a project name."
        );

        name?.focus();

        return false;
    }


    if (
        musicCallState.bpm &&
        (
            Number(musicCallState.bpm) < 20 ||
            Number(musicCallState.bpm) > 400
        )
    ) {

        alert(
            "BPM must be between 20 and 400."
        );

        bpm?.focus();

        return false;
    }


    return true;
}

/* ============================================================
   NAVIGATION
============================================================ */

function nextMusicCallStep() {

    /*
     * Save and validate the Project step before
     * moving to Invite.
     */
    if (musicCallState.step === 0) {

        if (!saveMusicProjectDetails()) {
            return;
        }

    }


    /*
     * DAW is required.
     */
    if (
        musicCallState.step === 2 &&
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

    const setup =
        document.querySelector(".music-call-setup");

    if (!setup) {
        return;
    }


    /*
     * Get the project name safely.
     */
    let fallbackSpaceName = "";

    try {
        if (
            typeof currentSpace !== "undefined" &&
            currentSpace &&
            currentSpace.name
        ) {
            fallbackSpaceName =
                currentSpace.name;
        }
    }

    catch (error) {
        fallbackSpaceName = "";
    }


    const projectName =
        musicCallState.projectName ||
        fallbackSpaceName ||
        "Untitled Music Project";


    const callId =
        "music-call-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 8);


    /*
     * Build the complete call configuration.
     */
    const callConfig = {

        id: callId,

        projectName: projectName,

        project: {
            name: projectName,

            bpm:
                musicCallState.bpm ||
                "",

            key:
                musicCallState.key ||
                "C",

            timeSignature:
                musicCallState.timeSignature ||
                "4/4",

            type:
                musicCallState.projectType ||
                "Song",

            description:
                musicCallState.description ||
                "",

            referenceLink:
                musicCallState.referenceLink ||
                ""
        },


        invitees:
            Array.isArray(
                musicCallState.invitees
            )
                ? [
                    ...musicCallState.invitees
                ]
                : [],


        daw:
            musicCallState.daw ||
            "Not specified",


        openSpace:
            !!musicCallState.openSpace,

        visitors:
            !!musicCallState.visitors,

        visitorChat:
            !!musicCallState.visitorChat,


        announcements: {

            kiki:
                !!musicCallState
                    .announcements
                    .kiki,

            serashio:
                !!musicCallState
                    .announcements
                    .serashio,

            links:
                !!musicCallState
                    .announcements
                    .links
        },


        livestream:
            !!musicCallState.livestream,

        youtubePremiere:
            !!musicCallState.youtubePremiere,


        youtubeCollaborator: {
            ...NEMAWASHI_MUSIC_CONFIG
                .youtubeCollaborator
        },


        createdAt:
            new Date().toISOString()
    };


    /*
     * Make the configuration available globally.
     */
    window.activeNemawashiMusicCall =
        callConfig;


    /*
     * IMPORTANT:
     *
     * Do NOT replace setup.innerHTML.
     *
     * The setup element is the full-screen overlay.
     * We only change the contents of its existing
     * white window.
     */
    const setupWindow =
        setup.querySelector(
            ".music-call-window"
        );


    if (setupWindow) {

        setupWindow.innerHTML = `

            <div
                class="music-call-setup-header"
            >

                <div
                    class="music-call-setup-kicker"
                >
                    MUSIC SPACE
                </div>


                <div
                    class="music-call-setup-title"
                >
                    Creating your music call…
                </div>


                <div
                    class="music-call-setup-description"
                >
                    Preparing the collaboration room for
                    ${escapeMusicHTML(projectName)}.
                </div>

            </div>

        `;

    }


    /*
     * Give the preparing screen a moment to display.
     */
    await new Promise(
        resolve =>
            setTimeout(resolve, 500)
    );


    /*
     * Fade out and completely remove the
     * full-screen setup overlay BEFORE
     * showing the actual call.
     */
    setup.classList.remove(
        "visible"
    );


    await new Promise(
        resolve =>
            setTimeout(resolve, 300)
    );


    if (setup.isConnected) {
        setup.remove();
    }


    /*
     * Now place the actual call room
     * into the Music Space.
     */
    openMusicCallRoom(
        callConfig
    );

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

    try {

        /*
         * Make absolutely sure the setup overlay
         * is gone before displaying the room.
         */
        const setup =
            document.getElementById(
                "music-call-setup"
            );

        if (setup) {
            setup.remove();
        }


        const placeholder =
            document.querySelector(
                ".space-placeholder"
            );

        const chat =
            document.querySelector(
                ".space-chat"
            );

        const target =
            placeholder ||
            chat;


        if (!target) {

            console.error(
                "Nemawashi Music Space: Could not find space container."
            );

            return;
        }


        const roomHTML =
            createMusicCallRoomHTML(
                callConfig
            );


        target.innerHTML =
            roomHTML;


        target.classList.add(
            "music-room-active"
        );


        setupMusicCallRoom(
            callConfig
        );

    }

    catch (error) {

        console.error(
            "Nemawashi Music Space: Failed to open call room.",
            error
        );

    }

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
                        ${escapeMusicHTML(
                            callConfig.project?.type ||
                            "Music Project"
                        )}
                    </div>

                    <div class="music-project-panel-title">
                        ${escapeMusicHTML(
                            callConfig.project?.name ||
                            callConfig.projectName
                        )}
                    </div>

                    <div class="music-project-panel-daw">
                        ${escapeMusicHTML(callConfig.daw)}
                    </div>

                    <div
                        class="music-project-metadata"
                        style="
                            display:flex;
                            flex-wrap:wrap;
                            gap:7px;
                            margin-top:12px;
                        "
                    >

                        <span class="music-project-panel-daw">
                            ${escapeMusicHTML(
                                callConfig.project?.bpm ||
                                "—"
                            )} BPM
                        </span>

                        <span class="music-project-panel-daw">
                            ${escapeMusicHTML(
                                callConfig.project?.key ||
                                "C"
                            )}
                        </span>

                        <span class="music-project-panel-daw">
                            ${escapeMusicHTML(
                                callConfig.project?.timeSignature ||
                                "4/4"
                            )}
                        </span>

                    </div>

                    ${
                        callConfig.project?.description
                            ? `
                                <div
                                    class="music-project-description"
                                    style="
                                        margin-top:12px;
                                        font-size:12px;
                                        line-height:1.5;
                                        opacity:.55;
                                    "
                                >
                                    ${escapeMusicHTML(
                                        callConfig.project.description
                                    )}
                                </div>
                              `
                            : ""
                    }

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
        },

        {
            id: "project-info",

            author: "Nemawashi",

            body:
                `Project info: ${callConfig.project?.bpm || "—"} BPM · ${callConfig.project?.key || "C"} · ${callConfig.project?.timeSignature || "4/4"}`,

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
/* ============================================================
   NEMAWASHI MUSIC SPACE — MERRY-GO-ROUND / DAW MEDIA V1
   Appended collaboration layer.

   This layer keeps DAW video and DAW audio separate:
   - Screen capture can be shared without broadcasting audio.
   - Audio is requested separately and placed in a one-at-a-time queue.
   - Merry-go-round rotates the active DAW presentation.
   - Host/admin controls are prepared for the Supabase enforcement layer.
============================================================ */

const NEMAWASHI_MUSIC_MEDIA_CONFIG = {
    audio: {
        defaultRequestedMinutes: 3,
        minimumMinutes: 1,
        maximumMinutes: 60,
        cooldownSeconds: 30
    },
    afk: {
        warningSeconds: 45,
        kickSeconds: 60
    },
    merryGoRound: {
        enabledByDefault: false,
        transitionMs: 950,
        clickSound: true
    }
};

window.nemawashiMusicMediaState = window.nemawashiMusicMediaState || {
    localUserId: null,
    localIsStaff: false,
    localIsHost: true,
    localIsVisitor: false,
    screenStream: null,
    screenVideoTrack: null,
    screenAudioTrack: null,
    audioRequestedMinutes: 3,
    audioQueue: [],
    activeAudioUserId: null,
    audioStartedAt: null,
    merryGoRound: {
        active: false,
        index: 0,
        timer: null,
        participants: []
    },
    activityTimer: null,
    lastActivityAt: Date.now(),
    audioCooldownUntil: 0,
    roomId: null,
    channel: null
};

function nmMusicMediaState() {
    return window.nemawashiMusicMediaState;
}

function nmMusicEscape(value) {
    if (typeof escapeMusicHTML === "function") return escapeMusicHTML(value ?? "");
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

async function nmMusicGetAccess() {
    const state = nmMusicMediaState();
    state.localIsHost = true;
    state.localIsVisitor = false;
    state.localIsStaff = false;

    if (typeof supabaseClient === "undefined" || !supabaseClient?.auth) {
        return state;
    }

    try {
        const { data: authData } = await supabaseClient.auth.getUser();
        const user = authData?.user;
        state.localUserId = user?.id || null;

        if (user?.id) {
            const { data: profile } = await supabaseClient
                .from("profiles")
                .select("is_staff")
                .eq("id", user.id)
                .maybeSingle();
            state.localIsStaff = !!profile?.is_staff;
        }
    } catch (error) {
        console.warn("Nemawashi Music Space: access lookup failed.", error);
    }

    return state;
}

function nmMusicPlayClickSound() {
    if (!NEMAWASHI_MUSIC_MEDIA_CONFIG.merryGoRound.clickSound) return;

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const context = new AudioCtx();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(520, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(190, context.currentTime + 0.09);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);
        setTimeout(() => context.close().catch(() => {}), 180);
    } catch (_) {}
}

function nmMusicMarkActivity() {
    const state = nmMusicMediaState();
    state.lastActivityAt = Date.now();
}

function nmMusicStartActivityMonitor() {
    const state = nmMusicMediaState();
    ["pointermove", "keydown", "mousedown", "touchstart", "click"].forEach(eventName => {
        window.addEventListener(eventName, nmMusicMarkActivity, { passive: true });
    });

    clearInterval(state.activityTimer);
    state.activityTimer = setInterval(() => {
        if (!window.activeNemawashiMusicCall) return;
        const inactiveFor = Math.floor((Date.now() - state.lastActivityAt) / 1000);
        const status = document.getElementById("music-afk-status");
        if (status) {
            if (inactiveFor >= NEMAWASHI_MUSIC_MEDIA_CONFIG.afk.warningSeconds) {
                status.textContent = `AFK warning · active for ${inactiveFor}s ago`;
                status.classList.add("warning");
            } else {
                status.textContent = "Active";
                status.classList.remove("warning");
            }
        }

        if (inactiveFor >= NEMAWASHI_MUSIC_MEDIA_CONFIG.afk.kickSeconds) {
            nmMusicHandleLocalAfk();
        }
    }, 5000);
}

function nmMusicHandleLocalAfk() {
    const state = nmMusicMediaState();
    if (state.localIsVisitor) return;

    const status = document.getElementById("music-afk-status");
    if (status) {
        status.textContent = "AFK · the host/admin can remove inactive participants";
        status.classList.add("warning");
    }

    const call = window.activeNemawashiMusicCall;
    if (call?.merryGoRound && state.merryGoRound.active) {
        nmMusicMerryNext(true);
    }
}

function nmMusicGetParticipants(callConfig) {
    const configured = Array.isArray(callConfig?.participants)
        ? callConfig.participants
        : [];

    if (configured.length) return configured;

    return [
        {
            id: nmMusicMediaState().localUserId || "self",
            name: "You",
            role: "Host",
            avatar: null,
            online: true,
            isSelf: true,
            daw: callConfig?.daw || "Not selected"
        },
        ...(Array.isArray(callConfig?.invitees)
            ? callConfig.invitees.map(person => ({
                id: person.id || person.username || Math.random().toString(36).slice(2),
                name: person.display_name || person.username || "Invited user",
                role: "Collaborator",
                avatar: person.avatar_url || null,
                online: false,
                isSelf: false,
                daw: person.daw || "Not selected"
            }))
            : [])
    ];
}

function nmMusicRenderDawStage(callConfig) {
    const stage = document.getElementById("music-daw-stage");
    if (!stage) return;

    const participants = nmMusicGetParticipants(callConfig);
    const online = participants.filter(person => person.online !== false);
    const host = participants.find(person => person.isSelf || person.role === "Host") || participants[0];
    const others = participants.filter(person => person !== host);

    const tile = (person, primary) => {
        const initial = (person.name || "?").charAt(0).toUpperCase();
        const canShare = person.isSelf && !nmMusicMediaState().localIsVisitor;
        const videoId = `music-daw-video-${nmMusicEscape(String(person.id))}`;
        const audioState = nmMusicMediaState().activeAudioUserId === person.id ? "Audio live" : "Audio off";

        return `
            <article class="music-daw-feed ${primary ? "primary" : "secondary"}" data-participant-id="${nmMusicEscape(String(person.id))}">
                <div class="music-daw-feed-media">
                    <video id="${videoId}" class="music-daw-video" autoplay playsinline muted></video>
                    <div class="music-daw-feed-placeholder">
                        <div class="music-daw-circle-avatar">${nmMusicEscape(initial)}</div>
                        <strong>${nmMusicEscape(person.name)}</strong>
                        <span>${nmMusicEscape(person.daw || "DAW not selected")}</span>
                        <small>${person.online === false ? "Offline" : "DAW screen not shared yet"}</small>
                    </div>
                    <div class="music-daw-feed-overlay">
                        <span>${nmMusicEscape(person.name)}</span>
                        <span>${nmMusicEscape(person.daw || "DAW")}</span>
                        <span class="music-daw-audio-pill">${audioState}</span>
                    </div>
                </div>
                ${canShare ? `
                    <div class="music-daw-feed-actions">
                        <button type="button" class="music-action-button primary" id="music-share-daw-button">
                            Share DAW
                        </button>
                        <button type="button" class="music-action-button secondary" id="music-stop-daw-button" style="display:none">
                            Stop sharing
                        </button>
                    </div>
                ` : ""}
            </article>
        `;
    };

    const primary = host ? tile(host, true) : "";
    const secondary = others.map(person => tile(person, false)).join("");

    stage.innerHTML = `
        <div class="music-daw-stage-heading">
            <div>
                <span class="music-stage-kicker">LIVE DAW SPACE</span>
                <strong>${callConfig?.merryGoRound?.active ? "Merry-go-round" : "DAW collaboration"}</strong>
            </div>
            <div class="music-daw-stage-status" id="music-afk-status">Active</div>
        </div>
        <div class="music-daw-primary-wrap">${primary || `
            <div class="music-daw-empty">Waiting for the host DAW feed.</div>
        `}</div>
        <div class="music-daw-secondary-grid">${secondary || `
            <div class="music-daw-secondary-empty">Other staff DAW feeds will appear here when they join.</div>
        `}</div>
    `;

    const shareButton = document.getElementById("music-share-daw-button");
    const stopButton = document.getElementById("music-stop-daw-button");
    shareButton?.addEventListener("click", () => nmMusicStartScreenShare(callConfig));
    stopButton?.addEventListener("click", () => nmMusicStopScreenShare(callConfig));

    const localVideo = host ? document.getElementById(`music-daw-video-${nmMusicEscape(String(host.id))}`) : null;
    if (localVideo && nmMusicMediaState().screenStream) {
        localVideo.srcObject = nmMusicMediaState().screenStream;
        const placeholder = localVideo.parentElement?.querySelector(".music-daw-feed-placeholder");
        if (placeholder) placeholder.style.display = "none";
        if (shareButton) shareButton.style.display = "none";
        if (stopButton) stopButton.style.display = "inline-flex";
    }

    if (callConfig?.merryGoRound?.active) {
        nmMusicUpdateMerryVisuals(callConfig);
    }
}

async function nmMusicStartScreenShare(callConfig) {
    const state = nmMusicMediaState();

    if (state.localIsVisitor) {
        alert("Visitors can watch DAW feeds, but cannot share their own DAW.");
        return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Screen sharing is not available in this browser.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: "window",
                frameRate: { ideal: 30, max: 60 }
            },
            audio: true,
            systemAudio: "include",
            selfBrowserSurface: "exclude",
            surfaceSwitching: "include"
        });

        state.screenStream = stream;
        state.screenVideoTrack = stream.getVideoTracks()[0] || null;
        state.screenAudioTrack = stream.getAudioTracks()[0] || null;

        // Screen video is immediately visible. Audio remains disabled until an audio turn is active.
        if (state.screenAudioTrack) {
            state.screenAudioTrack.enabled = state.activeAudioUserId === state.localUserId;
        }

        state.screenVideoTrack?.addEventListener("ended", () => {
            nmMusicStopScreenShare(callConfig);
        });

        nmMusicRenderDawStage(callConfig);
        nmMusicRenderAudioQueue(callConfig);
    } catch (error) {
        if (error?.name !== "AbortError") {
            console.error("Nemawashi Music Space: screen share failed.", error);
            alert("Nemawashi could not start the DAW screen share.");
        }
    }
}

function nmMusicStopScreenShare(callConfig) {
    const state = nmMusicMediaState();
    state.screenStream?.getTracks().forEach(track => track.stop());
    state.screenStream = null;
    state.screenVideoTrack = null;
    state.screenAudioTrack = null;
    nmMusicRenderDawStage(callConfig);
}

function nmMusicCanManageAudio() {
    const state = nmMusicMediaState();
    return state.localIsHost || state.localIsStaff;
}

function nmMusicCanRequestAudio() {
    const state = nmMusicMediaState();
    return !state.localIsVisitor && !!state.localUserId;
}

function nmMusicRequestAudio(callConfig) {
    const state = nmMusicMediaState();
    if (!nmMusicCanRequestAudio()) {
        alert("Visitors cannot request or broadcast DAW audio.");
        return;
    }

    const now = Date.now();
    if (now < state.audioCooldownUntil) {
        const seconds = Math.ceil((state.audioCooldownUntil - now) / 1000);
        alert(`Please wait ${seconds}s before requesting DAW audio again.`);
        return;
    }

    if (!state.screenStream) {
        alert("Share your DAW screen first. Nemawashi keeps its audio muted until your audio turn is active.");
        return;
    }

    const existing = state.audioQueue.find(item => item.userId === state.localUserId && ["waiting", "active"].includes(item.status));
    if (existing) return;

    const input = document.getElementById("music-audio-duration");
    const requestedMinutes = Math.max(
        NEMAWASHI_MUSIC_MEDIA_CONFIG.audio.minimumMinutes,
        Math.min(
            NEMAWASHI_MUSIC_MEDIA_CONFIG.audio.maximumMinutes,
            Number(input?.value || state.audioRequestedMinutes || NEMAWASHI_MUSIC_MEDIA_CONFIG.audio.defaultRequestedMinutes)
        )
    );

    const item = {
        id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: state.localUserId,
        name: "You",
        requestedMinutes,
        requestedAt: Date.now(),
        status: "waiting"
    };

    state.audioQueue.push(item);

    if (!state.activeAudioUserId && nmMusicCanManageAudio()) {
        nmMusicApproveNextAudio(callConfig);
    }

    nmMusicRenderAudioQueue(callConfig);
}

function nmMusicApproveNextAudio(callConfig) {
    const state = nmMusicMediaState();
    if (!nmMusicCanManageAudio() || state.activeAudioUserId) return;

    const next = state.audioQueue.find(item => item.status === "waiting");
    if (!next) return;

    next.status = "active";
    next.startedAt = Date.now();
    state.activeAudioUserId = next.userId;
    state.audioStartedAt = next.startedAt;

    if (state.screenAudioTrack) {
        state.screenAudioTrack.enabled = next.userId === state.localUserId;
    }

    nmMusicRenderDawStage(callConfig);
    nmMusicRenderAudioQueue(callConfig);

    clearTimeout(state.audioTimer);
    state.audioTimer = setTimeout(() => {
        nmMusicFinishActiveAudio(callConfig, true);
    }, next.requestedMinutes * 60 * 1000);
}

function nmMusicFinishActiveAudio(callConfig, timedOut = false) {
    const state = nmMusicMediaState();
    if (!state.activeAudioUserId) return;

    const active = state.audioQueue.find(item => item.userId === state.activeAudioUserId && item.status === "active");
    if (active) {
        active.status = timedOut ? "completed" : "stopped";
        active.endedAt = Date.now();
    }

    const previousUserId = state.activeAudioUserId;
    state.activeAudioUserId = null;
    state.audioStartedAt = null;
    state.audioCooldownUntil = Date.now() + NEMAWASHI_MUSIC_MEDIA_CONFIG.audio.cooldownSeconds * 1000;

    if (state.screenAudioTrack) state.screenAudioTrack.enabled = false;

    clearTimeout(state.audioTimer);
    state.audioTimer = null;

    nmMusicRenderDawStage(callConfig);
    nmMusicRenderAudioQueue(callConfig);

    if (timedOut) {
        nmMusicPlayClickSound();
        nmMusicPushSystemChat(`Audio turn ended for ${previousUserId === state.localUserId ? "you" : "the participant"}. The queue can continue.`);
    }

    if (nmMusicCanManageAudio()) {
        setTimeout(() => nmMusicApproveNextAudio(callConfig), 250);
    }
}

function nmMusicRenderAudioQueue(callConfig) {
    const container = document.getElementById("music-audio-queue");
    if (!container) return;

    const state = nmMusicMediaState();
    const active = state.audioQueue.find(item => item.status === "active");
    const waiting = state.audioQueue.filter(item => item.status === "waiting");
    const canRequest = nmMusicCanRequestAudio();
    const manage = nmMusicCanManageAudio();

    container.innerHTML = `
        <div class="music-audio-queue-head">
            <div>
                <span class="music-stage-kicker">DAW AUDIO</span>
                <strong>${active ? `Audio live · ${nmMusicEscape(active.name)}` : "Audio queue"}</strong>
            </div>
            ${active ? `<button type="button" class="music-action-button secondary" id="music-stop-active-audio">Stop audio</button>` : ""}
        </div>
        <div class="music-audio-request-row">
            <label>
                Requested turn
                <input id="music-audio-duration" type="number" min="1" max="60" value="${state.audioRequestedMinutes || 3}">
                <span>min</span>
            </label>
            ${canRequest ? `<button type="button" class="music-action-button primary" id="music-request-audio">Request DAW audio</button>` : `<span class="music-audio-visitors-note">Visitors can listen, but cannot request audio.</span>`}
        </div>
        <div class="music-audio-queue-list">
            ${active ? `<div class="music-audio-queue-item active"><span class="queue-number">LIVE</span><span>${nmMusicEscape(active.name)}</span><span>${active.requestedMinutes} min</span></div>` : ""}
            ${waiting.map((item, index) => `
                <div class="music-audio-queue-item">
                    <span class="queue-number">${index + 1}</span>
                    <span>${nmMusicEscape(item.name)}</span>
                    <span>${item.requestedMinutes} min</span>
                    ${manage ? `<button type="button" class="music-queue-approve" data-audio-id="${nmMusicEscape(item.id)}">Approve</button>` : ""}
                </div>
            `).join("") || `<div class="music-audio-empty">No one is waiting for audio.</div>`}
        </div>
        ${manage ? `<div class="music-audio-manager-note">Host/admin controls · one DAW audio source can be live at a time.</div>` : ""}
    `;

    const durationInput = document.getElementById("music-audio-duration");
    durationInput?.addEventListener("input", () => {
        state.audioRequestedMinutes = Number(durationInput.value) || 3;
    });

    document.getElementById("music-request-audio")?.addEventListener("click", () => nmMusicRequestAudio(callConfig));
    document.getElementById("music-stop-active-audio")?.addEventListener("click", () => nmMusicFinishActiveAudio(callConfig, false));

    container.querySelectorAll(".music-queue-approve").forEach(button => {
        button.addEventListener("click", () => {
            const item = state.audioQueue.find(entry => entry.id === button.dataset.audioId);
            if (!item || !nmMusicCanManageAudio() || state.activeAudioUserId) return;
            item.status = "waiting";
            state.audioQueue = [item, ...state.audioQueue.filter(entry => entry.id !== item.id)];
            nmMusicApproveNextAudio(callConfig);
        });
    });
}

function nmMusicPushSystemChat(body) {
    if (typeof musicChatState === "undefined") return;
    musicChatState.participants.push({
        id: `music-system-${Date.now()}`,
        author: "Nemawashi",
        body,
        timestamp: new Date(),
        chat: "participants"
    });
    if (typeof renderMusicChatMessages === "function") renderMusicChatMessages();
}

function nmMusicRenderMerry(callConfig) {
    const panel = document.getElementById("music-merry-go-round");
    if (!panel) return;
    const state = nmMusicMediaState();
    const participants = nmMusicGetParticipants(callConfig).filter(person => !person.isVisitor && person.online !== false);

    panel.innerHTML = `
        <div class="music-merry-head">
            <div>
                <span class="music-stage-kicker">COLLABORATION GAME</span>
                <strong>Merry-go-round</strong>
                <p>Everyone gets a turn presenting their DAW. Your project keeps working in the background while another person presents.</p>
            </div>
            <button type="button" class="music-action-button ${state.merryGoRound.active ? "secondary" : "primary"}" id="music-merry-toggle">
                ${state.merryGoRound.active ? "Stop merry-go-round" : "Start merry-go-round"}
            </button>
        </div>
        <div class="music-merry-carousel" id="music-merry-carousel">
            ${participants.map((person, index) => `
                <div class="music-merry-orb ${index === state.merryGoRound.index ? "selected" : ""}" data-index="${index}" data-user-id="${nmMusicEscape(String(person.id))}">
                    <div class="music-merry-orb-inner">
                        <span>${nmMusicEscape((person.name || "?").charAt(0).toUpperCase())}</span>
                    </div>
                    <strong>${nmMusicEscape(person.name)}</strong>
                    <small>${nmMusicEscape(person.daw || "DAW")}</small>
                </div>
            `).join("") || `<div class="music-audio-empty">Waiting for active staff participants.</div>`}
        </div>
        <div class="music-merry-current" id="music-merry-current"></div>
    `;

    document.getElementById("music-merry-toggle")?.addEventListener("click", () => {
        if (state.merryGoRound.active) nmMusicStopMerry(callConfig);
        else nmMusicStartMerry(callConfig);
    });

    nmMusicUpdateMerryVisuals(callConfig);
}

function nmMusicUpdateMerryVisuals(callConfig) {
    const state = nmMusicMediaState();
    const participants = nmMusicGetParticipants(callConfig).filter(person => !person.isVisitor && person.online !== false);
    const current = participants[state.merryGoRound.index % Math.max(participants.length, 1)];
    const currentEl = document.getElementById("music-merry-current");
    if (currentEl) {
        currentEl.innerHTML = current
            ? `<span class="music-merry-turn-dot"></span><strong>${nmMusicEscape(current.isSelf ? "It's your turn" : `${current.name}'s turn`)}</strong><span>${nmMusicEscape(current.daw || "DAW")}</span>`
            : "Waiting for participants…";
    }

    document.querySelectorAll(".music-merry-orb").forEach(orb => {
        orb.classList.toggle("selected", Number(orb.dataset.index) === state.merryGoRound.index);
    });
}

function nmMusicStartMerry(callConfig) {
    const state = nmMusicMediaState();
    const participants = nmMusicGetParticipants(callConfig).filter(person => !person.isVisitor && person.online !== false);
    if (!participants.length) return;

    state.merryGoRound.active = true;
    state.merryGoRound.participants = participants;
    state.merryGoRound.index = 0;
    callConfig.merryGoRound = { active: true };
    nmMusicPushSystemChat("Merry-go-round started. Everyone gets a turn to present their DAW.");
    nmMusicPlayClickSound();
    nmMusicRenderDawStage(callConfig);
    nmMusicRenderMerry(callConfig);

    const first = participants[0];
    if (first?.isSelf && nmMusicCanRequestAudio() && !nmMusicMediaState().activeAudioUserId) {
        nmMusicRequestAudio(callConfig);
    }

    nmMusicScheduleMerry(callConfig);
}

function nmMusicScheduleMerry(callConfig) {
    const state = nmMusicMediaState();
    clearTimeout(state.merryGoRound.timer);
    if (!state.merryGoRound.active) return;

    const participants = nmMusicGetParticipants(callConfig).filter(person => !person.isVisitor && person.online !== false);
    const current = participants[state.merryGoRound.index % Math.max(participants.length, 1)];
    const requested = current
        ? state.audioQueue.find(item => item.userId === current.id && item.status === "active")
        : null;
    const durationMinutes = requested?.requestedMinutes || NEMAWASHI_MUSIC_MEDIA_CONFIG.audio.defaultRequestedMinutes;

    state.merryGoRound.timer = setTimeout(() => {
        nmMusicMerryNext(false, callConfig);
    }, durationMinutes * 60 * 1000);
}

function nmMusicMerryNext(skipped = false, callConfig = window.activeNemawashiMusicCall) {
    const state = nmMusicMediaState();
    if (!state.merryGoRound.active || !callConfig) return;

    const participants = nmMusicGetParticipants(callConfig).filter(person => !person.isVisitor && person.online !== false);
    if (!participants.length) return;

    nmMusicPlayClickSound();
    state.merryGoRound.index = (state.merryGoRound.index + 1) % participants.length;
    const current = participants[state.merryGoRound.index];

    nmMusicPushSystemChat(skipped
        ? `Merry-go-round skipped an inactive participant and moved to ${current.name}.`
        : `Merry-go-round moved to ${current.name}.`);

    if (current.isSelf) {
        alert("It's your turn — present your DAW to everyone.");
        if (nmMusicCanRequestAudio() && !state.activeAudioUserId) {
            nmMusicRequestAudio(callConfig);
        }
    }

    nmMusicRenderDawStage(callConfig);
    nmMusicRenderMerry(callConfig);
    nmMusicScheduleMerry(callConfig);
}

function nmMusicStopMerry(callConfig) {
    const state = nmMusicMediaState();
    state.merryGoRound.active = false;
    clearTimeout(state.merryGoRound.timer);
    state.merryGoRound.timer = null;
    if (callConfig) callConfig.merryGoRound = { active: false };
    nmMusicPushSystemChat("Merry-go-round stopped.");
    nmMusicRenderDawStage(callConfig);
    nmMusicRenderMerry(callConfig);
}

function nmMusicRenderAdminControls(callConfig) {
    const container = document.getElementById("music-admin-controls");
    if (!container) return;
    const state = nmMusicMediaState();
    if (!state.localIsHost && !state.localIsStaff) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="music-admin-head">
            <span class="music-stage-kicker">MODERATION</span>
            <strong>Host & admin controls</strong>
        </div>
        <div class="music-admin-grid">
            <button type="button" class="music-action-button secondary" id="music-admin-stop-audio">Stop active audio</button>
            <button type="button" class="music-action-button secondary" id="music-admin-skip-merry">Skip current turn</button>
        </div>
        <p>Server-side moderation will enforce audio bans, kicks and queue fairness once the Supabase migration is enabled.</p>
    `;

    document.getElementById("music-admin-stop-audio")?.addEventListener("click", () => nmMusicFinishActiveAudio(callConfig, false));
    document.getElementById("music-admin-skip-merry")?.addEventListener("click", () => nmMusicMerryNext(true, callConfig));
}

/* ------------------------------------------------------------
   Override room renderer with DAW stage + audio queue + merry mode
------------------------------------------------------------ */

const nmOriginalCreateMusicCallRoomHTML = createMusicCallRoomHTML;

createMusicCallRoomHTML = function(callConfig) {
    const base = nmOriginalCreateMusicCallRoomHTML(callConfig);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = base;
    const windowEl = wrapper.querySelector(".music-call-window");
    if (!windowEl) return base;

    const stage = document.createElement("section");
    stage.className = "music-daw-collaboration-layer";
    stage.innerHTML = `
        <div id="music-daw-stage" class="music-daw-stage"></div>
        <div id="music-merry-go-round" class="music-merry-panel"></div>
        <div id="music-audio-queue" class="music-audio-queue"></div>
        <div id="music-admin-controls" class="music-admin-controls"></div>
    `;

    const mainStage = windowEl.querySelector(".music-call-stage");
    if (mainStage) mainStage.prepend(stage);
    else windowEl.prepend(stage);

    return wrapper.innerHTML;
};

const nmOriginalSetupMusicCallRoom = setupMusicCallRoom;

setupMusicCallRoom = async function(callConfig) {
    await nmMusicGetAccess();
    nmMusicStartActivityMonitor();

    // Keep the existing room setup intact.
    nmOriginalSetupMusicCallRoom(callConfig);

    nmMusicRenderDawStage(callConfig);
    nmMusicRenderMerry(callConfig);
    nmMusicRenderAudioQueue(callConfig);
    nmMusicRenderAdminControls(callConfig);
};

const nmOriginalLeaveMusicCall = leaveMusicCall;

leaveMusicCall = function() {
    const state = nmMusicMediaState();
    clearTimeout(state.audioTimer);
    clearTimeout(state.merryGoRound.timer);
    clearInterval(state.activityTimer);
    state.screenStream?.getTracks().forEach(track => track.stop());
    state.screenStream = null;
    state.activeAudioUserId = null;
    state.audioQueue = [];
    state.merryGoRound.active = false;
    nmOriginalLeaveMusicCall();
};

/* Make the collaboration mode available to the room without changing the existing setup flow. */
if (typeof window !== "undefined") {
    window.startNemawashiMerryGoRound = () => {
        const call = window.activeNemawashiMusicCall;
        if (call) nmMusicStartMerry(call);
    };
}

/* ------------------------------------------------------------
   YOUTUBE BROADCAST SCENE PREVIEW
   The scene is composited in-browser so the final broadcast can
   later use the resulting MediaStream as its video source.
------------------------------------------------------------ */

function nmMusicBuildYouTubeScene(callConfig) {
    const existing = document.getElementById("music-youtube-scene");
    if (existing) existing.remove();

    const panel = document.createElement("section");
    panel.id = "music-youtube-scene";
    panel.className = "music-youtube-scene";
    panel.innerHTML = `
        <div class="music-youtube-scene-head">
            <div>
                <span class="music-stage-kicker">BROADCAST SCENE</span>
                <strong>YouTube · Hrmnx Entertainment</strong>
                <p>Host DAW is primary. Other staff DAWs appear as secondary feeds. Staff chat is composited in the corner.</p>
            </div>
            <button type="button" class="music-action-button secondary" id="music-close-youtube-scene">Close preview</button>
        </div>
        <div class="music-youtube-canvas-wrap">
            <canvas id="music-youtube-canvas" width="1280" height="720"></canvas>
        </div>
        <div class="music-youtube-scene-status" id="music-youtube-scene-status">Preview ready · YouTube ingest not connected yet.</div>
    `;

    const root = document.querySelector(".music-call-window");
    if (!root) return;
    root.appendChild(panel);

    document.getElementById("music-close-youtube-scene")?.addEventListener("click", () => {
        nmMusicStopYouTubeScene();
    });

    nmMusicStartYouTubeSceneRenderer(callConfig);
}

function nmMusicStartYouTubeSceneRenderer(callConfig) {
    const state = nmMusicMediaState();
    const canvas = document.getElementById("music-youtube-canvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    cancelAnimationFrame(state.youtubeFrame);

    const draw = () => {
        if (!document.getElementById("music-youtube-scene")) return;

        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#111116";
        context.fillRect(0, 0, width, height);

        const primaryVideo = document.querySelector(".music-daw-feed.primary .music-daw-video");
        if (primaryVideo?.readyState >= 2) {
            const vw = primaryVideo.videoWidth || 16;
            const vh = primaryVideo.videoHeight || 9;
            const scale = Math.max(width / vw, (height - 95) / vh);
            const dw = vw * scale;
            const dh = vh * scale;
            context.drawImage(primaryVideo, (width - dw) / 2, 0, dw, dh);
        } else {
            context.fillStyle = "#2a2a31";
            context.fillRect(0, 0, width, height - 95);
            context.fillStyle = "#ffffff";
            context.font = "700 24px sans-serif";
            context.fillText(callConfig?.projectName || "Nemawashi Music Space", 35, 55);
            context.font = "500 15px sans-serif";
            context.globalAlpha = .55;
            context.fillText("Waiting for the host DAW feed…", 35, 82);
            context.globalAlpha = 1;
        }

        const secondaryVideos = [...document.querySelectorAll(".music-daw-feed.secondary .music-daw-video")];
        const tileW = 180;
        const tileH = 102;
        const gap = 10;
        secondaryVideos.slice(0, 5).forEach((video, index) => {
            const x = 28 + index * (tileW + gap);
            const y = height - 82 - tileH;
            context.fillStyle = "rgba(0,0,0,.8)";
            context.fillRect(x - 2, y - 2, tileW + 4, tileH + 24);
            if (video.readyState >= 2) {
                context.drawImage(video, x, y, tileW, tileH);
            }
        });

        context.fillStyle = "rgba(12,12,18,.92)";
        context.fillRect(0, height - 95, width, 95);
        context.fillStyle = "#ffffff";
        context.font = "800 18px sans-serif";
        context.fillText(callConfig?.projectName || "Nemawashi Music Space", 28, height - 66);
        context.font = "600 11px sans-serif";
        context.globalAlpha = .58;
        context.fillText(`Hrmnx Entertainment · ${callConfig?.youtubeCollaborator?.handle || "@harmoniajp"}`, 28, height - 43);
        context.globalAlpha = 1;

        const chat = Array.isArray(musicChatState?.participants) ? musicChatState.participants.slice(-4) : [];
        const chatX = width - 390;
        const chatY = 28;
        const chatW = 355;
        const chatH = 175;
        context.fillStyle = "rgba(10,10,16,.76)";
        context.fillRect(chatX, chatY, chatW, chatH);
        context.fillStyle = "#ffffff";
        context.font = "800 12px sans-serif";
        context.fillText("STAFF CHAT", chatX + 15, chatY + 22);
        context.font = "500 11px sans-serif";
        chat.forEach((message, index) => {
            const lineY = chatY + 49 + index * 28;
            context.globalAlpha = .55;
            context.fillText(String(message.author || "Staff").slice(0, 18), chatX + 15, lineY);
            context.globalAlpha = 1;
            context.fillText(String(message.body || "").slice(0, 42), chatX + 95, lineY);
        });

        state.youtubeFrame = requestAnimationFrame(draw);
    };

    draw();

    try {
        state.youtubeStream = canvas.captureStream(30);
        const status = document.getElementById("music-youtube-scene-status");
        if (status) status.textContent = "Preview live · composited MediaStream ready for the YouTube ingest layer.";
    } catch (error) {
        console.warn("Nemawashi Music Space: canvas captureStream unavailable.", error);
    }
}

function nmMusicStopYouTubeScene() {
    const state = nmMusicMediaState();
    cancelAnimationFrame(state.youtubeFrame);
    state.youtubeFrame = null;
    state.youtubeStream?.getTracks().forEach(track => track.stop());
    state.youtubeStream = null;
    document.getElementById("music-youtube-scene")?.remove();
}

const nmOriginalStartMusicYouTubeLivestream = startMusicYouTubeLivestream;

startMusicYouTubeLivestream = function(callConfig) {
    nmMusicBuildYouTubeScene(callConfig);
    nmMusicPushSystemChat(`YouTube broadcast scene prepared for ${callConfig.youtubeCollaborator?.handle || "the official channel"}.`);
};


/* ============================================================
   V2 FIXES — PERSISTENT CALLS / INVITES / CALL TIMER / MODE
============================================================ */

/*
 * V2 makes the Music Space call discoverable by other accounts.
 * The existing V1 room remains intact; this layer adds the
 * persistent Supabase call record and the UI needed to enter it.
 */

musicCallState.collaborationMode = musicCallState.collaborationMode || "standard";

/* ------------------------------------------------------------
   MODE SELECTOR IN CALL SETUP
------------------------------------------------------------ */

const nmV2OriginalOpenMusicCallSetup = openMusicCallSetup;
openMusicCallSetup = async function() {
    await nmV2OriginalOpenMusicCallSetup();
    musicCallState.collaborationMode = "standard";
    nmV2InjectCollaborationModeSelector();
};

const nmV2OriginalRenderMusicCallSetup = renderMusicCallSetup;
renderMusicCallSetup = function() {
    nmV2OriginalRenderMusicCallSetup();
    nmV2InjectCollaborationModeSelector();
};

function nmV2InjectCollaborationModeSelector() {
    const windowEl = document.querySelector("#music-call-setup .music-call-window");
    if (!windowEl) return;

    let panel = document.getElementById("music-collaboration-mode");
    if (!panel) {
        panel = document.createElement("section");
        panel.id = "music-collaboration-mode";
        panel.className = "music-collaboration-mode";
        const navigation = windowEl.querySelector(".music-call-navigation");
        if (navigation) navigation.before(panel);
        else windowEl.appendChild(panel);
    }

    const selected = musicCallState.collaborationMode === "merry-go-round";
    panel.innerHTML = `
        <div class="music-collaboration-mode-kicker">COLLABORATION GAME</div>
        <div class="music-collaboration-mode-title">How should this call work?</div>
        <div class="music-collaboration-mode-options">
            <button type="button" class="music-collaboration-mode-option ${!selected ? "selected" : ""}" data-music-mode="standard">
                <span class="music-mode-icon">◌</span>
                <span><strong>Standard call</strong><small>Everyone works together without taking turns.</small></span>
            </button>
            <button type="button" class="music-collaboration-mode-option ${selected ? "selected" : ""}" data-music-mode="merry-go-round">
                <span class="music-mode-icon">↻</span>
                <span><strong>Merry-go-round</strong><small>Everyone gets the large DAW presentation slot in turn.</small></span>
            </button>
        </div>
    `;

    panel.querySelectorAll("[data-music-mode]").forEach(button => {
        button.addEventListener("click", () => {
            musicCallState.collaborationMode = button.dataset.musicMode === "merry-go-round"
                ? "merry-go-round"
                : "standard";
            nmV2InjectCollaborationModeSelector();
        });
    });
}

/* ------------------------------------------------------------
   ADD MODE TO THE CONFIG CREATED BY THE EXISTING START FLOW
------------------------------------------------------------ */

const nmV2OriginalStartMusicCall = startMusicCall;
startMusicCall = async function() {
    await nmV2OriginalStartMusicCall();

    const call = window.activeNemawashiMusicCall;
    if (!call) return;

    call.collaborationMode = musicCallState.collaborationMode || "standard";
    call.merryGoRound = {
        active: call.collaborationMode === "merry-go-round"
    };

    /* Persist the call so other accounts can discover it. */
    await nmV2PersistMusicCall(call);

    /* The existing room was already opened by V1. Refresh its header/timer/mode UI. */
    nmV2ApplyCallRoomV2(call);

    if (call.collaborationMode === "merry-go-round") {
        setTimeout(() => {
            if (window.activeNemawashiMusicCall === call) {
                try { nmMusicStartMerry(call); } catch (error) {
                    console.error("Could not start Merry-go-round:", error);
                }
            }
        }, 350);
    }
};

async function nmV2PersistMusicCall(call) {
    if (typeof supabaseClient === "undefined") return false;

    let spaceId = null;
    try {
        spaceId = currentSpace?.id || null;
    } catch (_) {}

    const invitedIds = Array.isArray(call.invitees)
        ? call.invitees.map(person => typeof person === "string" ? person : person.id).filter(Boolean)
        : [];

    const { data, error } = await supabaseClient.rpc("create_music_call_with_invites", {
        p_call_id: call.id,
        p_space_id: spaceId ? String(spaceId) : null,
        p_project_name: call.project?.name || call.projectName || "Untitled Music Project",
        p_project_type: call.project?.type || "Song",
        p_bpm: call.project?.bpm ? Number(call.project.bpm) : null,
        p_project_key: call.project?.key || "C",
        p_time_signature: call.project?.timeSignature || "4/4",
        p_host_daw: call.daw || "Not specified",
        p_open_space: !!call.openSpace,
        p_visitors_allowed: !!call.visitors,
        p_visitor_chat: !!call.visitorChat,
        p_livestream_enabled: !!call.livestream,
        p_merry_go_round: call.collaborationMode === "merry-go-round",
        p_invited_user_ids: invitedIds
    });

    if (error) {
        console.error("Nemawashi Music Space: Could not persist call:", error);
        return false;
    }

    if (data) {
        call.createdAt = data.created_at || call.createdAt;
        call.dbCall = data;
    }

    /* The creator is already inserted by the RPC. */
    await supabaseClient.rpc("music_call_heartbeat", { p_call_id: call.id });
    return true;
}

/* ------------------------------------------------------------
   ACTIVE CALL DISCOVERY
------------------------------------------------------------ */

async function nmV2FindActiveMusicCall() {
    if (typeof supabaseClient === "undefined") return null;

    let spaceId = null;
    try { spaceId = currentSpace?.id || null; } catch (_) {}
    if (!spaceId) return null;

    const { data, error } = await supabaseClient
        .from("music_calls")
        .select("*")
        .eq("space_id", String(spaceId))
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Nemawashi Music Space: Active call lookup failed:", error);
        return null;
    }

    return data || null;
}

function nmV2CallRowToConfig(row) {
    return {
        id: row.id,
        projectName: row.project_name || "Untitled Music Project",
        project: {
            name: row.project_name || "Untitled Music Project",
            bpm: row.project_bpm ?? "",
            key: row.project_key || "C",
            timeSignature: row.time_signature || "4/4",
            type: row.project_type || "Song",
            description: "",
            referenceLink: ""
        },
        invitees: [],
        daw: row.host_daw || "Not specified",
        openSpace: !!row.open_space,
        visitors: !!row.visitors_allowed,
        visitorChat: !!row.visitor_chat,
        announcements: { kiki:false, serashio:false, links:false },
        livestream: !!row.livestream_enabled,
        youtubePremiere: false,
        collaborationMode: row.merry_go_round ? "merry-go-round" : "standard",
        merryGoRound: { active: !!row.merry_go_round },
        createdAt: row.created_at,
        hostUserId: row.host_user_id,
        status: row.status,
        dbCall: row
    };
}

async function nmV2EnterPersistedMusicCall(row) {
    const call = nmV2CallRowToConfig(row);

    let currentUserId = null;
    try {
        const { data } = await supabaseClient.auth.getUser();
        currentUserId = data?.user?.id || null;
    } catch (_) {}

    if (!currentUserId) return;

    /* Joining is deliberately done through the RPC so invited users are allowed. */
    const { data: joined, error } = await supabaseClient.rpc("join_music_call", {
        p_call_id: call.id,
        p_daw: "Not specified"
    });

    if (error) {
        console.error("Nemawashi Music Space: Could not enter call:", error);
        return;
    }

    call.localParticipant = joined;
    window.activeNemawashiMusicCall = call;
    openMusicCallRoom(call);
    nmV2ApplyCallRoomV2(call);

    if (call.collaborationMode === "merry-go-round") {
        setTimeout(() => {
            try { nmMusicStartMerry(call); } catch (_) {}
        }, 350);
    }
}

/* ------------------------------------------------------------
   MUSIC SPACE LANDING: SHOW ACTIVE CALL INSTEAD OF ONLY
   "START A NEW CALL"
------------------------------------------------------------ */

const nmV2OriginalInitializeMusicSpace = initializeMusicSpace;
initializeMusicSpace = async function() {
    nmV2OriginalInitializeMusicSpace();

    const activeCall = await nmV2FindActiveMusicCall();
    const spaceChat = document.getElementById("space-chat");
    if (!spaceChat) return;

    const controls = document.getElementById("music-space-controls");
    if (!controls) return;

    const actions = controls.querySelector(".music-space-actions");
    if (!actions) return;

    const existing = document.getElementById("music-active-call-card");
    if (existing) existing.remove();

    if (!activeCall) return;

    const modeLabel = activeCall.merry_go_round ? "Merry-go-round" : "Standard call";
    const card = document.createElement("div");
    card.id = "music-active-call-card";
    card.className = "music-active-call-card";
    card.innerHTML = `
        <div class="music-active-call-copy">
            <span class="music-stage-kicker"><span class="music-call-live-dot"></span> CALL ACTIVE</span>
            <strong>${escapeMusicHTML(activeCall.project_name || "Music Project")}</strong>
            <small>${escapeMusicHTML(modeLabel)} · started <span id="music-active-call-duration"></span> ago</small>
        </div>
        <button type="button" class="music-action-button primary" id="enter-existing-music-call">Enter call →</button>
    `;
    actions.before(card);

    nmV2StartElapsedTimer(activeCall.created_at, "music-active-call-duration");

    document.getElementById("start-new-call-button")?.classList.add("secondary");
    document.getElementById("start-new-call-button").textContent = "Start another call";

    document.getElementById("enter-existing-music-call")?.addEventListener("click", () => {
        nmV2EnterPersistedMusicCall(activeCall);
    });
};

/* ------------------------------------------------------------
   CALL ROOM TIMER + MODE DISPLAY
------------------------------------------------------------ */

function nmV2FormatElapsed(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2,"0")}m ${String(seconds).padStart(2,"0")}s`;
    return `${minutes}m ${String(seconds).padStart(2,"0")}s`;
}

function nmV2StartElapsedTimer(startedAt, elementId) {
    const el = document.getElementById(elementId);
    if (!el || !startedAt) return;

    const key = `__nmV2Timer_${elementId}`;
    clearInterval(window[key]);

    const tick = () => {
        el.textContent = nmV2FormatElapsed(Date.now() - new Date(startedAt).getTime());
    };
    tick();
    window[key] = setInterval(tick, 1000);
}

const nmV2OriginalCreateRoomHTML = createMusicCallRoomHTML;
createMusicCallRoomHTML = function(callConfig) {
    const html = nmV2OriginalCreateRoomHTML(callConfig);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const header = wrapper.querySelector(".music-call-header-meta");
    if (header) {
        header.insertAdjacentHTML("beforeend", ` · <span class="music-call-elapsed">Active <strong id="music-call-elapsed">00:00</strong></span>`);
    }
    return wrapper.innerHTML;
};

function nmV2ApplyCallRoomV2(call) {
    const mode = call.collaborationMode === "merry-go-round" ? "Merry-go-round" : "Standard";
    const headerMeta = document.querySelector(".music-call-header-meta");
    if (headerMeta && !headerMeta.querySelector(".music-call-mode-label")) {
        headerMeta.insertAdjacentHTML("beforeend", ` · <span class="music-call-mode-label">${escapeMusicHTML(mode)}</span>`);
    }
    nmV2StartElapsedTimer(call.createdAt, "music-call-elapsed");

    const room = document.querySelector(".music-call-window");
    if (room && call.collaborationMode === "merry-go-round") room.classList.add("music-room-merry-mode");
}

/* Re-apply the room enhancements after any V1 room creation. */
const nmV2OriginalOpenMusicCallRoom = openMusicCallRoom;
openMusicCallRoom = function(callConfig) {
    nmV2OriginalOpenMusicCallRoom(callConfig);
    nmV2ApplyCallRoomV2(callConfig);
};

/* ------------------------------------------------------------
   KEEP CALL DISCOVERY FRESH WHEN A SPACE IS SELECTED AGAIN
------------------------------------------------------------ */
window.nemawashiRefreshMusicCall = async function() {
    if (typeof initializeMusicSpace === "function") {
        await initializeMusicSpace();
    }
};

