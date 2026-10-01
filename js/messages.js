/* ============================================================
   NEMAWASHI MESSAGES
============================================================ */


const nemawashiApps = [

    {
        id: "nemawashi",
        name: "Nemawashi",
        type: "Internal App"
    },

    {
        id: "kiki",
        name: "KiKi",
        type: "Hrmnx Service"
    },

    {
        id: "audition",
        name: "Audition",
        type: "Hrmnx Service"
    },

    {
        id: "serashio",
        name: "Serashio",
        type: "Hrmnx Service"
    },

    {
        id: "hrmnx-entertainment",
        name: "Hrmnx Entertainment",
        type: "Website"
    },

    {
        id: "yumeworld",
        name: "Yumeworld",
        type: "Website"
    },

    {
        id: "seiun",
        name: "SEIUN",
        type: "Website"
    },

    {
        id: "hoshi",
        name: "HOSHI",
        type: "Website"
    },

    {
        id: "osakos-diary",
        name: "Osako's Diary",
        type: "Website"
    },

    {
        id: "harmonia",
        name: "Harmonia",
        type: "Website"
    },

    {
        id: "links",
        name: "Links",
        type: "Hrmnx Service"
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

const appsToggle =
    document.getElementById(
        "apps-toggle"
    );


const appsList =
    document.getElementById(
        "apps-list"
    );


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
   APP
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


    setTopbar(
        "APP",
        app.name
    );


    messagesContent.innerHTML = `

        <section
            class="app-page"
            data-current-app="${escapeHtml(app.id)}"
        >


            <!-- BANNER -->

            <div
                class="app-banner"
            >

                <div
                    class="app-banner-content"
                >

                    <small>
                        APP
                    </small>


                    <h2>
                        ${escapeHtml(app.name)}
                    </h2>


                    <p>
                        ${escapeHtml(app.type)}
                    </p>

                </div>

            </div>


            <!-- WORKSPACE -->

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


                        <div
                            style="
                                padding: 9px;
                                color: #9a9aa7;
                                font-size: 10px;
                                line-height: 1.5;
                            "
                        >
                            Projects will appear
                            here once created.
                        </div>

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
            ".space-item"
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

    return String(value ?? "")
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
