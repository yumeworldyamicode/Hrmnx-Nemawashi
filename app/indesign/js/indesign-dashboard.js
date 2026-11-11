(function () {
    "use strict";

    const content = document.getElementById("dashboard-content");
    const title = document.getElementById("page-title");
    const toast = document.getElementById("toast");
    let employee = null;

    function notify(message) {
        toast.textContent = message;
        toast.classList.add("visible");
        window.setTimeout(() => toast.classList.remove("visible"), 2400);
    }

    function displayName() {
        return employee?.profile?.display_name ||
            employee?.profile?.username ||
            employee?.user?.email?.split("@")[0] ||
            "Your account";
    }

    function setIdentity() {
        const name = displayName();
        const avatarUrl = employee?.profile?.avatar_url;
        document.getElementById("sidebar-name").textContent = name;
        ["sidebar-avatar", "header-avatar"].forEach(id => {
            const node = document.getElementById(id);
            if (avatarUrl) {
                node.innerHTML = "";
                node.style.backgroundImage = "url('" + avatarUrl.replace(/'/g, "%27") + "')";
                node.style.backgroundSize = "cover";
                node.style.backgroundPosition = "center";
            } else {
                node.textContent = name.charAt(0).toUpperCase();
            }
        });
    }

    function renderHome() {
        title.textContent = "Home";
        content.innerHTML = `
            <div class="welcome-row"><div><p class="eyebrow">YOUR CREATIVE WORKSPACE</p><h2>Make room<br>for new ideas.</h2><p class="muted">Start something new or continue where you left off.</p></div><button class="button button-dark" id="create-project-button">＋ Create project</button></div>
            <div class="section-heading"><h3>Start creating</h3><span>CHOOSE A PROJECT TYPE</span></div>
            <div class="project-types">
                <button class="type-card" data-create="moodboard"><span class="type-number">01</span><span class="type-symbol">▦</span><strong>Moodboard</strong><small>Collect references and connect ideas.</small><span class="type-arrow">↗</span></button>
                <button class="type-card" data-create="board"><span class="type-number">02</span><span class="type-symbol">⌗</span><strong>Regular board</strong><small>Design freely on a flexible canvas.</small><span class="type-arrow">↗</span></button>
                <button class="type-card" data-create="brainstorm"><span class="type-number">03</span><span class="type-symbol">✳</span><strong>Brainstorm</strong><small>Develop music or comeback concepts.</small><span class="type-arrow">↗</span></button>
            </div>
            <div class="section-heading recent-heading"><h3>Recent projects</h3><button class="text-button" data-view="projects">View all ↗</button></div>
            <div class="empty-state"><span>＋</span><strong>Your projects will appear here.</strong><p>Create your first project to get started.</p></div>`;
    }

    function renderProjects() {
        title.textContent = "Projects";
        content.innerHTML = `<div class="welcome-row"><div><p class="eyebrow">YOUR WORK</p><h2>All projects.</h2><p class="muted">Your personal and shared creative projects.</p></div><button class="button button-dark" id="create-project-button">＋ Create project</button></div><div class="empty-state" style="margin-top:36px"><span>▧</span><strong>No projects yet.</strong><p>Your projects will appear here when you create or import one.</p></div>`;
    }

    function renderMessages() {
        title.textContent = "Messages";
        content.innerHTML = `<p class="eyebrow">NEMAWASHI CONNECTION</p><h2 style="font-size:48px;letter-spacing:-3px">Messages.</h2><p class="muted">Your indesign messages will connect to Nemawashi and remain available there.</p><div class="empty-state" style="margin-top:32px"><span>↗</span><strong>Messaging integration is the next stage.</strong><p>This area is reserved for your Nemawashi conversations.</p></div>`;
    }

    function renderAccount() {
        title.textContent = "Account";
        const theme = document.body.classList.contains("dark-theme") ? "dark" : "light";
        content.innerHTML = `<p class="eyebrow">PERSONAL SETTINGS</p><h2 style="font-size:48px;letter-spacing:-3px">Your account.</h2><div style="max-width:560px;margin-top:35px;border-top:1px solid var(--line);padding-top:24px"><p><strong>${displayName().replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}</strong></p><p class="muted">${(employee.user.email || "").replace(/[&<>"]/g, "")}</p><div class="section-heading"><h3>Appearance</h3></div><label style="font-size:13px;font-weight:700">App theme</label><div style="display:flex;gap:10px;margin-top:12px"><button class="button ${theme === "light" ? "button-dark" : ""}" data-theme="light">Light</button><button class="button ${theme === "dark" ? "button-dark" : ""}" data-theme="dark" style="border:1px solid var(--line)">Dark</button></div><div class="section-heading"><h3>Session</h3></div><button class="button button-dark" id="sign-out-button">Sign out</button></div>`;
    }

    function showView(view) {
        document.querySelectorAll(".nav-item").forEach(button =>
            button.classList.toggle("active", button.dataset.view === view)
        );
        if (view === "projects") renderProjects();
        else if (view === "messages") renderMessages();
        else if (view === "account") renderAccount();
        else renderHome();
    }

    function chooseProject(type) {
        const labels = { moodboard: "Moodboard", board: "Regular board", brainstorm: "Brainstorm" };
        notify(labels[type] + " creation will be added in the next stage.");
    }

    document.addEventListener("click", async event => {
        const nav = event.target.closest("[data-view]");
        if (nav) {
            showView(nav.dataset.view);
            return;
        }
        const create = event.target.closest("[data-create]");
        if (create) {
            chooseProject(create.dataset.create);
            return;
        }
        if (event.target.closest("#create-project-button")) {
            notify("Choose a project type to get started.");
            return;
        }
        const themeButton = event.target.closest("[data-theme]");
        if (themeButton) {
            const dark = themeButton.dataset.theme === "dark";
            document.body.classList.toggle("dark-theme", dark);
            localStorage.setItem("indesign-theme", dark ? "dark" : "light");
            renderAccount();
            return;
        }
        if (event.target.closest("#sign-out-button")) {
            try { await window.indesignAuth.signOut(); }
            catch (error) { console.error(error); notify("Could not sign out. Please try again."); }
        }
    });

    document.addEventListener("DOMContentLoaded", async () => {
        const savedTheme = localStorage.getItem("indesign-theme");
        if (savedTheme === "dark") document.body.classList.add("dark-theme");
        try {
            employee = await window.indesignAuth.getEmployeeSession();
            if (!employee) return;
            setIdentity();
            renderHome();
        } catch (error) {
            console.error("Could not load indesign dashboard:", error);
            notify("Could not load your account.");
        }
    });
})();