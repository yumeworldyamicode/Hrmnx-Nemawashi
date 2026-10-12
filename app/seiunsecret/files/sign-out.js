/* log-in.html becomes a sign-out action when a KiKi session already exists. */
window.runTempaccSignOut = async function () {
  const client = window.tempaccSupabase;
  if (!client) throw new Error('KiKi authentication is not ready yet.');
  const { error } = await client.auth.signOut();
  if (error) throw error;
  return { ok: true };
};
