import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Provider = "figma" | "adobe" | "canva";

const providerConfig: Record<Provider, {
  clientEnv: string;
  secretEnv: string;
  scopesEnv: string;
  tokenUrl: string;
  authStyle: "basic" | "body";
}> = {
  figma: {
    clientEnv: "FIGMA_CLIENT_ID",
    secretEnv: "FIGMA_CLIENT_SECRET",
    scopesEnv: "FIGMA_SCOPES",
    tokenUrl: "https://api.figma.com/v1/oauth/token",
    authStyle: "basic",
  },
  adobe: {
    clientEnv: "ADOBE_CLIENT_ID",
    secretEnv: "ADOBE_CLIENT_SECRET",
    scopesEnv: "ADOBE_SCOPES",
    tokenUrl: "https://ims-na1.adobelogin.com/ims/token/v3",
    authStyle: "basic",
  },
  canva: {
    clientEnv: "CANVA_CLIENT_ID",
    secretEnv: "CANVA_CLIENT_SECRET",
    scopesEnv: "CANVA_SCOPES",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    authStyle: "basic",
  },
};

function html(title: string, message: string, success = false) {
  const safeTitle = title.replace(/[<>]/g, "");
  const safeMessage = message.replace(/[<>]/g, "");
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} · indesign</title><body style="margin:0;background:#f6f7fb;color:#171717;font:15px Arial,sans-serif;display:grid;min-height:100vh;place-items:center"><main style="background:#fff;padding:36px;max-width:460px;margin:20px;border:1px solid #e5e7ef"><p style="font-size:11px;letter-spacing:2px;color:#748fe8;font-weight:bold">HRMNX / INDESIGN</p><h1>${safeTitle}</h1><p>${safeMessage}</p><a style="display:inline-block;margin-top:16px;color:#171717" href="https://nemawashi.hrmnx.site/app/indesign/dashboard.html">Return to indesign ↗</a>${success ? '<p style="color:#748fe8;font-size:12px">You can close this tab after returning to indesign.</p>' : ""}</main></body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function base64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptTokens(tokens: Record<string, unknown>) {
  const encodedKey = Deno.env.get("INDESIGN_TOKEN_ENCRYPTION_KEY");
  if (!encodedKey) throw new Error("Token encryption key is not configured.");
  const keyBytes = fromBase64(encodedKey);
  if (keyBytes.length !== 32) throw new Error("Token encryption key must decode to exactly 32 bytes.");
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(tokens));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { token_ciphertext: base64(new Uint8Array(ciphertext)), token_iv: base64(iv) };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") as Provider;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (!provider || !(provider in providerConfig)) return html("Unknown provider", "This provider is not enabled for OAuth.");
  if (oauthError) return html("Authorisation cancelled", "The provider did not approve access. You can return to indesign and try again.");
  if (!code || !state) return html("Authorisation failed", "The provider did not return the required authorisation details.");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Server configuration is incomplete.");
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const stateBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(state));
    const stateHash = base64(new Uint8Array(stateBytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const { data: stateRow, error: stateError } = await admin
      .from("indesign_oauth_states").select("*").eq("state_hash", stateHash)
      .eq("provider", provider).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (stateError || !stateRow) return html("Session expired", "The authorisation session expired or could not be verified. Start the connection again from indesign.");

    await admin.from("indesign_oauth_states").delete().eq("id", stateRow.id);

    const config = providerConfig[provider];
    const clientId = Deno.env.get(config.clientEnv);
    const clientSecret = Deno.env.get(config.secretEnv);
    if (!clientId || !clientSecret) throw new Error("Provider credentials are not configured.");

    const redirectUri = supabaseUrl + "/functions/v1/indesign-oauth-callback?provider=" + provider;
    const form = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
    if (provider === "canva" && stateRow.pkce_verifier) form.set("code_verifier", stateRow.pkce_verifier);
    if (config.authStyle === "body") {
      form.set("client_id", clientId);
      form.set("client_secret", clientSecret);
    }
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(config.authStyle === "basic" ? { "Authorization": "Basic " + btoa(clientId + ":" + clientSecret) } : {}),
      },
      body: form,
    });
    const tokens = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("Provider token exchange failed:", provider, tokenResponse.status, tokens);
      return html("Connection unsuccessful", "The provider could not complete authorisation. Check its app configuration and try again.");
    }

    const { data: connection, error: connectionError } = await admin
      .from("indesign_integration_connections")
      .upsert({
        user_id: stateRow.user_id,
        provider,
        account_label: provider.charAt(0).toUpperCase() + provider.slice(1) + " account",
        status: "connected",
        scopes: (Deno.env.get(config.scopesEnv) ?? "").split(/[ ,]+/).filter(Boolean),
        connected_at: new Date().toISOString(),
        last_error: null,
      }, { onConflict: "user_id,provider" })
      .select("id").single();
    if (connectionError || !connection) throw connectionError ?? new Error("Could not save provider connection.");

    const encrypted = await encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_type: tokens.token_type ?? "Bearer",
      scope: tokens.scope ?? null,
    });
    const expiresAt = tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : null;
    const { error: secretError } = await admin.from("indesign_integration_secrets").upsert({
      connection_id: connection.id,
      ...encrypted,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "connection_id" });
    if (secretError) throw secretError;

    return html("Account connected", "Your provider account is now securely connected to indesign.", true);
  } catch (error) {
    console.error("indesign OAuth callback failed:", error);
    return html("Connection unsuccessful", "The secure connection could not be completed. Check the Edge Function logs and provider configuration.");
  }
});
