import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("INDESIGN_APP_ORIGIN") ?? "https://nemawashi.hrmnx.site",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type Provider = "figma" | "adobe" | "canva";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function randomBase64Url(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  let binary = "";
  data.forEach((value) => binary += String.fromCharCode(value));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  let binary = "";
  new Uint8Array(digest).forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const providerConfig: Record<Provider, {
  clientEnv: string;
  scopesEnv: string;
  authorizeUrl: string;
  usePkce: boolean;
}> = {
  figma: {
    clientEnv: "FIGMA_CLIENT_ID",
    scopesEnv: "FIGMA_SCOPES",
    authorizeUrl: "https://www.figma.com/oauth",
    usePkce: false,
  },
  adobe: {
    clientEnv: "ADOBE_CLIENT_ID",
    scopesEnv: "ADOBE_SCOPES",
    authorizeUrl: "https://ims-na1.adobelogin.com/ims/authorize/v2",
    usePkce: false,
  },
  canva: {
    clientEnv: "CANVA_CLIENT_ID",
    scopesEnv: "CANVA_SCOPES",
    authorizeUrl: "https://www.canva.com/api/oauth/authorize",
    usePkce: true,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json(500, { error: "Server configuration is incomplete." });

    const bearer = req.headers.get("Authorization") ?? "";
    const jwt = bearer.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt === bearer) return json(401, { error: "Please sign in again." });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !authData.user) return json(401, { error: "Your employee session could not be verified." });

    const { data: profile, error: profileError } = await admin
      .from("profiles").select("is_staff").eq("id", authData.user.id).maybeSingle();
    if (profileError || profile?.is_staff !== true) return json(403, { error: "An active Nemawashi employee account is required." });

    const body = await req.json().catch(() => ({}));
    const provider = body.provider as Provider;
    if (!provider || !(provider in providerConfig)) return json(400, { error: "This provider is not available for OAuth yet." });

    const config = providerConfig[provider];
    const clientId = Deno.env.get(config.clientEnv);
    const scopes = Deno.env.get(config.scopesEnv);
    if (!clientId || !scopes) {
      return json(503, { error: provider.toUpperCase() + " is not configured yet. Add its client ID and scopes to Supabase Edge Function secrets." });
    }

    const redirectUri = supabaseUrl + "/functions/v1/indesign-oauth-callback?provider=" + provider;
    const state = randomBase64Url(32);
    const stateHash = await sha256Base64Url(state);
    const verifier = config.usePkce ? randomBase64Url(64) : null;
    const challenge = verifier ? await sha256Base64Url(verifier) : null;

    const { error: stateError } = await admin.from("indesign_oauth_states").insert({
      state_hash: stateHash,
      user_id: authData.user.id,
      provider,
      pkce_verifier: verifier,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (stateError) throw stateError;

    const url = new URL(config.authorizeUrl);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("scope", scopes);
    if (provider === "canva") {
      url.searchParams.set("code_challenge", challenge!);
      url.searchParams.set("code_challenge_method", "s256");
    }
    return json(200, { authorization_url: url.toString() });
  } catch (error) {
    console.error("indesign OAuth start failed:", error);
    return json(500, { error: "Could not start provider authorisation. Check the Edge Function logs." });
  }
});
