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


            const pageButton =
                event.target.closest(
                    "[data-page]"
                );


            if (pageButton) {

                setNavigationActive(
                    pageButton
                );


                resetNemawashiTheme();


                renderPage(
                    pageButton.dataset.page
                );


                return;

            }


            const appButton =
                event.target.closest(
                    "[data-app]"
                );


            if (appButton) {

                setAppNavigationActive(
                    appButton
                );


                await renderApp(
                    appButton.dataset.app
                );


                return;

            }


            const spaceButton =
                event.target.closest(
                    "[data-space]"
                );


            if (spaceButton) {

                selectSpace(
                    spaceButton.dataset.space
                );

            }

        }
    );


    if (appsToggle) {

        appsToggle.addEventListener(
            "click",
            function() {

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

        const {
            data,
            error
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


        if (error) {

            console.error(
                "Failed to load Spaces:",
                error
            );

            if (generalSpaces) {

                generalSpaces.innerHTML =
                    `
                        <div class="space-loading">
                            Could not load Spaces.
                        </div>
                    `;

            }

            return;

        }


        const spaces =
            data || [];


        const general =
            spaces.filter(
                space =>
                    space.project_id === null
            );


        const projects =
            spaces.filter(
                space =>
                    space.project_id !== null
            );


        if (generalSpaces) {

            if (!general.length) {

                generalSpaces.innerHTML =
                    `
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

                                    ${escapeHtml(space.name)}

                                </button>

                            `
                        )
                        .join("");

            }

        }


        if (projectList) {

            if (!projects.length) {

                projectList.innerHTML =
                    `
                        <div class="project-empty">
                            No projects yet.
                        </div>
                    `;

            }

            else {

                projectList.innerHTML =
                    projects
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

                                    ${escapeHtml(space.name)}

                                </button>

                            `
                        )
                        .join("");

            }

        }


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
            "Space loading error:",
            error
        );

    }

}


/* ============================================================
   SELECT SPACE
============================================================ */

async function selectSpace(
    spaceId
) {

    if (!currentApp) {

        return;

    }


    document
        .querySelectorAll(
            ".space-item"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    const selectedButton =
        document.querySelector(
            `[data-space="${CSS.escape(spaceId)}"]`
        );


    if (selectedButton) {

        selectedButton.classList.add(
            "active"
        );

    }


    const {
        data,
        error
    } = await supabaseClient

        .from("nemawashi_spaces")

        .select(`
            id,
            name,
            space_type,
            description
        `)

        .eq(
            "id",
            spaceId
        )

        .maybeSingle();


    if (error) {

        console.error(
            "Failed to load Space:",
            error
        );

        return;

    }


    if (!data) {

        return;

    }


    currentSpace =
        data;


    const header =
        document.querySelector(
            ".space-header"
        );


    const content =
        document.querySelector(
            ".space-placeholder"
        );


    if (!header || !content) {

        return;

    }


    header.innerHTML = `

        <small>
            ${escapeHtml(
                data.space_type
                    .replace(
                        /_/g,
                        " "
                    )
                    .toUpperCase()
            )}
        </small>


        <h3>
            ${escapeHtml(data.name)}
        </h3>

    `;


    content.innerHTML = `

        <div
            class="space-placeholder-icon"
        >
            ${getSpaceIcon(
                data.space_type
            )}
        </div>


        <h3>
            ${escapeHtml(data.name)}
        </h3>


        <p>
            ${escapeHtml(
                data.description ||
                "This Space is ready for its communication interface."
            )}
        </p>

    `;

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
