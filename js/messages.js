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
   START
============================================================ */

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
                <div class="space-header-icon">
                    ${getSpaceIcon(space.space_type)}
                </div>

                <div>
                    <h2>${escapeHtml(space.name)}</h2>
                    <p>${escapeHtml(
                        space.description || "Communication for this Space."
                    )}</p>
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

            (space.id);
            setupMessageComposer();
            setupAttachmentMenu();
        }

    } catch (error) {
        console.error("Space selection error:", error);
    }
}

async function loadMessages(spaceId) {
    const messagesList = document.getElementById("messages-list");

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

    /*
     * Load attachments.
     *
     * Attachments are optional. If this query fails,
     * normal messages will STILL be rendered.
     */
    const attachmentMap = new Map();

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

    attachmentButton.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();

        const isOpen =
            attachmentMenu.classList.toggle("open");

        attachmentButton.classList.toggle(
            "active",
            isOpen
        );
    });

    attachmentMenu
        .querySelectorAll(".attachment-option")
        .forEach(option => {

            option.addEventListener("click", function(event) {
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
                    attachmentInput.accept = "*/*";
                }

                attachmentInput.click();

                attachmentMenu.classList.remove("open");
                attachmentButton.classList.remove("active");
            });

        });

    document.addEventListener("click", function(event) {
        if (
            !attachmentMenu.contains(event.target) &&
            !attachmentButton.contains(event.target)
        ) {
            attachmentMenu.classList.remove("open");
            attachmentButton.classList.remove("active");
        }
    });

   async function uploadMessageAttachment(file, attachmentType) {
    if (!currentSpace) {
        return;
    }

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("You must be logged in to upload files.");
        return;
    }

    /*
     * Basic size protection for now.
     * We can make this configurable later.
     */
    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
        alert("This file is too large. The maximum size is 50 MB.");
        return;
    }

    const messagesList =
        document.getElementById("messages-list");

    /*
     * Uploading a file creates a message first.
     * This gives the attachment somewhere to belong.
     */
    const { data: message, error: messageError } =
        await supabaseClient
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

        alert("Could not create the attachment message.");
        return;
    }

    const safeFileName =
        file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const storagePath =
        `${currentSpace.id}/${user.id}/${message.id}-${Date.now()}-${safeFileName}`;

    /*
     * Upload to Supabase Storage
     */
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
                contentType: file.type || "application/octet-stream"
            }
        );

    if (uploadError) {
        console.error(
            "Failed to upload attachment:",
            uploadError
        );

        /*
         * Remove the empty message if storage upload failed.
         */
        await supabaseClient
            .from("nemawashi_messages")
            .delete()
            .eq("id", message.id);

        alert("Could not upload the file.");
        return;
    }

    /*
     * Save attachment metadata.
     */
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
            .remove([storagePath]);

        await supabaseClient
            .from("nemawashi_messages")
            .delete()
            .eq("id", message.id);

        alert("Could not save the attachment.");
        return;
    }

    /*
     * Reload the Space so the new attachment appears
     * using the exact same message rendering logic.
     */
    await loadMessages(currentSpace.id);
}

    attachmentInput.addEventListener(
        "change",
        async function() {

            const file = this.files?.[0];

            if (!file) return;

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

function renderMessageAttachment(
    attachment,
    isOwnMessage
) {
    const type = attachment.attachment_type;

    /*
     * Create a temporary signed URL.
     *
     * The bucket is private, so we cannot simply use
     * the storage path as an <img> or download URL.
     */
    const storagePath =
        attachment.storage_path;

    let icon = "□";
    let label = "File";

    if (type === "lyrdem") {
        icon = "TXT";
        label = "Demo Lyrics";
    } else if (type === "prodem") {
        icon = "♫";
        label = "Demo Base";
    } else if (type === "image") {
        icon = "▧";
        label = "Image";
    }

    /*
     * For now images are rendered as a placeholder.
     *
     * The signed URL is loaded immediately after
     * rendering by loadAttachmentImages().
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
                    ${escapeHtml(attachment.file_name)}
                </span>

                <span class="message-attachment-type">
                    ${escapeHtml(label)}
                    ·
                    ${formatFileSize(attachment.file_size)}
                </span>

            </span>

        </button>
    `;
}

function setupAttachmentDownloads() {
    document
        .querySelectorAll(".message-file-attachment")
        .forEach(button => {

            button.addEventListener(
                "click",
                async function() {

                    const storagePath =
                        this.dataset.storagePath;

                    if (!storagePath) return;

                    const {
                        data,
                        error
                    } = await supabaseClient
                        .storage
                        .from("nemawashi-attachments")
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

         await loadMessages(currentSpace.id);

        input.focus();
    });

    input.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            composer.requestSubmit();
        }
    });
}

function scrollMessagesToBottom() {
    const messagesList = document.getElementById("messages-list");

    if (!messagesList) return;

    messagesList.scrollTop = messagesList.scrollHeight;
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
