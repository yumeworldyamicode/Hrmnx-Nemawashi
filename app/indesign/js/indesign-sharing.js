/* indesign individual sharing */
(() => {
  "use strict";
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const parseTime = value => {
    const parts = String(value).trim().split(":").map(Number);
    if (!parts.length || parts.some(n => !Number.isFinite(n))) return NaN;
    return parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts[0]*60+parts[1];
  };
  const fmt = seconds => {
    const s=Math.max(0,Math.floor(Number(seconds)||0));
    return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  };
  function ensureStyles(){
    if(document.getElementById("indesign-sharing-styles"))return;
    const style=document.createElement("style");style.id="indesign-sharing-styles";
    style.textContent=`
      .brainstorm-share-idea{border:1px solid #dfe3f1;background:#fff;color:#414c78;border-radius:3px;padding:7px 10px;font:600 11px Helvetica,Arial,sans-serif;cursor:pointer;margin-left:6px}
      .brainstorm-share-idea:hover{background:#f0f2ff;border-color:#9ba9ff}
      .indesign-share-overlay{position:fixed;inset:0;z-index:100000;background:#11182799;display:grid;place-items:center;padding:18px}
      .indesign-share-dialog{width:min(460px,100%);background:#fff;color:#171923;border:1px solid #e4e6ef;box-shadow:0 24px 80px #0003;padding:25px}
      .indesign-share-dialog header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
      .indesign-share-dialog h2{font:700 22px Helvetica,Arial,sans-serif;margin:0}
      .indesign-share-dialog header button{border:0;background:none;font-size:23px;cursor:pointer;color:#555}
      .indesign-share-dialog p{font:13px/1.55 Helvetica,Arial,sans-serif;color:#656a78;margin:0 0 17px}
      .indesign-share-dialog label{display:block;font:600 11px Helvetica,Arial,sans-serif;color:#5d6270;margin:13px 0 6px}
      .indesign-share-dialog input,.indesign-share-dialog select{width:100%;height:40px;border:1px solid #dfe1e8;background:#fff;padding:0 11px;color:#171923;font:13px Helvetica,Arial,sans-serif;border-radius:2px}
      .indesign-share-range{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .indesign-share-dialog .share-submit{width:100%;height:42px;border:0;background:#748fe8;color:#fff;font:700 12px Helvetica,Arial,sans-serif;margin-top:20px;cursor:pointer}
      .indesign-share-dialog .share-submit:disabled{opacity:.5;cursor:wait}
      .indesign-share-error{color:#a33!important;min-height:18px;margin-top:10px!important}
      body.indesign-dark .indesign-share-dialog{background:#191a20;color:#fff;border-color:#353744}
      body.indesign-dark .indesign-share-dialog input,body.indesign-dark .indesign-share-dialog select{background:#23252d;color:#fff;border-color:#3c3e49}
    `;
    document.head.appendChild(style);
  }
  function addShareButtons(){
    document.querySelectorAll(".brainstorm-idea").forEach(article=>{
      if(article.querySelector(".brainstorm-share-idea"))return;
      const button=document.createElement("button");button.type="button";button.className="brainstorm-share-idea";button.innerHTML=window.HrmnxIcons.svg("external-link")+' Share';button.setAttribute("aria-label","Share this idea privately");
      article.appendChild(button);
    });
  }
  const observer=new MutationObserver(addShareButtons);
  observer.observe(document.body,{childList:true,subtree:true});
  ensureStyles();addShareButtons();

  async function openShareDialog(article){
    const client=window.supabaseClient;
    if(!client){alert("Nemawashi connection is unavailable.");return;}
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){alert("Please sign in to share an idea.");return;}
    const idea=article.querySelector(".brainstorm-idea-copy p")?.textContent?.trim()||"";
    const section=article.closest(".brainstorm-section");
    const sectionName=section?.querySelector(".brainstorm-section-title")?.value||section?.querySelector(".brainstorm-section-title")?.textContent||"Music Brainstorm";
    const projectName=document.querySelector(".mood-doc-title strong")?.textContent?.trim()||"Music project";
    const match=idea.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:to|[-–—])\s*(\d{1,2}:\d{2}(?::\d{2})?)/i);
    const audio=document.getElementById("brainstorm-audio");
    if(!audio?.src){alert("Import the .prodem audio package before sharing a playable section.");return;}
    let profilesResult=await client.from("profiles").select("id,display_name,username").eq("is_staff",true).order("display_name",{ascending:true}).limit(200);
    if(profilesResult.error){console.error(profilesResult.error);alert("Could not load Hrmnx team members.");return;}
    const recipients=(profilesResult.data||[]).filter(p=>p.id!==user.id);
    if(!recipients.length){alert("There are no other employee accounts available to share with yet.");return;}
    const overlay=document.createElement("div");overlay.className="indesign-share-overlay";
    overlay.innerHTML='<section class="indesign-share-dialog" role="dialog" aria-modal="true" aria-label="Share music idea"><header><h2>Share this section</h2><button type="button" data-share-close aria-label="Close">×</button></header><p>Send this idea privately through Nemawashi Messages. The recipient will be able to play only the selected part of the production.</p><label for="share-recipient">Send to</label><select id="share-recipient">'+recipients.map(p=>'<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.display_name||p.username||"Hrmnx employee")+(p.username?" · @"+escapeHTML(p.username):"")+'</option>').join("")+'</select><div class="indesign-share-range"><div><label for="share-start">Start time</label><input id="share-start" value="'+(match?escapeHTML(match[1]):"00:00")+'" placeholder="1:30"></div><div><label for="share-end">End time</label><input id="share-end" value="'+(match?escapeHTML(match[2]):"02:30")+'" placeholder="2:30"></div></div><p class="indesign-share-error" id="share-error"></p><button type="button" class="share-submit" id="share-submit">Send privately</button></section>';
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    overlay.querySelector("[data-share-close]").addEventListener("click",close);
    overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
    overlay.querySelector("#share-submit").addEventListener("click",async()=>{
      const submit=overlay.querySelector("#share-submit"),errorNode=overlay.querySelector("#share-error");
      const startText=overlay.querySelector("#share-start").value.trim(),endText=overlay.querySelector("#share-end").value.trim();
      const start=parseTime(startText),end=parseTime(endText),recipientId=overlay.querySelector("#share-recipient").value;
      if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start){errorNode.textContent="Enter a valid start and end time.";return;}
      if(audio.duration&&end>audio.duration){errorNode.textContent="The end time is longer than the audio.";return;}
      submit.disabled=true;submit.textContent="Preparing private share…";errorNode.textContent="";
      let shareId=null,path=null;
      try{
        const source=await fetch(audio.src);if(!source.ok)throw new Error("Could not access the imported audio. Re-import the .prodem package and try again.");
        const blob=await source.blob();if(!blob.size)throw new Error("The production audio is empty.");
        const ext=blob.type.includes("wav")?"wav":blob.type.includes("ogg")?"ogg":blob.type.includes("mp4")?"m4a":blob.type.includes("webm")?"webm":"mp3";
        shareId=crypto.randomUUID();path=user.id+"/"+shareId+"."+ext;
        const {error:rowError}=await client.from("indesign_shared_segments").insert({id:shareId,sender_id:user.id,recipient_id:recipientId,project_name:projectName,section_name:sectionName,idea_text:idea,start_seconds:start,end_seconds:end,audio_path:path});
        if(rowError)throw rowError;
        const {error:uploadError}=await client.storage.from("indesign-message-audio").upload(path,blob,{contentType:blob.type||"application/octet-stream",upsert:false});
        if(uploadError)throw uploadError;
        const recipient=recipients.find(p=>p.id===recipientId);
        const {error:messageError}=await client.from("nemawashi_direct_messages").insert({sender_id:user.id,recipient_id:recipientId,content:"Shared a music section from "+projectName+" ("+fmt(start)+"–"+fmt(end)+").",share_id:shareId});
        if(messageError)throw messageError;
        close();
        const toast=document.getElementById("toast");if(toast){toast.textContent="Music section shared with "+(recipient?.display_name||"your teammate")+". Check Personal Messages.";toast.classList.add("visible");setTimeout(()=>toast.classList.remove("visible"),3000);}
        else alert("Music section shared successfully.");
      }catch(err){
        console.error("indesign individual share failed",err);
        if(path)await client.storage.from("indesign-message-audio").remove([path]);
        if(shareId)await client.from("indesign_shared_segments").delete().eq("id",shareId);
        errorNode.textContent=err.message||"Could not send this share.";
        submit.disabled=false;submit.textContent="Send privately";
      }
    });
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest(".brainstorm-share-idea");
    if(button){event.preventDefault();const article=button.closest(".brainstorm-idea");if(article)openShareDialog(article);}
  });
})();