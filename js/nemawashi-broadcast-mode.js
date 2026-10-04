/* Nemawashi Broadcast Mode V4.8
 * The 16:9 viewer frame intentionally mirrors broadcast-standalone.html/broadcast.css.
 * Real WebRTC videos are inserted into the same DAW-card structure instead of canvas-drawing
 * an approximation. The staff chat is preview-only and sits outside the broadcast frame.
 */
(() => {
    "use strict";

    const state = {
        open:false,
        scene:"intro",
        videos:new Map(),
        lastStreamSignature:"",
        activeId:null,
        announcement:"Welcome to the Nemawashi production livestream.",
        announcementVisible:false,
        timers:[],
        rotationTimer:null,
        staffOpen:false,
        controlsMounted:false,
        audioElement:null,
        audioStreamId:null,
        audioContext:null,
        audioMaster:null,
        lastAudibleActiveId:null
    };

    const $ = id => document.getElementById(id);
    const wait = ms => new Promise(r => setTimeout(r,ms));
    const logoURL = "https://nemawashi.hrmnx.site/images/nemawashi-logo-png.png";

    function getNM4(){ return window.nemawashiMusicCollaborationV4 || null; }
    function getCall(){ return getNM4()?.call || window.activeNemawashiMusicCall || null; }

    function streams(){
        const NM4=getNM4(); if(!NM4) return [];
        const out=[];
        if(NM4.screenStream && NM4.user?.id) out.push({userId:NM4.user.id,stream:NM4.screenStream,local:true});
        if(NM4.remoteStreams instanceof Map){
            for(const [userId,stream] of NM4.remoteStreams.entries()){
                if(stream && String(userId)!==String(NM4.user?.id)) out.push({userId,stream,local:false});
            }
        }
        return out;
    }

    function displayName(userId){
        const NM4=getNM4();
        if(!NM4) return "Collaborator";
        if(String(userId)===String(NM4.user?.id)) return NM4.profile?.display_name || NM4.profile?.username || "You";
        const cached=NM4.profileCache?.get(userId);
        return cached?.display_name || cached?.username || "Collaborator";
    }

    function projectInfo(){
        const call=getCall(), project=call?.project||{};
        return {
            name:project.name||call?.projectName||"Project Name",
            type:project.type||"Song",
            host:call?.hostName||call?.host_name||"Host Name"
        };
    }

    function esc(v){ return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c])); }

    function createButton(){
        if($("nm4-open-broadcast")) return;
        const actions=document.querySelector(".music-room-active .nm4-call-actions");
        if(!actions) return;
        const b=document.createElement("button");
        b.type="button"; b.id="nm4-open-broadcast"; b.className="nm4-button broadcast-button";
        b.textContent="Open broadcast preview"; b.addEventListener("click",()=>{ open(); if(state.open) tick(); });
        actions.appendChild(b); state.controlsMounted=true;
    }
    function removeButtonIfNeeded(){
        if(!document.querySelector(".music-room-active")){
            $("nm4-open-broadcast")?.remove(); state.controlsMounted=false;
            if(state.open) close();
        }
    }

    function buildOverlay(){
        if($("nm4-broadcast-overlay")) return;
        const overlay=document.createElement("div");
        overlay.id="nm4-broadcast-overlay"; overlay.className="nm4-broadcast-overlay";
        overlay.innerHTML=`
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
                <div class="nm4-broadcast-preview-shell">
                    <div class="broadcast-frame nm4-broadcast-frame" id="nm4-broadcast-frame">
                        <div class="bubble-field" aria-hidden="true">
                            <span class="bubble b1"></span><span class="bubble b2"></span><span class="bubble b3"></span><span class="bubble b4"></span>
                            <span class="bubble b5"></span><span class="bubble b6"></span><span class="bubble b7"></span><span class="bubble b8"></span>
                        </div>
                        <div class="scene scene-intro is-active" id="nm4-scene-intro"><div class="intro-logo-wrap"><img class="nemawashi-logo intro-logo" src="${logoURL}" alt="Nemawashi"></div></div>
                        <div class="scene scene-title" id="nm4-scene-title"><div class="title-card"><img class="title-logo" src="${logoURL}" alt="Nemawashi"><div class="title-project-type" id="nm4-title-project-type">Song Livestream</div><div class="title-host" id="nm4-title-host">Host: Host Name</div></div></div>
                        <div class="scene scene-live" id="nm4-scene-live">
                            <div class="live-logo"><img src="${logoURL}" alt="Nemawashi"></div>
                            <div class="announcement" id="nm4-announcement"><span class="announcement-dot"></span><span id="nm4-announcement-text">Announcement</span></div>
                            <div class="merry-stage" id="nm4-merry-stage"></div>
                            <div class="live-project"><span id="nm4-live-project-name">Project Name</span><span class="live-project-type" id="nm4-live-project-type">Song</span></div>
                        </div>
                        <div class="scene scene-ended" id="nm4-scene-ended"><div class="ended-card"><img class="ended-logo" src="${logoURL}" alt="Nemawashi"><div class="ended-title">Livestream Ended</div></div></div>
                    </div>
                    <div class="nm4-broadcast-frame-note">Viewer output · 16:9 · controls and staff chat are not broadcast</div>
                </div>

                <div class="nm4-staff-chat-wrap">
                    <button type="button" class="nm4-staff-chat-tab" id="nm4-staff-chat-tab"><span class="nm4-staff-chat-dot"></span>Staff chat</button>
                    <div class="nm4-staff-chat-panel" id="nm4-staff-chat-panel">
                        <div class="nm4-staff-chat-head"><strong>Staff chat</strong><span>Preview only</span></div>
                        <div class="nm4-staff-chat-messages" id="nm4-staff-chat-messages"><div class="nm4-staff-empty">No staff messages yet.</div></div>
                    </div>
                </div>
            </div>
            <div class="nm4-broadcast-info">
                <label>Announcement <input id="nm4-broadcast-announcement-input" value="Welcome to the Nemawashi production livestream."></label>
                <span>The 16:9 frame above is the viewer-facing design. Staff controls are outside the frame.</span>
            </div>`;
        document.body.appendChild(overlay);

        $("nm4-broadcast-close")?.addEventListener("click",close);
        $("nm4-broadcast-play")?.addEventListener("click",playSequence);
        $("nm4-broadcast-announcement")?.addEventListener("click",showAnnouncement);
        $("nm4-broadcast-ended")?.addEventListener("click",()=>setScene("ended"));
        const announcementInput = $("nm4-broadcast-announcement-input");
        announcementInput?.addEventListener("input",e=>state.announcement=e.target.value||"Announcement");
        announcementInput?.addEventListener("keydown",e=>{
            if(e.key !== "Enter") return;
            e.preventDefault();
            showAnnouncement();
        });
        $("nm4-staff-chat-tab")?.addEventListener("click",()=>{
            state.staffOpen=!state.staffOpen;
            $("nm4-staff-chat-panel")?.classList.toggle("is-open",state.staffOpen);
            renderStaffChat();
        });
        overlay.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
        updateViewerText(); renderStaffChat();
    }

    function updateViewerText(){
        const info=projectInfo();
        $("nm4-title-project-type")&&( $("nm4-title-project-type").textContent=`${info.type} Livestream` );
        $("nm4-title-host")&&( $("nm4-title-host").textContent=`Host: ${info.host}` );
        $("nm4-live-project-name")&&( $("nm4-live-project-name").textContent=info.name );
        $("nm4-live-project-type")&&( $("nm4-live-project-type").textContent=info.type );
        const src=$("nm4-broadcast-source"); if(src) src.textContent=`${info.name} · live Music Space WebRTC`;
    }

    function sceneNodes(){ return {intro:$('nm4-scene-intro'),title:$('nm4-scene-title'),live:$('nm4-scene-live'),ended:$('nm4-scene-ended')}; }
    function setScene(scene){
        state.scene=scene; const nodes=sceneNodes();
        Object.entries(nodes).forEach(([key,node])=>node?.classList.toggle("is-active",key===scene));
        if(scene==="live") renderMerry();
    }

    function open(){
        if(!getNM4()?.call){ alert("Join the active Music call first."); return; }
        buildOverlay(); updateViewerText();
        const overlay=$("nm4-broadcast-overlay"); overlay.classList.add("is-open"); state.open=true; state.staffOpen=false;
        $("nm4-staff-chat-panel")?.classList.remove("is-open");
        setScene("intro"); syncStreams(); renderMerry(); renderStaffChat();
    }
    function close(){
        state.open=false; state.timers.forEach(clearTimeout); state.timers=[];
        $("nm4-broadcast-overlay")?.classList.remove("is-open");
        for(const v of state.videos.values()){ try{v.pause();}catch(_){} v.srcObject=null; }
        state.videos.clear(); state.lastStreamSignature="";
        if(state.audioElement){ state.audioElement.pause(); state.audioElement.srcObject=null; }
        state.audioStreamId=null; state.lastAudibleActiveId=null;
    }
    async function playSequence(){
        if(!state.open) open();
        resumeAudio();
        setScene("intro"); playSfx("intro"); await wait(4700); if(!state.open)return;
        setScene("title"); playSfx("title"); await wait(3600); if(!state.open)return;
        setScene("live");
    }
    function showAnnouncement(){
        if(!state.open)return;
        state.announcement=$("nm4-broadcast-announcement-input")?.value?.trim()||"Announcement";
        state.announcementVisible=true;
        resumeAudio(); playSfx("announcement");
        const bar=$("nm4-announcement"), text=$("nm4-announcement-text"); if(text)text.textContent=state.announcement;
        bar?.classList.add("is-visible");
        const logo=document.querySelector("#nm4-scene-live .live-logo"); logo?.classList.add("is-hidden");
        clearTimeout(state.announcementTimer); state.announcementTimer=setTimeout(()=>{
            bar?.classList.remove("is-visible"); logo?.classList.remove("is-hidden"); state.announcementVisible=false;
        },5000);
    }

    function ensureAudioOutput(){
        if(state.audioElement) return state.audioElement;
        const audio=document.createElement("audio");
        audio.id="nm4-broadcast-audio-output";
        audio.autoplay=true;
        audio.controls=false;
        audio.playsInline=true;
        audio.style.cssText="position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
        document.body.appendChild(audio);
        state.audioElement=audio;
        return audio;
    }

    async function setBroadcastAudio(list, active){
        const audio=ensureAudioOutput();
        const item=list.find(x=>String(x.userId)===String(active));
        const stream=item?.stream || null;
        const streamId=stream?.id || null;
        if(streamId !== state.audioStreamId){
            audio.pause();
            audio.srcObject=stream;
            state.audioStreamId=streamId;
            if(stream) audio.play().catch(()=>{});
        } else if(stream && audio.paused){
            audio.play().catch(()=>{});
        }
    }

    function ensureAudioContext(){
        if(state.audioContext) return state.audioContext;
        const Ctx=window.AudioContext||window.webkitAudioContext;
        if(!Ctx) return null;
        const ctx=new Ctx();
        const master=ctx.createGain();
        master.gain.value=0.34;
        master.connect(ctx.destination);
        state.audioContext=ctx;
        state.audioMaster=master;
        return ctx;
    }

    function resumeAudio(){
        const ctx=ensureAudioContext();
        if(ctx?.state === "suspended") ctx.resume().catch(()=>{});
        ensureAudioOutput()?.play().catch(()=>{});
    }

    function tone({frequency=880, duration=0.12, type="sine", volume=0.12, delay=0}={}){
        const ctx=ensureAudioContext();
        if(!ctx || !state.audioMaster) return;
        if(ctx.state === "suspended") ctx.resume().catch(()=>{});
        const now=ctx.currentTime + delay;
        const osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type=type;
        osc.frequency.setValueAtTime(frequency,now);
        gain.gain.setValueAtTime(0.0001,now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001,volume),now+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
        osc.connect(gain).connect(state.audioMaster);
        osc.start(now); osc.stop(now+duration+0.02);
    }

    function playSfx(kind){
        resumeAudio();
        if(kind==="announcement"){
            tone({frequency:660,duration:.10,type:"sine",volume:.12});
            tone({frequency:990,duration:.18,type:"sine",volume:.10,delay:.09});
        } else if(kind==="daw"){
            tone({frequency:740,duration:.07,type:"triangle",volume:.10});
            tone({frequency:1040,duration:.11,type:"triangle",volume:.08,delay:.065});
        } else if(kind==="intro"){
            tone({frequency:392,duration:.22,type:"sine",volume:.08});
            tone({frequency:523.25,duration:.30,type:"sine",volume:.09,delay:.13});
        } else if(kind==="title"){
            tone({frequency:523.25,duration:.10,type:"sine",volume:.08});
            tone({frequency:659.25,duration:.16,type:"sine",volume:.10,delay:.08});
            tone({frequency:783.99,duration:.24,type:"sine",volume:.08,delay:.16});
        } else if(kind==="outro"){
            tone({frequency:659.25,duration:.13,type:"sine",volume:.08});
            tone({frequency:523.25,duration:.20,type:"sine",volume:.07,delay:.11});
            tone({frequency:392,duration:.30,type:"sine",volume:.06,delay:.23});
        }
    }

    function syncStreams(){
        const list=streams();
        const sig=list.map(x=>`${x.userId}:${x.stream?.id||""}`).join("|");
        if(sig!==state.lastStreamSignature){
            state.lastStreamSignature=sig;
            const live=new Set(list.map(x=>String(x.userId)));
            for(const [id,v] of state.videos){ if(!live.has(String(id))){try{v.pause();}catch(_){} v.srcObject=null; state.videos.delete(id);} }
            list.forEach(item=>{
                const id=String(item.userId); let v=state.videos.get(id);
                if(!v){v=document.createElement("video"); v.autoplay=true; v.muted=true; v.playsInline=true; v.srcObject=item.stream; state.videos.set(id,v); v.play().catch(()=>{});}
                else if(v.srcObject!==item.stream){v.srcObject=item.stream; v.play().catch(()=>{});}
            });
        }
        return list;
    }

    function ordered(list){
        const NM4=getNM4(), people=NM4?.merry?.participants||[];
        const order=new Map(people.map((p,i)=>[String(p.userId),i]));
        return [...list].sort((a,b)=>(order.get(String(a.userId))??9999)-(order.get(String(b.userId))??9999));
    }
    function activeId(list){
        const NM4=getNM4(); const merry=NM4?.merry?.participants?.[NM4?.merry?.index];
        if(merry && list.some(x=>String(x.userId)===String(merry.userId))) return String(merry.userId);
        if(NM4?.activeAudio?.user_id && list.some(x=>String(x.userId)===String(NM4.activeAudio.user_id))) return String(NM4.activeAudio.user_id);
        return list[0]?String(list[0].userId):null;
    }

    function renderMerry(){
        const stage=$("nm4-merry-stage"); if(!stage)return;
        const list=ordered(syncStreams()); const active=activeId(list);
        if(active && active !== state.lastAudibleActiveId && state.lastAudibleActiveId !== null) playSfx("daw");
        state.activeId=active; state.lastAudibleActiveId=active;
        setBroadcastAudio(list, active);
        const previous=stage.querySelectorAll(".daw-card"); previous.forEach(n=>n.remove());
        list.forEach((item,index)=>{
            const id=String(item.userId), card=document.createElement("div");
            card.className="daw-card"; card.dataset.userId=id;
            card.innerHTML=`<div class="daw-video-wrap"><video autoplay muted playsinline></video></div><div class="daw-meta"><div class="daw-label">DAW</div><strong>${esc(displayName(item.userId))}</strong><small>${id===active?"Current DAW preview":"Producer"}</small></div>`;
            if(id===active)card.classList.add("is-active");
            const v=card.querySelector("video"), source=state.videos.get(id); if(v&&source){v.srcObject=source.srcObject; v.play().catch(()=>{});}
            stage.appendChild(card);
        });
        applyPositions();
    }
    function applyPositions(){
        const cards=[...document.querySelectorAll("#nm4-merry-stage .daw-card")];
        const active=state.activeId, others=cards.filter(c=>String(c.dataset.userId)!==String(active));
        const radius=31;
        others.forEach((card,i)=>{
            const angle=(i/Math.max(1,others.length))*360-90;
            card.style.setProperty("--angle",`${angle}deg`); card.style.setProperty("--radius",`${radius}%`);
        });
    }

    function renderStaffChat(){
        const box=$("nm4-staff-chat-messages"); if(!box)return;
        const messages=window.musicChatState?.participants || [];
        if(!messages.length){box.innerHTML=`<div class="nm4-staff-empty">No staff messages yet.</div>`;return;}
        box.innerHTML=messages.slice(-8).map(m=>`<div class="nm4-staff-message"><strong>${esc(m.author||"Staff")}</strong><span>${esc(m.body||"")}</span></div>`).join("");
        box.scrollTop=box.scrollHeight;
    }

    function tick(){
        if(!state.open)return;
        updateViewerText(); const currentStreams=syncStreams();
        if(state.scene === "live") setBroadcastAudio(ordered(currentStreams), state.activeId || activeId(currentStreams));
        if(state.scene==="live"){
            const list=ordered(streams()), next=activeId(list);
            if(next!==state.activeId){state.activeId=next; renderMerry();}
            else applyPositions();
        }
        renderStaffChat();
        setTimeout(tick,1000/12);
    }

    function observerTick(){ createButton(); removeButtonIfNeeded(); if(state.open){} }
    setInterval(observerTick,1500); observerTick();

    const broadcastOpen=()=>{ open(); if(state.open) tick(); };
    window.nemawashiBroadcastV4={open:broadcastOpen,close,setScene,showAnnouncement,renderMerry};
    window.nemawashiBroadcastV2=window.nemawashiBroadcastV4;
})();
