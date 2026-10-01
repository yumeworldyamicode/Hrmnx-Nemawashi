/* ============================================================
   NEMAWASHI MESSAGES
============================================================ */


/* ============================================================
   APP CONFIGURATION
============================================================ */

const nemawashiApps = [

    {
        id: "nemawashi",

        name: "Nemawashi",

        type: "Internal App",

        description:
            "The internal communication and workspace platform for Hrmnx Entertainment.",

        website: "https://nemawashi.hrmnx.site",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f7f7fb",
            primary: "#636bd8",
            secondary: "#aeb3f1",
            accent: "#4f57c7",
            text: "#292a35"
        },

        projects: []

    },


    {
        id: "kiki",

        name: "KiKi",

        type: "Hrmnx Service",

        description:
            "A community space for Hrmnx Entertainment artists, fans and communities.",

        website:
            "https://yumeworldyamicode.github.io/Hrmnx-KiKi",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f5f7ff",
            primary: "#7278d9",
            secondary: "#aeb6f0",
            accent: "#5960c8",
            text: "#292b3b"
        },

        projects: []

    },


    {
        id: "audition",

        name: "Audition",

        type: "Hrmnx Service",

        description:
            "A workspace for auditions, applicants and talent management.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f8f6fb",
            primary: "#8b6bb5",
            secondary: "#c3a9df",
            accent: "#704e9d",
            text: "#30283a"
        },

        projects: []

    },


    {
        id: "serashio",

        name: "Serashio",

        type: "Hrmnx Service",

        description:
            "A private communication and commission space.",

        website:
            "https://yumeworldyamicode.github.io/Hrmnx-KiKi-Serashio",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f8f5f2",
            primary: "#9a7660",
            secondary: "#d3b9a5",
            accent: "#765441",
            text: "#332a26"
        },

        projects: []

    },


    {
        id: "hrmnx-entertainment",

        name: "Hrmnx Entertainment",

        type: "Website",

        description:
            "The main Hrmnx Entertainment website and company workspace.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f5f5f5",
            primary: "#171717",
            secondary: "#555555",
            accent: "#000000",
            text: "#181818"
        },

        projects: []

    },


    {
        id: "yumeworld",

        name: "Yumeworld",

        type: "Website",

        description:
            "The Yumeworld creative and entertainment ecosystem.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f7f4fb",
            primary: "#8b68b6",
            secondary: "#c7aee0",
            accent: "#70499b",
            text: "#30283a"
        },

        projects: []

    },


    {
        id: "seiun",

        name: "SEIUN",

        type: "Website",

        description:
            "The official workspace for SEIUN.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f5f8fb",
            primary: "#718ba5",
            secondary: "#aebfd0",
            accent: "#506d89",
            text: "#29323a"
        },

        projects: []

    },


    {
        id: "hoshi",

        name: "HOSHI",

        type: "Website",

        description:
            "The official HOSHI workspace.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f8f7f1",
            primary: "#a08f5d",
            secondary: "#d1c59a",
            accent: "#82723e",
            text: "#302e25"
        },

        projects: []

    },


    {
        id: "osakos-diary",

        name: "Osako's Diary",

        type: "Website",

        description:
            "The official Osako's Diary workspace.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f7f4ef",
            primary: "#a77d60",
            secondary: "#d5b9a1",
            accent: "#855d42",
            text: "#342b26"
        },

        projects: []

    },


    {
        id: "harmonia",

        name: "Harmonia",

        type: "Website",

        description:
            "The official Harmonia workspace.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f4f7f5",
            primary: "#658675",
            secondary: "#a9c0b3",
            accent: "#4c6f5c",
            text: "#29332d"
        },

        projects: []

    },


    {
        id: "links",

        name: "Links",

        type: "Hrmnx Service",

        description:
            "A central workspace for Hrmnx links and resources.",

        website: "",

        favicon: "",

        textLogo: "",

        banner: "",

        theme: {
            background: "#f6f7f8",
            primary: "#66727c",
            secondary: "#aab3ba",
            accent: "#4d5962",
            text: "#293037"
        },

        projects: []

    }

];


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
   ELEMENTS
============================================================ */

const messagesContent =
    document.getElementById(
        "messages-content"
    );


const topbarTitle =
    document.getElementById(
        "topbar-title"
    );


const topbarLabel =
    document.getElementById(
        "topbar-label"
    );


const appsToggle =
    document.getElementById(
        "apps-toggle"
    );


const appsList =
    document.getElementById(
        "apps-list"
    );


/* ============================================================
   APP THEME
============================================================ */

function applyAppTheme(app) {

    if (!app || !app.theme) {

        return;

    }


    document.documentElement.style.setProperty(
        "--messages-background",
        app.theme.background
    );


    document.documentElement.style.setProperty(
        "--messages-accent",
        app.theme.primary
    );


    document.documentElement.style.setProperty(
        "--messages-accent-soft",
        hexToRgba(
            app.theme.primary,
            0.10
        )
    );


    document.documentElement.style.setProperty(
        "--app-secondary",
        app.theme.secondary
    );


    document.documentElement.style.setProperty(
        "--app-accent",
        app.theme.accent
    );


    document.documentElement.style.setProperty(
        "--app-text",
        app.theme.text
    );

}


/* ============================================================
   RESET TO NEMAWASHI THEME
============================================================ */

function resetNemawashiTheme() {

    const defaultTheme = {

        background: "#f7f7fb",
        primary: "#636bd8",
        secondary: "#aeb3f1",
        accent: "#4f57c7",
        text: "#292a35"

    };


    applyAppTheme({
        theme: defaultTheme
    });

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


    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;

}


/* ============================================================
   NAVIGATION
============================================================ */

document.addEventListener(
    "click",
    function (event) {


        const navigationItem =
            event.target.closest(
                "[data-page]"
            );


        if (navigationItem) {

            const page =
                navigationItem.dataset.page;


            setNavigationActive(
                navigationItem
            );


            resetNemawashiTheme();


            renderPage(
                page
            );


            return;

        }


        const appNavigationItem =
            event.target.closest(
                "[data-app]"
            );


        if (appNavigationItem) {

            const appId =
                appNavigationItem.dataset.app;


            setAppNavigationActive(
                appNavigationItem
            );


            renderApp(
                appId
            );


            return;

        }

    }
);


/* ============================================================
   APPS TOGGLE
============================================================ */

if (appsToggle) {

    appsToggle.addEventListener(
        "click",
        function () {

            const isOpen =
                appsList.classList.toggle(
                    "open"
                );


            appsToggle.classList.toggle(
                "open",
                isOpen
            );

        }
    );

}


/* ============================================================
   ACTIVE NAVIGATION
============================================================ */

function setNavigationActive(
    element
) {

    document
        .querySelectorAll(
            ".navigation-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".app-navigation-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
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
            ".navigation-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".app-navigation-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
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
                "＋"
            );

            break;

    }

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
                        ＋
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
            function () {

                if (appsList) {

                    appsList.classList.add(
                        "open"
                    );

                }


                if (appsToggle) {

                    appsToggle.classList.add(
                        "open"
                    );

                }


                renderAppDirectory();

            }
        );

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
                style="
                    min-height: 430px;
                    background: #fff;
                    border: 1px dashed var(--messages-border);
                    border-radius: 20px;
                "
            >

                <div
                    class="space-placeholder-icon"
                >
                    ${icon}
                </div>


                <h3>
                    Coming next
                </h3>


                <p>
                    The real communication
                    system will be connected
                    to Supabase here.
                </p>

            </div>

        </section>

    `;

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

                ${nemawashiApps.map(
                    app => `

                        <button
                            type="button"
                            class="app-card"
                            data-app="${escapeHtml(app.id)}"
                        >

                            <span
                                class="app-card-icon"
                            >
                                ${appIcons[app.id] || "•"}
                            </span>


                            <span
                                class="app-card-name"
                            >
                                ${escapeHtml(app.name)}
                            </span>


                            <span
                                class="app-card-type"
                            >
                                ${escapeHtml(app.type)}
                            </span>


                            <span
                                class="app-card-arrow"
                            >
                                →
                            </span>

                        </button>

                    `
                ).join("")}

            </div>

        </section>

    `;

}


/* ============================================================
   RENDER APP
============================================================ */

function renderApp(
    appId
) {

    const app =
        nemawashiApps.find(
            item =>
                item.id === appId
        );


    if (!app) {

        return;

    }


    /* APPLY APP THEME */

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
            data-current-app="${escapeHtml(app.id)}"
        >


            <!-- APP BANNER -->

            <div
                class="app-banner"
            >

                <div
                    class="app-banner-content"
                >

                    ${
                        app.textLogo
                        ?
                        `
                            <img
                                class="app-text-logo"
                                src="${escapeHtml(app.textLogo)}"
                                alt="${escapeHtml(app.name)}"
                            >
                        `
                        :
                        `
                            <div
                                class="app-logo-fallback"
                            >
                                ${
                                    appIcons[app.id] || "A"
                                }
                            </div>
                        `
                    }


                    <small>
                        ${escapeHtml(app.type)}
                    </small>


                    <h2>
                        ${escapeHtml(app.name)}
                    </h2>


                    <p>
                        ${escapeHtml(app.description)}
                    </p>

                </div>

            </div>


            <!-- APP WORKSPACE -->

            <div
                class="app-workspace"
            >


                <!-- SPACE SIDEBAR -->

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


                        <button
                            type="button"
                            class="space-item active"
                            data-space="general"
                        >

                            <span>
                                ◌
                            </span>

                            General Space

                        </button>


                        <button
                            type="button"
                            class="space-item"
                            data-space="planning"
                        >

                            <span>
                                ◇
                            </span>

                            Planning Space

                        </button>


                        <button
                            type="button"
                            class="space-item"
                            data-space="feedback"
                        >

                            <span>
                                ◎
                            </span>

                            Feedback Space

                        </button>


                        <button
                            type="button"
                            class="space-item"
                            data-space="info"
                        >

                            <span>
                                ⓘ
                            </span>

                            Info Space

                        </button>

                    </div>


                    <div
                        class="space-category"
                    >

                        <div
                            class="space-category-title"
                        >
                            PROJECTS
                        </div>


                        ${
                            app.projects.length
                            ?
                            app.projects.map(
                                project => `
                                    <button
                                        type="button"
                                        class="space-item"
                                        data-project="${escapeHtml(project.id)}"
                                    >
                                        ◇
                                        ${escapeHtml(project.name)}
                                    </button>
                                `
                            ).join("")
                            :
                            `
                                <div
                                    class="project-empty"
                                >
                                    No projects yet.
                                </div>
                            `
                        }

                    </div>

                </aside>


                <!-- SPACE -->

                <main
                    class="space-main"
                >

                    <div
                        class="space-header"
                    >

                        <small>
                            GENERAL
                        </small>


                        <h3>
                            General Space
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
                            General Space
                        </h3>


                        <p>
                            This is where the
                            Space conversation
                            will appear.
                        </p>

                    </div>

                </main>


            </div>


        </section>

    `;


    initializeSpaceNavigation();

}


/* ============================================================
   SPACE NAVIGATION
============================================================ */

function initializeSpaceNavigation() {

    document
        .querySelectorAll(
            ".space-item[data-space]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        document
                            .querySelectorAll(
                                ".space-item"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        this.classList.add(
                            "active"
                        );


                        const space =
                            this.dataset.space;


                        renderSpacePreview(
                            space
                        );

                    }
                );

            }
        );

}


/* ============================================================
   SPACE PREVIEW
============================================================ */

function renderSpacePreview(
    space
) {

    const names = {

        general: {
            label: "GENERAL",
            title: "General Space",
            icon: "◌"
        },

        planning: {
            label: "PLANNING",
            title: "Planning Space",
            icon: "◇"
        },

        feedback: {
            label: "FEEDBACK",
            title: "Feedback Space",
            icon: "◎"
        },

        info: {
            label: "INFO",
            title: "Info Space",
            icon: "ⓘ"
        }

    };


    const selected =
        names[space] ||
        names.general;


    const header =
        document.querySelector(
            ".space-header"
        );


    const preview =
        document.querySelector(
            ".space-placeholder"
        );


    if (!header || !preview) {

        return;

    }


    header.innerHTML = `

        <small>
            ${escapeHtml(selected.label)}
        </small>

        <h3>
            ${escapeHtml(selected.title)}
        </h3>

    `;


    preview.innerHTML = `

        <div
            class="space-placeholder-icon"
        >
            ${selected.icon}
        </div>


        <h3>
            ${escapeHtml(selected.title)}
        </h3>


        <p>
            The ${escapeHtml(selected.title)}
            interface will be built here.
        </p>

    `;

}


/* ============================================================
   TOP BAR
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
   START
============================================================ */

renderHome();
