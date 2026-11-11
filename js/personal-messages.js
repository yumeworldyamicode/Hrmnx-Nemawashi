/* Nemawashi Personal Messages: private one-to-one conversations */
(() => {
  "use strict";
  let pmUser=null,pmProfiles=[],pmMessages=[],pmShares=[],pmActiveId=null,pmBusy=false;
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const stamp=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?"":d.toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});};
  function styles(){
    if(document.getElementById("personal-messages-styles"))return;
    const s=document.createElement("style");s.id="personal-messages-styles";s.textContent=`
      .pm-page{height:100%;min-height:560px;display:grid;grid-template-columns:260px minmax(0,1fr);background:#fff;border:1px solid #e8e9ee;color:#171923}
      .pm-people{border-right:1px solid #e8e9ee;min-width:0;display:flex;flex-direction:column}
      .pm-people-head{padding:20px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between}
      .pm-people-head strong{font:700 13px Helvetica,Arial,sans-serif}
      .pm-refresh{border:1px solid #e4e5eb;background:#fff;padding:6px 9px;font:600 10px Helvetica,Arial,sans-serif;cursor:pointer}
      .pm-person-list{overflow:auto;padding:8px}
      .pm-person{width:100%;display:flex;gap:10px;align-items:center;padding:11px;border:0;background:transparent;text-align:left;cursor:pointer;color:#20212a}
      .pm-person.active{background:#f0f2ff}
      .pm-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#edf0ff;color:#5667b4;font:700 12px Helvetica,Arial,sans-serif;flex:none}
      .pm-person-copy{min-width:0;display:flex;flex-direction:column;gap:4px}
      .pm-person-copy strong{font:700 12px Helvetica,Arial,sans-serif}
      .pm-person-copy small{font:10px Helvetica,Arial,sans-serif;color:#8a8d98;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .pm-thread{display:flex;flex-direction:column;min-width:0;min-height:0}
      .pm-thread-head{padding:20px 22px;border-bottom:1px solid #eee}
      .pm-thread-head strong{font:700 14px Helvetica,Arial,sans-serif}
      .pm-thread-head small{display:block;margin-top:4px;color:#858894;font:10px Helvetica,Arial,sans-serif}
      .pm-thread-list{flex:1;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:12px;min-height:260px}
      .pm-message{max-width:min(78%,520px);align-self:flex-start;background:#f3f4f7;padding:12px 14px;font:12px/1.55 Helvetica,Arial,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere}
      .pm-message.mine{align-self:flex-end;background:#edf0ff}
      .pm-message time{display:block;color:#898c98;font-size:9px;margin-top:7px}
      .pm-share-card{margin-top:10px;border:1px solid #dfe2f2;background:#fff;padding:12px}
      .pm-share-card strong{display:block;font-size:11px}
      .pm-share-card small{display:block;color:#858894;font-size:10px;margin:5px 0 10px}
      .pm-share-card a{display:inline-block;background:#748fe8;color:#fff;text-decoration:none;padding:8px 11px;font-size:10px;font-weight:700}
      .pm-compose{display:flex;gap:9px;padding:15px;border-top:1px solid #eee}
      .pm-compose input{flex:1;min-width:0;height:40px;border:1px solid #e1e3ea;padding:0 12px;font:12px Helvetica,Arial,sans-serif}
      .pm-compose button{border:0;background:#748fe8;color:white;padding:0 17px;font:700 11px Helvetica,Arial,sans-serif;cursor:pointer}
      .pm-empty{margin:auto;text-align:center;color:#858894;font:12px/1.6 Helvetica,Arial,sans-serif;padding:25px}
      .pm-loading{padding:28px;color:#858894;font:12px Helvetica,Arial,sans-serif}
      @media(max-width:700px){.pm-page{grid-template-columns:110px minmax(0,1fr)}.pm-people-head{padding:12px 8px}.pm-people-head strong{font-size:10px}.pm-person{padding:9px 5px;gap:5px}.pm-avatar{width:26px;height:26px}.pm-person-copy strong{font-size:10px}.pm-person-copy small{display:none}.pm-thread-head{padding:15px}.pm-thread-list{padding:12px}.pm-message{max-width:92%}.pm-compose{padding:10px}.pm-compose button{padding:0 10px}}
    `;
    document.head.appendChild(s);
  }
  async function loadPersonalMessages(){
    styles();resetNemawashiTheme();setTopbar("NEMAWASHI","Personal Messages");
    messagesContent.innerHTML='<div class="pm-loading">Loading private conversations…</div>';
    const {data:{user},error:authError}=await supabaseClient.auth.getUser();
    if(authError||!user){messagesContent.innerHTML='<div class="pm-loading">Please sign in to view Personal Messages.</div>';return;}
    pmUser=user;
    const [peopleResult,messageResult]=await Promise.all([
      supabaseClient.from("profiles").select("id,display_name,username,avatar_url").eq("is_staff",true).order("display_name",{ascending:true}).limit(200),
      supabaseClient.from("nemawashi_direct_messages").select("id,sender_id,recipient_id,content,share_id,created_at").or("sender_id.eq."+user.id+",recipient_id.eq."+user.id).order("created_at",{ascending:true}).limit(500)
    ]);
    if(peopleResult.error||messageResult.error){
      console.error("Personal Messages load failed",peopleResult.error||messageResult.error);
      messagesContent.innerHTML='<div class="pm-loading">Could not load Personal Messages. Make sure the Step 7 migration has been run.</div>';return;
    }
    pmProfiles=(peopleResult.data||[]).filter(p=>p.id!==user.id);
    pmMessages=messageResult.data||[];
    const ids=[...new Set(pmMessages.map(m=>m.share_id).filter(Boolean))];
    pmShares=[];
    if(ids.length){const {data,error}=await supabaseClient.from("indesign_shared_segments").select("id,project_name,section_name,start_seconds,end_seconds").in("id",ids);if(!error)pmShares=data||[];}
    const recent=new Map();
    pmMessages.forEach(m=>{const other=m.sender_id===user.id?m.recipient_id:m.sender_id;recent.set(other,m.created_at);});
    pmProfiles.sort((a,b)=>(new Date(recent.get(b.id)||0))-(new Date(recent.get(a.id)||0)) || String(a.display_name||a.username).localeCompare(String(b.display_name||b.username)));
    pmActiveId=pmProfiles.find(p=>recent.has(p.id))?.id||pmProfiles[0]?.id||null;
    renderPersonalView();
  }
  function renderPersonalView(){
    const active=pmProfiles.find(p=>p.id===pmActiveId);
    const people=pmProfiles.map(p=>'<button type="button" class="pm-person '+(p.id===pmActiveId?"active":"")+'" data-pm-person="'+esc(p.id)+'"><span class="pm-avatar">'+esc((p.display_name||p.username||"?").slice(0,1).toUpperCase())+'</span><span class="pm-person-copy"><strong>'+esc(p.display_name||p.username||"Hrmnx employee")+'</strong><small>@'+esc(p.username||"employee")+'</small></span></button>').join("");
    const thread=active?pmMessages.filter(m=>(m.sender_id===pmUser.id&&m.recipient_id===active.id)||(m.sender_id===active.id&&m.recipient_id===pmUser.id)).map(m=>{
      const share=pmShares.find(s=>s.id===m.share_id);
      const shareHTML=share?'<div class="pm-share-card"><strong>♫ '+esc(share.project_name)+'</strong><small>'+esc(share.section_name)+' · '+Math.floor(Number(share.start_seconds)/60)+':'+String(Math.floor(Number(share.start_seconds)%60)).padStart(2,"0")+' – '+Math.floor(Number(share.end_seconds)/60)+':'+String(Math.floor(Number(share.end_seconds)%60)).padStart(2,"0")+'</small><a href="app/indesign/segment.html?id='+encodeURIComponent(share.id)+'" target="_blank" rel="noopener">Play shared section ↗</a></div>':"";
      return '<article class="pm-message '+(m.sender_id===pmUser.id?"mine":"")+'">'+esc(m.content||"")+(shareHTML)+ '<time>'+esc(stamp(m.created_at))+'</time></article>';
    }).join(""):'<div class="pm-empty">Choose someone to start a private conversation.</div>';
    messagesContent.innerHTML='<section class="pm-page"><aside class="pm-people"><div class="pm-people-head"><strong>PEOPLE</strong><button type="button" class="pm-refresh" id="pm-refresh">↻</button></div><div class="pm-person-list">'+(people||'<p class="pm-empty">No other team members found.</p>')+'</div></aside><section class="pm-thread">'+(active?'<header class="pm-thread-head"><strong>'+esc(active.display_name||active.username||"Hrmnx employee")+'</strong><small>Private Nemawashi conversation</small></header>':'<header class="pm-thread-head"><strong>Personal Messages</strong><small>Private conversations</small></header>')+'<div class="pm-thread-list" id="pm-thread-list">'+(thread||'<div class="pm-empty">No messages yet. Send a message below or share a Music Brainstorm idea from indesign.</div>')+'</div>'+(active?'<form class="pm-compose" id="pm-compose"><input id="pm-compose-input" maxlength="4000" autocomplete="off" placeholder="Write a private message…"><button type="submit">Send</button></form>':'')+'</section></section>';
    const list=document.getElementById("pm-thread-list");if(list)list.scrollTop=list.scrollHeight;
  }
  messagesContent.addEventListener("click",event=>{
    const person=event.target.closest("[data-pm-person]");
    if(person){pmActiveId=person.dataset.pmPerson;renderPersonalView();return;}
    if(event.target.closest("#pm-refresh"))loadPersonalMessages();
  });
  messagesContent.addEventListener("submit",async event=>{
    if(event.target.id!=="pm-compose")return;
    event.preventDefault();if(pmBusy||!pmActiveId)return;
    const input=document.getElementById("pm-compose-input"),value=input.value.trim();if(!value)return;
    pmBusy=true;const send=event.target.querySelector("button");send.disabled=true;
    const {data,error}=await supabaseClient.from("nemawashi_direct_messages").insert({sender_id:pmUser.id,recipient_id:pmActiveId,content:value}).select().single();
    pmBusy=false;send.disabled=false;
    if(error){console.error(error);alert("Could not send this message. Check the Step 7 migration and try again.");return;}
    pmMessages.push(data);input.value="";renderPersonalView();
  });
  const originalRenderPage=renderPage;
  renderPage=function(page){
    if(page==="personal"){loadPersonalMessages();return;}
    return originalRenderPage(page);
  };
  window.addEventListener("focus",()=>{if(document.querySelector(".pm-page"))loadPersonalMessages();});
})();