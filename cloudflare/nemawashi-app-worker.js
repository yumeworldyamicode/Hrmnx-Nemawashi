export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/github/publish" && request.method === "POST") {
      return handlePublish(request, env);
    }

    if (url.pathname.startsWith("/app/")) {
      return servePublishedApp(request, env);
    }

    return fetch(request);
  }
};

async function servePublishedApp(request, env) {
  const incoming = new URL(request.url);
  let pathname = incoming.pathname;

  // Directory URLs should resolve to the generated index.html.
  if (pathname === "/app") pathname = "/app/";
  if (pathname.endsWith("/")) pathname += "index.html";

  // GitHub Pages project-site origin.
  const origin = new URL(env.GITHUB_PAGES_ORIGIN || "https://yumeworldyamicode.github.io/Hrmnx-Nemawashi/");
  const base = origin.pathname.replace(/\/+$/, "");
  const target = new URL(origin.origin + base + pathname);
  target.search = incoming.search;

  const upstream = new Request(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "follow"
  });

  const response = await fetch(upstream);

  // If a generated app does not exist, return the normal 404.
  if (response.status === 404) {
    return new Response("Nemawashi app page not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  return response;
}

async function handlePublish(request, env) {
  try {
    const body = await request.json();

    if (!body || body.repository !== "yumeworldyamicode/Hrmnx-Nemawashi" || !body.basePath || !body.files) {
      return json({ error: "Invalid publish request." }, 400);
    }

    const token = env.GITHUB_TOKEN;
    if (!token) {
      return json({ error: "GITHUB_TOKEN is not configured on the Cloudflare Worker." }, 500);
    }

    const repo = body.repository;
    const branch = env.GITHUB_BRANCH || "main";

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };

    const refRes = await fetch(
      `https://api.github.com/repos/${repo}/git/ref/heads/${branch}`,
      { headers }
    );

    if (!refRes.ok) {
      return json({ error: "Could not read the GitHub branch." }, 502);
    }

    const ref = await refRes.json();
    const parentSha = ref.object.sha;

    const treeEntries = [];

    for (const [name, content] of Object.entries(body.files)) {
      const blobRes = await fetch(
        `https://api.github.com/repos/${repo}/git/blobs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: String(content),
            encoding: "utf-8"
          })
        }
      );

      if (!blobRes.ok) {
        const detail = await blobRes.text();
        return json({
          error: "Failed to create GitHub blob for " + name,
          detail
        }, 502);
      }

      const blob = await blobRes.json();

      treeEntries.push({
        path: `${body.basePath.replace(/\/+$/, "")}/${name.replace(/^\/+/, "")}`,
        mode: "100644",
        type: "blob",
        sha: blob.sha
      });
    }

    const treeRes = await fetch(
      `https://api.github.com/repos/${repo}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          base_tree: parentSha,
          tree: treeEntries
        })
      }
    );

    if (!treeRes.ok) {
      const detail = await treeRes.text();
      return json({ error: "Failed to create GitHub tree.", detail }, 502);
    }

    const tree = await treeRes.json();

    const commitRes = await fetch(
      `https://api.github.com/repos/${repo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: body.message || "Publish website",
          tree: tree.sha,
          parents: [parentSha]
        })
      }
    );

    if (!commitRes.ok) {
      const detail = await commitRes.text();
      return json({ error: "Failed to create GitHub commit.", detail }, 502);
    }

    const commit = await commitRes.json();

    const updateRes = await fetch(
      `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: commit.sha, force: false })
      }
    );

    if (!updateRes.ok) {
      const detail = await updateRes.text();
      return json({ error: "Failed to update the GitHub branch.", detail }, 502);
    }

    return json({
      ok: true,
      commit: commit.sha,
      path: body.basePath
    });
  } catch (error) {
    return json({
      error: error?.message || "Unexpected Worker error."
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
