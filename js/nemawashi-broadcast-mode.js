/*
 * Nemawashi Broadcast Mode V2
 * Connects the YouTube broadcast visual renderer directly to the existing
 * V4.6 Music Space WebRTC state. No second WebRTC system is created.
 *
 * Include AFTER:
 *   Nemawashi_messages_music_merry_go_round_V4_RESTORED.js
 */
(() => {
    "use strict";

    const state = {
        open: false,
        raf: null,
        frameTimer: null,
        lastActiveId: null,
        lastStreamSignature: "",
        videos: new Map(),
        audioContext: null,
        controlsMounted: false,
        announcementTimer: null,
        scene: "intro",
        introStartedAt: 0,
        titleStartedAt: 0,
        liveStartedAt: 0,
        outroStartedAt: 0,
        projectName: "Project Name",
        projectType: "Song",
        hostName: "Host Name",
        announcement: "Welcome to the Nemawashi production livestream."
    };

    const $ = id => document.getElementById(id);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    function getNM4() {
        return window.nemawashiMusicCollaborationV4 || null;
    }

    function getCall() {
        return getNM4()?.call || window.activeNemawashiMusicCall || null;
    }

    function getSharedStreams() {
        const NM4 = getNM4();
        if (!NM4) return [];

        const result = [];
        if (NM4.screenStream && NM4.user?.id) {
            result.push({
                userId: NM4.user.id,
                stream: NM4.screenStream,
                local: true
            });
        }

        if (NM4.remoteStreams instanceof Map) {
            for (const [userId, stream] of NM4.remoteStreams.entries()) {
                if (!stream) continue;
                if (String(userId) === String(NM4.user?.id)) continue;
                result.push({ userId, stream, local: false });
            }
        }

        return result;
    }

    function displayName(userId) {
        const NM4 = getNM4();
        if (!NM4) return "Collaborator";
        if (String(userId) === String(NM4.user?.id)) {
            return NM4.profile?.display_name || NM4.profile?.username || "You";
        }
        const cached = NM4.profileCache?.get(userId);
        return cached?.display_name || cached?.username || "Collaborator";
    }

    function escapeText(value) {
        return String(value ?? "").replace(/[&<>\"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char]));
    }

    function projectInfo() {
        const call = getCall();
        const project = call?.project || {};
        return {
            name: project.name || call?.projectName || "Project Name",
            type: project.type || "Song",
            host: call?.hostName || call?.host_name || "Host Name"
        };
    }

    function createButton() {
        if (document.getElementById("nm4-open-broadcast")) return;
        const actions = document.querySelector(".music-room-active .nm4-call-actions");
        if (!actions) return;

        const button = document.createElement("button");
        button.type = "button";
        button.id = "nm4-open-broadcast";
        button.className = "nm4-button broadcast-button";
        button.textContent = "Open broadcast preview";
        button.addEventListener("click", open);
        actions.appendChild(button);
        state.controlsMounted = true;
    }

    function removeButtonIfNeeded() {
        if (!document.querySelector(".music-room-active")) {
            document.getElementById("nm4-open-broadcast")?.remove();
            state.controlsMounted = false;
        }
    }

    function buildOverlay() {
        if ($("nm4-broadcast-overlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "nm4-broadcast-overlay";
        overlay.className = "nm4-broadcast-overlay";
        overlay.innerHTML = `
            <div class="nm4-broadcast-toolbar">
                <div class="nm4-broadcast-toolbar-title">
                    <span class="nm4-broadcast-dot"></span>
                    <strong>Nemawashi Broadcast Preview</strong>
                    <small id="nm4-broadcast-source">Connected to Music Space</small>
                </div>
                <div class="nm4-broadcast-toolbar-actions">
                    <button type="button" id="nm4-broadcast-play">Play intro → live</button>
                    <button type="button" id="nm4-broadcast-announcement">Announcement</button>
                    <button type="button" id="nm4-broadcast-ended">Outro</button>
                    <button type="button" class="close" id="nm4-broadcast-close">Close</button>
                </div>
            </div>
            <div class="nm4-broadcast-stage-wrap">
                <canvas id="nm4-broadcast-canvas" width="1280" height="720"></canvas>
                <div class="nm4-broadcast-hud">
                    <span id="nm4-broadcast-scene-label">INTRO</span>
                    <span id="nm4-broadcast-stream-label">0 DAWs connected</span>
                </div>
            </div>
            <div class="nm4-broadcast-info">
                <label>Announcement <input id="nm4-broadcast-announcement-input" value="Welcome to the Nemawashi production livestream."></label>
                <span>Real DAW video comes directly from the active Music Space WebRTC session.</span>
            </div>
        `;
        document.body.appendChild(overlay);

        $("nm4-broadcast-close")?.addEventListener("click", close);
        $("nm4-broadcast-play")?.addEventListener("click", playSequence);
        $("nm4-broadcast-announcement")?.addEventListener("click", showAnnouncement);
        $("nm4-broadcast-ended")?.addEventListener("click", () => setScene("ended"));
        $("nm4-broadcast-announcement-input")?.addEventListener("input", event => {
            state.announcement = event.target.value || "Announcement";
        });
        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") close();
        });
    }

    function open() {
        const NM4 = getNM4();
        if (!NM4?.call) {
            alert("Join the active Music call first.");
            return;
        }
        buildOverlay();
        const overlay = $("nm4-broadcast-overlay");
        overlay.classList.add("is-open");
        state.open = true;
        state.scene = "intro";
        state.introStartedAt = performance.now();
        const info = projectInfo();
        state.projectName = info.name;
        state.projectType = info.type;
        state.hostName = info.host;
        state.announcement = $("nm4-broadcast-announcement-input")?.value || state.announcement;
        ensureAudio();
        startRenderLoop();
        setScene("intro");
    }

    function close() {
        state.open = false;
        $("nm4-broadcast-overlay")?.classList.remove("is-open");
        stopRenderLoop();
    }

    function setScene(scene) {
        state.scene = scene;
        const label = $("nm4-broadcast-scene-label");
        if (label) label.textContent = scene.toUpperCase();
        if (scene === "title") state.titleStartedAt = performance.now();
        if (scene === "live") state.liveStartedAt = performance.now();
        if (scene === "ended") state.outroStartedAt = performance.now();
        render();
    }

    async function playSequence() {
        if (!state.open) open();
        setScene("intro");
        await wait(4700);
        if (!state.open) return;
        setScene("title");
        await wait(3600);
        if (!state.open) return;
        setScene("live");
    }

    function showAnnouncement() {
        if (!state.open) return;
        const input = $("nm4-broadcast-announcement-input");
        state.announcement = input?.value?.trim() || "Announcement";
        state.announcementUntil = performance.now() + 5000;
        ensureAudio();
        playSoftTone();
    }

    function ensureAudio() {
        if (state.audioContext) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try { state.audioContext = new Ctx(); } catch (_) {}
    }

    function playSoftTone() {
        const ctx = state.audioContext;
        if (!ctx) return;
        try {
            if (ctx.state === "suspended") ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 720;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (_) {}
    }

    function syncVideos(streams) {
        const signature = streams.map(item => `${item.userId}:${item.stream?.id || ""}`).join("|");
        if (signature === state.lastStreamSignature) return;
        state.lastStreamSignature = signature;

        const liveIds = new Set(streams.map(item => String(item.userId)));
        for (const [id, video] of state.videos.entries()) {
            if (!liveIds.has(String(id))) {
                try { video.pause(); } catch (_) {}
                video.srcObject = null;
                state.videos.delete(id);
            }
        }

        for (const item of streams) {
            const id = String(item.userId);
            let video = state.videos.get(id);
            if (!video) {
                video = document.createElement("video");
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                video.srcObject = item.stream;
                state.videos.set(id, video);
                video.play().catch(() => {});
            } else if (video.srcObject !== item.stream) {
                video.srcObject = item.stream;
                video.play().catch(() => {});
            }
        }
    }

    function activeUserId(streams) {
        const NM4 = getNM4();
        const merryUser = NM4?.merry?.participants?.[NM4.merry.index]?.userId;
        if (merryUser && streams.some(item => String(item.userId) === String(merryUser))) return String(merryUser);
        if (NM4?.activeAudio?.user_id && streams.some(item => String(item.userId) === String(NM4.activeAudio.user_id))) return String(NM4.activeAudio.user_id);
        return streams[0] ? String(streams[0].userId) : null;
    }

    function orderedStreams(streams) {
        const NM4 = getNM4();
        const people = NM4?.merry?.participants || [];
        const order = new Map(people.map((person, index) => [String(person.userId), index]));
        return [...streams].sort((a, b) => {
            const ai = order.has(String(a.userId)) ? order.get(String(a.userId)) : 9999;
            const bi = order.has(String(b.userId)) ? order.get(String(b.userId)) : 9999;
            return ai - bi;
        });
    }

    function roundedRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    function drawVideoCover(ctx, video, x, y, w, h) {
        if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
            ctx.fillStyle = "#f0f0f4";
            ctx.fillRect(x, y, w, h);
            return;
        }
        const sourceRatio = video.videoWidth / video.videoHeight;
        const targetRatio = w / h;
        let sw, sh, sx, sy;
        if (sourceRatio > targetRatio) {
            sh = video.videoHeight;
            sw = sh * targetRatio;
            sx = (video.videoWidth - sw) / 2;
            sy = 0;
        } else {
            sw = video.videoWidth;
            sh = sw / targetRatio;
            sx = 0;
            sy = (video.videoHeight - sh) / 2;
        }
        ctx.drawImage(video, sx, sy, sw, sh, x, y, w, h);
    }

    function drawLogo(ctx, x, y, size, alpha = 1) {
        if (!state.logoImage) {
            state.logoImage = new Image();
            state.logoImage.crossOrigin = "anonymous";
            state.logoImage.src = "https://nemawashi.hrmnx.site/images/nemawashi-logo-png.png";
        }
        if (!state.logoImage.complete) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(state.logoImage, x, y, size, size);
        ctx.restore();
    }

    function drawBackground(ctx, width, height) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        const bubbles = [
            [0.08,0.16,42],[0.91,0.12,68],[0.14,0.82,26],[0.87,0.78,34],
            [0.70,0.18,18],[0.30,0.10,22],[0.57,0.91,52],[0.45,0.75,20]
        ];
        bubbles.forEach(([px, py, radius], index) => {
            const pulse = Math.sin(performance.now() / 1100 + index) * 3;
            ctx.beginPath();
            ctx.arc(width * px, height * py, radius + pulse, 0, Math.PI * 2);
            ctx.fillStyle = index % 2 ? "rgba(99,107,216,.07)" : "rgba(99,107,216,.045)";
            ctx.fill();
        });
    }

    function drawIntro(ctx, width, height) {
        const elapsed = performance.now() - state.introStartedAt;
        const p = Math.min(1, elapsed / 4700);
        const fadeIn = Math.min(1, p / 0.22);
        const fadeOut = p > 0.76 ? Math.max(0, 1 - (p - 0.76) / 0.24) : 1;
        const alpha = fadeIn * fadeOut;
        const rotation = (-34 + Math.min(394, p * 430)) * Math.PI / 180;
        const size = 180;
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(rotation);
        ctx.scale(0.72 + 0.28 * Math.min(1, p / 0.52), 0.72 + 0.28 * Math.min(1, p / 0.52));
        ctx.globalAlpha = alpha;
        drawLogo(ctx, -size / 2, -size / 2, size, 1);
        ctx.restore();
    }

    function drawTitle(ctx, width, height) {
        const elapsed = performance.now() - state.titleStartedAt;
        const p = Math.min(1, elapsed / 800);
        const opacity = Math.min(1, p * 1.4);
        drawLogo(ctx, width / 2 - 65, 110, 130, opacity);
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.textAlign = "center";
        ctx.fillStyle = "#111111";
        ctx.font = "700 48px 'LINE Seed JP Bold', Arial, sans-serif";
        ctx.fillText(`${state.projectType} Livestream`, width / 2, 340);
        ctx.font = "500 23px 'LINE Seed JP Bold', Arial, sans-serif";
        ctx.fillStyle = "#636BD8";
        ctx.fillText(`Host: ${state.hostName}`, width / 2, 390);
        ctx.restore();
    }

    function drawLive(ctx, width, height, streams) {
        const activeId = activeUserId(streams);
        const ordered = orderedStreams(streams);
        const count = ordered.length;
        const centerX = width / 2;
        const centerY = height / 2 + 20;

        drawLogo(ctx, 34, 28, 64, 0.92);

        ctx.save();
        ctx.fillStyle = "#111111";
        ctx.font = "700 18px 'LINE Seed JP Bold', Arial, sans-serif";
        ctx.fillText(state.projectName, 116, 58);
        ctx.font = "500 12px 'LINE Seed JP Bold', Arial, sans-serif";
        ctx.fillStyle = "rgba(17,17,17,.48)";
        ctx.fillText(`${state.projectType} · NEMAWASHI PRODUCTION LIVESTREAM`, 116, 79);
        ctx.restore();

        if (!count) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(17,17,17,.45)";
            ctx.font = "600 24px 'LINE Seed JP Bold', Arial, sans-serif";
            ctx.fillText("Waiting for a DAW screen…", centerX, centerY);
            ctx.restore();
            return;
        }

        const now = performance.now();
        if (state.lastActiveId !== activeId) {
            if (state.lastActiveId !== null) {
                ensureAudio();
                playTurnTone();
            }
            state.lastActiveId = activeId;
        }

        ordered.forEach((item, index) => {
            const id = String(item.userId);
            const isActive = id === activeId;
            const phase = index / Math.max(1, count) * Math.PI * 2 - Math.PI / 2;
            const orbitX = 370;
            const orbitY = 205;
            const x = centerX + Math.cos(phase) * orbitX;
            const y = centerY + Math.sin(phase) * orbitY;
            const targetW = isActive ? 620 : 250;
            const targetH = isActive ? 350 : 145;
            const depth = isActive ? 1 : 0.35 + (Math.sin(phase) + 1) * 0.18;
            const w = targetW * depth;
            const h = targetH * depth;
            const drawX = x - w / 2;
            const drawY = y - h / 2;
            const lift = isActive ? Math.sin(now / 500) * 2 : 0;

            ctx.save();
            ctx.shadowColor = isActive ? "rgba(99,107,216,.25)" : "rgba(0,0,0,.10)";
            ctx.shadowBlur = isActive ? 28 : 14;
            ctx.shadowOffsetY = 10;
            roundedRect(ctx, drawX, drawY + lift, w, h, 20);
            ctx.clip();
            drawVideoCover(ctx, state.videos.get(id), drawX, drawY + lift, w, h);
            ctx.restore();

            ctx.save();
            roundedRect(ctx, drawX, drawY + lift, w, h, 20);
            ctx.strokeStyle = isActive ? "rgba(99,107,216,.8)" : "rgba(0,0,0,.10)";
            ctx.lineWidth = isActive ? 3 : 1;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = isActive ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.90)";
            const labelH = isActive ? 46 : 34;
            roundedRect(ctx, drawX + 10, drawY + h - labelH - 10 + lift, w - 20, labelH, 12);
            ctx.fill();
            ctx.fillStyle = "#111111";
            ctx.font = `${isActive ? 700 : 600} ${isActive ? 15 : 10}px 'LINE Seed JP Bold', Arial, sans-serif`;
            ctx.fillText(displayName(item.userId), drawX + 20, drawY + h - (isActive ? 30 : 23) + lift);
            ctx.fillStyle = "#636BD8";
            ctx.font = `600 ${isActive ? 10 : 8}px 'LINE Seed JP Bold', Arial, sans-serif`;
            ctx.fillText(isActive ? "CURRENT DAW PREVIEW" : "DAW", drawX + 20, drawY + h - (isActive ? 14 : 10) + lift);
            ctx.restore();
        });

        const announcementUntil = state.announcementUntil || 0;
        if (announcementUntil > now) {
            const remaining = announcementUntil - now;
            const fade = Math.min(1, remaining / 650);
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.fillStyle = "rgba(255,255,255,.97)";
            roundedRect(ctx, 145, height - 94, width - 290, 48, 16);
            ctx.fill();
            ctx.fillStyle = "#636BD8";
            ctx.font = "700 14px 'LINE Seed JP Bold', Arial, sans-serif";
            ctx.fillText(state.announcement, 170, height - 64);
            ctx.restore();
        }
    }

    function drawEnded(ctx, width, height) {
        const elapsed = performance.now() - state.outroStartedAt;
        const opacity = Math.min(1, elapsed / 700);
        drawLogo(ctx, width / 2 - 70, 180, 140, opacity);
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.textAlign = "center";
        ctx.fillStyle = "#111111";
        ctx.font = "700 48px 'LINE Seed JP Bold', Arial, sans-serif";
        ctx.fillText("Livestream Ended", width / 2, 420);
        ctx.restore();
    }

    function render() {
        if (!state.open) return;
        const canvas = $("nm4-broadcast-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;
        drawBackground(ctx, width, height);

        const streams = getSharedStreams();
        syncVideos(streams);
        const label = $("nm4-broadcast-stream-label");
        if (label) label.textContent = `${streams.length} DAW${streams.length === 1 ? "" : "s"} connected`;

        if (state.scene === "intro") drawIntro(ctx, width, height);
        else if (state.scene === "title") drawTitle(ctx, width, height);
        else if (state.scene === "ended") drawEnded(ctx, width, height);
        else drawLive(ctx, width, height, streams);

        state.raf = requestAnimationFrame(render);
    }

    function stopRenderLoop() {
        cancelAnimationFrame(state.raf);
        state.raf = null;
        if (state.frameTimer) {
            clearTimeout(state.frameTimer);
            state.frameTimer = null;
        }
    }

    function startRenderLoop() {
        stopRenderLoop();
        const tick = () => {
            if (!state.open) return;
            render();
            state.frameTimer = setTimeout(tick, 1000 / 30);
        };
        tick();
    }

    function playTurnTone() {
        const ctx = state.audioContext;
        if (!ctx) return;
        try {
            if (ctx.state === "suspended") ctx.resume();
            const notes = [660, 880, 1046.5];
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                const t = ctx.currentTime + index * 0.055;
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(0.035, t + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
                osc.connect(gain).connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.19);
            });
        } catch (_) {}
    }

    function observerTick() {
        createButton();
        removeButtonIfNeeded();
        if (!state.open) return;
        const info = projectInfo();
        state.projectName = info.name;
        state.projectType = info.type;
        const source = $("nm4-broadcast-source");
        if (source) source.textContent = `${info.name} · live Music Space WebRTC`;
    }

    setInterval(observerTick, 1500);
    observerTick();

    window.nemawashiBroadcastV2 = {
        open,
        close,
        setScene,
        showAnnouncement,
        getStreams: getSharedStreams
    };
})();
