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
   NEMAWASHI MUSIC SPACE — COLLABORATION V4
   IMPORTANT: everything above this section is the original
   Music Space implementation. This section only adds:
   - persistent calls + explicit End call
   - real WebRTC DAW screen sharing
   - moderated DAW-audio queue
   - realtime chat / participant presence
   - animated Merry-go-round
   - synced call state across accounts
============================================================ */

(function () {
    "use strict";

    const NM4 = {
        channel: null,
        call: null,
        user: null,
        profile: null,
        participant: null,
        peers: new Map(),
        remoteStreams: new Map(),
        screenStream: null,
        screenTrack: null,
        audioTrack: null,
        audioSenderActive: false,
        queue: [],
        activeAudio: null,
        presenceTimer: null,
        activityTimer: null,
        lastActivityAt: Date.now(),
        afkWarned: false,
        merry: {
            active: false,
            index: 0,
            participants: [],
            timer: null,
            duration: 12000
        },
        profileCache: new Map(),
        audioRequestedMinutes: 3,
        spaceId: null,
        leftByChoice: false,
        surveyShown: false,
        miniDockTimer: null,
        miniDockIndex: 0,
        miniDockCandidates: [],
        feedbackContext: null,
        rtcConfig: {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.cloudflare.com:3478" }
            ]
        }
    };

    window.nemawashiMusicCollaborationV4 = NM4;

    function nm4Escape(value) {
        return typeof escapeMusicHTML === "function"
            ? escapeMusicHTML(value)
            : String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
    }

    function nm4IsSupabaseReady() {
        return typeof supabaseClient !== "undefined" && !!supabaseClient;
    }

    async function nm4GetUser() {
        if (!nm4IsSupabaseReady()) return null;
        const { data } = await supabaseClient.auth.getUser();
        return data?.user || null;
    }

    async function nm4LoadProfile(userId) {
        if (!nm4IsSupabaseReady() || !userId) return null;
        if (NM4.profileCache.has(userId)) return NM4.profileCache.get(userId);
        const { data } = await supabaseClient
            .from("profiles")
            .select("id,display_name,username,avatar_url,is_staff")
            .eq("id", userId)
            .maybeSingle();
        const profile = data || null;
        NM4.profileCache.set(userId, profile);
        return profile;
    }

    function nm4DisplayName(userId, fallback) {
        if (userId === NM4.user?.id) {
            return NM4.profile?.display_name || NM4.profile?.username || "You";
        }
        const cached = NM4.profileCache.get(userId);
        return cached?.display_name || cached?.username || fallback || "Collaborator";
    }

    function nm4CanManage() {
        return !!(
            NM4.participant?.role === "host" ||
            NM4.participant?.role === "admin" ||
            NM4.profile?.is_staff
        );
    }

    function nm4IsHost() {
        return NM4.call && NM4.user && NM4.call.host_user_id === NM4.user.id;
    }

    function nm4CallId() {
        return NM4.call?.id || window.activeNemawashiMusicCall?.id || null;
    }

    function nm4MarkActivity() {
        NM4.lastActivityAt = Date.now();
        NM4.afkWarned = false;
        const badge = document.getElementById("nm4-afk-status");
        if (badge) badge.textContent = "Active";
    }

    function nm4StartActivityMonitor() {
        ["pointerdown", "pointermove", "keydown", "touchstart", "click"].forEach(eventName => {
            window.addEventListener(eventName, nm4MarkActivity, { passive: true });
        });
        clearInterval(NM4.activityTimer);
        NM4.activityTimer = setInterval(() => {
            if (!NM4.call) return;
            const inactive = Math.floor((Date.now() - NM4.lastActivityAt) / 1000);
            const badge = document.getElementById("nm4-afk-status");
            if (inactive >= 60) {
                if (badge) badge.textContent = "AFK — skipped";
                if (NM4.merry.active) nm4MerrySkipLocalUser();
                nm4SendActivity(false);
            } else if (inactive >= 45) {
                if (badge) badge.textContent = "AFK warning — interact to stay in turn";
            }
        }, 5000);
    }

    async function nm4SendActivity(active) {
        const id = nm4CallId();
        if (!id || !nm4IsSupabaseReady()) return;
        await supabaseClient.rpc("music_call_set_activity", {
            p_call_id: id,
            p_is_active: !!active
        }).catch(() => {});
    }

    function nm4RenderEnhancementShell() {
        const room = document.querySelector(".music-room-active > .music-call-window");
        if (!room || document.getElementById("nm4-collaboration-panel")) return;

        const panel = document.createElement("section");
        panel.id = "nm4-collaboration-panel";
        panel.className = "nm4-collaboration-panel";
        panel.innerHTML = `
            <div class="nm4-panel-header">
                <div>
                    <span class="nm4-kicker">LIVE COLLABORATION</span>
                    <h3>Music collaboration</h3>
                    <p id="nm4-project-description">${nm4Escape(NM4.call?.project?.description || "")}</p>
                </div>
                <div class="nm4-header-status">
                    <span class="nm4-live-pill"><i></i> LIVE</span>
                    <span id="nm4-afk-status">Active</span>
                </div>
            </div>

            <div class="nm4-call-actions">
                <button type="button" class="nm4-button" id="nm4-share-screen">Share DAW screen</button>
                <button type="button" class="nm4-button secondary" id="nm4-stop-screen" disabled>Stop screen</button>
                <button type="button" class="nm4-button" id="nm4-request-audio">Request DAW audio</button>
                <button type="button" class="nm4-button secondary" id="nm4-stop-audio" disabled>Stop my audio</button>
                <button type="button" class="nm4-button merry" id="nm4-toggle-merry">Start Merry-go-round</button>
                ${nm4IsHost() || nm4CanManage() ? '<button type="button" class="nm4-button danger" id="nm4-end-call">End call</button>' : ''}
            </div>

            <div class="nm4-media-layout">
                <div class="nm4-media-main">
                    <div class="nm4-section-title"><span>DAW screens</span><small id="nm4-screen-count">0 connected</small></div>
                    <div id="nm4-daw-grid" class="nm4-daw-grid"></div>
                </div>
                <aside class="nm4-side-tools">
                    <div class="nm4-tool-card">
                        <div class="nm4-section-title"><span>DAW audio queue</span><small id="nm4-audio-now">No active audio</small></div>
                        <div class="nm4-queue-controls">
                            <label>Turn length <select id="nm4-audio-minutes"><option value="1">1 min</option><option value="3" selected>3 min</option><option value="5">5 min</option><option value="10">10 min</option><option value="20">20 min</option><option value="60">60 min</option></select></label>
                        </div>
                        <div id="nm4-audio-queue" class="nm4-audio-queue"></div>
                    </div>
                    <div class="nm4-tool-card">
                        <div class="nm4-section-title"><span>Participants</span><small id="nm4-participant-count">0</small></div>
                        <div id="nm4-participants" class="nm4-participants"></div>
                    </div>
                </aside>
            </div>

            <div class="nm4-merry-card" id="nm4-merry-card" hidden>
                <div class="nm4-section-title"><span>Merry-go-round</span><small id="nm4-merry-status">Waiting to start</small></div>
                <div id="nm4-merry-stage" class="nm4-merry-stage"></div>
                <div class="nm4-merry-controls">
                    <button type="button" class="nm4-button" id="nm4-merry-next">Next turn</button>
                    <button type="button" class="nm4-button secondary" id="nm4-merry-stop">Stop Merry-go-round</button>
                </div>
            </div>
        `;
        room.appendChild(panel);

        document.getElementById("nm4-share-screen")?.addEventListener("click", nm4StartScreenShare);
        document.getElementById("nm4-stop-screen")?.addEventListener("click", nm4StopScreenShare);
        document.getElementById("nm4-request-audio")?.addEventListener("click", nm4RequestAudio);
        document.getElementById("nm4-stop-audio")?.addEventListener("click", () => nm4StopMyAudio("completed"));
        document.getElementById("nm4-toggle-merry")?.addEventListener("click", nm4ToggleMerry);
        document.getElementById("nm4-end-call")?.addEventListener("click", nm4EndCall);
        document.getElementById("nm4-merry-next")?.addEventListener("click", nm4MerryNext);
        document.getElementById("nm4-merry-stop")?.addEventListener("click", nm4StopMerry);

        const select = document.getElementById("nm4-audio-minutes");
        select?.addEventListener("change", () => NM4.audioRequestedMinutes = Number(select.value) || 3);
    }

    function nm4RenderDawGrid() {
        const grid = document.getElementById("nm4-daw-grid");
        if (!grid) return;
        const streams = [...NM4.remoteStreams.entries()];
        const local = NM4.screenStream ? [[NM4.user.id, NM4.screenStream]] : [];
        const all = [...local, ...streams.filter(([id]) => id !== NM4.user?.id)];
        document.getElementById("nm4-screen-count")?.replaceChildren(document.createTextNode(`${all.length} connected`));
        if (!all.length) {
            grid.innerHTML = `<div class="nm4-empty-media"><strong>No DAW screens yet</strong><span>Each staff collaborator can share a real browser-selected window or screen.</span></div>`;
            return;
        }
        grid.innerHTML = "";
        all.forEach(([userId, stream], index) => {
            const card = document.createElement("article");
            card.className = "nm4-daw-feed" + (index === 0 ? " primary" : "");
            card.dataset.userId = userId;
            const video = document.createElement("video");
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;
            video.srcObject = stream;
            card.innerHTML = `<div class="nm4-daw-feed-head"><strong>${nm4Escape(nm4DisplayName(userId, userId === NM4.user?.id ? "You" : "Collaborator"))}</strong><span>${userId === NM4.user?.id ? "Your DAW" : "Live DAW"}</span></div>`;
            card.appendChild(video);
            grid.appendChild(card);
        });
    }

    function nm4RenderParticipants(rows) {
        const container = document.getElementById("nm4-participants");
        if (!container) return;
        document.getElementById("nm4-participant-count")?.replaceChildren(document.createTextNode(String(rows.length)));
        container.innerHTML = rows.map(row => {
            const name = nm4DisplayName(row.user_id, row.user_id === NM4.user?.id ? "You" : "Collaborator");
            const manager = nm4CanManage() && row.user_id !== NM4.user?.id;
            return `<div class="nm4-participant-row">
                <span class="nm4-presence ${row.is_online ? "online" : "offline"}"></span>
                <div><strong>${nm4Escape(name)}</strong><small>${nm4Escape(row.role || "collaborator")}${row.daw ? ` · ${nm4Escape(row.daw)}` : ""}</small></div>
                ${manager ? `<button type="button" data-nm4-kick="${nm4Escape(row.user_id)}">Kick</button>` : ""}
            </div>`;
        }).join("");
        container.querySelectorAll("[data-nm4-kick]").forEach(btn => btn.addEventListener("click", () => nm4Kick(btn.dataset.nm4Kick)));
    }

    async function nm4RefreshParticipants() {
        const id = nm4CallId();
        if (!id || !nm4IsSupabaseReady()) return;
        const { data, error } = await supabaseClient
            .from("music_call_participants")
            .select("id,call_id,user_id,role,daw,is_online,last_seen_at,audio_banned,kicked_at,joined_at,left_at")
            .eq("call_id", id)
            .is("kicked_at", null)
            .order("joined_at", { ascending: true });
        if (error) return;
        for (const row of (data || [])) await nm4LoadProfile(row.user_id);
        nm4RenderParticipants(data || []);
    }

    async function nm4RefreshQueue() {
        const id = nm4CallId();
        if (!id || !nm4IsSupabaseReady()) return;
        const { data, error } = await supabaseClient
            .from("music_audio_queue")
            .select("id,call_id,user_id,requested_minutes,status,requested_at,started_at,ended_at,end_reason")
            .eq("call_id", id)
            .in("status", ["waiting", "active"])
            .order("requested_at", { ascending: true });
        if (error) return;
        NM4.queue = data || [];
        NM4.activeAudio = NM4.queue.find(q => q.status === "active") || null;
        if (NM4.activeAudio?.user_id === NM4.user?.id && !NM4.audioSenderActive && NM4.screenStream) nm4EnableMyAudio();
        if (NM4.activeAudio?.user_id !== NM4.user?.id && NM4.audioSenderActive) nm4DisableLocalAudioOnly();
        for (const q of NM4.queue) await nm4LoadProfile(q.user_id);
        const now = document.getElementById("nm4-audio-now");
        if (now) now.textContent = NM4.activeAudio ? `${nm4DisplayName(NM4.activeAudio.user_id)} · ${NM4.activeAudio.requested_minutes} min` : "No active audio";
        const box = document.getElementById("nm4-audio-queue");
        if (!box) return;
        box.innerHTML = NM4.queue.length ? NM4.queue.map(q => `
            <div class="nm4-queue-row ${q.status === "active" ? "active" : ""}">
                <div><strong>${nm4Escape(nm4DisplayName(q.user_id))}</strong><small>${q.status === "active" ? "ON AIR" : `Waiting · ${q.requested_minutes} min`}</small></div>
                ${nm4CanManage() && q.status === "waiting" ? `<button type="button" data-nm4-approve="${q.id}">Approve</button>` : ""}
                ${nm4CanManage() && q.status === "active" ? `<button type="button" data-nm4-stop="${q.user_id}">Stop</button>` : ""}
            </div>`).join("") : `<div class="nm4-empty-queue">No audio requests. Your DAW audio is never broadcast automatically.</div>`;
        box.querySelectorAll("[data-nm4-approve]").forEach(btn => btn.addEventListener("click", () => nm4ApproveAudio(btn.dataset.nm4Approve)));
        box.querySelectorAll("[data-nm4-stop]").forEach(btn => btn.addEventListener("click", () => nm4StopAudioFor(btn.dataset.nm4Stop)));
        nm4RenderMiniDock();
    }

    async function nm4StartScreenShare() {
        if (!NM4.call || !NM4.user) return;
        if (NM4.participant?.role === "visitor") return alert("Visitors can watch this Music call but cannot share a DAW.");
        if (NM4.participant && NM4.participant.can_share_screen === false) return alert("Your DAW screen sharing has been disabled for this call.");
        if (!navigator.mediaDevices?.getDisplayMedia) return alert("Screen sharing is not supported by this browser.");
        if (NM4.screenStream) return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30, max: 60 }, displaySurface: "window" },
                audio: true,
                systemAudio: "include",
                selfBrowserSurface: "exclude",
                surfaceSwitching: "include"
            });
            NM4.screenStream = stream;
            NM4.screenTrack = stream.getVideoTracks()[0] || null;
            NM4.audioTrack = stream.getAudioTracks()[0] || null;
            if (NM4.audioTrack) NM4.audioTrack.enabled = false;
            NM4.screenTrack?.addEventListener("ended", nm4StopScreenShare);
            for (const [peerId, peer] of NM4.peers) {
                await nm4AddOrReplaceTracks(peerId, peer);
            }
            document.getElementById("nm4-share-screen")?.setAttribute("disabled", "true");
            document.getElementById("nm4-stop-screen")?.removeAttribute("disabled");
            nm4RenderDawGrid();
            if (NM4.activeAudio?.user_id === NM4.user.id) await nm4EnableMyAudio();
            nm4Broadcast({ kind: "screen-state", userId: NM4.user.id, sharing: true });
        } catch (error) {
            console.error("Nemawashi screen sharing failed", error);
        }
    }

    async function nm4StopScreenShare() {
        if (!NM4.screenStream) return;
        NM4.screenStream.getTracks().forEach(track => track.stop());
        NM4.screenStream = null;
        NM4.screenTrack = null;
        NM4.audioTrack = null;
        NM4.audioSenderActive = false;
        for (const [peerId, peer] of NM4.peers) {
            peer.getSenders().forEach(sender => {
                if (sender.track && (sender.track.kind === "video" || sender.track.kind === "audio")) peer.removeTrack(sender);
            });
            await nm4Renegotiate(peerId, peer);
        }
        document.getElementById("nm4-share-screen")?.removeAttribute("disabled");
        document.getElementById("nm4-stop-screen")?.setAttribute("disabled", "true");
        document.getElementById("nm4-stop-audio")?.setAttribute("disabled", "true");
        nm4RenderDawGrid();
        nm4Broadcast({ kind: "screen-state", userId: NM4.user.id, sharing: false });
    }

    async function nm4AddOrReplaceTracks(peerId, peer) {
        if (!NM4.screenTrack) return;
        const videoSender = peer.getSenders().find(s => s.track?.kind === "video");
        if (videoSender) await videoSender.replaceTrack(NM4.screenTrack);
        else peer.addTrack(NM4.screenTrack, NM4.screenStream);
        if (NM4.audioSenderActive && NM4.audioTrack) {
            const audioSender = peer.getSenders().find(s => s.track?.kind === "audio");
            if (audioSender) await audioSender.replaceTrack(NM4.audioTrack);
            else peer.addTrack(NM4.audioTrack, NM4.screenStream);
        }
        await nm4Renegotiate(peerId, peer);
        if (NM4.user.id > peerId) nm4Broadcast({ kind: "renegotiate-request", from: NM4.user.id, to: peerId });
    }

    async function nm4Renegotiate(peerId, peer) {
        if (!NM4.user || !NM4.channel) return;
        if (NM4.user.id > peerId) return;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        nm4Broadcast({ kind: "offer", from: NM4.user.id, to: peerId, description: peer.localDescription });
    }

    function nm4CreatePeer(peerId) {
        if (peerId === NM4.user?.id || NM4.peers.has(peerId)) return NM4.peers.get(peerId);
        const peer = new RTCPeerConnection(NM4.rtcConfig);
        NM4.peers.set(peerId, peer);
        peer.onicecandidate = event => {
            if (event.candidate) nm4Broadcast({ kind: "ice", from: NM4.user.id, to: peerId, candidate: event.candidate });
        };
        peer.ontrack = event => {
            let stream = NM4.remoteStreams.get(peerId);
            if (!stream) {
                stream = new MediaStream();
                NM4.remoteStreams.set(peerId, stream);
            }
            if (!stream.getTracks().some(track => track.id === event.track.id)) stream.addTrack(event.track);
            nm4RenderDawGrid();
            nm4RenderMiniDock();
        };
        peer.onconnectionstatechange = () => {
            if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
                setTimeout(() => {
                    if (peer.connectionState === "failed" || peer.connectionState === "closed") nm4DropPeer(peerId);
                }, 3000);
            }
        };
        if (NM4.screenTrack) peer.addTrack(NM4.screenTrack, NM4.screenStream);
        return peer;
    }

    function nm4DropPeer(peerId) {
        const peer = NM4.peers.get(peerId);
        try { peer?.close(); } catch (_) {}
        NM4.peers.delete(peerId);
        NM4.remoteStreams.delete(peerId);
        nm4RenderDawGrid();
        nm4RenderMiniDock();
    }

    function nm4Broadcast(payload) {
        try {
            NM4.channel?.send({ type: "broadcast", event: "nm4", payload });
        } catch (error) {
            console.error("Nemawashi Realtime broadcast failed", error);
        }
    }

    async function nm4HandleSignal(payload) {
        if (!payload || payload.to && payload.to !== NM4.user?.id) return;
        if (payload.kind === "hello") {
            const peer = nm4CreatePeer(payload.from);
            if (NM4.user.id < payload.from) await nm4Renegotiate(payload.from, peer);
            return;
        }
        if (payload.kind === "renegotiate-request") {
            const peer = nm4CreatePeer(payload.from);
            if (NM4.user.id < payload.from) await nm4Renegotiate(payload.from, peer);
            return;
        }
        if (payload.kind === "offer") {
            const peer = nm4CreatePeer(payload.from);
            await peer.setRemoteDescription(payload.description);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            nm4Broadcast({ kind: "answer", from: NM4.user.id, to: payload.from, description: peer.localDescription });
            return;
        }
        if (payload.kind === "answer") {
            const peer = nm4CreatePeer(payload.from);
            if (peer.signalingState !== "stable") await peer.setRemoteDescription(payload.description);
            return;
        }
        if (payload.kind === "ice") {
            const peer = nm4CreatePeer(payload.from);
            try { await peer.addIceCandidate(payload.candidate); } catch (_) {}
            return;
        }
        if (payload.kind === "chat") {
            if (payload.userId === NM4.user?.id) return;
            musicChatState.participants.push({ id: payload.id || Date.now(), author: payload.author || "Collaborator", body: payload.body || "", timestamp: new Date(payload.timestamp || Date.now()), chat: "participants" });
            renderMusicChatMessages();
            return;
        }
        if (payload.kind === "merry") {
            nm4ApplyMerryIndex(Number(payload.index) || 0, false);
            return;
        }
        if (payload.kind === "merry-stop") {
            nm4StopMerry(false);
            return;
        }
        if (payload.kind === "participant-left") {
            if (payload.userId !== NM4.user?.id) {
                /* Immediately close the departed participant's WebRTC peer. */
                nm4DropPeer(payload.userId);
                if (payload.notify !== false) {
                    nm4Notify(`${payload.name || "A collaborator"} has left the call`, "notice");
                }
                nm4RefreshParticipants();
                nm4RenderDawGrid();
                nm4RenderMiniDock();
            }
            return;
        }
        if (payload.kind === "participant-left-notice") {
            if (payload.userId !== NM4.user?.id) {
                nm4Notify(`${payload.name || "A collaborator"} has left the call`, "notice");
                nm4RefreshParticipants();
            }
            return;
        }
        if (payload.kind === "screen-state") {
            if (payload.userId !== NM4.user?.id && !payload.sharing) {
                nm4DropPeer(payload.userId);
            }
            nm4RenderDawGrid();
            nm4RenderMiniDock();
            return;
        }
        if (payload.kind === "call-ended") {
            nm4FinishLocalCall("The host ended this Music call.");
            return;
        }
        if (payload.kind === "queue-refresh") {
            nm4RefreshQueue();
            return;
        }
    }

    async function nm4ConnectRealtime() {
        if (!nm4IsSupabaseReady() || !NM4.call || !NM4.user) return;
        if (NM4.channel) {
            try { await supabaseClient.removeChannel(NM4.channel); } catch (_) {}
        }
        NM4.channel = supabaseClient.channel(`music-call:${NM4.call.id}`, { config: { broadcast: { self: false }, presence: { key: NM4.user.id } } });
        NM4.channel.on("broadcast", { event: "nm4" }, ({ payload }) => nm4HandleSignal(payload));
        NM4.channel.on("presence", { event: "sync" }, () => {});
        await NM4.channel.subscribe(async status => {
            if (status === "SUBSCRIBED") {
                await NM4.channel.track({ user_id: NM4.user.id, name: nm4DisplayName(NM4.user.id), role: NM4.participant?.role || "collaborator" });
                nm4Broadcast({ kind: "hello", from: NM4.user.id });
            }
        });
    }

    async function nm4RequestAudio() {
        if (!NM4.call) return;
        const minutes = Number(document.getElementById("nm4-audio-minutes")?.value || 3);
        const { error } = await supabaseClient.rpc("request_music_audio", { p_call_id: NM4.call.id, p_requested_minutes: minutes });
        if (error) return alert(error.message || "Could not request DAW audio.");
        await nm4RefreshQueue();
        nm4Broadcast({ kind: "queue-refresh" });
    }

    async function nm4ApproveAudio(queueId) {
        const { data, error } = await supabaseClient.rpc("approve_music_audio", { p_queue_id: queueId });
        if (error) return alert(error.message || "Could not approve audio.");
        await nm4RefreshQueue();
        if (data?.user_id) nm4Broadcast({ kind: "queue-refresh" });
        if (data?.user_id === NM4.user?.id) await nm4EnableMyAudio();
    }

    async function nm4EnableMyAudio() {
        if (!NM4.audioTrack || !NM4.screenStream) return alert("Share your DAW screen first so Nemawashi can receive its audio track.");
        NM4.audioSenderActive = true;
        NM4.audioTrack.enabled = true;
        for (const [peerId, peer] of NM4.peers) await nm4AddOrReplaceTracks(peerId, peer);
        document.getElementById("nm4-stop-audio")?.removeAttribute("disabled");
        document.getElementById("nm4-request-audio")?.setAttribute("disabled", "true");
    }

    async function nm4DisableLocalAudioOnly() {
        NM4.audioSenderActive = false;
        if (NM4.audioTrack) NM4.audioTrack.enabled = false;
        for (const [peerId, peer] of NM4.peers) {
            const sender = peer.getSenders().find(s => s.track?.kind === "audio");
            if (sender) peer.removeTrack(sender);
            await nm4Renegotiate(peerId, peer);
            if (NM4.user.id > peerId) nm4Broadcast({ kind: "renegotiate-request", from: NM4.user.id, to: peerId });
        }
        document.getElementById("nm4-stop-audio")?.setAttribute("disabled", "true");
        document.getElementById("nm4-request-audio")?.removeAttribute("disabled");
    }

    async function nm4StopMyAudio(reason) {
        if (!NM4.call) return;
        const { error } = await supabaseClient.rpc("stop_music_audio", { p_call_id: NM4.call.id, p_reason: reason || "stopped" });
        if (error && !String(error.message || "").includes("cannot")) return alert(error.message || "Could not stop audio.");
        NM4.audioSenderActive = false;
        if (NM4.audioTrack) NM4.audioTrack.enabled = false;
        for (const [peerId, peer] of NM4.peers) {
            const sender = peer.getSenders().find(s => s.track?.kind === "audio");
            if (sender) peer.removeTrack(sender);
            await nm4Renegotiate(peerId, peer);
        }
        document.getElementById("nm4-stop-audio")?.setAttribute("disabled", "true");
        document.getElementById("nm4-request-audio")?.removeAttribute("disabled");
        await nm4RefreshQueue();
        nm4Broadcast({ kind: "queue-refresh" });
    }

    async function nm4StopAudioFor(userId) {
        if (!nm4CanManage()) return;
        if (userId === NM4.user?.id) return nm4StopMyAudio("stopped");
        const { error } = await supabaseClient.rpc("stop_music_audio", { p_call_id: NM4.call.id, p_reason: "manager_stopped" });
        if (error) return alert(error.message || "Could not stop audio.");
        await nm4RefreshQueue();
        nm4Broadcast({ kind: "queue-refresh" });
    }

    async function nm4Kick(userId) {
        if (!nm4CanManage()) return;
        const { error } = await supabaseClient.rpc("kick_music_participant", { p_call_id: NM4.call.id, p_user_id: userId });
        if (error) return alert(error.message || "Could not remove participant.");
        nm4Broadcast({ kind: "queue-refresh" });
        await nm4RefreshParticipants();
    }

    function nm4MerryParticipants() {
        const rows = [...NM4.profileCache.entries()].map(([userId, profile]) => ({ userId, name: profile?.display_name || profile?.username || "Collaborator" }));
        if (!rows.some(r => r.userId === NM4.user?.id)) rows.unshift({ userId: NM4.user.id, name: nm4DisplayName(NM4.user.id) });
        return rows;
    }

    function nm4RenderMerry() {
        const stage = document.getElementById("nm4-merry-stage");
        if (!stage) return;
        const people = NM4.merry.participants.length ? NM4.merry.participants : nm4MerryParticipants();
        NM4.merry.participants = people;
        stage.innerHTML = "";
        people.forEach((person, index) => {
            const offset = index - NM4.merry.index;
            const card = document.createElement("div");
            card.className = "nm4-merry-orb";
            if (offset === 0) card.classList.add("active");
            if (offset === 1) card.classList.add("right");
            if (offset === -1) card.classList.add("left");
            if (Math.abs(offset) > 1) card.classList.add("far");
            card.innerHTML = `<span class="nm4-merry-orb-ring"></span><strong>${nm4Escape(person.name)}</strong><small>${offset === 0 ? "PRESENTING NOW" : "DAW"}</small>`;
            stage.appendChild(card);
        });
        const current = people[NM4.merry.index];
        const status = document.getElementById("nm4-merry-status");
        if (status) status.textContent = current ? `${current.name}'s turn` : "Waiting to start";
        if (current?.userId === NM4.user?.id) nm4PlayClickSound();
    }

    function nm4PlayClickSound() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 720;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (_) {}
    }

    function nm4ApplyMerryIndex(index, broadcast) {
        const people = NM4.merry.participants.length ? NM4.merry.participants : nm4MerryParticipants();
        if (!people.length) return;
        NM4.merry.index = ((index % people.length) + people.length) % people.length;
        nm4RenderMerry();
        if (broadcast) nm4Broadcast({ kind: "merry", index: NM4.merry.index });
    }

    function nm4MerryNext() {
        if (!nm4CanManage()) return;
        nm4ApplyMerryIndex(NM4.merry.index + 1, true);
        nm4PersistMerryTurn();
    }

    async function nm4PersistMerryTurn() {
        const people = NM4.merry.participants;
        const current = people[NM4.merry.index];
        if (!current) return;
        await supabaseClient.rpc("set_music_merry_turn", { p_call_id: NM4.call.id, p_user_id: current.userId }).catch(() => {});
    }

    async function nm4ToggleMerry() {
        if (!nm4CanManage()) return;
        if (NM4.merry.active) nm4StopMerry(true);
        else nm4StartMerry(true);
    }

    function nm4StartMerry(broadcast) {
        NM4.merry.active = true;
        NM4.merry.participants = nm4MerryParticipants();
        NM4.merry.index = 0;
        document.getElementById("nm4-merry-card")?.removeAttribute("hidden");
        const button = document.getElementById("nm4-toggle-merry");
        if (button) button.textContent = "Stop Merry-go-round";
        nm4RenderMerry();
        if (broadcast) nm4Broadcast({ kind: "merry", index: 0 });
        clearInterval(NM4.merry.timer);
        NM4.merry.timer = setInterval(() => {
            if (!NM4.merry.active || !nm4CanManage()) return;
            nm4MerryNext();
        }, NM4.merry.duration);
        nm4PersistMerryTurn();
    }

    function nm4StopMerry(broadcast) {
        NM4.merry.active = false;
        clearInterval(NM4.merry.timer);
        NM4.merry.timer = null;
        document.getElementById("nm4-merry-card")?.setAttribute("hidden", "true");
        const button = document.getElementById("nm4-toggle-merry");
        if (button) button.textContent = "Start Merry-go-round";
        if (broadcast) nm4Broadcast({ kind: "merry-stop" });
    }

    function nm4MerrySkipLocalUser() {
        const current = NM4.merry.participants[NM4.merry.index];
        if (current?.userId === NM4.user?.id && nm4CanManage()) nm4MerryNext();
    }

    function nm4PatchChatBroadcast() {
        if (window.__nm4ChatPatched) return;
        window.__nm4ChatPatched = true;
        const original = sendMusicChatMessage;
        sendMusicChatMessage = function(callConfig) {
            const input = document.getElementById("music-chat-input");
            const body = input?.value?.trim() || "";
            if (!body) return;
            original(callConfig);
            nm4Broadcast({
                kind: "chat",
                userId: NM4.user?.id,
                id: `${NM4.user?.id || "user"}-${Date.now()}`,
                author: nm4DisplayName(NM4.user?.id, "You"),
                body,
                timestamp: new Date().toISOString()
            });
        };
    }

    function nm4Notify(message, type = "info") {
        const existing = document.querySelectorAll(".nm4-soft-notification");
        existing.forEach(node => node.remove());
        const node = document.createElement("div");
        node.className = `nm4-soft-notification ${type}`;
        node.innerHTML = `<span class="nm4-soft-notification-dot"></span><span>${nm4Escape(message)}</span>`;
        document.body.appendChild(node);
        requestAnimationFrame(() => node.classList.add("show"));
        setTimeout(() => {
            node.classList.remove("show");
            setTimeout(() => node.remove(), 350);
        }, 4200);
    }

    function nm4PlayFeedbackSound() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const notes = [660, 880, 1046.5];
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.055);
                gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + index * 0.055 + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.055 + 0.17);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + index * 0.055);
                osc.stop(ctx.currentTime + index * 0.055 + 0.19);
            });
            setTimeout(() => ctx.close?.(), 500);
        } catch (_) {}
    }

    async function nm4SubmitLeaveFeedback({ rating, experience, changes, returnPlan }) {
        if (!nm4IsSupabaseReady() || !NM4.feedbackContext || !NM4.user) return;
        const context = NM4.feedbackContext;
        try {
            const { data, error } = await supabaseClient.rpc("submit_music_call_feedback", {
                p_call_id: String(context.callId),
                p_space_id: context.spaceId ? String(context.spaceId) : null,
                p_project_name: context.projectName || "Music Space",
                p_rating: Number(rating) || 0,
                p_experience: experience || "",
                p_changes: changes || "",
                p_return_plan: returnPlan || "maybe"
            });
            if (error) throw error;
            await supabaseClient.functions.invoke("send-music-feedback", {
                body: {
                    feedback_id: data || null,
                    feedback: {
                        call_id: String(context.callId),
                        space_id: context.spaceId ? String(context.spaceId) : null,
                        user_id: NM4.user.id,
                        project_name: context.projectName || "Music Space",
                        rating: Number(rating) || 0,
                        experience: experience || "",
                        changes: changes || "",
                        return_plan: returnPlan || "maybe",
                        wants_daw_saved: returnPlan === "yes"
                    }
                }
            }).catch(error => console.warn("Music feedback email could not be sent:", error));
        } catch (error) {
            console.warn("Music feedback could not be saved:", error);
        }
    }

    function nm4ShowLeaveSurvey() {
        if (NM4.surveyShown) return;
        NM4.surveyShown = true;
        const existing = document.getElementById("nm4-leave-survey");
        if (existing) existing.remove();
        const overlay = document.createElement("div");
        overlay.id = "nm4-leave-survey";
        overlay.className = "nm4-leave-survey";
        overlay.innerHTML = `
            <div class="nm4-survey-backdrop"></div>
            <section class="nm4-survey-card" role="dialog" aria-modal="true" aria-label="Music call feedback">
                <div class="nm4-survey-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>·</i></div>
                <div class="nm4-survey-kicker">CALL COMPLETE</div>
                <h2>How did your session feel?</h2>
                <p class="nm4-survey-subtitle">A tiny bit of feedback helps us make Nemawashi nicer to use.</p>
                <div class="nm4-stars" role="radiogroup" aria-label="Star rating">
                    ${[1,2,3,4,5].map(n => `<button type="button" data-rating="${n}" aria-label="${n} star${n===1?"":"s"}">★</button>`).join("")}
                </div>
                <label>How was your experience?<textarea id="nm4-feedback-experience" rows="3" placeholder="Tell us what felt good, awkward, slow, or fun…"></textarea></label>
                <label>Should we change anything?<textarea id="nm4-feedback-changes" rows="3" placeholder="Anything you'd improve about the call?"></textarea></label>
                <div class="nm4-return-question">
                    <strong>The important one: will you come back?</strong>
                    <div class="nm4-return-options">
                        <button type="button" data-return="yes">Yes, I'll be back ♡</button>
                        <button type="button" data-return="maybe">Maybe</button>
                        <button type="button" data-return="no">Probably not</button>
                    </div>
                </div>
                <div class="nm4-survey-actions">
                    <button type="button" class="nm4-survey-skip" id="nm4-feedback-skip">Skip</button>
                    <button type="button" class="nm4-survey-submit" id="nm4-feedback-submit" disabled>Send feedback</button>
                </div>
            </section>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("show"));
        let rating = 0;
        let returnPlan = "";
        const stars = [...overlay.querySelectorAll("[data-rating]")];
        stars.forEach(button => button.addEventListener("click", () => {
            rating = Number(button.dataset.rating);
            stars.forEach(star => star.classList.toggle("selected", Number(star.dataset.rating) <= rating));
            overlay.querySelector("#nm4-feedback-submit").disabled = !rating || !returnPlan;
            nm4PlayFeedbackSound();
        }));
        const returns = [...overlay.querySelectorAll("[data-return]")];
        returns.forEach(button => button.addEventListener("click", () => {
            returnPlan = button.dataset.return;
            returns.forEach(item => item.classList.toggle("selected", item === button));
            overlay.querySelector("#nm4-feedback-submit").disabled = !rating || !returnPlan;
        }));
        const close = () => {
            overlay.classList.remove("show");
            setTimeout(() => overlay.remove(), 350);
        };
        overlay.querySelector("#nm4-feedback-skip")?.addEventListener("click", async () => {
            close();
            if (NM4.channel && nm4IsSupabaseReady()) {
                try { await supabaseClient.removeChannel(NM4.channel); } catch (_) {}
                NM4.channel = null;
            }
        });
        overlay.querySelector("#nm4-feedback-submit")?.addEventListener("click", async () => {
            const submit = overlay.querySelector("#nm4-feedback-submit");
            submit.disabled = true;
            submit.textContent = "Sending…";
            await nm4SubmitLeaveFeedback({
                rating,
                experience: overlay.querySelector("#nm4-feedback-experience")?.value.trim(),
                changes: overlay.querySelector("#nm4-feedback-changes")?.value.trim(),
                returnPlan
            });
            if (returnPlan === "no") {
                /* The actual leave already happened; this adds the requested
                   explicit notice only when the user says they probably won't return. */
                nm4Broadcast({ kind: "participant-left-notice", userId: NM4.user.id, name: nm4DisplayName(NM4.user.id, "User") });
                nm4Notify(`${nm4DisplayName(NM4.user.id, "User")} has left the call`, "notice");
            } else {
                nm4Notify("Thanks for the feedback ♡", "success");
            }
            close();
            if (NM4.channel && nm4IsSupabaseReady()) {
                try { await supabaseClient.removeChannel(NM4.channel); } catch (_) {}
                NM4.channel = null;
            }
        });
    }

    function nm4RenderMiniDock() {
        if (!NM4.call || !NM4.user || document.querySelector(".music-room-active")) {
            document.getElementById("nm4-mini-dock")?.remove();
            clearInterval(NM4.miniDockTimer);
            NM4.miniDockTimer = null;
            return;
        }
        let dock = document.getElementById("nm4-mini-dock");
        if (!dock) {
            dock = document.createElement("aside");
            dock.id = "nm4-mini-dock";
            dock.className = "nm4-mini-dock";
            document.body.appendChild(dock);
        }
        const candidates = [];
        const activeId = NM4.activeAudio?.user_id;
        const merry = NM4.merry.participants[NM4.merry.index]?.userId;
        [activeId, merry, NM4.user.id, ...NM4.remoteStreams.keys()].filter(Boolean).forEach(id => {
            if (!candidates.some(item => item === id) && (id === NM4.user.id ? NM4.screenStream : NM4.remoteStreams.has(id))) candidates.push(id);
        });
        NM4.miniDockCandidates = candidates;
        if (!candidates.length) {
            dock.innerHTML = `<div class="nm4-mini-dock-copy"><span class="nm4-mini-live"><i></i> CALL ACTIVE</span><strong>${nm4Escape(NM4.call.project?.name || NM4.call.projectName || "Music Space")}</strong><small>DAW preview will appear when someone is sharing.</small></div><button type="button" class="nm4-mini-leave" id="nm4-mini-leave">Leave call</button>`;
        } else {
            if (NM4.miniDockIndex >= candidates.length) NM4.miniDockIndex = 0;
            const id = candidates[NM4.miniDockIndex];
            const stream = id === NM4.user.id ? NM4.screenStream : NM4.remoteStreams.get(id);
            const label = nm4DisplayName(id, id === NM4.user.id ? "You" : "Collaborator");
            dock.innerHTML = `<div class="nm4-mini-video-wrap"><video id="nm4-mini-video" autoplay playsinline muted></video><div class="nm4-mini-overlay"><span class="nm4-mini-live"><i></i> LIVE</span><strong>${nm4Escape(NM4.call.project?.name || NM4.call.projectName || "Music Space")}</strong><small>${nm4Escape(label)} · DAW</small></div></div><button type="button" class="nm4-mini-leave" id="nm4-mini-leave">Leave call</button>`;
            const video = dock.querySelector("#nm4-mini-video");
            if (video) video.srcObject = stream;
        }
        dock.querySelector("#nm4-mini-leave")?.addEventListener("click", () => nm4LeaveCall());
        clearInterval(NM4.miniDockTimer);
        if (candidates.length > 1) {
            NM4.miniDockTimer = setInterval(() => {
                if (document.querySelector(".music-room-active")) return;
                NM4.miniDockIndex = (NM4.miniDockIndex + 1) % NM4.miniDockCandidates.length;
                nm4RenderMiniDock();
            }, 7000);
        }
    }

    async function nm4FinishLocalCall(message, options = {}) {
        const keepCall = !!options.keepCall;
        const keepChannel = !!options.keepChannel;
        nm4StopMerry(false);
        await nm4StopScreenShare();
        clearInterval(NM4.presenceTimer);
        clearInterval(NM4.activityTimer);
        clearInterval(NM4.miniDockTimer);
        NM4.peers.forEach(peer => { try { peer.close(); } catch (_) {} });
        NM4.peers.clear();
        NM4.remoteStreams.clear();
        if (NM4.channel && nm4IsSupabaseReady() && !keepChannel) {
            try { await supabaseClient.removeChannel(NM4.channel); } catch (_) {}
            NM4.channel = null;
        }
        if (!keepCall) {
            NM4.call = null;
            NM4.spaceId = null;
            window.activeNemawashiMusicCall = null;
        }
        document.querySelectorAll(".music-room-active").forEach(node => node.classList.remove("music-room-active"));
        if (message) nm4Notify(message, "notice");
        if (!keepCall) document.getElementById("nm4-mini-dock")?.remove();
        const target = document.querySelector(".space-placeholder") || document.querySelector(".space-chat");
        if (target && !keepCall) target.innerHTML = `<div class="nm4-call-ended-state"><strong>Music Space</strong><span>No active Music call.</span></div>`;
    }

    async function nm4LeaveCall() {
        if (!NM4.user) NM4.user = await nm4GetUser();
        if (!NM4.call || !NM4.user) return;
        const id = nm4CallId();
        const name = nm4DisplayName(NM4.user.id, "User");
        NM4.feedbackContext = { callId: id, spaceId: NM4.spaceId, projectName: NM4.call.project?.name || NM4.call.projectName || "Music Space" };
        if (id && nm4IsSupabaseReady()) await supabaseClient.rpc("leave_music_call", { p_call_id: id }).catch(() => {});
        nm4Broadcast({ kind: "participant-left", userId: NM4.user.id, name, notify: false });
        await nm4FinishLocalCall("You left the call. You can rejoin it any time.", { keepCall: false, keepChannel: true });
        nm4ShowLeaveSurvey();
    }

    async function nm4EndCall() {
        if (!nm4CanManage() || !NM4.call) return;
        if (!confirm("End this Music call for everyone?")) return;
        const { error } = await supabaseClient.rpc("end_music_call", { p_call_id: NM4.call.id });
        if (error) return alert(error.message || "Could not end the call.");
        nm4Broadcast({ kind: "call-ended" });
        await nm4FinishLocalCall("The host ended this Music call.");
    }

    function nm4PatchLeaveButton() {
        const button = document.getElementById("music-leave-call");
        if (!button || button.dataset.nm4Patched) return;
        button.dataset.nm4Patched = "1";

        /*
         * The original V4 room also has a legacy leave listener.
         * Capture + stopImmediatePropagation guarantees that the V4.2
         * feedback/persistence flow is the ONLY leave flow that runs.
         */
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            nm4LeaveCall();
        }, true);
    }

    async function nm4EnhanceCall(callConfig, joinedParticipant) {
        NM4.call = callConfig;
        NM4.spaceId = callConfig?.spaceId || callConfig?.dbCall?.space_id || currentSpace?.id || null;
        NM4.user = NM4.user || await nm4GetUser();
        NM4.profile = NM4.profile || await nm4LoadProfile(NM4.user?.id);
        NM4.participant = joinedParticipant || NM4.participant || {
            user_id: NM4.user?.id,
            role: NM4.call?.hostUserId === NM4.user?.id || NM4.call?.host_user_id === NM4.user?.id ? "host" : (NM4.profile?.is_staff ? "admin" : "collaborator"),
            can_share_screen: true,
            is_online: true
        };
        if (!NM4.call.hostUserId && NM4.user?.id) NM4.call.hostUserId = NM4.user.id;
        if (!NM4.call.host_user_id && NM4.user?.id) NM4.call.host_user_id = NM4.user.id;
        nm4RenderEnhancementShell();
        nm4PatchLeaveButton();
        nm4PatchChatBroadcast();
        await nm4ConnectRealtime();
        await nm4RefreshParticipants();
        await nm4RefreshQueue();
        nm4RenderDawGrid();
        nm4RenderMiniDock();
        nm4StartActivityMonitor();
        nm4MarkActivity();
        NM4.presenceTimer = setInterval(async () => {
            if (!NM4.call) return;
            const active = Date.now() - NM4.lastActivityAt < 60000;
            await nm4SendActivity(active);
            if (nm4CanManage()) await supabaseClient.rpc("music_call_cleanup_inactive", { p_call_id: NM4.call.id }).catch(() => {});
            await nm4RefreshParticipants();
            await nm4RefreshQueue();
        }, 15000);
        if (callConfig.collaborationMode === "merry-go-round" || callConfig.merryGoRound?.active) nm4StartMerry(false);
    }

    /* Preserve the original room and only enhance it after it exists. */
    const nm4OriginalOpenMusicCallRoom = openMusicCallRoom;
    openMusicCallRoom = function (callConfig) {
        nm4OriginalOpenMusicCallRoom(callConfig);
        nm4EnhanceCall(callConfig, callConfig?.localParticipant || null).catch(error => console.error("Nemawashi collaboration initialization failed", error));
    };

    /* Persist the original call after the original start flow completes. */
    const nm4OriginalStartMusicCall = startMusicCall;
    startMusicCall = async function () {
        await nm4OriginalStartMusicCall();
        const call = window.activeNemawashiMusicCall;
        if (!call || !nm4IsSupabaseReady()) return;
        call.collaborationMode = musicCallState.collaborationMode || "standard";
        call.merryGoRound = { active: call.collaborationMode === "merry-go-round" };
        const invitedIds = Array.isArray(call.invitees) ? call.invitees.map(p => typeof p === "string" ? p : p.id).filter(Boolean) : [];
        const { data, error } = await supabaseClient.rpc("create_music_call_with_invites", {
            p_call_id: call.id,
            p_space_id: currentSpace?.id ? String(currentSpace.id) : null,
            p_project_name: call.project?.name || call.projectName,
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
            console.error("Could not persist Music call", error);
            alert("The call opened, but it could not be made persistent. Check the V4 Supabase migration.");
            return;
        }
        call.dbCall = data;
        call.spaceId = data?.space_id || currentSpace?.id || null;
        NM4.spaceId = call.spaceId;
        call.hostUserId = data?.host_user_id;
        call.createdAt = data?.created_at || call.createdAt;
        await supabaseClient.rpc("update_music_call_details", {
            p_call_id: call.id,
            p_description: call.project?.description || "",
            p_reference_link: call.project?.referenceLink || ""
        }).catch(() => {});
        await nm4RefreshParticipants();
        if (call.collaborationMode === "merry-go-round") {
            setTimeout(() => nm4StartMerry(true), 500);
        }
    };

    /* Setup selector: only the new Merry-go-round choice is injected. */
    const nm4OriginalRenderSetup = renderMusicCallSetup;
    renderMusicCallSetup = function () {
        nm4OriginalRenderSetup();
        musicCallState.collaborationMode = musicCallState.collaborationMode || "standard";
        const windowEl = document.querySelector("#music-call-setup .music-call-window");
        if (!windowEl || document.getElementById("nm4-mode-selector")) return;
        const panel = document.createElement("section");
        panel.id = "nm4-mode-selector";
        panel.className = "nm4-mode-selector";
        panel.innerHTML = `<span class="nm4-kicker">COLLABORATION MODE</span><strong>Choose how the room presents DAWs</strong><div><button type="button" data-nm4-mode="standard">Standard</button><button type="button" data-nm4-mode="merry-go-round">Merry-go-round</button></div>`;
        const navigation = windowEl.querySelector(".music-call-navigation");
        navigation ? navigation.before(panel) : windowEl.appendChild(panel);
        panel.querySelectorAll("[data-nm4-mode]").forEach(button => button.addEventListener("click", () => {
            musicCallState.collaborationMode = button.dataset.nm4Mode;
            panel.querySelectorAll("button").forEach(b => b.classList.toggle("selected", b.dataset.nm4Mode === musicCallState.collaborationMode));
        }));
        panel.querySelector(`[data-nm4-mode="${musicCallState.collaborationMode}"]`)?.classList.add("selected");
    };

    /* Active-call discovery is deliberately additive. */
    const nm4OriginalInitializeMusicSpace = initializeMusicSpace;
    initializeMusicSpace = async function () {
        nm4OriginalInitializeMusicSpace();
        if (!nm4IsSupabaseReady() || !currentSpace?.id) return;
        const { data: row } = await supabaseClient.from("music_calls").select("*").eq("space_id", String(currentSpace.id)).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
        const controls = document.getElementById("music-space-controls");
        const actions = controls?.querySelector(".music-space-actions");
        if (!controls || !actions || !row) return;
        if (NM4.call && NM4.spaceId != null && String(NM4.spaceId) === String(currentSpace.id) && String(NM4.call.id) === String(row.id)) {
            document.getElementById("nm4-mini-dock")?.remove();
            if (!document.querySelector(".music-room-active")) {
                window.activeNemawashiMusicCall = NM4.call;
                openMusicCallRoom(NM4.call);
            }
            return;
        }
        let card = document.getElementById("nm4-active-call-card");
        if (!card) {
            card = document.createElement("div");
            card.id = "nm4-active-call-card";
            card.className = "nm4-active-call-card";
            actions.before(card);
        }
        card.innerHTML = `<div><span class="nm4-live-pill"><i></i> CALL ACTIVE</span><strong>${nm4Escape(row.project_name)}</strong><small>${row.merry_go_round ? "Merry-go-round" : "Standard"} · started ${new Date(row.created_at).toLocaleString()}</small></div><button type="button" class="nm4-button" id="nm4-enter-active">Enter call →</button>`;
        document.getElementById("nm4-enter-active")?.addEventListener("click", () => nm4EnterPersisted(row));
        const start = document.getElementById("start-new-call-button");
        if (start) start.textContent = "Start another call";
    };

    async function nm4EnterPersisted(row) {
        const { data: joined, error } = await supabaseClient.rpc("join_music_call", { p_call_id: row.id, p_daw: "Not specified" });
        if (error) return alert(error.message || "Could not enter this Music call.");
        const call = {
            id: row.id,
            projectName: row.project_name || "Untitled Music Project",
            project: { name: row.project_name || "Untitled Music Project", bpm: row.project_bpm ?? "", key: row.project_key || "C", timeSignature: row.time_signature || "4/4", type: row.project_type || "Song", description: row.project_description || "", referenceLink: row.reference_link || "" },
            invitees: [], daw: row.host_daw || "Not specified", openSpace: !!row.open_space, visitors: !!row.visitors_allowed, visitorChat: !!row.visitor_chat,
            announcements: { kiki:false, serashio:false, links:false }, livestream: !!row.livestream_enabled, youtubePremiere:false,
            collaborationMode: row.merry_go_round ? "merry-go-round" : "standard", merryGoRound: { active: !!row.merry_go_round }, createdAt: row.created_at, hostUserId: row.host_user_id, spaceId: row.space_id, dbCall: row, localParticipant: joined
        };
        window.activeNemawashiMusicCall = call;
        openMusicCallRoom(call);
    }

    /* Make the existing chat show the stored project description immediately. */
    const nm4OriginalCreateRoomHTML = createMusicCallRoomHTML;
    createMusicCallRoomHTML = function (callConfig) {
        const html = nm4OriginalCreateRoomHTML(callConfig);
        return html;
    };

    /* Keep a live call mounted outside the current Space. The room itself is
       reattached only when the user returns to the call's original Space. */
    const nm4PreviousSelectSpace = selectSpace;
    selectSpace = async function(spaceId) {
        const hadLiveCall = !!NM4.call;
        await nm4PreviousSelectSpace(spaceId);
        if (!hadLiveCall || !NM4.call) return;
        const sameSpace = NM4.spaceId != null && String(NM4.spaceId) === String(currentSpace?.id);
        if (!sameSpace) {
            document.querySelectorAll(".music-room-active").forEach(node => node.classList.remove("music-room-active"));
            document.getElementById("nm4-mini-dock")?.remove();
            nm4RenderMiniDock();
        }
    };

    window.nemawashiRefreshMusicCallV4 = () => initializeMusicSpace();
})();
