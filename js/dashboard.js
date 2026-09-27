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


function renderPlaceholder(section) {

    sectionLabel.textContent =
        "NEMAWASHI";

    sectionTitle.textContent =
        sectionNames[section] ||
        "Administration";


    dashboardContent.innerHTML = `

        <div class="empty-state">

            <h2>
                ${sectionNames[section] ||
                "Administration"}
            </h2>

            <p>
                This management module is being
                connected to the Hrmnx Supabase
                database.
            </p>

        </div>

    `;

}


function openSection(section) {

    if (section === "overview") {

        renderOverview(
            window.nemawashiUser
        );

        return;

    }


    renderPlaceholder(section);

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
