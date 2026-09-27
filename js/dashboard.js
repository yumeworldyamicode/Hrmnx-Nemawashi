// ============================================================
// NEMAWASHI DASHBOARD
// ============================================================

// ------------------------------------------------------------
// DOM ELEMENTS
// ------------------------------------------------------------

const dashboardContent = document.getElementById("dashboard-content");
const sectionTitle = document.getElementById("section-title");
const sectionLabel = document.getElementById("section-label");

const userName = document.getElementById("user-name");
const userRole = document.getElementById("user-role");
const userAvatarLetter = document.getElementById("user-avatar-letter");

const signOutButton = document.getElementById("sign-out-button");


// ------------------------------------------------------------
// SECTION NAMES
// ------------------------------------------------------------

const sectionNames = {
    overview: {
        label: "HRMNX",
        title: "Overview"
    },

    people: {
        label: "HRMNX",
        title: "People"
    },

    organization: {
        label: "HRMNX",
        title: "Organization"
    },

    permissions: {
        label: "HRMNX",
        title: "Permissions"
    },

    notices: {
        label: "SERASHIO",
        title: "Notices"
    },

    banners: {
        label: "SERASHIO",
        title: "Banners"
    },

    artists: {
        label: "SERASHIO",
        title: "Artists"
    },

    releases: {
        label: "SERASHIO",
        title: "Releases"
    },

    "staff-posts": {
        label: "KIKI",
        title: "Staff Posts"
    },

    profiles: {
        label: "KIKI",
        title: "Profiles"
    },

    orders: {
        label: "DIRECT MESSAGES",
        title: "Orders"
    },

    coupons: {
        label: "DIRECT MESSAGES",
        title: "Coupons"
    },

    entitlements: {
        label: "DIRECT MESSAGES",
        title: "Entitlements"
    },

    auditions: {
        label: "HRMNX AUDITION",
        title: "Auditions"
    },

    applications: {
        label: "HRMNX AUDITION",
        title: "Applications"
    }
};


// ------------------------------------------------------------
// CURRENT USER
// ------------------------------------------------------------

window.nemawashiUser = null;


// ------------------------------------------------------------
// REQUIRE USER
// ------------------------------------------------------------

async function requireUser() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Authentication error:", error);
        window.location.href = "index.html";
        return null;
    }

    if (!data || !data.user) {
        window.location.href = "index.html";
        return null;
    }

    return data.user;
}


// ------------------------------------------------------------
// OVERVIEW
// ------------------------------------------------------------

function renderOverview(user) {

    sectionLabel.textContent = "HRMNX";
    sectionTitle.textContent = "Overview";

    dashboardContent.innerHTML = `
        <div class="dashboard-welcome">

            <div class="welcome-text">
                <span class="eyebrow">
                    NEMAWASHI
                </span>

                <h2>
                    Welcome back.
                </h2>

                <p>
                    Manage the Hrmnx Entertainment ecosystem
                    from one central workspace.
                </p>
            </div>

        </div>


        <div class="dashboard-grid">

            ${moduleCard(
                "People",
                "Manage employees, profiles, roles and artist assignments.",
                "people"
            )}

            ${moduleCard(
                "Organization",
                "Manage companies and subsidiaries within Hrmnx.",
                "organization"
            )}

            ${moduleCard(
                "Permissions",
                "Manage roles and access across Nemawashi.",
                "permissions"
            )}

            ${moduleCard(
                "Serashio",
                "Manage notices, banners, artists and releases.",
                "notices"
            )}

            ${moduleCard(
                "KiKi",
                "Manage official posts and community profiles.",
                "staff-posts"
            )}

            ${moduleCard(
                "Direct Messages",
                "Manage orders, coupons and entitlements.",
                "orders"
            )}

            ${moduleCard(
                "Hrmnx Audition",
                "Manage auditions and applications.",
                "auditions"
            )}

        </div>
    `;
}


// ------------------------------------------------------------
// MODULE CARD
// ------------------------------------------------------------

function moduleCard(title, description, module) {

    return `
        <button
            class="dashboard-module-card"
            data-module="${escapeAttribute(module)}"
            type="button"
        >

            <div class="module-card-arrow">
                →
            </div>

            <h3>
                ${escapeHtml(title)}
            </h3>

            <p>
                ${escapeHtml(description)}
            </p>

        </button>
    `;
}


// ------------------------------------------------------------
// OPEN SECTION
// ------------------------------------------------------------

async function openSection(section) {

    if (!section) {
        return;
    }

    const info = sectionNames[section];

    if (info) {
        sectionLabel.textContent = info.label;
        sectionTitle.textContent = info.title;
    }

    // Overview
    if (section === "overview") {
        renderOverview(window.nemawashiUser);
        return;
    }

    // People
    if (section === "people") {
        await renderPeople();
        return;
    }

    // Everything else for now
    renderPlaceholder(section);
}


// ------------------------------------------------------------
// PLACEHOLDER
// ------------------------------------------------------------

function renderPlaceholder(section) {

    const info =
        sectionNames[section] || {
            label: "NEMAWASHI",
            title: section
        };

    sectionLabel.textContent = info.label;
    sectionTitle.textContent = info.title;

    dashboardContent.innerHTML = `
        <div class="dashboard-placeholder">

            <div class="placeholder-icon">
                ✦
            </div>

            <h2>
                ${escapeHtml(info.title)}
            </h2>

            <p>
                This Nemawashi module is currently being built.
            </p>

        </div>
    `;
}


// ============================================================
// PEOPLE
// ============================================================

let nemawashiPeople = [];


// ------------------------------------------------------------
// RENDER PEOPLE
// ------------------------------------------------------------

async function renderPeople() {

    sectionLabel.textContent = "HRMNX";
    sectionTitle.textContent = "People";

    dashboardContent.innerHTML = `
        <div class="people-header">

            <div>
                <span class="eyebrow">
                    HRMNX
                </span>

                <h2>
                    People
                </h2>

                <p>
                    Manage Hrmnx employees and their organization access.
                </p>
            </div>

            <button
                class="primary-button"
                id="add-person-button"
                type="button"
            >
                + Add person
            </button>

        </div>


        <div class="people-toolbar">

            <input
                type="search"
                id="people-search"
                class="people-search"
                placeholder="Search people..."
                autocomplete="off"
            />

            <div
                id="people-count"
                class="people-count"
            >
                Loading...
            </div>

        </div>


        <div
            id="people-list"
            class="people-list"
        >
            <div class="people-loading">
                Loading people...
            </div>
        </div>
    `;

    const searchInput =
        document.getElementById("people-search");

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {
                filterPeople(this.value);
            }
        );
    }

    await loadPeople();
}


// ------------------------------------------------------------
// LOAD PEOPLE
// ------------------------------------------------------------

async function loadPeople() {

    const list =
        document.getElementById("people-list");

    if (!list) {
        return;
    }

    list.innerHTML = `
        <div class="people-loading">
            Loading people...
        </div>
    `;

    try {

        // ----------------------------------------------------
        // LOAD EMPLOYEES
        // ----------------------------------------------------

        const {
            data: employees,
            error: employeesError
        } = await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                employee_number,
                job_title,
                active,
                company_id,
                created_at
            `)
            .order("created_at", {
                ascending: false
            });

        if (employeesError) {
            console.error(
                "Employees error:",
                employeesError
            );

            throw employeesError;
        }


        if (!employees || employees.length === 0) {

            nemawashiPeople = [];

            renderPeopleList();
            updatePeopleCount();

            return;
        }


        // ----------------------------------------------------
        // LOAD PROFILES SEPARATELY
        // ----------------------------------------------------

        const userIds = employees
            .map(employee => employee.user_id)
            .filter(Boolean);

        let profiles = [];

        if (userIds.length > 0) {

            const {
                data: profileData,
                error: profilesError
            } = await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name,
                    avatar_url,
                    bio,
                    is_staff,
                    profile_type
                `)
                .in("id", userIds);

            if (profilesError) {

                console.error(
                    "Profiles error:",
                    profilesError
                );

                throw profilesError;
            }

            profiles = profileData || [];
        }


        // ----------------------------------------------------
        // PROFILE LOOKUP
        // ----------------------------------------------------

        const profileMap = {};

        profiles.forEach(profile => {

            profileMap[profile.id] = profile;

        });


        // ----------------------------------------------------
        // LOAD COMPANIES SEPARATELY
        // ----------------------------------------------------

        const companyIds = employees
            .map(employee => employee.company_id)
            .filter(Boolean);

        let companies = [];

        if (companyIds.length > 0) {

            const {
                data: companyData,
                error: companiesError
            } = await supabaseClient
                .from("companies")
                .select(`
                    id,
                    name,
                    slug
                `)
                .in("id", companyIds);

            if (companiesError) {

                console.error(
                    "Companies error:",
                    companiesError
                );

                throw companiesError;
            }

            companies = companyData || [];
        }


        // ----------------------------------------------------
        // COMPANY LOOKUP
        // ----------------------------------------------------

        const companyMap = {};

        companies.forEach(company => {

            companyMap[company.id] = company;

        });


        // ----------------------------------------------------
        // COMBINE DATA
        // ----------------------------------------------------

        nemawashiPeople =
            employees.map(employee => {

                return {
                    ...employee,

                    profiles:
                        profileMap[employee.user_id] || null,

                    companies:
                        companyMap[employee.company_id] || null
                };

            });


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        renderPeopleList();
        updatePeopleCount();

    } catch (error) {

        console.error(
            "Could not load people:",
            error
        );

        list.innerHTML = `
            <div class="people-error">

                <strong>
                    Could not load people
                </strong>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "An unknown error occurred."
                    )}
                </p>

            </div>
        `;
    }
}


// ------------------------------------------------------------
// RENDER PEOPLE LIST
// ------------------------------------------------------------

function renderPeopleList(
    people = nemawashiPeople
) {

    const list =
        document.getElementById("people-list");

    if (!list) {
        return;
    }


    if (!people || people.length === 0) {

        list.innerHTML = `
            <div class="people-empty">

                <div class="empty-icon">
                    ♡
                </div>

                <h3>
                    No people found
                </h3>

                <p>
                    No employees match your search.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML = people
        .map(person => {

            const profile =
                person.profiles || {};

            const company =
                person.companies || {};

            const displayName =
                profile.display_name ||
                profile.username ||
                "Unnamed person";

            const username =
                profile.username
                    ? `@${profile.username}`
                    : "";

            const jobTitle =
                person.job_title ||
                "No job title";

            const companyName =
                company.name ||
                "No company assigned";

            const employeeNumber =
                person.employee_number ||
                "No employee number";

            const avatar =
                profile.avatar_url;

            const initial =
                (
                    displayName
                        .trim()
                        .charAt(0) ||
                    "?"
                ).toUpperCase();


            return `
                <button
                    class="person-card"
                    type="button"
                    data-person-id="${escapeAttribute(
                        person.id
                    )}"
                >

                    <div class="person-avatar">

                        ${
                            avatar
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            avatar
                                        )}"
                                        alt=""
                                    >
                                `
                                : `
                                    <span>
                                        ${escapeHtml(initial)}
                                    </span>
                                `
                        }

                    </div>


                    <div class="person-info">

                        <div class="person-name-row">

                            <h3>
                                ${escapeHtml(
                                    displayName
                                )}
                            </h3>

                            ${
                                person.active
                                    ? `
                                        <span class="person-status active">
                                            Active
                                        </span>
                                    `
                                    : `
                                        <span class="person-status inactive">
                                            Inactive
                                        </span>
                                    `
                            }

                        </div>


                        ${
                            username
                                ? `
                                    <div class="person-username">
                                        ${escapeHtml(username)}
                                    </div>
                                `
                                : ""
                        }


                        <div class="person-meta">

                            <span>
                                ${escapeHtml(jobTitle)}
                            </span>

                            <span>
                                ${escapeHtml(companyName)}
                            </span>

                            <span>
                                ${escapeHtml(employeeNumber)}
                            </span>

                        </div>

                    </div>


                    <div class="person-arrow">
                        →
                    </div>

                </button>
            `;

        })
        .join("");
}


// ------------------------------------------------------------
// FILTER PEOPLE
// ------------------------------------------------------------

function filterPeople(searchTerm) {

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();

    if (!term) {

        renderPeopleList(
            nemawashiPeople
        );

        updatePeopleCount(
            nemawashiPeople.length
        );

        return;
    }


    const filtered =
        nemawashiPeople.filter(person => {

            const profile =
                person.profiles || {};

            const company =
                person.companies || {};

            const values = [

                profile.display_name,

                profile.username,

                profile.bio,

                person.employee_number,

                person.job_title,

                company.name,

                company.slug

            ];


            return values.some(value =>

                String(value || "")
                    .toLowerCase()
                    .includes(term)

            );

        });


    renderPeopleList(filtered);

    updatePeopleCount(
        filtered.length,
        true
    );
}


// ------------------------------------------------------------
// UPDATE PEOPLE COUNT
// ------------------------------------------------------------

function updatePeopleCount(
    count = nemawashiPeople.length,
    filtered = false
) {

    const element =
        document.getElementById(
            "people-count"
        );

    if (!element) {
        return;
    }


    if (filtered) {

        element.textContent =
            `${count} result${count === 1 ? "" : "s"}`;

        return;
    }


    element.textContent =
        `${count} ${count === 1 ? "person" : "people"}`;
}


// ------------------------------------------------------------
// OPEN PERSON
// ------------------------------------------------------------

async function openPerson(personId) {

    const person =
        nemawashiPeople.find(
            item =>
                String(item.id) ===
                String(personId)
        );

    if (!person) {
        return;
    }


    const profile =
        person.profiles || {};

    const company =
        person.companies || {};


    sectionLabel.textContent =
        "HRMNX";

    sectionTitle.textContent =
        profile.display_name ||
        "Person";


    dashboardContent.innerHTML = `
        <div class="person-detail">

            <button
                type="button"
                class="back-button"
                id="people-back-button"
            >
                ← Back to People
            </button>


            <div class="person-detail-header">

                <div class="person-detail-avatar">

                    ${
                        profile.avatar_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        profile.avatar_url
                                    )}"
                                    alt=""
                                >
                            `
                            : `
                                <span>
                                    ${escapeHtml(
                                        (
                                            profile.display_name ||
                                            "?"
                                        )
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                </span>
                            `
                    }

                </div>


                <div>

                    <span class="eyebrow">
                        EMPLOYEE
                    </span>

                    <h2>
                        ${escapeHtml(
                            profile.display_name ||
                            "Unnamed person"
                        )}
                    </h2>

                    ${
                        profile.username
                            ? `
                                <p>
                                    @${escapeHtml(
                                        profile.username
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="person-detail-grid">

                <div class="detail-card">

                    <span>
                        Employee number
                    </span>

                    <strong>
                        ${escapeHtml(
                            person.employee_number ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-card">

                    <span>
                        Job title
                    </span>

                    <strong>
                        ${escapeHtml(
                            person.job_title ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-card">

                    <span>
                        Company
                    </span>

                    <strong>
                        ${escapeHtml(
                            company.name ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-card">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${
                            person.active
                                ? "Active"
                                : "Inactive"
                        }
                    </strong>

                </div>

            </div>


            <div
                id="person-roles-section"
                class="person-detail-section"
            >
                <h3>
                    Roles
                </h3>

                <div>
                    Loading roles...
                </div>
            </div>


            <div
                id="person-artists-section"
                class="person-detail-section"
            >
                <h3>
                    Artist assignments
                </h3>

                <div>
                    Loading artist assignments...
                </div>
            </div>

        </div>
    `;


    const backButton =
        document.getElementById(
            "people-back-button"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {
                renderPeople();
            }
        );

    }


    await loadPersonRoles(person.id);

    await loadPersonArtists(person.id);
}


// ------------------------------------------------------------
// LOAD PERSON ROLES
// ------------------------------------------------------------

async function loadPersonRoles(
    employeeId
) {

    const container =
        document.getElementById(
            "person-roles-section"
        );

    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("employee_roles")
            .select(`
                role_id,
                roles (
                    id,
                    name,
                    slug,
                    description
                )
            `)
            .eq(
                "employee_id",
                employeeId
            );


        if (error) {
            throw error;
        }


        const roles =
            data || [];


        if (roles.length === 0) {

            container.innerHTML = `
                <h3>
                    Roles
                </h3>

                <p>
                    No roles assigned.
                </p>
            `;

            return;
        }


        container.innerHTML = `
            <h3>
                Roles
            </h3>

            <div class="person-tags">

                ${roles.map(item => {

                    const role =
                        item.roles || {};

                    return `
                        <span class="person-tag">
                            ${escapeHtml(
                                role.name ||
                                role.slug ||
                                "Unknown role"
                            )}
                        </span>
                    `;

                }).join("")}

            </div>
        `;

    } catch (error) {

        console.error(
            "Could not load person roles:",
            error
        );

        container.innerHTML = `
            <h3>
                Roles
            </h3>

            <p>
                Could not load roles.
            </p>
        `;
    }
}


// ------------------------------------------------------------
// LOAD PERSON ARTISTS
// ------------------------------------------------------------

async function loadPersonArtists(
    employeeId
) {

    const container =
        document.getElementById(
            "person-artists-section"
        );

    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("employee_artists")
            .select(`
                artist_id,
                artists (
                    id,
                    name,
                    slug,
                    avatar_url
                )
            `)
            .eq(
                "employee_id",
                employeeId
            );


        if (error) {
            throw error;
        }


        const artists =
            data || [];


        if (artists.length === 0) {

            container.innerHTML = `
                <h3>
                    Artist assignments
                </h3>

                <p>
                    No artists assigned.
                </p>
            `;

            return;
        }


        container.innerHTML = `
            <h3>
                Artist assignments
            </h3>

            <div class="person-tags">

                ${artists.map(item => {

                    const artist =
                        item.artists || {};

                    return `
                        <span class="person-tag">
                            ${escapeHtml(
                                artist.name ||
                                artist.slug ||
                                "Unknown artist"
                            )}
                        </span>
                    `;

                }).join("")}

            </div>
        `;

    } catch (error) {

        console.error(
            "Could not load person artists:",
            error
        );

        container.innerHTML = `
            <h3>
                Artist assignments
            </h3>

            <p>
                Could not load artist assignments.
            </p>
        `;
    }
}


// ============================================================
// GLOBAL NAVIGATION
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        // ----------------------------------------------------
        // SIDEBAR NAVIGATION
        // ----------------------------------------------------

        const navigation =
            event.target.closest(
                "[data-section]"
            );


        if (navigation) {

            document
                .querySelectorAll(".nav-item")
                .forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


            if (
                navigation.classList.contains(
                    "nav-item"
                )
            ) {

                navigation.classList.add(
                    "active"
                );

            }


            openSection(
                navigation.dataset.section
            );

            return;
        }


        // ----------------------------------------------------
        // DASHBOARD MODULE CARDS
        // ----------------------------------------------------

        const module =
            event.target.closest(
                "[data-module]"
            );


        if (module) {

            openSection(
                module.dataset.module
            );

            return;
        }


        // ----------------------------------------------------
        // PERSON CARD
        // ----------------------------------------------------

        const personCard =
            event.target.closest(
                "[data-person-id]"
            );


        if (
            personCard &&
            personCard.classList.contains(
                "person-card"
            )
        ) {

            openPerson(
                personCard.dataset.personId
            );

            return;
        }

    }
);


// ============================================================
// SIGN OUT
// ============================================================

if (signOutButton) {

    signOutButton.addEventListener(
        "click",
        async function () {

            try {

                await supabaseClient.auth.signOut();

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Sign out error:",
                    error
                );

            }

        }
    );

}


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

async function initializeDashboard() {

    const user =
        await requireUser();


    if (!user) {
        return;
    }


    window.nemawashiUser =
        user;


    // --------------------------------------------------------
    // ACCOUNT UI
    // --------------------------------------------------------

    if (userName) {

        userName.textContent =
            user.email ||
            "Nemawashi user";

    }


    if (userRole) {

        userRole.textContent =
            "Hrmnx account";

    }


    if (userAvatarLetter) {

        userAvatarLetter.textContent =
            (
                user.email ||
                "U"
            )
            .charAt(0)
            .toUpperCase();

    }


    // --------------------------------------------------------
    // INITIAL SECTION
    // --------------------------------------------------------

    renderOverview(user);

}


// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHtml(value);
}


// ============================================================
// START
// ============================================================

initializeDashboard();
