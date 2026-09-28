// dashboard.js

let currentUser = null;
let currentEmployee = null;
let currentSection = "overview";

let nemawashiPeople = [];
let nemawashiCompanies = [];
let nemawashiRoles = [];

let songDemoStudioInitialized = false;
let songDemoStudioAccess = false;

document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {
    try {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            console.error("Failed to get user:", error);
            showDashboardError("Unable to load your account.");
            return;
        }

        if (!user) {
            window.location.href = "index.html";
            return;
        }

        currentUser = user;

        await loadCurrentEmployee();

        await initializeSongDemoStudio();

        renderOverview(user);

    } catch (error) {
        console.error("Dashboard initialization failed:", error);
        showDashboardError(
            error?.message || "Unable to initialize dashboard."
        );
    }
}

async function loadCurrentEmployee() {
    if (!currentUser?.id) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from("employees")
        .select(`
            id,
            user_id,
            company_id,
            employee_number,
            job_title,
            active,
            created_at,
            companies (
                id,
                name,
                slug
            )
        `)
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (error) {
        console.error("Failed to load employee:", error);
        return null;
    }

    currentEmployee = data || null;

    return currentEmployee;
}

function showDashboardError(message) {
    const content = document.querySelector(".dashboard-content");

    if (!content) {
        return;
    }

    content.innerHTML = `
        <div class="empty-state">
            <h2>Something went wrong</h2>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function getEmployeeDisplayName(employee) {
    if (!employee) {
        return "Employee";
    }

    if (employee.display_name) {
        return employee.display_name;
    }

    if (employee.username) {
        return employee.username;
    }

    if (employee.employee_number) {
        return employee.employee_number;
    }

    return "Employee";
}

function getInitials(name) {
    if (!name) {
        return "?";
    }

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}

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

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) {
        return "—";
    }

    const units = ["B", "KB", "MB", "GB"];

    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
    if (
        seconds === null ||
        seconds === undefined ||
        Number.isNaN(Number(seconds))
    ) {
        return "—";
    }

    const total = Math.max(0, Math.floor(Number(seconds)));

    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function moduleCard(title, description, module, icon = "✦") {
    return `
        <button
            class="dashboard-module-card"
            type="button"
            data-module="${escapeAttribute(module)}"
        >
            <span class="dashboard-module-icon">
                ${escapeHtml(icon)}
            </span>

            <span class="dashboard-module-text">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(description)}</span>
            </span>

            <span class="dashboard-module-arrow">
                →
            </span>
        </button>
    `;
}

function renderOverview(user) {
    const content = document.querySelector(".dashboard-content");

    if (!content) {
        return;
    }

    const employeeName =
        currentEmployee?.display_name ||
        currentEmployee?.username ||
        currentEmployee?.employee_number ||
        user?.email?.split("@")[0] ||
        "Employee";

    content.innerHTML = `
        <section class="dashboard-welcome">
            <div class="welcome-text">
                <span class="eyebrow">
                    HRMNX / NEMAWASHI
                </span>

                <h1>
                    Welcome back, ${escapeHtml(employeeName)}.
                </h1>

                <p>
                    Manage your HRMNX workspace, people, permissions,
                    Serashio content, KiKi, and internal tools.
                </p>
            </div>
        </section>

        <section class="dashboard-grid">
            <div class="dashboard-grid-column">
                <div class="dashboard-section-heading">
                    <span class="eyebrow">HRMNX</span>
                    <h2>People & organization</h2>
                </div>

                <div class="dashboard-module-grid">
                    ${moduleCard(
                        "People",
                        "View and manage HRMNX employees.",
                        "people",
                        "◎"
                    )}

                    ${moduleCard(
                        "Organization",
                        "Browse companies and their employees.",
                        "organization",
                        "⌂"
                    )}

                    ${moduleCard(
                        "Permissions",
                        "Manage internal roles and assignments.",
                        "permissions",
                        "◈"
                    )}
                </div>
            </div>

            <div class="dashboard-grid-column">
                <div class="dashboard-section-heading">
                    <span class="eyebrow">SERASHIO</span>
                    <h2>Content management</h2>
                </div>

                <div class="dashboard-module-grid">
                    ${moduleCard(
                        "Notices",
                        "Manage Serashio notices.",
                        "notices",
                        "!"
                    )}

                    ${moduleCard(
                        "Banners",
                        "Manage Serashio promotional banners.",
                        "banners",
                        "▣"
                    )}

                    ${moduleCard(
                        "Artists",
                        "Manage artist profiles and content.",
                        "artists",
                        "♢"
                    )}
                </div>
            </div>

            <div class="dashboard-grid-column">
                <div class="dashboard-section-heading">
                    <span class="eyebrow">KIKI</span>
                    <h2>Community management</h2>
                </div>

                <div class="dashboard-module-grid">
                    ${moduleCard(
                        "Staff Posts",
                        "Manage KiKi staff content.",
                        "kiki-posts",
                        "✦"
                    )}

                    ${moduleCard(
                        "Profiles",
                        "Manage KiKi profiles.",
                        "kiki-profiles",
                        "◎"
                    )}
                </div>
            </div>
        </section>
    `;
}

function renderPlaceholder(title, description = "") {
    const content = document.querySelector(".dashboard-content");

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="dashboard-placeholder">
            <span class="eyebrow">NEMAWASHI</span>

            <h1>
                ${escapeHtml(title)}
            </h1>

            ${
                description
                    ? `<p>${escapeHtml(description)}</p>`
                    : ""
            }
        </section>
    `;
}

async function openSection(section) {
    currentSection = section;

    switch (section) {
        case "overview":
            renderOverview(currentUser);
            break;

        case "people":
            renderPeople();
            break;

        case "organization":
            renderOrganization();
            break;

        case "permissions":
            renderPermissions();
            break;

        case "notices":
            renderSerashioNotices();
            break;

        case "banners":
            renderSerashioBanners();
            break;

        case "artists":
            renderSerashioArtists();
            break;

        case "kiki-posts":
            renderPlaceholder(
                "KiKi Staff Posts",
                "KiKi staff post management will appear here."
            );
            break;

        case "kiki-profiles":
            renderPlaceholder(
                "KiKi Profiles",
                "KiKi profile management will appear here."
            );
            break;

        case "song-demo-library":
            await renderSongDemoLibrary();
            break;

        case "song-demo-create":
            renderSongDemoCreate();
            break;

        case "song-demo-polls":
            renderSongDemoPolls();
            break;

        case "song-demo-reviews":
            renderSongDemoReviews();
            break;

        default:
            renderOverview(currentUser);
            break;
    }

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.section === section
            );
        });
}

document.addEventListener("click", async function(event) {
    const sectionButton =
        event.target.closest("[data-section]");

    if (sectionButton) {
        const section = sectionButton.dataset.section;

        if (section) {
            await openSection(section);
        }

        return;
    }

    const moduleButton =
        event.target.closest("[data-module]");

    if (moduleButton) {
        const module = moduleButton.dataset.module;

        if (module === "people") {
            await openSection("people");
            return;
        }

        if (module === "organization") {
            await openSection("organization");
            return;
        }

        if (module === "permissions") {
            await openSection("permissions");
            return;
        }

        if (module === "notices") {
            await openSection("notices");
            return;
        }

        if (module === "banners") {
            await openSection("banners");
            return;
        }

        if (module === "artists") {
            await openSection("artists");
            return;
        }

        if (module === "kiki-posts") {
            await openSection("kiki-posts");
            return;
        }

        if (module === "kiki-profiles") {
            await openSection("kiki-profiles");
            return;
        }
    }

    const personButton =
        event.target.closest("[data-person-id]");

    if (personButton) {
        const personId = personButton.dataset.personId;

        if (personId) {
            await openPerson(personId);
        }

        return;
    }

    const companyButton =
        event.target.closest("[data-company-id]");

    if (companyButton) {
        const companyId = companyButton.dataset.companyId;

        if (companyId) {
            await openCompany(companyId);
        }

        return;
    }

    const roleButton =
        event.target.closest("[data-role-id]");

    if (roleButton) {
        const roleId = roleButton.dataset.roleId;

        if (roleId) {
            await openRole(roleId);
        }

        return;
    }

    if (event.target.closest("#sign-out-button")) {
        await signOut();
        return;
    }

    if (event.target.closest("#person-edit-button")) {
        const employeeId =
            event.target.closest("#person-edit-button")
                .dataset.employeeId;

        if (employeeId) {
            const person =
                nemawashiPeople.find(
                    item => String(item.id) === String(employeeId)
                );

            if (person) {
                openPersonEditor(person);
            }
        }

        return;
    }

    if (event.target.closest("#person-edit-cancel")) {
        const employeeId =
            event.target.closest("#person-edit-cancel")
                .dataset.employeeId;

        if (employeeId) {
            await openPerson(employeeId);
        }

        return;
    }

    if (event.target.closest("#person-save-button")) {
        const employeeId =
            event.target.closest("#person-save-button")
                .dataset.employeeId;

        if (employeeId) {
            await savePersonChanges(employeeId);
        }

        return;
    }

    if (event.target.closest("#organization-back")) {
        await openSection("organization");
        return;
    }

    if (event.target.closest("#people-back")) {
        await openSection("people");
        return;
    }

    if (event.target.closest("#permissions-back")) {
        await openSection("permissions");
        return;
    }

    if (event.target.closest("#company-back")) {
        await openSection("organization");
        return;
    }

    if (event.target.closest("#role-back")) {
        await openSection("permissions");
        return;
    }

    if (event.target.closest("#artist-back")) {
        await openSection("artists");
        return;
    }

    if (event.target.closest("#artist-save-button")) {
        const artistId =
            event.target.closest("#artist-save-button")
                .dataset.artistId;

        await saveArtist(artistId || null);
        return;
    }

    if (event.target.closest("#artist-delete-button")) {
        const artistId =
            event.target.closest("#artist-delete-button")
                .dataset.artistId;

        if (artistId) {
            await deleteArtist(artistId);
        }

        return;
    }

    if (event.target.closest("#artist-new-button")) {
        openArtistEditor(null);
        return;
    }

    if (event.target.closest("#notice-save-button")) {
        await saveSerashioNotice();
        return;
    }

    if (event.target.closest("#notice-new-button")) {
        openSerashioNoticeEditor(null);
        return;
    }

    if (event.target.closest("#notice-delete-button")) {
        const noticeId =
            event.target.closest("#notice-delete-button")
                .dataset.noticeId;

        if (noticeId) {
            await deleteSerashioNotice(noticeId);
        }

        return;
    }

    if (event.target.closest("#banner-save-button")) {
        await saveSerashioBanner();
        return;
    }

    if (event.target.closest("#banner-new-button")) {
        openSerashioBannerEditor(null);
        return;
    }

    if (event.target.closest("#banner-delete-button")) {
        const bannerId =
            event.target.closest("#banner-delete-button")
                .dataset.bannerId;

        if (bannerId) {
            await deleteSerashioBanner(bannerId);
        }

        return;
    }

    if (event.target.closest("#role-assign-button")) {
        const roleId =
            event.target.closest("#role-assign-button")
                .dataset.roleId;

        const select =
            document.querySelector("#role-employee-select");

        if (roleId && select?.value) {
            await assignEmployeeToRole(
                roleId,
                select.value
            );
        }

        return;
    }

    const removeRoleButton =
        event.target.closest("[data-remove-role-employee]");

    if (removeRoleButton) {
        const roleId =
            removeRoleButton.dataset.roleId;

        const employeeId =
            removeRoleButton.dataset.removeRoleEmployee;

        if (roleId && employeeId) {
            await removeEmployeeFromRole(
                roleId,
                employeeId
            );
        }

        return;
    }

    /*
     * SONG DEMO STUDIO
     */

    if (event.target.closest("#song-demo-start-lyrics")) {
        await startLyricsDemo();
        return;
    }

    if (event.target.closest("#song-demo-start-song-base")) {
        await startSongBaseDemo();
        return;
    }

    if (event.target.closest("#song-demo-add-section")) {
        addSongDemoCustomSection();
        return;
    }

    const moveSectionButton =
        event.target.closest("[data-song-demo-move]");

    if (moveSectionButton) {
        const direction =
            moveSectionButton.dataset.songDemoMove;

        const index =
            Number(
                moveSectionButton.dataset.sectionIndex
            );

        if (!Number.isNaN(index)) {
            moveSongDemoSection(index, direction);
        }

        return;
    }

    if (event.target.closest("#song-demo-save-lyrics")) {
        await saveSongDemoLyrics();
        return;
    }

    if (event.target.closest("#song-demo-save-base")) {
        await saveSongDemoBase();
        return;
    }

    if (event.target.closest("#song-demo-wizard-back")) {
        renderSongDemoCreate();
        return;
    }

    if (event.target.closest("#song-demo-library-back")) {
        await openSection("song-demo-library");
        return;
    }

    if (event.target.closest("#song-demo-refresh")) {
        await renderSongDemoLibrary();
        return;
    }

    const demoFilterButton =
        event.target.closest("[data-song-demo-filter]");

    if (demoFilterButton) {
        const filter =
            demoFilterButton.dataset.songDemoFilter;

        filterSongDemos(filter);
        return;
    }

    const songDemoCard =
        event.target.closest("[data-song-demo-id]");

    if (
        songDemoCard &&
        !event.target.closest("button")
    ) {
        const demoId =
            songDemoCard.dataset.songDemoId;

        if (demoId) {
            await openSongDemo(demoId);
        }

        return;
    }
});

async function signOut() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error("Sign out failed:", error);
    }

    window.location.href = "index.html";
}

/* =========================================================
   PEOPLE
   ========================================================= */

async function renderPeople() {
    const content =
        document.querySelector(".dashboard-content");

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        HRMNX
                    </span>

                    <h1>
                        People
                    </h1>

                    <p>
                        Manage HRMNX employees and their
                        internal information.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="people-back"
                    >
                        ← Dashboard
                    </button>
                </div>
            </div>

            <div class="people-toolbar">
                <div class="people-search">
                    <input
                        type="search"
                        id="people-search-input"
                        placeholder="Search employees..."
                        autocomplete="off"
                    >
                </div>

                <div
                    class="people-count"
                    id="people-count"
                >
                    Loading...
                </div>
            </div>

            <div
                class="people-list"
                id="people-list"
            >
                <div class="empty-state">
                    Loading employees...
                </div>
            </div>
        </section>
    `;

    const searchInput =
        document.querySelector("#people-search-input");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterPeople
        );
    }

    await loadPeople();
}

async function loadPeople() {
    const list =
        document.querySelector("#people-list");

    if (!list) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("employees")
        .select(`
            id,
            user_id,
            company_id,
            employee_number,
            job_title,
            active,
            created_at,
            companies (
                id,
                name,
                slug
            )
        `)
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error("Failed to load people:", error);

        list.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load employees</h3>
                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiPeople = data || [];

    await attachPeopleProfiles(nemawashiPeople);

    renderPeopleList(nemawashiPeople);
}

async function attachPeopleProfiles(people) {
    const userIds = people
        .map(person => person.user_id)
        .filter(Boolean);

    if (!userIds.length) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            username,
            display_name,
            avatar_url
        `)
        .in("id", userIds);

    if (error) {
        console.warn(
            "Unable to load employee profiles:",
            error
        );

        return;
    }

    const profileMap = new Map(
        (data || []).map(profile => [
            profile.id,
            profile
        ])
    );

    people.forEach(person => {
        const profile =
            profileMap.get(person.user_id);

        if (profile) {
            person.username =
                profile.username || null;

            person.display_name =
                profile.display_name || null;

            person.avatar_url =
                profile.avatar_url || null;
        }
    });
}

function renderPeopleList(people) {
    const list =
        document.querySelector("#people-list");

    if (!list) {
        return;
    }

    const count =
        document.querySelector("#people-count");

    if (count) {
        count.textContent =
            `${people.length} employee${people.length === 1 ? "" : "s"}`;
    }

    if (!people.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No employees found</h3>
                <p>
                    There are no employees matching
                    your search.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML = people
        .map(person => {
            const name =
                person.display_name ||
                person.username ||
                person.employee_number ||
                "Employee";

            const company =
                person.companies?.name ||
                "No company";

            const avatar =
                person.avatar_url;

            return `
                <button
                    type="button"
                    class="person-card"
                    data-person-id="${escapeAttribute(person.id)}"
                >
                    <span class="person-avatar">
                        ${
                            avatar
                                ? `
                                    <img
                                        src="${escapeAttribute(avatar)}"
                                        alt=""
                                    >
                                `
                                : `
                                    ${escapeHtml(
                                        getInitials(name)
                                    )}
                                `
                        }
                    </span>

                    <span class="person-main">
                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            ${
                                escapeHtml(
                                    person.job_title ||
                                    "No job title"
                                )
                            }
                        </span>
                    </span>

                    <span class="person-meta">
                        <span>
                            ${escapeHtml(company)}
                        </span>

                        <span>
                            ${
                                person.active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </span>
                    </span>

                    <span class="person-arrow">
                        →
                    </span>
                </button>
            `;
        })
        .join("");
}

function filterPeople() {
    const input =
        document.querySelector(
            "#people-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderPeopleList(nemawashiPeople);
        return;
    }

    const filtered =
        nemawashiPeople.filter(person => {
            const searchable = [
                person.display_name,
                person.username,
                person.employee_number,
                person.job_title,
                person.companies?.name,
                person.companies?.slug
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(query);
        });

    renderPeopleList(filtered);
}

async function openPerson(employeeId) {
    const content =
        document.querySelector(".dashboard-content");

    if (!content) {
        return;
    }

    const person =
        nemawashiPeople.find(
            item =>
                String(item.id) ===
                String(employeeId)
        );

    if (!person) {
        await loadPeople();

        const reloadedPerson =
            nemawashiPeople.find(
                item =>
                    String(item.id) ===
                    String(employeeId)
            );

        if (!reloadedPerson) {
            renderPlaceholder(
                "Employee not found"
            );

            return;
        }

        return openPerson(reloadedPerson.id);
    }

    const name =
        person.display_name ||
        person.username ||
        person.employee_number ||
        "Employee";

    content.innerHTML = `
        <section class="admin-module person-detail">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        HRMNX / PEOPLE
                    </span>

                    <h1>
                        ${escapeHtml(name)}
                    </h1>

                    <p>
                        Employee profile and internal
                        organization information.
                    </p>
                </div>

                <div class="person-detail-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="people-back"
                    >
                        ← People
                    </button>

                    <button
                        type="button"
                        class="secondary-button"
                        id="person-edit-button"
                        data-employee-id="${escapeAttribute(person.id)}"
                    >
                        Edit employee
                    </button>
                </div>
            </div>

            <div class="person-profile-card">
                <div class="person-profile-avatar">
                    ${
                        person.avatar_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        person.avatar_url
                                    )}"
                                    alt=""
                                >
                            `
                            : `
                                ${escapeHtml(
                                    getInitials(name)
                                )}
                            `
                    }
                </div>

                <div class="person-profile-main">
                    <h2>
                        ${escapeHtml(name)}
                    </h2>

                    ${
                        person.username
                            ? `
                                <span class="person-username">
                                    @${escapeHtml(
                                        person.username
                                    )}
                                </span>
                            `
                            : ""
                    }

                    <div class="person-profile-fields">
                        <div>
                            <span>
                                Employee number
                            </span>

                            <strong>
                                ${
                                    escapeHtml(
                                        person.employee_number ||
                                        "—"
                                    )
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Job title
                            </span>

                            <strong>
                                ${
                                    escapeHtml(
                                        person.job_title ||
                                        "—"
                                    )
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Company
                            </span>

                            <strong>
                                ${
                                    escapeHtml(
                                        person.companies?.name ||
                                        "—"
                                    )
                                }
                            </strong>
                        </div>

                        <div>
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

                        <div>
                            <span>
                                Joined
                            </span>

                            <strong>
                                ${formatDate(
                                    person.created_at
                                )}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="person-detail-grid">
                <section class="person-detail-panel">
                    <div class="person-detail-panel-heading">
                        <span class="eyebrow">
                            ROLES
                        </span>

                        <h2>
                            Permissions
                        </h2>
                    </div>

                    <div id="person-roles">
                        Loading roles...
                    </div>
                </section>

                <section class="person-detail-panel">
                    <div class="person-detail-panel-heading">
                        <span class="eyebrow">
                            ARTISTS
                        </span>

                        <h2>
                            Artist access
                        </h2>
                    </div>

                    <div id="person-artists">
                        Loading artist access...
                    </div>
                </section>
            </div>

            <div id="person-edit-section"></div>
        </section>
    `;

    await loadPersonRoles(person.id);
    await loadPersonArtists(person.id);
}

async function loadPersonRoles(employeeId) {
    const container =
        document.querySelector("#person-roles");

    if (!container) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("employee_roles")
        .select(`
            id,
            role_id,
            roles (
                id,
                name,
                slug
            )
        `)
        .eq("employee_id", employeeId);

    if (error) {
        console.error(
            "Failed to load employee roles:",
            error
        );

        container.innerHTML = `
            <div class="inline-error">
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

    container.innerHTML = data
        .map(item => `
            <div class="role-pill">
                <strong>
                    ${escapeHtml(
                        item.roles?.name ||
                        item.roles?.slug ||
                        "Role"
                    )}
                </strong>

                ${
                    item.roles?.slug
                        ? `
                            <span>
                                ${escapeHtml(
                                    item.roles.slug
                                )}
                            </span>
                        `
                        : ""
                }
            </div>
        `)
        .join("");
}

async function loadPersonArtists(employeeId) {
    const container =
        document.querySelector("#person-artists");

    if (!container) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("employee_artists")
        .select(`
            id,
            artist_id,
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
            "Failed to load employee artists:",
            error
        );

        container.innerHTML = `
            <div class="inline-error">
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }

    if (!data?.length) {
        container.innerHTML = `
            <div class="detail-empty">
                No artist access assigned.
            </div>
        `;

        return;
    }

    container.innerHTML = data
        .map(item => `
            <div class="artist-access-pill">
                ${
                    item.artists?.avatar_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    item.artists.avatar_url
                                )}"
                                alt=""
                            >
                        `
                        : ""
                }

                <span>
                    ${escapeHtml(
                        item.artists?.name ||
                        "Artist"
                    )}
                </span>
            </div>
        `)
        .join("");
}

/* =========================================================
   PERSON EDITOR
   ========================================================= */

function openPersonEditor(person) {
    const container =
        document.querySelector(
            "#person-edit-section"
        );

    if (!container || !person) {
        return;
    }

    container.innerHTML = `
        <section class="person-edit-panel">
            <div class="person-detail-panel-heading">
                <span class="eyebrow">
                    EDIT EMPLOYEE
                </span>

                <h2>
                    Employee information
                </h2>
            </div>

            <div class="person-edit-form">
                <label class="person-edit-field">
                    <span>
                        Employee number
                    </span>

                    <input
                        type="text"
                        id="person-edit-number"
                        value="${escapeAttribute(
                            person.employee_number || ""
                        )}"
                    >
                </label>

                <label class="person-edit-field">
                    <span>
                        Job title
                    </span>

                    <input
                        type="text"
                        id="person-edit-title"
                        value="${escapeAttribute(
                            person.job_title || ""
                        )}"
                    >
                </label>

                <label class="person-edit-field">
                    <span>
                        Company
                    </span>

                    <select id="person-edit-company">
                        <option value="">
                            Loading companies...
                        </option>
                    </select>
                </label>

                <label class="person-edit-checkbox">
                    <input
                        type="checkbox"
                        id="person-edit-active"
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
            </div>

            <div
                class="person-edit-message"
                id="person-edit-message"
            ></div>

            <div class="person-edit-actions">
                <button
                    type="button"
                    class="secondary-button"
                    id="person-edit-cancel"
                    data-employee-id="${escapeAttribute(person.id)}"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="person-save-button"
                    id="person-save-button"
                    data-employee-id="${escapeAttribute(person.id)}"
                >
                    Save changes
                </button>
            </div>
        </section>
    `;

    loadEditCompanies(person.company_id);
}

async function loadEditCompanies(selectedCompanyId) {
    const select =
        document.querySelector(
            "#person-edit-company"
        );

    if (!select) {
        return;
    }

    if (!nemawashiCompanies.length) {
        const { data, error } =
            await supabaseClient
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
            console.error(
                "Failed to load companies:",
                error
            );

            select.innerHTML = `
                <option value="">
                    Unable to load companies
                </option>
            `;

            return;
        }

        nemawashiCompanies = data || [];
    }

    select.innerHTML = `
        <option value="">
            No company
        </option>

        ${nemawashiCompanies
            .map(company => `
                <option
                    value="${escapeAttribute(company.id)}"
                    ${
                        String(company.id) ===
                        String(selectedCompanyId)
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(company.name)}
                </option>
            `)
            .join("")}
    `;
}

async function savePersonChanges(employeeId) {
    const message =
        document.querySelector(
            "#person-edit-message"
        );

    const button =
        document.querySelector(
            "#person-save-button"
        );

    const employeeNumber =
        document.querySelector(
            "#person-edit-number"
        )?.value.trim() || null;

    const jobTitle =
        document.querySelector(
            "#person-edit-title"
        )?.value.trim() || null;

    const companyId =
        document.querySelector(
            "#person-edit-company"
        )?.value || null;

    const active =
        document.querySelector(
            "#person-edit-active"
        )?.checked || false;

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    if (message) {
        message.textContent = "";
        message.className =
            "person-edit-message";
    }

    const { error } =
        await supabaseClient
            .from("employees")
            .update({
                employee_number: employeeNumber,
                job_title: jobTitle,
                company_id: companyId || null,
                active
            })
            .eq("id", employeeId);

    if (error) {
        console.error(
            "Failed to save employee:",
            error
        );

        if (message) {
            message.textContent =
                error.message;

            message.classList.add(
                "error"
            );
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                "Save changes";
        }

        return;
    }

    const localPerson =
        nemawashiPeople.find(
            item =>
                String(item.id) ===
                String(employeeId)
        );

    if (localPerson) {
        localPerson.employee_number =
            employeeNumber;

        localPerson.job_title =
            jobTitle;

        localPerson.company_id =
            companyId || null;

        localPerson.active =
            active;

        localPerson.companies =
            nemawashiCompanies.find(
                company =>
                    String(company.id) ===
                    String(companyId)
            ) || null;
    }

    await openPerson(employeeId);
}

/* =========================================================
   ORGANIZATION
   ========================================================= */

async function renderOrganization() {
    const content =
        document.querySelector(".dashboard-content");

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module organization-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        HRMNX
                    </span>

                    <h1>
                        Organization
                    </h1>

                    <p>
                        Browse HRMNX companies and
                        their employees.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="organization-back"
                    >
                        ← Dashboard
                    </button>
                </div>
            </div>

            <div class="organization-toolbar">
                <div class="organization-search">
                    <input
                        type="search"
                        id="organization-search-input"
                        placeholder="Search companies..."
                        autocomplete="off"
                    >
                </div>

                <div
                    class="organization-count"
                    id="organization-count"
                >
                    Loading...
                </div>
            </div>

            <div
                class="organization-list"
                id="organization-list"
            >
                <div class="empty-state">
                    Loading companies...
                </div>
            </div>
        </section>
    `;

    const searchInput =
        document.querySelector(
            "#organization-search-input"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterCompanies
        );
    }

    await loadCompanies();
}

async function loadCompanies() {
    const list =
        document.querySelector(
            "#organization-list"
        );

    if (!list) {
        return;
    }

    const { data, error } =
        await supabaseClient
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
        console.error(
            "Failed to load companies:",
            error
        );

        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    Unable to load companies
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiCompanies = data || [];

    await loadCompanyEmployeeCounts();

    renderCompanyList(
        nemawashiCompanies
    );
}

async function loadCompanyEmployeeCounts() {
    if (!nemawashiCompanies.length) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("employees")
            .select(`
                id,
                company_id
            `);

    if (error) {
        console.warn(
            "Unable to load company employee counts:",
            error
        );

        nemawashiCompanies.forEach(
            company => {
                company.employee_count = 0;
            }
        );

        return;
    }

    const counts = {};

    (data || []).forEach(employee => {
        const key =
            String(employee.company_id);

        counts[key] =
            (counts[key] || 0) + 1;
    });

    nemawashiCompanies.forEach(
        company => {
            company.employee_count =
                counts[String(company.id)] || 0;
        }
    );
}

function renderCompanyList(companies) {
    const list =
        document.querySelector(
            "#organization-list"
        );

    if (!list) {
        return;
    }

    updateCompanyCount(
        companies.length
    );

    if (!companies.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No companies found
                </h3>

                <p>
                    Try another search.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML = companies
        .map(company => `
            <button
                type="button"
                class="company-card"
                data-company-id="${escapeAttribute(company.id)}"
            >
                <span class="company-card-icon">
                    ${escapeHtml(
                        company.name
                            ?.charAt(0)
                            ?.toUpperCase() || "C"
                    )}
                </span>

                <span class="company-card-main">
                    <strong>
                        ${escapeHtml(company.name)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            company.slug || ""
                        )}
                    </span>
                </span>

                <span class="company-card-count">
                    ${
                        company.employee_count || 0
                    }
                    employee${
                        company.employee_count === 1
                            ? ""
                            : "s"
                    }
                </span>

                <span class="company-card-arrow">
                    →
                </span>
            </button>
        `)
        .join("");
}

function filterCompanies() {
    const input =
        document.querySelector(
            "#organization-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderCompanyList(
            nemawashiCompanies
        );

        return;
    }

    const filtered =
        nemawashiCompanies.filter(
            company => {
                return [
                    company.name,
                    company.slug
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(query);
            }
        );

    renderCompanyList(filtered);
}

function updateCompanyCount(count) {
    const element =
        document.querySelector(
            "#organization-count"
        );

    if (!element) {
        return;
    }

    element.textContent =
        `${count} compan${count === 1 ? "y" : "ies"}`;
}

async function openCompany(companyId) {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    const company =
        nemawashiCompanies.find(
            item =>
                String(item.id) ===
                String(companyId)
        );

    if (!company) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module company-detail">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        HRMNX / ORGANIZATION
                    </span>

                    <h1>
                        ${escapeHtml(company.name)}
                    </h1>

                    <p>
                        ${escapeHtml(
                            company.slug || ""
                        )}
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="company-back"
                    >
                        ← Organization
                    </button>
                </div>
            </div>

            <div class="company-detail-summary">
                <div>
                    <span>
                        Employees
                    </span>

                    <strong>
                        ${
                            company.employee_count || 0
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Slug
                    </span>

                    <strong>
                        ${
                            escapeHtml(
                                company.slug || "—"
                            )
                        }
                    </strong>
                </div>
            </div>

            <div class="company-employees-section">
                <div class="person-detail-panel-heading">
                    <span class="eyebrow">
                        PEOPLE
                    </span>

                    <h2>
                        Employees
                    </h2>
                </div>

                <div
                    class="people-list"
                    id="company-employees"
                >
                    Loading employees...
                </div>
            </div>
        </section>
    `;

    await loadCompanyEmployees(companyId);
}

async function loadCompanyEmployees(companyId) {
    const container =
        document.querySelector(
            "#company-employees"
        );

    if (!container) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                company_id,
                employee_number,
                job_title,
                active,
                created_at
            `)
            .eq("company_id", companyId)
            .order("created_at", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load company employees:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">
                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    await attachPeopleProfiles(data || []);

    if (!data?.length) {
        container.innerHTML = `
            <div class="detail-empty">
                No employees assigned to this company.
            </div>
        `;

        return;
    }

    container.innerHTML =
        data.map(person => {
            const name =
                person.display_name ||
                person.username ||
                person.employee_number ||
                "Employee";

            return `
                <button
                    type="button"
                    class="person-card"
                    data-person-id="${escapeAttribute(person.id)}"
                >
                    <span class="person-avatar">
                        ${
                            person.avatar_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            person.avatar_url
                                        )}"
                                        alt=""
                                    >
                                `
                                : `
                                    ${escapeHtml(
                                        getInitials(name)
                                    )}
                                `
                        }
                    </span>

                    <span class="person-main">
                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            ${
                                escapeHtml(
                                    person.job_title ||
                                    "No job title"
                                )
                            }
                        </span>
                    </span>

                    <span class="person-meta">
                        ${
                            person.active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                    <span class="person-arrow">
                        →
                    </span>
                </button>
            `;
        })
        .join("");
}

/* =========================================================
   PERMISSIONS
   ========================================================= */

async function renderPermissions() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module permissions-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        HRMNX
                    </span>

                    <h1>
                        Permissions
                    </h1>

                    <p>
                        Manage internal roles and
                        employee assignments.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="permissions-back"
                    >
                        ← Dashboard
                    </button>
                </div>
            </div>

            <div class="permissions-toolbar">
                <div class="permissions-search">
                    <input
                        type="search"
                        id="permissions-search-input"
                        placeholder="Search roles..."
                        autocomplete="off"
                    >
                </div>

                <div
                    class="permissions-count"
                    id="permissions-count"
                >
                    Loading...
                </div>
            </div>

            <div
                class="roles-list"
                id="roles-list"
            >
                <div class="empty-state">
                    Loading roles...
                </div>
            </div>
        </section>
    `;

    const input =
        document.querySelector(
            "#permissions-search-input"
        );

    if (input) {
        input.addEventListener(
            "input",
            filterRoles
        );
    }

    await loadRoles();
}

async function loadRoles() {
    const list =
        document.querySelector(
            "#roles-list"
        );

    if (!list) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("roles")
            .select(`
                id,
                name,
                slug
            `)
            .order("name", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load roles:",
            error
        );

        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    Unable to load roles
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiRoles = data || [];

    await loadRoleEmployeeCounts();

    renderRoleList(nemawashiRoles);
}

async function loadRoleEmployeeCounts() {
    if (!nemawashiRoles.length) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("employee_roles")
            .select(`
                id,
                role_id
            `);

    if (error) {
        console.warn(
            "Unable to load role employee counts:",
            error
        );

        nemawashiRoles.forEach(
            role => {
                role.employee_count = 0;
            }
        );

        return;
    }

    const counts = {};

    (data || []).forEach(item => {
        const key =
            String(item.role_id);

        counts[key] =
            (counts[key] || 0) + 1;
    });

    nemawashiRoles.forEach(role => {
        role.employee_count =
            counts[String(role.id)] || 0;
    });
}

function renderRoleList(roles) {
    const list =
        document.querySelector(
            "#roles-list"
        );

    if (!list) {
        return;
    }

    updateRoleCount(roles.length);

    if (!roles.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No roles found
                </h3>

                <p>
                    Try another search.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        roles.map(role => `
            <button
                type="button"
                class="role-card"
                data-role-id="${escapeAttribute(role.id)}"
            >
                <span class="role-card-icon">
                    ◈
                </span>

                <span class="role-card-main">
                    <strong>
                        ${escapeHtml(role.name)}
                    </strong>

                    <span>
                        ${escapeHtml(role.slug)}
                    </span>
                </span>

                <span class="role-card-count">
                    ${
                        role.employee_count || 0
                    }
                    employee${
                        role.employee_count === 1
                            ? ""
                            : "s"
                    }
                </span>

                <span class="role-card-arrow">
                    →
                </span>
            </button>
        `).join("");
}

function filterRoles() {
    const input =
        document.querySelector(
            "#permissions-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderRoleList(
            nemawashiRoles
        );

        return;
    }

    const filtered =
        nemawashiRoles.filter(role => {
            return [
                role.name,
                role.slug
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query);
        });

    renderRoleList(filtered);
}

function updateRoleCount(count) {
    const element =
        document.querySelector(
            "#permissions-count"
        );

    if (!element) {
        return;
    }

    element.textContent =
        `${count} role${count === 1 ? "" : "s"}`;
}

async function openRole(roleId) {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    const role =
        nemawashiRoles.find(
            item =>
                String(item.id) ===
                String(roleId)
        );

    if (!role) {
        return;
    }

    window.nemawashiCurrentRoleId =
        role.id;

    content.innerHTML = `
        <section class="admin-module role-detail">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        HRMNX / PERMISSIONS
                    </span>

                    <h1>
                        ${escapeHtml(role.name)}
                    </h1>

                    <p>
                        ${escapeHtml(role.slug)}
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="role-back"
                    >
                        ← Permissions
                    </button>
                </div>
            </div>

            <div class="role-detail-summary">
                <div>
                    <span>
                        Role
                    </span>

                    <strong>
                        ${escapeHtml(role.name)}
                    </strong>
                </div>

                <div>
                    <span>
                        Slug
                    </span>

                    <strong>
                        ${escapeHtml(role.slug)}
                    </strong>
                </div>

                <div>
                    <span>
                        Assigned
                    </span>

                    <strong>
                        ${
                            role.employee_count || 0
                        }
                    </strong>
                </div>
            </div>

            <section class="role-assignment-panel">
                <div class="person-detail-panel-heading">
                    <span class="eyebrow">
                        ASSIGN
                    </span>

                    <h2>
                        Add employee
                    </h2>
                </div>

                <div class="role-assignment-row">
                    <select
                        id="role-employee-select"
                    >
                        <option value="">
                            Loading employees...
                        </option>
                    </select>

                    <button
                        type="button"
                        class="person-save-button"
                        id="role-assign-button"
                        data-role-id="${escapeAttribute(role.id)}"
                    >
                        Assign
                    </button>
                </div>
            </section>

            <section class="role-employees-panel">
                <div class="person-detail-panel-heading">
                    <span class="eyebrow">
                        PEOPLE
                    </span>

                    <h2>
                        Assigned employees
                    </h2>
                </div>

                <div
                    class="role-employees-list"
                    id="role-employees"
                >
                    Loading employees...
                </div>
            </section>
        </section>
    `;

    await loadRoleEmployees(roleId);
    await loadRoleEmployeeOptions(roleId);
}

async function loadRoleEmployees(roleId) {
    const container =
        document.querySelector(
            "#role-employees"
        );

    if (!container) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("employee_roles")
            .select(`
                id,
                employee_id,
                employees (
                    id,
                    user_id,
                    employee_number,
                    job_title,
                    active
                )
            `)
            .eq("role_id", roleId);

    if (error) {
        console.error(
            "Failed to load role employees:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `;

        return;
    }

    const employees =
        (data || [])
            .map(item => ({
                assignment: item,
                employee: item.employees
            }))
            .filter(item => item.employee);

    if (!employees.length) {
        container.innerHTML = `
            <div class="detail-empty">
                No employees assigned to this role.
            </div>
        `;

        return;
    }

    const employeeIds =
        employees.map(
            item => item.employee.user_id
        ).filter(Boolean);

    let profiles = [];

    if (employeeIds.length) {
        const result =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name,
                    avatar_url
                `)
                .in("id", employeeIds);

        profiles = result.data || [];
    }

    const profileMap =
        new Map(
            profiles.map(profile => [
                profile.id,
                profile
            ])
        );

    container.innerHTML =
        employees.map(item => {
            const employee =
                item.employee;

            const profile =
                profileMap.get(
                    employee.user_id
                );

            const name =
                profile?.display_name ||
                profile?.username ||
                employee.employee_number ||
                "Employee";

            return `
                <div class="role-employee-row">
                    <div class="role-employee-main">
                        <span class="person-avatar small">
                            ${
                                profile?.avatar_url
                                    ? `
                                        <img
                                            src="${escapeAttribute(
                                                profile.avatar_url
                                            )}"
                                            alt=""
                                        >
                                    `
                                    : `
                                        ${escapeHtml(
                                            getInitials(name)
                                        )}
                                    `
                            }
                        </span>

                        <span>
                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <small>
                                ${
                                    escapeHtml(
                                        employee.job_title ||
                                        "No job title"
                                    )
                                }
                            </small>
                        </span>
                    </div>

                    <button
                        type="button"
                        class="danger-button"
                        data-role-id="${escapeAttribute(roleId)}"
                        data-remove-role-employee="${escapeAttribute(employee.id)}"
                    >
                        Remove
                    </button>
                </div>
            `;
        }).join("");
}

async function loadRoleEmployeeOptions(roleId) {
    const select =
        document.querySelector(
            "#role-employee-select"
        );

    if (!select) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                employee_number,
                job_title,
                active
            `)
            .eq("active", true)
            .order("employee_number", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load employee options:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load employees
            </option>
        `;

        return;
    }

    const employeeIds =
        (data || [])
            .map(employee => employee.user_id)
            .filter(Boolean);

    let profiles = [];

    if (employeeIds.length) {
        const result =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name
                `)
                .in("id", employeeIds);

        profiles = result.data || [];
    }

    const profileMap =
        new Map(
            profiles.map(profile => [
                profile.id,
                profile
            ])
        );

    select.innerHTML = `
        <option value="">
            Select an employee...
        </option>

        ${(data || [])
            .map(employee => {
                const profile =
                    profileMap.get(
                        employee.user_id
                    );

                const name =
                    profile?.display_name ||
                    profile?.username ||
                    employee.employee_number ||
                    "Employee";

                return `
                    <option
                        value="${escapeAttribute(employee.id)}"
                    >
                        ${escapeHtml(name)}
                        ${
                            employee.job_title
                                ? ` — ${escapeHtml(
                                      employee.job_title
                                  )}`
                                : ""
                        }
                    </option>
                `;
            })
            .join("")}
    `;
}

async function assignEmployeeToRole(
    roleId,
    employeeId
) {
    const { error } =
        await supabaseClient
            .from("employee_roles")
            .insert({
                role_id: roleId,
                employee_id: employeeId
            });

    if (error) {
        console.error(
            "Failed to assign role:",
            error
        );

        alert(error.message);

        return;
    }

    await openRole(roleId);
}

async function removeEmployeeFromRole(
    roleId,
    employeeId
) {
    const confirmed =
        window.confirm(
            "Remove this employee from the role?"
        );

    if (!confirmed) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("employee_roles")
            .delete()
            .eq("role_id", roleId)
            .eq("employee_id", employeeId);

    if (error) {
        console.error(
            "Failed to remove role:",
            error
        );

        alert(error.message);

        return;
    }

    await openRole(roleId);
}

/* =========================================================
   SERASHIO — NOTICES
   ========================================================= */

let nemawashiNotices = [];
let currentNoticeId = null;

async function renderSerashioNotices() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module serashio-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h1>
                        Notices
                    </h1>

                    <p>
                        Manage notices shown across
                        the Serashio platform.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="overview"
                    >
                        ← Dashboard
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        id="notice-new-button"
                    >
                        New notice
                    </button>
                </div>
            </div>

            <div class="admin-list-toolbar">
                <input
                    type="search"
                    id="notice-search-input"
                    placeholder="Search notices..."
                    autocomplete="off"
                >

                <span
                    class="admin-list-count"
                    id="notice-count"
                >
                    Loading...
                </span>
            </div>

            <div
                class="admin-list"
                id="notice-list"
            >
                <div class="empty-state">
                    Loading notices...
                </div>
            </div>

            <div
                id="notice-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    const searchInput =
        document.querySelector(
            "#notice-search-input"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterSerashioNotices
        );
    }

    await loadSerashioNotices();
}

async function loadSerashioNotices() {
    const list =
        document.querySelector(
            "#notice-list"
        );

    if (!list) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("notices")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Failed to load Serashio notices:",
            error
        );

        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    Unable to load notices
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiNotices = data || [];

    renderSerashioNoticeList(
        nemawashiNotices
    );
}

function renderSerashioNoticeList(notices) {
    const list =
        document.querySelector(
            "#notice-list"
        );

    if (!list) {
        return;
    }

    const count =
        document.querySelector(
            "#notice-count"
        );

    if (count) {
        count.textContent =
            `${notices.length} notice${
                notices.length === 1
                    ? ""
                    : "s"
            }`;
    }

    if (!notices.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No notices
                </h3>

                <p>
                    Create your first Serashio notice.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        notices.map(notice => {
            const active =
                notice.active !== false;

            return `
                <button
                    type="button"
                    class="admin-list-card"
                    data-notice-id="${escapeAttribute(
                        notice.id
                    )}"
                    onclick="openSerashioNoticeEditor('${escapeAttribute(
                        notice.id
                    )}')"
                >
                    <span class="admin-list-card-icon">
                        !
                    </span>

                    <span class="admin-list-card-main">
                        <strong>
                            ${escapeHtml(
                                notice.title ||
                                "Untitled notice"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                notice.content ||
                                notice.description ||
                                ""
                            )}
                        </span>
                    </span>

                    <span class="admin-list-card-meta">
                        <span class="${
                            active
                                ? "status-active"
                                : "status-inactive"
                        }">
                            ${
                                active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </span>

                        <small>
                            ${formatDate(
                                notice.created_at
                            )}
                        </small>
                    </span>

                    <span class="admin-list-card-arrow">
                        →
                    </span>
                </button>
            `;
        }).join("");
}

function filterSerashioNotices() {
    const input =
        document.querySelector(
            "#notice-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderSerashioNoticeList(
            nemawashiNotices
        );

        return;
    }

    const filtered =
        nemawashiNotices.filter(notice => {
            const searchable = [
                notice.title,
                notice.content,
                notice.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(
                query
            );
        });

    renderSerashioNoticeList(filtered);
}

function openSerashioNoticeEditor(
    noticeId
) {
    const container =
        document.querySelector(
            "#notice-editor-container"
        );

    if (!container) {
        return;
    }

    const notice =
        noticeId
            ? nemawashiNotices.find(
                  item =>
                      String(item.id) ===
                      String(noticeId)
              )
            : null;

    currentNoticeId =
        notice?.id || null;

    container.innerHTML = `
        <section class="admin-editor-panel">
            <div class="admin-editor-heading">
                <div>
                    <span class="eyebrow">
                        ${
                            notice
                                ? "EDIT NOTICE"
                                : "NEW NOTICE"
                        }
                    </span>

                    <h2>
                        ${
                            notice
                                ? "Edit notice"
                                : "Create notice"
                        }
                    </h2>
                </div>
            </div>

            <div class="admin-editor-form">
                <label class="admin-editor-field">
                    <span>
                        Title
                    </span>

                    <input
                        type="text"
                        id="notice-title"
                        value="${escapeAttribute(
                            notice?.title || ""
                        )}"
                        placeholder="Notice title"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Content
                    </span>

                    <textarea
                        id="notice-content"
                        rows="7"
                        placeholder="Notice content"
                    >${escapeHtml(
                        notice?.content ||
                        notice?.description ||
                        ""
                    )}</textarea>
                </label>

                <label class="admin-editor-checkbox">
                    <input
                        type="checkbox"
                        id="notice-active"
                        ${
                            notice
                                ? notice.active !== false
                                    ? "checked"
                                    : ""
                                : "checked"
                        }
                    >

                    <span>
                        Notice is active
                    </span>
                </label>
            </div>

            <div
                id="notice-editor-message"
                class="admin-editor-message"
            ></div>

            <div class="admin-editor-actions">
                ${
                    notice
                        ? `
                            <button
                                type="button"
                                class="danger-button"
                                id="notice-delete-button"
                                data-notice-id="${escapeAttribute(
                                    notice.id
                                )}"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="person-save-button"
                    id="notice-save-button"
                >
                    ${
                        notice
                            ? "Save changes"
                            : "Create notice"
                    }
                </button>
            </div>
        </section>
    `;

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function saveSerashioNotice() {
    const title =
        document.querySelector(
            "#notice-title"
        )?.value.trim();

    const content =
        document.querySelector(
            "#notice-content"
        )?.value.trim();

    const active =
        document.querySelector(
            "#notice-active"
        )?.checked ?? true;

    const message =
        document.querySelector(
            "#notice-editor-message"
        );

    const button =
        document.querySelector(
            "#notice-save-button"
        );

    if (!title) {
        if (message) {
            message.textContent =
                "Please enter a title.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    if (message) {
        message.textContent = "";
        message.className =
            "admin-editor-message";
    }

    const payload = {
        title,
        content,
        active
    };

    let result;

    if (currentNoticeId) {
        result =
            await supabaseClient
                .from("notices")
                .update(payload)
                .eq(
                    "id",
                    currentNoticeId
                );
    } else {
        result =
            await supabaseClient
                .from("notices")
                .insert(payload);
    }

    if (result.error) {
        console.error(
            "Failed to save notice:",
            result.error
        );

        if (message) {
            message.textContent =
                result.error.message;

            message.classList.add(
                "error"
            );
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                currentNoticeId
                    ? "Save changes"
                    : "Create notice";
        }

        return;
    }

    await loadSerashioNotices();

    if (currentNoticeId) {
        openSerashioNoticeEditor(
            currentNoticeId
        );
    } else {
        const newest =
            nemawashiNotices[0];

        if (newest) {
            openSerashioNoticeEditor(
                newest.id
            );
        }
    }
}

async function deleteSerashioNotice(
    noticeId
) {
    const confirmed =
        window.confirm(
            "Delete this notice? This cannot be undone."
        );

    if (!confirmed) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("notices")
            .delete()
            .eq("id", noticeId);

    if (error) {
        console.error(
            "Failed to delete notice:",
            error
        );

        alert(error.message);

        return;
    }

    currentNoticeId = null;

    await loadSerashioNotices();

    const container =
        document.querySelector(
            "#notice-editor-container"
        );

    if (container) {
        container.innerHTML = "";
    }
}

/* =========================================================
   SERASHIO — BANNERS
   ========================================================= */

let nemawashiBanners = [];
let currentBannerId = null;

async function renderSerashioBanners() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module serashio-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h1>
                        Banners
                    </h1>

                    <p>
                        Manage banners displayed
                        throughout Serashio.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="overview"
                    >
                        ← Dashboard
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        id="banner-new-button"
                    >
                        New banner
                    </button>
                </div>
            </div>

            <div class="admin-list-toolbar">
                <input
                    type="search"
                    id="banner-search-input"
                    placeholder="Search banners..."
                    autocomplete="off"
                >

                <span
                    class="admin-list-count"
                    id="banner-count"
                >
                    Loading...
                </span>
            </div>

            <div
                class="admin-list"
                id="banner-list"
            >
                <div class="empty-state">
                    Loading banners...
                </div>
            </div>

            <div
                id="banner-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    const searchInput =
        document.querySelector(
            "#banner-search-input"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterSerashioBanners
        );
    }

    await loadSerashioBanners();
}

async function loadSerashioBanners() {
    const list =
        document.querySelector(
            "#banner-list"
        );

    if (!list) {
        return;
    }

    const { data, error } =
        await supabaseClient
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
                    name,
                    slug
                )
            `)
            .order("sort_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Failed to load banners:",
            error
        );

        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    Unable to load banners
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiBanners = data || [];

    renderSerashioBannerList(
        nemawashiBanners
    );
}

function renderSerashioBannerList(
    banners
) {
    const list =
        document.querySelector(
            "#banner-list"
        );

    if (!list) {
        return;
    }

    const count =
        document.querySelector(
            "#banner-count"
        );

    if (count) {
        count.textContent =
            `${banners.length} banner${
                banners.length === 1
                    ? ""
                    : "s"
            }`;
    }

    if (!banners.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No banners
                </h3>

                <p>
                    Create your first Serashio banner.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        banners.map(banner => `
            <button
                type="button"
                class="banner-admin-card"
                onclick="openSerashioBannerEditor('${escapeAttribute(
                    banner.id
                )}')"
            >
                <span class="banner-admin-image">
                    <img
                        src="${escapeAttribute(
                            banner.image_url
                        )}"
                        alt=""
                    >
                </span>

                <span class="banner-admin-info">
                    <strong>
                        ${escapeHtml(
                            banner.title ||
                            "Untitled banner"
                        )}
                    </strong>

                    <span>
                        ${
                            banner.artists?.name
                                ? escapeHtml(
                                      banner.artists.name
                                  )
                                : "No artist"
                        }
                    </span>

                    ${
                        banner.link_url
                            ? `
                                <small>
                                    ${escapeHtml(
                                        banner.link_url
                                    )}
                                </small>
                            `
                            : ""
                    }
                </span>

                <span class="banner-admin-meta">
                    <span class="${
                        banner.active
                            ? "status-active"
                            : "status-inactive"
                    }">
                        ${
                            banner.active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                    <small>
                        Order:
                        ${Number(
                            banner.sort_order || 0
                        )}
                    </small>
                </span>

                <span class="admin-list-card-arrow">
                    →
                </span>
            </button>
        `).join("");
}

function filterSerashioBanners() {
    const input =
        document.querySelector(
            "#banner-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderSerashioBannerList(
            nemawashiBanners
        );

        return;
    }

    const filtered =
        nemawashiBanners.filter(
            banner => {
                const searchable = [
                    banner.title,
                    banner.link_url,
                    banner.artists?.name,
                    banner.artists?.slug
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(
                    query
                );
            }
        );

    renderSerashioBannerList(
        filtered
    );
}

function openSerashioBannerEditor(
    bannerId
) {
    const container =
        document.querySelector(
            "#banner-editor-container"
        );

    if (!container) {
        return;
    }

    const banner =
        bannerId
            ? nemawashiBanners.find(
                  item =>
                      String(item.id) ===
                      String(bannerId)
              )
            : null;

    currentBannerId =
        banner?.id || null;

    container.innerHTML = `
        <section class="admin-editor-panel">
            <div class="admin-editor-heading">
                <div>
                    <span class="eyebrow">
                        ${
                            banner
                                ? "EDIT BANNER"
                                : "NEW BANNER"
                        }
                    </span>

                    <h2>
                        ${
                            banner
                                ? "Edit banner"
                                : "Create banner"
                        }
                    </h2>
                </div>
            </div>

            <div class="admin-editor-form">
                <label class="admin-editor-field">
                    <span>
                        Title
                    </span>

                    <input
                        type="text"
                        id="banner-title"
                        value="${escapeAttribute(
                            banner?.title || ""
                        )}"
                        placeholder="Banner title"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Image URL
                    </span>

                    <input
                        type="url"
                        id="banner-image-url"
                        value="${escapeAttribute(
                            banner?.image_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Link URL
                    </span>

                    <input
                        type="url"
                        id="banner-link-url"
                        value="${escapeAttribute(
                            banner?.link_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Artist
                    </span>

                    <select
                        id="banner-artist-id"
                    >
                        <option value="">
                            Loading artists...
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Sort order
                    </span>

                    <input
                        type="number"
                        id="banner-sort-order"
                        value="${Number(
                            banner?.sort_order || 0
                        )}"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Starts at
                    </span>

                    <input
                        type="datetime-local"
                        id="banner-starts-at"
                        value="${toDateTimeLocal(
                            banner?.starts_at
                        )}"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Ends at
                    </span>

                    <input
                        type="datetime-local"
                        id="banner-ends-at"
                        value="${toDateTimeLocal(
                            banner?.ends_at
                        )}"
                    >
                </label>

                <label class="admin-editor-checkbox">
                    <input
                        type="checkbox"
                        id="banner-active"
                        ${
                            banner
                                ? banner.active !== false
                                    ? "checked"
                                    : ""
                                : "checked"
                        }
                    >

                    <span>
                        Banner is active
                    </span>
                </label>
            </div>

            <div
                id="banner-editor-message"
                class="admin-editor-message"
            ></div>

            <div class="admin-editor-actions">
                ${
                    banner
                        ? `
                            <button
                                type="button"
                                class="danger-button"
                                id="banner-delete-button"
                                data-banner-id="${escapeAttribute(
                                    banner.id
                                )}"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="person-save-button"
                    id="banner-save-button"
                >
                    ${
                        banner
                            ? "Save changes"
                            : "Create banner"
                    }
                </button>
            </div>
        </section>
    `;

    loadBannerArtistOptions(
        banner?.artist_id || null
    );

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function toDateTimeLocal(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset =
        date.getTimezoneOffset();

    const localDate =
        new Date(
            date.getTime() -
            offset * 60000
        );

    return localDate
        .toISOString()
        .slice(0, 16);
}

async function loadBannerArtistOptions(
    selectedArtistId
) {
    const select =
        document.querySelector(
            "#banner-artist-id"
        );

    if (!select) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("artists")
            .select(`
                id,
                name,
                slug
            `)
            .order("name", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load banner artists:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load artists
            </option>
        `;

        return;
    }

    select.innerHTML = `
        <option value="">
            No artist
        </option>

        ${(data || [])
            .map(artist => `
                <option
                    value="${escapeAttribute(
                        artist.id
                    )}"
                    ${
                        String(
                            artist.id
                        ) ===
                        String(
                            selectedArtistId
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
            .join("")}
    `;
}

async function saveSerashioBanner() {
    const title =
        document.querySelector(
            "#banner-title"
        )?.value.trim() || null;

    const imageUrl =
        document.querySelector(
            "#banner-image-url"
        )?.value.trim();

    const linkUrl =
        document.querySelector(
            "#banner-link-url"
        )?.value.trim() || null;

    const artistId =
        document.querySelector(
            "#banner-artist-id"
        )?.value || null;

    const sortOrder =
        Number(
            document.querySelector(
                "#banner-sort-order"
            )?.value || 0
        );

    const startsAt =
        document.querySelector(
            "#banner-starts-at"
        )?.value || null;

    const endsAt =
        document.querySelector(
            "#banner-ends-at"
        )?.value || null;

    const active =
        document.querySelector(
            "#banner-active"
        )?.checked ?? true;

    const message =
        document.querySelector(
            "#banner-editor-message"
        );

    const button =
        document.querySelector(
            "#banner-save-button"
        );

    if (!imageUrl) {
        if (message) {
            message.textContent =
                "An image URL is required.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    const payload = {
        artist_id:
            artistId || null,
        title,
        image_url:
            imageUrl,
        link_url:
            linkUrl,
        sort_order:
            Number.isFinite(sortOrder)
                ? sortOrder
                : 0,
        active,
        starts_at:
            startsAt
                ? new Date(
                      startsAt
                  ).toISOString()
                : null,
        ends_at:
            endsAt
                ? new Date(
                      endsAt
                  ).toISOString()
                : null
    };

    let result;

    if (currentBannerId) {
        result =
            await supabaseClient
                .from("notice_banners")
                .update(payload)
                .eq(
                    "id",
                    currentBannerId
                );
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

        if (message) {
            message.textContent =
                result.error.message;

            message.classList.add(
                "error"
            );
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                currentBannerId
                    ? "Save changes"
                    : "Create banner";
        }

        return;
    }

    await loadSerashioBanners();

    if (currentBannerId) {
        openSerashioBannerEditor(
            currentBannerId
        );
    } else {
        const newest =
            nemawashiBanners.find(
                banner =>
                    String(
                        banner.image_url
                    ) ===
                    String(imageUrl)
            );

        if (newest) {
            openSerashioBannerEditor(
                newest.id
            );
        }
    }
}

async function deleteSerashioBanner(
    bannerId
) {
    const confirmed =
        window.confirm(
            "Delete this banner? This cannot be undone."
        );

    if (!confirmed) {
        return;
    }

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

        alert(error.message);

        return;
    }

    currentBannerId = null;

    await loadSerashioBanners();

    const container =
        document.querySelector(
            "#banner-editor-container"
        );

    if (container) {
        container.innerHTML = "";
    }
}

/* =========================================================
   SERASHIO — ARTISTS
   ========================================================= */

let nemawashiArtists = [];
let currentArtistId = null;

async function renderSerashioArtists() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module artists-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h1>
                        Artists
                    </h1>

                    <p>
                        Manage artist profiles,
                        banners, biographies,
                        and related content.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="overview"
                    >
                        ← Dashboard
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        id="artist-new-button"
                    >
                        New artist
                    </button>
                </div>
            </div>

            <div class="admin-list-toolbar">
                <input
                    type="search"
                    id="artist-search-input"
                    placeholder="Search artists..."
                    autocomplete="off"
                >

                <span
                    class="admin-list-count"
                    id="artist-count"
                >
                    Loading...
                </span>
            </div>

            <div
                class="artists-admin-list"
                id="artist-list"
            >
                <div class="empty-state">
                    Loading artists...
                </div>
            </div>

            <div
                id="artist-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    const input =
        document.querySelector(
            "#artist-search-input"
        );

    if (input) {
        input.addEventListener(
            "input",
            filterSerashioArtists
        );
    }

    await loadSerashioArtists();
}

async function loadSerashioArtists() {
    const list =
        document.querySelector(
            "#artist-list"
        );

    if (!list) {
        return;
    }

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
            <div class="empty-state">
                <h3>
                    Unable to load artists
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiArtists = data || [];

    await loadArtistContentCounts();

    renderSerashioArtistList(
        nemawashiArtists
    );
}

async function loadArtistContentCounts() {
    if (!nemawashiArtists.length) {
        return;
    }

    const artistIds =
        nemawashiArtists.map(
            artist => artist.id
        );

    const counts =
        new Map();

    const [
        bannersResult,
        releasesResult
    ] = await Promise.all([
        supabaseClient
            .from("notice_banners")
            .select("id, artist_id")
            .in(
                "artist_id",
                artistIds
            ),

        supabaseClient
            .from("releases")
            .select("id, artist_id")
            .in(
                "artist_id",
                artistIds
            )
    ]);

    if (!bannersResult.error) {
        (bannersResult.data || [])
            .forEach(item => {
                const key =
                    String(
                        item.artist_id
                    );

                const current =
                    counts.get(key) || {
                        banners: 0,
                        releases: 0
                    };

                current.banners++;

                counts.set(
                    key,
                    current
                );
            });
    }

    if (!releasesResult.error) {
        (releasesResult.data || [])
            .forEach(item => {
                const key =
                    String(
                        item.artist_id
                    );

                const current =
                    counts.get(key) || {
                        banners: 0,
                        releases: 0
                    };

                current.releases++;

                counts.set(
                    key,
                    current
                );
            });
    }

    nemawashiArtists.forEach(
        artist => {
            const result =
                counts.get(
                    String(artist.id)
                ) || {
                    banners: 0,
                    releases: 0
                };

            artist.banner_count =
                result.banners;

            artist.release_count =
                result.releases;
        }
    );
}

function renderSerashioArtistList(
    artists
) {
    const list =
        document.querySelector(
            "#artist-list"
        );

    if (!list) {
        return;
    }

    updateArtistCount(
        artists.length
    );

    if (!artists.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No artists found
                </h3>

                <p>
                    Try another search.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        artists.map(artist => `
            <button
                type="button"
                class="artist-admin-card"
                onclick="openArtist('${escapeAttribute(
                    artist.id
                )}')"
            >
                <span class="artist-admin-avatar">
                    ${
                        artist.avatar_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        artist.avatar_url
                                    )}"
                                    alt=""
                                >
                            `
                            : `
                                ${escapeHtml(
                                    getInitials(
                                        artist.name
                                    )
                                )}
                            `
                    }
                </span>

                <span class="artist-admin-main">
                    <strong>
                        ${escapeHtml(
                            artist.name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            artist.slug
                        )}
                    </span>

                    ${
                        artist.bio
                            ? `
                                <small>
                                    ${escapeHtml(
                                        artist.bio
                                    )}
                                </small>
                            `
                            : ""
                    }
                </span>

                <span class="artist-admin-meta">
                    <span>
                        ${
                            artist.release_count ||
                            0
                        }
                        releases
                    </span>

                    <span>
                        ${
                            artist.banner_count ||
                            0
                        }
                        banners
                    </span>
                </span>

                <span class="admin-list-card-arrow">
                    →
                </span>
            </button>
        `).join("");
}

function filterSerashioArtists() {
    const input =
        document.querySelector(
            "#artist-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderSerashioArtistList(
            nemawashiArtists
        );

        return;
    }

    const filtered =
        nemawashiArtists.filter(
            artist => {
                return [
                    artist.name,
                    artist.slug,
                    artist.bio,
                    artist.description
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(query);
            }
        );

    renderSerashioArtistList(
        filtered
    );
}

function updateArtistCount(count) {
    const element =
        document.querySelector(
            "#artist-count"
        );

    if (!element) {
        return;
    }

    element.textContent =
        `${count} artist${
            count === 1
                ? ""
                : "s"
        }`;
}

async function openArtist(artistId) {
    const artist =
        nemawashiArtists.find(
            item =>
                String(item.id) ===
                String(artistId)
        );

    if (!artist) {
        return;
    }

    currentArtistId =
        artist.id;

    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module artist-detail">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO / ARTIST
                    </span>

                    <h1>
                        ${escapeHtml(
                            artist.name
                        )}
                    </h1>

                    <p>
                        ${escapeHtml(
                            artist.slug
                        )}
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="artist-back"
                    >
                        ← Artists
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        onclick="openArtistEditor('${escapeAttribute(
                            artist.id
                        )}')"
                    >
                        Edit artist
                    </button>
                </div>
            </div>

            <div class="artist-profile-admin">
                <div class="artist-profile-admin-avatar">
                    ${
                        artist.avatar_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        artist.avatar_url
                                    )}"
                                    alt=""
                                >
                            `
                            : `
                                ${escapeHtml(
                                    getInitials(
                                        artist.name
                                    )
                                )}
                            `
                    }
                </div>

                <div class="artist-profile-admin-main">
                    <h2>
                        ${escapeHtml(
                            artist.name
                        )}
                    </h2>

                    <span>
                        ${escapeHtml(
                            artist.slug
                        )}
                    </span>

                    ${
                        artist.bio
                            ? `
                                <p>
                                    ${escapeHtml(
                                        artist.bio
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>
            </div>

            <div class="artist-content-summary">
                <div>
                    <span>
                        Releases
                    </span>

                    <strong>
                        ${
                            artist.release_count ||
                            0
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Banners
                    </span>

                    <strong>
                        ${
                            artist.banner_count ||
                            0
                        }
                    </strong>
                </div>
            </div>

            <div
                id="artist-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    await loadArtistContentSummary(
        artist.id
    );
}

async function loadArtistContentSummary(
    artistId
) {
    const content =
        document.querySelector(
            ".artist-content-summary"
        );

    if (!content) {
        return;
    }

    const [
        releasesResult,
        bannersResult
    ] = await Promise.all([
        supabaseClient
            .from("releases")
            .select(`
                id,
                title,
                type,
                release_date
            `)
            .eq(
                "artist_id",
                artistId
            )
            .order("release_date", {
                ascending: false
            }),

        supabaseClient
            .from("notice_banners")
            .select(`
                id,
                title,
                active,
                sort_order
            `)
            .eq(
                "artist_id",
                artistId
            )
            .order("sort_order", {
                ascending: true
            })
    ]);

    const releases =
        releasesResult.data || [];

    const banners =
        bannersResult.data || [];

    const detailContainer =
        document.querySelector(
            ".artist-detail"
        );

    if (!detailContainer) {
        return;
    }

    let existing =
        detailContainer.querySelector(
            ".artist-related-content"
        );

    if (!existing) {
        existing =
            document.createElement(
                "div"
            );

        existing.className =
            "artist-related-content";

        detailContainer.appendChild(
            existing
        );
    }

    existing.innerHTML = `
        <section class="artist-related-panel">
            <div class="person-detail-panel-heading">
                <span class="eyebrow">
                    RELEASES
                </span>

                <h2>
                    Artist releases
                </h2>
            </div>

            ${
                releases.length
                    ? `
                        <div class="artist-related-list">
                            ${releases
                                .map(
                                    release => `
                                        <div class="artist-related-row">
                                            <div>
                                                <strong>
                                                    ${escapeHtml(
                                                        release.title ||
                                                        "Untitled"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${escapeHtml(
                                                        release.type ||
                                                        "Release"
                                                    )}
                                                </span>
                                            </div>

                                            <small>
                                                ${formatDate(
                                                    release.release_date
                                                )}
                                            </small>
                                        </div>
                                    `
                                )
                                .join("")}
                        </div>
                    `
                    : `
                        <div class="detail-empty">
                            No releases found.
                        </div>
                    `
            }
        </section>

        <section class="artist-related-panel">
            <div class="person-detail-panel-heading">
                <span class="eyebrow">
                    BANNERS
                </span>

                <h2>
                    Artist banners
                </h2>
            </div>

            ${
                banners.length
                    ? `
                        <div class="artist-related-list">
                            ${banners
                                .map(
                                    banner => `
                                        <div class="artist-related-row">
                                            <div>
                                                <strong>
                                                    ${escapeHtml(
                                                        banner.title ||
                                                        "Untitled"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${
                                                        banner.active
                                                            ? "Active"
                                                            : "Inactive"
                                                    }
                                                </span>
                                            </div>

                                            <small>
                                                Order:
                                                ${Number(
                                                    banner.sort_order ||
                                                    0
                                                )}
                                            </small>
                                        </div>
                                    `
                                )
                                .join("")}
                        </div>
                    `
                    : `
                        <div class="detail-empty">
                            No banners found.
                        </div>
                    `
            }
        </section>
    `;
}

function openArtistEditor(artistId) {
    const container =
        document.querySelector(
            "#artist-editor-container"
        );

    if (!container) {
        return;
    }

    const artist =
        artistId
            ? nemawashiArtists.find(
                  item =>
                      String(item.id) ===
                      String(artistId)
              )
            : null;

    currentArtistId =
        artist?.id || null;

    container.innerHTML = `
        <section class="admin-editor-panel">
            <div class="admin-editor-heading">
                <div>
                    <span class="eyebrow">
                        ${
                            artist
                                ? "EDIT ARTIST"
                                : "NEW ARTIST"
                        }
                    </span>

                    <h2>
                        ${
                            artist
                                ? "Edit artist"
                                : "Create artist"
                        }
                    </h2>
                </div>
            </div>

            <div class="admin-editor-form">
                <label class="admin-editor-field">
                    <span>
                        Name
                    </span>

                    <input
                        type="text"
                        id="artist-name"
                        value="${escapeAttribute(
                            artist?.name || ""
                        )}"
                        placeholder="Artist name"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Slug
                    </span>

                    <input
                        type="text"
                        id="artist-slug"
                        value="${escapeAttribute(
                            artist?.slug || ""
                        )}"
                        placeholder="artist-slug"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Avatar URL
                    </span>

                    <input
                        type="url"
                        id="artist-avatar-url"
                        value="${escapeAttribute(
                            artist?.avatar_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Banner URL
                    </span>

                    <input
                        type="url"
                        id="artist-banner-url"
                        value="${escapeAttribute(
                            artist?.banner_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Bio
                    </span>

                    <textarea
                        id="artist-bio"
                        rows="5"
                        placeholder="Artist biography"
                    >${escapeHtml(
                        artist?.bio || ""
                    )}</textarea>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Description
                    </span>

                    <textarea
                        id="artist-description"
                        rows="5"
                        placeholder="Artist description"
                    >${escapeHtml(
                        artist?.description || ""
                    )}</textarea>
                </label>
            </div>

            <div
                id="artist-editor-message"
                class="admin-editor-message"
            ></div>

            <div class="admin-editor-actions">
                ${
                    artist
                        ? `
                            <button
                                type="button"
                                class="danger-button"
                                id="artist-delete-button"
                                data-artist-id="${escapeAttribute(
                                    artist.id
                                )}"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="person-save-button"
                    id="artist-save-button"
                    data-artist-id="${
                        artist
                            ? escapeAttribute(
                                  artist.id
                              )
                            : ""
                    }"
                >
                    ${
                        artist
                            ? "Save changes"
                            : "Create artist"
                    }
                </button>
            </div>
        </section>
    `;

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showArtistEditorMessage(
    message,
    type = ""
) {
    const element =
        document.querySelector(
            "#artist-editor-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "admin-editor-message";

    if (type) {
        element.classList.add(type);
    }
}

async function saveArtist(
    artistId
) {
    const name =
        document.querySelector(
            "#artist-name"
        )?.value.trim();

    const slug =
        document.querySelector(
            "#artist-slug"
        )?.value.trim();

    const avatarUrl =
        document.querySelector(
            "#artist-avatar-url"
        )?.value.trim() || null;

    const bannerUrl =
        document.querySelector(
            "#artist-banner-url"
        )?.value.trim() || null;

    const bio =
        document.querySelector(
            "#artist-bio"
        )?.value.trim() || null;

    const description =
        document.querySelector(
            "#artist-description"
        )?.value.trim() || null;

    const button =
        document.querySelector(
            "#artist-save-button"
        );

    if (!name || !slug) {
        showArtistEditorMessage(
            "Name and slug are required.",
            "error"
        );

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    const payload = {
        name,
        slug,
        avatar_url:
            avatarUrl,
        banner_url:
            bannerUrl,
        bio,
        description
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
            result.error.message,
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

    await loadSerashioArtists();

    if (artistId) {
        await openArtist(
            artistId
        );
    } else {
        const created =
            nemawashiArtists.find(
                item =>
                    item.slug ===
                    slug
            );

        if (created) {
            await openArtist(
                created.id
            );
        } else {
            await renderSerashioArtists();
        }
    }
}

async function deleteArtist(
    artistId
) {
    const confirmed =
        window.confirm(
            "Delete this artist? This may affect related content."
        );

    if (!confirmed) {
        return;
    }

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

        showArtistEditorMessage(
            error.message,
            "error"
        );

        return;
    }

    currentArtistId = null;

    await renderSerashioArtists();
}

/* =========================================================
   SONG DEMO STUDIO — ACCESS
   ========================================================= */

async function initializeSongDemoStudio() {
    if (songDemoStudioInitialized) {
        return;
    }

    songDemoStudioInitialized = true;

    if (!currentEmployee?.id) {
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.rpc(
                "nemawashi_can_manage_song_demos"
            );

        if (error) {
            console.warn(
                "Song Demo Studio access check failed:",
                error
            );

            return;
        }

        songDemoStudioAccess =
            Boolean(data);

        if (
            songDemoStudioAccess
        ) {
            addSongDemoStudioNavigation();
        }
    } catch (error) {
        console.warn(
            "Song Demo Studio initialization failed:",
            error
        );
    }
}

function addSongDemoStudioNavigation() {
    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) {
        return;
    }

    if (
        sidebar.querySelector(
            '[data-section="song-demo-library"]'
        )
    ) {
        return;
    }

    const group =
        document.createElement(
            "div"
        );

    group.className =
        "nav-group song-demo-studio-group";

    group.innerHTML = `
        <div class="nav-group-label">
            ✦ SONG DEMO STUDIO
        </div>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-library"
        >
            <span class="nav-item-icon">
                ♫
            </span>

            <span>
                Demo Library
            </span>
        </button>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-create"
        >
            <span class="nav-item-icon">
                ＋
            </span>

            <span>
                Create Demo
            </span>
        </button>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-polls"
        >
            <span class="nav-item-icon">
                ◉
            </span>

            <span>
                Demo Polls
            </span>
        </button>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-reviews"
        >
            <span class="nav-item-icon">
                ✓
            </span>

            <span>
                Poll Reviews
            </span>
        </button>
    `;

    const serashioGroup =
        [
            ...sidebar.querySelectorAll(
                ".nav-group"
            )
        ].find(
            navGroup =>
                navGroup.querySelector(
                    '.nav-item[data-section="notices"]'
                )
        );

    if (serashioGroup) {
        sidebar.insertBefore(
            group,
            serashioGroup
        );
    } else {
        sidebar.appendChild(
            group
        );
    }
}

/* =========================================================
   SONG DEMO STUDIO — CREATE
   ========================================================= */

let songDemoPeople = [];
let songDemoSections = [];
let songDemoCurrentMode = null;

function renderSongDemoCreate() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    songDemoCurrentMode = null;
    songDemoSections = [];

    content.innerHTML = `
        <section class="admin-module song-demo-create-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SONG DEMO STUDIO
                    </span>

                    <h1>
                        Create Demo
                    </h1>

                    <p>
                        Start a new internal song demo
                        by choosing how you want to build it.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="song-demo-library"
                    >
                        ← Demo Library
                    </button>
                </div>
            </div>

            <div class="song-demo-create-choice-grid">
                <button
                    type="button"
                    class="song-demo-choice-card"
                    id="song-demo-start-lyrics"
                >
                    <span class="song-demo-choice-icon">
                        ♬
                    </span>

                    <span>
                        <strong>
                            Add lyrics first
                        </strong>

                        <small>
                            Build the song structure,
                            sections, members, and lyrics.
                        </small>
                    </span>

                    <span class="song-demo-choice-arrow">
                        →
                    </span>
                </button>

                <button
                    type="button"
                    class="song-demo-choice-card"
                    id="song-demo-start-song-base"
                >
                    <span class="song-demo-choice-icon">
                        ▶
                    </span>

                    <span>
                        <strong>
                            Add song base first
                        </strong>

                        <small>
                            Upload a short audio demo
                            and optionally its DAW project.
                        </small>
                    </span>

                    <span class="song-demo-choice-arrow">
                        →
                    </span>
                </button>
            </div>

            <div class="song-demo-create-note">
                <strong>
                    Demo types
                </strong>

                <p>
                    You can create a normal demo,
                    shared draft, public demo,
                    or fan production competition
                    depending on your permissions.
                </p>
            </div>
        </section>
    `;
}

async function startLyricsDemo() {
    songDemoCurrentMode =
        "lyrics";

    songDemoSections = [];

    await loadSongDemoPeople();

    renderSongDemoLyricsWizard();
}

function startSongBaseDemo() {
    songDemoCurrentMode =
        "song";

    songDemoSections = [];

    renderSongDemoSongBaseWizard();
}

async function loadSongDemoPeople() {
    const { data, error } =
        await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                employee_number,
                job_title,
                active
            `)
            .eq("active", true)
            .order("employee_number", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load Song Demo people:",
            error
        );

        songDemoPeople = [];

        return;
    }

    const employees =
        data || [];

    const userIds =
        employees
            .map(
                employee =>
                    employee.user_id
            )
            .filter(Boolean);

    let profiles = [];

    if (userIds.length) {
        const result =
            await supabaseClient
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

        if (!result.error) {
            profiles =
                result.data || [];
        }
    }

    const profileMap =
        new Map(
            profiles.map(profile => [
                profile.id,
                profile
            ])
        );

    songDemoPeople =
        employees.map(
            employee => {
                const profile =
                    profileMap.get(
                        employee.user_id
                    );

                return {
                    ...employee,
                    username:
                        profile?.username ||
                        null,
                    display_name:
                        profile?.display_name ||
                        null
                };
            }
        );
}

function renderSongDemoLyricsWizard() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module song-demo-wizard">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SONG DEMO STUDIO / LYRICS
                    </span>

                    <h1>
                        Build a lyrics demo
                    </h1>

                    <p>
                        Define the song structure first,
                        then add lyrics and member assignments.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="song-demo-wizard-back"
                    >
                        ← Start over
                    </button>
                </div>
            </div>

            <div class="song-demo-wizard-form">
                <label class="admin-editor-field">
                    <span>
                        Demo name
                    </span>

                    <input
                        type="text"
                        id="song-demo-title"
                        placeholder="Demo title"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Visibility
                    </span>

                    <select id="song-demo-visibility">
                        <option value="personal">
                            Personal draft — nobody else
                        </option>

                        <option value="shared">
                            Shared draft — selected employees
                        </option>

                        <option value="public">
                            Public — Serashio + KiKi
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Demo type
                    </span>

                    <select id="song-demo-type">
                        <option value="lyrics">
                            Lyrics demo
                        </option>

                        <option value="competition">
                            Fan production competition
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Cover URL
                    </span>

                    <input
                        type="url"
                        id="song-demo-cover-url"
                        placeholder="Optional cover image URL"
                    >
                </label>
            </div>

            <div class="song-demo-sections-heading">
                <div>
                    <span class="eyebrow">
                        STRUCTURE
                    </span>

                    <h2>
                        Song sections
                    </h2>

                    <p>
                        Add verses, choruses, bridges,
                        intros, outros, or custom sections.
                    </p>
                </div>

                <button
                    type="button"
                    class="secondary-button"
                    id="song-demo-add-section"
                >
                    ＋ Add section
                </button>
            </div>

            <div
                class="song-demo-section-list"
                id="song-demo-section-list"
            ></div>

            <div
                id="song-demo-lyrics-message"
                class="admin-editor-message"
            ></div>

            <div class="song-demo-wizard-actions">
                <button
                    type="button"
                    class="secondary-button"
                    id="song-demo-wizard-back"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="person-save-button"
                    id="song-demo-save-lyrics"
                >
                    Create lyrics demo
                </button>
            </div>
        </section>
    `;

    if (!songDemoSections.length) {
        songDemoSections = [
            {
                section_type: "verse",
                section_number: 1,
                title: "Verse 1",
                enabled: true,
                lyrics: "",
                members: []
            },
            {
                section_type: "chorus",
                section_number: 1,
                title: "Chorus",
                enabled: true,
                lyrics: "",
                members: []
            }
        ];
    }

    renderSongDemoSectionList();
}

function renderSongDemoSectionList() {
    const container =
        document.querySelector(
            "#song-demo-section-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        songDemoSections
            .map(
                (section, index) => `
                    <article
                        class="song-demo-section-card"
                        data-section-index="${index}"
                    >
                        <div class="song-demo-section-header">
                            <div>
                                <span class="song-demo-section-number">
                                    ${index + 1}
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        section.title ||
                                        "Section"
                                    )}
                                </strong>
                            </div>

                            <div class="song-demo-section-controls">
                                <button
                                    type="button"
                                    class="section-move-button"
                                    data-song-demo-move="up"
                                    data-section-index="${index}"
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
                                    class="section-move-button"
                                    data-song-demo-move="down"
                                    data-section-index="${index}"
                                    ${
                                        index ===
                                        songDemoSections.length - 1
                                            ? "disabled"
                                            : ""
                                    }
                                >
                                    ↓
                                </button>
                            </div>
                        </div>

                        <div class="song-demo-section-fields">
                            <label class="admin-editor-field">
                                <span>
                                    Section type
                                </span>

                                <select
                                    data-section-field="type"
                                    data-section-index="${index}"
                                >
                                    ${renderSongDemoSectionTypeOptions(
                                        section.section_type
                                    )}
                                </select>
                            </label>

                            <label class="admin-editor-field">
                                <span>
                                    Title
                                </span>

                                <input
                                    type="text"
                                    data-section-field="title"
                                    data-section-index="${index}"
                                    value="${escapeAttribute(
                                        section.title || ""
                                    )}"
                                >
                            </label>

                            <label class="admin-editor-checkbox">
                                <input
                                    type="checkbox"
                                    data-section-field="enabled"
                                    data-section-index="${index}"
                                    ${
                                        section.enabled !== false
                                            ? "checked"
                                            : ""
                                    }
                                >

                                <span>
                                    Section enabled
                                </span>
                            </label>
                        </div>

                        <label class="admin-editor-field">
                            <span>
                                Lyrics
                            </span>

                            <textarea
                                rows="7"
                                data-section-field="lyrics"
                                data-section-index="${index}"
                                placeholder="Write lyrics for this section..."
                            >${escapeHtml(
                                section.lyrics || ""
                            )}</textarea>
                        </label>

                        <div class="song-demo-member-heading">
                            <div>
                                <strong>
                                    Members
                                </strong>

                                <small>
                                    Assign a member to this section
                                    if needed.
                                </small>
                            </div>

                            <button
                                type="button"
                                class="secondary-button"
                                onclick="addSongDemoMember(${index})"
                            >
                                ＋ Add member
                            </button>
                        </div>

                        <div
                            class="song-demo-members"
                            data-members-for="${index}"
                        >
                            ${
                                section.members?.length
                                    ? section.members
                                          .map(
                                              (
                                                  member,
                                                  memberIndex
                                              ) =>
                                                  renderSongDemoMember(
                                                      index,
                                                      member,
                                                      memberIndex
                                                  )
                                          )
                                          .join("")
                                    : `
                                        <div class="detail-empty">
                                            No member assigned.
                                        </div>
                                    `
                            }
                        </div>
                    </article>
                `
            )
            .join("");

    syncSongDemoSectionInputs();
}

function renderSongDemoSectionTypeOptions(
    selected
) {
    const types = [
        ["intro", "Intro"],
        ["verse", "Verse"],
        ["pre_chorus", "Pre-Chorus"],
        ["chorus", "Chorus"],
        ["post_chorus", "Post-Chorus"],
        ["bridge", "Bridge"],
        ["breakdown", "Breakdown"],
        ["interlude", "Interlude"],
        ["outro", "Outro"],
        ["custom", "Custom"]
    ];

    return types
        .map(
            ([value, label]) => `
                <option
                    value="${value}"
                    ${
                        value === selected
                            ? "selected"
                            : ""
                    }
                >
                    ${label}
                </option>
            `
        )
        .join("");
}

function renderSongDemoMember(
    sectionIndex,
    member,
    memberIndex
) {
    return `
        <div
            class="song-demo-member-row"
            data-member-index="${memberIndex}"
        >
            <select
                data-member-field="employee"
                data-section-index="${sectionIndex}"
                data-member-index="${memberIndex}"
            >
                <option value="">
                    Select member...
                </option>

                ${songDemoPeople
                    .map(person => {
                        const name =
                            person.display_name ||
                            person.username ||
                            person.employee_number ||
                            "Employee";

                        return `
                            <option
                                value="${escapeAttribute(
                                    person.id
                                )}"
                                ${
                                    String(
                                        person.id
                                    ) ===
                                    String(
                                        member.employee_id
                                    )
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(
                                    name
                                )}
                            </option>
                        `;
                    })
                    .join("")}
            </select>

            <input
                type="text"
                data-member-field="name"
                data-section-index="${sectionIndex}"
                data-member-index="${memberIndex}"
                value="${escapeAttribute(
                    member.member_name || ""
                )}"
                placeholder="Member name"
            >

            <button
                type="button"
                class="danger-button"
                onclick="removeSongDemoMember(
                    ${sectionIndex},
                    ${memberIndex}
                )"
            >
                Remove
            </button>
        </div>
    `;
}

function addSongDemoMember(
    sectionIndex
) {
    const section =
        songDemoSections[
            sectionIndex
        ];

    if (!section) {
        return;
    }

    if (!section.members) {
        section.members = [];
    }

    section.members.push({
        member_name: "",
        employee_id: null,
        lyrics: "",
        sort_order:
            section.members.length
    });

    renderSongDemoSectionList();
}

function removeSongDemoMember(
    sectionIndex,
    memberIndex
) {
    const section =
        songDemoSections[
            sectionIndex
        ];

    if (!section?.members) {
        return;
    }

    section.members.splice(
        memberIndex,
        1
    );

    renderSongDemoSectionList();
}

function addSongDemoCustomSection() {
    syncSongDemoSectionInputs();

    const number =
        songDemoSections.length + 1;

    songDemoSections.push({
        section_type: "custom",
        section_number: number,
        title: `Section ${number}`,
        enabled: true,
        lyrics: "",
        members: []
    });

    renderSongDemoSectionList();
}

function moveSongDemoSection(
    index,
    direction
) {
    syncSongDemoSectionInputs();

    if (
        direction === "up" &&
        index > 0
    ) {
        [
            songDemoSections[index - 1],
            songDemoSections[index]
        ] = [
            songDemoSections[index],
            songDemoSections[index - 1]
        ];
    }

    if (
        direction === "down" &&
        index <
            songDemoSections.length - 1
    ) {
        [
            songDemoSections[index],
            songDemoSections[index + 1]
        ] = [
            songDemoSections[index + 1],
            songDemoSections[index]
        ];
    }

    renderSongDemoSectionList();
}

function syncSongDemoSectionInputs() {
    document
        .querySelectorAll(
            "[data-section-field]"
        )
        .forEach(input => {
            const index =
                Number(
                    input.dataset.sectionIndex
                );

            const field =
                input.dataset.sectionField;

            const section =
                songDemoSections[index];

            if (!section) {
                return;
            }

            if (
                field === "enabled"
            ) {
                section.enabled =
                    input.checked;
            } else if (
                field === "type"
            ) {
                section.section_type =
                    input.value;
            } else {
                section[field] =
                    input.value;
            }
        });

    document
        .querySelectorAll(
            "[data-member-field]"
        )
        .forEach(input => {
            const sectionIndex =
                Number(
                    input.dataset.sectionIndex
                );

            const memberIndex =
                Number(
                    input.dataset.memberIndex
                );

            const field =
                input.dataset.memberField;

            const section =
                songDemoSections[
                    sectionIndex
                ];

            const member =
                section?.members?.[
                    memberIndex
                ];

            if (!member) {
                return;
            }

            if (
                field === "employee"
            ) {
                member.employee_id =
                    input.value || null;

                if (
                    input.value
                ) {
                    const person =
                        songDemoPeople.find(
                            employee =>
                                String(
                                    employee.id
                                ) ===
                                String(
                                    input.value
                                )
                        );

                    if (person) {
                        member.member_name =
                            person.display_name ||
                            person.username ||
                            person.employee_number ||
                            "";
                    }
                }
            } else {
                member[field] =
                    input.value;
            }
        });
}

async function saveSongDemoLyrics() {
    syncSongDemoSectionInputs();

    const title =
        document.querySelector(
            "#song-demo-title"
        )?.value.trim();

    const visibility =
        document.querySelector(
            "#song-demo-visibility"
        )?.value ||
        "personal";

    const demoType =
        document.querySelector(
            "#song-demo-type"
        )?.value ||
        "lyrics";

    const coverUrl =
        document.querySelector(
            "#song-demo-cover-url"
        )?.value.trim() ||
        null;

    const message =
        document.querySelector(
            "#song-demo-lyrics-message"
        );

    const button =
        document.querySelector(
            "#song-demo-save-lyrics"
        );

    if (!title) {
        if (message) {
            message.textContent =
                "Please enter a demo name.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (
        !songDemoSections.length
    ) {
        if (message) {
            message.textContent =
                "Please add at least one song section.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Creating...";
    }

    const packageFilename =
        await buildSongDemoPackageFilename(
            "lyrics"
        );

    const { data: demo, error } =
        await supabaseClient
            .from("song_demos")
            .insert({
                created_by_employee_id:
                    currentEmployee.id,
                title,
                demo_type:
                    demoType ===
                    "competition"
                        ? "competition"
                        : "lyrics",
                visibility,
                status:
                    "draft",
                package_filename:
                    packageFilename,
                producer_employee_id:
                    currentEmployee.id,
                cover_url:
                    coverUrl,
                release_assignment_status:
                    "unassigned",
                is_competition:
                    demoType ===
                    "competition",
                poll_enabled:
                    visibility ===
                    "public"
            })
            .select()
            .single();

    if (error) {
        console.error(
            "Failed to create lyrics demo:",
            error
        );

        if (message) {
            message.textContent =
                error.message;

            message.classList.add(
                "error"
            );
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                "Create lyrics demo";
        }

        return;
    }

    for (
        let index = 0;
        index <
        songDemoSections.length;
        index++
    ) {
        const section =
            songDemoSections[index];

        const { data: createdSection, error: sectionError } =
            await supabaseClient
                .from("song_demo_sections")
                .insert({
                    demo_id:
                        demo.id,
                    section_order:
                        index + 1,
                    section_type:
                        section.section_type ||
                        "custom",
                    section_number:
                        section.section_number ||
                        index + 1,
                    title:
                        section.title ||
                        null,
                    enabled:
                        section.enabled !==
                        false,
                    lyrics:
                        section.lyrics ||
                        null
                })
                .select()
                .single();

        if (sectionError) {
            console.error(
                "Failed to create demo section:",
                sectionError
            );

            continue;
        }

        if (
            section.members?.length
        ) {
            const members =
                section.members.map(
                    (
                        member,
                        memberIndex
                    ) => ({
                        section_id:
                            createdSection.id,
                        member_name:
                            member.member_name ||
                            null,
                        employee_id:
                            member.employee_id ||
                            null,
                        lyrics:
                            member.lyrics ||
                            null,
                        sort_order:
                            memberIndex + 1
                    })
                );

            const {
                error: memberError
            } =
                await supabaseClient
                    .from(
                        "song_demo_section_members"
                    )
                    .insert(
                        members
                    );

            if (memberError) {
                console.error(
                    "Failed to create section members:",
                    memberError
                );
            }
        }
    }

    if (
        visibility === "shared"
    ) {
        /*
         * Shared recipients are intentionally added
         * later through the sharing UI.
         */
    }

    await supabaseClient
        .from("song_demo_events")
        .insert({
            demo_id:
                demo.id,
            user_id:
                currentUser.id,
            event_type:
                "created",
            event_data: {
                mode: "lyrics"
            }
        });

    if (message) {
        message.textContent =
            "Lyrics demo created successfully.";

        message.classList.add(
            "success"
        );
    }

    window.setTimeout(
        async () => {
            await openSongDemo(
                demo.id
            );
        },
        500
    );
}

async function buildSongDemoPackageFilename(
    type
) {
    let username =
        currentUser?.email
            ?.split("@")[0] ||
        "employee";

    try {
        const {
            data
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "username"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();

        if (
            data?.username
        ) {
            username =
                data.username;
        }
    } catch {
        // Keep fallback username.
    }

    const { count } =
        await supabaseClient
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
                currentEmployee.id
            );

    const number =
        Number(count || 0) + 1;

    const prefix =
        type === "lyrics"
            ? "lyrics"
            : "prod";

    const extension =
        type === "lyrics"
            ? "lyrdem"
            : "prodem";

    return `[${username}]_demo${number}_${prefix}.${extension}`;
}

/* =========================================================
   SERASHIO — BANNERS
   ========================================================= */

let nemawashiBanners = [];
let currentBannerId = null;

async function renderSerashioBanners() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module serashio-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h1>
                        Banners
                    </h1>

                    <p>
                        Manage banners displayed
                        throughout Serashio.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="overview"
                    >
                        ← Dashboard
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        id="banner-new-button"
                    >
                        New banner
                    </button>
                </div>
            </div>

            <div class="admin-list-toolbar">
                <input
                    type="search"
                    id="banner-search-input"
                    placeholder="Search banners..."
                    autocomplete="off"
                >

                <span
                    class="admin-list-count"
                    id="banner-count"
                >
                    Loading...
                </span>
            </div>

            <div
                class="admin-list"
                id="banner-list"
            >
                <div class="empty-state">
                    Loading banners...
                </div>
            </div>

            <div
                id="banner-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    const searchInput =
        document.querySelector(
            "#banner-search-input"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterSerashioBanners
        );
    }

    await loadSerashioBanners();
}

async function loadSerashioBanners() {
    const list =
        document.querySelector(
            "#banner-list"
        );

    if (!list) {
        return;
    }

    const { data, error } =
        await supabaseClient
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
                    name,
                    slug
                )
            `)
            .order("sort_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Failed to load banners:",
            error
        );

        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    Unable to load banners
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiBanners = data || [];

    renderSerashioBannerList(
        nemawashiBanners
    );
}

function renderSerashioBannerList(
    banners
) {
    const list =
        document.querySelector(
            "#banner-list"
        );

    if (!list) {
        return;
    }

    const count =
        document.querySelector(
            "#banner-count"
        );

    if (count) {
        count.textContent =
            `${banners.length} banner${
                banners.length === 1
                    ? ""
                    : "s"
            }`;
    }

    if (!banners.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No banners
                </h3>

                <p>
                    Create your first Serashio banner.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        banners.map(banner => `
            <button
                type="button"
                class="banner-admin-card"
                onclick="openSerashioBannerEditor('${escapeAttribute(
                    banner.id
                )}')"
            >
                <span class="banner-admin-image">
                    <img
                        src="${escapeAttribute(
                            banner.image_url
                        )}"
                        alt=""
                    >
                </span>

                <span class="banner-admin-info">
                    <strong>
                        ${escapeHtml(
                            banner.title ||
                            "Untitled banner"
                        )}
                    </strong>

                    <span>
                        ${
                            banner.artists?.name
                                ? escapeHtml(
                                      banner.artists.name
                                  )
                                : "No artist"
                        }
                    </span>

                    ${
                        banner.link_url
                            ? `
                                <small>
                                    ${escapeHtml(
                                        banner.link_url
                                    )}
                                </small>
                            `
                            : ""
                    }
                </span>

                <span class="banner-admin-meta">
                    <span class="${
                        banner.active
                            ? "status-active"
                            : "status-inactive"
                    }">
                        ${
                            banner.active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                    <small>
                        Order:
                        ${Number(
                            banner.sort_order || 0
                        )}
                    </small>
                </span>

                <span class="admin-list-card-arrow">
                    →
                </span>
            </button>
        `).join("");
}

function filterSerashioBanners() {
    const input =
        document.querySelector(
            "#banner-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderSerashioBannerList(
            nemawashiBanners
        );

        return;
    }

    const filtered =
        nemawashiBanners.filter(
            banner => {
                const searchable = [
                    banner.title,
                    banner.link_url,
                    banner.artists?.name,
                    banner.artists?.slug
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(
                    query
                );
            }
        );

    renderSerashioBannerList(
        filtered
    );
}

function openSerashioBannerEditor(
    bannerId
) {
    const container =
        document.querySelector(
            "#banner-editor-container"
        );

    if (!container) {
        return;
    }

    const banner =
        bannerId
            ? nemawashiBanners.find(
                  item =>
                      String(item.id) ===
                      String(bannerId)
              )
            : null;

    currentBannerId =
        banner?.id || null;

    container.innerHTML = `
        <section class="admin-editor-panel">
            <div class="admin-editor-heading">
                <div>
                    <span class="eyebrow">
                        ${
                            banner
                                ? "EDIT BANNER"
                                : "NEW BANNER"
                        }
                    </span>

                    <h2>
                        ${
                            banner
                                ? "Edit banner"
                                : "Create banner"
                        }
                    </h2>
                </div>
            </div>

            <div class="admin-editor-form">
                <label class="admin-editor-field">
                    <span>
                        Title
                    </span>

                    <input
                        type="text"
                        id="banner-title"
                        value="${escapeAttribute(
                            banner?.title || ""
                        )}"
                        placeholder="Banner title"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Image URL
                    </span>

                    <input
                        type="url"
                        id="banner-image-url"
                        value="${escapeAttribute(
                            banner?.image_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Link URL
                    </span>

                    <input
                        type="url"
                        id="banner-link-url"
                        value="${escapeAttribute(
                            banner?.link_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Artist
                    </span>

                    <select
                        id="banner-artist-id"
                    >
                        <option value="">
                            Loading artists...
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Sort order
                    </span>

                    <input
                        type="number"
                        id="banner-sort-order"
                        value="${Number(
                            banner?.sort_order || 0
                        )}"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Starts at
                    </span>

                    <input
                        type="datetime-local"
                        id="banner-starts-at"
                        value="${toDateTimeLocal(
                            banner?.starts_at
                        )}"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Ends at
                    </span>

                    <input
                        type="datetime-local"
                        id="banner-ends-at"
                        value="${toDateTimeLocal(
                            banner?.ends_at
                        )}"
                    >
                </label>

                <label class="admin-editor-checkbox">
                    <input
                        type="checkbox"
                        id="banner-active"
                        ${
                            banner
                                ? banner.active !== false
                                    ? "checked"
                                    : ""
                                : "checked"
                        }
                    >

                    <span>
                        Banner is active
                    </span>
                </label>
            </div>

            <div
                id="banner-editor-message"
                class="admin-editor-message"
            ></div>

            <div class="admin-editor-actions">
                ${
                    banner
                        ? `
                            <button
                                type="button"
                                class="danger-button"
                                id="banner-delete-button"
                                data-banner-id="${escapeAttribute(
                                    banner.id
                                )}"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="person-save-button"
                    id="banner-save-button"
                >
                    ${
                        banner
                            ? "Save changes"
                            : "Create banner"
                    }
                </button>
            </div>
        </section>
    `;

    loadBannerArtistOptions(
        banner?.artist_id || null
    );

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function toDateTimeLocal(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset =
        date.getTimezoneOffset();

    const localDate =
        new Date(
            date.getTime() -
            offset * 60000
        );

    return localDate
        .toISOString()
        .slice(0, 16);
}

async function loadBannerArtistOptions(
    selectedArtistId
) {
    const select =
        document.querySelector(
            "#banner-artist-id"
        );

    if (!select) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("artists")
            .select(`
                id,
                name,
                slug
            `)
            .order("name", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load banner artists:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load artists
            </option>
        `;

        return;
    }

    select.innerHTML = `
        <option value="">
            No artist
        </option>

        ${(data || [])
            .map(artist => `
                <option
                    value="${escapeAttribute(
                        artist.id
                    )}"
                    ${
                        String(
                            artist.id
                        ) ===
                        String(
                            selectedArtistId
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
            .join("")}
    `;
}

async function saveSerashioBanner() {
    const title =
        document.querySelector(
            "#banner-title"
        )?.value.trim() || null;

    const imageUrl =
        document.querySelector(
            "#banner-image-url"
        )?.value.trim();

    const linkUrl =
        document.querySelector(
            "#banner-link-url"
        )?.value.trim() || null;

    const artistId =
        document.querySelector(
            "#banner-artist-id"
        )?.value || null;

    const sortOrder =
        Number(
            document.querySelector(
                "#banner-sort-order"
            )?.value || 0
        );

    const startsAt =
        document.querySelector(
            "#banner-starts-at"
        )?.value || null;

    const endsAt =
        document.querySelector(
            "#banner-ends-at"
        )?.value || null;

    const active =
        document.querySelector(
            "#banner-active"
        )?.checked ?? true;

    const message =
        document.querySelector(
            "#banner-editor-message"
        );

    const button =
        document.querySelector(
            "#banner-save-button"
        );

    if (!imageUrl) {
        if (message) {
            message.textContent =
                "An image URL is required.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    const payload = {
        artist_id:
            artistId || null,
        title,
        image_url:
            imageUrl,
        link_url:
            linkUrl,
        sort_order:
            Number.isFinite(sortOrder)
                ? sortOrder
                : 0,
        active,
        starts_at:
            startsAt
                ? new Date(
                      startsAt
                  ).toISOString()
                : null,
        ends_at:
            endsAt
                ? new Date(
                      endsAt
                  ).toISOString()
                : null
    };

    let result;

    if (currentBannerId) {
        result =
            await supabaseClient
                .from("notice_banners")
                .update(payload)
                .eq(
                    "id",
                    currentBannerId
                );
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

        if (message) {
            message.textContent =
                result.error.message;

            message.classList.add(
                "error"
            );
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                currentBannerId
                    ? "Save changes"
                    : "Create banner";
        }

        return;
    }

    await loadSerashioBanners();

    if (currentBannerId) {
        openSerashioBannerEditor(
            currentBannerId
        );
    } else {
        const newest =
            nemawashiBanners.find(
                banner =>
                    String(
                        banner.image_url
                    ) ===
                    String(imageUrl)
            );

        if (newest) {
            openSerashioBannerEditor(
                newest.id
            );
        }
    }
}

async function deleteSerashioBanner(
    bannerId
) {
    const confirmed =
        window.confirm(
            "Delete this banner? This cannot be undone."
        );

    if (!confirmed) {
        return;
    }

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

        alert(error.message);

        return;
    }

    currentBannerId = null;

    await loadSerashioBanners();

    const container =
        document.querySelector(
            "#banner-editor-container"
        );

    if (container) {
        container.innerHTML = "";
    }
}

/* =========================================================
   SERASHIO — ARTISTS
   ========================================================= */

let nemawashiArtists = [];
let currentArtistId = null;

async function renderSerashioArtists() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module artists-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO
                    </span>

                    <h1>
                        Artists
                    </h1>

                    <p>
                        Manage artist profiles,
                        banners, biographies,
                        and related content.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="overview"
                    >
                        ← Dashboard
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        id="artist-new-button"
                    >
                        New artist
                    </button>
                </div>
            </div>

            <div class="admin-list-toolbar">
                <input
                    type="search"
                    id="artist-search-input"
                    placeholder="Search artists..."
                    autocomplete="off"
                >

                <span
                    class="admin-list-count"
                    id="artist-count"
                >
                    Loading...
                </span>
            </div>

            <div
                class="artists-admin-list"
                id="artist-list"
            >
                <div class="empty-state">
                    Loading artists...
                </div>
            </div>

            <div
                id="artist-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    const input =
        document.querySelector(
            "#artist-search-input"
        );

    if (input) {
        input.addEventListener(
            "input",
            filterSerashioArtists
        );
    }

    await loadSerashioArtists();
}

async function loadSerashioArtists() {
    const list =
        document.querySelector(
            "#artist-list"
        );

    if (!list) {
        return;
    }

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
            <div class="empty-state">
                <h3>
                    Unable to load artists
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;

        return;
    }

    nemawashiArtists = data || [];

    await loadArtistContentCounts();

    renderSerashioArtistList(
        nemawashiArtists
    );
}

async function loadArtistContentCounts() {
    if (!nemawashiArtists.length) {
        return;
    }

    const artistIds =
        nemawashiArtists.map(
            artist => artist.id
        );

    const counts =
        new Map();

    const [
        bannersResult,
        releasesResult
    ] = await Promise.all([
        supabaseClient
            .from("notice_banners")
            .select("id, artist_id")
            .in(
                "artist_id",
                artistIds
            ),

        supabaseClient
            .from("releases")
            .select("id, artist_id")
            .in(
                "artist_id",
                artistIds
            )
    ]);

    if (!bannersResult.error) {
        (bannersResult.data || [])
            .forEach(item => {
                const key =
                    String(
                        item.artist_id
                    );

                const current =
                    counts.get(key) || {
                        banners: 0,
                        releases: 0
                    };

                current.banners++;

                counts.set(
                    key,
                    current
                );
            });
    }

    if (!releasesResult.error) {
        (releasesResult.data || [])
            .forEach(item => {
                const key =
                    String(
                        item.artist_id
                    );

                const current =
                    counts.get(key) || {
                        banners: 0,
                        releases: 0
                    };

                current.releases++;

                counts.set(
                    key,
                    current
                );
            });
    }

    nemawashiArtists.forEach(
        artist => {
            const result =
                counts.get(
                    String(artist.id)
                ) || {
                    banners: 0,
                    releases: 0
                };

            artist.banner_count =
                result.banners;

            artist.release_count =
                result.releases;
        }
    );
}

function renderSerashioArtistList(
    artists
) {
    const list =
        document.querySelector(
            "#artist-list"
        );

    if (!list) {
        return;
    }

    updateArtistCount(
        artists.length
    );

    if (!artists.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No artists found
                </h3>

                <p>
                    Try another search.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        artists.map(artist => `
            <button
                type="button"
                class="artist-admin-card"
                onclick="openArtist('${escapeAttribute(
                    artist.id
                )}')"
            >
                <span class="artist-admin-avatar">
                    ${
                        artist.avatar_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        artist.avatar_url
                                    )}"
                                    alt=""
                                >
                            `
                            : `
                                ${escapeHtml(
                                    getInitials(
                                        artist.name
                                    )
                                )}
                            `
                    }
                </span>

                <span class="artist-admin-main">
                    <strong>
                        ${escapeHtml(
                            artist.name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            artist.slug
                        )}
                    </span>

                    ${
                        artist.bio
                            ? `
                                <small>
                                    ${escapeHtml(
                                        artist.bio
                                    )}
                                </small>
                            `
                            : ""
                    }
                </span>

                <span class="artist-admin-meta">
                    <span>
                        ${
                            artist.release_count ||
                            0
                        }
                        releases
                    </span>

                    <span>
                        ${
                            artist.banner_count ||
                            0
                        }
                        banners
                    </span>
                </span>

                <span class="admin-list-card-arrow">
                    →
                </span>
            </button>
        `).join("");
}

function filterSerashioArtists() {
    const input =
        document.querySelector(
            "#artist-search-input"
        );

    if (!input) {
        return;
    }

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {
        renderSerashioArtistList(
            nemawashiArtists
        );

        return;
    }

    const filtered =
        nemawashiArtists.filter(
            artist => {
                return [
                    artist.name,
                    artist.slug,
                    artist.bio,
                    artist.description
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(query);
            }
        );

    renderSerashioArtistList(
        filtered
    );
}

function updateArtistCount(count) {
    const element =
        document.querySelector(
            "#artist-count"
        );

    if (!element) {
        return;
    }

    element.textContent =
        `${count} artist${
            count === 1
                ? ""
                : "s"
        }`;
}

async function openArtist(artistId) {
    const artist =
        nemawashiArtists.find(
            item =>
                String(item.id) ===
                String(artistId)
        );

    if (!artist) {
        return;
    }

    currentArtistId =
        artist.id;

    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module artist-detail">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SERASHIO / ARTIST
                    </span>

                    <h1>
                        ${escapeHtml(
                            artist.name
                        )}
                    </h1>

                    <p>
                        ${escapeHtml(
                            artist.slug
                        )}
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="artist-back"
                    >
                        ← Artists
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        onclick="openArtistEditor('${escapeAttribute(
                            artist.id
                        )}')"
                    >
                        Edit artist
                    </button>
                </div>
            </div>

            <div class="artist-profile-admin">
                <div class="artist-profile-admin-avatar">
                    ${
                        artist.avatar_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        artist.avatar_url
                                    )}"
                                    alt=""
                                >
                            `
                            : `
                                ${escapeHtml(
                                    getInitials(
                                        artist.name
                                    )
                                )}
                            `
                    }
                </div>

                <div class="artist-profile-admin-main">
                    <h2>
                        ${escapeHtml(
                            artist.name
                        )}
                    </h2>

                    <span>
                        ${escapeHtml(
                            artist.slug
                        )}
                    </span>

                    ${
                        artist.bio
                            ? `
                                <p>
                                    ${escapeHtml(
                                        artist.bio
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>
            </div>

            <div class="artist-content-summary">
                <div>
                    <span>
                        Releases
                    </span>

                    <strong>
                        ${
                            artist.release_count ||
                            0
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Banners
                    </span>

                    <strong>
                        ${
                            artist.banner_count ||
                            0
                        }
                    </strong>
                </div>
            </div>

            <div
                id="artist-editor-container"
                class="admin-editor-container"
            ></div>
        </section>
    `;

    await loadArtistContentSummary(
        artist.id
    );
}

async function loadArtistContentSummary(
    artistId
) {
    const content =
        document.querySelector(
            ".artist-content-summary"
        );

    if (!content) {
        return;
    }

    const [
        releasesResult,
        bannersResult
    ] = await Promise.all([
        supabaseClient
            .from("releases")
            .select(`
                id,
                title,
                type,
                release_date
            `)
            .eq(
                "artist_id",
                artistId
            )
            .order("release_date", {
                ascending: false
            }),

        supabaseClient
            .from("notice_banners")
            .select(`
                id,
                title,
                active,
                sort_order
            `)
            .eq(
                "artist_id",
                artistId
            )
            .order("sort_order", {
                ascending: true
            })
    ]);

    const releases =
        releasesResult.data || [];

    const banners =
        bannersResult.data || [];

    const detailContainer =
        document.querySelector(
            ".artist-detail"
        );

    if (!detailContainer) {
        return;
    }

    let existing =
        detailContainer.querySelector(
            ".artist-related-content"
        );

    if (!existing) {
        existing =
            document.createElement(
                "div"
            );

        existing.className =
            "artist-related-content";

        detailContainer.appendChild(
            existing
        );
    }

    existing.innerHTML = `
        <section class="artist-related-panel">
            <div class="person-detail-panel-heading">
                <span class="eyebrow">
                    RELEASES
                </span>

                <h2>
                    Artist releases
                </h2>
            </div>

            ${
                releases.length
                    ? `
                        <div class="artist-related-list">
                            ${releases
                                .map(
                                    release => `
                                        <div class="artist-related-row">
                                            <div>
                                                <strong>
                                                    ${escapeHtml(
                                                        release.title ||
                                                        "Untitled"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${escapeHtml(
                                                        release.type ||
                                                        "Release"
                                                    )}
                                                </span>
                                            </div>

                                            <small>
                                                ${formatDate(
                                                    release.release_date
                                                )}
                                            </small>
                                        </div>
                                    `
                                )
                                .join("")}
                        </div>
                    `
                    : `
                        <div class="detail-empty">
                            No releases found.
                        </div>
                    `
            }
        </section>

        <section class="artist-related-panel">
            <div class="person-detail-panel-heading">
                <span class="eyebrow">
                    BANNERS
                </span>

                <h2>
                    Artist banners
                </h2>
            </div>

            ${
                banners.length
                    ? `
                        <div class="artist-related-list">
                            ${banners
                                .map(
                                    banner => `
                                        <div class="artist-related-row">
                                            <div>
                                                <strong>
                                                    ${escapeHtml(
                                                        banner.title ||
                                                        "Untitled"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${
                                                        banner.active
                                                            ? "Active"
                                                            : "Inactive"
                                                    }
                                                </span>
                                            </div>

                                            <small>
                                                Order:
                                                ${Number(
                                                    banner.sort_order ||
                                                    0
                                                )}
                                            </small>
                                        </div>
                                    `
                                )
                                .join("")}
                        </div>
                    `
                    : `
                        <div class="detail-empty">
                            No banners found.
                        </div>
                    `
            }
        </section>
    `;
}

function openArtistEditor(artistId) {
    const container =
        document.querySelector(
            "#artist-editor-container"
        );

    if (!container) {
        return;
    }

    const artist =
        artistId
            ? nemawashiArtists.find(
                  item =>
                      String(item.id) ===
                      String(artistId)
              )
            : null;

    currentArtistId =
        artist?.id || null;

    container.innerHTML = `
        <section class="admin-editor-panel">
            <div class="admin-editor-heading">
                <div>
                    <span class="eyebrow">
                        ${
                            artist
                                ? "EDIT ARTIST"
                                : "NEW ARTIST"
                        }
                    </span>

                    <h2>
                        ${
                            artist
                                ? "Edit artist"
                                : "Create artist"
                        }
                    </h2>
                </div>
            </div>

            <div class="admin-editor-form">
                <label class="admin-editor-field">
                    <span>
                        Name
                    </span>

                    <input
                        type="text"
                        id="artist-name"
                        value="${escapeAttribute(
                            artist?.name || ""
                        )}"
                        placeholder="Artist name"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Slug
                    </span>

                    <input
                        type="text"
                        id="artist-slug"
                        value="${escapeAttribute(
                            artist?.slug || ""
                        )}"
                        placeholder="artist-slug"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Avatar URL
                    </span>

                    <input
                        type="url"
                        id="artist-avatar-url"
                        value="${escapeAttribute(
                            artist?.avatar_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Banner URL
                    </span>

                    <input
                        type="url"
                        id="artist-banner-url"
                        value="${escapeAttribute(
                            artist?.banner_url || ""
                        )}"
                        placeholder="https://..."
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Bio
                    </span>

                    <textarea
                        id="artist-bio"
                        rows="5"
                        placeholder="Artist biography"
                    >${escapeHtml(
                        artist?.bio || ""
                    )}</textarea>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Description
                    </span>

                    <textarea
                        id="artist-description"
                        rows="5"
                        placeholder="Artist description"
                    >${escapeHtml(
                        artist?.description || ""
                    )}</textarea>
                </label>
            </div>

            <div
                id="artist-editor-message"
                class="admin-editor-message"
            ></div>

            <div class="admin-editor-actions">
                ${
                    artist
                        ? `
                            <button
                                type="button"
                                class="danger-button"
                                id="artist-delete-button"
                                data-artist-id="${escapeAttribute(
                                    artist.id
                                )}"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="person-save-button"
                    id="artist-save-button"
                    data-artist-id="${
                        artist
                            ? escapeAttribute(
                                  artist.id
                              )
                            : ""
                    }"
                >
                    ${
                        artist
                            ? "Save changes"
                            : "Create artist"
                    }
                </button>
            </div>
        </section>
    `;

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showArtistEditorMessage(
    message,
    type = ""
) {
    const element =
        document.querySelector(
            "#artist-editor-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "admin-editor-message";

    if (type) {
        element.classList.add(type);
    }
}

async function saveArtist(
    artistId
) {
    const name =
        document.querySelector(
            "#artist-name"
        )?.value.trim();

    const slug =
        document.querySelector(
            "#artist-slug"
        )?.value.trim();

    const avatarUrl =
        document.querySelector(
            "#artist-avatar-url"
        )?.value.trim() || null;

    const bannerUrl =
        document.querySelector(
            "#artist-banner-url"
        )?.value.trim() || null;

    const bio =
        document.querySelector(
            "#artist-bio"
        )?.value.trim() || null;

    const description =
        document.querySelector(
            "#artist-description"
        )?.value.trim() || null;

    const button =
        document.querySelector(
            "#artist-save-button"
        );

    if (!name || !slug) {
        showArtistEditorMessage(
            "Name and slug are required.",
            "error"
        );

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    const payload = {
        name,
        slug,
        avatar_url:
            avatarUrl,
        banner_url:
            bannerUrl,
        bio,
        description
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
            result.error.message,
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

    await loadSerashioArtists();

    if (artistId) {
        await openArtist(
            artistId
        );
    } else {
        const created =
            nemawashiArtists.find(
                item =>
                    item.slug ===
                    slug
            );

        if (created) {
            await openArtist(
                created.id
            );
        } else {
            await renderSerashioArtists();
        }
    }
}

async function deleteArtist(
    artistId
) {
    const confirmed =
        window.confirm(
            "Delete this artist? This may affect related content."
        );

    if (!confirmed) {
        return;
    }

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

        showArtistEditorMessage(
            error.message,
            "error"
        );

        return;
    }

    currentArtistId = null;

    await renderSerashioArtists();
}

/* =========================================================
   SONG DEMO STUDIO — ACCESS
   ========================================================= */

async function initializeSongDemoStudio() {
    if (songDemoStudioInitialized) {
        return;
    }

    songDemoStudioInitialized = true;

    if (!currentEmployee?.id) {
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.rpc(
                "nemawashi_can_manage_song_demos"
            );

        if (error) {
            console.warn(
                "Song Demo Studio access check failed:",
                error
            );

            return;
        }

        songDemoStudioAccess =
            Boolean(data);

        if (
            songDemoStudioAccess
        ) {
            addSongDemoStudioNavigation();
        }
    } catch (error) {
        console.warn(
            "Song Demo Studio initialization failed:",
            error
        );
    }
}

function addSongDemoStudioNavigation() {
    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) {
        return;
    }

    if (
        sidebar.querySelector(
            '[data-section="song-demo-library"]'
        )
    ) {
        return;
    }

    const group =
        document.createElement(
            "div"
        );

    group.className =
        "nav-group song-demo-studio-group";

    group.innerHTML = `
        <div class="nav-group-label">
            ✦ SONG DEMO STUDIO
        </div>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-library"
        >
            <span class="nav-item-icon">
                ♫
            </span>

            <span>
                Demo Library
            </span>
        </button>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-create"
        >
            <span class="nav-item-icon">
                ＋
            </span>

            <span>
                Create Demo
            </span>
        </button>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-polls"
        >
            <span class="nav-item-icon">
                ◉
            </span>

            <span>
                Demo Polls
            </span>
        </button>

        <button
            type="button"
            class="nav-item"
            data-section="song-demo-reviews"
        >
            <span class="nav-item-icon">
                ✓
            </span>

            <span>
                Poll Reviews
            </span>
        </button>
    `;

    const serashioGroup =
        [
            ...sidebar.querySelectorAll(
                ".nav-group"
            )
        ].find(
            navGroup =>
                navGroup.querySelector(
                    '.nav-item[data-section="notices"]'
                )
        );

    if (serashioGroup) {
        sidebar.insertBefore(
            group,
            serashioGroup
        );
    } else {
        sidebar.appendChild(
            group
        );
    }
}

/* =========================================================
   SONG DEMO STUDIO — CREATE
   ========================================================= */

let songDemoPeople = [];
let songDemoSections = [];
let songDemoCurrentMode = null;

function renderSongDemoCreate() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    songDemoCurrentMode = null;
    songDemoSections = [];

    content.innerHTML = `
        <section class="admin-module song-demo-create-module">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SONG DEMO STUDIO
                    </span>

                    <h1>
                        Create Demo
                    </h1>

                    <p>
                        Start a new internal song demo
                        by choosing how you want to build it.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        data-section="song-demo-library"
                    >
                        ← Demo Library
                    </button>
                </div>
            </div>

            <div class="song-demo-create-choice-grid">
                <button
                    type="button"
                    class="song-demo-choice-card"
                    id="song-demo-start-lyrics"
                >
                    <span class="song-demo-choice-icon">
                        ♬
                    </span>

                    <span>
                        <strong>
                            Add lyrics first
                        </strong>

                        <small>
                            Build the song structure,
                            sections, members, and lyrics.
                        </small>
                    </span>

                    <span class="song-demo-choice-arrow">
                        →
                    </span>
                </button>

                <button
                    type="button"
                    class="song-demo-choice-card"
                    id="song-demo-start-song-base"
                >
                    <span class="song-demo-choice-icon">
                        ▶
                    </span>

                    <span>
                        <strong>
                            Add song base first
                        </strong>

                        <small>
                            Upload a short audio demo
                            and optionally its DAW project.
                        </small>
                    </span>

                    <span class="song-demo-choice-arrow">
                        →
                    </span>
                </button>
            </div>

            <div class="song-demo-create-note">
                <strong>
                    Demo types
                </strong>

                <p>
                    You can create a normal demo,
                    shared draft, public demo,
                    or fan production competition
                    depending on your permissions.
                </p>
            </div>
        </section>
    `;
}

async function startLyricsDemo() {
    songDemoCurrentMode =
        "lyrics";

    songDemoSections = [];

    await loadSongDemoPeople();

    renderSongDemoLyricsWizard();
}

function startSongBaseDemo() {
    songDemoCurrentMode =
        "song";

    songDemoSections = [];

    renderSongDemoSongBaseWizard();
}

async function loadSongDemoPeople() {
    const { data, error } =
        await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                employee_number,
                job_title,
                active
            `)
            .eq("active", true)
            .order("employee_number", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load Song Demo people:",
            error
        );

        songDemoPeople = [];

        return;
    }

    const employees =
        data || [];

    const userIds =
        employees
            .map(
                employee =>
                    employee.user_id
            )
            .filter(Boolean);

    let profiles = [];

    if (userIds.length) {
        const result =
            await supabaseClient
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

        if (!result.error) {
            profiles =
                result.data || [];
        }
    }

    const profileMap =
        new Map(
            profiles.map(profile => [
                profile.id,
                profile
            ])
        );

    songDemoPeople =
        employees.map(
            employee => {
                const profile =
                    profileMap.get(
                        employee.user_id
                    );

                return {
                    ...employee,
                    username:
                        profile?.username ||
                        null,
                    display_name:
                        profile?.display_name ||
                        null
                };
            }
        );
}

function renderSongDemoLyricsWizard() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module song-demo-wizard">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SONG DEMO STUDIO / LYRICS
                    </span>

                    <h1>
                        Build a lyrics demo
                    </h1>

                    <p>
                        Define the song structure first,
                        then add lyrics and member assignments.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="song-demo-wizard-back"
                    >
                        ← Start over
                    </button>
                </div>
            </div>

            <div class="song-demo-wizard-form">
                <label class="admin-editor-field">
                    <span>
                        Demo name
                    </span>

                    <input
                        type="text"
                        id="song-demo-title"
                        placeholder="Demo title"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Visibility
                    </span>

                    <select id="song-demo-visibility">
                        <option value="personal">
                            Personal draft — nobody else
                        </option>

                        <option value="shared">
                            Shared draft — selected employees
                        </option>

                        <option value="public">
                            Public — Serashio + KiKi
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Demo type
                    </span>

                    <select id="song-demo-type">
                        <option value="lyrics">
                            Lyrics demo
                        </option>

                        <option value="competition">
                            Fan production competition
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Cover URL
                    </span>

                    <input
                        type="url"
                        id="song-demo-cover-url"
                        placeholder="Optional cover image URL"
                    >
                </label>
            </div>

            <div class="song-demo-sections-heading">
                <div>
                    <span class="eyebrow">
                        STRUCTURE
                    </span>

                    <h2>
                        Song sections
                    </h2>

                    <p>
                        Add verses, choruses, bridges,
                        intros, outros, or custom sections.
                    </p>
                </div>

                <button
                    type="button"
                    class="secondary-button"
                    id="song-demo-add-section"
                >
                    ＋ Add section
                </button>
            </div>

            <div
                class="song-demo-section-list"
                id="song-demo-section-list"
            ></div>

            <div
                id="song-demo-lyrics-message"
                class="admin-editor-message"
            ></div>

            <div class="song-demo-wizard-actions">
                <button
                    type="button"
                    class="secondary-button"
                    id="song-demo-wizard-back"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="person-save-button"
                    id="song-demo-save-lyrics"
                >
                    Create lyrics demo
                </button>
            </div>
        </section>
    `;

    if (!songDemoSections.length) {
        songDemoSections = [
            {
                section_type: "verse",
                section_number: 1,
                title: "Verse 1",
                enabled: true,
                lyrics: "",
                members: []
            },
            {
                section_type: "chorus",
                section_number: 1,
                title: "Chorus",
                enabled: true,
                lyrics: "",
                members: []
            }
        ];
    }

    renderSongDemoSectionList();
}

function renderSongDemoSectionList() {
    const container =
        document.querySelector(
            "#song-demo-section-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        songDemoSections
            .map(
                (section, index) => `
                    <article
                        class="song-demo-section-card"
                        data-section-index="${index}"
                    >
                        <div class="song-demo-section-header">
                            <div>
                                <span class="song-demo-section-number">
                                    ${index + 1}
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        section.title ||
                                        "Section"
                                    )}
                                </strong>
                            </div>

                            <div class="song-demo-section-controls">
                                <button
                                    type="button"
                                    class="section-move-button"
                                    data-song-demo-move="up"
                                    data-section-index="${index}"
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
                                    class="section-move-button"
                                    data-song-demo-move="down"
                                    data-section-index="${index}"
                                    ${
                                        index ===
                                        songDemoSections.length - 1
                                            ? "disabled"
                                            : ""
                                    }
                                >
                                    ↓
                                </button>
                            </div>
                        </div>

                        <div class="song-demo-section-fields">
                            <label class="admin-editor-field">
                                <span>
                                    Section type
                                </span>

                                <select
                                    data-section-field="type"
                                    data-section-index="${index}"
                                >
                                    ${renderSongDemoSectionTypeOptions(
                                        section.section_type
                                    )}
                                </select>
                            </label>

                            <label class="admin-editor-field">
                                <span>
                                    Title
                                </span>

                                <input
                                    type="text"
                                    data-section-field="title"
                                    data-section-index="${index}"
                                    value="${escapeAttribute(
                                        section.title || ""
                                    )}"
                                >
                            </label>

                            <label class="admin-editor-checkbox">
                                <input
                                    type="checkbox"
                                    data-section-field="enabled"
                                    data-section-index="${index}"
                                    ${
                                        section.enabled !== false
                                            ? "checked"
                                            : ""
                                    }
                                >

                                <span>
                                    Section enabled
                                </span>
                            </label>
                        </div>

                        <label class="admin-editor-field">
                            <span>
                                Lyrics
                            </span>

                            <textarea
                                rows="7"
                                data-section-field="lyrics"
                                data-section-index="${index}"
                                placeholder="Write lyrics for this section..."
                            >${escapeHtml(
                                section.lyrics || ""
                            )}</textarea>
                        </label>

                        <div class="song-demo-member-heading">
                            <div>
                                <strong>
                                    Members
                                </strong>

                                <small>
                                    Assign a member to this section
                                    if needed.
                                </small>
                            </div>

                            <button
                                type="button"
                                class="secondary-button"
                                onclick="addSongDemoMember(${index})"
                            >
                                ＋ Add member
                            </button>
                        </div>

                        <div
                            class="song-demo-members"
                            data-members-for="${index}"
                        >
                            ${
                                section.members?.length
                                    ? section.members
                                          .map(
                                              (
                                                  member,
                                                  memberIndex
                                              ) =>
                                                  renderSongDemoMember(
                                                      index,
                                                      member,
                                                      memberIndex
                                                  )
                                          )
                                          .join("")
                                    : `
                                        <div class="detail-empty">
                                            No member assigned.
                                        </div>
                                    `
                            }
                        </div>
                    </article>
                `
            )
            .join("");

    syncSongDemoSectionInputs();
}

function renderSongDemoSectionTypeOptions(
    selected
) {
    const types = [
        ["intro", "Intro"],
        ["verse", "Verse"],
        ["pre_chorus", "Pre-Chorus"],
        ["chorus", "Chorus"],
        ["post_chorus", "Post-Chorus"],
        ["bridge", "Bridge"],
        ["breakdown", "Breakdown"],
        ["interlude", "Interlude"],
        ["outro", "Outro"],
        ["custom", "Custom"]
    ];

    return types
        .map(
            ([value, label]) => `
                <option
                    value="${value}"
                    ${
                        value === selected
                            ? "selected"
                            : ""
                    }
                >
                    ${label}
                </option>
            `
        )
        .join("");
}

function renderSongDemoMember(
    sectionIndex,
    member,
    memberIndex
) {
    return `
        <div
            class="song-demo-member-row"
            data-member-index="${memberIndex}"
        >
            <select
                data-member-field="employee"
                data-section-index="${sectionIndex}"
                data-member-index="${memberIndex}"
            >
                <option value="">
                    Select member...
                </option>

                ${songDemoPeople
                    .map(person => {
                        const name =
                            person.display_name ||
                            person.username ||
                            person.employee_number ||
                            "Employee";

                        return `
                            <option
                                value="${escapeAttribute(
                                    person.id
                                )}"
                                ${
                                    String(
                                        person.id
                                    ) ===
                                    String(
                                        member.employee_id
                                    )
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(
                                    name
                                )}
                            </option>
                        `;
                    })
                    .join("")}
            </select>

            <input
                type="text"
                data-member-field="name"
                data-section-index="${sectionIndex}"
                data-member-index="${memberIndex}"
                value="${escapeAttribute(
                    member.member_name || ""
                )}"
                placeholder="Member name"
            >

            <button
                type="button"
                class="danger-button"
                onclick="removeSongDemoMember(
                    ${sectionIndex},
                    ${memberIndex}
                )"
            >
                Remove
            </button>
        </div>
    `;
}

function addSongDemoMember(
    sectionIndex
) {
    const section =
        songDemoSections[
            sectionIndex
        ];

    if (!section) {
        return;
    }

    if (!section.members) {
        section.members = [];
    }

    section.members.push({
        member_name: "",
        employee_id: null,
        lyrics: "",
        sort_order:
            section.members.length
    });

    renderSongDemoSectionList();
}

function removeSongDemoMember(
    sectionIndex,
    memberIndex
) {
    const section =
        songDemoSections[
            sectionIndex
        ];

    if (!section?.members) {
        return;
    }

    section.members.splice(
        memberIndex,
        1
    );

    renderSongDemoSectionList();
}

function addSongDemoCustomSection() {
    syncSongDemoSectionInputs();

    const number =
        songDemoSections.length + 1;

    songDemoSections.push({
        section_type: "custom",
        section_number: number,
        title: `Section ${number}`,
        enabled: true,
        lyrics: "",
        members: []
    });

    renderSongDemoSectionList();
}

function moveSongDemoSection(
    index,
    direction
) {
    syncSongDemoSectionInputs();

    if (
        direction === "up" &&
        index > 0
    ) {
        [
            songDemoSections[index - 1],
            songDemoSections[index]
        ] = [
            songDemoSections[index],
            songDemoSections[index - 1]
        ];
    }

    if (
        direction === "down" &&
        index <
            songDemoSections.length - 1
    ) {
        [
            songDemoSections[index],
            songDemoSections[index + 1]
        ] = [
            songDemoSections[index + 1],
            songDemoSections[index]
        ];
    }

    renderSongDemoSectionList();
}

function syncSongDemoSectionInputs() {
    document
        .querySelectorAll(
            "[data-section-field]"
        )
        .forEach(input => {
            const index =
                Number(
                    input.dataset.sectionIndex
                );

            const field =
                input.dataset.sectionField;

            const section =
                songDemoSections[index];

            if (!section) {
                return;
            }

            if (
                field === "enabled"
            ) {
                section.enabled =
                    input.checked;
            } else if (
                field === "type"
            ) {
                section.section_type =
                    input.value;
            } else {
                section[field] =
                    input.value;
            }
        });

    document
        .querySelectorAll(
            "[data-member-field]"
        )
        .forEach(input => {
            const sectionIndex =
                Number(
                    input.dataset.sectionIndex
                );

            const memberIndex =
                Number(
                    input.dataset.memberIndex
                );

            const field =
                input.dataset.memberField;

            const section =
                songDemoSections[
                    sectionIndex
                ];

            const member =
                section?.members?.[
                    memberIndex
                ];

            if (!member) {
                return;
            }

            if (
                field === "employee"
            ) {
                member.employee_id =
                    input.value || null;

                if (
                    input.value
                ) {
                    const person =
                        songDemoPeople.find(
                            employee =>
                                String(
                                    employee.id
                                ) ===
                                String(
                                    input.value
                                )
                        );

                    if (person) {
                        member.member_name =
                            person.display_name ||
                            person.username ||
                            person.employee_number ||
                            "";
                    }
                }
            } else {
                member[field] =
                    input.value;
            }
        });
}

async function saveSongDemoLyrics() {
    syncSongDemoSectionInputs();

    const title =
        document.querySelector(
            "#song-demo-title"
        )?.value.trim();

    const visibility =
        document.querySelector(
            "#song-demo-visibility"
        )?.value ||
        "personal";

    const demoType =
        document.querySelector(
            "#song-demo-type"
        )?.value ||
        "lyrics";

    const coverUrl =
        document.querySelector(
            "#song-demo-cover-url"
        )?.value.trim() ||
        null;

    const message =
        document.querySelector(
            "#song-demo-lyrics-message"
        );

    const button =
        document.querySelector(
            "#song-demo-save-lyrics"
        );

    if (!title) {
        if (message) {
            message.textContent =
                "Please enter a demo name.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (
        !songDemoSections.length
    ) {
        if (message) {
            message.textContent =
                "Please add at least one song section.";

            message.classList.add(
                "error"
            );
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Creating...";
    }

    const packageFilename =
        await buildSongDemoPackageFilename(
            "lyrics"
        );

    const { data: demo, error } =
        await supabaseClient
            .from("song_demos")
            .insert({
                created_by_employee_id:
                    currentEmployee.id,
                title,
                demo_type:
                    demoType ===
                    "competition"
                        ? "competition"
                        : "lyrics",
                visibility,
                status:
                    "draft",
                package_filename:
                    packageFilename,
                producer_employee_id:
                    currentEmployee.id,
                cover_url:
                    coverUrl,
                release_assignment_status:
                    "unassigned",
                is_competition:
                    demoType ===
                    "competition",
                poll_enabled:
                    visibility ===
                    "public"
            })
            .select()
            .single();

    if (error) {
        console.error(
            "Failed to create lyrics demo:",
            error
        );

        if (message) {
            message.textContent =
                error.message;

            message.classList.add(
                "error"
            );
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                "Create lyrics demo";
        }

        return;
    }

    for (
        let index = 0;
        index <
        songDemoSections.length;
        index++
    ) {
        const section =
            songDemoSections[index];

        const { data: createdSection, error: sectionError } =
            await supabaseClient
                .from("song_demo_sections")
                .insert({
                    demo_id:
                        demo.id,
                    section_order:
                        index + 1,
                    section_type:
                        section.section_type ||
                        "custom",
                    section_number:
                        section.section_number ||
                        index + 1,
                    title:
                        section.title ||
                        null,
                    enabled:
                        section.enabled !==
                        false,
                    lyrics:
                        section.lyrics ||
                        null
                })
                .select()
                .single();

        if (sectionError) {
            console.error(
                "Failed to create demo section:",
                sectionError
            );

            continue;
        }

        if (
            section.members?.length
        ) {
            const members =
                section.members.map(
                    (
                        member,
                        memberIndex
                    ) => ({
                        section_id:
                            createdSection.id,
                        member_name:
                            member.member_name ||
                            null,
                        employee_id:
                            member.employee_id ||
                            null,
                        lyrics:
                            member.lyrics ||
                            null,
                        sort_order:
                            memberIndex + 1
                    })
                );

            const {
                error: memberError
            } =
                await supabaseClient
                    .from(
                        "song_demo_section_members"
                    )
                    .insert(
                        members
                    );

            if (memberError) {
                console.error(
                    "Failed to create section members:",
                    memberError
                );
            }
        }
    }

    if (
        visibility === "shared"
    ) {
        /*
         * Shared recipients are intentionally added
         * later through the sharing UI.
         */
    }

    await supabaseClient
        .from("song_demo_events")
        .insert({
            demo_id:
                demo.id,
            user_id:
                currentUser.id,
            event_type:
                "created",
            event_data: {
                mode: "lyrics"
            }
        });

    if (message) {
        message.textContent =
            "Lyrics demo created successfully.";

        message.classList.add(
            "success"
        );
    }

    window.setTimeout(
        async () => {
            await openSongDemo(
                demo.id
            );
        },
        500
    );
}

async function buildSongDemoPackageFilename(
    type
) {
    let username =
        currentUser?.email
            ?.split("@")[0] ||
        "employee";

    try {
        const {
            data
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "username"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();

        if (
            data?.username
        ) {
            username =
                data.username;
        }
    } catch {
        // Keep fallback username.
    }

    const { count } =
        await supabaseClient
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
                currentEmployee.id
            );

    const number =
        Number(count || 0) + 1;

    const prefix =
        type === "lyrics"
            ? "lyrics"
            : "prod";

    const extension =
        type === "lyrics"
            ? "lyrdem"
            : "prodem";

    return `[${username}]_demo${number}_${prefix}.${extension}`;
}

/* =========================================================
   SONG DEMO STUDIO — SONG BASE WIZARD
   ========================================================= */

function renderSongDemoSongBaseWizard() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module song-demo-wizard">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SONG DEMO STUDIO / SONG BASE
                    </span>

                    <h1>
                        Build a song-base demo
                    </h1>

                    <p>
                        Upload a short audio demo and,
                        if available, the project from
                        your DAW.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="song-demo-wizard-back"
                    >
                        ← Start over
                    </button>
                </div>
            </div>

            <div class="song-demo-wizard-form">
                <label class="admin-editor-field">
                    <span>
                        Demo name
                    </span>

                    <input
                        type="text"
                        id="song-demo-base-title"
                        placeholder="Demo title"
                    >
                </label>

                <label class="admin-editor-field">
                    <span>
                        Visibility
                    </span>

                    <select id="song-demo-base-visibility">
                        <option value="personal">
                            Personal draft — nobody else
                        </option>

                        <option value="shared">
                            Shared draft — selected employees
                        </option>

                        <option value="public">
                            Public — Serashio + KiKi
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Demo type
                    </span>

                    <select id="song-demo-base-type">
                        <option value="song">
                            Song demo
                        </option>

                        <option value="competition">
                            Fan production competition
                        </option>
                    </select>
                </label>

                <label class="admin-editor-field">
                    <span>
                        Cover URL
                    </span>

                    <input
                        type="url"
                        id="song-demo-base-cover"
                        placeholder="Optional cover image URL"
                    >
                </label>
            </div>

            <div class="song-demo-upload-grid">
                <section class="song-demo-upload-card">
                    <div>
                        <span class="eyebrow">
                            REQUIRED
                        </span>

                        <h2>
                            Audio demo
                        </h2>

                        <p>
                            WAV or MP3. Demos must be
                            under one minute.
                        </p>
                    </div>

                    <input
                        type="file"
                        id="song-demo-audio"
                        accept=".wav,.mp3,audio/wav,audio/mpeg"
                    >

                    <div
                        id="song-demo-audio-info"
                        class="song-demo-file-info"
                    >
                        No audio selected.
                    </div>
                </section>

                <section class="song-demo-upload-card">
                    <div>
                        <span class="eyebrow">
                            OPTIONAL
                        </span>

                        <h2>
                            DAW project
                        </h2>

                        <p>
                            Add an Ableton, FL Studio,
                            Logic, or other project file.
                        </p>
                    </div>

                    <input
                        type="file"
                        id="song-demo-project"
                    >

                    <label class="admin-editor-field">
                        <span>
                            DAW
                        </span>

                        <select
                            id="song-demo-daw"
                        >
                            <option value="">
                                Select DAW...
                            </option>

                            <option value="ableton">
                                Ableton Live
                            </option>

                            <option value="fl_studio">
                                FL Studio
                            </option>

                            <option value="logic">
                                Logic Pro
                            </option>

                            <option value="other">
                                Other
                            </option>
                        </select>
                    </label>

                    <div
                        id="song-demo-project-info"
                        class="song-demo-file-info"
                    >
                        No project selected.
                    </div>
                </section>
            </div>

            <div class="song-demo-audio-preview">
                <div>
                    <span class="eyebrow">
                        PREVIEW
                    </span>

                    <h2>
                        Audio
                    </h2>
                </div>

                <audio
                    id="song-demo-audio-preview-player"
                    controls
                    preload="metadata"
                ></audio>
            </div>

            <div
                id="song-demo-base-message"
                class="admin-editor-message"
            ></div>

            <div class="song-demo-wizard-actions">
                <button
                    type="button"
                    class="secondary-button"
                    id="song-demo-wizard-back"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="person-save-button"
                    id="song-demo-save-base"
                >
                    Create song demo
                </button>
            </div>
        </section>
    `;

    const audioInput =
        document.querySelector(
            "#song-demo-audio"
        );

    if (audioInput) {
        audioInput.addEventListener(
            "change",
            previewSongDemoAudio
        );
    }

    const projectInput =
        document.querySelector(
            "#song-demo-project"
        );

    if (projectInput) {
        projectInput.addEventListener(
            "change",
            previewSongDemoProject
        );
    }
}

function previewSongDemoAudio() {
    const input =
        document.querySelector(
            "#song-demo-audio"
        );

    const info =
        document.querySelector(
            "#song-demo-audio-info"
        );

    const player =
        document.querySelector(
            "#song-demo-audio-preview-player"
        );

    if (
        !input?.files?.length
    ) {
        if (info) {
            info.textContent =
                "No audio selected.";
        }

        if (player) {
            player.removeAttribute(
                "src"
            );

            player.load();
        }

        return;
    }

    const file =
        input.files[0];

    if (info) {
        info.textContent =
            `${file.name} · ${formatFileSize(
                file.size
            )}`;
    }

    if (player) {
        const url =
            URL.createObjectURL(
                file
            );

        player.src =
            url;

        player.load();
    }

    validateSongDemoAudio(
        file
    );
}

function previewSongDemoProject() {
    const input =
        document.querySelector(
            "#song-demo-project"
        );

    const info =
        document.querySelector(
            "#song-demo-project-info"
        );

    if (
        !input?.files?.length
    ) {
        if (info) {
            info.textContent =
                "No project selected.";
        }

        return;
    }

    const file =
        input.files[0];

    if (info) {
        info.textContent =
            `${file.name} · ${formatFileSize(
                file.size
            )}`;
    }
}

async function validateSongDemoAudio(
    file
) {
    const message =
        document.querySelector(
            "#song-demo-base-message"
        );

    if (!file) {
        return false;
    }

    const validMime =
        [
            "audio/wav",
            "audio/x-wav",
            "audio/mpeg"
        ].includes(
            file.type
        );

    const validExtension =
        /\.(wav|mp3)$/i.test(
            file.name
        );

    if (
        !validMime &&
        !validExtension
    ) {
        if (message) {
            message.textContent =
                "Please select a WAV or MP3 file.";

            message.className =
                "admin-editor-message error";
        }

        return false;
    }

    if (
        file.size <= 0
    ) {
        if (message) {
            message.textContent =
                "The selected audio file is empty.";

            message.className =
                "admin-editor-message error";
        }

        return false;
    }

    const duration =
        await getAudioDuration(
            file
        );

    if (
        duration !== null &&
        duration >= 60
    ) {
        if (message) {
            message.textContent =
                "Demo audio must be under one minute.";

            message.className =
                "admin-editor-message error";
        }

        return false;
    }

    if (message) {
        message.textContent =
            duration !== null
                ? `Audio ready · ${formatDuration(
                      duration
                  )}`
                : "Audio ready.";

        message.className =
            "admin-editor-message success";
    }

    return true;
}

function getAudioDuration(
    file
) {
    return new Promise(resolve => {
        const audio =
            document.createElement(
                "audio"
            );

        const url =
            URL.createObjectURL(
                file
            );

        audio.preload =
            "metadata";

        audio.onloadedmetadata =
            () => {
                const duration =
                    Number(
                        audio.duration
                    );

                URL.revokeObjectURL(
                    url
                );

                resolve(
                    Number.isFinite(
                        duration
                    )
                        ? duration
                        : null
                );
            };

        audio.onerror = () => {
            URL.revokeObjectURL(
                url
            );

            resolve(null);
        };

        audio.src =
            url;
    });
}

async function saveSongDemoBase() {
    const title =
        document.querySelector(
            "#song-demo-base-title"
        )?.value.trim();

    const visibility =
        document.querySelector(
            "#song-demo-base-visibility"
        )?.value ||
        "personal";

    const demoType =
        document.querySelector(
            "#song-demo-base-type"
        )?.value ||
        "song";

    const coverUrl =
        document.querySelector(
            "#song-demo-base-cover"
        )?.value.trim() ||
        null;

    const audioInput =
        document.querySelector(
            "#song-demo-audio"
        );

    const projectInput =
        document.querySelector(
            "#song-demo-project"
        );

    const daw =
        document.querySelector(
            "#song-demo-daw"
        )?.value ||
        null;

    const message =
        document.querySelector(
            "#song-demo-base-message"
        );

    const button =
        document.querySelector(
            "#song-demo-save-base"
        );

    const audioFile =
        audioInput?.files?.[0] ||
        null;

    const projectFile =
        projectInput?.files?.[0] ||
        null;

    if (!title) {
        if (message) {
            message.textContent =
                "Please enter a demo name.";

            message.className =
                "admin-editor-message error";
        }

        return;
    }

    if (!audioFile) {
        if (message) {
            message.textContent =
                "Please select an audio demo.";

            message.className =
                "admin-editor-message error";
        }

        return;
    }

    const audioValid =
        await validateSongDemoAudio(
            audioFile
        );

    if (!audioValid) {
        return;
    }

    const duration =
        await getAudioDuration(
            audioFile
        );

    if (
        duration !== null &&
        duration >= 60
    ) {
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Creating...";
    }

    if (message) {
        message.textContent =
            "Creating demo...";

        message.className =
            "admin-editor-message";
    }

    const packageFilename =
        await buildSongDemoPackageFilename(
            "song"
        );

    const {
        data: demo,
        error
    } =
        await supabaseClient
            .from("song_demos")
            .insert({
                created_by_employee_id:
                    currentEmployee.id,
                title,
                demo_type:
                    demoType ===
                    "competition"
                        ? "competition"
                        : "song",
                visibility,
                status:
                    "draft",
                package_filename:
                    packageFilename,
                producer_employee_id:
                    currentEmployee.id,
                cover_url:
                    coverUrl,
                release_assignment_status:
                    "unassigned",
                is_competition:
                    demoType ===
                    "competition",
                poll_enabled:
                    visibility ===
                    "public"
            })
            .select()
            .single();

    if (error) {
        console.error(
            "Failed to create song demo:",
            error
        );

        if (message) {
            message.textContent =
                error.message;

            message.className =
                "admin-editor-message error";
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                "Create song demo";
        }

        return;
    }

    /*
     * Storage upload paths are deliberately generated
     * under the demo ID. The corresponding private
     * Storage bucket should be configured separately.
     */

    const audioPath =
        `song-demos/${demo.id}/audio/${crypto.randomUUID()}-${sanitizeFilename(
            audioFile.name
        )}`;

    const audioUpload =
        await supabaseClient.storage
            .from(
                "song-demo-private"
            )
            .upload(
                audioPath,
                audioFile,
                {
                    cacheControl:
                        "3600",
                    upsert:
                        false,
                    contentType:
                        audioFile.type ||
                        "audio/mpeg"
                }
            );

    if (audioUpload.error) {
        console.error(
            "Failed to upload demo audio:",
            audioUpload.error
        );

        await supabaseClient
            .from("song_demos")
            .delete()
            .eq(
                "id",
                demo.id
            );

        if (message) {
            message.textContent =
                audioUpload.error.message;

            message.className =
                "admin-editor-message error";
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                "Create song demo";
        }

        return;
    }

    const {
        error: assetError
    } =
        await supabaseClient
            .from("song_demo_assets")
            .insert({
                demo_id:
                    demo.id,
                asset_type:
                    "audio",
                original_filename:
                    audioFile.name,
                storage_path:
                    audioPath,
                mime_type:
                    audioFile.type ||
                    null,
                file_size:
                    audioFile.size,
                duration_seconds:
                    duration
            });

    if (assetError) {
        console.error(
            "Failed to create audio asset:",
            assetError
        );
    }

    if (projectFile) {
        const projectPath =
            `song-demos/${demo.id}/project/${crypto.randomUUID()}-${sanitizeFilename(
                projectFile.name
            )}`;

        const projectUpload =
            await supabaseClient.storage
                .from(
                    "song-demo-private"
                )
                .upload(
                    projectPath,
                    projectFile,
                    {
                        cacheControl:
                            "3600",
                        upsert:
                            false,
                        contentType:
                            projectFile.type ||
                            "application/octet-stream"
                    }
                );

        if (projectUpload.error) {
            console.error(
                "Failed to upload DAW project:",
                projectUpload.error
            );
        } else {
            const {
                error: projectAssetError
            } =
                await supabaseClient
                    .from(
                        "song_demo_assets"
                    )
                    .insert({
                        demo_id:
                            demo.id,
                        asset_type:
                            "daw_project",
                        original_filename:
                            projectFile.name,
                        storage_path:
                            projectPath,
                        mime_type:
                            projectFile.type ||
                            null,
                        file_size:
                            projectFile.size,
                        daw_type:
                            daw
                    });

            if (projectAssetError) {
                console.error(
                    "Failed to create project asset:",
                    projectAssetError
                );
            }
        }
    }

    await supabaseClient
        .from("song_demo_events")
        .insert({
            demo_id:
                demo.id,
            user_id:
                currentUser.id,
            event_type:
                "created",
            event_data: {
                mode: "song",
                audio_duration:
                    duration,
                daw
            }
        });

    if (message) {
        message.textContent =
            "Song demo created successfully.";

        message.className =
            "admin-editor-message success";
    }

    window.setTimeout(
        async () => {
            await openSongDemo(
                demo.id
            );
        },
        500
    );
}

function sanitizeFilename(
    filename
) {
    return String(filename || "")
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )
        .replace(
            /_+/g,
            "_"
        )
        .slice(0, 180);
}

/* =========================================================
   SONG DEMO STUDIO — LIBRARY
   ========================================================= */

let songDemos = [];
let currentSongDemoId = null;

async function renderSongDemoLibrary() {
    const content =
        document.querySelector(
            ".dashboard-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <section class="admin-module song-demo-library">
            <div class="module-header">
                <div>
                    <span class="eyebrow">
                        SONG DEMO STUDIO
                    </span>

                    <h1>
                        Demo Library
                    </h1>

                    <p>
                        View internal demos, publication
                        status, release assignment, and polls.
                    </p>
                </div>

                <div class="module-header-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="song-demo-refresh"
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        class="person-save-button"
                        data-section="song-demo-create"
                    >
                        ＋ Create Demo
                    </button>
                </div>
            </div>

            <div class="song-demo-library-toolbar">
                <div class="song-demo-library-search">
                    <input
                        type="search"
                        id="song-demo-search"
                        placeholder="Search demos..."
                        autocomplete="off"
                    >
                </div>

                <div class="song-demo-filter-buttons">
                    <button
                        type="button"
                        class="song-demo-filter active"
                        data-song-demo-filter="all"
                    >
                        All
                    </button>

                    <button
                        type="button"
                        class="song-demo-filter"
                        data-song-demo-filter="draft"
                    >
                        Drafts
                    </button>

                    <button
                        type="button"
                        class="song-demo-filter"
                        data-song-demo-filter="public"
                    >
                        Public
                    </button>

                    <button
                        type="button"
                        class="song-demo-filter"
                        data-song-demo-filter="released"
                    >
                        Released
                    </button>
                </div>
            </div>

            <div
                class="song-demo-library-count"
                id="song-demo-library-count"
            >
                Loading...
            </div>

            <div
                class="song-demo-list"
                id="song-demo-list"
            >
                <div class="empty-state">
                    Loading demos...
                </div>
            </div>

            <div
                id="song-demo-detail-container"
            ></div>
        </section>
    `;

    const search =
        document.querySelector(
            "#song-demo-search"
        );

    if (search) {
        search.addEventListener(
            "input",
            () => {
                renderSongDemoList(
                    getFilteredSongDemos(
                        search.value
                    )
                );
            }
        );
    }

    await loadSongDemos();
}

async function loadSongDemos() {
    const list =
        document.querySelector(
            "#song-demo-list"
        );

    if (!list) {
        return;
    }

    const { data, error } =
        await supabaseClient
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
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Failed to load Song Demo Library:",
            error
        );

        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    Unable to load demos
                </h3>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>
            </div>
        `;

        return;
    }

    songDemos =
        await attachSongDemoPeople(
            data || []
        );

    renderSongDemoList(
        songDemos
    );
}

async function attachSongDemoPeople(
    demos
) {
    const employeeIds =
        [
            ...demos.map(
                demo =>
                    demo.created_by_employee_id
            ),
            ...demos.map(
                demo =>
                    demo.producer_employee_id
            )
        ]
            .filter(Boolean)
            .map(String);

    const uniqueIds =
        [
            ...new Set(
                employeeIds
            )
        ];

    if (!uniqueIds.length) {
        return demos;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("employees")
            .select(`
                id,
                user_id,
                employee_number,
                job_title
            `)
            .in(
                "id",
                uniqueIds
            );

    if (error) {
        console.warn(
            "Unable to attach Song Demo employees:",
            error
        );

        return demos;
    }

    const employees =
        data || [];

    const userIds =
        employees
            .map(
                employee =>
                    employee.user_id
            )
            .filter(Boolean);

    let profiles = [];

    if (userIds.length) {
        const result =
            await supabaseClient
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

        if (!result.error) {
            profiles =
                result.data || [];
        }
    }

    const profileMap =
        new Map(
            profiles.map(profile => [
                profile.id,
                profile
            ])
        );

    const employeeMap =
        new Map(
            employees.map(
                employee => {
                    const profile =
                        profileMap.get(
                            employee.user_id
                        );

                    return [
                        String(
                            employee.id
                        ),
                        {
                            ...employee,
                            profile
                        }
                    ];
                }
            )
        );

    return demos.map(
        demo => ({
            ...demo,
            creator_employee:
                employeeMap.get(
                    String(
                        demo.created_by_employee_id
                    )
                ) || null,
            producer_employee:
                employeeMap.get(
                    String(
                        demo.producer_employee_id
                    )
                ) || null
        })
    );
}

function getFilteredSongDemos(
    searchValue = ""
) {
    const query =
        String(searchValue)
            .trim()
            .toLowerCase();

    if (!query) {
        return songDemos;
    }

    return songDemos.filter(
        demo => {
            const creator =
                demo.creator_employee;

            const producer =
                demo.producer_employee;

            const searchable = [
                demo.title,
                demo.demo_type,
                demo.visibility,
                demo.status,
                demo.package_filename,
                creator?.profile
                    ?.display_name,
                creator?.profile
                    ?.username,
                producer?.profile
                    ?.display_name,
                producer?.profile
                    ?.username
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(
                query
            );
        }
    );
}

function renderSongDemoList(
    demos
) {
    const list =
        document.querySelector(
            "#song-demo-list"
        );

    if (!list) {
        return;
    }

    const count =
        document.querySelector(
            "#song-demo-library-count"
        );

    if (count) {
        count.textContent =
            `${demos.length} demo${
                demos.length === 1
                    ? ""
                    : "s"
            }`;
    }

    if (!demos.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>
                    No demos found
                </h3>

                <p>
                    Try another search or filter.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML =
        demos
            .map(
                demo =>
                    renderSongDemoCard(
                        demo
                    )
            )
            .join("");
}

function renderSongDemoCard(
    demo
) {
    const creator =
        demo.creator_employee;

    const producer =
        demo.producer_employee;

    const creatorName =
        creator?.profile
            ?.display_name ||
        creator?.profile
            ?.username ||
        creator?.employee_number ||
        "Employee";

    const producerName =
        producer?.profile
            ?.display_name ||
        producer?.profile
            ?.username ||
        producer?.employee_number ||
        "Employee";

    const releaseStatus =
        demo.release_assignment_status ||
        "unassigned";

    return `
        <article
            class="song-demo-card"
            data-song-demo-id="${escapeAttribute(
                demo.id
            )}"
        >
            <div class="song-demo-card-cover">
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
                            <span>
                                ♫
                            </span>
                        `
                }
            </div>

            <div class="song-demo-card-main">
                <div class="song-demo-card-heading">
                    <div>
                        <span class="eyebrow">
                            ${escapeHtml(
                                demo.demo_type ||
                                "demo"
                            )}
                        </span>

                        <h2>
                            ${escapeHtml(
                                demo.title ||
                                "Untitled demo"
                            )}
                        </h2>
                    </div>

                    <span class="song-demo-status status-${escapeAttribute(
                        demo.status ||
                        "draft"
                    )}">
                        ${escapeHtml(
                            formatSongDemoStatus(
                                demo.status
                            )
                        )}
                    </span>
                </div>

                <div class="song-demo-card-details">
                    <span>
                        Producer:
                        <strong>
                            ${escapeHtml(
                                producerName
                            )}
                        </strong>
                    </span>

                    <span>
                        Created by:
                        <strong>
                            ${escapeHtml(
                                creatorName
                            )}
                        </strong>
                    </span>

                    <span>
                        Visibility:
                        <strong>
                            ${escapeHtml(
                                formatSongDemoVisibility(
                                    demo.visibility
                                )
                            )}
                        </strong>
                    </span>

                    <span>
                        Release:
                        <strong>
                            ${escapeHtml(
                                formatSongDemoReleaseStatus(
                                    releaseStatus
                                )
                            )}
                        </strong>
                    </span>
                </div>

                <div class="song-demo-card-footer">
                    <span>
                        ${
                            demo.package_filename
                                ? escapeHtml(
                                      demo.package_filename
                                  )
                                : "No package generated"
                        }
                    </span>

                    <span>
                        ${formatDate(
                            demo.created_at
                        )}
                    </span>
                </div>
            </div>

            <span class="song-demo-card-arrow">
                →
            </span>
        </article>
    `;
}

function formatSongDemoStatus(
    status
) {
    const map = {
        draft: "Draft",
        published: "Published",
        poll_active: "Poll active",
        poll_ended: "Poll ended",
        under_review: "Under review",
        approved: "Approved",
        rejected: "Rejected",
        released: "Released"
    };

    return (
        map[status] ||
        status ||
        "Draft"
    );
}

function formatSongDemoVisibility(
    visibility
) {
    const map = {
        personal:
            "Personal",
        shared:
            "Shared",
        public:
            "Public"
    };

    return (
        map[visibility] ||
        visibility ||
        "Personal"
    );
}

function formatSongDemoReleaseStatus(
    status
) {
    const map = {
        unassigned:
            "Not assigned",
        assigned:
            "Assigned",
        pending:
            "Pending",
        released:
            "Released"
    };

    return (
        map[status] ||
        status ||
        "Not assigned"
    );
}

function filterSongDemos(
    filter
) {
    document
        .querySelectorAll(
            "[data-song-demo-filter]"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.songDemoFilter ===
                    filter
            );
        });

    const search =
        document.querySelector(
            "#song-demo-search"
        );

    const query =
        search?.value || "";

    let filtered =
        getFilteredSongDemos(
            query
        );

    if (filter !== "all") {
        filtered =
            filtered.filter(
                demo => {
                    if (
                        filter ===
                        "public"
                    ) {
                        return (
                            demo.visibility ===
                            "public"
                        );
                    }

                    if (
                        filter ===
                        "released"
                    ) {
                        return (
                            demo.status ===
                                "released" ||
                            demo.release_assignment_status ===
                                "released"
                        );
                    }

                    return (
                        demo.status ===
                        "draft"
                    );
                }
            );
    }

    renderSongDemoList(
        filtered
    );
}

/* =========================================================
   SIDEBAR / NAVIGATION SUPPORT
   ========================================================= */

function setDashboardPageTitle(
    title
) {
    const pageTitle =
        document.querySelector(
            ".dashboard-header h1"
        );

    if (pageTitle) {
        pageTitle.textContent =
            title;
    }

    if (title) {
        document.title =
            `${title} — Nemawashi`;
    }
}

/* =========================================================
   GLOBAL SEARCH / UTILITY HELPERS
   ========================================================= */

function normalizeSearchValue(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function safeNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}

function createElement(
    tag,
    className = "",
    textContent = ""
) {
    const element =
        document.createElement(
            tag
        );

    if (className) {
        element.className =
            className;
    }

    if (
        textContent !==
        undefined &&
        textContent !==
        null
    ) {
        element.textContent =
            textContent;
    }

    return element;
}

/* =========================================================
   SONG DEMO — SHARED DRAFT HELPERS
   ========================================================= */

async function loadSongDemoShares(
    demoId
) {
    const { data, error } =
        await supabaseClient
            .from("song_demo_shares")
            .select(`
                id,
                demo_id,
                employee_id,
                shared_by_employee_id,
                created_at
            `)
            .eq(
                "demo_id",
                demoId
            )
            .order("created_at", {
                ascending: true
            });

    if (error) {
        console.error(
            "Failed to load Song Demo shares:",
            error
        );

        return [];
    }

    return data || [];
}

async function addSongDemoShare(
    demoId,
    employeeId
) {
    if (
        !demoId ||
        !employeeId ||
        !currentEmployee?.id
    ) {
        return {
            error:
                new Error(
                    "Missing demo or employee."
                )
        };
    }

    return await supabaseClient
        .from("song_demo_shares")
        .insert({
            demo_id:
                demoId,
            employee_id:
                employeeId,
            shared_by_employee_id:
                currentEmployee.id
        });
}

async function removeSongDemoShare(
    demoId,
    employeeId
) {
    return await supabaseClient
        .from("song_demo_shares")
        .delete()
        .eq(
            "demo_id",
            demoId
        )
        .eq(
            "employee_id",
            employeeId
        );
}

/* =========================================================
   SONG DEMO — RELEASE ASSIGNMENT
   ========================================================= */

async function loadSongDemoReleases(
    artistId = null
) {
    let query =
        supabaseClient
            .from("releases")
            .select(`
                id,
                artist_id,
                title,
                type,
                release_date
            `)
            .order("release_date", {
                ascending: false
            });

    if (artistId) {
        query =
            query.eq(
                "artist_id",
                artistId
            );
    }

    const { data, error } =
        await query;

    if (error) {
        console.error(
            "Failed to load releases:",
            error
        );

        return [];
    }

    return data || [];
}

async function assignSongDemoToRelease(
    demoId,
    releaseId
) {
    if (!demoId) {
        return {
            error:
                new Error(
                    "Missing demo ID."
                )
        };
    }

    const { error } =
        await supabaseClient
            .from("song_demos")
            .update({
                linked_release_id:
                    releaseId ||
                    null,
                release_assignment_status:
                    releaseId
                        ? "assigned"
                        : "unassigned"
            })
            .eq(
                "id",
                demoId
            );

    if (!error) {
        const local =
            songDemos.find(
                demo =>
                    String(
                        demo.id
                    ) ===
                    String(
                        demoId
                    )
            );

        if (local) {
            local.linked_release_id =
                releaseId ||
                null;

            local.release_assignment_status =
                releaseId
                    ? "assigned"
                    : "unassigned";
        }
    }

    return {
        error
    };
}

/* =========================================================
   SONG DEMO — POLL HELPERS
   ========================================================= */

async function createSongDemoPoll(
    demoId,
    question,
    startsAt,
    endsAt
) {
    if (!demoId) {
        return {
            data: null,
            error:
                new Error(
                    "Missing demo ID."
                )
        };
    }

    return await supabaseClient
        .from("song_demo_polls")
        .insert({
            demo_id:
                demoId,
            question:
                question ||
                "Should this demo become a release?",
            starts_at:
                startsAt ||
                new Date().toISOString(),
            ends_at:
                endsAt ||
                null,
            status:
                "draft"
        })
        .select()
        .single();
}

async function endSongDemoPoll(
    pollId
) {
    if (!pollId) {
        return {
            error:
                new Error(
                    "Missing poll ID."
                )
        };
    }

    return await supabaseClient
        .from("song_demo_polls")
        .update({
            status:
                "ended"
        })
        .eq(
            "id",
            pollId
        );
}

async function submitSongDemoPollVote(
    pollId,
    vote
) {
    if (
        !pollId ||
        !currentUser?.id
    ) {
        return {
            error:
                new Error(
                    "You must be signed in to vote."
                )
        };
    }

    const normalizedVote =
        vote === "no"
            ? "no"
            : "yes";

    return await supabaseClient
        .from("song_demo_votes")
        .insert({
            poll_id:
                pollId,
            user_id:
                currentUser.id,
            vote:
                normalizedVote
        });
}

async function loadSongDemoPollComments(
    pollId
) {
    if (!pollId) {
        return [];
    }

    const { data, error } =
        await supabaseClient
            .from(
                "song_demo_poll_comments"
            )
            .select(`
                id,
                poll_id,
                user_id,
                content,
                created_at,
                updated_at
            `)
            .eq(
                "poll_id",
                pollId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {
        console.error(
            "Failed to load poll comments:",
            error
        );

        return [];
    }

    return data || [];
}

/* =========================================================
   SONG DEMO — FEEDBACK
   ========================================================= */

async function submitSongDemoFeedback(
    demoId,
    feedback
) {
    if (
        !demoId ||
        !currentUser?.id
    ) {
        return {
            error:
                new Error(
                    "You must be signed in."
                )
        };
    }

    return await supabaseClient
        .from("song_demo_feedback")
        .insert({
            demo_id:
                demoId,
            user_id:
                currentUser.id,
            feedback_type:
                feedback.feedback_type ||
                "general",
            content:
                feedback.content ||
                null,
            timestamp_seconds:
                feedback.timestamp_seconds ??
                null,
            section_id:
                feedback.section_id ||
                null,
            member_name:
                feedback.member_name ||
                null
        });
}

/* =========================================================
   SONG DEMO — COMPETITIONS
   ========================================================= */

async function loadSongDemoCompetition(
    demoId
) {
    const { data, error } =
        await supabaseClient
            .from(
                "song_demo_competitions"
            )
            .select(`
                id,
                demo_id,
                title,
                description,
                submission_deadline,
                max_duration_seconds,
                status,
                winning_entry_id,
                created_at,
                updated_at
            `)
            .eq(
                "demo_id",
                demoId
            )
            .maybeSingle();

    if (error) {
        console.error(
            "Failed to load competition:",
            error
        );

        return null;
    }

    return data || null;
}

async function loadSongDemoCompetitionEntries(
    competitionId
) {
    if (!competitionId) {
        return [];
    }

    const { data, error } =
        await supabaseClient
            .from(
                "song_demo_competition_entries"
            )
            .select(`
                id,
                competition_id,
                user_id,
                title,
                audio_storage_path,
                project_storage_path,
                duration_seconds,
                description,
                status,
                created_at
            `)
            .eq(
                "competition_id",
                competitionId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {
        console.error(
            "Failed to load competition entries:",
            error
        );

        return [];
    }

    return data || [];
}

/* =========================================================
   SONG DEMO — EVENT LOGGING
   ========================================================= */

async function logSongDemoEvent(
    demoId,
    eventType,
    eventData = {}
) {
    if (
        !demoId ||
        !currentUser?.id
    ) {
        return;
    }

    const { error } =
        await supabaseClient
            .from(
                "song_demo_events"
            )
            .insert({
                demo_id:
                    demoId,
                user_id:
                    currentUser.id,
                event_type:
                    eventType,
                event_data:
                    eventData
            });

    if (error) {
        console.warn(
            "Failed to log Song Demo event:",
            error
        );
    }
}

/* =========================================================
   SONG DEMO — STATUS HELPERS
   ========================================================= */

function isSongDemoPublic(
    demo
) {
    return (
        demo?.visibility ===
        "public"
    );
}

function isSongDemoReleased(
    demo
) {
    return (
        demo?.status ===
            "released" ||
        demo?.release_assignment_status ===
            "released"
    );
}

function isSongDemoPollEnded(
    poll
) {
    if (!poll) {
        return false;
    }

    if (
        [
            "ended",
            "calculating",
            "review",
            "approved",
            "rejected"
        ].includes(
            poll.status
        )
    ) {
        return true;
    }

    if (!poll.ends_at) {
        return false;
    }

    return (
        new Date(
            poll.ends_at
        ).getTime() <=
        Date.now()
    );
}

function getSongDemoPollBanner(
    days
) {
    return `
        <div class="song-demo-poll-ended-banner">
            <strong>
                this poll has ended
            </strong>

            <p>
                Votes are being calculated through
                the NTD (Nemawashi Transport Deliver)
                system. Please stay patient, the
                release tracks will be made public in
                ${escapeHtml(
                    String(days ?? "[X]")
                )} days
            </p>
        </div>
    `;
}

/* =========================================================
   SONG DEMO — PUBLICATION
   ========================================================= */

async function publishSongDemo(
    demoId
) {
    if (!demoId) {
        return {
            error:
                new Error(
                    "Missing demo ID."
                )
        };
    }

    const result =
        await supabaseClient
            .from("song_demos")
            .update({
                visibility:
                    "public",
                status:
                    "published",
                publication_date:
                    new Date().toISOString()
            })
            .eq(
                "id",
                demoId
            );

    if (!result.error) {
        await logSongDemoEvent(
            demoId,
            "published"
        );
    }

    return result;
}

async function unpublishSongDemo(
    demoId
) {
    if (!demoId) {
        return {
            error:
                new Error(
                    "Missing demo ID."
                )
        };
    }

    const result =
        await supabaseClient
            .from("song_demos")
            .update({
                visibility:
                    "personal",
                status:
                    "draft",
                publication_date:
                    null
            })
            .eq(
                "id",
                demoId
            );

    if (!result.error) {
        await logSongDemoEvent(
            demoId,
            "unpublished"
        );
    }

    return result;
}

/* =========================================================
   SONG DEMO — SAFE DOWNLOAD / STORAGE HELPERS
   ========================================================= */

async function createSongDemoSignedUrl(
    storagePath,
    expiresIn = 300
) {
    if (!storagePath) {
        return {
            data: null,
            error:
                new Error(
                    "Missing storage path."
                )
        };
    }

    return await supabaseClient.storage
        .from(
            "song-demo-private"
        )
        .createSignedUrl(
            storagePath,
            expiresIn
        );
}

async function uploadSongDemoAsset(
    file,
    demoId,
    assetType,
    extra = {}
) {
    if (
        !file ||
        !demoId
    ) {
        return {
            data: null,
            error:
                new Error(
                    "Missing file or demo."
                )
        };
    }

    const path =
        `song-demos/${demoId}/${assetType}/${crypto.randomUUID()}-${sanitizeFilename(
            file.name
        )}`;

    const upload =
        await supabaseClient.storage
            .from(
                "song-demo-private"
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",
                    upsert:
                        false,
                    contentType:
                        file.type ||
                        "application/octet-stream"
                }
            );

    if (upload.error) {
        return {
            data: null,
            error:
                upload.error
        };
    }

    const asset =
        await supabaseClient
            .from(
                "song_demo_assets"
            )
            .insert({
                demo_id:
                    demoId,
                asset_type:
                    assetType,
                original_filename:
                    file.name,
                storage_path:
                    path,
                mime_type:
                    file.type ||
                    null,
                file_size:
                    file.size,
                ...extra
            })
            .select()
            .single();

    if (asset.error) {
        return {
            data: null,
            error:
                asset.error
        };
    }

    return {
        data:
            asset.data,
        error:
            null
    };
}

/* =========================================================
   SONG DEMO — DATE HELPERS
   ========================================================= */

function daysUntil(
    dateValue
) {
    if (!dateValue) {
        return null;
    }

    const target =
        new Date(
            dateValue
        ).getTime();

    if (
        Number.isNaN(
            target
        )
    ) {
        return null;
    }

    const difference =
        target -
        Date.now();

    return Math.max(
        0,
        Math.ceil(
            difference /
                86400000
        )
    );
}

function formatRelativeDate(
    dateValue
) {
    const days =
        daysUntil(
            dateValue
        );

    if (
        days === null
    ) {
        return "—";
    }

    if (days === 0) {
        return "Today";
    }

    if (days === 1) {
        return "Tomorrow";
    }

    return `In ${days} days`;
}

/* =========================================================
   SONG DEMO — FORM VALIDATION
   ========================================================= */

function validateSongDemoTitle(
    title
) {
    return (
        typeof title ===
            "string" &&
        title.trim().length >=
            1 &&
        title.trim().length <=
            200
    );
}

function validateSongDemoVisibility(
    visibility
) {
    return [
        "personal",
        "shared",
        "public"
    ].includes(
        visibility
    );
}

function validateSongDemoType(
    type
) {
    return [
        "lyrics",
        "song",
        "competition"
    ].includes(
        type
    );
}

/* =========================================================
   SONG DEMO — UI MESSAGE
   ========================================================= */

function showSongDemoMessage(
    element,
    message,
    type = ""
) {
    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "admin-editor-message";

    if (type) {
        element.classList.add(
            type
        );
    }
}

/* =========================================================
   GENERAL NAVIGATION STATE
   ========================================================= */

window.nemawashiDashboard = {
    get currentUser() {
        return currentUser;
    },

    get currentEmployee() {
        return currentEmployee;
    },

    get currentSection() {
        return currentSection;
    },

    get songDemoStudioAccess() {
        return songDemoStudioAccess;
    },

    openSection,

    openPerson,

    openCompany,

    openRole,

    openArtist,

    openSongDemo
};

/* =========================================================
   INITIAL DASHBOARD NAVIGATION / ACTIVE STATE
   ========================================================= */

function updateActiveNavigation(
    section
) {
    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.section ===
                    section
            );
        });
}

function updateDashboardHeader(
    section
) {
    const titles = {
        overview:
            "Overview",
        people:
            "People",
        organization:
            "Organization",
        permissions:
            "Permissions",
        notices:
            "Notices",
        banners:
            "Banners",
        artists:
            "Artists",
        "kiki-posts":
            "KiKi Staff Posts",
        "kiki-profiles":
            "KiKi Profiles",
        "song-demo-library":
            "Demo Library",
        "song-demo-create":
            "Create Demo",
        "song-demo-polls":
            "Demo Polls",
        "song-demo-reviews":
            "Poll Reviews"
    };

    const title =
        titles[section] ||
        "Nemawashi";

    setDashboardPageTitle(
        title
    );

    updateActiveNavigation(
        section
    );
}

/*
 * Keep the original openSection behavior while making
 * the header/navigation state consistent.
 */
const originalOpenSection =
    openSection;

openSection = async function(
    section
) {
    updateDashboardHeader(
        section
    );

    return await originalOpenSection(
        section
    );
};

/* =========================================================
   SIDEBAR INITIALIZATION
   ========================================================= */

function initializeSidebarNavigation() {
    document
        .querySelectorAll(
            ".nav-item[data-section]"
        )
        .forEach(item => {
            item.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key ===
                            "Enter" ||
                        event.key ===
                            " "
                    ) {
                        event.preventDefault();

                        item.click();
                    }
                }
            );
        });
}

/* =========================================================
   AUTH STATE
   ========================================================= */

if (
    typeof supabaseClient !==
    "undefined"
) {
    supabaseClient.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {
            if (
                event ===
                    "SIGNED_OUT" ||
                !session
            ) {
                window.location.href =
                    "index.html";
            }
        }
    );
}

/* =========================================================
   PAGE STARTUP
   ========================================================= */

window.addEventListener(
    "load",
    () => {
        initializeSidebarNavigation();

        updateDashboardHeader(
            currentSection
        );
    }
);
