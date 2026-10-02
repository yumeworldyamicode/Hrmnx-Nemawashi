/*
 * Nemawashi PRODEM Viewer
 *
 * Loads and plays a private .prodem attachment.
 *
 * Access currently requires:
 *
 * 1. Logged-in Supabase user
 * 2. profiles.is_staff = true
 *
 * Storage itself must also remain private.
 */


let prodemAudioContext = null;
let prodemAudioBuffer = null;
let prodemSource = null;

let prodemStartedAt = 0;
let prodemPausedAt = 0;
let prodemAnimationFrame = null;


/*
 * --------------------------------------------------
 * DOM
 * --------------------------------------------------
 */

const statusElement =
    document.getElementById(
        "prodem-status"
    );

const fileNameElement =
    document.getElementById(
        "prodem-file-name"
    );

const playerElement =
    document.getElementById(
        "prodem-player"
    );

const playButton =
    document.getElementById(
        "prodem-play-button"
    );

const progressElement =
    document.getElementById(
        "prodem-progress"
    );

const timeElement =
    document.getElementById(
        "prodem-time"
    );

const infoElement =
    document.getElementById(
        "prodem-info"
    );


/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

function setStatus(message, isError = false) {

    if (!statusElement) {
        return;
    }

    statusElement.textContent =
        message;

    statusElement.classList.toggle(
        "error",
        isError
    );
}


function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return "0:00";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        Math.floor(
            seconds % 60
        );

    return (
        `${minutes}:` +
        `${String(
            remainingSeconds
        ).padStart(2, "0")}`
    );
}


function getAttachmentId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(
        "attachment"
    );
}


function updateTime(current, duration) {

    if (!timeElement) {
        return;
    }

    timeElement.textContent =
        `${formatTime(current)} / ` +
        `${formatTime(duration)}`;
}


/*
 * --------------------------------------------------
 * Authentication
 * --------------------------------------------------
 */

async function getAuthorizedUser() {

    const {
        data: {
            user
        },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (userError) {
        throw new Error(
            "Unable to verify your account."
        );
    }


    if (!user) {
        throw new Error(
            "You must be logged in to view this PRODEM file."
        );
    }


    /*
     * Check the user's Nemawashi staff status.
     */

    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "is_staff"
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (profileError) {

        console.error(
            "Failed to verify staff status:",
            profileError
        );

        throw new Error(
            "Unable to verify staff access."
        );
    }


    if (
        !profile ||
        profile.is_staff !== true
    ) {
        throw new Error(
            "You do not have permission to view PRODEM files."
        );
    }


    return user;
}


/*
 * --------------------------------------------------
 * Attachment
 * --------------------------------------------------
 */

async function getProdemAttachment(
    attachmentId
) {

    const {
        data: attachment,
        error
    } =
        await supabaseClient
            .from(
                "nemawashi_message_attachments"
            )
            .select(`
                id,
                message_id,
                user_id,
                file_name,
                file_type,
                file_size,
                storage_path,
                attachment_type,
                created_at
            `)
            .eq(
                "id",
                attachmentId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Failed to load PRODEM attachment:",
            error
        );

        throw new Error(
            "Unable to load this PRODEM attachment."
        );
    }


    if (!attachment) {
        throw new Error(
            "PRODEM attachment not found."
        );
    }


    if (
        attachment.attachment_type !==
        "prodem"
    ) {
        throw new Error(
            "This attachment is not a PRODEM file."
        );
    }


    if (!attachment.storage_path) {
        throw new Error(
            "This PRODEM file has no storage path."
        );
    }


    return attachment;
}


/*
 * --------------------------------------------------
 * Private Storage
 * --------------------------------------------------
 */

async function downloadProdem(
    storagePath
) {

    /*
     * Generate a short-lived signed URL.
     *
     * This URL is never stored permanently.
     */

    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from(
                "nemawashi-attachments"
            )
            .createSignedUrl(
                storagePath,
                60
            );


    if (error) {

        console.error(
            "Failed to create PRODEM signed URL:",
            error
        );

        throw new Error(
            "Unable to access the private PRODEM file."
        );
    }


    if (
        !data ||
        !data.signedUrl
    ) {
        throw new Error(
            "No secure PRODEM URL was returned."
        );
    }


    /*
     * Fetch the actual private file.
     */

    const response =
        await fetch(
            data.signedUrl
        );


    if (!response.ok) {
        throw new Error(
            "The PRODEM file could not be retrieved."
        );
    }


    return response.blob();
}


/*
 * --------------------------------------------------
 * Audio
 * --------------------------------------------------
 */

async function loadProdemAudio(
    blob
) {

    setStatus(
        "Decoding PRODEM audio..."
    );


    prodemAudioBuffer =
        await decodeProdem(
            blob
        );


    if (
        !prodemAudioBuffer
    ) {
        throw new Error(
            "The PRODEM decoder returned no audio."
        );
    }


    const duration =
        prodemAudioBuffer.duration;


    updateTime(
        0,
        duration
    );


    progressElement.value =
        "0";


    infoElement.innerHTML = `
        <span class="prodem-info-item">
            ${prodemAudioBuffer.numberOfChannels} channel${prodemAudioBuffer.numberOfChannels === 1 ? "" : "s"}
        </span>

        <span class="prodem-info-item">
            ${prodemAudioBuffer.sampleRate.toLocaleString()} Hz
        </span>

        <span class="prodem-info-item">
            ${formatTime(duration)}
        </span>
    `;


    playerElement.classList.add(
        "visible"
    );


    setStatus(
        "PRODEM audio ready."
    );
}


/*
 * --------------------------------------------------
 * Playback
 * --------------------------------------------------
 */

async function createAudioContext() {

    if (
        prodemAudioContext
    ) {
        return prodemAudioContext;
    }


    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContextClass) {
        throw new Error(
            "Web Audio API is not available."
        );
    }


    prodemAudioContext =
        new AudioContextClass();


    return prodemAudioContext;
}


async function playProdem() {

    if (
        !prodemAudioBuffer
    ) {
        return;
    }


    const context =
        await createAudioContext();


    if (
        context.state ===
        "suspended"
    ) {
        await context.resume();
    }


    /*
     * If the track has reached the end,
     * start again from zero.
     */

    if (
        prodemPausedAt >=
        prodemAudioBuffer.duration
    ) {
        prodemPausedAt = 0;
    }


    prodemSource =
        context.createBufferSource();


    prodemSource.buffer =
        prodemAudioBuffer;


    prodemSource.connect(
        context.destination
    );


    prodemStartedAt =
        context.currentTime -
        prodemPausedAt;


    prodemSource.onended =
        function() {

            /*
             * Ignore this event if the source
             * was intentionally stopped.
             */

            if (
                prodemSource === null
            ) {
                return;
            }


            const currentPosition =
                context.currentTime -
                prodemStartedAt;


            if (
                currentPosition >=
                prodemAudioBuffer.duration - 0.05
            ) {

                prodemPausedAt =
                    0;

                progressElement.value =
                    "0";

                updateTime(
                    0,
                    prodemAudioBuffer.duration
                );

                playButton.textContent =
                    "▶";
            }
        };


    prodemSource.start(
        0,
        prodemPausedAt
    );


    playButton.textContent =
        "Ⅱ";


    updatePlayback();
}


function pauseProdem() {

    if (
        !prodemSource ||
        !prodemAudioContext
    ) {
        return;
    }


    prodemPausedAt =
        prodemAudioContext.currentTime -
        prodemStartedAt;


    prodemSource.onended =
        null;


    prodemSource.stop();


    prodemSource =
        null;


    playButton.textContent =
        "▶";


    cancelAnimationFrame(
        prodemAnimationFrame
    );


    updateTime(
        prodemPausedAt,
        prodemAudioBuffer.duration
    );
}


function updatePlayback() {

    if (
        !prodemAudioContext ||
        !prodemAudioBuffer ||
        !prodemSource
    ) {
        return;
    }


    const current =
        Math.min(
            prodemAudioContext.currentTime -
            prodemStartedAt,

            prodemAudioBuffer.duration
        );


    const percentage =
        (
            current /
            prodemAudioBuffer.duration
        ) * 100;


    progressElement.value =
        String(
            percentage
        );


    updateTime(
        current,
        prodemAudioBuffer.duration
    );


    if (
        prodemSource
    ) {

        prodemAnimationFrame =
            requestAnimationFrame(
                updatePlayback
            );
    }
}


/*
 * --------------------------------------------------
 * Controls
 * --------------------------------------------------
 */

playButton.addEventListener(
    "click",
    async function() {

        try {

            if (
                prodemSource
            ) {

                pauseProdem();

            } else {

                await playProdem();

            }

        } catch (error) {

            console.error(
                "PRODEM playback error:",
                error
            );

            setStatus(
                error.message ||
                "Unable to play PRODEM audio.",
                true
            );
        }
    }
);


progressElement.addEventListener(
    "input",
    function() {

        if (
            !prodemAudioBuffer
        ) {
            return;
        }


        const percentage =
            Number(
                progressElement.value
            );


        const newPosition =
            (
                percentage /
                100
            ) *
            prodemAudioBuffer.duration;


        if (
            prodemSource
        ) {

            prodemStartedAt =
                prodemAudioContext.currentTime -
                newPosition;

        } else {

            prodemPausedAt =
                newPosition;

        }


        updateTime(
            newPosition,
            prodemAudioBuffer.duration
        );
    }
);


/*
 * --------------------------------------------------
 * Main
 * --------------------------------------------------
 */

async function initializeProdemViewer() {

    try {

        const attachmentId =
            getAttachmentId();


        if (!attachmentId) {
            throw new Error(
                "No PRODEM attachment was specified."
            );
        }


        setStatus(
            "Verifying staff access..."
        );


        await getAuthorizedUser();


        setStatus(
            "Loading PRODEM attachment..."
        );


        const attachment =
            await getProdemAttachment(
                attachmentId
            );


        fileNameElement.textContent =
            attachment.file_name ||
            "PRODEM Audio";


        setStatus(
            "Requesting secure audio access..."
        );


        const blob =
            await downloadProdem(
                attachment.storage_path
            );


        await loadProdemAudio(
            blob
        );


    } catch (error) {

        console.error(
            "PRODEM viewer error:",
            error
        );


        playerElement.classList.remove(
            "visible"
        );


        setStatus(
            error.message ||
            "Unable to open this PRODEM file.",
            true
        );
    }
}


initializeProdemViewer();
