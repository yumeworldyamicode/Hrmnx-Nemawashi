/**
 * Nemawashi public website router for Cloudflare Workers.
 *
 * Attach this Worker to:
 *   nemawashi.hrmnx.site/app/*
 *
 * GitHub Pages remains the origin for the static files.
 */

const GITHUB_PAGES_ORIGIN = "https://yumeworldyamicode.github.io/Hrmnx-Nemawashi";
const PUBLIC_APP_FILE = "/public-app.html";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only rewrite Nemawashi's dynamic public website routes.
    // Everything else continues to GitHub Pages normally.
    if (!/^\/app(?:\/|$)/i.test(url.pathname)) {
      return fetch(request);
    }

    // Keep /app and /app/ useful as a normal landing/error route too.
    const originUrl = new URL(PUBLIC_APP_FILE, GITHUB_PAGES_ORIGIN);

    const headers = new Headers(request.headers);
    headers.set("Accept", "text/html,application/xhtml+xml");

    const originRequest = new Request(originUrl.toString(), {
      method: "GET",
      headers,
      redirect: "follow"
    });

    const response = await fetch(originRequest);
    const responseHeaders = new Headers(response.headers);

    // The HTML is a dynamic shell: the browser's URL stays /app/<slug>
    // and public-app.js reads that pathname to load the correct website.
    responseHeaders.set("Cache-Control", "no-store, max-age=0");
    responseHeaders.set("X-Nemawashi-Router", "cloudflare-worker");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};
