(function(){
"use strict";
const client=()=>window.supabaseClient;
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let host=null, pool=[], competitions=[], selected=new Set(), activeCompetition=null, activeRound=1, eligible=[];
const notify=message=>{const node=document.getElementById("toast");if(node){node.textContent=message;node.classList.add("visible");setTimeout(()=>node.classList.remove("visible"),2800);}};
async function loadPool(){
 const {data,error}=await client().from("indesign_producer_submissions")
  .select("id,submitted_at,submitter_id,dem:indesign_dems(id,slug,title,artist,cover_path,visibility,is_public)")
  .eq("status","submitted").order("submitted_at",{ascending:false});
 if(error)throw error;
 pool=(data||[]).filter(x=>x.dem&&x.dem.visibility==="public"&&x.dem.is_public===true);
}
async function loadCompetitions(){
 const {data,error}=await client().from("indesign_producer_competitions")
  .select("id,title,announcement,status,current_round,created_at,rounds:indesign_producer_competition_rounds(round_number,target_count,label,status)")
  .order("created_at",{ascending:false});
 if(error)throw error;competitions=data||[];
}
function card(d){
 const art=d.cover_path?'<div class="producer-art"><img src="'+esc(client().storage.from("in-music-artwork").getPublicUrl(d.cover_path).data.publicUrl)+'" alt=""></div>':'<div class="producer-art producer-art-empty">in.</div>';
 return '<article class="producer-dem-card">'+art+'<div class="producer-dem-copy"><strong>'+esc(d.title)+'</strong><span>'+esc(d.artist)+'</span><small>Public programme submission</small></div>';
}
async function render(root){
 host=root;root.innerHTML='<p class="muted">Loading Producer Competition Space…</p>';
 try{await Promise.all([loadPool(),loadCompetitions()]);draw();}
 catch(e){console.error(e);root.innerHTML='<div class="empty-state"><strong>Could not load Producer Competitions.</strong><p>'+esc(e.message||"Check that the Step 12 database migration has been run.")+'</p></div>';}
}
function draw(){
 const active=competitions.find(c=>c.id===activeCompetition);
 host.innerHTML='<div class="producer-admin"><div class="welcome-row"><div><p class="eyebrow">INDESIGN MUSIC / STAFF SPACE</p><h2>Producer<br>competitions.</h2><p class="muted">Create a competition space, choose 20 programme submissions and manage each weekly round.</p></div><button class="button button-dark" id="producer-new-competition">＋ New competition</button></div>'+
 '<div class="producer-summary"><div><strong>'+pool.length+'</strong><span>ELIGIBLE PUBLIC DEMS</span></div><div><strong>'+competitions.length+'</strong><span>COMPETITION SPACES</span></div></div>'+
 '<div class="section-heading"><h3>Competition spaces</h3><span>A SPACE IS CREATED FOR EACH COMPETITION</span></div>'+
 (competitions.length?'<div class="producer-competition-list">'+competitions.map(c=>'<button class="producer-competition-row '+(c.id===activeCompetition?'active':'')+'" data-producer-open="'+esc(c.id)+'"><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.status.replaceAll("_"," ").toUpperCase())+' · '+new Date(c.created_at).toLocaleDateString()+'</small></span><span>↗</span></button>').join("")+'</div>':'<div class="empty-state"><strong>No competition spaces yet.</strong><p>Create the first one to begin collecting programme DEMs.</p></div>')+
 (active?renderCompetition(active):'')+'</div>';
}
function renderCompetition(c){
 const rounds=(c.rounds||[]).sort((a,b)=>a.round_number-b.round_number);
 const round=rounds.find(r=>r.round_number===c.current_round);
 return '<section class="producer-workspace"><div class="producer-workspace-head"><div><p class="eyebrow">PRODUCER COMPETITION SPACE</p><h3>'+esc(c.title)+'</h3><p class="muted">'+esc(c.announcement||"No announcement copy added.")+'</p></div><span class="producer-status">'+esc(c.status.replaceAll("_"," "))+'</span></div>'+
 '<div class="producer-rounds">'+rounds.map(r=>'<div class="producer-round '+(r.round_number===c.current_round?'current':'')+'"><small>WEEK '+r.round_number+'</small><strong>'+esc(r.label)+'</strong><span>'+esc(r.status.toUpperCase())+'</span></div>').join("")+'</div>'+
 (c.current_round===0||c.status==="submissions"?renderEntryPicker(c):renderRoundPicker(c,round))+
 '</section>';
}
function renderEntryPicker(c){
 const entries=eligible;
 return '<div class="producer-pool-head"><div><h4>Choose 20 contestants</h4><p>Select only public DEMs submitted through the Producer Programme.</p></div><strong>'+entries.length+' / 20 selected</strong></div>'+
 '<div class="producer-dem-grid">'+(pool.length?pool.map(s=>card(s.dem)+'</article>').join(""):'<p class="muted">No eligible programme submissions have been received yet.</p>')+'</div>'+
 '<p class="producer-note">The 20-entry pool is saved when you press “Save contestant pool”. Then Week 1 opens for staff selection and public voting.</p>'+
 '<button class="button button-dark" id="producer-save-pool" '+(entries.length!==20?'disabled':'')+'>Save contestant pool and open Week 1</button>';
}
function renderRoundPicker(c,round){
 if(!round)return '<p class="muted">Round information is missing. Check the Step 12 migration.</p>';
 const prior=c.current_round===1?null:c.current_round-1;
 const selectedIds=new Set((window.__producerSelections||[]).filter(x=>x.round_number===c.current_round).map(x=>x.submission_id));
 const base=(window.__producerEntries||[]).filter(x=>!prior|| (window.__producerSelections||[]).some(s=>s.round_number===prior&&s.submission_id===x.submission_id));
 const target=round.target_count;
 const voting=c.current_round===4;
 return '<div class="producer-pool-head"><div><h4>'+esc(round.label)+'</h4><p>'+(voting?'The public decides the winner from the three finalists.':'Choose exactly '+target+' DEMs to advance. KiKi users can vote during this round too.')+'</p></div><strong>'+(voting?'PUBLIC VOTE':selectedIds.size+' / '+target+' selected')+'</strong></div>'+
 '<div class="producer-dem-grid">'+base.map(e=>{const s=pool.find(p=>p.id===e.submission_id);const d=s?.dem;if(!d)return "";return '<article class="producer-dem-card '+(selectedIds.has(e.submission_id)?'chosen':'')+'">'+(d.cover_path?'<div class="producer-art"><img src="'+esc(client().storage.from("in-music-artwork").getPublicUrl(d.cover_path).data.publicUrl)+'" alt=""></div>':'<div class="producer-art producer-art-empty">in.</div>')+'<div class="producer-dem-copy"><strong>'+esc(d.title)+'</strong><span>'+esc(d.artist)+'</span><small>Contestant '+e.entry_number+'</small></div>'+(voting?'':'<button class="producer-trophy" data-producer-select="'+esc(e.submission_id)+'" aria-pressed="'+selectedIds.has(e.submission_id)+'" title="Select to advance">🏆</button>')+'</article>';}).join("")+'</div>'+
 (voting?'<div class="producer-public-final"><strong>Finalists are ready for KiKi public voting.</strong><p>Once KiKi voting is connected, the highest vote total will determine the winner.</p></div>':'<button class="button button-dark" id="producer-finalize-round" '+(selectedIds.size!==target?'disabled':'')+'>Confirm '+target+' selections and open next week</button>');
}
async function openCompetition(id){
 activeCompetition=id;await refreshActive();draw();
}
async function refreshActive(){
 await Promise.all([loadPool(),loadCompetitions()]);
 const c=competitions.find(x=>x.id===activeCompetition);if(!c)return;
 const [{data:entries,error:e1},{data:selections,error:e2}]=await Promise.all([
 client().from("indesign_producer_competition_entries").select("id,submission_id,entry_number").eq("competition_id",activeCompetition).order("entry_number"),
 client().from("indesign_producer_competition_selections").select("round_number,submission_id").eq("competition_id",activeCompetition)
 ]);
 if(e1)throw e1;if(e2)throw e2;window.__producerEntries=entries||[];window.__producerSelections=selections||[];
 eligible=(window.__producerEntries||[]).map(e=>e.submission_id);
}
async function createCompetition(){
 const title=prompt("Competition title (for example: Producer Competition - Week 1)");
 if(!title||!title.trim())return;
 const announcement=prompt("Announcement text for the InDesign Music message board:","A new Producer Competition is open. Join the Producer Programme to submit your DEM.");
 if(announcement===null)return;
 const {data:{user},error:authError}=await client().auth.getUser();if(authError||!user){notify("Please sign in again.");return;}
 const {data,error}=await client().from("indesign_producer_competitions").insert({title:title.trim(),announcement:announcement.trim(),status:"submissions",current_round:0,created_by:user.id}).select("id").single();
 if(error){notify(error.message);return;}
 activeCompetition=data.id;eligible=[];await refreshActive();draw();notify("Producer Competition Space created. Choose its 20 contestants.");
}
async function savePool(){
 if(eligible.length!==20){notify("Select exactly 20 public programme DEMs.");return;}
 const {data:{user}}=await client().auth.getUser();
 const rows=eligible.map((submission_id,i)=>({competition_id:activeCompetition,submission_id,entry_number:i+1,added_by:user.id}));
 const {error}=await client().from("indesign_producer_competition_entries").insert(rows);
 if(error){notify(error.message);return;}
 const {error:updateError}=await client().from("indesign_producer_competitions").update({status:"round_1",current_round:1,updated_at:new Date().toISOString()}).eq("id",activeCompetition);
 if(updateError){notify(updateError.message);return;}
 const {error:roundError}=await client().from("indesign_producer_competition_rounds").update({status:"open",opened_at:new Date().toISOString()}).eq("competition_id",activeCompetition).eq("round_number",1);
 if(roundError){notify(roundError.message);return;}
 await refreshActive();draw();notify("20 contestants added. Week 1 is open.");
}
async function finalizeRound(){
 const c=competitions.find(x=>x.id===activeCompetition),n=c?.current_round;
 const round=c?.rounds?.find(r=>r.round_number===n);if(!round||n>3)return;
 const chosen=[...(window.__producerSelections||[])].filter(x=>x.round_number===n).map(x=>x.submission_id);
 if(chosen.length!==round.target_count){notify("Select exactly "+round.target_count+" DEMs.");return;}
 const {data:{user}}=await client().auth.getUser();
 const rows=chosen.map(submission_id=>({competition_id:activeCompetition,round_number:n,submission_id,selected_by:user.id}));
 const {error}=await client().from("indesign_producer_competition_selections").insert(rows);
 if(error){notify(error.message);return;}
 const next=n+1,status=next===4?"public_final":"round_"+next;
 const {error:updateError}=await client().from("indesign_producer_competitions").update({current_round:next,status,updated_at:new Date().toISOString()}).eq("id",activeCompetition);
 if(updateError){notify(updateError.message);return;}
 await client().from("indesign_producer_competition_rounds").update({status:"finalized",finalized_at:new Date().toISOString(),finalized_by:user.id}).eq("competition_id",activeCompetition).eq("round_number",n);
 await client().from("indesign_producer_competition_rounds").update({status:"open",opened_at:new Date().toISOString()}).eq("competition_id",activeCompetition).eq("round_number",next);
 await refreshActive();draw();notify(next===4?"Three finalists selected. Public final is ready.":"Week "+next+" is now open.");
}
document.addEventListener("click",async event=>{
 const open=event.target.closest("[data-producer-open]");if(open){try{await openCompetition(open.dataset.producerOpen);}catch(e){notify(e.message);}return;}
 const select=event.target.closest("[data-producer-select]");if(select){const id=select.dataset.producerSelect;const c=competitions.find(x=>x.id===activeCompetition);const n=c?.current_round;const prior=n===1?null:n-1;const base=(window.__producerEntries||[]).filter(x=>!prior||(window.__producerSelections||[]).some(s=>s.round_number===prior&&s.submission_id===x.submission_id));const round=c?.rounds?.find(r=>r.round_number===n);const set=new Set((window.__producerSelections||[]).filter(x=>x.round_number===n).map(x=>x.submission_id));if(set.has(id))set.delete(id);else if(set.size<round.target_count)set.add(id);else{notify("This round allows "+round.target_count+" selections.");return;}window.__producerSelections=(window.__producerSelections||[]).filter(x=>x.round_number!==n).concat([...set].map(submission_id=>({round_number:n,submission_id})));draw();return;}
 if(event.target.closest("#producer-new-competition")){await createCompetition();return;}
 if(event.target.closest("#producer-save-pool")){await savePool();return;}
 if(event.target.closest("#producer-finalize-round")){await finalizeRound();return;}
});
document.addEventListener("click",event=>{
 const card=event.target.closest(".producer-dem-card");
 if(card&&host?.querySelector("#producer-save-pool")&&!event.target.closest("button")){const d=pool.find(s=>s.dem?.id&&card.textContent.includes(s.dem.title));if(!d)return;if(eligible.includes(d.id))eligible=eligible.filter(x=>x!==d.id);else if(eligible.length<20)eligible.push(d.id);else notify("The contestant pool is limited to 20.");draw();}
});
window.indesignCompetitions={render};
})();