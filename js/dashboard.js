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
    },

    "song-demos": {
        label: "SONG DEMO STUDIO",
        title: "Demo Library"
    },

    "song-demo-create": {
        label: "SONG DEMO STUDIO",
        title: "Create Demo"
    },

    "song-demo-polls": {
        label: "SONG DEMO STUDIO",
        title: "Demo Polls"
    },

    "song-demo-reviews": {
        label: "SONG DEMO STUDIO",
        title: "Poll Reviews"
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

    // Song Demo Studio
    if (section === "song-demos") {
        await renderSongDemoLibrary();
        return;
    }

    if (section === "song-demo-create") {
        renderSongDemoCreate();
        return;
    }

    if (section === "song-demo-polls") {
        renderSongDemoPolls();
        return;
    }

    if (section === "song-demo-reviews") {
        renderSongDemoReviews();
        return;
    }
    

    // Organization
    if (section === "organization") {
        await renderOrganization();
        return;
    }


    // Permissions
    if (section === "permissions") {
        await renderPermissions();
        return;
    }


    // Serashio Notices
    if (section === "notices") {
        await renderSerashioNotices();
        return;
    }

    // Serashio Banners
    if (section === "banners") {
        await renderSerashioBanners();
        return;
    }

    // Serashio Artists
    if (section === "artists") {
        await renderSerashioArtists();
        return;
    }

    // Everything else
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


                <div class="person-detail-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        id="edit-person-button"
                    >
                        Edit employee
                    </button>

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
                id="person-edit-section"
                class="person-detail-section"
                style="display:none;"
            ></div>


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


    const editButton =
        document.getElementById(
            "edit-person-button"
        );

    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {
                openPersonEditor(person);
            }
        );

    }


    await loadPersonRoles(person.id);

    await loadPersonArtists(person.id);
}

// ------------------------------------------------------------
// OPEN PERSON EDITOR
// ------------------------------------------------------------

async function openPersonEditor(person) {

    const container =
        document.getElementById(
            "person-edit-section"
        );

    if (!container) {
        return;
    }


    container.style.display = "block";

    container.innerHTML = `
        <h3>
            Edit employee
        </h3>

        <form
            id="person-edit-form"
            class="person-edit-form"
        >

            <div class="person-edit-field">

                <label for="edit-employee-number">
                    Employee number
                </label>

                <input
                    id="edit-employee-number"
                    type="text"
                    value="${escapeAttribute(
                        person.employee_number || ""
                    )}"
                    autocomplete="off"
                >

            </div>


            <div class="person-edit-field">

                <label for="edit-job-title">
                    Job title
                </label>

                <input
                    id="edit-job-title"
                    type="text"
                    value="${escapeAttribute(
                        person.job_title || ""
                    )}"
                    autocomplete="off"
                >

            </div>


            <div class="person-edit-field">

                <label for="edit-company">
                    Company
                </label>

                <select
                    id="edit-company"
                >

                    <option value="">
                        No company assigned
                    </option>

                </select>

            </div>


            <label class="person-edit-checkbox">

                <input
                    id="edit-active"
                    type="checkbox"
                    ${
                        person.active
                            ? "checked"
                            : ""
                    }
                >

                <span>
                    Employee is active
                </span>

            </label>


            <div
                id="person-edit-message"
                class="person-edit-message"
                style="display:none;"
            ></div>


            <div class="person-edit-actions">

                <button
                    type="button"
                    class="secondary-button"
                    id="cancel-person-edit"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="person-save-button"
                    id="save-person-button"
                >
                    Save changes
                </button>

            </div>

        </form>
    `;


    await loadEditCompanies(
        person.company_id
    );


    const form =
        document.getElementById(
            "person-edit-form"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            await savePersonChanges(
                person.id
            );

        }
    );


    const cancelButton =
        document.getElementById(
            "cancel-person-edit"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                container.style.display =
                    "none";

                container.innerHTML = "";

            }
        );

    }
}

// ------------------------------------------------------------
// LOAD COMPANIES FOR EDITOR
// ------------------------------------------------------------

async function loadEditCompanies(
    selectedCompanyId
) {

    const select =
        document.getElementById(
            "edit-company"
        );

    if (!select) {
        return;
    }


    try {

        const {
            data: companies,
            error
        } = await supabaseClient
            .from("companies")
            .select(`
                id,
                name,
                slug
            `)
            .order("name", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        const companyList =
            companies || [];


        select.innerHTML = `
            <option value="">
                No company assigned
            </option>

            ${
                companyList.map(company => `
                    <option
                        value="${escapeAttribute(
                            company.id
                        )}"
                        ${
                            String(company.id) ===
                            String(selectedCompanyId)
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            company.name ||
                            company.slug ||
                            "Unnamed company"
                        )}
                    </option>
                `).join("")
            }
        `;

    } catch (error) {

        console.error(
            "Could not load companies:",
            error
        );

        select.innerHTML = `
            <option value="">
                Could not load companies
            </option>
        `;

    }
}

// ------------------------------------------------------------
// SAVE PERSON CHANGES
// ------------------------------------------------------------

async function savePersonChanges(
    employeeId
) {

    const employeeNumberInput =
        document.getElementById(
            "edit-employee-number"
        );

    const jobTitleInput =
        document.getElementById(
            "edit-job-title"
        );

    const companySelect =
        document.getElementById(
            "edit-company"
        );

    const activeInput =
        document.getElementById(
            "edit-active"
        );

    const saveButton =
        document.getElementById(
            "save-person-button"
        );

    const message =
        document.getElementById(
            "person-edit-message"
        );


    if (
        !employeeNumberInput ||
        !jobTitleInput ||
        !companySelect ||
        !activeInput ||
        !saveButton
    ) {
        return;
    }


    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    if (message) {

        message.style.display =
            "none";

        message.className =
            "person-edit-message";

    }


    try {

        const employeeNumber =
            employeeNumberInput.value.trim();

        const jobTitle =
            jobTitleInput.value.trim();

        const companyValue =
            companySelect.value;

        const active =
            activeInput.checked;


        const updates = {

            employee_number:
                employeeNumber || null,

            job_title:
                jobTitle || null,

            company_id:
                companyValue
                    ? companyValue
                    : null,

            active

        };


        const {
            data,
            error
        } = await supabaseClient
            .from("employees")
            .update(updates)
            .eq("id", employeeId)
            .select(`
                id,
                user_id,
                employee_number,
                job_title,
                active,
                company_id,
                created_at
            `)
            .single();


        if (error) {
            throw error;
        }


        // ----------------------------------------------------
        // UPDATE LOCAL DATA
        // ----------------------------------------------------

        const personIndex =
            nemawashiPeople.findIndex(
                person =>
                    String(person.id) ===
                    String(employeeId)
            );


        if (personIndex !== -1) {

            const updatedPerson =
                nemawashiPeople[
                    personIndex
                ];


            updatedPerson.employee_number =
                data.employee_number;

            updatedPerson.job_title =
                data.job_title;

            updatedPerson.active =
                data.active;

            updatedPerson.company_id =
                data.company_id;


            const selectedCompany =
                (
                    await supabaseClient
                        .from("companies")
                        .select(`
                            id,
                            name,
                            slug
                        `)
                        .eq(
                            "id",
                            data.company_id
                        )
                        .maybeSingle()
                ).data;


            updatedPerson.companies =
                selectedCompany || null;

        }


        if (message) {

            message.style.display =
                "block";

            message.className =
                "person-edit-message success";

            message.textContent =
                "Changes saved.";

        }


        saveButton.textContent =
            "Saved";


        // ----------------------------------------------------
        // REFRESH DETAIL VIEW
        // ----------------------------------------------------

        setTimeout(
            function () {

                openPerson(
                    employeeId
                );

            },
            500
        );

    } catch (error) {

        console.error(
            "Could not save employee:",
            error
        );


        if (message) {

            message.style.display =
                "block";

            message.className =
                "person-edit-message error";

            message.textContent =
                error.message ||
                "Could not save changes.";

        }


        saveButton.disabled =
            false;

        saveButton.textContent =
            "Save changes";

    }
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
// ORGANIZATION
// ============================================================

let nemawashiCompanies = [];


// ------------------------------------------------------------
// RENDER ORGANIZATION
// ------------------------------------------------------------

async function renderOrganization() {

    sectionLabel.textContent = "HRMNX";
    sectionTitle.textContent = "Organization";

    dashboardContent.innerHTML = `
        <div class="organization-header">

            <div>
                <span class="eyebrow">
                    HRMNX
                </span>

                <h2>
                    Organization
                </h2>

                <p>
                    Manage companies and subsidiaries
                    within Hrmnx Entertainment.
                </p>
            </div>

        </div>


        <div class="organization-toolbar">

            <input
                type="search"
                id="organization-search"
                class="organization-search"
                placeholder="Search companies..."
                autocomplete="off"
            />

            <div
                id="organization-count"
                class="organization-count"
            >
                Loading...
            </div>

        </div>


        <div
            id="organization-list"
            class="organization-list"
        >
            <div class="organization-loading">
                Loading companies...
            </div>
        </div>
    `;


    const searchInput =
        document.getElementById(
            "organization-search"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterCompanies(
                    this.value
                );

            }
        );

    }


    await loadCompanies();
}


// ------------------------------------------------------------
// LOAD COMPANIES
// ------------------------------------------------------------

async function loadCompanies() {

    const list =
        document.getElementById(
            "organization-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="organization-loading">
            Loading companies...
        </div>
    `;


    try {

        const {
            data: companies,
            error
        } = await supabaseClient
            .from("companies")
            .select(`
                id,
                name,
                slug
            `)
            .order("name", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        const companyList =
            companies || [];


        // ----------------------------------------------------
        // LOAD EMPLOYEES
        // ----------------------------------------------------

        const companyIds =
            companyList
                .map(company => company.id);


        let employees = [];


        if (companyIds.length > 0) {

            const {
                data: employeeData,
                error: employeeError
            } = await supabaseClient
                .from("employees")
                .select(`
                    id,
                    company_id,
                    user_id,
                    job_title,
                    active
                `)
                .in(
                    "company_id",
                    companyIds
                );


            if (employeeError) {
                throw employeeError;
            }


            employees =
                employeeData || [];

        }


        // ----------------------------------------------------
        // EMPLOYEE COUNTS
        // ----------------------------------------------------

        const employeeCounts = {};


        companyIds.forEach(
            companyId => {

                employeeCounts[
                    companyId
                ] = 0;

            }
        );


        employees.forEach(
            employee => {

                if (
                    employee.company_id &&
                    employeeCounts[
                        employee.company_id
                    ] !== undefined
                ) {

                    employeeCounts[
                        employee.company_id
                    ]++;

                }

            }
        );


        nemawashiCompanies =
            companyList.map(
                company => ({

                    ...company,

                    employee_count:
                        employeeCounts[
                            company.id
                        ] || 0

                })
            );


        renderCompanyList();

        updateCompanyCount();

    } catch (error) {

        console.error(
            "Could not load companies:",
            error
        );


        list.innerHTML = `
            <div class="organization-error">

                <strong>
                    Could not load organization
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
// RENDER COMPANY LIST
// ------------------------------------------------------------

function renderCompanyList(
    companies = nemawashiCompanies
) {

    const list =
        document.getElementById(
            "organization-list"
        );


    if (!list) {
        return;
    }


    if (
        !companies ||
        companies.length === 0
    ) {

        list.innerHTML = `
            <div class="organization-empty">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    No companies found
                </h3>

                <p>
                    No companies match your search.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        companies.map(
            company => {

                return `
                    <button
                        type="button"
                        class="company-card"
                        data-company-id="${escapeAttribute(
                            company.id
                        )}"
                    >

                        <div class="company-icon">
                            ${escapeHtml(
                                (
                                    company.name ||
                                    "?"
                                )
                                .trim()
                                .charAt(0)
                                .toUpperCase()
                            )}
                        </div>


                        <div class="company-info">

                            <div class="company-name">
                                ${escapeHtml(
                                    company.name ||
                                    "Unnamed company"
                                )}
                            </div>

                            <div class="company-slug">
                                ${company.slug
                                    ? escapeHtml(
                                        company.slug
                                    )
                                    : "No slug"
                                }
                            </div>

                        </div>


                        <div class="company-members">

                            <strong>
                                ${company.employee_count}
                            </strong>

                            <span>
                                ${
                                    company.employee_count === 1
                                        ? "employee"
                                        : "employees"
                                }
                            </span>

                        </div>


                        <div class="company-arrow">
                            →
                        </div>

                    </button>
                `;

            }
        ).join("");
}


// ------------------------------------------------------------
// FILTER COMPANIES
// ------------------------------------------------------------

function filterCompanies(
    searchTerm
) {

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();


    if (!term) {

        renderCompanyList(
            nemawashiCompanies
        );

        updateCompanyCount(
            nemawashiCompanies.length
        );

        return;
    }


    const filtered =
        nemawashiCompanies.filter(
            company => {

                return [

                    company.name,

                    company.slug

                ].some(value =>

                    String(value || "")
                        .toLowerCase()
                        .includes(term)

                );

            }
        );


    renderCompanyList(
        filtered
    );


    updateCompanyCount(
        filtered.length,
        true
    );
}


// ------------------------------------------------------------
// UPDATE COMPANY COUNT
// ------------------------------------------------------------

function updateCompanyCount(
    count = nemawashiCompanies.length,
    filtered = false
) {

    const element =
        document.getElementById(
            "organization-count"
        );


    if (!element) {
        return;
    }


    if (filtered) {

        element.textContent =
            `${count} result${
                count === 1
                    ? ""
                    : "s"
            }`;

        return;
    }


    element.textContent =
        `${count} ${
            count === 1
                ? "company"
                : "companies"
        }`;
}


// ------------------------------------------------------------
// OPEN COMPANY
// ------------------------------------------------------------

async function openCompany(
    companyId
) {

    const company =
        nemawashiCompanies.find(
            item =>
                String(item.id) ===
                String(companyId)
        );


    if (!company) {
        return;
    }


    sectionLabel.textContent =
        "HRMNX";

    sectionTitle.textContent =
        company.name ||
        "Company";


    dashboardContent.innerHTML = `
        <div class="company-detail">

            <button
                type="button"
                class="back-button"
                id="organization-back-button"
            >
                ← Back to Organization
            </button>


            <div class="company-detail-header">

                <div class="company-detail-icon">
                    ${escapeHtml(
                        (
                            company.name ||
                            "?"
                        )
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                    )}
                </div>


                <div>

                    <span class="eyebrow">
                        COMPANY
                    </span>

                    <h2>
                        ${escapeHtml(
                            company.name ||
                            "Unnamed company"
                        )}
                    </h2>

                    ${
                        company.slug
                            ? `
                                <p>
                                    ${escapeHtml(
                                        company.slug
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="company-detail-grid">

                <div class="detail-card">

                    <span>
                        Employees
                    </span>

                    <strong>
                        ${company.employee_count}
                    </strong>

                </div>


                <div class="detail-card">

                    <span>
                        Company slug
                    </span>

                    <strong>
                        ${escapeHtml(
                            company.slug ||
                            "—"
                        )}
                    </strong>

                </div>

            </div>


            <div
                id="company-employees-section"
                class="person-detail-section"
            >

                <h3>
                    Employees
                </h3>

                <div>
                    Loading employees...
                </div>

            </div>

        </div>
    `;


    const backButton =
        document.getElementById(
            "organization-back-button"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                renderOrganization();

            }
        );

    }


    await loadCompanyEmployees(
        company.id
    );
}


// ------------------------------------------------------------
// LOAD COMPANY EMPLOYEES
// ------------------------------------------------------------

async function loadCompanyEmployees(
    companyId
) {

    const container =
        document.getElementById(
            "company-employees-section"
        );


    if (!container) {
        return;
    }


    try {

        const {
            data: employees,
            error
        } = await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                employee_number,
                job_title,
                active
            `)
            .eq(
                "company_id",
                companyId
            )
            .order("created_at", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        const employeeList =
            employees || [];


        if (
            employeeList.length === 0
        ) {

            container.innerHTML = `
                <h3>
                    Employees
                </h3>

                <p>
                    No employees are assigned
                    to this company.
                </p>
            `;

            return;
        }


        // ----------------------------------------------------
        // LOAD PROFILES
        // ----------------------------------------------------

        const userIds =
            employeeList
                .map(employee =>
                    employee.user_id
                )
                .filter(Boolean);


        let profiles = [];


        if (userIds.length > 0) {

            const {
                data: profileData,
                error: profileError
            } = await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name,
                    avatar_url
                `)
                .in(
                    "id",
                    userIds
                );


            if (profileError) {
                throw profileError;
            }


            profiles =
                profileData || [];

        }


        const profileMap = {};


        profiles.forEach(
            profile => {

                profileMap[
                    profile.id
                ] = profile;

            }
        );


        container.innerHTML = `
            <h3>
                Employees
            </h3>

            <div class="company-employee-list">

                ${
                    employeeList.map(
                        employee => {

                            const profile =
                                profileMap[
                                    employee.user_id
                                ] || {};

                            const name =
                                profile.display_name ||
                                profile.username ||
                                "Unnamed person";

                            const initial =
                                name
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase();


                            return `
                                <button
                                    type="button"
                                    class="company-employee-card"
                                    data-person-id="${escapeAttribute(
                                        employee.id
                                    )}"
                                >

                                    <div class="person-avatar">

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
                                                            initial
                                                        )}
                                                    </span>
                                                `
                                        }

                                    </div>


                                    <div class="company-employee-info">

                                        <strong>
                                            ${escapeHtml(
                                                name
                                            )}
                                        </strong>

                                        ${
                                            profile.username
                                                ? `
                                                    <span>
                                                        @${escapeHtml(
                                                            profile.username
                                                        )}
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </div>


                                    <div class="company-employee-job">

                                        ${
                                            employee.job_title
                                                ? escapeHtml(
                                                    employee.job_title
                                                )
                                                : "No job title"
                                        }

                                    </div>


                                    <span
                                        class="person-status ${
                                            employee.active
                                                ? "active"
                                                : "inactive"
                                        }"
                                    >
                                        ${
                                            employee.active
                                                ? "Active"
                                                : "Inactive"
                                        }
                                    </span>


                                    <div class="person-arrow">
                                        →
                                    </div>

                                </button>
                            `;

                        }
                    ).join("")
                }

            </div>
        `;

    } catch (error) {

        console.error(
            "Could not load company employees:",
            error
        );


        container.innerHTML = `
            <h3>
                Employees
            </h3>

            <p>
                Could not load employees.
            </p>
        `;

    }
}

// ============================================================
// PERMISSIONS
// ============================================================

let nemawashiRoles = [];


// ------------------------------------------------------------
// RENDER PERMISSIONS
// ------------------------------------------------------------

async function renderPermissions() {

    sectionLabel.textContent = "HRMNX";
    sectionTitle.textContent = "Permissions";

    dashboardContent.innerHTML = `
        <div class="permissions-header">

            <div>
                <span class="eyebrow">
                    HRMNX
                </span>

                <h2>
                    Permissions
                </h2>

                <p>
                    Manage employee roles and access across Nemawashi.
                </p>
            </div>

        </div>


        <div class="permissions-toolbar">

            <input
                type="search"
                id="permissions-search"
                class="permissions-search"
                placeholder="Search roles..."
                autocomplete="off"
            />

            <div
                id="permissions-count"
                class="permissions-count"
            >
                Loading...
            </div>

        </div>


        <div
            id="permissions-list"
            class="permissions-list"
        >
            <div class="permissions-loading">
                Loading roles...
            </div>
        </div>
    `;


    const searchInput =
        document.getElementById(
            "permissions-search"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterRoles(
                    this.value
                );

            }
        );

    }


    await loadRoles();
}


// ------------------------------------------------------------
// LOAD ROLES
// ------------------------------------------------------------

async function loadRoles() {

    const list =
        document.getElementById(
            "permissions-list"
        );


    if (!list) {
        return;
    }


    try {

        const {
            data: roles,
            error
        } = await supabaseClient
            .from("roles")
            .select(`
                id,
                name,
                slug,
                description
            `)
            .order("name", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        const roleList =
            roles || [];


        const roleIds =
            roleList.map(
                role => role.id
            );


        let assignments = [];


        if (roleIds.length > 0) {

            const {
                data,
                error: assignmentError
            } = await supabaseClient
                .from("employee_roles")
                .select(`
                    role_id,
                    employee_id
                `)
                .in(
                    "role_id",
                    roleIds
                );


            if (assignmentError) {
                throw assignmentError;
            }


            assignments =
                data || [];

        }


        const assignmentCounts = {};


        roleIds.forEach(
            roleId => {

                assignmentCounts[
                    roleId
                ] = 0;

            }
        );


        assignments.forEach(
            assignment => {

                if (
                    assignmentCounts[
                        assignment.role_id
                    ] !== undefined
                ) {

                    assignmentCounts[
                        assignment.role_id
                    ]++;

                }

            }
        );


        nemawashiRoles =
            roleList.map(
                role => ({

                    ...role,

                    employee_count:
                        assignmentCounts[
                            role.id
                        ] || 0

                })
            );


        renderRoleList();

        updateRoleCount();

    } catch (error) {

        console.error(
            "Could not load roles:",
            error
        );


        list.innerHTML = `
            <div class="permissions-error">

                <strong>
                    Could not load roles
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
// RENDER ROLE LIST
// ------------------------------------------------------------

function renderRoleList(
    roles = nemawashiRoles
) {

    const list =
        document.getElementById(
            "permissions-list"
        );


    if (!list) {
        return;
    }


    if (!roles.length) {

        list.innerHTML = `
            <div class="permissions-empty">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    No roles found
                </h3>

                <p>
                    No roles match your search.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        roles.map(
            role => {

                return `
                    <button
                        type="button"
                        class="role-card"
                        data-role-id="${escapeAttribute(
                            role.id
                        )}"
                    >

                        <div class="role-icon">
                            #
                        </div>


                        <div class="role-info">

                            <div class="role-name">
                                ${escapeHtml(
                                    role.name ||
                                    role.slug ||
                                    "Unnamed role"
                                )}
                            </div>

                            <div class="role-slug">
                                ${
                                    role.slug
                                        ? escapeHtml(
                                            role.slug
                                        )
                                        : "No slug"
                                }
                            </div>

                        </div>


                        <div class="role-description">

                            ${
                                role.description
                                    ? escapeHtml(
                                        role.description
                                    )
                                    : "No description"
                            }

                        </div>


                        <div class="role-members">

                            <strong>
                                ${role.employee_count}
                            </strong>

                            <span>
                                ${
                                    role.employee_count === 1
                                        ? "employee"
                                        : "employees"
                                }
                            </span>

                        </div>


                        <div class="role-arrow">
                            →
                        </div>

                    </button>
                `;

            }
        ).join("");
}


// ------------------------------------------------------------
// FILTER ROLES
// ------------------------------------------------------------

function filterRoles(
    searchTerm
) {

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();


    if (!term) {

        renderRoleList(
            nemawashiRoles
        );

        updateRoleCount();

        return;
    }


    const filtered =
        nemawashiRoles.filter(
            role => {

                return [

                    role.name,
                    role.slug,
                    role.description

                ].some(value =>

                    String(value || "")
                        .toLowerCase()
                        .includes(term)

                );

            }
        );


    renderRoleList(
        filtered
    );


    updateRoleCount(
        filtered.length,
        true
    );
}


// ------------------------------------------------------------
// ROLE COUNT
// ------------------------------------------------------------

function updateRoleCount(
    count = nemawashiRoles.length,
    filtered = false
) {

    const element =
        document.getElementById(
            "permissions-count"
        );


    if (!element) {
        return;
    }


    if (filtered) {

        element.textContent =
            `${count} result${
                count === 1
                    ? ""
                    : "s"
            }`;

        return;
    }


    element.textContent =
        `${count} ${
            count === 1
                ? "role"
                : "roles"
        }`;
}


// ------------------------------------------------------------
// OPEN ROLE
// ------------------------------------------------------------

async function openRole(
    roleId
) {

    const role =
        nemawashiRoles.find(
            item =>
                String(item.id) ===
                String(roleId)
        );


    if (!role) {
        return;
    }

    window.nemawashiCurrentRoleId = role.id;


    sectionLabel.textContent =
        "HRMNX";

    sectionTitle.textContent =
        role.name ||
        "Role";


    dashboardContent.innerHTML = `
        <div class="role-detail">

            <button
                type="button"
                class="back-button"
                id="permissions-back-button"
            >
                ← Back to Permissions
            </button>


            <div class="role-detail-header">

                <div class="role-detail-icon">
                    #
                </div>


                <div>

                    <span class="eyebrow">
                        ROLE
                    </span>

                    <h2>
                        ${escapeHtml(
                            role.name ||
                            "Unnamed role"
                        )}
                    </h2>

                    ${
                        role.slug
                            ? `
                                <p>
                                    ${escapeHtml(
                                        role.slug
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="role-detail-grid">

                <div class="detail-card">

                    <span>
                        Employees
                    </span>

                    <strong>
                        ${role.employee_count}
                    </strong>

                </div>


                <div class="detail-card">

                    <span>
                        Role slug
                    </span>

                    <strong>
                        ${escapeHtml(
                            role.slug ||
                            "—"
                        )}
                    </strong>

                </div>

            </div>


            ${
                role.description
                    ? `
                        <section class="detail-card">

                            <div class="detail-card-title">
                                Description
                            </div>

                            <p class="role-description-full">
                                ${escapeHtml(
                                    role.description
                                )}
                            </p>

                        </section>
                    `
                    : ""
            }


            <section
                id="role-employees-section"
                class="person-detail-section"
            >

                <h3>
                    Employees with this role
                </h3>

                <div>
                    Loading employees...
                </div>

            </section>


            <section
                id="role-assign-section"
                class="detail-card role-assign-card"
            >

                <div class="detail-card-title">
                    Assign role
                </div>

                <div class="role-assign-form">

                    <select
                        id="role-employee-select"
                        class="role-employee-select"
                    >
                        <option value="">
                            Loading employees...
                        </option>
                    </select>

                    <button
                        type="button"
                        id="assign-role-button"
                        class="person-save-button"
                        disabled
                    >
                        Assign role
                    </button>

                </div>

                <div
                    id="role-assign-message"
                    class="person-edit-message"
                    style="display:none;"
                ></div>

            </section>

        </div>
    `;


    document
        .getElementById(
            "permissions-back-button"
        )
        ?.addEventListener(
            "click",
            function () {

                renderPermissions();

            }
        );


    await loadRoleEmployees(
        role.id
    );

    await loadRoleEmployeeOptions(
        role.id
    );
}


// ------------------------------------------------------------
// LOAD EMPLOYEES WITH ROLE
// ------------------------------------------------------------

async function loadRoleEmployees(
    roleId
) {

    const container =
        document.getElementById(
            "role-employees-section"
        );


    if (!container) {
        return;
    }


    try {

        const {
            data: assignments,
            error
        } = await supabaseClient
            .from("employee_roles")
            .select(`
                employee_id
            `)
            .eq(
                "role_id",
                roleId
            );


        if (error) {
            throw error;
        }


        const employeeIds =
            (assignments || [])
                .map(
                    item =>
                        item.employee_id
                );


        if (!employeeIds.length) {

            container.innerHTML = `
                <h3>
                    Employees with this role
                </h3>

                <p>
                    No employees are assigned
                    to this role.
                </p>
            `;

            return;
        }


        const {
            data: employees,
            error: employeeError
        } = await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                job_title,
                active
            `)
            .in(
                "id",
                employeeIds
            );


        if (employeeError) {
            throw employeeError;
        }


        const userIds =
            (employees || [])
                .map(
                    employee =>
                        employee.user_id
                )
                .filter(Boolean);


        let profiles = [];


        if (userIds.length) {

            const {
                data,
                error: profileError
            } = await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name,
                    avatar_url
                `)
                .in(
                    "id",
                    userIds
                );


            if (profileError) {
                throw profileError;
            }


            profiles =
                data || [];

        }


        const profileMap = {};


        profiles.forEach(
            profile => {

                profileMap[
                    profile.id
                ] = profile;

            }
        );


        container.innerHTML = `
            <h3>
                Employees with this role
            </h3>

            <div class="role-employee-list">

                ${
                    (employees || [])
                        .map(
                            employee => {

                                const profile =
                                    profileMap[
                                        employee.user_id
                                    ] || {};


                                const name =
                                    profile.display_name ||
                                    profile.username ||
                                    "Unnamed employee";


                                const initial =
                                    name
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase();


                                return `
                                    <div
                                        class="role-employee-card"
                                    >

                                        <div
                                            class="person-avatar"
                                        >

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
                                                                initial
                                                            )}
                                                        </span>
                                                    `
                                            }

                                        </div>


                                        <div
                                            class="role-employee-info"
                                        >

                                            <strong>
                                                ${escapeHtml(
                                                    name
                                                )}
                                            </strong>

                                            ${
                                                profile.username
                                                    ? `
                                                        <span>
                                                            @${escapeHtml(
                                                                profile.username
                                                            )}
                                                        </span>
                                                    `
                                                    : ""
                                            }

                                        </div>


                                        <div
                                            class="role-employee-job"
                                        >
                                            ${
                                                employee.job_title
                                                    ? escapeHtml(
                                                        employee.job_title
                                                    )
                                                    : "No job title"
                                            }
                                        </div>


                                        <span
                                            class="
                                                person-status
                                                ${
                                                    employee.active
                                                        ? "active"
                                                        : "inactive"
                                                }
                                            "
                                        >
                                            ${
                                                employee.active
                                                    ? "Active"
                                                    : "Inactive"
                                            }
                                        </span>


                                        <button
                                            type="button"
                                            class="role-remove-button"
                                            data-remove-role="${escapeAttribute(
                                                roleId
                                            )}"
                                            data-remove-employee="${escapeAttribute(
                                                employee.id
                                            )}"
                                        >
                                            Remove
                                        </button>

                                    </div>
                                `;

                            }
                        )
                        .join("")
                }

            </div>
        `;

    } catch (error) {

        console.error(
            "Could not load role employees:",
            error
        );


        container.innerHTML = `
            <h3>
                Employees with this role
            </h3>

            <p>
                Could not load employees.
            </p>
        `;

    }
}


// ------------------------------------------------------------
// LOAD EMPLOYEE OPTIONS
// ------------------------------------------------------------

async function loadRoleEmployeeOptions(
    roleId
) {

    const select =
        document.getElementById(
            "role-employee-select"
        );

    const button =
        document.getElementById(
            "assign-role-button"
        );


    if (!select) {
        return;
    }


    try {

        const {
            data: employees,
            error
        } = await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                active
            `)
            .eq(
                "active",
                true
            );


        if (error) {
            throw error;
        }


        const employeeList =
            employees || [];


        const {
            data: assignments,
            error: assignmentError
        } = await supabaseClient
            .from("employee_roles")
            .select(`
                employee_id
            `)
            .eq(
                "role_id",
                roleId
            );


        if (assignmentError) {
            throw assignmentError;
        }


        const alreadyAssigned =
            new Set(
                (assignments || [])
                    .map(
                        item =>
                            String(
                                item.employee_id
                            )
                    )
            );


        const available =
            employeeList.filter(
                employee =>
                    !alreadyAssigned.has(
                        String(employee.id)
                    )
            );


        const userIds =
            available
                .map(
                    employee =>
                        employee.user_id
                )
                .filter(Boolean);


        let profiles = [];


        if (userIds.length) {

            const {
                data,
                error: profileError
            } = await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name
                `)
                .in(
                    "id",
                    userIds
                );


            if (profileError) {
                throw profileError;
            }


            profiles =
                data || [];

        }


        const profileMap = {};


        profiles.forEach(
            profile => {

                profileMap[
                    profile.id
                ] = profile;

            }
        );


        select.innerHTML = `
            <option value="">
                Select an employee...
            </option>

            ${
                available
                    .map(
                        employee => {

                            const profile =
                                profileMap[
                                    employee.user_id
                                ] || {};


                            const name =
                                profile.display_name ||
                                profile.username ||
                                "Unnamed employee";


                            return `
                                <option
                                    value="${escapeAttribute(
                                        employee.id
                                    )}"
                                >
                                    ${escapeHtml(
                                        name
                                    )}
                                </option>
                            `;

                        }
                    )
                    .join("")
            }
        `;


        if (button) {

            button.disabled =
                available.length === 0;

        }


        select.addEventListener(
            "change",
            function () {

                if (button) {

                    button.disabled =
                        !this.value;

                }

            }
        );


        if (!available.length) {

            select.innerHTML = `
                <option value="">
                    All active employees already assigned
                </option>
            `;

        }

    } catch (error) {

        console.error(
            "Could not load role employees:",
            error
        );


        select.innerHTML = `
            <option value="">
                Could not load employees
            </option>
        `;

    }
}


// ------------------------------------------------------------
// ASSIGN EMPLOYEE TO ROLE
// ------------------------------------------------------------

async function assignEmployeeToRole(
    roleId,
    employeeId
) {

    const button =
        document.getElementById(
            "assign-role-button"
        );

    const message =
        document.getElementById(
            "role-assign-message"
        );


    if (!employeeId) {
        return;
    }


    button.disabled = true;


    try {

        const {
            error
        } = await supabaseClient
            .from("employee_roles")
            .insert({

                employee_id:
                    employeeId,

                role_id:
                    roleId

            });


        if (error) {
            throw error;
        }


        message.style.display =
            "block";

        message.className =
            "person-edit-message success";

        message.textContent =
            "Role assigned successfully.";


        await loadRoleEmployees(
            roleId
        );

        await loadRoleEmployeeOptions(
            roleId
        );

    } catch (error) {

        console.error(
            "Could not assign role:",
            error
        );


        message.style.display =
            "block";

        message.className =
            "person-edit-message error";

        message.textContent =
            error.message ||
            "Could not assign role.";


        button.disabled = false;

    }
}


// ------------------------------------------------------------
// REMOVE EMPLOYEE FROM ROLE
// ------------------------------------------------------------

async function removeEmployeeFromRole(
    roleId,
    employeeId
) {

    try {

        const {
            error
        } = await supabaseClient
            .from("employee_roles")
            .delete()
            .eq(
                "role_id",
                roleId
            )
            .eq(
                "employee_id",
                employeeId
            );


        if (error) {
            throw error;
        }


        await loadRoleEmployees(
            roleId
        );

        await loadRoleEmployeeOptions(
            roleId
        );

    } catch (error) {

        console.error(
            "Could not remove role:",
            error
        );

        alert(
            error.message ||
            "Could not remove role."
        );

    }
}

// ============================================================
// SONG DEMO STUDIO
// ============================================================

const songDemoSectionTemplates = [

    {
        type: "intro",
        number: null,
        title: "Intro"
    },

    {
        type: "verse",
        number: 1,
        title: "Verse 1"
    },

    {
        type: "pre_chorus",
        number: null,
        title: "Pre-Chorus"
    },

    {
        type: "chorus",
        number: null,
        title: "Chorus"
    },

    {
        type: "verse",
        number: 2,
        title: "Verse 2"
    },

    {
        type: "pre_chorus",
        number: null,
        title: "Pre-Chorus"
    },

    {
        type: "chorus",
        number: null,
        title: "Chorus"
    },

    {
        type: "bridge",
        number: null,
        title: "Bridge"
    },

    {
        type: "verse",
        number: 3,
        title: "Verse 3"
    },

    {
        type: "rap",
        number: null,
        title: "Rap"
    },

    {
        type: "breakdown",
        number: null,
        title: "Breakdown"
    },

    {
        type: "ending",
        number: null,
        title: "Ending"
    },

    {
        type: "outro",
        number: null,
        title: "Outro"
    }

];


let nemawashiSongDemoSections = [];

let nemawashiSongDemoPeople = [];
let nemawashiSongDemoArtists = [];
let nemawashiSongDemoSelectedArtistId = null;

let currentSongDemoEditId = null;
let currentSongBaseStructureDemoId = null;
let currentSongBaseAudioUrl = null;


// ------------------------------------------------------------
// CREATE PAGE
// ------------------------------------------------------------

function renderSongDemoCreate() {

    sectionLabel.textContent =
        "SONG DEMO STUDIO";

    sectionTitle.textContent =
        "Create Demo";

    dashboardContent.innerHTML = `

        <div class="song-demo-create">

            <div class="song-demo-create-header">

                <span class="eyebrow">
                    SONG DEMO STUDIO
                </span>

                <h2>
                    What do you want to start with?
                </h2>

                <p>
                    Build the lyrics and song structure first,
                    or start with the audio and production files.
                </p>

            </div>


            <div class="song-demo-start-grid">

                <button
                    type="button"
                    class="song-demo-start-card"
                    data-song-demo-start="lyrics"
                >

                    <div class="song-demo-start-icon">
                        ♫
                    </div>

                    <div>

                        <h3>
                            Add lyrics first
                        </h3>

                        <p>
                            Build the song structure, write lyrics,
                            enable sections and assign members.
                        </p>

                    </div>

                    <span class="song-demo-start-arrow">
                        →
                    </span>

                </button>


                <button
                    type="button"
                    class="song-demo-start-card"
                    data-song-demo-start="song"
                >

                    <div class="song-demo-start-icon">
                        ◉
                    </div>

                    <div>

                        <h3>
                            Add song base first
                        </h3>

                        <p>
                            Upload a short audio demo and,
                            optionally, your DAW project files.
                        </p>

                    </div>

                    <span class="song-demo-start-arrow">
                        →
                    </span>

                </button>

            </div>

        </div>

    `;
}


// ------------------------------------------------------------
// START LYRICS DEMO
// ------------------------------------------------------------

async function startLyricsDemo() {

    nemawashiSongDemoSelectedArtistId = null;

    nemawashiSongDemoSections =
        songDemoSectionTemplates.map(
            (section, index) => ({
                localId:
                    `section-${Date.now()}-${index}`,

                type: section.type,

                number: section.number,

                title: section.title,

                enabled: true,

                lyrics: "",

                members: []
            })
        );

    await loadSongDemoArtists();

    renderSongDemoLyricsWizard();
}


// ------------------------------------------------------------
// START SONG BASE DEMO
// ------------------------------------------------------------

async function startSongBaseDemo() {

    nemawashiSongDemoSelectedArtistId = null;
    nemawashiSongDemoSections = [];
    await loadSongDemoArtists();
    renderSongDemoSongBaseWizard();
}


// ------------------------------------------------------------
// LOAD ARTISTS FOR SONG DEMO ASSIGNMENT
// ------------------------------------------------------------

async function loadSongDemoArtists() {

    const { data, error } = await supabaseClient
        .from("artists")
        .select(`
            id,
            name,
            slug,
            avatar_url
        `)
        .order("name", { ascending: true });

    if (error) {
        console.error("Could not load Song Demo artists:", error);
        nemawashiSongDemoArtists = [];
        nemawashiSongDemoPeople = [];
        return;
    }

    nemawashiSongDemoArtists = data || [];

    if (nemawashiSongDemoSelectedArtistId) {
        await loadSongDemoPeople(
            nemawashiSongDemoSelectedArtistId
        );
    } else {
        nemawashiSongDemoPeople = [];
    }
}


// ------------------------------------------------------------
// LOAD ARTIST MEMBERS FOR MEMBER ASSIGNMENT
// ------------------------------------------------------------

async function loadSongDemoPeople(artistId) {

    if (!artistId) {
        nemawashiSongDemoPeople = [];
        return;
    }

    try {

        const { data: members, error } =
            await supabaseClient
                .from("artist_members")
                .select(`
                    id,
                    artist_id,
                    name,
                    stage_name,
                    avatar_url,
                    sort_order
                `)
                .eq("artist_id", artistId)
                .order("sort_order", { ascending: true })
                .order("name", { ascending: true });

        if (error) {
            throw error;
        }

        nemawashiSongDemoPeople =
            (members || []).map(member => ({
                artistMemberId: member.id,
                artistId: member.artist_id,
                displayName:
                    member.stage_name ||
                    member.name ||
                    "Unnamed member",
                username: "",
                avatarUrl: member.avatar_url || ""
            }));

    } catch (error) {

        console.error(
            "Could not load Song Demo artist members:",
            error
        );

        nemawashiSongDemoPeople = [];
    }
}


// ------------------------------------------------------------
// CHANGE SONG DEMO ARTIST
// ------------------------------------------------------------

async function changeSongDemoArtist(artistId) {

    syncSongDemoSectionInputs();

    nemawashiSongDemoSelectedArtistId =
        artistId || null;

    nemawashiSongDemoSections.forEach(section => {
        section.members = [];
    });

    await loadSongDemoPeople(
        nemawashiSongDemoSelectedArtistId
    );

    renderSongDemoSectionList();
}


// LYRICS WIZARD
// ------------------------------------------------------------

function renderSongDemoLyricsWizard() {

    sectionLabel.textContent =
        "SONG DEMO STUDIO";

    sectionTitle.textContent =
        "Lyrics-first demo";

    dashboardContent.innerHTML = `

        <div class="song-demo-wizard">

            <button
                type="button"
                class="back-button"
                data-song-demo-back="true"
            >
                ← Back
            </button>


            <div class="song-demo-wizard-header">

                <span class="eyebrow">
                    STEP 1 · LYRICS
                </span>

                <h2>
                    Build your song structure
                </h2>

                <p>
                    Choose the artist or group first, then enable the sections you need,
                    arrange them in order and add lyrics.
                </p>

            </div>


            <div class="song-demo-artist-selector">

                <label for="song-demo-artist-select">
                    Artist / Group
                </label>

                <select
                    id="song-demo-artist-select"
                    class="song-demo-artist-select"
                >
                    <option value="">
                        Select an artist or group...
                    </option>

                    ${nemawashiSongDemoArtists
                        .map(artist => `
                            <option
                                value="${escapeAttribute(artist.id)}"
                                ${
                                    String(artist.id) ===
                                    String(nemawashiSongDemoSelectedArtistId || "")
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(artist.name)}
                            </option>
                        `)
                        .join("")}
                </select>

                ${
                    nemawashiSongDemoSelectedArtistId
                        ? ""
                        : `
                            <span class="song-demo-artist-help">
                                Select the artist or group whose members will be assigned to sections.
                            </span>
                        `
                }

            </div>


            <div class="song-demo-wizard-toolbar">

                <button
                    type="button"
                    class="secondary-button"
                    data-song-demo-add-section="true"
                >
                    + Add section
                </button>

                <span class="song-demo-section-count">
                    ${nemawashiSongDemoSections.length}
                    sections
                </span>

            </div>


            <div
                id="song-demo-section-list"
                class="song-demo-section-list"
            ></div>


            <div class="song-demo-wizard-footer">

                <button
                    type="button"
                    class="secondary-button"
                    data-song-demo-back="true"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="person-save-button"
                    data-song-demo-save-lyrics="true"
                >
                    Save lyrics demo
                </button>

            </div>

        </div>

    `;

    renderSongDemoSectionList();

    document
        .getElementById("song-demo-artist-select")
        ?.addEventListener("change", event => {
            changeSongDemoArtist(event.target.value);
        });
}


// ------------------------------------------------------------
// RENDER SECTION LIST
// ------------------------------------------------------------

function renderSongDemoSectionList() {

    const container =
        document.getElementById(
            "song-demo-section-list"
        );

    if (!container) {
        return;
    }


    if (
        !nemawashiSongDemoSections.length
    ) {

        container.innerHTML = `

            <div class="song-demo-empty">
                No sections yet.
            </div>

        `;

        return;
    }


    container.innerHTML =
        nemawashiSongDemoSections
            .map((section, index) => {

                const memberOptions =
                    nemawashiSongDemoPeople
                        .map(person => `

                            <option
                                value="${escapeAttribute(
                                    person.artistMemberId
                                )}"
                            >
                                ${escapeHtml(
                                    person.displayName
                                )}
                                ${
                                    person.username
                                        ? ` · @${escapeHtml(
                                            person.username
                                        )}`
                                        : ""
                                }
                            </option>

                        `)
                        .join("");


                const selectedMembers =
                    section.members || [];


                return `

                    <div
                        class="song-demo-section-card
                        ${section.enabled ? "" : "disabled"}"
                        data-song-demo-section-id="${escapeAttribute(
                            section.localId
                        )}"
                    >

                        <div class="song-demo-section-top">

                            <div class="song-demo-section-number">
                                ${index + 1}
                            </div>


                            <div class="song-demo-section-heading">

                                <input
                                    type="text"
                                    class="song-demo-section-title"
                                    value="${escapeAttribute(
                                        section.title
                                    )}"
                                    data-section-title="${escapeAttribute(
                                        section.localId
                                    )}"
                                />

                                <span>
                                    ${escapeHtml(
                                        section.type
                                    )}
                                </span>

                            </div>


                            <label class="song-demo-toggle">

                                <input
                                    type="checkbox"
                                    ${
                                        section.enabled
                                            ? "checked"
                                            : ""
                                    }
                                    data-section-enabled="${escapeAttribute(
                                        section.localId
                                    )}"
                                >

                                <span>
                                    Enabled
                                </span>

                            </label>

                        </div>


                        <div class="song-demo-section-controls">

                            <button
                                type="button"
                                class="secondary-button"
                                data-section-up="${escapeAttribute(
                                    section.localId
                                )}"
                                ${
                                    index === 0
                                        ? "disabled"
                                        : ""
                                }
                            >
                                ↑
                            </button>

                            <button
                                type="button"
                                class="secondary-button"
                                data-section-down="${escapeAttribute(
                                    section.localId
                                )}"
                                ${
                                    index ===
                                    nemawashiSongDemoSections.length - 1
                                        ? "disabled"
                                        : ""
                                }
                            >
                                ↓
                            </button>

                            <button
                                type="button"
                                class="danger-button"
                                data-section-remove="${escapeAttribute(
                                    section.localId
                                )}"
                            >
                                Remove
                            </button>

                        </div>


                        <div class="song-demo-section-body">

                            <label>
                                Lyrics
                            </label>

                            <textarea
                                rows="7"
                                placeholder="Write the lyrics for this section..."
                                data-section-lyrics="${escapeAttribute(
                                    section.localId
                                )}"
                            >${escapeHtml(
                                section.lyrics
                            )}</textarea>


                            <label>
                                Assign members
                            </label>

                            ${
                                nemawashiSongDemoSelectedArtistId
                                    ? ""
                                    : `
                                        <span class="song-demo-artist-help">
                                            Select an artist or group above to load its members.
                                        </span>
                                    `
                            }

                            <div class="song-demo-member-row">

                                <select
                                    data-member-select="${escapeAttribute(
                                        section.localId
                                    )}"
                                >

                                    <option value="">
                                        Select a member...
                                    </option>

                                    ${memberOptions}

                                </select>

                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-member-add="${escapeAttribute(
                                        section.localId
                                    )}"
                                >
                                    Add member
                                </button>

                            </div>


                            <div class="song-demo-member-list">

                                ${
                                    selectedMembers.length
                                        ? selectedMembers
                                            .map(member => `

                                                <span
                                                    class="song-demo-member-chip"
                                                >

                                                    ${escapeHtml(
                                                        member.name
                                                    )}

                                                    <button
                                                        type="button"
                                                        data-member-remove="${escapeAttribute(
                                                            section.localId
                                                        )}"
                                                        data-member-id="${escapeAttribute(
                                                            member.artistMemberId
                                                        )}"
                                                    >
                                                        ×
                                                    </button>

                                                </span>

                                            `)
                                            .join("")
                                        : `
                                            <span class="song-demo-no-members">
                                                No members assigned
                                            </span>
                                        `
                                }

                            </div>

                        </div>

                    </div>

                `;

            })
            .join("");
}


// ------------------------------------------------------------
// ADD CUSTOM SECTION
// ------------------------------------------------------------

function addSongDemoCustomSection() {

    const customNumber =
        nemawashiSongDemoSections.filter(
            section =>
                section.type === "custom"
        ).length + 1;


    nemawashiSongDemoSections.push({

        localId:
            `section-${Date.now()}-${Math.random()}`,

        type: "custom",

        number: null,

        title:
            `Custom Section ${customNumber}`,

        enabled: true,

        lyrics: "",

        members: []

    });


    renderSongDemoSectionList();
}


// ------------------------------------------------------------
// MOVE SECTION
// ------------------------------------------------------------

function moveSongDemoSection(
    localId,
    direction
) {

    const index =
        nemawashiSongDemoSections.findIndex(
            section =>
                section.localId === localId
        );

    if (index < 0) {
        return;
    }


    const newIndex =
        index + direction;


    if (
        newIndex < 0 ||
        newIndex >=
            nemawashiSongDemoSections.length
    ) {
        return;
    }


    const current =
        nemawashiSongDemoSections[index];


    nemawashiSongDemoSections[index] =
        nemawashiSongDemoSections[newIndex];

    nemawashiSongDemoSections[newIndex] =
        current;


    renderSongDemoSectionList();
}


// ------------------------------------------------------------
// UPDATE SECTION DATA FROM UI
// ------------------------------------------------------------

function syncSongDemoSectionInputs() {

    nemawashiSongDemoSections
        .forEach(section => {

            const title =
                document.querySelector(
                    `[data-section-title="${CSS.escape(
                        section.localId
                    )}"]`
                );

            const lyrics =
                document.querySelector(
                    `[data-section-lyrics="${CSS.escape(
                        section.localId
                    )}"]`
                );

            const enabled =
                document.querySelector(
                    `[data-section-enabled="${CSS.escape(
                        section.localId
                    )}"]`
                );


            if (title) {
                section.title =
                    title.value.trim() ||
                    "Untitled Section";
            }

            if (lyrics) {
                section.lyrics =
                    lyrics.value;
            }

            if (enabled) {
                section.enabled =
                    enabled.checked;
            }

        });
}



// ------------------------------------------------------------
// BUILD LYRICS DEMO PACKAGE
// ------------------------------------------------------------

async function buildLyricsDemoPackage(
    demo,
    employeeId,
    enabledSections
) {

    const {
        data: employee,
        error: employeeError
    } = await supabaseClient
        .from("employees")
        .select(`
            id,
            user_id
        `)
        .eq(
            "id",
            employeeId
        )
        .single();

    if (employeeError) {
        throw employeeError;
    }

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(`
            username,
            display_name
        `)
        .eq(
            "id",
            employee.user_id
        )
        .single();

    if (profileError) {
        throw profileError;
    }

    const username =
        (
            profile?.username ||
            profile?.display_name ||
            "employee"
        )
        .trim()
        .replace(
            /[^a-zA-Z0-9_-]+/g,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        ) ||
        "employee";

    const {
        count: demoCount,
        error: countError
    } = await supabaseClient
        .from("song_demos")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "created_by_employee_id",
            employeeId
        );

    if (countError) {
        throw countError;
    }

    const demoNumber =
        Number(demoCount || 1);

    const packageFilename =
        `${username}_demo${demoNumber}_lyrics.lyrdem`;

    const packageData = {
        format: "lyrdem",
        format_version: 1,
        demo_id: demo.id,
        title: demo.title,
        demo_type: "lyrics",
        visibility: demo.visibility,
        status: demo.status,
        created_at: demo.created_at,
        creator: {
            employee_id: employeeId,
            username:
                profile?.username ||
                null,
            display_name:
                profile?.display_name ||
                null
        },
        sections:
            enabledSections.map(
                (section, index) => ({
                    order:
                        index + 1,
                    type:
                        section.type,
                    number:
                        section.number,
                    title:
                        section.title,
                    enabled:
                        Boolean(
                            section.enabled
                        ),
                    lyrics:
                        section.lyrics || "",
                    members:
                        (
                            section.members ||
                            []
                        ).map(
                            (member, memberIndex) => ({
                                order:
                                    memberIndex + 1,
                                employee_id:
                                    member.employeeId ||
                                    null,
                                name:
                                    member.name ||
                                    ""
                            })
                        )
                })
            )
    };

    const packageBlob =
        new Blob(
            [
                JSON.stringify(
                    packageData,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const storagePath =
        `song-demos/${demo.id}/package/${packageFilename}`;

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from(
            "song-demo-private"
        )
        .upload(
            storagePath,
            packageBlob,
            {
                cacheControl:
                    "3600",
                upsert:
                    false,
                contentType:
                    "application/json"
            }
        );

    if (uploadError) {
        throw uploadError;
    }

    const {
        error: assetError
    } = await supabaseClient
        .from(
            "song_demo_assets"
        )
        .insert({
            demo_id:
                demo.id,
            asset_type:
                "lyrics_package",
            original_filename:
                packageFilename,
            storage_path:
                storagePath,
            mime_type:
                "application/json",
            file_size:
                packageBlob.size
        });

    if (assetError) {
        throw assetError;
    }

    const {
        error: filenameError
    } = await supabaseClient
        .from(
            "song_demos"
        )
        .update({
            package_filename:
                packageFilename
        })
        .eq(
            "id",
            demo.id
        );

    if (filenameError) {
        throw filenameError;
    }

    return {
        packageFilename,
        storagePath
    };
}

async function editSongDemo(demoId) {
    if (!demoId) return;

    try {
        const { data: demo, error: demoError } = await supabaseClient
            .from("song_demos")
            .select("id, title, demo_type, status, visibility, artist_id")
            .eq("id", demoId)
            .single();
        if (demoError) throw demoError;

        if (demo.status !== "draft") {
            alert("Only drafts can be edited.");
            return;
        }

        if (demo.demo_type !== "lyrics") {
            alert("Editing for song-base drafts will be added next. This draft can still be deleted.");
            return;
        }

        const { data: sections, error: sectionsError } = await supabaseClient
            .from("song_demo_sections")
            .select("id, section_order, section_type, section_number, title, enabled, lyrics")
            .eq("demo_id", demoId)
            .order("section_order", { ascending: true });
        if (sectionsError) throw sectionsError;

        const ids = (sections || []).map(s => s.id);
        let members = [];
        if (ids.length) {
            const { data, error } = await supabaseClient
                .from("song_demo_section_members")
                .select("section_id, member_name, employee_id, artist_member_id, lyrics, sort_order")
                .in("section_id", ids)
                .order("sort_order", { ascending: true });
            if (error) throw error;
            members = data || [];
        }

        currentSongDemoEditId = demoId;
        nemawashiSongDemoSelectedArtistId = demo.artist_id || null;
        nemawashiSongDemoSections = (sections || []).map(section => ({
            localId: `section-edit-${demoId}-${section.id}`,
            type: section.section_type,
            number: section.section_number,
            title: section.title || "",
            enabled: section.enabled !== false,
            lyrics: section.lyrics || "",
            members: members
                .filter(m => String(m.section_id) === String(section.id))
                .map(m => ({
                    artistMemberId: m.artist_member_id,
                    employeeId: m.employee_id,
                    name: m.member_name || "",
                    lyrics: m.lyrics || ""
                }))
        }));

        await loadSongDemoArtists();
        if (nemawashiSongDemoSelectedArtistId) {
            await loadSongDemoPeople(nemawashiSongDemoSelectedArtistId);
        }
        renderSongDemoLyricsWizard();
        const button = document.querySelector("[data-song-demo-save-lyrics]");
        if (button) button.textContent = "Save changes";
        const heading = document.querySelector(".song-demo-wizard-header h2");
        if (heading) heading.textContent = "Edit lyrics draft";
        const eyebrow = document.querySelector(".song-demo-wizard-header .eyebrow");
        if (eyebrow) eyebrow.textContent = "EDIT · LYRICS DRAFT";
    } catch (error) {
        console.error("Could not open lyrics draft:", error);
        alert(error.message || "Could not open this draft for editing.");
    }
}

async function deleteSongDemo(demoId) {
    if (!demoId) return;

    const demo = nemawashiSongDemos.find(d => String(d.id) === String(demoId));
    if (!demo || demo.status !== "draft") {
        alert("Only drafts can be deleted.");
        return;
    }

    if (!window.confirm(`Delete the draft "${demo.title || "Untitled Demo"}"? This cannot be undone.`)) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("song_demos")
            .delete()
            .eq("id", demoId);
        if (error) throw error;
        await renderSongDemoLibrary();
    } catch (error) {
        console.error("Could not delete Song Demo draft:", error);
        alert(error.message || "Could not delete this draft.");
    }
}


// ------------------------------------------------------------
// SAVE LYRICS DEMO
// ------------------------------------------------------------

async function saveSongDemoLyrics() {

    syncSongDemoSectionInputs();


    const title =
        nemawashiSongDemoSections
            .find(section =>
                section.enabled &&
                section.title.trim()
            )?.title ||
        "Untitled Lyrics Demo";

    if (!nemawashiSongDemoSelectedArtistId) {
        alert("Please select an artist or group before saving the lyrics demo.");
        return;
    }

    try {

        const {
            data: employeeId,
            error: employeeError
        } = await supabaseClient.rpc(
            "nemawashi_current_employee_id"
        );

        if (employeeError) {
            throw employeeError;
        }

        if (!employeeId) {
            throw new Error(
                "Your account is not connected to an active employee record."
            );
        }


        const {
            data: demo,
            error: demoError
        } = await supabaseClient
            .from("song_demos")
            .insert({

                created_by_employee_id:
                    employeeId,

                producer_employee_id:
                    employeeId,

                artist_id:
                    nemawashiSongDemoSelectedArtistId || null,

                title,

                demo_type:
                    "lyrics",

                visibility:
                    "personal",

                status:
                    "draft",

                package_filename:
                    null

            })
            .select()
            .single();


        if (demoError) {
            throw demoError;
        }


        const enabledSections =
            nemawashiSongDemoSections
                .filter(section =>
                    section.enabled
                );

        if (currentSongDemoEditId) {
            const demoId = currentSongDemoEditId;

            const { error: demoUpdateError } = await supabaseClient
                .from("song_demos")
                .update({
                    title,
                    artist_id: nemawashiSongDemoSelectedArtistId || null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", demoId);

            if (demoUpdateError) throw demoUpdateError;

            const { data: oldSections, error: oldSectionsError } = await supabaseClient
                .from("song_demo_sections")
                .select("id")
                .eq("demo_id", demoId);
            if (oldSectionsError) throw oldSectionsError;

            const oldIds = (oldSections || []).map(s => s.id);
            if (oldIds.length) {
                const { error } = await supabaseClient
                    .from("song_demo_section_members")
                    .delete()
                    .in("section_id", oldIds);
                if (error) throw error;
            }

            const { error: sectionDeleteError } = await supabaseClient
                .from("song_demo_sections")
                .delete()
                .eq("demo_id", demoId);
            if (sectionDeleteError) throw sectionDeleteError;

            for (let index = 0; index < enabledSections.length; index++) {
                const section = enabledSections[index];
                const { data: insertedSection, error: sectionError } = await supabaseClient
                    .from("song_demo_sections")
                    .insert({
                        demo_id: demoId,
                        section_order: index + 1,
                        section_type: section.type,
                        section_number: section.number,
                        title: section.title,
                        enabled: section.enabled,
                        lyrics: section.lyrics
                    })
                    .select()
                    .single();
                if (sectionError) throw sectionError;

                if (section.members?.length) {
                    const rows = section.members.map((member, memberIndex) => ({
                        section_id: insertedSection.id,
                        member_name: member.name,
                        employee_id: null,
                        artist_member_id: member.artistMemberId || null,
                        lyrics: section.lyrics,
                        sort_order: memberIndex + 1
                    }));
                    const { error } = await supabaseClient
                        .from("song_demo_section_members")
                        .insert(rows);
                    if (error) throw error;
                }
            }

            alert("Lyrics draft updated successfully.");
            currentSongDemoEditId = null;
            await openSection("song-demo-library");
            return;
        }


        for (
            let index = 0;
            index < enabledSections.length;
            index++
        ) {

            const section =
                enabledSections[index];


            const {
                data: insertedSection,
                error: sectionError
            } = await supabaseClient
                .from("song_demo_sections")
                .insert({

                    demo_id:
                        demo.id,

                    section_order:
                        index + 1,

                    section_type:
                        section.type,

                    section_number:
                        section.number,

                    title:
                        section.title,

                    enabled:
                        section.enabled,

                    lyrics:
                        section.lyrics

                })
                .select()
                .single();


            if (sectionError) {
                throw sectionError;
            }


            if (
                section.members &&
                section.members.length
            ) {

                const memberRows =
                    section.members.map(
                        (member, memberIndex) => ({

                            section_id:
                                insertedSection.id,

                            member_name:
                                member.name,

                            employee_id:
                                null,

                            artist_member_id:
                                member.artistMemberId || null,

                            lyrics:
                                section.lyrics,

                            sort_order:
                                memberIndex + 1

                        })
                    );


                const {
                    error: membersError
                } = await supabaseClient
                    .from(
                        "song_demo_section_members"
                    )
                    .insert(memberRows);


                if (membersError) {
                    throw membersError;
                }

            }

        }


        await buildLyricsDemoPackage(
            demo,
            employeeId,
            enabledSections
        );


        alert(
            "Lyrics demo saved as a personal draft."
        );


        openSection(
            "song-demos"
        );

    } catch (error) {

        console.error(
            "Could not save lyrics demo:",
            error
        );

        alert(
            error.message ||
            "Could not save the lyrics demo."
        );
    }
}


// ------------------------------------------------------------
// SONG BASE WIZARD
// ------------------------------------------------------------

function renderSongDemoSongBaseWizard() {

    sectionLabel.textContent =
        "SONG DEMO STUDIO";

    sectionTitle.textContent =
        "Song-base-first demo";

    dashboardContent.innerHTML = `

        <div class="song-demo-wizard">

            <button
                type="button"
                class="back-button"
                data-song-demo-back="true"
            >
                ← Back
            </button>

            <div class="song-demo-wizard-header">

                <span class="eyebrow">
                    STEP 1 · SONG BASE
                </span>

                <h2>
                    Add your song base
                </h2>

                <p>
                    Start with the audio production.
                    Add an optional DAW project and save it as a private draft.
                </p>

            </div>

            <div class="song-demo-artist-selector">

                <label for="song-demo-artist-select">
                    Artist / Group
                </label>

                <select
                    id="song-demo-artist-select"
                    class="song-demo-artist-select"
                >
                    <option value="">
                        Select an artist or group...
                    </option>

                    ${nemawashiSongDemoArtists
                        .map(artist => `
                            <option
                                value="${escapeAttribute(artist.id)}"
                            >
                                ${escapeHtml(artist.name)}
                            </option>
                        `)
                        .join("")}
                </select>

            </div>

            <div class="song-demo-upload-card">

                <label for="song-demo-title">
                    Demo title
                </label>

                <input
                    type="text"
                    id="song-demo-title"
                    placeholder="Enter a song or demo title..."
                    maxlength="200"
                    autocomplete="off"
                >

            </div>

            <div class="song-demo-upload-card">

                <label>
                    Audio demo
                    <span>Required</span>
                </label>

                <input
                    type="file"
                    id="song-demo-audio-file"
                    accept=".wav,.mp3,audio/wav,audio/mpeg"
                >

                <div id="song-demo-audio-status" class="song-demo-upload-status">
                    No audio selected.
                </div>

            </div>

            <div class="song-demo-upload-card">

                <label>
                    DAW project
                    <span>Optional</span>
                </label>

                <input
                    type="file"
                    id="song-demo-daw-file"
                    accept=".als,.flp,.logicx,.zip"
                >

                <div id="song-demo-daw-status" class="song-demo-upload-status">
                    Ableton, FL Studio, Logic or packaged project.
                </div>

            </div>

            <div
                id="song-demo-audio-player-wrap"
                class="song-demo-audio-player-wrap"
                hidden
            >
                <audio id="song-demo-audio-player" controls preload="metadata"></audio>
            </div>

            <div class="song-demo-wizard-footer">

                <button type="button" class="secondary-button" data-song-demo-back="true">
                    Cancel
                </button>

                <button type="button" class="person-save-button" data-song-demo-save-base="true">
                    Continue
                </button>

            </div>

        </div>

    `;

    const artistSelect = document.getElementById("song-demo-artist-select");
    if (artistSelect) {
        artistSelect.addEventListener("change", async event => {
            nemawashiSongDemoSelectedArtistId = event.target.value || null;
            await loadSongDemoPeople(nemawashiSongDemoSelectedArtistId);
        });
    }

    const audioInput = document.getElementById("song-demo-audio-file");
    if (audioInput) {
        audioInput.addEventListener("change", validateSongDemoAudio);
    }

    const dawInput = document.getElementById("song-demo-daw-file");
    if (dawInput) {
        dawInput.addEventListener("change", function () {
            const status = document.getElementById("song-demo-daw-status");
            if (!dawInput.files.length) {
                if (status) status.textContent = "Ableton, FL Studio, Logic or packaged project.";
                return;
            }
            const file = dawInput.files[0];
            const extension = file.name.split(".").pop().toLowerCase();
            const allowed = ["als", "flp", "logicx", "zip"];
            if (!allowed.includes(extension)) {
                dawInput.value = "";
                if (status) status.textContent = "Please choose an Ableton, FL Studio, Logic or ZIP project.";
                return;
            }
            if (status) status.textContent = `${file.name} · ${formatSongDemoFileSize(file.size)}`;
        });
    }
}


// ------------------------------------------------------------
// AUDIO VALIDATION
// ------------------------------------------------------------

function validateSongDemoAudio() {

    const input =
        document.getElementById(
            "song-demo-audio-file"
        );

    const status =
        document.getElementById(
            "song-demo-audio-status"
        );

    const playerWrap =
        document.getElementById(
            "song-demo-audio-player-wrap"
        );

    const player =
        document.getElementById(
            "song-demo-audio-player"
        );


    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        if (status) {
            status.textContent =
                "No audio selected.";
        }

        return;
    }


    const file =
        input.files[0];


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (
        extension !== "wav" &&
        extension !== "mp3"
    ) {

        input.value = "";

        status.textContent =
            "Please choose a WAV or MP3 file.";

        return;
    }


    const objectUrl =
        URL.createObjectURL(file);


    const temporaryAudio =
        new Audio();


    temporaryAudio.preload =
        "metadata";


    temporaryAudio.onloadedmetadata =
        function () {

            const duration =
                temporaryAudio.duration;


            URL.revokeObjectURL(
                objectUrl
            );


            if (
                !Number.isFinite(duration) ||
                duration >= 60
            ) {

                input.value = "";

                status.textContent =
                    "The demo must be shorter than 1 minute.";

                if (playerWrap) {
                    playerWrap.hidden = true;
                }

                return;
            }


            status.textContent =
                `${file.name} · ${duration.toFixed(1)} seconds`;


            if (player) {
                player.src =
                    URL.createObjectURL(file);
            }

            if (playerWrap) {
                playerWrap.hidden = false;
            }

        };


    temporaryAudio.onerror =
        function () {

            URL.revokeObjectURL(
                objectUrl
            );

            input.value = "";

            status.textContent =
                "The audio file could not be read.";

        };


    temporaryAudio.src =
        objectUrl;
}


// ------------------------------------------------------------
// TEMPORARY SONG BASE SAVE
// ------------------------------------------------------------

async function saveSongDemoBase() {

    const titleInput = document.getElementById("song-demo-title");
    const audioInput = document.getElementById("song-demo-audio-file");
    const dawInput = document.getElementById("song-demo-daw-file");
    const saveButton = document.querySelector("[data-song-demo-save-base]");

    const title = titleInput?.value.trim() || "Untitled Song Demo";

    if (!nemawashiSongDemoSelectedArtistId) {
        alert("Please select an artist or group first.");
        return;
    }

    if (!audioInput || !audioInput.files || !audioInput.files.length) {
        alert("Please select a WAV or MP3 demo first.");
        return;
    }

    const audioFile = audioInput.files[0];
    const audioExtension = audioFile.name.split(".").pop().toLowerCase();

    if (audioExtension !== "wav" && audioExtension !== "mp3") {
        alert("Please choose a WAV or MP3 file.");
        return;
    }

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        const { data: employeeId, error: employeeError } =
            await supabaseClient.rpc("nemawashi_current_employee_id");

        if (employeeError) throw employeeError;
        if (!employeeId) {
            throw new Error("Your account is not connected to an active employee record.");
        }

        const { data: demo, error: demoError } =
            await supabaseClient
                .from("song_demos")
                .insert({
                    created_by_employee_id: employeeId,
                    producer_employee_id: employeeId,
                    artist_id: nemawashiSongDemoSelectedArtistId,
                    title,
                    demo_type: "song",
                    visibility: "personal",
                    status: "draft",
                    package_filename: null
                })
                .select()
                .single();

        if (demoError) throw demoError;

        const audioPath = `song-demos/${demo.id}/audio/${audioFile.name}`;

        const { error: audioUploadError } =
            await supabaseClient.storage
                .from("song-demo-private")
                .upload(audioPath, audioFile, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: audioFile.type ||
                        (audioExtension === "wav" ? "audio/wav" : "audio/mpeg")
                });

        if (audioUploadError) throw audioUploadError;

        const { error: audioAssetError } =
            await supabaseClient
                .from("song_demo_assets")
                .insert({
                    demo_id: demo.id,
                    asset_type: "audio_demo",
                    original_filename: audioFile.name,
                    storage_path: audioPath,
                    mime_type: audioFile.type ||
                        (audioExtension === "wav" ? "audio/wav" : "audio/mpeg")
                });

        if (audioAssetError) throw audioAssetError;

        if (dawInput && dawInput.files && dawInput.files.length) {
            const dawFile = dawInput.files[0];
            const dawExtension = dawFile.name.split(".").pop().toLowerCase();
            const allowedDawExtensions = ["als", "flp", "logicx", "zip"];

            if (!allowedDawExtensions.includes(dawExtension)) {
                throw new Error("The DAW project must be an Ableton, FL Studio, Logic or ZIP project.");
            }

            const dawPath = `song-demos/${demo.id}/daw/${dawFile.name}`;

            const { error: dawUploadError } =
                await supabaseClient.storage
                    .from("song-demo-private")
                    .upload(dawPath, dawFile, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: dawFile.type || "application/octet-stream"
                    });

            if (dawUploadError) throw dawUploadError;

            const { error: dawAssetError } =
                await supabaseClient
                    .from("song_demo_assets")
                    .insert({
                        demo_id: demo.id,
                        asset_type: "daw_project",
                        original_filename: dawFile.name,
                        storage_path: dawPath,
                        mime_type: dawFile.type || "application/octet-stream"
                    });

            if (dawAssetError) throw dawAssetError;
        }

        alert("Song base saved. Now build the song structure and lyrics.");
        await openSongBaseStructure(demo.id);

    } catch (error) {
        console.error("Could not save song demo:", error);
        alert(error.message || "Could not save the song demo.");
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Continue";
        }
    }
}


// ------------------------------------------------------------
// SONG BASE STEP 2 · STRUCTURE + LYRICS
// ------------------------------------------------------------

async function openSongBaseStructure(demoId) {

    currentSongBaseStructureDemoId = demoId;
    currentSongDemoEditId = null;
    nemawashiSongDemoSections = songDemoSectionTemplates.map((section, index) => ({
        localId: `song-base-${demoId}-${Date.now()}-${index}`,
        type: section.type,
        number: section.number,
        title: section.title,
        enabled: true,
        lyrics: "",
        members: []
    }));

    const { data: demo, error: demoError } = await supabaseClient
        .from("song_demos")
        .select("id, title, artist_id")
        .eq("id", demoId)
        .single();

    if (demoError) throw demoError;

    nemawashiSongDemoSelectedArtistId = demo.artist_id || null;
    await loadSongDemoArtists();
    await loadSongDemoPeople(nemawashiSongDemoSelectedArtistId);

    let audioUrl = null;
    const { data: assets, error: assetError } = await supabaseClient
        .from("song_demo_assets")
        .select("storage_path, mime_type, original_filename")
        .eq("demo_id", demoId)
        .eq("asset_type", "audio_demo")
        .limit(1);

    if (!assetError && assets?.length) {
        const { data: signed } = await supabaseClient.storage
            .from("song-demo-private")
            .createSignedUrl(assets[0].storage_path, 3600);
        audioUrl = signed?.signedUrl || null;
    }

    currentSongBaseAudioUrl = audioUrl;
    renderSongBaseStructureWizard(demo);
}

function renderSongBaseStructureWizard(demo) {

    sectionLabel.textContent = "SONG DEMO STUDIO";
    sectionTitle.textContent = "Song structure";

    dashboardContent.innerHTML = `
        <div class="song-demo-wizard">
            <button type="button" class="back-button" data-song-demo-back="true">← Back</button>

            <div class="song-demo-wizard-header">
                <span class="eyebrow">STEP 2 · SONG STRUCTURE + LYRICS</span>
                <h2>${escapeHtml(demo.title || "Untitled Song Demo")}</h2>
                <p>
                    Arrange the song sections, write the lyrics and assign the artist members who perform each section.
                </p>
            </div>

            ${currentSongBaseAudioUrl ? `
                <div class="song-demo-audio-player-wrap">
                    <audio src="${escapeAttribute(currentSongBaseAudioUrl)}" controls preload="metadata"></audio>
                </div>
            ` : ""}

            <div class="song-demo-artist-selector">
                <label for="song-demo-artist-select">Artist / Group</label>
                <select id="song-demo-artist-select" class="song-demo-artist-select">
                    <option value="">Select an artist or group...</option>
                    ${nemawashiSongDemoArtists.map(artist => `
                        <option value="${escapeAttribute(artist.id)}" ${String(artist.id) === String(nemawashiSongDemoSelectedArtistId || "") ? "selected" : ""}>
                            ${escapeHtml(artist.name)}
                        </option>
                    `).join("")}
                </select>
            </div>

            <div class="song-demo-wizard-toolbar">
                <button type="button" class="secondary-button" data-song-demo-add-section="true">+ Add section</button>
                <span class="song-demo-section-count">${nemawashiSongDemoSections.length} sections</span>
            </div>

            <div id="song-demo-section-list" class="song-demo-section-list"></div>

            <div class="song-demo-wizard-footer">
                <button type="button" class="secondary-button" data-song-demo-back="true">Cancel</button>
                <button type="button" class="person-save-button" data-song-demo-save-structure="true">Save song draft</button>
            </div>
        </div>
    `;

    renderSongDemoSectionList();

    document.getElementById("song-demo-artist-select")?.addEventListener("change", async event => {
        await changeSongDemoArtist(event.target.value);
    });
}

async function saveSongBaseStructure() {

    if (!currentSongBaseStructureDemoId) return;

    syncSongDemoSectionInputs();

    if (!nemawashiSongDemoSelectedArtistId) {
        alert("Please select an artist or group first.");
        return;
    }

    const enabledSections = nemawashiSongDemoSections.filter(section => section.enabled);

    if (!enabledSections.length) {
        alert("Please keep at least one song section enabled.");
        return;
    }

    const button = document.querySelector("[data-song-demo-save-structure]");
    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    try {
        const { error: demoError } = await supabaseClient
            .from("song_demos")
            .update({
                artist_id: nemawashiSongDemoSelectedArtistId,
                updated_at: new Date().toISOString()
            })
            .eq("id", currentSongBaseStructureDemoId)
            .eq("status", "draft");

        if (demoError) throw demoError;

        const { data: oldSections, error: oldSectionsError } = await supabaseClient
            .from("song_demo_sections")
            .select("id")
            .eq("demo_id", currentSongBaseStructureDemoId);
        if (oldSectionsError) throw oldSectionsError;

        const oldIds = (oldSections || []).map(section => section.id);
        if (oldIds.length) {
            const { error } = await supabaseClient
                .from("song_demo_section_members")
                .delete()
                .in("section_id", oldIds);
            if (error) throw error;
        }

        const { error: deleteSectionsError } = await supabaseClient
            .from("song_demo_sections")
            .delete()
            .eq("demo_id", currentSongBaseStructureDemoId);
        if (deleteSectionsError) throw deleteSectionsError;

        for (let index = 0; index < enabledSections.length; index++) {
            const section = enabledSections[index];

            const { data: insertedSection, error: sectionError } = await supabaseClient
                .from("song_demo_sections")
                .insert({
                    demo_id: currentSongBaseStructureDemoId,
                    section_order: index + 1,
                    section_type: section.type,
                    section_number: section.number,
                    title: section.title,
                    enabled: true,
                    lyrics: section.lyrics || ""
                })
                .select()
                .single();

            if (sectionError) throw sectionError;

            if (section.members?.length) {
                const rows = section.members.map((member, memberIndex) => ({
                    section_id: insertedSection.id,
                    member_name: member.name,
                    employee_id: null,
                    artist_member_id: member.artistMemberId || null,
                    lyrics: section.lyrics || "",
                    sort_order: memberIndex + 1
                }));

                const { error: membersError } = await supabaseClient
                    .from("song_demo_section_members")
                    .insert(rows);
                if (membersError) throw membersError;
            }
        }

        alert("Song draft saved successfully.");
        currentSongBaseStructureDemoId = null;
        await openSection("song-demo-library");

    } catch (error) {
        console.error("Could not save Song Base Step 2:", error);
        alert(error.message || "Could not save the song draft.");
        if (button) {
            button.disabled = false;
            button.textContent = "Save song draft";
        }
    }
}


// PLACEHOLDER POLLS
// ------------------------------------------------------------

function renderSongDemoLibrary() {

    sectionLabel.textContent =
        "SONG DEMO STUDIO";

    sectionTitle.textContent =
        "Demo Library";

    dashboardContent.innerHTML = `

        <div class="dashboard-placeholder">

            <div class="placeholder-icon">
                ✦
            </div>

            <h2>
                Demo Library
            </h2>

            <p>
                Your Song Demo Studio demos will appear here.
            </p>

        </div>

    `;
}


function renderSongDemoPolls() {

    renderPlaceholder(
        "song-demo-polls"
    );
}


function renderSongDemoReviews() {

    renderPlaceholder(
        "song-demo-reviews"
    );
}


// ============================================================
// GLOBAL NAVIGATION
// ============================================================

document.addEventListener(
    "click",
    async function (event) {

                // ----------------------------------------------------
        // SONG DEMO STUDIO
        // ----------------------------------------------------

        const songDemoStart =
            event.target.closest(
                "[data-song-demo-start]"
            );

        if (songDemoStart) {

            if (
                songDemoStart.dataset.songDemoStart ===
                "lyrics"
            ) {

                startLyricsDemo();

            } else {

                startSongBaseDemo();

            }

            return;
        }


        const songDemoBack =
            event.target.closest(
                "[data-song-demo-back]"
            );

        if (songDemoBack) {

            renderSongDemoCreate();

            return;
        }


        const addSection =
            event.target.closest(
                "[data-song-demo-add-section]"
            );

        if (addSection) {

            syncSongDemoSectionInputs();

            addSongDemoCustomSection();

            return;
        }


        const sectionUp =
            event.target.closest(
                "[data-section-up]"
            );

        if (sectionUp) {

            syncSongDemoSectionInputs();

            moveSongDemoSection(
                sectionUp.dataset.sectionUp,
                -1
            );

            return;
        }


        const sectionDown =
            event.target.closest(
                "[data-section-down]"
            );

        if (sectionDown) {

            syncSongDemoSectionInputs();

            moveSongDemoSection(
                sectionDown.dataset.sectionDown,
                1
            );

            return;
        }


        const sectionRemove =
            event.target.closest(
                "[data-section-remove]"
            );

        if (sectionRemove) {

            syncSongDemoSectionInputs();

            nemawashiSongDemoSections =
                nemawashiSongDemoSections.filter(
                    section =>
                        section.localId !==
                        sectionRemove.dataset.sectionRemove
                );

            renderSongDemoSectionList();

            return;
        }


        const memberAdd =
            event.target.closest(
                "[data-member-add]"
            );

        if (memberAdd) {

            syncSongDemoSectionInputs();

            const sectionId =
                memberAdd.dataset.memberAdd;

            const select =
                document.querySelector(
                    `[data-member-select="${CSS.escape(
                        sectionId
                    )}"]`
                );

            if (
                !select ||
                !select.value
            ) {
                return;
            }


            const person =
                nemawashiSongDemoPeople.find(
                    item =>
                        String(item.artistMemberId) ===
                        String(select.value)
                );


            if (!person) {
                return;
            }


            const section =
                nemawashiSongDemoSections.find(
                    item =>
                        item.localId ===
                        sectionId
                );


            if (!section) {
                return;
            }


            if (
                section.members.some(
                    member =>
                        String(
                            member.artistMemberId
                        ) ===
                        String(
                            person.artistMemberId
                        )
                )
            ) {
                return;
            }


            section.members.push({

                artistMemberId:
                    person.artistMemberId,

                name:
                    person.displayName

            });


            renderSongDemoSectionList();

            return;
        }


        const memberRemove =
            event.target.closest(
                "[data-member-remove]"
            );

        if (memberRemove) {

            syncSongDemoSectionInputs();

            const sectionId =
                memberRemove.dataset.memberRemove;

            const artistMemberId =
                memberRemove.dataset.memberId;


            const section =
                nemawashiSongDemoSections.find(
                    item =>
                        item.localId ===
                        sectionId
                );


            if (!section) {
                return;
            }


            section.members =
                section.members.filter(
                    member =>
                        String(
                            member.artistMemberId
                        ) !==
                        String(artistMemberId)
                );


            renderSongDemoSectionList();

            return;
        }


        const saveLyrics =
            event.target.closest(
                "[data-song-demo-save-lyrics]"
            );

        if (saveLyrics) {

            saveSongDemoLyrics();

            return;
        }


        const saveStructure =
            event.target.closest(
                "[data-song-demo-save-structure]"
            );

        if (saveStructure) {
            await saveSongBaseStructure();
            return;
        }


        const saveBase =
            event.target.closest(
                "[data-song-demo-save-base]"
            );

        if (saveBase) {

            saveSongDemoBase();

            return;
        }

        const editSongDemoButton = event.target.closest("[data-song-demo-edit]");
        if (editSongDemoButton) {
            await editSongDemo(editSongDemoButton.dataset.songDemoEdit);
            return;
        }

        const deleteSongDemoButton = event.target.closest("[data-song-demo-delete]");
        if (deleteSongDemoButton) {
            await deleteSongDemo(deleteSongDemoButton.dataset.songDemoDelete);
            return;
        }

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
        // COMPANY CARD
        // ----------------------------------------------------

        const companyCard =
            event.target.closest(
                "[data-company-id]"
            );

        if (
            companyCard &&
            companyCard.classList.contains(
                "company-card"
            )
        ) {

            openCompany(
                companyCard.dataset.companyId
            );

            return;
        }

        // ----------------------------------------------------
        // COMPANY EMPLOYEE CARD
        // ----------------------------------------------------

        const companyEmployeeCard =
            event.target.closest(
                "[data-person-id]"
            );

        if (
            companyEmployeeCard &&
            companyEmployeeCard.classList.contains(
                "company-employee-card"
            )
        ) {

            openPerson(
                companyEmployeeCard.dataset.personId
            );

            return;
        }

        // ----------------------------------------------------
        // ROLE CARD
        // ----------------------------------------------------

        const roleCard =
            event.target.closest(
                "[data-role-id]"
            );

        if (
            roleCard &&
            roleCard.classList.contains(
                "role-card"
            )
        ) {

            openRole(
                roleCard.dataset.roleId
            );

            return;
        }


        // ----------------------------------------------------
        // ASSIGN ROLE
        // ----------------------------------------------------

        const assignRoleButton =
            event.target.closest(
                "#assign-role-button"
            );

        if (assignRoleButton) {

            const roleDetail =
                document.querySelector(
                    ".role-detail"
                );

            const select =
                document.getElementById(
                    "role-employee-select"
                );

            if (
                roleDetail &&
                select &&
                select.value
            ) {

                const role =
                    nemawashiRoles.find(
                        item =>
                            String(item.id) ===
                            String(
                                document
                                    .querySelector(
                                        "[data-role-id]"
                                    )
                                    ?.dataset.roleId
                            )
                    );

                // The role ID is stored directly
                // on the current page instead.
                const currentRoleId =
                    window.nemawashiCurrentRoleId;

                await assignEmployeeToRole(
                    currentRoleId,
                    select.value
                );

            }

            return;
        }


        // ----------------------------------------------------
        // REMOVE ROLE
        // ----------------------------------------------------

        const removeRoleButton =
            event.target.closest(
                "[data-remove-role]"
            );

        if (removeRoleButton) {

            await removeEmployeeFromRole(
                removeRoleButton.dataset.removeRole,
                removeRoleButton.dataset.removeEmployee
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

        const editBannerButton =
            event.target.closest("[data-edit-banner]");

        if (editBannerButton) {

             await openBannerEditor(
                editBannerButton.dataset.editBanner
            );

            return;
        }


        const deleteBannerButton =
            event.target.closest("[data-delete-banner]");

        if (deleteBannerButton) {

            await deleteBanner(
                deleteBannerButton.dataset.deleteBanner
            );

            return;
        }

        const artistCard =
            event.target.closest("[data-artist-id]");

        if (
            artistCard &&
            artistCard.classList.contains("artist-admin-card")
        ) {

            await openArtist(
                artistCard.dataset.artistId
            );

            return;
        }

    }
);

// ============================================================
// SERASHIO — NOTICES
// ============================================================

let nemawashiNotices = [];
let nemawashiNoticeArtists = [];


// ------------------------------------------------------------
// RENDER NOTICES
// ------------------------------------------------------------

async function renderSerashioNotices() {

    sectionLabel.textContent = "SERASHIO";
    sectionTitle.textContent = "Notices";

    dashboardContent.innerHTML = `
        <div class="serashio-module">

            <div class="module-header">

                <div>
                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h2>
                        Notices
                    </h2>

                    <p>
                        Manage artist notices published through Serashio.
                    </p>
                </div>


                <button
                    type="button"
                    class="primary-button"
                    id="create-notice-button"
                >
                    + Create notice
                </button>

            </div>


            <div class="module-toolbar">

                <input
                    type="search"
                    id="notice-search"
                    class="module-search"
                    placeholder="Search notices..."
                    autocomplete="off"
                >


                <div
                    id="notice-count"
                    class="module-count"
                >
                    Loading...
                </div>

            </div>


            <div
                id="notices-list"
                class="notices-admin-list"
            >
                <div class="module-loading">
                    Loading notices...
                </div>
            </div>

        </div>
    `;


    const searchInput =
        document.getElementById("notice-search");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {
                filterSerashioNotices(
                    this.value
                );
            }
        );

    }


    const createButton =
        document.getElementById(
            "create-notice-button"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            function () {
                openNoticeEditor();
            }
        );

    }


    await loadSerashioNotices();
}


// ------------------------------------------------------------
// LOAD NOTICES
// ------------------------------------------------------------

async function loadSerashioNotices() {

    const list =
        document.getElementById(
            "notices-list"
        );

    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="module-loading">
            Loading notices...
        </div>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("notices")
            .select(`
                id,
                artist_id,
                title,
                content,
                image_url,
                created_at,
                artists (
                    id,
                    name,
                    slug
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        nemawashiNotices =
            data || [];


        renderSerashioNoticeList();

        updateNoticeCount();


    } catch (error) {

        console.error(
            "Could not load Serashio notices:",
            error
        );


        list.innerHTML = `
            <div class="module-error">

                <strong>
                    Could not load notices
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
// RENDER NOTICE LIST
// ------------------------------------------------------------

function renderSerashioNoticeList(
    notices = nemawashiNotices
) {

    const list =
        document.getElementById(
            "notices-list"
        );

    if (!list) {
        return;
    }


    if (!notices.length) {

        list.innerHTML = `
            <div class="module-empty">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    No notices found
                </h3>

                <p>
                    Create a notice to publish information
                    for a Serashio artist.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML = notices
        .map(notice => {

            const artist =
                notice.artists || {};

            const excerpt =
                String(
                    notice.content || ""
                )
                .replace(/\s+/g, " ")
                .trim();


            return `
                <button
                    type="button"
                    class="notice-admin-card"
                    data-notice-id="${escapeAttribute(
                        notice.id
                    )}"
                >

                    <div class="notice-admin-image">

                        ${
                            notice.image_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            notice.image_url
                                        )}"
                                        alt=""
                                    >
                                `
                                : `
                                    <span>
                                        ✦
                                    </span>
                                `
                        }

                    </div>


                    <div class="notice-admin-info">

                        <div class="notice-admin-top">

                            <span class="notice-admin-artist">
                                ${escapeHtml(
                                    artist.name ||
                                    "Unknown artist"
                                )}
                            </span>

                            <span class="notice-admin-date">
                                ${escapeHtml(
                                    formatNoticeDate(
                                        notice.created_at
                                    )
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeHtml(
                                notice.title
                            )}
                        </h3>


                        <p>
                            ${escapeHtml(
                                excerpt ||
                                "No content."
                            )}
                        </p>

                    </div>


                    <div class="notice-admin-arrow">
                        →
                    </div>

                </button>
            `;

        })
        .join("");


    document
        .querySelectorAll(
            ".notice-admin-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                function () {

                    openNoticeEditor(
                        this.dataset.noticeId
                    );

                }
            );

        });
}


// ------------------------------------------------------------
// FILTER
// ------------------------------------------------------------

function filterSerashioNotices(
    searchTerm
) {

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();


    if (!term) {

        renderSerashioNoticeList(
            nemawashiNotices
        );

        updateNoticeCount(
            nemawashiNotices.length
        );

        return;
    }


    const filtered =
        nemawashiNotices.filter(
            notice => {

                const artist =
                    notice.artists || {};


                const values = [

                    notice.title,

                    notice.content,

                    notice.image_url,

                    artist.name,

                    artist.slug

                ];


                return values.some(
                    value =>
                        String(value || "")
                            .toLowerCase()
                            .includes(term)
                );

            }
        );


    renderSerashioNoticeList(
        filtered
    );


    updateNoticeCount(
        filtered.length,
        true
    );
}


// ------------------------------------------------------------
// COUNT
// ------------------------------------------------------------

function updateNoticeCount(
    count = nemawashiNotices.length,
    filtered = false
) {

    const element =
        document.getElementById(
            "notice-count"
        );

    if (!element) {
        return;
    }


    if (filtered) {

        element.textContent =
            `${count} result${
                count === 1
                    ? ""
                    : "s"
            }`;

        return;
    }


    element.textContent =
        `${count} notice${
            count === 1
                ? ""
                : "s"
        }`;
}


// ------------------------------------------------------------
// NOTICE EDITOR
// ------------------------------------------------------------

async function openNoticeEditor(
    noticeId = null
) {

    const existingNotice =
        noticeId
            ? nemawashiNotices.find(
                notice =>
                    String(notice.id) ===
                    String(noticeId)
            )
            : null;


    sectionLabel.textContent =
        "SERASHIO";

    sectionTitle.textContent =
        existingNotice
            ? "Edit Notice"
            : "Create Notice";


    dashboardContent.innerHTML = `
        <div class="notice-editor">

            <button
                type="button"
                class="back-button"
                id="notice-editor-back"
            >
                ← Back to Notices
            </button>


            <div class="notice-editor-header">

                <div>

                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h2>
                        ${
                            existingNotice
                                ? "Edit notice"
                                : "Create notice"
                        }
                    </h2>

                    <p>
                        ${
                            existingNotice
                                ? "Update this Serashio notice."
                                : "Create a new notice for a Serashio artist."
                        }
                    </p>

                </div>

            </div>


            <div class="notice-editor-card">

                <div
                    id="notice-editor-message"
                    class="notice-editor-message"
                    style="display:none;"
                ></div>


                <form
                    id="notice-form"
                    class="notice-form"
                >

                    <div class="notice-form-field">

                        <label for="notice-artist">
                            Artist
                        </label>

                        <select
                            id="notice-artist"
                            required
                        >
                            <option value="">
                                Loading artists...
                            </option>
                        </select>

                    </div>


                    <div class="notice-form-field">

                        <label for="notice-title-input">
                            Title
                        </label>

                        <input
                            type="text"
                            id="notice-title-input"
                            maxlength="255"
                            placeholder="Notice title"
                            value="${escapeAttribute(
                                existingNotice?.title || ""
                            )}"
                            required
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="notice-content-input">
                            Content
                        </label>

                        <textarea
                            id="notice-content-input"
                            rows="12"
                            placeholder="Write the notice content..."
                            required
                        >${escapeHtml(
                            existingNotice?.content || ""
                        )}</textarea>

                    </div>


                    <div class="notice-form-field">

                        <label for="notice-image-input">
                            Image URL
                            <span>Optional</span>
                        </label>

                        <input
                            type="url"
                            id="notice-image-input"
                            placeholder="https://..."
                            value="${escapeAttribute(
                                existingNotice?.image_url || ""
                            )}"
                        >

                    </div>


                    <div class="notice-form-actions">

                        ${
                            existingNotice
                                ? `
                                    <button
                                        type="button"
                                        class="danger-button"
                                        id="delete-notice-button"
                                    >
                                        Delete notice
                                    </button>
                                `
                                : ""
                        }

                        <div class="notice-form-actions-right">

                            <button
                                type="button"
                                class="secondary-button"
                                id="cancel-notice-button"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="person-save-button"
                                id="save-notice-button"
                            >
                                ${
                                    existingNotice
                                        ? "Save changes"
                                        : "Create notice"
                                }
                            </button>

                        </div>

                    </div>

                </form>

            </div>

        </div>
    `;


    const backButton =
        document.getElementById(
            "notice-editor-back"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {
                renderSerashioNotices();
            }
        );

    }


    const cancelButton =
        document.getElementById(
            "cancel-notice-button"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {
                renderSerashioNotices();
            }
        );

    }


    await loadNoticeArtists(
        existingNotice?.artist_id
    );


    const form =
        document.getElementById(
            "notice-form"
        );


    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await saveNotice(
                    noticeId
                );

            }
        );

    }


    if (existingNotice) {

        const deleteButton =
            document.getElementById(
                "delete-notice-button"
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                async function () {

                    await deleteNotice(
                        existingNotice.id
                    );

                }
            );

        }

    }
}


// ------------------------------------------------------------
// LOAD ARTISTS FOR SELECT
// ------------------------------------------------------------

async function loadNoticeArtists(
    selectedArtistId = null
) {

    const select =
        document.getElementById(
            "notice-artist"
        );

    if (!select) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("artists")
            .select(`
                id,
                name,
                slug
            `)
            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        nemawashiNoticeArtists =
            data || [];


        select.innerHTML = `
            <option value="">
                Select an artist
            </option>

            ${
                nemawashiNoticeArtists
                    .map(artist => `
                        <option
                            value="${escapeAttribute(
                                artist.id
                            )}"
                            ${
                                String(
                                    selectedArtistId
                                ) ===
                                String(
                                    artist.id
                                )
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                artist.name
                            )}
                        </option>
                    `)
                    .join("")
            }
        `;


    } catch (error) {

        console.error(
            "Could not load Serashio artists:",
            error
        );


        select.innerHTML = `
            <option value="">
                Could not load artists
            </option>
        `;

    }
}


// ------------------------------------------------------------
// SAVE NOTICE
// ------------------------------------------------------------

async function saveNotice(
    noticeId = null
) {

    const artistId =
        document.getElementById(
            "notice-artist"
        )?.value;


    const title =
        document.getElementById(
            "notice-title-input"
        )?.value.trim();


    const content =
        document.getElementById(
            "notice-content-input"
        )?.value.trim();


    const imageUrl =
        document.getElementById(
            "notice-image-input"
        )?.value.trim();


    const message =
        document.getElementById(
            "notice-editor-message"
        );


    const saveButton =
        document.getElementById(
            "save-notice-button"
        );


    if (!artistId || !title || !content) {

        showNoticeEditorMessage(
            "Please fill in the artist, title and content.",
            "error"
        );

        return;
    }


    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent =
            noticeId
                ? "Saving..."
                : "Creating...";
    }


    try {

        const payload = {

            artist_id: artistId,

            title: title,

            content: content,

            image_url:
                imageUrl || null

        };


        let error;


        if (noticeId) {

            const result =
                await supabaseClient
                    .from("notices")
                    .update(payload)
                    .eq(
                        "id",
                        noticeId
                    );


            error =
                result.error;

        } else {

            const result =
                await supabaseClient
                    .from("notices")
                    .insert(
                        payload
                    );


            error =
                result.error;

        }


        if (error) {
            throw error;
        }


        showNoticeEditorMessage(
            noticeId
                ? "Notice updated successfully."
                : "Notice created successfully.",
            "success"
        );


        setTimeout(
            function () {
                renderSerashioNotices();
            },
            700
        );


    } catch (error) {

        console.error(
            "Could not save notice:",
            error
        );


        showNoticeEditorMessage(
            error.message ||
                "Could not save notice.",
            "error"
        );


        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                noticeId
                    ? "Save changes"
                    : "Create notice";

        }

    }
}


// ------------------------------------------------------------
// DELETE NOTICE
// ------------------------------------------------------------

async function deleteNotice(
    noticeId
) {

    const confirmed =
        window.confirm(
            "Delete this notice? This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    const deleteButton =
        document.getElementById(
            "delete-notice-button"
        );


    if (deleteButton) {

        deleteButton.disabled = true;

        deleteButton.textContent =
            "Deleting...";

    }


    try {

        const {
            error
        } = await supabaseClient
            .from("notices")
            .delete()
            .eq(
                "id",
                noticeId
            );


        if (error) {
            throw error;
        }


        renderSerashioNotices();


    } catch (error) {

        console.error(
            "Could not delete notice:",
            error
        );


        showNoticeEditorMessage(
            error.message ||
                "Could not delete notice.",
            "error"
        );


        if (deleteButton) {

            deleteButton.disabled = false;

            deleteButton.textContent =
                "Delete notice";

        }

    }
}


// ------------------------------------------------------------
// EDITOR MESSAGE
// ------------------------------------------------------------

function showNoticeEditorMessage(
    message,
    type = ""
) {

    const element =
        document.getElementById(
            "notice-editor-message"
        );

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `notice-editor-message ${type}`;


    element.style.display =
        "block";
}


// ------------------------------------------------------------
// DATE
// ------------------------------------------------------------

function formatNoticeDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {
        return "—";
    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}

/* =========================================================
   SERASHIO — NOTICE BANNERS
========================================================= */

let nemawashiBanners = [];
let nemawashiBannerArtists = [];


async function renderSerashioBanners() {

    const content = document.getElementById("dashboard-content");

    if (!content) return;

    content.innerHTML = `
        <section class="serashio-module">

            <div class="module-header">
                <div>
                    <div class="eyebrow">SERASHIO</div>
                    <h1>Notice Banners</h1>
                    <p>Manage the banners displayed across Serashio.</p>
                </div>

                <button
                    class="primary-button"
                    id="create-banner-button"
                >
                    + Create banner
                </button>
            </div>

            <div class="module-toolbar">

                <input
                    type="search"
                    id="banner-search"
                    class="module-search"
                    placeholder="Search banners..."
                >

                <div
                    id="banner-count"
                    class="module-count"
                >
                    0 banners
                </div>

            </div>

            <div
                id="banners-list"
                class="notices-admin-list"
            >
                <div class="organization-loading">
                    Loading banners...
                </div>
            </div>

        </section>
    `;

    document
        .getElementById("create-banner-button")
        ?.addEventListener("click", () => {
            openBannerEditor();
        });

    document
        .getElementById("banner-search")
        ?.addEventListener("input", filterSerashioBanners);

    await loadSerashioBanners();
}


async function loadSerashioBanners() {

    const list = document.getElementById("banners-list");

    if (!list) return;

    const { data, error } = await supabaseClient
        .from("notice_banners")
        .select(`
            id,
            artist_id,
            title,
            image_url,
            link_url,
            sort_order,
            active,
            starts_at,
            ends_at,
            created_at,
            artists (
                id,
                name
            )
        `)
        .order("sort_order", {
            ascending: true
        })
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("Failed to load banners:", error);

        list.innerHTML = `
            <div class="organization-error">
                Failed to load banners.
            </div>
        `;

        return;
    }

    nemawashiBanners = data || [];

    renderSerashioBannerList();
}


function renderSerashioBannerList() {

    const list = document.getElementById("banners-list");

    if (!list) return;

    const search =
        document
            .getElementById("banner-search")
            ?.value
            .trim()
            .toLowerCase() || "";

    const filtered = nemawashiBanners.filter(banner => {

        const title =
            banner.title || "";

        const artist =
            banner.artists?.name || "";

        return (
            title.toLowerCase().includes(search) ||
            artist.toLowerCase().includes(search)
        );
    });

    updateBannerCount(filtered.length);

    if (!filtered.length) {

        list.innerHTML = `
            <div class="organization-empty">
                <strong>No banners found</strong>
                <span>Create a banner to get started.</span>
            </div>
        `;

        return;
    }

    list.innerHTML = filtered.map(banner => {

        const artistName =
            banner.artists?.name || "All Serashio";

        const statusClass =
            banner.active
                ? "banner-status-active"
                : "banner-status-inactive";

        const statusText =
            banner.active
                ? "Active"
                : "Inactive";

        return `
            <article
                class="notice-admin-card banner-admin-card"
                data-banner-id="${escapeAttribute(banner.id)}"
            >

                <div class="notice-admin-image">

                    <img
                        src="${escapeAttribute(banner.image_url)}"
                        alt=""
                        onerror="this.style.display='none'"
                    >

                </div>

                <div class="notice-admin-info">

                    <div class="notice-admin-top">

                        <div>

                            <div class="notice-admin-title">
                                ${escapeHtml(
                                    banner.title || "Untitled banner"
                                )}
                            </div>

                            <div class="notice-admin-meta">
                                ${escapeHtml(artistName)}
                                · Order ${banner.sort_order}
                            </div>

                        </div>

                        <span class="${statusClass}">
                            ${statusText}
                        </span>

                    </div>

                    <div class="notice-admin-meta">

                        ${banner.link_url
                            ? "Linked banner"
                            : "No link"
                        }

                        ${banner.starts_at
                            ? ` · Starts ${formatBannerDate(banner.starts_at)}`
                            : ""
                        }

                        ${banner.ends_at
                            ? ` · Ends ${formatBannerDate(banner.ends_at)}`
                            : ""
                        }

                    </div>

                    <div class="notice-admin-actions">

                        <button
                            class="secondary-button"
                            data-edit-banner="${escapeAttribute(banner.id)}"
                        >
                            Edit
                        </button>

                        <button
                            class="danger-button"
                            data-delete-banner="${escapeAttribute(banner.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");
}


function filterSerashioBanners() {

    renderSerashioBannerList();

}


function updateBannerCount(count) {

    const element =
        document.getElementById("banner-count");

    if (!element) return;

    element.textContent =
        `${count} ${count === 1 ? "banner" : "banners"}`;
}


async function openBannerEditor(bannerId = null) {

    const existing =
        bannerId
            ? nemawashiBanners.find(
                banner => String(banner.id) === String(bannerId)
            )
            : null;

    await loadBannerArtists(
        existing?.artist_id || null
    );

    const content =
        document.getElementById("dashboard-content");

    if (!content) return;

    content.innerHTML = `

        <section class="notice-editor">

            <div class="notice-editor-card">

                <div class="notice-editor-header">

                    <button
                        class="back-button"
                        id="back-to-banners"
                    >
                        ← Back
                    </button>

                    <div>

                        <div class="eyebrow">
                            SERASHIO
                        </div>

                        <h1>
                            ${existing
                                ? "Edit banner"
                                : "Create banner"
                            }
                        </h1>

                    </div>

                </div>


                <form
                    id="banner-form"
                    class="notice-form"
                >

                    <div class="notice-form-field">

                        <label for="banner-title">
                            Title
                        </label>

                        <input
                            id="banner-title"
                            type="text"
                            maxlength="200"
                            value="${escapeAttribute(
                                existing?.title || ""
                            )}"
                            placeholder="Banner title"
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="banner-artist">
                            Artist
                        </label>

                        <select id="banner-artist">

                            <option value="">
                                All Serashio
                            </option>

                            ${nemawashiBannerArtists.map(artist => `
                                <option
                                    value="${escapeAttribute(artist.id)}"
                                    ${String(existing?.artist_id) === String(artist.id)
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    ${escapeHtml(artist.name)}
                                </option>
                            `).join("")}

                        </select>

                    </div>


                    <div class="notice-form-field">

                        <label for="banner-image">
                            Image URL
                        </label>

                        <input
                            id="banner-image"
                            type="url"
                            required
                            value="${escapeAttribute(
                                existing?.image_url || ""
                            )}"
                            placeholder="https://..."
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="banner-link">
                            Link URL
                        </label>

                        <input
                            id="banner-link"
                            type="url"
                            value="${escapeAttribute(
                                existing?.link_url || ""
                            )}"
                            placeholder="https://..."
                        >

                    </div>


                    <div class="notice-form-row">

                        <div class="notice-form-field">

                            <label for="banner-order">
                                Sort order
                            </label>

                            <input
                                id="banner-order"
                                type="number"
                                min="0"
                                value="${existing?.sort_order ?? 0}"
                            >

                        </div>


                        <div class="notice-form-field">

                            <label for="banner-starts">
                                Starts at
                            </label>

                            <input
                                id="banner-starts"
                                type="datetime-local"
                                value="${formatDateTimeLocal(
                                    existing?.starts_at
                                )}"
                            >

                        </div>


                        <div class="notice-form-field">

                            <label for="banner-ends">
                                Ends at
                            </label>

                            <input
                                id="banner-ends"
                                type="datetime-local"
                                value="${formatDateTimeLocal(
                                    existing?.ends_at
                                )}"
                            >

                        </div>

                    </div>


                    <label class="notice-edit-checkbox">

                        <input
                            id="banner-active"
                            type="checkbox"
                            ${existing?.active !== false
                                ? "checked"
                                : ""
                            }
                        >

                        <span>
                            Banner is active
                        </span>

                    </label>


                    <div
                        id="banner-editor-message"
                        class="notice-editor-message"
                        style="display:none;"
                    ></div>


                    <div class="notice-form-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            id="cancel-banner-button"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="person-save-button"
                            id="save-banner-button"
                        >
                            ${existing
                                ? "Save changes"
                                : "Create banner"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </section>
    `;


    document
        .getElementById("back-to-banners")
        ?.addEventListener("click", () => {
            renderSerashioBanners();
        });


    document
        .getElementById("cancel-banner-button")
        ?.addEventListener("click", () => {
            renderSerashioBanners();
        });


    document
        .getElementById("banner-form")
        ?.addEventListener("submit", async event => {

            event.preventDefault();

            await saveBanner(bannerId);

        });
}


async function loadBannerArtists(selectedArtistId = null) {

    const { data, error } = await supabaseClient
        .from("artists")
        .select("id, name")
        .order("name", {
            ascending: true
        });

    if (error) {

        console.error(
            "Failed to load banner artists:",
            error
        );

        nemawashiBannerArtists = [];

        return;
    }

    nemawashiBannerArtists = data || [];
}


async function saveBanner(bannerId = null) {

    const saveButton =
        document.getElementById("save-banner-button");

    const title =
        document.getElementById("banner-title")
            ?.value
            .trim();

    const artistValue =
        document.getElementById("banner-artist")
            ?.value;

    const imageUrl =
        document.getElementById("banner-image")
            ?.value
            .trim();

    const linkUrl =
        document.getElementById("banner-link")
            ?.value
            .trim();

    const sortOrder =
        Number(
            document.getElementById("banner-order")
                ?.value || 0
        );

    const active =
        document.getElementById("banner-active")
            ?.checked ?? true;

    const startsAt =
        document.getElementById("banner-starts")
            ?.value || null;

    const endsAt =
        document.getElementById("banner-ends")
            ?.value || null;


    if (!imageUrl) {

        showBannerEditorMessage(
            "Image URL is required.",
            "error"
        );

        return;
    }


    if (saveButton) {

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

    }


    const payload = {

        artist_id:
            artistValue
                ? Number(artistValue)
                : null,

        title:
            title || null,

        image_url:
            imageUrl,

        link_url:
            linkUrl || null,

        sort_order:
            sortOrder,

        active:
            active,

        starts_at:
            startsAt
                ? new Date(startsAt).toISOString()
                : null,

        ends_at:
            endsAt
                ? new Date(endsAt).toISOString()
                : null

    };


    let result;


    if (bannerId) {

        result =
            await supabaseClient
                .from("notice_banners")
                .update(payload)
                .eq("id", bannerId);

    } else {

        result =
            await supabaseClient
                .from("notice_banners")
                .insert(payload);

    }


    if (result.error) {

        console.error(
            "Failed to save banner:",
            result.error
        );

        showBannerEditorMessage(
            result.error.message ||
            "Failed to save banner.",
            "error"
        );

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                bannerId
                    ? "Save changes"
                    : "Create banner";

        }

        return;
    }


    await renderSerashioBanners();
}


async function deleteBanner(bannerId) {

    const banner =
        nemawashiBanners.find(
            item =>
                String(item.id) === String(bannerId)
        );

    if (!banner) return;


    const confirmed =
        window.confirm(
            `Delete "${banner.title || "this banner"}"?`
        );

    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("notice_banners")
            .delete()
            .eq("id", bannerId);


    if (error) {

        console.error(
            "Failed to delete banner:",
            error
        );

        window.alert(
            error.message ||
            "Failed to delete banner."
        );

        return;
    }


    await loadSerashioBanners();
}


function showBannerEditorMessage(
    message,
    type = ""
) {

    const element =
        document.getElementById(
            "banner-editor-message"
        );

    if (!element) return;

    element.textContent = message;

    element.className =
        `notice-editor-message ${type}`;

    element.style.display = "block";
}


function formatBannerDate(value) {

    if (!value) return "";

    return new Date(value).toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


function formatDateTimeLocal(value) {

    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = number =>
        String(number).padStart(2, "0");

    return (
        `${date.getFullYear()}-` +
        `${pad(date.getMonth() + 1)}-` +
        `${pad(date.getDate())}T` +
        `${pad(date.getHours())}:` +
        `${pad(date.getMinutes())}`
    );
}

/* =========================================================
   SERASHIO — ARTISTS
========================================================= */

let nemawashiArtists = [];


async function renderSerashioArtists() {

    const content =
        document.getElementById("dashboard-content");

    if (!content) return;

    content.innerHTML = `
        <section class="serashio-module">

            <div class="module-header">

                <div>
                    <div class="eyebrow">SERASHIO</div>

                    <h1>Artists</h1>

                    <p>
                        Manage Serashio artists and their public information.
                    </p>
                </div>

                <button
                    class="primary-button"
                    id="create-artist-button"
                >
                    + Create artist
                </button>

            </div>


            <div class="module-toolbar">

                <input
                    type="search"
                    id="artist-search"
                    class="module-search"
                    placeholder="Search artists..."
                >

                <div
                    id="artist-count"
                    class="module-count"
                >
                    0 artists
                </div>

            </div>


            <div
                id="artists-list"
                class="artists-admin-list"
            >
                <div class="organization-loading">
                    Loading artists...
                </div>
            </div>

        </section>
    `;


    document
        .getElementById("create-artist-button")
        ?.addEventListener("click", () => {

            openArtistEditor();

        });


    document
        .getElementById("artist-search")
        ?.addEventListener(
            "input",
            filterSerashioArtists
        );


    await loadSerashioArtists();
}


async function loadSerashioArtists() {

    const list =
        document.getElementById("artists-list");

    if (!list) return;


    const { data, error } =
        await supabaseClient
            .from("artists")
            .select(`
                id,
                name,
                slug,
                description,
                avatar_url,
                banner_url,
                bio,
                created_at
            `)
            .order("name", {
                ascending: true
            });


    if (error) {

        console.error(
            "Failed to load artists:",
            error
        );

        list.innerHTML = `
            <div class="organization-error">
                Failed to load artists.
            </div>
        `;

        return;
    }


    nemawashiArtists = data || [];

    renderSerashioArtistList();
}


function renderSerashioArtistList() {

    const list =
        document.getElementById("artists-list");

    if (!list) return;


    const search =
        document
            .getElementById("artist-search")
            ?.value
            .trim()
            .toLowerCase() || "";


    const filtered =
        nemawashiArtists.filter(artist => {

            return (
                (artist.name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (artist.slug || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (artist.bio || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (artist.description || "")
                    .toLowerCase()
                    .includes(search)
            );

        });


    updateArtistCount(filtered.length);


    if (!filtered.length) {

        list.innerHTML = `
            <div class="organization-empty">

                <strong>No artists found</strong>

                <span>
                    Create an artist to get started.
                </span>

            </div>
        `;

        return;
    }


    list.innerHTML =
        filtered.map(artist => {

            const avatar =
                artist.avatar_url
                    ? `
                        <img
                            src="${escapeAttribute(
                                artist.avatar_url
                            )}"
                            alt=""
                            onerror="
                                this.style.display='none';
                                this.parentElement.classList.add('artist-avatar-fallback');
                            "
                        >
                    `
                    : "";


            return `
                <article
                    class="artist-admin-card"
                    data-artist-id="${escapeAttribute(
                        artist.id
                    )}"
                >

                    <div class="artist-admin-avatar">
                        ${avatar}
                        <span>
                            ${escapeHtml(
                                (artist.name || "?")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </span>
                    </div>


                    <div class="artist-admin-info">

                        <div class="artist-admin-name">
                            ${escapeHtml(
                                artist.name
                            )}
                        </div>

                        <div class="artist-admin-slug">
                            ${escapeHtml(
                                artist.slug
                            )}
                        </div>

                        ${
                            artist.bio ||
                            artist.description
                                ? `
                                    <div class="artist-admin-description">
                                        ${escapeHtml(
                                            artist.bio ||
                                            artist.description
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>


                    <div class="artist-admin-arrow">
                        →
                    </div>

                </article>
            `;

        }).join("");
}


function filterSerashioArtists() {

    renderSerashioArtistList();

}


function updateArtistCount(count) {

    const element =
        document.getElementById("artist-count");

    if (!element) return;


    element.textContent =
        `${count} ${
            count === 1
                ? "artist"
                : "artists"
        }`;
}


/* =========================================================
   ARTIST DETAIL
========================================================= */

async function openArtist(artistId) {

    const artist =
        nemawashiArtists.find(
            item =>
                String(item.id) ===
                String(artistId)
        );


    if (!artist) {

        await loadSerashioArtists();

        return;
    }


    const content =
        document.getElementById("dashboard-content");

    if (!content) return;


    content.innerHTML = `

        <section class="artist-detail">

            <div class="artist-detail-header">

                <button
                    class="back-button"
                    id="back-to-artists"
                >
                    ← Back
                </button>


                <div class="artist-detail-actions">

                    <button
                        class="secondary-button"
                        id="edit-artist-button"
                    >
                        Edit artist
                    </button>

                    <button
                        class="danger-button"
                        id="delete-artist-button"
                    >
                        Delete
                    </button>

                </div>

            </div>


            <div class="artist-profile-card">

                <div
                    class="artist-profile-banner"
                    ${
                        artist.banner_url
                            ? `style="
                                background-image:
                                url('${escapeAttribute(
                                    artist.banner_url
                                )}');
                            "`
                            : ""
                    }
                >

                    <div class="artist-profile-banner-overlay"></div>

                </div>


                <div class="artist-profile-main">

                    <div class="artist-profile-avatar">

                        ${
                            artist.avatar_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            artist.avatar_url
                                        )}"
                                        alt=""
                                        onerror="
                                            this.style.display='none';
                                            this.parentElement.classList.add('artist-avatar-fallback');
                                        "
                                    >
                                `
                                : ""
                        }

                        <span>
                            ${escapeHtml(
                                (artist.name || "?")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </span>

                    </div>


                    <div class="artist-profile-heading">

                        <div class="eyebrow">
                            SERASHIO ARTIST
                        </div>

                        <h1>
                            ${escapeHtml(
                                artist.name
                            )}
                        </h1>

                        <div class="artist-profile-slug">
                            @${escapeHtml(
                                artist.slug
                            )}
                        </div>

                    </div>

                </div>


                <div class="artist-detail-content">

                    <div class="artist-detail-grid">

                        <div class="detail-card">

                            <div class="detail-card-label">
                                Bio
                            </div>

                            <div class="artist-detail-text">
                                ${
                                    artist.bio
                                        ? escapeHtml(
                                            artist.bio
                                        )
                                        : "No bio added."
                                }
                            </div>

                        </div>


                        <div class="detail-card">

                            <div class="detail-card-label">
                                Description
                            </div>

                            <div class="artist-detail-text">
                                ${
                                    artist.description
                                        ? escapeHtml(
                                            artist.description
                                        )
                                        : "No description added."
                                }
                            </div>

                        </div>

                    </div>


                    <div class="artist-url-card">

                        <div>
                            <div class="detail-card-label">
                                Public profile
                            </div>

                            <div class="artist-url-value">
                                /artist/${escapeHtml(
                                    artist.slug
                                )}
                            </div>
                        </div>

                    </div>


                    <div class="artist-detail-section">

                        <div class="artist-section-heading">

                            <div>
                                <div class="eyebrow">
                                    CONTENT
                                </div>

                                <h2>
                                    Artist content
                                </h2>
                            </div>

                        </div>


                        <div
                            id="artist-content-summary"
                            class="artist-content-summary"
                        >
                            Loading content...
                        </div>

                    </div>

                </div>

            </div>

        </section>
    `;


    document
        .getElementById("back-to-artists")
        ?.addEventListener("click", () => {

            renderSerashioArtists();

        });


    document
        .getElementById("edit-artist-button")
        ?.addEventListener("click", () => {

            openArtistEditor(artist.id);

        });


    document
        .getElementById("delete-artist-button")
        ?.addEventListener("click", () => {

            deleteArtist(artist.id);

        });


    await loadArtistContentSummary(
        artist.id
    );
}


/* =========================================================
   ARTIST CONTENT SUMMARY
========================================================= */

async function loadArtistContentSummary(
    artistId
) {

    const element =
        document.getElementById(
            "artist-content-summary"
        );

    if (!element) return;


    const [
        noticesResult,
        bannersResult,
        releasesResult
    ] = await Promise.all([

        supabaseClient
            .from("notices")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("artist_id", artistId),

        supabaseClient
            .from("notice_banners")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("artist_id", artistId),

        supabaseClient
            .from("releases")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("artist_id", artistId)

    ]);


    element.innerHTML = `

        <div class="artist-content-stat">

            <strong>
                ${noticesResult.count ?? 0}
            </strong>

            <span>
                Notices
            </span>

        </div>


        <div class="artist-content-stat">

            <strong>
                ${bannersResult.count ?? 0}
            </strong>

            <span>
                Banners
            </span>

        </div>


        <div class="artist-content-stat">

            <strong>
                ${releasesResult.count ?? 0}
            </strong>

            <span>
                Releases
            </span>

        </div>
    `;
}


/* =========================================================
   ARTIST EDITOR
========================================================= */

function openArtistEditor(
    artistId = null
) {

    const existing =
        artistId
            ? nemawashiArtists.find(
                artist =>
                    String(artist.id) ===
                    String(artistId)
            )
            : null;


    const content =
        document.getElementById(
            "dashboard-content"
        );

    if (!content) return;


    content.innerHTML = `

        <section class="notice-editor">

            <div class="notice-editor-card">

                <div class="notice-editor-header">

                    <button
                        class="back-button"
                        id="back-from-artist-editor"
                    >
                        ← Back
                    </button>

                    <div>

                        <div class="eyebrow">
                            SERASHIO
                        </div>

                        <h1>
                            ${
                                existing
                                    ? "Edit artist"
                                    : "Create artist"
                            }
                        </h1>

                    </div>

                </div>


                <form
                    id="artist-form"
                    class="notice-form"
                >

                    <div class="notice-form-field">

                        <label for="artist-name">
                            Name
                        </label>

                        <input
                            id="artist-name"
                            type="text"
                            required
                            maxlength="200"
                            value="${escapeAttribute(
                                existing?.name || ""
                            )}"
                            placeholder="Artist name"
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="artist-slug">
                            Slug
                        </label>

                        <input
                            id="artist-slug"
                            type="text"
                            required
                            maxlength="200"
                            value="${escapeAttribute(
                                existing?.slug || ""
                            )}"
                            placeholder="artist-slug"
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="artist-avatar">
                            Avatar URL
                        </label>

                        <input
                            id="artist-avatar"
                            type="url"
                            value="${escapeAttribute(
                                existing?.avatar_url || ""
                            )}"
                            placeholder="https://..."
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="artist-banner">
                            Banner URL
                        </label>

                        <input
                            id="artist-banner"
                            type="url"
                            value="${escapeAttribute(
                                existing?.banner_url || ""
                            )}"
                            placeholder="https://..."
                        >

                    </div>


                    <div class="notice-form-field">

                        <label for="artist-bio">
                            Bio
                        </label>

                        <textarea
                            id="artist-bio"
                            rows="4"
                            placeholder="Short artist biography..."
                        >${escapeHtml(
                            existing?.bio || ""
                        )}</textarea>

                    </div>


                    <div class="notice-form-field">

                        <label for="artist-description">
                            Description
                        </label>

                        <textarea
                            id="artist-description"
                            rows="6"
                            placeholder="Longer artist description..."
                        >${escapeHtml(
                            existing?.description || ""
                        )}</textarea>

                    </div>


                    <div
                        id="artist-editor-message"
                        class="notice-editor-message"
                        style="display:none;"
                    ></div>


                    <div class="notice-form-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            id="cancel-artist-button"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="person-save-button"
                            id="save-artist-button"
                        >
                            ${
                                existing
                                    ? "Save changes"
                                    : "Create artist"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </section>
    `;


    document
        .getElementById(
            "back-from-artist-editor"
        )
        ?.addEventListener("click", () => {

            if (existing) {

                openArtist(existing.id);

            } else {

                renderSerashioArtists();

            }

        });


    document
        .getElementById("cancel-artist-button")
        ?.addEventListener("click", () => {

            if (existing) {

                openArtist(existing.id);

            } else {

                renderSerashioArtists();

            }

        });


    document
        .getElementById("artist-form")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveArtist(artistId);

            }
        );
}


async function saveArtist(
    artistId = null
) {

    const button =
        document.getElementById(
            "save-artist-button"
        );


    const name =
        document.getElementById(
            "artist-name"
        )?.value.trim();


    const slug =
        document.getElementById(
            "artist-slug"
        )?.value.trim();


    const avatarUrl =
        document.getElementById(
            "artist-avatar"
        )?.value.trim();


    const bannerUrl =
        document.getElementById(
            "artist-banner"
        )?.value.trim();


    const bio =
        document.getElementById(
            "artist-bio"
        )?.value.trim();


    const description =
        document.getElementById(
            "artist-description"
        )?.value.trim();


    if (!name) {

        showArtistEditorMessage(
            "Artist name is required.",
            "error"
        );

        return;
    }


    if (!slug) {

        showArtistEditorMessage(
            "Artist slug is required.",
            "error"
        );

        return;
    }


    if (button) {

        button.disabled = true;
        button.textContent = "Saving...";

    }


    const payload = {

        name,

        slug,

        avatar_url:
            avatarUrl || null,

        banner_url:
            bannerUrl || null,

        bio:
            bio || null,

        description:
            description || null

    };


    let result;


    if (artistId) {

        result =
            await supabaseClient
                .from("artists")
                .update(payload)
                .eq("id", artistId);

    } else {

        result =
            await supabaseClient
                .from("artists")
                .insert(payload);

    }


    if (result.error) {

        console.error(
            "Failed to save artist:",
            result.error
        );


        showArtistEditorMessage(
            result.error.message ||
            "Failed to save artist.",
            "error"
        );


        if (button) {

            button.disabled = false;

            button.textContent =
                artistId
                    ? "Save changes"
                    : "Create artist";

        }

        return;
    }


    await renderSerashioArtists();
}


async function deleteArtist(
    artistId
) {

    const artist =
        nemawashiArtists.find(
            item =>
                String(item.id) ===
                String(artistId)
        );


    if (!artist) return;


    const confirmed =
        window.confirm(
            `Delete "${artist.name}"?`
        );


    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("artists")
            .delete()
            .eq("id", artistId);


    if (error) {

        console.error(
            "Failed to delete artist:",
            error
        );


        window.alert(
            error.message ||
            "Failed to delete artist."
        );

        return;
    }


    await renderSerashioArtists();
}


function showArtistEditorMessage(
    message,
    type = ""
) {

    const element =
        document.getElementById(
            "artist-editor-message"
        );

    if (!element) return;


    element.textContent = message;

    element.className =
        `notice-editor-message ${type}`;

    element.style.display =
        "block";
}


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

    await initializeSongDemoStudio();

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
// SONG DEMO LIBRARY
// ============================================================

async function renderSongDemoLibrary() {

    sectionLabel.textContent =
        "SONG DEMO STUDIO";

    sectionTitle.textContent =
        "Demo Library";


    dashboardContent.innerHTML = `

        <div class="song-demo-header">

            <div>

                <span class="eyebrow">
                    SONG DEMO STUDIO
                </span>

                <h2>
                    Demo Library
                </h2>

                <p>
                    Create, organize and review Hrmnx song demos.
                </p>

            </div>


            <button
                class="primary-button"
                id="create-song-demo-button"
                type="button"
            >
                + Add demo
            </button>

        </div>


        <div class="song-demo-toolbar">

            <input
                type="search"
                id="song-demo-search"
                class="song-demo-search"
                placeholder="Search demos..."
            >

            <select
                id="song-demo-status-filter"
                class="song-demo-filter"
            >
                <option value="all">
                    All statuses
                </option>

                <option value="draft">
                    Draft
                </option>

                <option value="published">
                    Published
                </option>

                <option value="poll_active">
                    Poll active
                </option>

                <option value="poll_ended">
                    Poll ended
                </option>

                <option value="released">
                    Released
                </option>
            </select>


            <select
                id="song-demo-visibility-filter"
                class="song-demo-filter"
            >
                <option value="all">
                    All visibility
                </option>

                <option value="personal">
                    Personal
                </option>

                <option value="shared">
                    Shared
                </option>

                <option value="public">
                    Public
                </option>
            </select>

        </div>


        <div
            id="song-demo-count"
            class="song-demo-count"
        >
            Loading demos...
        </div>


        <div
            id="song-demo-list"
            class="song-demo-list"
        >
            <div class="song-demo-loading">
                Loading Song Demo Studio...
            </div>
        </div>

    `;


    const createButton =
        document.getElementById(
            "create-song-demo-button"
        );

    if (createButton) {

        createButton.addEventListener(
            "click",
            function () {

                openSection(
                    "song-demo-create"
                );

            }
        );

    }


    const search =
        document.getElementById(
            "song-demo-search"
        );

    const statusFilter =
        document.getElementById(
            "song-demo-status-filter"
        );

    const visibilityFilter =
        document.getElementById(
            "song-demo-visibility-filter"
        );


    if (search) {

        search.addEventListener(
            "input",
            filterSongDemos
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterSongDemos
        );

    }


    if (visibilityFilter) {

        visibilityFilter.addEventListener(
            "change",
            filterSongDemos
        );

    }


    await loadSongDemos();
}


// ------------------------------------------------------------
// LOAD DEMOS
// ------------------------------------------------------------

async function loadSongDemos() {

    const {
        data,
        error
    } = await supabaseClient
        .from("song_demos")
        .select(`
            id,
            created_by_employee_id,
            title,
            demo_type,
            visibility,
            status,
            package_filename,
            producer_employee_id,
            cover_url,
            linked_release_id,
            release_assignment_status,
            is_competition,
            poll_enabled,
            poll_ends_at,
            publication_date,
            created_at,
            updated_at
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Song demo loading error:",
            error
        );


        const list =
            document.getElementById(
                "song-demo-list"
            );

        if (list) {

            list.innerHTML = `
                <div class="song-demo-error">
                    Unable to load song demos.
                    <br>
                    ${escapeHtml(
                        error.message
                    )}
                </div>
            `;

        }

        return;
    }


    nemawashiSongDemos =
        data || [];


    await attachSongDemoPeople();


    renderSongDemoList(
        nemawashiSongDemos
    );
}


// ------------------------------------------------------------
// LOAD EMPLOYEE / PROFILE NAMES
// ------------------------------------------------------------

async function attachSongDemoPeople() {

    const employeeIds =
        [
            ...new Set(
                nemawashiSongDemos
                    .flatMap(demo => [
                        demo.created_by_employee_id,
                        demo.producer_employee_id
                    ])
                    .filter(Boolean)
            )
        ];


    if (
        employeeIds.length === 0
    ) {
        return;
    }


    const {
        data: employees,
        error
    } = await supabaseClient
        .from("employees")
        .select(`
            id,
            user_id,
            employee_number
        `)
        .in(
            "id",
            employeeIds
        );


    if (error) {

        console.error(
            "Song demo employee loading error:",
            error
        );

        return;
    }


    const userIds =
        (employees || [])
            .map(
                employee =>
                    employee.user_id
            )
            .filter(Boolean);


    let profiles = [];


    if (
        userIds.length > 0
    ) {

        const {
            data
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                display_name,
                avatar_url
            `)
            .in(
                "id",
                userIds
            );

        profiles =
            data || [];

    }


    const employeeMap =
        new Map(
            (employees || [])
                .map(
                    employee =>
                        [
                            employee.id,
                            employee
                        ]
                )
        );


    const profileMap =
        new Map(
            profiles.map(
                profile =>
                    [
                        profile.id,
                        profile
                    ]
            )
        );


    nemawashiSongDemos =
        nemawashiSongDemos.map(
            demo => {

                const creator =
                    employeeMap.get(
                        demo.created_by_employee_id
                    );

                const producer =
                    employeeMap.get(
                        demo.producer_employee_id
                    );


                return {
                    ...demo,

                    creator_profile:
                        creator
                            ? profileMap.get(
                                creator.user_id
                            )
                            : null,

                    producer_profile:
                        producer
                            ? profileMap.get(
                                producer.user_id
                            )
                            : null
                };

            }
        );
}


// ------------------------------------------------------------
// RENDER LIST
// ------------------------------------------------------------

function renderSongDemoList(
    demos
) {

    const list =
        document.getElementById(
            "song-demo-list"
        );

    const count =
        document.getElementById(
            "song-demo-count"
        );


    if (!list) {
        return;
    }


    if (count) {

        count.textContent =
            `${demos.length} demo${
                demos.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (
        demos.length === 0
    ) {

        list.innerHTML = `

            <div class="song-demo-empty">

                <div class="song-demo-empty-icon">
                    ♫
                </div>

                <h3>
                    No demos yet
                </h3>

                <p>
                    Start by creating your first song demo.
                </p>

                <button
                    class="primary-button"
                    type="button"
                    onclick="openSection('song-demo-create')"
                >
                    + Create demo
                </button>

            </div>

        `;

        return;
    }


    list.innerHTML =
        demos.map(
            renderSongDemoCard
        ).join("");
}


// ------------------------------------------------------------
// DEMO CARD
// ------------------------------------------------------------

function renderSongDemoCard(
    demo
) {

    const producer =
        demo.producer_profile
            ? (
                demo.producer_profile.display_name ||
                demo.producer_profile.username ||
                "Unknown producer"
            )
            : "Unknown producer";


    const creator =
        demo.creator_profile
            ? (
                demo.creator_profile.display_name ||
                demo.creator_profile.username ||
                "Unknown employee"
            )
            : "Unknown employee";


    const releaseStatus =
        demo.release_assignment_status ||
        "not_assigned";


    const releaseLabel = {

        assigned:
            "Assigned to release",

        resolved:
            "Release linked",

        missing:
            "Release track missing",

        not_assigned:
            "Not assigned"

    }[releaseStatus] ||
        "Not assigned";


    const statusLabel = {

        draft:
            "Draft",

        published:
            "Published",

        poll_active:
            "Poll active",

        poll_ended:
            "Poll ended",

        under_review:
            "Under review",

        approved:
            "Approved",

        rejected:
            "Rejected",

        released:
            "Released"

    }[demo.status] ||
        demo.status ||
        "Draft";


    const typeLabel = {

        lyrics:
            "Lyrics demo",

        song:
            "Song demo",

        competition:
            "Competition"

    }[demo.demo_type] ||
        "Demo";


    const visibilityLabel = {

        personal:
            "Personal",

        shared:
            "Shared",

        public:
            "Public"

    }[demo.visibility] ||
        "Personal";


    const releaseClass =
        releaseStatus === "assigned" ||
        releaseStatus === "resolved"
            ? "release-ok"
            : "release-warning";


    return `

        <article
            class="song-demo-card"
            data-song-demo-id="${escapeAttribute(
                demo.id
            )}"
        >

            <div class="song-demo-cover">

                ${
                    demo.cover_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    demo.cover_url
                                )}"
                                alt=""
                            >
                          `
                        : `
                            <div
                                class="song-demo-cover-placeholder"
                            >
                                ♫
                            </div>
                          `
                }

            </div>


            <div class="song-demo-info">

                <div class="song-demo-top">

                    <div>

                        <div
                            class="song-demo-type"
                        >
                            ${escapeHtml(
                                typeLabel
                            )}
                        </div>

                        <h3>
                            ${escapeHtml(
                                demo.title ||
                                "Untitled Demo"
                            )}
                        </h3>

                    </div>


                    <span
                        class="song-demo-status"
                    >
                        ${escapeHtml(
                            statusLabel
                        )}
                    </span>

                </div>


                <div
                    class="song-demo-meta"
                >

                    <span>
                        Producer:
                        ${escapeHtml(
                            producer
                        )}
                    </span>

                    <span>
                        Created by:
                        ${escapeHtml(
                            creator
                        )}
                    </span>

                    <span>
                        Visibility:
                        ${escapeHtml(
                            visibilityLabel
                        )}
                    </span>

                </div>


                <div
                    class="song-demo-bottom"
                >

                    <span
                        class="song-demo-release
                        ${releaseClass}"
                    >
                        ${escapeHtml(
                            releaseLabel
                        )}
                    </span>


                    ${
                        demo.is_competition
                            ? `
                                <span
                                    class="song-demo-competition"
                                >
                                    ✦ Competition
                                </span>
                              `
                            : ""
                    }

                </div>

                ${demo.status === "draft" ? `
                    <div class="song-demo-card-actions">
                        ${demo.demo_type === "lyrics" ? `
                            <button type="button" class="secondary-button" data-song-demo-edit="${escapeAttribute(demo.id)}">Edit</button>
                        ` : ""}
                        <button type="button" class="danger-button" data-song-demo-delete="${escapeAttribute(demo.id)}">Delete</button>
                    </div>
                ` : ""}

            </div>

        </article>

    `;
}


// ------------------------------------------------------------
// FILTER
// ------------------------------------------------------------

function filterSongDemos() {

    const search =
        (
            document.getElementById(
                "song-demo-search"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const status =
        document.getElementById(
            "song-demo-status-filter"
        )?.value ||
        "all";


    const visibility =
        document.getElementById(
            "song-demo-visibility-filter"
        )?.value ||
        "all";


    const filtered =
        nemawashiSongDemos.filter(
            demo => {

                const title =
                    (
                        demo.title ||
                        ""
                    ).toLowerCase();


                const producer =
                    (
                        demo.producer_profile
                            ?.display_name ||
                        demo.producer_profile
                            ?.username ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    producer.includes(search);


                const matchesStatus =
                    status === "all" ||
                    demo.status === status;


                const matchesVisibility =
                    visibility === "all" ||
                    demo.visibility === visibility;


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesVisibility
                );

            }
        );


    renderSongDemoList(
        filtered
    );
}

// ============================================================
// SONG DEMO STUDIO
// ============================================================

let nemawashiSongDemoAccess = false;
let nemawashiSongDemos = [];

// ------------------------------------------------------------
// CHECK SONG DEMO STUDIO ACCESS
// ------------------------------------------------------------

async function checkSongDemoStudioAccess() {

    try {

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "nemawashi_can_manage_song_demos"
        );

        if (error) {
            console.error(
                "Song Demo Studio access error:",
                error
            );

            return false;
        }

        return data === true;

    } catch (error) {

        console.error(
            "Song Demo Studio access error:",
            error
        );

        return false;
    }
}


// ------------------------------------------------------------
// ADD SIDEBAR SECTION
// ------------------------------------------------------------

function addSongDemoStudioNavigation() {

    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        return;
    }

    if (
        document.getElementById(
            "song-demo-studio-nav"
        )
    ) {
        return;
    }


    const group =
        document.createElement("div");

    group.className =
        "nav-group song-demo-studio-group";

    group.id =
        "song-demo-studio-nav";


    group.innerHTML = `

        <div class="nav-group-title song-demo-nav-title">
            ✦ SONG DEMO STUDIO
        </div>

        <button
            class="nav-item song-demo-nav-item"
            data-section="song-demos"
            type="button"
        >
            <span>♫</span>
            Demo Library
        </button>

        <button
            class="nav-item song-demo-nav-item"
            data-section="song-demo-create"
            type="button"
        >
            <span>＋</span>
            Create Demo
        </button>

        <button
            class="nav-item song-demo-nav-item"
            data-section="song-demo-polls"
            type="button"
        >
            <span>◉</span>
            Demo Polls
        </button>

        <button
            class="nav-item song-demo-nav-item"
            data-section="song-demo-reviews"
            type="button"
        >
            <span>✓</span>
            Poll Reviews
        </button>

    `;


    sidebar.appendChild(group);
}

// ------------------------------------------------------------
// INITIALIZE SONG DEMO STUDIO
// ------------------------------------------------------------

async function initializeSongDemoStudio() {

    nemawashiSongDemoAccess =
        await checkSongDemoStudioAccess();


    if (
        !nemawashiSongDemoAccess
    ) {
        return;
    }


    addSongDemoStudioNavigation();
}


// ============================================================
// START
// ============================================================

initializeDashboard();