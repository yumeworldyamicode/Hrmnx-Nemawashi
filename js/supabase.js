const SUPABASE_URL = "https://bftgnubawqwvpbqkldpm.supabase.co";
const SUPABASE_KEY = "sb_publishable_Uoky_Y8iSnzCu0wOa5_y-w_McGOJcJ4";

// Expose the shared client on window for apps that access it through window.supabaseClient,
// while retaining the top-level name used by existing Nemawashi pages.
if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase JS did not load. Check the Supabase CDN script.");
}
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseClient = window.supabaseClient;
