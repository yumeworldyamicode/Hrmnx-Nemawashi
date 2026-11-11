(function () {
    "use strict";
    const LOGIN_URL = "../../login.html?next=" + encodeURIComponent("/app/indesign/dashboard.html");
    const DASHBOARD_URL = "dashboard.html";
    const LANDING_URL = "index.html";

    async function getEmployeeSession() {
        if (!window.supabaseClient) throw new Error("Nemawashi connection is unavailable.");
        const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
        if (authError) throw authError;
        if (!user) return null;
        const { data: profile, error: profileError } = await window.supabaseClient
            .from("profiles")
            .select("id, username, display_name, avatar_url, is_staff")
            .eq("id", user.id)
            .maybeSingle();
        if (profileError) throw profileError;
        if (!profile || profile.is_staff !== true) return null;
        return { user, profile };
    }

    window.indesignAuth = {
        getEmployeeSession,
        signOut: async function () {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.replace(LANDING_URL);
        }
    };

    document.addEventListener("DOMContentLoaded", async function () {
        const page = document.body.classList.contains("app-page") ? "dashboard" : "landing";
        try {
            const session = await getEmployeeSession();
            if (page === "dashboard" && !session) {
                window.location.replace(LOGIN_URL);
                return;
            }
            if (page === "landing" && session) window.location.replace(DASHBOARD_URL);
        } catch (error) {
            console.error("indesign authentication check failed:", error);
            if (page === "dashboard") {
                document.body.innerHTML = '<main style="font:500 14px Helvetica,Arial,sans-serif;padding:48px"><h1>Unable to verify your account.</h1><p>Please return to Nemawashi and try again.</p><a href="../../login.html?next=%2Fapp%2Findesign%2Fdashboard.html">Back to sign in</a></main>';
            }
        }
    });
})();