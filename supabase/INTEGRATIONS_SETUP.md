# indesign provider OAuth setup

This batch adds the shared server-side OAuth flow for Figma, Adobe and Canva.
It does not make the desktop DAWs use OAuth. Ableton Live, FL Studio, Logic Pro
and Studio One continue to use the indesign project file-exchange area.
Penpot uses personal access tokens rather than the same OAuth flow and is not
enabled by these OAuth endpoints yet.

## 1. Run the database migration

Run `app/indesign/database/step-10-oauth-security.sql` in the Supabase SQL
Editor after Step 8. The new state and token tables have no client policies;
only the Edge Functions' service-role client can access them.

## 2. Register provider apps

Create OAuth apps for Figma, Adobe and Canva in their respective developer
portals. Use this exact callback URL for each provider, replacing the provider
name at the end:

- Figma: `https://bftgnubawqwvpbqkldpm.supabase.co/functions/v1/indesign-oauth-callback`
- Adobe: `https://bftgnubawqwvpbqkldpm.supabase.co/functions/v1/indesign-oauth-callback`
- Canva: `https://bftgnubawqwvpbqkldpm.supabase.co/functions/v1/indesign-oauth-callback`

Copy each provider's client ID, client secret and approved scopes from its
developer portal. Scope availability depends on the provider app and the APIs
enabled for it; do not request scopes that the app has not been granted.

## 3. Set Edge Function secrets

Generate a fresh 32-byte encryption key and keep it private. For example, with
OpenSSL:

```sh
openssl rand -base64 32
```

From the repository root, link the Supabase project and set secrets:

```sh
supabase link --project-ref bftgnubawqwvpbqkldpm
supabase secrets set FIGMA_CLIENT_ID="..." FIGMA_CLIENT_SECRET="..." FIGMA_SCOPES="..."
supabase secrets set ADOBE_CLIENT_ID="..." ADOBE_CLIENT_SECRET="..." ADOBE_SCOPES="..."
supabase secrets set CANVA_CLIENT_ID="..." CANVA_CLIENT_SECRET="..." CANVA_SCOPES="..."
supabase secrets set INDESIGN_TOKEN_ENCRYPTION_KEY="PASTE_THE_GENERATED_BASE64_KEY"
supabase secrets set INDESIGN_APP_ORIGIN="https://nemawashi.hrmnx.site"
```

Do not put these values in GitHub files, dashboard JavaScript, or chat messages.
The Supabase Edge Functions already receive `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` from their runtime environment.

## 4. Deploy both functions

```sh
supabase functions deploy indesign-oauth-start
supabase functions deploy indesign-oauth-callback
```

The start function verifies the signed-in Nemawashi employee session. The
callback validates a short-lived, one-use state value, exchanges the code on
the server, encrypts the returned token payload with AES-GCM, and stores only
the ciphertext in the private token table.

## 5. Test

Open indesign > Integrations and use Connect on Figma, Adobe or Canva. The
provider should return to the indesign callback page and the connection should
then appear as connected after refreshing the Integrations view.

If a provider rejects the request, check its exact redirect URI, enabled scopes,
and the Supabase Edge Function logs. Never paste client secrets, access tokens,
refresh tokens or the encryption key into an issue or chat.
