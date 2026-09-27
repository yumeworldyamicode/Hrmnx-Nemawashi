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
