/*
 * Nemawashi LYRDEM Inspector
 */

let lyrdemAttachment = null;


/* ============================================================
   HELPERS
============================================================ */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function getAttachmentId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("attachment");

}


/* ============================================================
   STATUS
============================================================ */

function setStatus(message) {

    const status =
        document.getElementById(
            "lyrdem-status"
        );

    if (status) {
        status.textContent = message;
    }

}


function showError(message) {

    const status =
        document.getElementById(
            "lyrdem-status"
        );

    if (status) {

        status.innerHTML = `
            <div class="lyrdem-error">
                ${escapeHtml(message)}
            </div>
        `;

    }

}


/* ============================================================
   PARSE LYRDEM
============================================================ */

function parseLyrdemText(text) {

    const trimmed =
        text.trim();

    /*
     * Current Demo Studio package format.
     */
    try {

        const parsed =
            JSON.parse(trimmed);

        if (
            parsed &&
            parsed.format === "lyrdem"
        ) {
            return parsed;
        }

    } catch {
        // Continue with legacy text parser.
    }


    /*
     * Legacy/simple Nemawashi format.
     */
    const lines =
        trimmed.split(/\r?\n/);

    const result = {
        format: "lyrdem",
        format_version: 1,
        title: "",
        artist: "",
        demo_type: "lyrics",
        status: "demo",
        sections: []
    };

    let currentSection = null;
    let currentLyrics = [];

    function finishSection() {

        if (!currentSection) {
            return;
        }

        currentSection.lyrics =
            currentLyrics.join("\n").trim();

        result.sections.push(
            currentSection
        );

        currentSection = null;
        currentLyrics = [];

    }


    for (const line of lines) {

        if (
            line ===
            "NEMAWASHI_LYRDEM"
        ) {
            continue;
        }

        if (
            line.startsWith("TITLE=")
        ) {
            result.title =
                line.slice(6).trim();

            continue;
        }

        if (
            line.startsWith("ARTIST=")
        ) {
            result.artist =
                line.slice(7).trim();

            continue;
        }

        if (
            line.startsWith("TYPE=")
        ) {
            result.demo_type =
                line.slice(5).trim();

            continue;
        }

        if (
            line.startsWith("STATUS=")
        ) {
            result.status =
                line.slice(7).trim();

            continue;
        }


        const sectionMatch =
            line.match(
                /^\[([^\]]+)\]$/
            );

        if (sectionMatch) {

            finishSection();

            const name =
                sectionMatch[1];

            if (
                name.toUpperCase() ===
                "NOTES"
            ) {
                currentSection = {
                    title: "Notes",
                    type: "notes",
                    lyrics: ""
                };
            } else {
                currentSection = {
                    title: name,
                    type: name,
                    lyrics: ""
                };
            }

            continue;
        }


        if (currentSection) {
            currentLyrics.push(line);
        }

    }

    finishSection();

    /*
     * Move NOTES out of the normal lyric sections.
     */
    const notes =
        result.sections.find(
            section =>
                section.type === "notes"
        );

    if (notes) {

        result.notes =
            notes.lyrics;

        result.sections =
            result.sections.filter(
                section =>
                    section.type !== "notes"
            );

    }

    return result;

}


/* ============================================================
   RENDER
============================================================ */

function renderLyrdem(data) {

    const title =
        data.title ||
        "Untitled LYRDEM";

    document.title =
        `${title} — LYRDEM`;

    const titleElement =
        document.getElementById(
            "lyrdem-title"
        );

    if (titleElement) {
        titleElement.textContent =
            title;
    }


    const content =
        document.getElementById(
            "lyrdem-content"
        );

    if (!content) {
        return;
    }


    const creator =
        data.creator?.display_name ||
        data.creator?.username ||
        data.artist ||
        "Unknown";


    const sections =
        Array.isArray(data.sections)
            ? data.sections
            : [];


    content.innerHTML = `

        <div class="lyrdem-meta">

            <div class="lyrdem-meta-item">

                <span class="lyrdem-meta-label">
                    Title
                </span>

                <span class="lyrdem-meta-value">
                    ${escapeHtml(title)}
                </span>

            </div>


            <div class="lyrdem-meta-item">

                <span class="lyrdem-meta-label">
                    Creator
                </span>

                <span class="lyrdem-meta-value">
                    ${escapeHtml(creator)}
                </span>

            </div>


            <div class="lyrdem-meta-item">

                <span class="lyrdem-meta-label">
                    Status
                </span>

                <span class="lyrdem-meta-value">
                    ${escapeHtml(
                        data.status || "DEMO"
                    )}
                </span>

            </div>

        </div>


        ${sections.map(
            (section, index) => `

                <article
                    class="lyrdem-section"
                >

                    <div
                        class="lyrdem-section-header"
                    >

                        <span
                            class="lyrdem-section-number"
                        >
                            ${String(
                                section.order ||
                                index + 1
                            ).padStart(2, "0")}
                        </span>

                        <h2>
                            ${escapeHtml(
                                section.title ||
                                "Untitled Section"
                            )}
                        </h2>

                        <span
                            class="lyrdem-section-type"
                        >
                            ${escapeHtml(
                                section.type ||
                                ""
                            )}
                        </span>

                    </div>


                    <div class="lyrdem-lyrics">
                        ${escapeHtml(
                            section.lyrics ||
                            ""
                        )}
                    </div>

                </article>

            `
        ).join("")}


        ${
            data.notes
                ? `
                    <article
                        class="lyrdem-section"
                    >

                        <div
                            class="lyrdem-section-header"
                        >
                            <h2>
                                Notes
                            </h2>
                        </div>

                        <div
                            class="lyrdem-lyrics"
                        >
                            ${escapeHtml(
                                data.notes
                            )}
                        </div>

                    </article>
                `
                : ""
        }

    `;


    content.hidden = false;

    setStatus("");

    const status =
        document.getElementById(
            "lyrdem-status"
        );

    if (status) {
        status.hidden = true;
    }

}


/* ============================================================
   ACCESS + LOAD
============================================================ */

async function loadLyrdem() {

    const attachmentId =
        getAttachmentId();

    if (!attachmentId) {

        showError(
            "No LYRDEM attachment was specified."
        );

        return;
    }


    /*
     * Require authentication.
     */
    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();

    if (!user) {

        showError(
            "You must be signed in to inspect this file."
        );

        return;
    }


    /*
     * Current Nemawashi permission gate.
     *
     * This follows the existing PRODEM viewer
     * until the dedicated Nemawashi permission
     * system is expanded.
     */
    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select("is_staff")
            .eq("id", user.id)
            .single();

    if (
        profileError ||
        !profile?.is_staff
    ) {

        showError(
            "You do not have permission to inspect this file."
        );

        return;
    }


    /*
     * Load attachment metadata.
     */
    const {
        data: attachment,
        error: attachmentError
    } =
        await supabaseClient
            .from(
                "nemawashi_message_attachments"
            )
            .select(`
                id,
                file_name,
                file_size,
                storage_path,
                attachment_type
            `)
            .eq(
                "id",
                attachmentId
            )
            .single();

    if (attachmentError) {

        console.error(
            attachmentError
        );

        showError(
            "The LYRDEM attachment could not be found."
        );

        return;
    }


    if (
        attachment.attachment_type !==
        "lyrdem"
    ) {

        showError(
            "This attachment is not a valid LYRDEM file."
        );

        return;
    }


    if (!attachment.storage_path) {

        showError(
            "The LYRDEM file has no storage path."
        );

        return;
    }


    /*
     * Short-lived signed URL.
     */
    const {
        data: signed,
        error: signedError
    } =
        await supabaseClient
            .storage
            .from(
                "nemawashi-attachments"
            )
            .createSignedUrl(
                attachment.storage_path,
                60
            );

    if (
        signedError ||
        !signed?.signedUrl
    ) {

        console.error(
            signedError
        );

        showError(
            "The LYRDEM file could not be accessed."
        );

        return;
    }


    /*
     * Fetch the private file.
     */
    const response =
        await fetch(
            signed.signedUrl
        );

    if (!response.ok) {

        showError(
            "The LYRDEM file could not be loaded."
        );

        return;
    }


    const text =
        await response.text();

    const data =
        parseLyrdemText(text);

    lyrdemAttachment =
        attachment;

    renderLyrdem(data);

}


/* ============================================================
   BACK
============================================================ */

document
    .getElementById("lyrdem-back")
    ?.addEventListener(
        "click",
        function() {

            if (
                document.referrer &&
                document.referrer.includes(
                    window.location.host
                )
            ) {
                history.back();
            } else {
                window.location.href =
                    "messages.html";
            }

        }
    );


loadLyrdem();
