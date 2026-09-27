const dashboardContent =
    document.getElementById("dashboard-content");

const sectionTitle =
    document.getElementById("section-title");

const sectionLabel =
    document.getElementById("section-label");

const userName =
    document.getElementById("user-name");

const userRole =
    document.getElementById("user-role");

const userAvatarLetter =
    document.getElementById("user-avatar-letter");

const signOutButton =
    document.getElementById("sign-out-button");


const sectionNames = {

    overview: "Overview",

    people: "People",

    organization: "Organization",

    permissions: "Permissions",

    notices: "Serashio Notices",

    banners: "Serashio Banners",

    "serashio-artists":
        "Serashio Artists",

    releases: "Releases",

    "kiki-posts":
        "KiKi Staff Posts",

    "kiki-profiles":
        "KiKi Profiles",

    "dm-orders":
        "DM Orders",

    "dm-coupons":
        "DM Coupons",

    "dm-entitlements":
        "DM Entitlements",

    auditions: "Auditions",

    applications: "Applications"

};


async function requireUser() {

    const {
        data: {
            user
        },
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href =
            "index.html";

        return null;

    }


    return user;

}


function renderOverview(user) {

    sectionLabel.textContent =
        "HRMNX ADMINISTRATION";

    sectionTitle.textContent =
        "Overview";


    dashboardContent.innerHTML = `

        <div class="page-intro">

            <h2>
                Welcome to Nemawashi.
            </h2>

            <p>
                Hrmnx Entertainment's
                internal administration workspace.
            </p>

        </div>


        <div class="stats-grid">

            <div class="stat-card">
                <span>
                    YOUR ACCOUNT
                </span>

                <strong>
                    Active
                </strong>
            </div>


            <div class="stat-card">
                <span>
                    SERASHIO
                </span>

                <strong>
                    —
                </strong>
            </div>


            <div class="stat-card">
                <span>
                    KIKI
                </span>

                <strong>
                    —
                </strong>
            </div>


            <div class="stat-card">
                <span>
                    HRMNX
                </span>

                <strong>
                    —
                </strong>
            </div>

        </div>


        <div class="module-grid">

            ${moduleCard(
                "✦",
                "Serashio",
                "Manage notices, banners, artists and releases.",
                "notices"
            )}

            ${moduleCard(
                "✎",
                "KiKi",
                "Manage staff posts, profiles and permissions.",
                "kiki-posts"
            )}

            ${moduleCard(
                "％",
                "Direct Messages",
                "Manage orders, coupons and DM entitlements.",
                "dm-orders"
            )}

            ${moduleCard(
                "○",
                "People",
                "Manage employee profiles and organization access.",
                "people"
            )}

            ${moduleCard(
                "☆",
                "Auditions",
                "Manage Hrmnx audition operations.",
                "auditions"
            )}

            ${moduleCard(
                "◆",
                "Permissions",
                "Control roles and access across Hrmnx.",
                "permissions"
            )}

        </div>

    `;

}


function moduleCard(
    icon,
    title,
    description,
    section
) {

    return `

        <button
            class="module-card"
            data-module="${section}"
            type="button"
            style="
                text-align:left;
                border:1px solid var(--border);
                font-family:inherit;
                cursor:pointer;
            "
        >

            <div class="module-icon">
                ${icon}
            </div>

            <h3>
                ${title}
            </h3>

            <p>
                ${description}
            </p>

        </button>

    `;

}


async function renderPlaceholder(section) {

    if (section === "people") {
        await renderPeople();
        return;
    }

    const content = document.getElementById("dashboard-content");

    content.innerHTML = `
        <div class="module-placeholder">
            <div class="placeholder-icon">✦</div>
            <h2>This management module is being connected</h2>
            <p>
                This section will be connected to the Hrmnx Supabase database.
            </p>
        </div>
    `;
}


/* =========================================================
   PEOPLE
   ========================================================= */

async function renderPeople() {

    const content = document.getElementById("dashboard-content");

    content.innerHTML = `
        <div class="module-header">
            <div>
                <div class="module-kicker">HRMNX</div>
                <h1>People</h1>
                <p>
                    Manage employees, staff accounts, roles and organization
                    assignments.
                </p>
            </div>

            <button
                class="primary-button"
                id="refresh-people"
            >
                Refresh
            </button>
        </div>

        <div class="people-toolbar">
            <div class="people-search">
                <span>⌕</span>
                <input
                    type="text"
                    id="people-search-input"
                    placeholder="Search people..."
                    autocomplete="off"
                >
            </div>

            <div class="people-count" id="people-count">
                Loading...
            </div>
        </div>

        <div id="people-list">
            <div class="people-loading">
                Loading people...
            </div>
        </div>
    `;

    document
        .getElementById("refresh-people")
        ?.addEventListener("click", loadPeople);

    document
        .getElementById("people-search-input")
        ?.addEventListener("input", filterPeople);

    await loadPeople();
}


let nemawashiPeople = [];


async function loadPeople() {

    const list = document.getElementById("people-list");

    if (!list) return;

    list.innerHTML = `
        <div class="people-loading">
            Loading people...
        </div>
    `;

    const { data, error } = await supabaseClient
        .from("employees")
        .select(`
            id,
            user_id,
            employee_number,
            job_title,
            active,
            company_id,
            created_at,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url,
                bio,
                is_staff,
                profile_type
            ),
            companies:company_id (
                id,
                name,
                slug
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Nemawashi people error:", error);

        list.innerHTML = `
            <div class="module-error">
                <strong>Could not load people</strong>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;

        return;
    }

    nemawashiPeople = data || [];

    updatePeopleCount(nemawashiPeople.length);

    renderPeopleList(nemawashiPeople);
}


function renderPeopleList(people) {

    const list = document.getElementById("people-list");

    if (!list) return;

    if (!people.length) {

        list.innerHTML = `
            <div class="people-empty">
                <div class="people-empty-icon">○</div>
                <h3>No employees found</h3>
                <p>
                    Employee accounts will appear here once they are added
                    to Nemawashi.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML = `
        <div class="people-table">

            <div class="people-table-head">
                <div>Person</div>
                <div>Company</div>
                <div>Job title</div>
                <div>Status</div>
            </div>

            ${people.map(person => {

                const profile = person.profiles;
                const company = person.companies;

                const displayName =
                    profile?.display_name ||
                    profile?.username ||
                    "Unnamed employee";

                const avatar = profile?.avatar_url;

                const avatarHTML = avatar
                    ? `
                        <img
                            src="${escapeAttribute(avatar)}"
                            alt=""
                            class="person-avatar"
                        >
                    `
                    : `
                        <div class="person-avatar person-avatar-placeholder">
                            ${escapeHtml(
                                displayName.charAt(0).toUpperCase()
                            )}
                        </div>
                    `;

                return `
                    <button
                        class="person-row"
                        data-person-id="${person.id}"
                    >

                        <div class="person-main">
                            ${avatarHTML}

                            <div>
                                <strong>
                                    ${escapeHtml(displayName)}
                                </strong>

                                <span>
                                    @${escapeHtml(
                                        profile?.username || "no-username"
                                    )}
                                </span>
                            </div>
                        </div>

                        <div class="person-company">
                            ${escapeHtml(
                                company?.name || "Unassigned"
                            )}
                        </div>

                        <div class="person-job">
                            ${escapeHtml(
                                person.job_title || "No job title"
                            )}
                        </div>

                        <div>
                            <span class="
                                person-status
                                ${person.active ? "active" : "inactive"}
                            ">
                                ${person.active ? "Active" : "Inactive"}
                            </span>
                        </div>

                    </button>
                `;

            }).join("")}

        </div>
    `;

    document
        .querySelectorAll(".person-row")
        .forEach(row => {

            row.addEventListener("click", () => {

                const personId =
                    row.dataset.personId;

                openPerson(personId);
            });

        });
}


function filterPeople() {

    const input =
        document.getElementById("people-search-input");

    if (!input) return;

    const query =
        input.value.trim().toLowerCase();

    if (!query) {

        renderPeopleList(nemawashiPeople);
        updatePeopleCount(nemawashiPeople.length);

        return;
    }

    const filtered =
        nemawashiPeople.filter(person => {

            const profile = person.profiles;
            const company = person.companies;

            return (
                profile?.display_name
                    ?.toLowerCase()
                    .includes(query)
                ||
                profile?.username
                    ?.toLowerCase()
                    .includes(query)
                ||
                company?.name
                    ?.toLowerCase()
                    .includes(query)
                ||
                person.job_title
                    ?.toLowerCase()
                    .includes(query)
                ||
                person.employee_number
                    ?.toLowerCase()
                    .includes(query)
            );

        });

    updatePeopleCount(filtered.length);

    renderPeopleList(filtered);
}


function updatePeopleCount(count) {

    const element =
        document.getElementById("people-count");

    if (!element) return;

    element.textContent =
        `${count} ${count === 1 ? "person" : "people"}`;
}


/* =========================================================
   PERSON DETAILS
   ========================================================= */

async function openPerson(personId) {

    const person =
        nemawashiPeople.find(
            item => String(item.id) === String(personId)
        );

    if (!person) return;

    const profile = person.profiles;
    const company = person.companies;

    const content =
        document.getElementById("dashboard-content");

    content.innerHTML = `
        <div class="person-detail">

            <button
                class="back-button"
                id="people-back"
            >
                ← Back to People
            </button>

            <div class="person-detail-header">

                <div class="person-detail-avatar">
                    ${
                        profile?.avatar_url
                        ?
                        `
                            <img
                                src="${escapeAttribute(
                                    profile.avatar_url
                                )}"
                                alt=""
                            >
                        `
                        :
                        `
                            ${
                                escapeHtml(
                                    (
                                        profile?.display_name ||
                                        "?"
                                    ).charAt(0).toUpperCase()
                                )
                            }
                        `
                    }
                </div>

                <div>
                    <div class="module-kicker">
                        EMPLOYEE
                    </div>

                    <h1>
                        ${escapeHtml(
                            profile?.display_name ||
                            "Unnamed employee"
                        )}
                    </h1>

                    <p>
                        @${escapeHtml(
                            profile?.username ||
                            "no-username"
                        )}
                    </p>
                </div>

            </div>


            <div class="person-detail-grid">

                <section class="detail-card">

                    <div class="detail-card-title">
                        Profile
                    </div>

                    <div class="detail-item">
                        <span>Display name</span>
                        <strong>
                            ${escapeHtml(
                                profile?.display_name || "—"
                            )}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <span>Username</span>
                        <strong>
                            ${
                                profile?.username
                                ?
                                "@" +
                                escapeHtml(profile.username)
                                :
                                "—"
                            }
                        </strong>
                    </div>

                    <div class="detail-item">
                        <span>Profile type</span>
                        <strong>
                            ${escapeHtml(
                                profile?.profile_type || "user"
                            )}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <span>Staff account</span>
                        <strong>
                            ${profile?.is_staff ? "Yes" : "No"}
                        </strong>
                    </div>

                </section>


                <section class="detail-card">

                    <div class="detail-card-title">
                        Employment
                    </div>

                    <div class="detail-item">
                        <span>Company</span>
                        <strong>
                            ${escapeHtml(
                                company?.name || "Unassigned"
                            )}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <span>Employee number</span>
                        <strong>
                            ${escapeHtml(
                                person.employee_number || "—"
                            )}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <span>Job title</span>
                        <strong>
                            ${escapeHtml(
                                person.job_title || "—"
                            )}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <span>Status</span>
                        <strong>
                            ${person.active ? "Active" : "Inactive"}
                        </strong>
                    </div>

                </section>

            </div>


            <section class="detail-card">

                <div class="detail-card-title">
                    Roles
                </div>

                <div id="person-roles">
                    Loading roles...
                </div>

            </section>


            <section class="detail-card">

                <div class="detail-card-title">
                    Artist assignments
                </div>

                <div id="person-artists">
                    Loading artist assignments...
                </div>

            </section>

        </div>
    `;

    document
        .getElementById("people-back")
        ?.addEventListener("click", () => {
            renderPeople();
        });

    await loadPersonRoles(person.id);
    await loadPersonArtists(person.id);
}


async function loadPersonRoles(employeeId) {

    const container =
        document.getElementById("person-roles");

    if (!container) return;

    const { data, error } =
        await supabaseClient
            .from("employee_roles")
            .select(`
                id,
                roles (
                    id,
                    name,
                    slug,
                    description
                )
            `)
            .eq("employee_id", employeeId);

    if (error) {

        console.error(
            "Nemawashi roles error:",
            error
        );

        container.innerHTML = `
            <div class="module-error">
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }

    if (!data?.length) {

        container.innerHTML = `
            <div class="detail-empty">
                No roles assigned.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="assignment-list">

            ${data.map(item => `
                <div class="assignment-item">

                    <div>
                        <strong>
                            ${escapeHtml(
                                item.roles?.name || "Unknown role"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                item.roles?.description || ""
                            )}
                        </span>
                    </div>

                </div>
            `).join("")}

        </div>
    `;
}


async function loadPersonArtists(employeeId) {

    const container =
        document.getElementById("person-artists");

    if (!container) return;

    const { data, error } =
        await supabaseClient
            .from("employee_artists")
            .select(`
                id,
                artists (
                    id,
                    name,
                    slug,
                    avatar_url
                )
            `)
            .eq("employee_id", employeeId);

    if (error) {

        console.error(
            "Nemawashi artist assignment error:",
            error
        );

        container.innerHTML = `
            <div class="module-error">
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }

    if (!data?.length) {

        container.innerHTML = `
            <div class="detail-empty">
                No artist assignments.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="assignment-list">

            ${data.map(item => `
                <div class="assignment-item">

                    <div>
                        <strong>
                            ${escapeHtml(
                                item.artists?.name ||
                                "Unknown artist"
                            )}
                        </strong>

                        <span>
                            @${escapeHtml(
                                item.artists?.slug || ""
                            )}
                        </span>
                    </div>

                </div>
            `).join("")}

        </div>
    `;
}


/* =========================================================
   SAFETY HELPERS
   ========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHtml(value);
}


document.addEventListener(
    "click",
    function (event) {

        const navigation =
            event.target.closest(
                "[data-section]"
            );


        if (navigation) {

            document
                .querySelectorAll(
                    ".nav-item"
                )
                .forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


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


        const module =
            event.target.closest(
                "[data-module]"
            );


        if (module) {

            openSection(
                module.dataset.module
            );

        }

    }
);


signOutButton.addEventListener(
    "click",
    async function () {

        await supabaseClient.auth.signOut();

        window.location.href =
            "index.html";

    }
);


async function initializeDashboard() {

    const user =
        await requireUser();


    if (!user) {
        return;
    }


    window.nemawashiUser = user;


    userName.textContent =
        user.email || "Hrmnx employee";


    userAvatarLetter.textContent =
        (
            user.email ||
            "H"
        )
        .charAt(0)
        .toUpperCase();


    userRole.textContent =
        "Authenticated account";


    renderOverview(user);

}


initializeDashboard();
