(function(){
"use strict";
const client=window.supabaseClient,$=id=>document.getElementById(id);
const status=$("pw-status"),app=$("pw-app"),authRequired=$("pw-auth-required"),closed=$("pw-closed"),list=$("pw-project-list"),editor=$("pw-editor");
let user=null,program=null,projects=[],active=null,productionBlob=null,productionName="",coverBlob=null,lyrics=null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaults=()=>[{id:"ideas",title:"Song ideas",items:[]},{id:"production",title:"Production",items:[]},{id:"lyrics",title:"Lyrics & topline",items:[]},{id:"arrangement",title:"Arrangement",items:[]}];
function normalise(project){if(!project.content||typeof project.content!=="object")project.content={};project.content.mode="music";if(!project.content.music||typeof project.content.music!=="object")project.content.music={};if(!Array.isArray(project.content.music.sections))project.content.music.sections=defaults();project.content.music.sections.forEach((s,i)=>{if(!s.id)s.id="section-"+i;if(!Array.isArray(s.items))s.items=[];});return project;}
function setStatus(text){status.textContent=text;}
async function init(){
 if(!client)throw new Error("The InDesign connection could not be loaded.");
 const [{data:s,error:se},{data:p,error:pe}]=await Promise.all([client.auth.getSession(),client.from("indesign_producer_programs").select("id,title,is_open").eq("slug","open-producer-programme").maybeSingle()]);
 if(se)throw se;if(pe)throw pe;program=p;
 if(!s.session?.user){status.hidden=true;authRequired.hidden=false;return;}
 user=s.session.user;
 if(!program){setStatus("The Producer Programme has not been configured yet.");return;}
 if(!program.is_open){status.hidden=true;closed.hidden=false;return;}
 status.hidden=true;app.hidden=false;await loadProjects();
}
async function loadProjects(){
 const {data,error}=await client.from("indesign_projects").select("id,owner_id,name,type,description,content,producer_program_id,created_at,updated_at").eq("owner_id",user.id).eq("producer_program_id",program.id).eq("type","brainstorm").order("updated_at",{ascending:false});
 if(error)throw error;projects=(data||[]).map(normalise);renderList();
}

async function importMusicPackage(file,kind){
 if(!window.JSZip)throw new Error("Package support did not load. Refresh and try again.");
 const zip=await window.JSZip.loadAsync(file),mf=zip.file("manifest.json");
 if(!mf)throw new Error("This package has no manifest.json.");
 const data=JSON.parse(await mf.async("string"));
 if(kind==="prodem"){
  if(data.format!=="indesign-prodem"||data.version!==1)throw new Error("Unsupported .prodem package.");
  const name=data.assets?.audio;if(!name||!zip.file("audio/"+name))throw new Error("The .prodem package does not contain its audio file.");
  const rawAudio=await zip.file("audio/"+name).async("blob");productionName=name;const ext=(name.split(".").pop()||"").toLowerCase();const mime={mp3:"audio/mpeg",wav:"audio/wav",m4a:"audio/mp4",aac:"audio/aac",ogg:"audio/ogg",flac:"audio/flac",webm:"audio/webm"}[ext]||"application/octet-stream";productionBlob=new Blob([rawAudio],{type:mime});
  const track=data.track||{};active.content.music.production={title:track.title||"",artist:track.artist||"",bpm:track.bpm||"",key:track.key||"",producers:track.producers||[],credits:track.credits||"",contributions:Array.isArray(track.contributions)?track.contributions:[],audioName:name};
  const art=data.assets?.artwork;if(art&&zip.file("artwork/"+art))coverBlob=await zip.file("artwork/"+art).async("blob");
 }else{
  if(data.format!=="indesign-lyrdem"||data.version!==1)throw new Error("Unsupported .lyrdem package.");
  lyrics={artist:data.artist||{},sections:data.sections||[],credits:data.credits||{}};active.content.music.lyrics=lyrics;
 }
 await save();renderEditor();setStatus(kind.toUpperCase()+" imported successfully.");
}
function openPublishDialog(){
 if(!productionBlob){setStatus("Import a .prodem package with audio before publishing.");return;}
 const rules=(lyrics?.sections||[]).flatMap(section=>(section.rules||[]).map(rule=>({...rule,section:section.title})));
 if(!rules.length){setStatus("Import a .lyrdem package with lyric rules before publishing.");return;}
 const overlay=document.createElement("div");overlay.className="pw-publish-overlay";
 overlay.innerHTML='<section class="pw-publish-dialog" role="dialog" aria-modal="true" aria-label="Publish DEM"><header><div><span class="eyebrow">PRODUCER PROGRAMME</span><h2>Publish your DEM.</h2></div><button type="button" data-publish-close aria-label="Close">×</button></header><label>DEM title<input id="pw-dem-title" maxlength="160" value="'+esc(active.content.music.production?.title||active.name)+'"></label><label>Artist<input id="pw-dem-artist" maxlength="160" value="'+esc(active.content.music.production?.artist||lyrics?.artist?.name||"")+'"></label><label>Vocal content<select id="pw-dem-vocal"><option value="vocals">Vocals present</option><option value="instrumental">Instrumental / no vocals</option></select></label><p class="pw-publish-help">Play the production and press Space at the beginning of each lyric rule to sync it. DEMs published here are public and automatically submitted to the official Producer Programme.</p><audio id="pw-dem-audio" controls preload="metadata"></audio><div class="pw-sync-meta"><span id="pw-sync-time">00:00.000</span><span id="pw-sync-count">0 / '+rules.length+' synced</span></div><div class="pw-sync-list">'+rules.map((r,i)=>'<button type="button" data-sync-rule="'+i+'"><small>RULE '+esc(r.number)+' · '+esc(r.section)+'</small><span>'+esc(r.text)+'</span><em>Not synced</em></button>').join("")+'</div><p class="pw-publish-status" id="pw-publish-status">Select a rule, then press Space to record its timestamp.</p><button class="button button-dark" id="pw-confirm-publish">Build and publish DEM</button></section>';
 document.body.appendChild(overlay);
 const audio=overlay.querySelector("#pw-dem-audio"),statusNode=overlay.querySelector("#pw-publish-status"),time=overlay.querySelector("#pw-sync-time"),count=overlay.querySelector("#pw-sync-count"),sync=rules.map(()=>null);let current=0;
 audio.src=URL.createObjectURL(productionBlob);
 const fmt=t=>{const m=Math.floor(t/60),s=Math.floor(t%60),ms=Math.floor(t%1*1000);return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")+"."+String(ms).padStart(3,"0");};
 const paint=()=>{overlay.querySelectorAll("[data-sync-rule]").forEach((el,i)=>{el.classList.toggle("active",i===current);el.querySelector("em").textContent=sync[i]===null?"Not synced":fmt(sync[i]);});count.textContent=sync.filter(x=>x!==null).length+" / "+rules.length+" synced";};
 const key=e=>{if(!document.body.contains(overlay)||e.code!=="Space"||["INPUT","TEXTAREA","SELECT","BUTTON"].includes(document.activeElement.tagName))return;e.preventDefault();sync[current]=audio.currentTime;if(current<rules.length-1)current++;paint();};
 document.addEventListener("keydown",key);audio.addEventListener("timeupdate",()=>time.textContent=fmt(audio.currentTime||0));
 overlay.addEventListener("click",async e=>{
  if(e.target===overlay||e.target.closest("[data-publish-close]")){document.removeEventListener("keydown",key);URL.revokeObjectURL(audio.src);overlay.remove();return;}
  const rule=e.target.closest("[data-sync-rule]");if(rule){current=Number(rule.dataset.syncRule);sync[current]=audio.currentTime;paint();return;}
  if(!e.target.closest("#pw-confirm-publish"))return;
  const title=overlay.querySelector("#pw-dem-title").value.trim(),artist=overlay.querySelector("#pw-dem-artist").value.trim();
  if(!title||!artist){statusNode.textContent="Add a DEM title and artist first.";return;}
  if(sync.some(t=>t===null)){statusNode.textContent="Sync every lyric rule before publishing. "+sync.filter(t=>t===null).length+" remain.";return;}
  const button=overlay.querySelector("#pw-confirm-publish");button.disabled=true;button.textContent="Publishing…";statusNode.textContent="Building your DEM package…";
  let path=null;
  try{
   const music=active.content.music,slug=crypto.randomUUID(),filename=productionName||"production-audio";
   const manifest={format:"indesign-dem",version:1,createdAt:new Date().toISOString(),title,artist,vocalMode:overlay.querySelector("#pw-dem-vocal").value,production:music.production||{},contributions:Array.isArray(music.production?.contributions)?music.production.contributions:[],lyrics:{artist:lyrics?.artist||{},sections:lyrics?.sections||[],rules:rules.map((r,i)=>({...r,time:sync[i]}))},assets:{audio:filename,artwork:coverBlob?"cover":null},producerProgramme:{projectId:active.id,programId:program.id}};
   const zip=new window.JSZip();zip.file("manifest.json",JSON.stringify(manifest,null,2));zip.file("audio/"+filename,productionBlob);if(coverBlob)zip.file("artwork/cover",coverBlob);
   const packageBlob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});path=slug+".dem";
   const {error:uploadError}=await client.storage.from("indesign-dems").upload(path,packageBlob,{contentType:"application/zip"});if(uploadError)throw uploadError;
   const {data:dem,error:dbError}=await client.from("indesign_dems").insert({slug,title,artist,owner_id:user.id,project_id:active.id,package_path:path,is_public:true,visibility:"public",description:"Official Producer Programme submission · "+active.name,theme:"blur"}).select("id,slug,title,artist,created_at").single();
   if(dbError)throw dbError;
   const url=new URL("dem.html?id="+encodeURIComponent(dem.slug),location.href).href;
   overlay.querySelector(".pw-publish-dialog").innerHTML='<span class="eyebrow">OFFICIAL SUBMISSION REGISTERED</span><h2>Your DEM is published.</h2><p class="pw-publish-help">Your public DEM has been added to the Producer Programme automatically. You can now share its page.</p><div class="pw-published-link"><input readonly value="'+esc(url)+'"><button type="button" id="pw-copy-dem">Copy link</button></div><a class="button button-dark" href="'+esc(url)+'" target="_blank" rel="noopener">Open published DEM ↗</a><button class="button button-outline" id="pw-close-published">Back to workspace</button>';
   overlay.querySelector("#pw-copy-dem").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(url);statusNode.textContent="Link copied.";}catch(_){overlay.querySelector(".pw-published-link input").select();}});
   overlay.querySelector("#pw-close-published").addEventListener("click",()=>{document.removeEventListener("keydown",key);URL.revokeObjectURL(audio.src);overlay.remove();setStatus("Your DEM is published and submitted.");});
  }catch(error){
   if(path)await client.storage.from("indesign-dems").remove([path]).catch(()=>{});
   statusNode.textContent=error.message||"Could not publish the DEM. Check the database migration and storage policy.";
   button.disabled=false;button.textContent="Try publishing again";
  }
 });
 paint();
}

function renderList(){
 editor.hidden=true;list.hidden=false;$("pw-heading").textContent="Your projects";
 list.innerHTML=projects.length?projects.map(p=>'<article class="pw-project-card"><div><span class="pw-project-kind">MUSIC BRAINSTORM</span><h3>'+esc(p.name)+'</h3><small>Updated '+new Date(p.updated_at||p.created_at).toLocaleDateString()+'</small></div><button class="button button-outline" data-open="'+esc(p.id)+'">Open project ↗</button></article>').join(""):'<div class="pw-empty"><strong>No Music Brainstorms yet.</strong><p>Create your first project to start developing an idea.</p></div>';
}
async function createProject(){
 const name=$("pw-new-name")?.value.trim()||"";
 if(!name){$("pw-new-name")?.focus();return;}
 const content={mode:"music",music:{projectName:name,daw:"",bpm:"",key:"",contributors:"",sections:defaults()},comeback:{sections:[]}};
 const {data,error}=await client.from("indesign_projects").insert({owner_id:user.id,name,type:"brainstorm",description:"Producer Programme Music Brainstorm",content,producer_program_id:program.id}).select("id,owner_id,name,type,description,content,producer_program_id,created_at,updated_at").single();
 if(error){setStatus(error.message||"Could not create your project. Check that database steps 12 and 13 have been run.");return;}
 active=normalise(data);projects.unshift(active);renderEditor();
}
function renderCreateForm(){
 const existing=$("pw-create-form");if(existing){existing.remove();return;}
 const form=document.createElement("div");form.id="pw-create-form";form.className="pw-create-form";
 form.innerHTML='<label for="pw-new-name">Project name</label><input id="pw-new-name" maxlength="120" placeholder="e.g. Midnight Bloom" autocomplete="off"><div><button class="button button-dark" id="pw-confirm-create">Create Music Brainstorm</button><button class="button button-outline" id="pw-cancel-create">Cancel</button></div>';
 $("pw-project-list").prepend(form);$("pw-new-name").focus();
}
function renderEditor(){
 if(!active)return;normalise(active);list.hidden=true;editor.hidden=false;$("pw-heading").textContent=active.name;
 const m=active.content.music,sections=m.sections;lyrics=m.lyrics||null;
 editor.innerHTML='<div class="pw-editor-top"><button class="pw-back" id="pw-back">← All projects</button><div><span class="pw-project-kind">OFFICIAL PROGRAMME PROJECT</span><h2>'+esc(active.name)+'</h2></div><div class="pw-editor-actions"><button class="button button-outline" id="pw-import-prodem">Import .prodem</button><button class="button button-outline" id="pw-import-lyrdem">Import .lyrdem</button><button class="button button-dark" id="pw-publish-dem">Publish DEM</button><button class="button button-outline" id="pw-save">Save changes</button><input id="pw-prodem-file" type="file" accept=".prodem" hidden><input id="pw-lyrdem-file" type="file" accept=".lyrdem" hidden></div></div>'+
 '<div class="pw-meta"><label>Project title<input data-meta="projectName" value="'+esc(m.projectName||active.name)+'"></label><label>DAW<input data-meta="daw" value="'+esc(m.daw||'')+'" placeholder="e.g. Ableton Live"></label><label>BPM<input data-meta="bpm" value="'+esc(m.bpm||'')+'" inputmode="numeric" placeholder="e.g. 124"></label><label>Key<input data-meta="key" value="'+esc(m.key||'')+'" placeholder="e.g. F minor"></label><label class="pw-wide">Contributors<input data-meta="contributors" value="'+esc(m.contributors||'')+'" placeholder="Names or roles"></label></div>'+
 '<div class="pw-section-heading"><div><span class="eyebrow">IDEA BOARD</span><h3>Develop your sound.</h3></div><button class="button button-outline" id="pw-add-section">＋ Add section</button></div>'+
 sections.map((s,i)=>'<section class="pw-section" data-section="'+i+'"><header><input data-section-title="'+i+'" aria-label="Section title" value="'+esc(s.title)+'"><button class="pw-remove-section" data-remove-section="'+i+'" aria-label="Remove section">×</button></header><div class="pw-ideas">'+(s.items.length?s.items.map((item,j)=>'<article class="pw-idea"><textarea data-idea="'+i+':'+j+'" rows="2" aria-label="Idea">'+esc(item.text||"")+'</textarea><button data-remove-idea="'+i+':'+j+'" aria-label="Remove idea">×</button></article>').join(""):'<p class="pw-no-ideas">Add an idea, note or production direction.</p>')+'</div><div class="pw-add-idea"><input data-new-idea="'+i+'" placeholder="Write an idea…"><button class="button button-outline" data-add-idea="'+i+'">Add idea</button></div></section>').join("")+
 '<p class="pw-save-state" id="pw-save-state">Changes are saved when you select “Save changes”.</p>';
}
function collectEditor(){
 const m=active.content.music;
 document.querySelectorAll("[data-meta]").forEach(el=>m[el.dataset.meta]=el.value.trim());
 const sections=m.sections;
 document.querySelectorAll("[data-section-title]").forEach(el=>{const s=sections[Number(el.dataset.sectionTitle)];if(s)s.title=el.value.trim()||"Untitled section";});
 document.querySelectorAll("[data-idea]").forEach(el=>{const [si,ii]=el.dataset.idea.split(":").map(Number);if(sections[si]?.items[ii])sections[si].items[ii].text=el.value;});
}
async function save(){
 collectEditor();active.name=active.content.music.projectName||active.name;
 const {data,error}=await client.from("indesign_projects").update({name:active.name,content:active.content,updated_at:new Date().toISOString()}).eq("id",active.id).eq("owner_id",user.id).select().single();
 if(error){$("pw-save-state").textContent=error.message||"Could not save changes.";return;}
 active=normalise(data);projects=projects.map(p=>p.id===data.id?active:p);$("pw-save-state").textContent="Saved just now.";
}
document.addEventListener("click",async event=>{
 if(event.target.closest("#pw-create")){renderCreateForm();return;}
 if(event.target.closest("#pw-confirm-create")){await createProject();return;}
 if(event.target.closest("#pw-cancel-create")){$("pw-create-form")?.remove();return;}
 const open=event.target.closest("[data-open]");if(open){active=projects.find(p=>p.id===open.dataset.open);renderEditor();return;}
 if(event.target.closest("#pw-back")){collectEditor();await save();renderList();return;}
 if(event.target.closest("#pw-save")){await save();return;}
 if(event.target.closest("#pw-publish-dem")){openPublishDialog();return;}
 if(event.target.closest("#pw-import-prodem")){$("pw-prodem-file").click();return;}
 if(event.target.closest("#pw-import-lyrdem")){$("pw-lyrdem-file").click();return;}
 if(event.target.closest("#pw-add-section")){collectEditor();active.content.music.sections.push({id:"section-"+Date.now(),title:"New section",items:[]});renderEditor();return;}
 const add=event.target.closest("[data-add-idea]");if(add){collectEditor();const i=Number(add.dataset.addIdea),field=document.querySelector('[data-new-idea="'+i+'"]'),value=field?.value.trim();if(!value)return;active.content.music.sections[i].items.push({text:value});renderEditor();return;}
 const removeIdea=event.target.closest("[data-remove-idea]");if(removeIdea){collectEditor();const [i,j]=removeIdea.dataset.removeIdea.split(":").map(Number);active.content.music.sections[i]?.items.splice(j,1);renderEditor();return;}
 const removeSection=event.target.closest("[data-remove-section]");if(removeSection){collectEditor();active.content.music.sections.splice(Number(removeSection.dataset.removeSection),1);renderEditor();return;}
});
document.addEventListener("change",async event=>{
 if(event.target.id==="pw-prodem-file"&&event.target.files?.[0]){try{await importMusicPackage(event.target.files[0],"prodem");}catch(error){setStatus(error.message||"Could not import .prodem.");}}
 if(event.target.id==="pw-lyrdem-file"&&event.target.files?.[0]){try{await importMusicPackage(event.target.files[0],"lyrdem");}catch(error){setStatus(error.message||"Could not import .lyrdem.");}}
});
$("pw-create").addEventListener("click",()=>{if(!$("pw-create-form"))renderCreateForm();});
$("pw-project-list").addEventListener("keydown",event=>{if(event.key==="Enter"&&event.target.id==="pw-new-name"){event.preventDefault();createProject();}});
init().catch(error=>{console.error("Producer workspace:",error);setStatus(error.message||"Could not load the Music Brainstorm workspace.");});
})();