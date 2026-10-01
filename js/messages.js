// ============================================================
// NEMAWASHI — MESSAGES & COMMUNITIES
// ============================================================
//
// This is the foundation for Nemawashi's communication system.
//
// It intentionally does NOT replace dashboard.js.
// It adds the communication navigation and its first UI layer
// without touching the existing administration modules.
// ============================================================


// ============================================================
// NEMAWASHI COMMUNICATION DATA
// ============================================================

const nemawashiCommunicationApps = [
    {
        id: "nemawashi",
        name: "Nemawashi",
        type: "internal"
    },

    {
        id: "kiki",
        name: "KiKi",
        type: "service"
    },

    {
        id: "audition",
        name: "Audition",
        type: "service"
    },

    {
        id: "serashio",
        name: "Serashio",
        type: "service"
    },

    {
        id: "hrmnx-entertainment",
        name: "Hrmnx Entertainment",
        type: "website"
    },

    {
        id: "yumeworld",
        name: "Yumeworld",
        type: "website"
    },

    {
        id: "seiun",
        name: "SEIUN",
        type: "website"
    },

    {
        id: "hoshi",
        name: "HOSHI",
        type: "website"
    },

    {
        id: "osakos-diary",
        name: "Osako's Diary",
        type: "website"
    },

    {
        id: "harmonia",
        name: "Harmonia",
        type: "website"
    },

    {
        id: "links",
        name: "Links",
        type: "service"
    }
];


// ============================================================
// SPACE TYPES
// ============================================================

const nemawashiSpaceTypes = {

    general: {
        label: "General Space",
        icon: "◌",
        mode: "chat"
    },

    planning: {
        label: "Planning Space",
        icon: "◇",
        mode: "chat"
    },

    creative: {
        label: "Creative Space",
        icon: "✦",
        mode: "creative"
    },

    feedback: {
        label: "Feedback Space",
        icon: "◎",
        mode: "chat"
    },

    info: {
        label: "Info Space",
        icon: "ⓘ",
        mode: "info"
    },

    music: {
        label: "Music Space",
        icon: "♫",
        mode: "music"
    },

    meeting: {
        label: "Meeting Space",
        icon: "▣",
        mode: "meeting"
    },

    appCreating: {
        label: "App Creating Space",
        icon: "⌘",
        mode: "app-creating"
    },

    massiveProject: {
        label: "Massive Project Space",
        icon: "◆",
        mode: "chat"
    }
};


// ============================================================
// ADD COMMUNICATION NAVIGATION
// ============================================================

function addNemawashiCommunicationNavigation() {

    const sidebar =
        document.querySelector(".sidebar");

    if (!sidebar) {
        return;
    }

    if (
        document.getElementById(
            "nemawashi-communication-navigation"
        )
    ) {
        return;
    }


    const group =
        document.createElement("div");

    group.className =
        "nav-group nemawashi-communication-group";

    group.id =
        "nemawashi-communication-navigation";


    group.innerHTML = `

        <div class="nav-group-title">
            NEMAWASHI
        </div>


        <button
            type="button"
            class="nav-item"
            data-nemawashi-section="nemawashi-administration"
        >
            <span class="nav-item-icon">
                ⚙
            </span>

            <span>
                Administration
            </span>
        </button>


        <button
            type="button"
            class="nav-item"
            data-nemawashi-section="nemawashi-home"
        >
            <span class="nav-item-icon">
                ◈
            </span>

            <span>
                Nemawashi
            </span>
        </button>


        <button
            type="button"
            class="nav-item"
            data-nemawashi-section="personal-messages"
        >
            <span class="nav-item-icon">
                ◇
            </span>

            <span>
                Personal Messages
            </span>
        </button>


        <button
            type="button"
            class="nav-item"
            data-nemawashi-section="subsidiary-messages"
        >
            <span class="nav-item-icon">
                ◇
            </span>

            <span>
                Subsidiary Messages
            </span>
        </button>


        <button
            type="button"
            class="nav-item"
            data-nemawashi-section="business-messages"
        >
            <span class="nav-item-icon">
                ◇
            </span>

            <span>
                Business Messages
            </span>
        </button>


        <button
            type="button"
            class="nav-item nemawashi-apps-toggle"
            data-nemawashi-section="apps"
        >
            <span class="nav-item-icon">
                ▦
            </span>

            <span>
                Apps
            </span>

            <span class="nemawashi-apps-arrow">
                ›
            </span>
        </button>


        <div
            class="nemawashi-app-list"
            id="nemawashi-app-list"
        >

            ${nemawashiCommunicationApps.map(app => `

                <button
                    type="button"
                    class="nemawashi-app-nav-item"
                    data-nemawashi-app="${escapeNemawashiAttribute(app.id)}"
                >

                    <span class="nemawashi-app-icon">
                        ${getNemawashiAppIcon(app)}
                    </span>

                    <span>
                        ${escapeNemawashiHtml(app.name)}
                    </span>

                </button>

            `).join("")}

        </div>


        <button
            type="button"
            class="nav-item"
            data-nemawashi-section="app-builder"
        >
            <span class="nav-item-icon">
                ＋
            </span>

            <span>
                App Builder
            </span>
        </button>

    `;


    const firstNavGroup =
        sidebar.querySelector(
            ".nav-group"
        );


    if (firstNavGroup) {

        sidebar.insertBefore(
            group,
            firstNavGroup
        );

    } else {

        sidebar.appendChild(
            group
        );

    }

}


// ============================================================
// APP ICON
// ============================================================

function getNemawashiAppIcon(app) {

    const icons = {

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


    return icons[app.id] || "•";

}


// ============================================================
// ESCAPING
// ============================================================

function escapeNemawashiHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeNemawashiAttribute(value) {

    return escapeNemawashiHtml(value);

}


// ============================================================
// ACTIVE NAVIGATION
// ============================================================

function setNemawashiCommunicationActive(element) {

    document
        .querySelectorAll(
            "#nemawashi-communication-navigation .nav-item, " +
            "#nemawashi-communication-navigation .nemawashi-app-nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


// ============================================================
// RENDER COMMUNICATION HOME
// ============================================================

function renderNemawashiCommunicationHome() {

    const content =
        document.getElementById(
            "dashboard-content"
        );

    if (!content) {
        return;
    }


    const title =
        document.getElementById(
            "section-title"
        );

    const label =
        document.getElementById(
            "section-label"
        );


    if (label) {
        label.textContent =
            "NEMAWASHI";
    }

    if (title) {
        title.textContent =
            "Nemawashi";
    }


    content.innerHTML = `

        <section class="nemawashi-communication-page">

            <div class="nemawashi-page-intro">

                <span class="eyebrow">
                    NEMAWASHI
                </span>

                <h2>
                    Work together.
                </h2>

                <p>
                    Connect with people, teams,
                    projects and Hrmnx services
                    through Nemawashi.
                </p>

            </div>


            <div class="nemawashi-communication-grid">

                <button
                    type="button"
                    class="nemawashi-communication-card"
                    data-nemawashi-section="personal-messages"
                >

                    <span class="card-icon">
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
                    class="nemawashi-communication-card"
                    data-nemawashi-section="business-messages"
                >

                    <span class="card-icon">
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
                    class="nemawashi-communication-card"
                    data-nemawashi-section="apps"
                >

                    <span class="card-icon">
                        ▦
                    </span>

                    <strong>
                        Apps
                    </strong>

                    <span>
                        Enter an Hrmnx App and
                        its Spaces.
                    </span>

                </button>


                <button
                    type="button"
                    class="nemawashi-communication-card"
                    data-nemawashi-section="app-builder"
                >

                    <span class="card-icon">
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

}


// ============================================================
// RENDER PERSONAL MESSAGES
// ============================================================

function renderNemawashiPersonalMessages() {

    renderNemawashiBasicCommunicationPage(
        "Personal Messages",
        "Private conversations between you and other Nemawashi users.",
        "◇"
    );

}


// ============================================================
// RENDER SUBSIDIARY MESSAGES
// ============================================================

function renderNemawashiSubsidiaryMessages() {

    renderNemawashiBasicCommunicationPage(
        "Subsidiary Messages",
        "Communication belonging to Hrmnx subsidiaries.",
        "◇"
    );

}


// ============================================================
// RENDER BUSINESS MESSAGES
// ============================================================

function renderNemawashiBusinessMessages() {

    renderNemawashiBasicCommunicationPage(
        "Business Messages",
        "Professional communication across Hrmnx Entertainment.",
        "◇"
    );

}


// ============================================================
// BASIC COMMUNICATION PAGE
// ============================================================

function renderNemawashiBasicCommunicationPage(
    titleText,
    description,
    icon
) {

    const content =
        document.getElementById(
            "dashboard-content"
        );

    if (!content) {
        return;
    }


    const title =
        document.getElementById(
            "section-title"
        );

    const label =
        document.getElementById(
            "section-label"
        );


    if (label) {
        label.textContent =
            "NEMAWASHI";
    }

    if (title) {
        title.textContent =
            titleText;
    }


    content.innerHTML = `

        <section class="nemawashi-communication-page">

            <div class="nemawashi-page-intro">

                <span class="eyebrow">
                    NEMAWASHI
                </span>

                <h2>
                    ${escapeNemawashiHtml(titleText)}
                </h2>

                <p>
                    ${escapeNemawashiHtml(description)}
                </p>

            </div>


            <div class="nemawashi-empty-state">

                <div class="placeholder-icon">
                    ${escapeNemawashiHtml(icon)}
                </div>

                <h3>
                    Nothing here yet
                </h3>

                <p>
                    The communication system will
                    be connected to Supabase in the
                    next stage.
                </p>

            </div>

        </section>

    `;

}


// ============================================================
// RENDER APPS
// ============================================================

function renderNemawashiApps() {

    const content =
        document.getElementById(
            "dashboard-content"
        );

    if (!content) {
        return;
    }


    const title =
        document.getElementById(
            "section-title"
        );

    const label =
        document.getElementById(
            "section-label"
        );


    if (label) {
        label.textContent =
            "NEMAWASHI";
    }

    if (title) {
        title.textContent =
            "Apps";
    }


    content.innerHTML = `

        <section class="nemawashi-communication-page">

            <div class="nemawashi-page-intro">

                <span class="eyebrow">
                    APPS
                </span>

                <h2>
                    Hrmnx Apps
                </h2>

                <p>
                    Select an App to enter its
                    community and Spaces.
                </p>

            </div>


            <div class="nemawashi-app-grid">

                ${nemawashiCommunicationApps.map(app => `

                    <button
                        type="button"
                        class="nemawashi-app-card"
                        data-nemawashi-app="${escapeNemawashiAttribute(app.id)}"
                    >

                        <span class="nemawashi-app-card-icon">
                            ${getNemawashiAppIcon(app)}
                        </span>

                        <span class="nemawashi-app-card-name">
                            ${escapeNemawashiHtml(app.name)}
                        </span>

                        <span class="nemawashi-app-card-type">
                            ${escapeNemawashiHtml(app.type)}
                        </span>

                        <span class="nemawashi-app-card-arrow">
                            →
                        </span>

                    </button>

                `).join("")}

            </div>

        </section>

    `;

}


// ============================================================
// RENDER APP
// ============================================================

function renderNemawashiApp(
    appId
) {

    const app =
        nemawashiCommunicationApps.find(
            item =>
                item.id === appId
        );


    if (!app) {
        return;
    }


    const content =
        document.getElementById(
            "dashboard-content"
        );

    if (!content) {
        return;
    }


    const title =
        document.getElementById(
            "section-title"
        );

    const label =
        document.getElementById(
            "section-label"
        );


    if (label) {
        label.textContent =
            "APP";
    }

    if (title) {
        title.textContent =
            app.name;
    }


    content.innerHTML = `

        <section
            class="nemawashi-app-page"
            data-app-id="${escapeNemawashiAttribute(app.id)}"
        >

            <div class="nemawashi-app-banner">

                <div class="nemawashi-app-banner-overlay">

                    <span class="nemawashi-app-label">
                        APP
                    </span>

                    <h2>
                        ${escapeNemawashiHtml(app.name)}
                    </h2>

                    <p>
                        ${escapeNemawashiHtml(app.type)}
                    </p>

                </div>

            </div>


            <div class="nemawashi-app-body">

                <aside class="nemawashi-space-sidebar">

                    <div class="nemawashi-space-heading">
                        <span>
                            ${escapeNemawashiHtml(app.name)}
                        </span>
                    </div>


                    <div class="nemawashi-space-section">

                        <div class="nemawashi-space-section-title">
                            GENERAL
                        </div>


                        <button
                            type="button"
                            class="nemawashi-space-item active"
                            data-nemawashi-space="general"
                        >
                            <span>◌</span>
                            General Space
                        </button>


                        <button
                            type="button"
                            class="nemawashi-space-item"
                            data-nemawashi-space="planning"
                        >
                            <span>◇</span>
                            Planning Space
                        </button>


                        <button
                            type="button"
                            class="nemawashi-space-item"
                            data-nemawashi-space="feedback"
                        >
                            <span>◎</span>
                            Feedback Space
                        </button>


                        <button
                            type="button"
                            class="nemawashi-space-item"
                            data-nemawashi-space="info"
                        >
                            <span>ⓘ</span>
                            Info Space
                        </button>

                    </div>


                    <div class="nemawashi-space-section">

                        <div class="nemawashi-space-section-title">
                            PROJECTS
                        </div>


                        <div class="nemawashi-project-placeholder">

                            Projects will appear here.

                        </div>

                    </div>

                </aside>


                <main class="nemawashi-space-content">

                    <div class="nemawashi-space-header">

                        <div>

                            <span class="eyebrow">
                                GENERAL
                            </span>

                            <h3>
                                General Space
                            </h3>

                        </div>

                    </div>


                    <div class="nemawashi-space-preview">

                        <div class="placeholder-icon">
                            ◌
                        </div>

                        <h3>
                            General Space
                        </h3>

                        <p>
                            This is where the Space
                            conversation will appear.
                        </p>

                    </div>

                </main>

            </div>

        </section>

    `;

}


// ============================================================
// RENDER APP BUILDER
// ============================================================

function renderNemawashiAppBuilder() {

    renderNemawashiBasicCommunicationPage(
        "App Builder",
        "Create and configure Apps for the Nemawashi ecosystem.",
        "＋"
    );

}


// ============================================================
// NAVIGATION HANDLER
// ============================================================

function handleNemawashiCommunicationNavigation(
    event
) {

    const sectionElement =
        event.target.closest(
            "[data-nemawashi-section]"
        );


    if (sectionElement) {

        event.preventDefault();
        event.stopPropagation();


        setNemawashiCommunicationActive(
            sectionElement
        );


        const section =
            sectionElement.dataset.nemawashiSection;


        if (section === "nemawashi-home") {

            renderNemawashiCommunicationHome();

        } else if (
            section === "nemawashi-administration"
        ) {

            renderNemawashiBasicCommunicationPage(
                "Nemawashi Administration",
                "Manage Nemawashi's communication infrastructure, Apps, Spaces, roles and permissions.",
                "⚙"
            );

        } else if (
            section === "personal-messages"
        ) {

            renderNemawashiPersonalMessages();

        } else if (
            section === "subsidiary-messages"
        ) {

            renderNemawashiSubsidiaryMessages();

        } else if (
            section === "business-messages"
        ) {

            renderNemawashiBusinessMessages();

        } else if (
            section === "apps"
        ) {

            renderNemawashiApps();

        } else if (
            section === "app-builder"
        ) {

            renderNemawashiAppBuilder();

        }


        return true;

    }


    const appElement =
        event.target.closest(
            "[data-nemawashi-app]"
        );


    if (appElement) {

        event.preventDefault();
        event.stopPropagation();


        const appId =
            appElement.dataset.nemawashiApp;


        setNemawashiCommunicationActive(
            appElement
        );


        renderNemawashiApp(
            appId
        );


        return true;

    }


    return false;

}


// ============================================================
// CAPTURE NAVIGATION
// ============================================================
//
// dashboard.js already has a global click handler.
// We intercept Nemawashi communication buttons during
// capture so the existing administration navigation is
// completely untouched.
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        handleNemawashiCommunicationNavigation(
            event
        );

    },
    true
);


// ============================================================
// INITIALIZE
// ============================================================

function initializeNemawashiCommunicationNavigation() {

    addNemawashiCommunicationNavigation();

}


// The dashboard HTML loads its scripts after the page,
// so the DOM is already available here.

initializeNemawashiCommunicationNavigation();
